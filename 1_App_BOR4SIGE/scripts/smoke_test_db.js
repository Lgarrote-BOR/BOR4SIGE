/**
 * scripts/smoke_test_db.js
 *
 * Bor4SIGE - Smoke test del esquema de base de datos (Fase 3.1).
 *
 * Recorre los 4 scripts canonicos en orden sobre un MariaDB limpio
 * y valida que el modelo E-R final sea coherente:
 *   - 18 tablas lookup (lkp_*) con INT UNSIGNED PK
 *   - 25 tablas maestras con PK CHAR(36) (UUID)
 *   - FKs hacia lkp_* con SET NULL
 *   - FKs hacia organizations con CASCADE
 *   - Coexistencia controlada del esquema legacy KV
 *
 * Uso (desde 1_App_BOR4SIGE/):
 *   node scripts/smoke_test_db.js
 *
 * Variables de entorno que respeta:
 *   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 *   (Por defecto: 127.0.0.1:3306, root/empty, bor4sige)
 *
 * Exit codes:
 *   0 - Todas las fases en verde
 *   1 - Alguna fase o validacion fallo
 *   2 - MariaDB no respondio tras los reintentos
 */
'use strict';

const mysql = require('mysql2/promise');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// -------------------------------------------------------------------------
// Configuracion del entorno (coincide con los defaults hardcodeados en
// migrate_to_uuid_kv.js para que el smoke test sea determinista).
// -------------------------------------------------------------------------
const CFG = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bor4sige',
};

const ROOT = path.resolve(__dirname, '..');                  // 1_App_BOR4SIGE
const SQL_PATH = path.resolve(ROOT, '..', 'setup_kv_schema.sql'); // raiz del repo

// -------------------------------------------------------------------------
// Utilidades de presentacion.
// -------------------------------------------------------------------------
const ICON = { pass: '[PASS]', fail: '[FAIL]', info: '[INFO]', warn: '[WARN]' };
const TICK = '[OK]';
const CROSS = '[X]';

function log(icon, msg) {
    const colorOn = process.stdout.isTTY ? true : false;
    // Mantener ASCII puro: usamos prefijos en lugar de emojis.
    console.log(icon + ' ' + msg);
}

// -------------------------------------------------------------------------
// 0. Esperar a que MariaDB este lista.
// -------------------------------------------------------------------------
async function waitForMariaDB(maxRetries = 60, intervalMs = 1000) {
    log(ICON.info, 'Esperando a MariaDB en ' + CFG.host + ':' + CFG.port + ' ...');
    for (let i = 0; i < maxRetries; i++) {
        try {
            const conn = await mysql.createConnection({
                host: CFG.host, port: CFG.port, user: CFG.user, password: CFG.password,
                connectTimeout: 2000,
            });
            await conn.query('SELECT 1 AS ok');
            await conn.end();
            log(ICON.info, 'MariaDB respondio tras ' + (i + 1) + ' intento(s).');
            return;
        } catch (e) {
            if (i === 0 || (i + 1) % 5 === 0) {
                log(ICON.info, '  intento ' + (i + 1) + '/' + maxRetries + ' ...');
            }
            await new Promise((r) => setTimeout(r, intervalMs));
        }
    }
    throw new Error('MariaDB no respondio tras ' + maxRetries + ' intentos.');
}

// -------------------------------------------------------------------------
// 1. Conexion y helpers de introspection.
// -------------------------------------------------------------------------
async function getConn() {
    return mysql.createConnection({ ...CFG, multipleStatements: true });
}

async function listTables(conn, schema) {
    const [rows] = await conn.query(
        'SELECT TABLE_NAME FROM information_schema.TABLES ' +
        'WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME', [schema]);
    return rows.map((r) => r.TABLE_NAME);
}

async function tableExists(conn, schema, name) {
    const [rows] = await conn.query(
        'SELECT COUNT(*) AS c FROM information_schema.TABLES ' +
        'WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?', [schema, name]);
    return rows[0].c > 0;
}

async function getColumn(conn, schema, table, column) {
    const [rows] = await conn.query(
        'SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, COLUMN_TYPE ' +
        'FROM information_schema.COLUMNS ' +
        'WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
        [schema, table, column]);
    return rows[0];
}

async function getPKColumns(conn, schema, table) {
    const [rows] = await conn.query(
        'SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, COLUMN_TYPE ' +
        'FROM information_schema.COLUMNS ' +
        'WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_KEY = ?',
        [schema, table, 'PRI']);
    return rows;
}

async function getForeignKeys(conn, schema, table) {
    const [rows] = await conn.query(
        'SELECT kcu.COLUMN_NAME, kcu.REFERENCED_TABLE_NAME, ' +
        '       kcu.REFERENCED_COLUMN_NAME, rc.DELETE_RULE, rc.UPDATE_RULE ' +
        'FROM information_schema.KEY_COLUMN_USAGE kcu ' +
        'INNER JOIN information_schema.REFERENTIAL_CONSTRAINTS rc ' +
        '  ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME ' +
        '  AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA ' +
        'WHERE kcu.TABLE_SCHEMA = ? AND kcu.TABLE_NAME = ?',
        [schema, table]);
    return rows;
}

async function countRows(conn, schema, table) {
    const [rows] = await conn.query(
        'SELECT COUNT(*) AS c FROM `' + schema + '`.`' + table + '`');
    return rows[0].c;
}

// -------------------------------------------------------------------------
// 2. Backup y restauracion de 1_App_BOR4SIGE/db.json.
// -------------------------------------------------------------------------
const DBJSON = path.join(ROOT, 'db.json');
const DBJSON_BAK = path.join(ROOT, 'db.json.smoketest-backup');

function backupDbJson() {
    if (fs.existsSync(DBJSON)) {
        fs.renameSync(DBJSON, DBJSON_BAK);
        log(ICON.info, 'db.json resguardado como db.json.smoketest-backup.');
    }
}
function restoreDbJson() {
    if (fs.existsSync(DBJSON_BAK)) {
        if (fs.existsSync(DBJSON)) fs.unlinkSync(DBJSON);
        fs.renameSync(DBJSON_BAK, DBJSON);
        log(ICON.info, 'db.json restaurado.');
    }
    // El setup_db.js pudo haber creado db.json.bak: lo limpiamos si quedo huerfano.
    const bak = path.join(ROOT, 'db.json.bak');
    if (fs.existsSync(bak)) {
        try {
            // Solo lo borramos si NO existia antes del test (lo denota la marca).
            const stamp = path.join(ROOT, '.smoketest_owns_dbjson_bak');
            if (fs.existsSync(stamp)) {
                fs.unlinkSync(bak);
                fs.unlinkSync(stamp);
                log(ICON.info, 'db.json.bak (smoke) eliminado.');
            }
        } catch (e) { /* nothing */ }
    }
}
// Marca para saber si setup_db renombro db.json durante el test.
function markDbJsonOriginatedFromSmoke() {
    try { fs.writeFileSync(path.join(ROOT, '.smoketest_owns_dbjson_bak'), '1'); }
    catch (e) { /* nothing */ }
}

// -------------------------------------------------------------------------
// 3. Reset de base de datos.
// -------------------------------------------------------------------------
async function dropAndCreateDb(conn) {
    await conn.query('DROP DATABASE IF EXISTS `' + CFG.database + '`');
    await conn.query(
        'CREATE DATABASE `' + CFG.database + '` ' +
        'CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    // Re-seleccionar la base en esta conexion: DROP DATABASE deja a la
    // sesion sin default db; CREATE no la selecciona por si sola. Si no
    // lo re-seleccionamos, las siguientes consultas hijas pueden lanzar
    // "No database selected" segun el driver/modo.
    await conn.query('USE `' + CFG.database + '`');
}

async function ensureDbSelected(conn) {
    // Garantiza que la sesion tenga bor4sige seleccionada, sin re-emitir
    // USE si ya lo esta. Usado al inicio del main() tras waitForMariaDB.
    const [rows] = await conn.query('SELECT DATABASE() AS db');
    if (!rows[0] || rows[0].db !== CFG.database) {
        await conn.query('USE `' + CFG.database + '`');
    }
}

// -------------------------------------------------------------------------
// 4. Ejecucion de un script (child_process).
// -------------------------------------------------------------------------
function runNodeScript(scriptRelPath, envOverrides, timeoutSec = 90) {
    const scriptPath = path.join(ROOT, scriptRelPath);
    const env = {
        ...process.env,
        DB_HOST: CFG.host,
        DB_PORT: String(CFG.port),
        DB_USER: CFG.user,
        DB_PASSWORD: CFG.password,
        DB_NAME: CFG.database,
        NODE_ENV: 'development',
        SEED_DEMO: 'true',
        ...envOverrides,
    };
    log(ICON.info, 'Lanzando: node ' + scriptRelPath + ' ...');
    const started = Date.now();
    const result = spawnSync(process.execPath, [scriptPath], {
        cwd: ROOT, env, encoding: 'utf8', timeout: timeoutSec * 1000,
    });
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    if (result.stdout) console.log('--- stdout (ultimas 30 lineas) ---');
    if (result.stdout) {
        const lines = result.stdout.split(/\r?\n/);
        const tail = lines.slice(-30).join('\n');
        console.log(tail);
    }
    if (result.stderr) console.log('--- stderr ---');
    if (result.stderr) console.log(result.stderr);
    log(ICON.info, 'Salida tras ' + elapsed + 's, exit=' + result.status);
    return {
        ok: result.status === 0,
        elapsed,
        status: result.status,
        signal: result.signal,
        timedOut: result.signal === 'SIGTERM',
    };
}

// -------------------------------------------------------------------------
// 5. Scripts y validaciones de cada fase.
// -------------------------------------------------------------------------

// Fase 1: setup_db.js
//   Resultado esperado: tablas legacy (usuarios, tenant_store, auditorias,
//   canal_de_denuncias), 4 usuarios demo sembrados.
//   Los nombres exactos viven en expected_manifest.json (claves
//   phase1RequiredTables, phase1DemoUserIds) como fuente unica de verdad.

async function checkPhase1(conn) {
    const reasons = [];
    const tables = await listTables(conn, CFG.database);
    for (const t of PHASE1_REQUIRED_TABLES) {
        if (!tables.includes(t)) reasons.push('Falta tabla legacy: ' + t);
    }
    if (tables.length < PHASE1_REQUIRED_TABLES.length) {
        reasons.push('Numero de tablas (' + tables.length + ') menor que el minimo esperado (' +
            PHASE1_REQUIRED_TABLES.length + ').');
    }
    const [users] = await conn.query('SELECT id FROM usuarios');
    const count = (users || []).length;
    if (count < PHASE1_DEMO_USER_IDS.length) {
        reasons.push('Solo ' + count + ' usuarios demo (esperado al menos ' +
            PHASE1_DEMO_USER_IDS.length + ').');
    } else {
        const ids = (users || []).map((u) => u.id);
        for (const id of PHASE1_DEMO_USER_IDS) {
            if (!ids.includes(id)) reasons.push('Falta usuario demo: ' + id);
        }
    }
    // Verificar columnas clave de usuarios
    const emailCol = await getColumn(conn, CFG.database, 'usuarios', 'email');
    if (!emailCol) reasons.push('Falta columna usuarios.email');
    return { pass: reasons.length === 0, reasons, tableCount: tables.length };
}

// Fase 2: db_migration.js (se ejecuta ENCIMA del estado de la Fase 1)
//   Resultado esperado: ~26 tablas nuevas descritas en
//   tests/fixtures/expected_manifest.json (clave phase2RequiredTables).

async function checkPhase2(conn) {
    const reasons = [];
    const tables = await listTables(conn, CFG.database);
    if (tables.length < PHASE2_MIN_TOTAL_TABLES) {
        reasons.push('Tablas totales (' + tables.length + ') < ' +
            PHASE2_MIN_TOTAL_TABLES + ' esperadas (legacy + relacional).');
    }
    for (const t of PHASE2_REQUIRED_TABLES) {
        if (!tables.includes(t)) reasons.push('Falta tabla relacional: ' + t);
    }
    // FK users.tenant_id -> organizations.id
    const userFKs = await getForeignKeys(conn, CFG.database, 'users');
    const userTenantFk = userFKs.find((f) => f.COLUMN_NAME === 'tenant_id');
    if (!userTenantFk) reasons.push('users.tenant_id sin FK.');
    else if (userTenantFk.REFERENCED_TABLE_NAME !== 'organizations') {
        reasons.push('users.tenant_id -> ' + userTenantFk.REFERENCED_TABLE_NAME + ' (esperado organizations).');
    }
    // FK documents.tenant_id -> organizations.id CASCADE
    const docFKs = await getForeignKeys(conn, CFG.database, 'documents');
    const docTenantFk = docFKs.find((f) => f.COLUMN_NAME === 'tenant_id');
    if (!docTenantFk) reasons.push('documents.tenant_id sin FK.');
    else if (docTenantFk.DELETE_RULE !== 'CASCADE') {
        reasons.push('documents.tenant_id DELETE_RULE=' + docTenantFk.DELETE_RULE + ' (esperado CASCADE).');
    }
    return { pass: reasons.length === 0, reasons, tableCount: tables.length };
}

// Fase 3: migrate_to_uuid_kv.js
//   Resultado esperado: 18 tablas lookup + 25 tablas maestras con PK CHAR(36).
//   El manifiesto (lookups + master + multitenant) se carga desde
//   tests/fixtures/expected_manifest.json como fuente de verdad.
//   Ademas, deriveTablesFromMigrationScript() parsea migrate_to_uuid_kv.js
//   con regex y lo cruza contra el JSON: si divergen, falla el test
//   (senalando que alguien no actualizo el manifiesto al tocar la migracion).
// -------------------------------------------------------------------------
function loadExpectedManifest() {
    const manifestPath = path.join(ROOT, 'tests', 'fixtures', 'expected_manifest.json');
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function deriveTablesFromMigrationScript() {
    const sql = fs.readFileSync(path.join(ROOT, 'migrate_to_uuid_kv.js'), 'utf8');
    // (a) Lookups: keys del objeto literal `const lookups = { ... new Set() ... }`.
    const lookupsMatch = sql.match(/const\s+lookups\s*=\s*\{([\s\S]*?)\n\s*\};/);
    const lookupTables = [];
    if (lookupsMatch) {
        const keyRe = /^\s*([a-z][a-z0-9_]*)\s*:\s*new\s+Set\s*\(/gm;
        let m;
        while ((m = keyRe.exec(lookupsMatch[1])) !== null) {
            lookupTables.push('lkp_' + m[1]);
        }
    }
    // (b) Master tables: identificadores crudos `CREATE TABLE name (` dentro
    // de DDL_MASTER_TABLES (sin backticks rodeando los nombres).
    // Exigir backtick de cierre seguido de `;` para evitar que el non-greedy
    // match corte prematuramente ante backticks internos usados como
    // delimitadores de identificadores SQL (p.ej. `desc`, `key`, etc.).
    const ddlMatch = sql.match(/DDL_MASTER_TABLES\s*=\s*`([\s\S]*?)`;/);
    const masterTables = [];
    if (ddlMatch) {
        const masterRe = /CREATE TABLE\s+(\w+)/g;
        let m;
        while ((m = masterRe.exec(ddlMatch[1])) !== null) {
            const name = m[1];
            if (name.toLowerCase() === 'table') continue;
            if (!name.startsWith('lkp_')) masterTables.push(name);
        }
    }
    return {
        lookupTables: lookupTables.sort(),
        masterTables: masterTables.sort(),
    };
}

const EXPECTED = loadExpectedManifest();
const DERIVED = deriveTablesFromMigrationScript();
// Todas las constantes de cada fase provienen del manifest JSON
// (expected_manifest.json) para evitar duplicacion literal.
const PHASE1_REQUIRED_TABLES = EXPECTED.phase1RequiredTables;
const PHASE1_DEMO_USER_IDS = EXPECTED.phase1DemoUserIds;
const PHASE2_REQUIRED_TABLES = EXPECTED.phase2RequiredTables;
// Minimo total de tablas tras Fase 1+Fase 2 = suma derivada del manifest.
const PHASE2_MIN_TOTAL_TABLES =
    EXPECTED.phase1RequiredTables.length + EXPECTED.phase2RequiredTables.length;
const PHASE3_LOOKUP_TABLES = EXPECTED.lookupTables;
const PHASE3_MASTER_UUID_TABLES = EXPECTED.masterTablesRequiringUuidPk;
const PHASE3_MULTITENANT_TABLES = EXPECTED.multitenantTables;
const PHASE3_TENANT_ID_IS_PK_TABLES = EXPECTED.tenantIdIsPrimaryKeyTables;
const PHASE4_KV_TABLES = EXPECTED.kvCoexistenceTables;
// Tablas que cruza el JSON pero el regex de migrate_to_uuid_kv.js NO ve
// (o viceversa). Esto detecta silenciosas divergencias entre el canon
// y el script de migracion.
const MLookups = DERIVED.lookupTables.filter(
    (t) => !EXPECTED.lookupTables.includes(t));
const Mmasters = DERIVED.masterTables.filter(
    (t) => !EXPECTED.masterTables.includes(t));
const Elookups = EXPECTED.lookupTables.filter(
    (t) => !DERIVED.lookupTables.includes(t));
const Emasters = EXPECTED.masterTables.filter(
    (t) => !DERIVED.masterTables.includes(t));

async function checkPhase3(conn) {
    const reasons = [];
    const tables = await listTables(conn, CFG.database);

    // 18 tablas lookup presentes (cargadas desde expected_manifest.json).
    for (const t of PHASE3_LOOKUP_TABLES) {
        if (!tables.includes(t)) reasons.push('Falta lookup: ' + t);
    }
    // Divergencia entre manifest JSON y parser regex de migrate_to_uuid_kv.js.
    if (MLookups.length > 0 || Mmasters.length > 0 ||
        Elookups.length > 0 || Emasters.length > 0) {
        const parts = [];
        if (MLookups.length) parts.push('solo en regex: [' + MLookups.join(',') + ']');
        if (Mmasters.length) parts.push('solo en regex (master): [' + Mmasters.join(',') + ']');
        if (Elookups.length) parts.push('solo en manifest: [' + Elookups.join(',') + ']');
        if (Emasters.length) parts.push('solo en manifest (master): [' + Emasters.join(',') + ']');
        reasons.push('Divergencia manifest vs regex de migrate_to_uuid_kv.js: ' +
            parts.join(' | '));
    }

    // 25 tablas master + UUID PK
    for (const t of PHASE3_MASTER_UUID_TABLES) {
        if (!tables.includes(t)) {
            reasons.push('Falta tabla master UUID: ' + t);
            continue;
        }
        const pks = await getPKColumns(conn, CFG.database, t);
        // Spec definido en EXPECTED.validations.exactUuidColumnType
        // (manifest). PK debe ser exactamente char(36) (no varchar(36)).
        const expectedColType = String(EXPECTED.validations.exactUuidColumnType).toLowerCase();
        const pkIsUUID = pks.length > 0 && pks.every((p) =>
            String(p.COLUMN_TYPE || '').toLowerCase() === expectedColType);
        if (!pkIsUUID) {
            reasons.push(t + '.PK no es estrictamente CHAR(36) (column_types=' +
                pks.map((p) => p.COLUMN_TYPE + '/' + p.DATA_TYPE).join(',') + ').');
        }
    }

    // FK users.role_id -> lkp_rol_usuario.id, users.status_id -> lkp_status.id
    const userFKs = await getForeignKeys(conn, CFG.database, 'users');
    const expectUsersFKs = ['role_id', 'status_id', 'department_id', 'tenant_id'];
    for (const col of expectUsersFKs) {
        const fk = userFKs.find((f) => f.COLUMN_NAME === col);
        if (!fk) reasons.push('users.' + col + ' sin FK.');
        else if (fk.COLUMN_NAME === 'tenant_id' && fk.REFERENCED_TABLE_NAME !== 'organizations') {
            reasons.push('users.tenant_id -> ' + fk.REFERENCED_TABLE_NAME + ' (esperado organizations).');
        }
    }
    const usersCol = await getColumn(conn, CFG.database, 'users', 'department_id');
    if (!usersCol) reasons.push('users.department_id falta');
    // Las FKs hacia lookup deben tener DELETE_RULE = SET NULL
    const roleFk = userFKs.find((f) => f.COLUMN_NAME === 'role_id');
    if (roleFk && roleFk.REFERENCED_TABLE_NAME !== 'lkp_rol_usuario') {
        reasons.push('users.role_id -> ' + roleFk.REFERENCED_TABLE_NAME + ' (esperado lkp_rol_usuario).');
    } else if (roleFk && roleFk.DELETE_RULE !== 'SET NULL') {
        reasons.push('users.role_id DELETE_RULE=' + roleFk.DELETE_RULE + ' (esperado SET NULL).');
    }

    // FK multi-tenant hacia organizations con CASCADE.
    // Para casi todas las tablas la FK viene de la columna tenant_id.
    // Para las 3 excepciones (compras_proveedores_data, incidencias_nc_data,
    // management_review) tenant_id ES la PK, asi que information_schema
    // reporta la FK bajo la columna tenant_id igualmente pero con COLUMN_KEY
    // = PRI. Las validamos igual.
    let cascadeCount = 0; let setNullCount = 0;
    for (const t of PHASE3_MULTITENANT_TABLES) {
        const fks = await getForeignKeys(conn, CFG.database, t);
        const tenantFK = fks.find((f) => f.COLUMN_NAME === 'tenant_id');
        if (!tenantFK) {
            reasons.push(t + '.tenant_id sin FK a organizations.');
            continue;
        }
        if (tenantFK.REFERENCED_TABLE_NAME !== 'organizations') {
            reasons.push(t + '.tenant_id -> ' + tenantFK.REFERENCED_TABLE_NAME + ' (esperado organizations).');
        }
        if (tenantFK.DELETE_RULE === 'CASCADE') cascadeCount++;
        else reasons.push(t + '.tenant_id DELETE_RULE=' + tenantFK.DELETE_RULE + ' (esperado CASCADE).');
    }
    if (cascadeCount < EXPECTED.validations.minMultitenantCascadeTables) {
        reasons.push('Solo ' + cascadeCount + '/' + EXPECTED.validations.minMultitenantCascadeTables +
            ' tablas multi-tenant con CASCADE requeridas (esperado >= ' +
            EXPECTED.validations.minMultitenantCascadeTables + ').');
    }

    // Conteo FKs totales hacia lkp_*. Umbral leido del manifest:
    // EXPECTED.validations.minLkpForeignKeys (canon ~38, piso 30 para
    // detectar perdidas reales sin romper por renombres menores).
    const [lkpFkRows] = await conn.query(
        'SELECT COUNT(*) AS c FROM information_schema.KEY_COLUMN_USAGE kcu ' +
        'WHERE kcu.TABLE_SCHEMA = ? AND kcu.REFERENCED_TABLE_NAME LIKE ?',
        [CFG.database, 'lkp\\_%']);
    if (lkpFkRows[0].c < EXPECTED.validations.minLkpForeignKeys) {
        reasons.push('Solo ' + lkpFkRows[0].c + ' FKs hacia lkp_* (esperado >= ' +
            EXPECTED.validations.minLkpForeignKeys + ' segun manifest).');
    }

    // Forzar conteo de SET NULL entre las FKs hacia lkp_*.
    const [setNullLkp] = await conn.query(
        'SELECT COUNT(*) AS c FROM information_schema.REFERENTIAL_CONSTRAINTS rc ' +
        'WHERE rc.CONSTRAINT_SCHEMA = ? AND rc.DELETE_RULE = ?',
        [CFG.database, 'SET NULL']);
    if (setNullLkp[0].c < EXPECTED.validations.minSetNullForeignKeys) {
        reasons.push('Solo ' + setNullLkp[0].c + ' FKs con SET NULL (esperado >= ' +
            EXPECTED.validations.minSetNullForeignKeys + ' segun manifest).');
    } else {
        setNullCount = setNullLkp[0].c;
    }

    return {
        pass: reasons.length === 0, reasons, tableCount: tables.length,
        cascadeCount, setNullCount, lkpForeignKeys: lkpFkRows[0].c,
    };
}

// Fase 4: setup_kv_schema.sql (coexistencia del esquema KV alternativo).
// PHASE4_KV_TABLES ya esta declarado arriba desde EXPECTED.kvCoexistenceTables.

async function checkPhase4(conn) {
    const reasons = [];
    const tables = await listTables(conn, CFG.database);
    for (const t of PHASE4_KV_TABLES) {
        if (!tables.includes(t)) reasons.push('Falta tabla KV: ' + t);
    }
    // Verificar que las tablas UUID del paso 3 siguen presentes
    for (const t of ['organizations', 'users', 'lkp_status']) {
        if (!tables.includes(t)) reasons.push('Despues de Fase 4 se perdio: ' + t);
    }
    return { pass: reasons.length === 0, reasons, tableCount: tables.length };
}

// -------------------------------------------------------------------------
// 6. Verificacion dinamica de CASCADE y SET NULL (sintetica).
//    IDs deterministicos + cleanup en finally para garantizar idempotencia.
// -------------------------------------------------------------------------
async function verifyReferentialIntegrity(conn) {
    const reasons = [];
    // Cleanup agresivo al inicio: si una corrida previa fallo a mitad,
    // podrian quedar residuos que bloqueen esta corrida (UNIQUE email).
    const STALE_ORG_IDS = [
        '00000000-0000-0000-0000-000000000aaa',
        '00000000-0000-0000-0000-000000000bbb',
    ];
    for (const id of STALE_ORG_IDS) {
        try { await conn.query('DELETE FROM organizations WHERE id = ?', [id]); }
        catch (_) { /* nothing */ }
    }
    try { await conn.query('DELETE FROM lkp_status WHERE code = ?', ['__smoke_status__']); }
    catch (_) { /* nothing */ }

    // (a) CASCADE en organizaciones -> documents y SET NULL en users.tenant_id.
    // documents.tenant_id -> organizations.id usa ON DELETE CASCADE.
    // users.tenant_id     -> organizations.id usa ON DELETE SET NULL.
    // Combinamos ambas validaciones en el mismo caso sintetico para que el
    // test sea una sola transaccion logica sobre el evento "delete org".
    const TEST_ORG_ID = '00000000-0000-0000-0000-000000000aaa';
    const TEST_DOC_ID = '00000000-0000-0000-0000-000000000daa';
    const TEST_USR_ID = '00000000-0000-0000-0000-000000000uaa';
    try {
        await conn.query(
            'INSERT INTO organizations (id, name) VALUES (?, ?)',
            [TEST_ORG_ID, '__smoke_test_org_cascade__']);
        await conn.query(
            'INSERT INTO documents (id, tenant_id, title) VALUES (?, ?, ?)',
            [TEST_DOC_ID, TEST_ORG_ID, '__smoke_test_doc__']);
        await conn.query(
            'INSERT INTO users (id, name, email, tenant_id) VALUES (?, ?, ?, ?)',
            [TEST_USR_ID, '__smoke_test_user__',
                'smoketest+cascade+' + Date.now() + '@bor4d.local', TEST_ORG_ID]);

        const beforeDoc = await countRows(conn, CFG.database, 'documents');
        const beforeUsr = await countRows(conn, CFG.database, 'users');

        await conn.query('DELETE FROM organizations WHERE id = ?', [TEST_ORG_ID]);

        const afterDoc = await countRows(conn, CFG.database, 'documents');
        // Para users esperamos que la fila SOBREVIVA pero con tenant_id = NULL
        // (regla SET NULL), asi que el conteo de users se mantiene.
        const afterUsr = await countRows(conn, CFG.database, 'users');
        const [usrRows] = await conn.query(
            'SELECT tenant_id FROM users WHERE id = ?', [TEST_USR_ID]);
        const userTenantAfter = (usrRows[0] && ('tenant_id' in usrRows[0])) ?
            usrRows[0].tenant_id : 'ROW_PURGED';

        // (a.1) CASCADE documents -> fila purgada
        if (afterDoc !== beforeDoc - 1) {
            reasons.push('CASCADE organizations -> documents no se ejecuto ' +
                '(' + beforeDoc + ' -> ' + afterDoc + ', esperado ' + (beforeDoc - 1) + ').');
        }
        // (a.2) SET NULL users.tenant_id -> fila sobrevive con NULL
        if (afterUsr !== beforeUsr) {
            reasons.push('SET NULL organizations -> users.tenant_id no se ejecuto ' +
                '(' + beforeUsr + ' -> ' + afterUsr + ', usuarios deberian sobrevivir con tenant_id=NULL).');
        }
        if (userTenantAfter !== null) {
            reasons.push('users.tenant_id tras DELETE org no es NULL (sigue=' +
                JSON.stringify(userTenantAfter) + '). Esperado NULL por SET NULL.');
        }
    } catch (e) {
        reasons.push('Test CASCADE+SET NULL lanzo excepcion: ' + e.message);
    } finally {
        // Cleanup explicito. primero user (superviviente), luego org.
        try { await conn.query('DELETE FROM users WHERE id = ?', [TEST_USR_ID]); } catch (_) {}
        try { await conn.query('DELETE FROM documents WHERE id = ?', [TEST_DOC_ID]); } catch (_) {}
        try { await conn.query('DELETE FROM organizations WHERE id = ?', [TEST_ORG_ID]); } catch (_) {}
    }

    // (b) SET NULL en lkp_status -> users.status_id
    const TEST_ORG2 = '00000000-0000-0000-0000-000000000bbb';
    const TEST_USR2 = '00000000-0000-0000-0000-000000000ubb';
    let syntheticStatusId;
    try {
        const [insRes] = await conn.query(
            'INSERT INTO lkp_status (code, label, sort_order) VALUES (?, ?, ?)',
            ['__smoke_status__', '__Smoke Status__', 9999]);
        syntheticStatusId = insRes.insertId;

        await conn.query(
            'INSERT INTO organizations (id, name) VALUES (?, ?)',
            [TEST_ORG2, '__smoke_test_org_setnull__']);

        await conn.query(
            'INSERT INTO users (id, name, email, tenant_id, status_id) VALUES (?, ?, ?, ?, ?)',
            [TEST_USR2, '__smoke_test_user_setnull__',
                'smoketest+setnull+' + Date.now() + '@bor4d.local',
                TEST_ORG2, syntheticStatusId]);

        const [pre] = await conn.query(
            'SELECT status_id FROM users WHERE id = ?', [TEST_USR2]);
        if (!pre[0] || pre[0].status_id !== syntheticStatusId) {
            reasons.push('Pre-condicion SET NULL fallo: status_id no se asigno.');
        }

        await conn.query('DELETE FROM lkp_status WHERE id = ?', [syntheticStatusId]);

        const [post] = await conn.query(
            'SELECT status_id FROM users WHERE id = ?', [TEST_USR2]);
        if (!post[0] || post[0].status_id !== null) {
            reasons.push('SET NULL lkp_status -> users.status_id no se ejecuto ' +
                '(status_id=' + (post[0] ? post[0].status_id : 'undefined') + ').');
        }
    } catch (e) {
        reasons.push('Test SET NULL lanzo excepcion: ' + e.message);
    } finally {
        // Cleanup explicito: user primero (no depende de org), luego org.
        try { await conn.query('DELETE FROM users WHERE id = ?', [TEST_USR2]); }
        catch (_) { /* nothing */ }
        try { await conn.query('DELETE FROM organizations WHERE id = ?', [TEST_ORG2]); }
        catch (_) { /* nothing */ }
    }

    return { pass: reasons.length === 0, reasons };
}

// -------------------------------------------------------------------------
// 7. Ejecucion de una fase completa (script + validacion).
// -------------------------------------------------------------------------
async function executePhase(idx, phaseSpec, conn) {
    console.log('\n' + '='.repeat(72));
    console.log('FASE ' + idx + ': ' + phaseSpec.title);
    console.log('='.repeat(72));
    if (phaseSpec.resetBefore) {
        await dropAndCreateDb(conn);
        log(ICON.info, 'BD reiniciada (DROP + CREATE).');
    }
    if (phaseSpec.kind === 'sql') {
        const sql = fs.readFileSync(SQL_PATH, 'utf8');
        // Quitar CREATE DATABASE y USE para reutilizar la conexion ya seleccionada.
        const sanitized = sql
            .replace(/^\s*CREATE\s+DABASE[^;]*;\s*/gmi, '')
            .replace(/^\s*USE\s+[^;]*;\s*/gmi, '');
        if (phaseSpec.marksDbJsonBak) markDbJsonOriginatedFromSmoke();
        await conn.query(sanitized);
        log(ICON.info, 'SQL ejecutado.');
    } else {
        if (phaseSpec.marksDbJsonBak) markDbJsonOriginatedFromSmoke();
        const result = runNodeScript(phaseSpec.script,
            phaseSpec.envOverrides, phaseSpec.timeoutSec || 120);
        if (!result.ok) {
            return { pass: false, phase: phaseSpec.title, reasons: [
                'Script salio con codigo ' + result.status +
                (result.signal ? ' (' + result.signal + ')' : '') +
                (result.timedOut ? ' [TIMEOUT]' : '') + '.',
            ] };
        }
    }
    const check = await phaseSpec.check(conn);
    const ok = check.pass;
    console.log('--- Validacion ' + (ok ? TICK : CROSS) + ' (' + (check.tableCount || 0) + ' tablas) ---');
    if (!ok) {
        check.reasons.forEach((r) => log(ICON.fail, r));
    }
    if (check.cascadeCount !== undefined) {
        log(ICON.info, 'CASCADE multi-tenant: ' + check.cascadeCount + '/' +
            PHASE3_MULTITENANT_TABLES.length);
        log(ICON.info, 'SET NULL total: ' + check.setNullCount);
        log(ICON.info, 'FKs hacia lkp_*: ' + check.lkpForeignKeys);
    }
    return { pass: ok, phase: phaseSpec.title, reasons: check.reasons, details: check };
}

// -------------------------------------------------------------------------
// 8. MAIN
// -------------------------------------------------------------------------
async function main() {
    console.log('+======================================================================+');
    console.log('|  Bor4SIGE - Smoke Test del Esquema de Base de Datos (Fase 3.1)       |');
    console.log('+======================================================================+');
    let exitCode = 0;
    let mainConn;
    try {
        await waitForMariaDB();
        mainConn = await getConn();
        await ensureDbSelected(mainConn);

        backupDbJson();

        // Definicion de las fases en orden canonico
        const phases = [
            {
                kind: 'node', script: 'setup_db.js',
                envOverrides: { NODE_ENV: 'development', SEED_DEMO: 'true' },
                resetBefore: true, marksDbJsonBak: true,
                title: '1) setup_db.js - Bootstrap legacy',
                check: checkPhase1,
            },
            {
                kind: 'node', script: 'db_migration.js',
                envOverrides: {},
                resetBefore: false,
                title: '2) db_migration.js - Esquema relacional (26 tablas)',
                check: checkPhase2,
            },
            {
                kind: 'node', script: 'migrate_to_uuid_kv.js',
                envOverrides: {},
                resetBefore: false, timeoutSec: 180,
                title: '3) migrate_to_uuid_kv.js - Modelo E-R puro (UUID + Lookup)',
                check: checkPhase3,
            },
            {
                kind: 'sql',
                resetBefore: false,
                title: '4) setup_kv_schema.sql - Coexistencia esquema KV alternativo',
                check: checkPhase4,
            },
        ];

        const results = [];
        for (let i = 0; i < phases.length; i++) {
            const r = await executePhase(i + 1, phases[i], mainConn);
            results.push(r);
            if (!r.pass) {
                log(ICON.fail, 'Fase "' + r.phase + '" fallo. Abortando suite.');
                break;
            }
        }

        // Si todas las fases pasaron, ejecutar tests de integridad sinteticos.
        let refi = { pass: true, reasons: [] };
        if (results.every((r) => r.pass)) {
            console.log('\n' + '='.repeat(72));
            console.log('VERIFICACION SINTETICA: integridad referencial (CASCADE / SET NULL)');
            console.log('='.repeat(72));
            refi = await verifyReferentialIntegrity(mainConn);
            console.log('--- Validacion ' + (refi.pass ? TICK : CROSS) + ' ---');
            refi.reasons.forEach((r) => log(ICON.fail, r));
        }

        // Reporte final
        console.log('\n+======================================================================+');
        console.log('|  REPORTE FINAL                                                     |');
        console.log('+======================================================================+');
        results.forEach((r) => {
            console.log((r.pass ? TICK : CROSS) + '  ' + r.phase +
                (r.details && r.details.tableCount !== undefined ?
                    '   [' + r.details.tableCount + ' tablas]' : ''));
        });
        console.log((refi.pass ? TICK : CROSS) +
            '  Integridad referencial sintetica (CASCADE / SET NULL)');
        const allPass = results.every((r) => r.pass) && refi.pass;
        console.log('\nResultado global: ' + (allPass ? 'EN VERDE' : 'CON FALLOS'));
        exitCode = allPass ? 0 : 1;
    } catch (err) {
        console.error('\n' + ICON.fail + ' Error fatal: ' + err.message);
        exitCode = err.message.indexOf('MariaDB no respondio') === 0 ? 2 : 1;
    } finally {
        restoreDbJson();
        if (mainConn) await mainConn.end();
        console.log('\nSmoke test finalizado con exit code ' + exitCode + '.');
        process.exit(exitCode);
    }
}

if (require.main === module) {
    main();
}
