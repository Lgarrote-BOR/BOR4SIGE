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
    console.log(`🚀 SGI 2.0 Webapp activa y lista.`);
    console.log(`   Desplegada localmente en: http://localhost:${PORT}`);
    console.log(`===================================================`);
});
