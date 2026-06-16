const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Inicializar la base de datos JSON si no existe
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2), 'utf8');
}

// Cargar base de datos en memoria para rapidez
let dbCache = {};
try {
    const fileContent = fs.readFileSync(DB_FILE, 'utf8');
    dbCache = JSON.parse(fileContent || '{}');
} catch (err) {
    console.error("Error al cargar db.json, inicializando base de datos vacía:", err);
    dbCache = {};
}

// Escritura atómica para evitar corrupción de base de datos
function saveDb() {
    try {
        const tempPath = DB_FILE + '.tmp';
        fs.writeFileSync(tempPath, JSON.stringify(dbCache, null, 2), 'utf8');
        fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
        console.error("Error crítico guardando en db.json:", err);
    }
}

// Endpoints de la API
app.get('/api/store', (req, res) => {
    res.json(dbCache);
});

app.post('/api/store', (req, res) => {
    const { key, value } = req.body;
    if (!key) {
        return res.status(400).json({ error: "Falta la clave 'key'." });
    }

    if (value === null) {
        delete dbCache[key];
    } else {
        dbCache[key] = value;
    }

    saveDb();
    res.json({ success: true });
});

// Proxy para interactuar con Ollama local
app.post('/api/chat', (req, res) => {
    const { prompt, systemPrompt, model } = req.body;
    const http = require('http');

    const postData = JSON.stringify({
        model: model || 'llama3',
        prompt: prompt,
        system: systemPrompt || "Eres un asistente virtual experto en Bor4SIGE y normas ISO.",
        stream: false
    });

    const options = {
        hostname: 'localhost',
        port: 11434,
        path: '/api/generate',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const request = http.request(options, (response) => {
        let data = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
            data += chunk;
        });
        response.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                res.json({ text: parsed.response });
            } catch (err) {
                res.status(500).json({ error: "Error al parsear respuesta de Ollama", details: data });
            }
        });
    });

    request.on('error', (err) => {
        res.status(502).json({ error: "Ollama no disponible en localhost:11434", details: err.message });
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
