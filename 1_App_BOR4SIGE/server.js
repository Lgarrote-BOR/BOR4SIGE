const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// Cargar .env manualmente si existe
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split(/\r?\n/).forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const parts = trimmed.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
                    process.env[key] = value;
                }
            }
        });
        console.log("Archivo .env cargado correctamente.");
    } catch (e) {
        console.error("Error al leer el archivo .env:", e);
    }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Inicializar conexión a MariaDB con mysql2/promise
const mysql = require('mysql2/promise');
const dbOps = require('./db_operations');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bor4sige',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Verificar conexión a base de datos MariaDB al inicio
pool.getConnection()
    .then(conn => {
        console.log("✅ Conexión establecida correctamente con MariaDB.");
        conn.release();
    })
    .catch(err => {
        console.error("❌ Error crítico conectando a MariaDB:", err);
    });

// Endpoints de la API
app.get('/api/store', async (req, res) => {
    try {
        const data = await dbOps.loadAllData(pool);
        res.json(data);
    } catch (err) {
        console.error("Error al obtener los datos de MariaDB:", err);
        res.status(500).json({ error: "Error interno al recuperar los datos del SGI." });
    }
});

app.post('/api/store', async (req, res) => {
    const { key, value } = req.body;
    if (!key) {
        return res.status(400).json({ error: "Falta la clave 'key'." });
    }

    try {
        await dbOps.saveDataKey(pool, key, value);
        res.json({ success: true });
    } catch (err) {
        console.error(`Error al guardar clave '${key}' en MariaDB:`, err);
        res.status(500).json({ error: `Error al guardar los datos para la clave '${key}'.` });
    }
});

// Proxy para interactuar con Google Gemini API
app.post('/api/chat', (req, res) => {
    const { prompt, systemPrompt } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(400).json({ 
            error: "Clave de API de Gemini (GEMINI_API_KEY) no configurada.", 
            details: "Por favor, crea un archivo .env en la carpeta de la aplicación con la línea: GEMINI_API_KEY=tu_clave_api" 
        });
    }

    const https = require('https');

    const postData = JSON.stringify({
        contents: [
            {
                parts: [
                    {
                        text: prompt
                    }
                ]
            }
        ],
        systemInstruction: {
            parts: [
                {
                    text: systemPrompt || "Eres un asistente virtual experto en Bor4SIGE y normas ISO."
                }
            ]
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
        }
    };

    const request = https.request(options, (response) => {
        let data = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
            data += chunk;
        });
        response.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content && parsed.candidates[0].content.parts[0]) {
                    const text = parsed.candidates[0].content.parts[0].text;
                    res.json({ text: text });
                } else if (parsed.error) {
                    res.status(500).json({ error: "Error devuelto por la API de Gemini", details: parsed.error.message });
                } else {
                    res.status(500).json({ error: "Respuesta inesperada de la API de Gemini", details: data });
                }
            } catch (err) {
                res.status(500).json({ error: "Error al parsear respuesta de Gemini", details: data });
            }
        });
    });

    request.on('error', (err) => {
        res.status(502).json({ error: "Error de red al conectar con la API de Gemini", details: err.message });
    });

    request.write(postData);
    request.end();
});

// Servir la plataforma web de forma estática
app.use(express.static(__dirname));

// Enrutador de respaldo para SPA (opcional, redirige a index.html)
app.get('*', (req, res, next) => {
    // Si la ruta contiene un punto (es un archivo estático no encontrado), pasar al sig middleware
    if (req.path.includes('.')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 Bor4SIGE Webapp activa y lista.`);
    console.log(`   Desplegada localmente en: http://localhost:${PORT}`);
    console.log(`===================================================`);
});
