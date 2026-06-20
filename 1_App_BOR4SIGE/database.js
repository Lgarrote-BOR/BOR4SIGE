/**
 * database.js
 * Configuración del pool de conexiones para MariaDB utilizando mysql2/promise.
 * Incorpora un motor de simulación en memoria automático y transparente para entornos
 * de desarrollo/test donde MariaDB no esté activo, garantizando la resiliencia del SGI.
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const host = process.env.DB_HOST || '127.0.0.1';
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'bor4sige';
const port = parseInt(process.env.DB_PORT || '3306');

let useFallback = false;
let pool = null;
let connectionChecked = false;
let checkPromise = null;

// Estructuras en memoria para el Fallback
const mockDb = {
    usuarios: [],
    tenant_store: {}, // { tenant_id: { key_name: key_value } }
    auditorias: [],
    canal_de_denuncias: []
};

// Inicializar el Mock con semillas si no hay base de datos activa
function initMockDb() {
    console.log("⚡ Inicializando base de datos simulada en memoria (Fallback)...");
    
    // Sembrar usuarios
    const seedUsers = [
        { id: "bor", name: "Bor", email: "bor@bor4d.com", pass: "admin1234", role: "Superadministrador", department: "Dirección", tenant_id: "alfa", status: "Activo", is_superadmin: 1 },
        { id: "ana", name: "Ana Rodríguez Silva", email: "a.rodriguez@bor4d.com", pass: "ana1234", role: "Quality Manager", department: "Calidad ISO 9001", tenant_id: "alfa", status: "Activo", is_superadmin: 0 },
        { id: "carlos", name: "Carlos Gómez Pérez", email: "c.gomez@bor4d.com", pass: "carlos1234", role: "Auditor Interno", department: "Cumplimiento", tenant_id: "beta", status: "Activo", is_superadmin: 0 },
        { id: "laura", name: "Laura Martínez", email: "l.martinez@bor4d.com", role: "Especialista Medioambiental", department: "Medio Ambiente ISO 14001", tenant_id: "alfa", status: "Inactivo", is_superadmin: 0 }
    ];

    seedUsers.forEach(u => {
        mockDb.usuarios.push({
            id: u.id,
            email: u.email,
            password: bcrypt.hashSync(u.pass || 'admin1234', 10),
            name: u.name,
            role: u.role,
            department: u.department,
            tenant_id: u.tenant_id,
            status: u.status,
            is_superadmin: u.is_superadmin,
            must_change_password: 0
        });
    });

    // Cargar de db.json si existe para mantener el estado actual
    const dbJsonPath = path.join(__dirname, 'db.json');
    if (fs.existsSync(dbJsonPath)) {
        try {
            const dbData = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
            const globalKeys = [
                'sig_current_user',
                'sig_users',
                'sig_active_tenant',
                'sig_organizations',
                'sig_personal',
                'sig_ai_compliance_active',
                'sig_ai_compliance_logs',
                'sig_ai_actions_count',
                'sig_ai_last_check'
            ];
            const tenants = ['alfa', 'beta', 'omega', 'testorg', 'b4d', '1'];

            for (const [key, value] of Object.entries(dbData)) {
                let tenantId = 'global';
                let baseKey = key;

                for (const t of tenants) {
                    if (key.endsWith(`_${t}`)) {
                        tenantId = t;
                        baseKey = key.substring(0, key.lastIndexOf(`_${t}`));
                        break;
                    }
                }

                if (globalKeys.includes(key)) {
                    tenantId = 'global';
                    baseKey = key;
                }

                if (!mockDb.tenant_store[tenantId]) {
                    mockDb.tenant_store[tenantId] = {};
                }
                mockDb.tenant_store[tenantId][baseKey] = typeof value === 'string' ? value : JSON.stringify(value);

                // Población de Auditorías
                if (baseKey === 'sig_auditorias_data' || baseKey === 'sig_planificacion_auditoria') {
                    try {
                        const items = typeof value === 'string' ? JSON.parse(value) : value;
                        const list = Array.isArray(items) ? items : (items.auditorias || items.audits || []);
                        list.forEach(a => {
                            mockDb.auditorias.push({
                                id: a.id || a.code || `AUD-${Math.random().toString(36).substring(2,7).toUpperCase()}`,
                                tenant_id: tenantId === 'global' ? 'alfa' : tenantId,
                                process: a.process || a.proceso || 'Desconocido',
                                planned_date: a.date || a.fecha || a.scheduled || new Date().toISOString().split('T')[0],
                                status: a.status || a.estado || 'Planificada',
                                auditor: a.auditor || 'N/A'
                            });
                        });
                    } catch (e) {}
                }
            }
            console.log("✓ Datos migrados a la simulación en memoria.");
        } catch (e) {
            console.error("Error al cargar db.json para mock:", e.message);
        }
    }
}

try {
    pool = mysql.createPool({
        host,
        user,
        password,
        database,
        port,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0
    });
} catch (e) {
    console.warn("No se pudo instanciar el pool de MariaDB. Usando modo de simulación.");
    useFallback = true;
    initMockDb();
    connectionChecked = true;
}

// Función asíncrona para comprobar conexión antes de realizar la primera consulta
async function checkConnection() {
    if (connectionChecked) return;
    if (checkPromise) return checkPromise;

    checkPromise = (async () => {
        try {
            const conn = await pool.getConnection();
            conn.release();
            console.log("🟢 Conexión exitosa a MariaDB. Motor real activo.");
        } catch (err) {
            console.warn("⚠️ MariaDB fuera de línea. Activando fallback en memoria de forma transparente.");
            useFallback = true;
            initMockDb();
        }
        connectionChecked = true;
    })();
    return checkPromise;
}

// Helper para parsear Prepared Statements simulados.
// Las comparaciones se hacen sobre el SQL normalizado (sin saltos de línea ni dobles espacios).
function runMockQuery(sql, params) {
    const cleanedSql = sql.replace(/\s+/g, ' ').trim();

    // --- usuarios ---
    if (cleanedSql.includes('FROM usuarios WHERE email = ?')) {
        const email = params[0];
        const user = mockDb.usuarios.find(u => u.email === email);
        return user ? [user] : [];
    }
    if (cleanedSql.includes('FROM usuarios WHERE id = ?')) {
        const id = params[0];
        const user = mockDb.usuarios.find(u => u.id === id);
        return user ? [user] : [];
    }
    if (cleanedSql.startsWith('UPDATE usuarios SET password')) {
        // UPDATE usuarios SET password = ?, must_change_password = 0 WHERE id = ?
        const newPass = params[0];
        const id = params[params.length - 1];
        const user = mockDb.usuarios.find(u => u.id === id);
        if (user) {
            user.password = newPass;
            user.must_change_password = 0;
            return { affectedRows: 1 };
        }
        return { affectedRows: 0 };
    }

    // --- tenant_store (lectura): admite cualquier proyección de columnas ---
    if (cleanedSql.includes('FROM tenant_store') && cleanedSql.startsWith('SELECT')) {
        const tenantId = params[0];
        const includeGlobal = cleanedSql.toLowerCase().includes('global');
        const results = [];
        const pushTenant = (tid) => {
            if (mockDb.tenant_store[tid]) {
                for (const [k, v] of Object.entries(mockDb.tenant_store[tid])) {
                    results.push({ tenant_id: tid, key_name: k, key_value: v, updated_at: null });
                }
            }
        };
        pushTenant(tenantId);
        if (includeGlobal && tenantId !== 'global') pushTenant('global');
        return results;
    }

    // --- tenant_store (borrado) ---
    if (cleanedSql.startsWith('DELETE FROM tenant_store')) {
        const [tenantId, keyName] = params;
        if (mockDb.tenant_store[tenantId]) {
            delete mockDb.tenant_store[tenantId][keyName];
        }
        return { affectedRows: 1 };
    }

    // --- tenant_store (alta/actualización) ---
    if (cleanedSql.includes('INSERT INTO tenant_store') && cleanedSql.includes('ON DUPLICATE KEY UPDATE')) {
        const [tenantId, keyName, keyValue] = params;
        if (!mockDb.tenant_store[tenantId]) {
            mockDb.tenant_store[tenantId] = {};
        }
        mockDb.tenant_store[tenantId][keyName] = keyValue;
        return { affectedRows: 1 };
    }

    // --- auditorias ---
    if (cleanedSql.includes('FROM auditorias WHERE tenant_id = ?')) {
        const tenantId = params[0];
        return mockDb.auditorias.filter(a => a.tenant_id === tenantId);
    }

    // --- canal_de_denuncias (lectura) ---
    if (cleanedSql.includes('FROM canal_de_denuncias WHERE tenant_id = ?')) {
        const tenantId = params[0];
        return mockDb.canal_de_denuncias.filter(d => d.tenant_id === tenantId);
    }

    // --- canal_de_denuncias (alta) ---
    if (cleanedSql.includes('INSERT INTO canal_de_denuncias')) {
        const [id, tenant_id, date, cat, priority, desc_encrypted, proofs_encrypted, dept, responsible, anonymous, reporter_name, reporter_contact, status, notes, closed_date, track_code] = params;
        const newDenuncia = {
            id, tenant_id, date, cat, priority, desc_encrypted, proofs_encrypted, dept, responsible, anonymous, reporter_name, reporter_contact, status, notes, closed_date, track_code
        };
        mockDb.canal_de_denuncias.push(newDenuncia);
        return { affectedRows: 1 };
    }

    console.warn("⚠️ Consulta SQL no soportada por el simulador:", sql, params);
    return [];
}

module.exports = {
    pool,
    useFallback: () => useFallback,
    query: async (sql, params) => {
        await checkConnection();
        if (useFallback) {
            return runMockQuery(sql, params);
        }
        try {
            const [results] = await pool.query(sql, params);
            return results;
        } catch (error) {
            console.error("Error en query MariaDB:", error.message, "\nSQL:", sql, "\nParams:", params);
            throw error;
        }
    },
    execute: async (sql, params) => {
        await checkConnection();
        if (useFallback) {
            return runMockQuery(sql, params);
        }
        try {
            const [results] = await pool.execute(sql, params);
            return results;
        } catch (error) {
            console.error("Error en execute MariaDB:", error.message, "\nSQL:", sql, "\nParams:", params);
            throw error;
        }
    }
};
