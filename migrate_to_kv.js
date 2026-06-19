const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  // Load old JSON data
  const dbPath = path.resolve('db.json');
  const raw = fs.readFileSync(dbPath, 'utf8');
  const data = JSON.parse(raw);

  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'bor4sige',
    multipleStatements: true,
  });

  const insertMaster = async () => {
    const [rows] = await conn.query('SELECT UUID() AS id');
    const id = rows[0].id;
    await conn.execute('INSERT INTO master_entity (id) VALUES (?)', [id]);
    return id;
  };

  const insertKV = async (table, id, obj) => {
    const entries = Object.entries(obj).map(([k, v]) => [id, k, v]);
    const placeholders = entries.map(() => '(?, ?, ?)').join(',');
    const flat = entries.flat();
    await conn.query(`INSERT INTO ${table} (id, key_name, value_text) VALUES ${placeholders}`, flat);
  };

  // Helper to migrate a collection
  const migrateCollection = async (collectionName, tablePrefix) => {
    const collection = data[collectionName] || [];
    for (const item of collection) {
      const masterId = await insertMaster();
      await insertKV(`kv_${tablePrefix}`, masterId, item);
    }
  };

  // Migrate known collections – adjust names as needed
  await migrateCollection('users', 'user');
  await migrateCollection('products', 'product');
  await migrateCollection('orders', 'order');

  console.log('Migración completada.');
  await conn.end();
})();
