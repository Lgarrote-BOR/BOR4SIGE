/**
 * setup_db.js
 * Script de inicialización de la base de datos MariaDB para Bor4SIGE.
 * Crea la base de datos, tablas necesarias y migra/siembra datos desde db.json.
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const host = process.env.DB_HOST || '127.0.0.1';
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'bor4sige';
const port = parseInt(process.env.DB_PORT || '3306');

async function run() {
    console.log("Iniciando configuración de Base de Datos MariaDB...");
    
    // Conexión inicial sin base de datos seleccionada
    const connConfig = { user, password };
    if (process.env.DB_SOCKET_PATH) {
        connConfig.socketPath = `/cloudsql/${process.env.DB_SOCKET_PATH}`;
        console.log(`🔌 Conectando para configuración vía socket Unix: ${connConfig.socketPath}`);
    } else {
        connConfig.host = host;
        connConfig.port = port;
        console.log(`🔌 Conectando para configuración vía TCP/IP: ${host}:${port}`);
    }
    const conn = await mysql.createConnection(connConfig);
    
    try {
        // 1. Crear base de datos si no existe
        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✓ Base de datos \`${database}\` creada o verificada.`);
        
        // Seleccionar la base de datos
        await conn.query(`USE \`${database}\``);
        
        // 2. Crear tabla: usuarios
        await conn.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id VARCHAR(50) PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                role VARCHAR(255) NOT NULL,
                department VARCHAR(255),
                tenant_id VARCHAR(50) NOT NULL,
                status VARCHAR(50) DEFAULT 'Activo',
                is_superadmin BOOLEAN DEFAULT FALSE,
                must_change_password BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX (tenant_id)
            ) ENGINE=InnoDB
        `);
        console.log("✓ Tabla `usuarios` creada.");

        // 3. Crear tabla: tenant_store (Almacenamiento Key-Value para compatibilidad)
        await conn.query(`
            CREATE TABLE IF NOT EXISTS tenant_store (
                tenant_id VARCHAR(50) NOT NULL,
                key_name VARCHAR(255) NOT NULL,
                key_value LONGTEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (tenant_id, key_name),
                INDEX (tenant_id)
            ) ENGINE=InnoDB
        `);
        console.log("✓ Tabla `tenant_store` creada.");

        // 4. Crear tabla: auditorias (para endpoint GET /api/auditorias)
        await conn.query(`
            CREATE TABLE IF NOT EXISTS auditorias (
                id VARCHAR(50) PRIMARY KEY,
                tenant_id VARCHAR(50) NOT NULL,
                process VARCHAR(255) NOT NULL,
                planned_date DATE NOT NULL,
                status VARCHAR(50) NOT NULL,
                auditor VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX (tenant_id)
            ) ENGINE=InnoDB
        `);
        console.log("✓ Tabla `auditorias` creada.");

        // 5. Crear tabla: canal_de_denuncias (para E2E encrypt)
        await conn.query(`
            CREATE TABLE IF NOT EXISTS canal_de_denuncias (
                id VARCHAR(50) PRIMARY KEY,
                tenant_id VARCHAR(50) NOT NULL,
                date VARCHAR(50) NOT NULL,
                cat VARCHAR(255) NOT NULL,
                priority VARCHAR(50) NOT NULL,
                desc_encrypted TEXT NOT NULL,
                proofs_encrypted TEXT,
                dept VARCHAR(255),
                responsible VARCHAR(255),
                anonymous BOOLEAN DEFAULT TRUE,
                reporter_name VARCHAR(255),
                reporter_contact VARCHAR(255),
                status VARCHAR(100) NOT NULL,
                notes TEXT,
                closed_date VARCHAR(50),
                track_code VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX (tenant_id)
            ) ENGINE=InnoDB
        `);
        console.log("✓ Tabla `canal_de_denuncias` creada.");

        // 6. Sembrar Usuarios Iniciales (Seed) — SOLO en desarrollo o con SEED_DEMO=true.
        // En producción NUNCA se siembran credenciales por defecto (riesgo de puerta trasera).
        const allowDemoSeed = process.env.NODE_ENV !== 'production' || process.env.SEED_DEMO === 'true';
        if (!allowDemoSeed) {
            console.log("⏭  Producción detectada: se omite el sembrado de usuarios demo. Cree el primer usuario manualmente.");
        } else {
            console.log("Sembrando usuarios de prueba (entorno no productivo)...");
            const seedUsers = [
                { id: "bor", name: "Bor", email: "bor@bor4d.com", pass: "admin1234", role: "Superadministrador", department: "Dirección", tenantId: "alfa", status: "Activo", isSuper: true },
                { id: "ana", name: "Ana Rodríguez Silva", email: "a.rodriguez@bor4d.com", pass: "ana1234", role: "Quality Manager", department: "Calidad ISO 9001", tenantId: "alfa", status: "Activo", isSuper: false },
                { id: "carlos", name: "Carlos Gómez Pérez", email: "c.gomez@bor4d.com", pass: "carlos1234", role: "Auditor Interno", department: "Cumplimiento", tenantId: "beta", status: "Activo", isSuper: false },
                { id: "laura", name: "Laura Martínez", email: "l.martinez@bor4d.com", pass: "laura1234", role: "Especialista Medioambiental", department: "Medio Ambiente ISO 14001", tenantId: "alfa", status: "Inactivo", isSuper: false }
            ];

            for (const u of seedUsers) {
                const hashed = await bcrypt.hash(u.pass, 10);
                await conn.query(
                    `INSERT INTO usuarios (id, email, password, name, role, department, tenant_id, status, is_superadmin)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE password=VALUES(password), name=VALUES(name), role=VALUES(role), status=VALUES(status)`,
                    [u.id, u.email, hashed, u.name, u.role, u.department, u.tenantId, u.status, u.isSuper]
                );
            }
            console.log("✓ Usuarios demo sembrados con éxito.");
        }

        // 7. Migrar datos de db.json a tenant_store y tablas estructuradas
        const dbJsonPath = path.join(__dirname, 'db.json');
        if (fs.existsSync(dbJsonPath)) {
            console.log("Migrando datos de db.json a MariaDB...");
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

                // Intentar extraer el tenant del sufijo del key (ej: sig_bcp_exercises_alfa)
                for (const t of tenants) {
                    if (key.endsWith(`_${t}`)) {
                        tenantId = t;
                        baseKey = key.substring(0, key.lastIndexOf(`_${t}`));
                        break;
                    }
                }

                // Si es un key global explícito, forzar global
                if (globalKeys.includes(key)) {
                    tenantId = 'global';
                    baseKey = key;
                }

                // Guardar en tenant_store
                await conn.query(
                    `INSERT INTO tenant_store (tenant_id, key_name, key_value) VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE key_value=VALUES(key_value)`,
                    [tenantId, baseKey, typeof value === 'string' ? value : JSON.stringify(value)]
                );

                // Migrar a tabla estructurada de Auditorías si corresponde
                if (baseKey === 'sig_auditorias_data' || baseKey === 'sig_planificacion_auditoria') {
                    try {
                        const items = typeof value === 'string' ? JSON.parse(value) : value;
                        const list = Array.isArray(items) ? items : (items.auditorias || items.audits || []);
                        for (const a of list) {
                            const audId = a.id || a.code || `AUD-${Math.random().toString(36).substring(2,7).toUpperCase()}`;
                            const process = a.process || a.proceso || 'Desconocido';
                            const planned = a.date || a.fecha || a.scheduled || new Date().toISOString().split('T')[0];
                            const status = a.status || a.estado || 'Planificada';
                            const auditor = a.auditor || 'N/A';
                            
                            await conn.query(
                                `INSERT INTO auditorias (id, tenant_id, process, planned_date, status, auditor) VALUES (?, ?, ?, ?, ?, ?) 
                                 ON DUPLICATE KEY UPDATE process=VALUES(process), planned_date=VALUES(planned_date), status=VALUES(status), auditor=VALUES(auditor)`,
                                [audId, tenantId === 'global' ? 'alfa' : tenantId, process, planned, status, auditor]
                            );
                        }
                    } catch (e) {
                        // Ignorar fallos de formato
                    }
                }
                
                // Migrar a tabla estructurada de Canal de Denuncias
                if (baseKey === 'sig_canal_denuncias') {
                    try {
                        const items = typeof value === 'string' ? JSON.parse(value) : value;
                        const list = Array.isArray(items) ? items : [];
                        const encryptModule = require('./encryption');
                        
                        for (const d of list) {
                            const denId = d.id || `DEN-${Math.random().toString(36).substring(2,7).toUpperCase()}`;
                            const date = d.date || new Date().toISOString();
                            const cat = d.cat || 'General';
                            const priority = d.priority || 'Media';
                            
                            // Cifrar E2E descripción y pruebas
                            const descEnc = encryptModule.encrypt(d.desc || 'Sin descripción');
                            const proofsEnc = encryptModule.encrypt(d.proofs || '');
                            
                            const dept = d.dept || '';
                            const resp = d.responsible || '';
                            const anon = d.anonymous !== false;
                            const rName = d.reporterName || '';
                            const rContact = d.reporterContact || '';
                            const status = d.status || 'Nueva';
                            const notes = d.notes || '';
                            const closed = d.closedDate || null;
                            const track = d.trackCode || '';
                            
                            await conn.query(
                                `INSERT INTO canal_de_denuncias (id, tenant_id, date, cat, priority, desc_encrypted, proofs_encrypted, dept, responsible, anonymous, reporter_name, reporter_contact, status, notes, closed_date, track_code) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                                 ON DUPLICATE KEY UPDATE cat=VALUES(cat), priority=VALUES(priority), desc_encrypted=VALUES(desc_encrypted), status=VALUES(status)`,
                                [denId, tenantId === 'global' ? 'alfa' : tenantId, date, cat, priority, descEnc, proofsEnc, dept, resp, anon, rName, rContact, status, notes, closed, track]
                            );
                        }
                    } catch (e) {
                        console.error("Error al sembrar denuncias en tabla estructurada:", e.message);
                    }
                }
            }
            console.log("✓ Datos migrados con éxito a MariaDB.");
        } else {
            console.log("⚠ No se encontró db.json. Saltando migración de datos.");
        }
        
        console.log("\n=======================================================");
        console.log("🎉 CONFIGURACIÓN DE BASE DE DATOS COMPLETADA CON ÉXITO");
        console.log("=======================================================");

    } catch (err) {
        console.error("✖ Error configurando la base de datos:", err);
    } finally {
        await conn.end();
    }
}

run();
