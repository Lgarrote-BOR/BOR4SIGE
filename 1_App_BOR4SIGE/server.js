// Cargar variables de entorno desde .env (dotenv)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Detrás de un proxy inverso (nginx/PM2) para que el rate-limiting vea la IP real.
app.set('trust proxy', 1);

// --- Orígenes CORS permitidos ---
const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

// --- Cabeceras de seguridad (Helmet) ---
// CSP compatible con el CDN de Tailwind, Google Fonts y el embebido en iframe (WordPress).
// El embebido cross-origin requiere declarar el origen en CORS_ORIGINS (frame-ancestors).
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'self'"],
            frameAncestors: ["'self'", ...corsOrigins]
        }
    },
    // Se usa frame-ancestors (CSP) en lugar de X-Frame-Options para permitir el embebido configurado.
    frameguard: false,
    crossOriginEmbedderPolicy: false
}));

// --- CORS ---
app.use(cors({
    origin: corsOrigins.length ? corsOrigins : false, // sin orígenes configurados: solo mismo origen
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// --- Limitadores de tasa ---
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,                       // 20 intentos de login / 15 min / IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Demasiados intentos de inicio de sesión. Inténtelo de nuevo más tarde." }
});

const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,                       // 15 consultas IA / min / IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Demasiadas consultas a la IA. Espere un momento e inténtelo de nuevo." }
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,                      // límite general de API
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', apiLimiter);

// Módulos: base de datos clave-valor (con fallback), capa relacional, auth y cifrado.
const db = require('./database');
const dbOps = require('./db_operations');   // capa relacional normalizada + paginación
const auth = require('./auth');
const encryption = require('./encryption');

// --- Política de claves del almacén multi-tenant ---
// Claves globales sensibles: solo escribibles por superadministrador.
const PRIVILEGED_GLOBAL_KEYS = ['sig_users', 'sig_organizations', 'sig_personal'];
// Claves de estado por sesión/cliente: NO se persisten en el servidor (evita que los
// usuarios se pisen entre sí). El cliente las gestiona en su propio estado local.
const CLIENT_ONLY_KEYS = ['sig_current_user', 'sig_active_tenant'];
// Claves globales operativas (contadores/logs del agente IA): escribibles por cualquier usuario.
const GLOBAL_OPERATIONAL_KEYS = ['sig_ai_compliance_active', 'sig_ai_compliance_logs', 'sig_ai_actions_count', 'sig_ai_last_check'];

const GLOBAL_KEYS = [...PRIVILEGED_GLOBAL_KEYS, ...GLOBAL_OPERATIONAL_KEYS];

// Conjunto de tenants conocidos (se rellena al leer organizaciones) para el aislamiento.
const knownTenants = new Set();
// Tras un fallo de la capa relacional, se conmuta al almacén clave-valor (con simulador).
let preferRelational = true;

function noteFallback(err) {
    if (preferRelational) {
        console.warn("⚠️ Capa relacional no disponible; usando almacén clave-valor:", err && (err.code || err.message));
    }
    preferRelational = false;
}

// Extrae el sufijo de tenant de una clave, si corresponde a un tenant conocido.
function tenantOfKey(key) {
    const m = key.match(/_([a-zA-Z0-9]+)$/);
    if (m && knownTenants.has(m[1])) return m[1];
    return null;
}

// Filtra el cache global (todos los tenants) dejando solo lo del tenant + claves globales.
function filterCacheByTenant(fullCache, tenantId) {
    // Refrescar tenants conocidos a partir de las organizaciones cargadas.
    try {
        const orgs = fullCache['sig_organizations'];
        if (orgs) {
            const parsed = typeof orgs === 'string' ? JSON.parse(orgs) : orgs;
            Object.keys(parsed || {}).forEach(t => knownTenants.add(t));
        }
    } catch (e) { /* ignorar */ }
    knownTenants.add(tenantId);

    const out = {};
    for (const [k, v] of Object.entries(fullCache)) {
        const kt = tenantOfKey(k);
        if (kt === null) {
            out[k] = v;            // clave global / sin sufijo de tenant conocido
        } else if (kt === tenantId) {
            out[k] = v;            // clave del tenant solicitante
        }
        // resto: pertenece a otro tenant -> excluido
    }
    return out;
}

// --- Almacén clave-valor (fallback con simulador en memoria) ---
async function kvLoad(tenantId) {
    const rows = await db.query(
        'SELECT tenant_id, key_name, key_value, updated_at FROM tenant_store WHERE tenant_id = ? OR tenant_id = "global"',
        [tenantId]
    );
    const dbCache = {};
    rows.forEach(row => {
        if (row.tenant_id === 'global') dbCache[row.key_name] = row.key_value;
        else dbCache[`${row.key_name}_${row.tenant_id}`] = row.key_value;
    });
    return dbCache;
}

async function kvSave(tenantId, key, value) {
    let targetTenant = tenantId;
    let baseKey = key;
    if (GLOBAL_KEYS.includes(key)) {
        targetTenant = 'global';
    } else if (key.endsWith(`_${tenantId}`)) {
        baseKey = key.substring(0, key.lastIndexOf(`_${tenantId}`));
    }
    if (value === null) {
        await db.execute('DELETE FROM tenant_store WHERE tenant_id = ? AND key_name = ?', [targetTenant, baseKey]);
    } else {
        const valStr = typeof value === 'string' ? value : JSON.stringify(value);
        await db.execute(
            'INSERT INTO tenant_store (tenant_id, key_name, key_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE key_value = VALUES(key_value)',
            [targetTenant, baseKey, valStr]
        );
    }
}

// --- Endpoints de Autenticación ---
app.post('/api/auth/login', loginLimiter, auth.login);
app.get('/api/auth/me', auth.enforceTenant, auth.me);
app.post('/api/auth/change-password', auth.enforceTenant, auth.changePassword);

// --- Almacén de Datos Multi-Tenant (relacional con fallback clave-valor) ---

// GET /api/store: estado de la organización del usuario autenticado + claves globales.
app.get('/api/store', auth.enforceTenant, async (req, res) => {
    const tenantId = req.tenant_id;
    if (preferRelational) {
        try {
            const fullCache = await dbOps.loadAllData(db.pool);
            return res.json(filterCacheByTenant(fullCache, tenantId));
        } catch (relErr) {
            noteFallback(relErr);
        }
    }
    try {
        res.json(await kvLoad(tenantId));
    } catch (err) {
        console.error("Error en GET /api/store:", err);
        res.status(500).json({ error: "Error en el servidor al cargar datos del tenant." });
    }
});

// POST /api/store: guarda una clave-valor con control de acceso y aislamiento de tenant.
app.post('/api/store', auth.enforceTenant, async (req, res) => {
    const { key, value } = req.body;
    if (!key) {
        return res.status(400).json({ error: "Falta la clave 'key'." });
    }

    // Estado por sesión: no se persiste (lo gestiona el cliente).
    if (CLIENT_ONLY_KEYS.includes(key)) {
        return res.json({ success: true, skipped: "client-only" });
    }

    // Claves globales sensibles: solo superadministrador.
    if (PRIVILEGED_GLOBAL_KEYS.includes(key) && !req.is_superadmin) {
        return res.status(403).json({ error: "Solo un superadministrador puede modificar esta configuración global." });
    }

    // Aislamiento de escritura: un usuario no superadmin solo puede escribir claves
    // globales conocidas o claves sufijadas con SU propio tenant. Cualquier otra clave
    // (sufijada con otro tenant, o sin sufijo y no global) se rechaza.
    if (!req.is_superadmin) {
        const isGlobal = GLOBAL_KEYS.includes(key);
        const isOwnTenant = key.endsWith(`_${req.tenant_id}`);
        if (!isGlobal && !isOwnTenant) {
            return res.status(403).json({ error: "No autorizado a escribir datos fuera de su organización." });
        }
    }

    if (preferRelational) {
        try {
            await dbOps.saveDataKey(db.pool, key, value);
            return res.json({ success: true });
        } catch (relErr) {
            noteFallback(relErr);
        }
    }
    try {
        await kvSave(req.tenant_id, key, value);
        res.json({ success: true });
    } catch (err) {
        console.error("Error en POST /api/store:", err);
        res.status(500).json({ error: "Error en el servidor al guardar datos del tenant." });
    }
});

// GET /api/store/paginated: carga paginada de un conjunto grande (capa relacional).
app.get('/api/store/paginated', auth.enforceTenant, async (req, res) => {
    const { key, page, limit } = req.query;
    if (!key) {
        return res.status(400).json({ error: "Falta el parámetro 'key'." });
    }
    // El tenant lo fija el servidor (no el cliente) salvo conmutación de superadmin ya resuelta.
    const tenantId = req.tenant_id;
    try {
        const result = await dbOps.loadPaginatedData(db.pool, key, tenantId, parseInt(page) || 1, parseInt(limit) || 50);
        res.json(result);
    } catch (err) {
        console.error(`Error en GET /api/store/paginated (${key}):`, err && (err.code || err.message));
        res.status(503).json({ error: "Paginación no disponible (requiere MariaDB activa)." });
    }
});

// --- Auditorías (Row-Level Security con Prepared Statements) ---
app.get('/api/auditorias', auth.enforceTenant, async (req, res) => {
    try {
        const rows = await db.query('SELECT * FROM auditorias WHERE tenant_id = ?', [req.tenant_id]);
        res.json(rows);
    } catch (err) {
        console.error("Error en GET /api/auditorias:", err);
        res.status(500).json({ error: "Error al consultar auditorías en MariaDB." });
    }
});

// --- Canal de Denuncias (Cifrado E2E AES-256-GCM) ---
app.post('/api/canal_de_denuncias', auth.enforceTenant, async (req, res) => {
    try {
        const tenantId = req.tenant_id;
        const {
            id, date, cat, priority, desc, proofs, dept,
            responsible, anonymous, reporterName, reporterContact,
            status, notes, closedDate, trackCode
        } = req.body;

        if (!id || !cat || !priority) {
            return res.status(400).json({ error: "Campos identificador, categoría y prioridad requeridos." });
        }

        const descEncrypted = encryption.encrypt(desc || '');
        const proofsEncrypted = encryption.encrypt(proofs || '');

        await db.execute(
            `INSERT INTO canal_de_denuncias
             (id, tenant_id, date, cat, priority, desc_encrypted, proofs_encrypted, dept,
              responsible, anonymous, reporter_name, reporter_contact, status, notes, closed_date, track_code)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, tenantId, date || new Date().toISOString(), cat, priority,
                descEncrypted, proofsEncrypted, dept || '', responsible || '',
                anonymous !== false, reporterName || '', reporterContact || '',
                status || 'Nueva', notes || '', closedDate || null, trackCode || ''
            ]
        );

        res.json({ success: true, message: "Denuncia encriptada E2E y guardada de forma segura en MariaDB." });
    } catch (err) {
        console.error("Error en POST /api/canal_de_denuncias:", err);
        res.status(500).json({ error: "Error interno al procesar denuncia." });
    }
});

app.get('/api/canal_de_denuncias', auth.enforceTenant, async (req, res) => {
    try {
        const tenantId = req.tenant_id;
        const complianceKey = req.headers['x-compliance-key'] || null;

        const rows = await db.query('SELECT * FROM canal_de_denuncias WHERE tenant_id = ?', [tenantId]);

        const decryptedRows = rows.map(row => ({
            id: row.id,
            date: row.date,
            cat: row.cat,
            priority: row.priority,
            desc: encryption.decrypt(row.desc_encrypted, complianceKey),
            proofs: encryption.decrypt(row.proofs_encrypted, complianceKey),
            dept: row.dept,
            responsible: row.responsible,
            anonymous: !!row.anonymous,
            reporterName: row.reporter_name,
            reporterContact: row.reporter_contact,
            status: row.status,
            notes: row.notes,
            closedDate: row.closed_date,
            trackCode: row.track_code
        }));

        res.json(decryptedRows);
    } catch (err) {
        console.error("Error en GET /api/canal_de_denuncias:", err);
        res.status(500).json({ error: "Error al recuperar denuncias." });
    }
});

// --- Proxy de IA (Gemini API) — autenticado y con límite de uso ---
app.post('/api/chat', auth.enforceTenant, chatLimiter, (req, res) => {
    const { prompt, systemPrompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: "El campo 'prompt' es obligatorio." });
    }
    if (prompt.length > 8000) {
        return res.status(413).json({ error: "La consulta es demasiado larga (máx. 8000 caracteres)." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(400).json({
            error: "Clave de API de Gemini (GEMINI_API_KEY) no configurada.",
            details: "Por favor, configure GEMINI_API_KEY en su archivo .env"
        });
    }

    const https = require('https');

    const postData = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: {
            parts: [{ text: (systemPrompt || "Eres un asistente virtual experto en Bor4SIGE y normas ISO.").slice(0, 12000) }]
        }
    });

    const options = {
        hostname: 'generativelanguage.googleapis.com',
        port: 443,
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 30000
    };

    const request = https.request(options, (response) => {
        let data = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content && parsed.candidates[0].content.parts[0]) {
                    res.json({ text: parsed.candidates[0].content.parts[0].text });
                } else if (parsed.error) {
                    res.status(502).json({ error: "Error de Gemini API", details: parsed.error.message });
                } else {
                    res.status(502).json({ error: "Respuesta inesperada de Gemini API" });
                }
            } catch (err) {
                res.status(502).json({ error: "Error de análisis de respuesta de la IA" });
            }
        });
    });

    request.on('timeout', () => { request.destroy(new Error('timeout')); });
    request.on('error', (err) => {
        res.status(502).json({ error: "Error de red conectando con Gemini API", details: err.message });
    });

    request.write(postData);
    request.end();
});

// Devolver 404 JSON para rutas /api desconocidas (en vez de servir el index).
app.use('/api', (req, res) => res.status(404).json({ error: "Endpoint no encontrado." }));

// Servir la plataforma web de forma estática
app.use(express.static(__dirname));

// Enrutador de respaldo para SPA (redirige a index.html)
app.get('*', (req, res, next) => {
    if (req.path.includes('.')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 Bor4SIGE Backend Multi-Tenant activo.`);
    console.log(`   Entorno: ${IS_PROD ? 'PRODUCCIÓN' : 'desarrollo'}`);
    console.log(`   Almacén: relacional (db_operations) con fallback clave-valor`);
    console.log(`   CORS: ${corsOrigins.length ? corsOrigins.join(', ') : 'solo mismo origen'}`);
    console.log(`   Desplegado localmente en: http://localhost:${PORT}`);
    console.log(`===================================================`);
});
