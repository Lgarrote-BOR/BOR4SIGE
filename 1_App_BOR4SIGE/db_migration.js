const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'bor4sige';

async function migrate() {
    let connection;
    try {
        console.log("Conectando a MariaDB...");
        const connConfig = {
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        };
        if (process.env.DB_SOCKET_PATH) {
            connConfig.socketPath = `/cloudsql/${process.env.DB_SOCKET_PATH}`;
            console.log(`🔌 Conectando para migración vía socket Unix: ${connConfig.socketPath}`);
        } else {
            connConfig.host = process.env.DB_HOST || 'localhost';
            connConfig.port = parseInt(process.env.DB_PORT) || 3306;
            console.log(`🔌 Conectando para migración vía TCP/IP: ${connConfig.host}:${connConfig.port}`);
        }
        connection = await mysql.createConnection(connConfig);
        
        console.log(`Creando base de datos ${DB_NAME} si no existe...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await connection.query(`USE \`${DB_NAME}\``);

        console.log("Definiendo esquema de tablas relacionales...");
        
        // 1. organizations
        await connection.query(`
            CREATE TABLE IF NOT EXISTS organizations (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                compliance INT DEFAULT 0,
                trend VARCHAR(50),
                trend_up BOOLEAN DEFAULT TRUE,
                capa_total INT DEFAULT 0,
                capa_criticas INT DEFAULT 0,
                capa_abiertas INT DEFAULT 0,
                risks_total INT DEFAULT 0,
                risks_mitigated INT DEFAULT 0,
                risks_unmitigated INT DEFAULT 0,
                audits_planned INT DEFAULT 0,
                audits_retrasada INT DEFAULT 0,
                ens_c VARCHAR(50),
                ens_i VARCHAR(50),
                ens_d VARCHAR(50),
                ens_a VARCHAR(50),
                ens_t VARCHAR(50),
                scores_iso9001 INT DEFAULT 0,
                scores_iso14001 INT DEFAULT 0,
                scores_iso45001 INT DEFAULT 0,
                scores_iso27001 INT DEFAULT 0,
                scores_iso22301 INT DEFAULT 0,
                scores_iso37001 INT DEFAULT 0,
                scores_iso37301 INT DEFAULT 0,
                scores_iso20000 INT DEFAULT 0,
                scores_iso27701 INT DEFAULT 0,
                scores_ens INT DEFAULT 0,
                activities JSON,
                alerts JSON,
                systems JSON
            ) ENGINE=InnoDB
        `);

        // 2. users
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                role VARCHAR(100) NOT NULL,
                department VARCHAR(255),
                tenant_id VARCHAR(50),
                status VARCHAR(50) DEFAULT 'Activo',
                is_superadmin BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE SET NULL ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 3. personal
        await connection.query(`
            CREATE TABLE IF NOT EXISTS personal (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                role VARCHAR(255),
                dept VARCHAR(100),
                status VARCHAR(50),
                photo TEXT
            ) ENGINE=InnoDB
        `);

        // 4. sige_settings
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sige_settings (
                setting_key VARCHAR(255) PRIMARY KEY,
                setting_value LONGTEXT
            ) ENGINE=InnoDB
        `);

        // 5. documents
        await connection.query(`
            CREATE TABLE IF NOT EXISTS documents (
                id VARCHAR(50) NOT NULL,
                code VARCHAR(100) UNIQUE,
                tipo VARCHAR(100),
                title VARCHAR(255) NOT NULL,
                version VARCHAR(50),
                date VARCHAR(50),
                ambito VARCHAR(255),
                status VARCHAR(50),
                resp VARCHAR(255),
                tenant_id VARCHAR(50),
                PRIMARY KEY (id, tenant_id),
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 6. requisitos_legales
        await connection.query(`
            CREATE TABLE IF NOT EXISTS requisitos_legales (
                id VARCHAR(50) NOT NULL,
                tipo VARCHAR(100),
                titulo VARCHAR(255) NOT NULL,
                \`desc\` TEXT,
                ambito VARCHAR(255),
                norma VARCHAR(255),
                estado VARCHAR(50),
                fecha_rev VARCHAR(50),
                responsable VARCHAR(255),
                enlace TEXT,
                tenant_id VARCHAR(50),
                PRIMARY KEY (id, tenant_id),
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 7. dafo
        await connection.query(`
            CREATE TABLE IF NOT EXISTS dafo (
                id VARCHAR(50) NOT NULL,
                type VARCHAR(100) NOT NULL,
                title VARCHAR(255) NOT NULL,
                \`desc\` TEXT,
                impact VARCHAR(50),
                action VARCHAR(255),
                tenant_id VARCHAR(50),
                PRIMARY KEY (id, tenant_id),
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 8. partes_interesadas
        await connection.query(`
            CREATE TABLE IF NOT EXISTS partes_interesadas (
                id VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                type VARCHAR(100),
                influence VARCHAR(50),
                impact VARCHAR(50),
                requirements JSON,
                action_plan TEXT,
                last_evaluation VARCHAR(50),
                next_evaluation VARCHAR(50),
                periodicity INT,
                history JSON,
                tenant_id VARCHAR(50),
                PRIMARY KEY (id, tenant_id),
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 9. cambios_ti
        await connection.query(`
            CREATE TABLE IF NOT EXISTS cambios_ti (
                id VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                type VARCHAR(100),
                \`desc\` TEXT,
                ci VARCHAR(255),
                owner VARCHAR(255),
                impact VARCHAR(50),
                risk VARCHAR(50),
                date VARCHAR(50),
                tests TEXT,
                rollback TEXT,
                approver VARCHAR(255),
                status VARCHAR(50),
                tenant_id VARCHAR(50),
                PRIMARY KEY (id, tenant_id),
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 10. bcp_processes
        await connection.query(`
            CREATE TABLE IF NOT EXISTS bcp_processes (
                id VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                mtpd INT,
                rto INT,
                rpo INT,
                imp_fin INT,
                imp_op INT,
                imp_rep INT,
                tenant_id VARCHAR(50),
                PRIMARY KEY (id, tenant_id),
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 11. bcp_exercises
        await connection.query(`
            CREATE TABLE IF NOT EXISTS bcp_exercises (
                id VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                date VARCHAR(50),
                scenario VARCHAR(255),
                target_rto INT,
                actual_rto INT,
                status VARCHAR(50),
                notes TEXT,
                tenant_id VARCHAR(50),
                PRIMARY KEY (id, tenant_id),
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 12. acciones_correctivas
        await connection.query(`
            CREATE TABLE IF NOT EXISTS acciones_correctivas (
                id VARCHAR(50) NOT NULL,
                origen VARCHAR(255),
                resumen TEXT,
                responsable VARCHAR(255),
                estado VARCHAR(50),
                tenant_id VARCHAR(50),
                PRIMARY KEY (id, tenant_id),
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 13. audits_actions
        await connection.query(`
            CREATE TABLE IF NOT EXISTS audits_actions (
                id VARCHAR(50) NOT NULL,
                audit_id VARCHAR(50),
                finding TEXT,
                \`desc\` TEXT,
                resp VARCHAR(255),
                deadline VARCHAR(50),
                status VARCHAR(50),
                tenant_id VARCHAR(50),
                PRIMARY KEY (id, tenant_id),
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 14. canal_denuncias
        await connection.query(`
            CREATE TABLE IF NOT EXISTS canal_denuncias (
                id VARCHAR(50) NOT NULL,
                date VARCHAR(50),
                cat VARCHAR(255),
                priority VARCHAR(50),
                \`desc\` TEXT,
                dept VARCHAR(100),
                responsible VARCHAR(255),
                anonymous BOOLEAN,
                reporter_name VARCHAR(255),
                reporter_contact VARCHAR(255),
                status VARCHAR(50),
                notes TEXT,
                closed_date VARCHAR(50),
                track_code VARCHAR(100),
                tenant_id VARCHAR(50),
                PRIMARY KEY (id, tenant_id),
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 15. procesos
        await connection.query(`
            CREATE TABLE IF NOT EXISTS procesos (
                id VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(100),
                compliance INT,
                ok_kpis INT,
                warn_kpis INT,
                crit_kpis INT,
                owner VARCHAR(255),
                inputs TEXT,
                outputs TEXT,
                risks JSON,
                activities JSON,
                tenant_id VARCHAR(50),
                PRIMARY KEY (id, tenant_id),
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 16. politicas_sgi
        await connection.query(`
            CREATE TABLE IF NOT EXISTS politicas_sgi (
                id VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                norm VARCHAR(255),
                version VARCHAR(50),
                date VARCHAR(50),
                review VARCHAR(255),
                owner VARCHAR(255),
                status VARCHAR(50),
                scope TEXT,
                content TEXT,
                evidences JSON,
                tenant_id VARCHAR(50),
                PRIMARY KEY (id, tenant_id),
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 17. compras_proveedores_data
        await connection.query(`
            CREATE TABLE IF NOT EXISTS compras_proveedores_data (
                tenant_id VARCHAR(50) PRIMARY KEY,
                proveedores JSON,
                pedidos JSON,
                evaluaciones JSON,
                incidencias JSON,
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 18. incidencias_nc_data
        await connection.query(`
            CREATE TABLE IF NOT EXISTS incidencias_nc_data (
                tenant_id VARCHAR(50) PRIMARY KEY,
                incidencias JSON,
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 19. pedidos_clientes
        await connection.query(`
            CREATE TABLE IF NOT EXISTS pedidos_clientes (
                id VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(100),
                svc_id VARCHAR(50),
                svc_name VARCHAR(255),
                concept TEXT,
                delivery VARCHAR(255),
                scope TEXT,
                demand_soporte INT,
                demand_infra INT,
                demand_material INT,
                status VARCHAR(50),
                tenant_id VARCHAR(50),
                PRIMARY KEY (id, tenant_id),
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 20. catalogo_general
        await connection.query(`
            CREATE TABLE IF NOT EXISTS catalogo_general (
                id VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                tipo VARCHAR(100),
                cat VARCHAR(100),
                cost DECIMAL(10,2),
                stock INT,
                min_stock INT,
                unit VARCHAR(50),
                tenant_id VARCHAR(50),
                PRIMARY KEY (id, tenant_id),
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 21. desempeno_proveedores
        await connection.query(`
            CREATE TABLE IF NOT EXISTS desempeno_proveedores (
                id VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                date VARCHAR(50),
                quality DECIMAL(3,2),
                delivery DECIMAL(3,2),
                support DECIMAL(3,2),
                compliance DECIMAL(3,2),
                avg DECIMAL(3,2),
                sla DECIMAL(3,2),
                owner VARCHAR(255),
                obs TEXT,
                tenant_id VARCHAR(50),
                PRIMARY KEY (id, tenant_id),
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 22. inventario_equipos
        await connection.query(`
            CREATE TABLE IF NOT EXISTS inventario_equipos (
                id VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                model VARCHAR(255),
                last_cal VARCHAR(50),
                next_cal VARCHAR(50),
                status VARCHAR(50),
                section VARCHAR(100),
                criticidad VARCHAR(50),
                tenant_id VARCHAR(50),
                PRIMARY KEY (id, tenant_id),
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 23. clima_laboral_encuestas
        await connection.query(`
            CREATE TABLE IF NOT EXISTS clima_laboral_encuestas (
                id VARCHAR(50) NOT NULL,
                fecha VARCHAR(50),
                periodo VARCHAR(50),
                empleado VARCHAR(50),
                respuestas JSON,
                comentarios JSON,
                score DECIMAL(4,2),
                tenant_id VARCHAR(50),
                PRIMARY KEY (id, tenant_id),
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 24. perfiles_cualificacion
        await connection.query(`
            CREATE TABLE IF NOT EXISTS perfiles_cualificacion (
                id VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                dept VARCHAR(100),
                description TEXT,
                normas JSON,
                status VARCHAR(50),
                competencias JSON,
                educacion TEXT,
                experiencia TEXT,
                tenant_id VARCHAR(50),
                PRIMARY KEY (id, tenant_id),
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 25. ens_checklist
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ens_checklist (
                id VARCHAR(50) NOT NULL,
                pilar VARCHAR(100),
                name VARCHAR(255) NOT NULL,
                \`desc\` TEXT,
                val VARCHAR(100),
                note TEXT,
                evidence TEXT,
                status VARCHAR(50),
                tenant_id VARCHAR(50),
                PRIMARY KEY (id, tenant_id),
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        // 26. management_review
        await connection.query(`
            CREATE TABLE IF NOT EXISTS management_review (
                tenant_id VARCHAR(50) PRIMARY KEY,
                periodo VARCHAR(50),
                desempeno DECIMAL(5,2),
                trend VARCHAR(50),
                meta DECIMAL(5,2),
                aud_planificadas INT,
                aud_ejecutadas INT,
                capa_abiertas INT,
                capa_cerradas INT,
                capa_eficacia DECIMAL(5,2),
                resolucion TEXT,
                estado_sistema VARCHAR(50),
                proxima_revision VARCHAR(50),
                objetivos JSON,
                riesgos JSON,
                FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB
        `);

        console.log("Creando índices óptimos secundarios...");
        await connection.query("CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id)");
        await connection.query("CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id)");
        await connection.query("CREATE INDEX IF NOT EXISTS idx_requisitos_tenant ON requisitos_legales(tenant_id)");
        await connection.query("CREATE INDEX IF NOT EXISTS idx_dafo_tenant ON dafo(tenant_id)");
        await connection.query("CREATE INDEX IF NOT EXISTS idx_partes_tenant ON partes_interesadas(tenant_id)");
        await connection.query("CREATE INDEX IF NOT EXISTS idx_cambios_tenant ON cambios_ti(tenant_id)");
        await connection.query("CREATE INDEX IF NOT EXISTS idx_bcp_ex_tenant ON bcp_exercises(tenant_id)");
        await connection.query("CREATE INDEX IF NOT EXISTS idx_ac_tenant ON acciones_correctivas(tenant_id)");
        await connection.query("CREATE INDEX IF NOT EXISTS idx_audits_act_tenant ON audits_actions(tenant_id)");
        await connection.query("CREATE INDEX IF NOT EXISTS idx_denuncias_tenant ON canal_denuncias(tenant_id)");
        await connection.query("CREATE INDEX IF NOT EXISTS idx_procesos_tenant ON procesos(tenant_id)");
        await connection.query("CREATE INDEX IF NOT EXISTS idx_politicas_tenant ON politicas_sgi(tenant_id)");
        await connection.query("CREATE INDEX IF NOT EXISTS idx_pedidos_tenant ON pedidos_clientes(tenant_id)");
        await connection.query("CREATE INDEX IF NOT EXISTS idx_catalogo_tenant ON catalogo_general(tenant_id)");
        await connection.query("CREATE INDEX IF NOT EXISTS idx_desempeno_tenant ON desempeno_proveedores(tenant_id)");
        await connection.query("CREATE INDEX IF NOT EXISTS idx_inventario_tenant ON inventario_equipos(tenant_id)");
        await connection.query("CREATE INDEX IF NOT EXISTS idx_clima_tenant ON clima_laboral_encuestas(tenant_id)");
        await connection.query("CREATE INDEX IF NOT EXISTS idx_perfiles_tenant ON perfiles_cualificacion(tenant_id)");
        await connection.query("CREATE INDEX IF NOT EXISTS idx_ens_tenant ON ens_checklist(tenant_id)");

        console.log("Esquema relacional e índices creados con éxito.");

        // PROCEDER A MIGRACIÓN DESDE DB.JSON SI EXISTE
        const dbJsonPath = path.join(__dirname, 'db.json');
        if (fs.existsSync(dbJsonPath)) {
            console.log("Leyendo db.json para iniciar la migración de datos...");
            const dbData = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
            
            // Verificar si ya hay datos migrados en organizaciones
            const [rows] = await connection.query("SELECT COUNT(*) as count FROM organizations");
            if (rows[0].count > 0) {
                console.log("La base de datos ya contiene registros. Omitiendo la migración inicial de db.json.");
                return;
            }

            // 1. Migrar organizaciones primero
            if (dbData['sig_organizations']) {
                const orgs = JSON.parse(dbData['sig_organizations']);
                for (const orgId in orgs) {
                    const org = orgs[orgId];
                    await connection.query(`
                        INSERT INTO organizations (
                            id, name, compliance, trend, trend_up, 
                            capa_total, capa_criticas, capa_abiertas,
                            risks_total, risks_mitigated, risks_unmitigated,
                            audits_planned, audits_retrasada,
                            ens_c, ens_i, ens_d, ens_a, ens_t,
                            scores_iso9001, scores_iso14001, scores_iso45001, scores_iso27001, scores_iso22301,
                            scores_iso37001, scores_iso37301, scores_iso20000, scores_iso27701, scores_ens,
                            activities, alerts, systems
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        orgId, org.name, org.compliance || 0, org.trend || '', org.trendUp !== false,
                        org.capa?.total || 0, org.capa?.criticas || 0, org.capa?.abiertas || 0,
                        org.risks?.total || 0, org.risks?.mitigated || 0, org.risks?.unmitigated || 0,
                        org.audits?.planned || 0, org.audits?.retrasada || 0,
                        org.ens?.c || 'Bajo', org.ens?.i || 'Bajo', org.ens?.d || 'Bajo', org.ens?.a || 'Bajo', org.ens?.t || 'Bajo',
                        org.scores?.iso9001 || 0, org.scores?.iso14001 || 0, org.scores?.iso45001 || 0, org.scores?.iso27001 || 0, org.scores?.iso22301 || 0,
                        org.scores?.iso37001 || 0, org.scores?.iso37301 || 0, org.scores?.iso20000 || 0, org.scores?.iso27701 || 0, org.scores?.ens || 0,
                        JSON.stringify(org.activities || []), JSON.stringify(org.alerts || []), JSON.stringify(org.systems || {})
                    ]);
                }
                console.log("Organizaciones migradas.");
            }

            // 2. Migrar usuarios
            if (dbData['sig_users']) {
                const users = JSON.parse(dbData['sig_users']);
                for (const user of users) {
                    await connection.query(`
                        INSERT INTO users (id, name, email, role, department, tenant_id, status, is_superadmin)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `, [user.id, user.name, user.email, user.role, user.department || '', user.tenantId, user.status || 'Activo', user.isSuperadmin || false]);
                }
                console.log("Usuarios migrados.");
            }

            // 3. Migrar personal
            if (dbData['sig_personal']) {
                const staff = JSON.parse(dbData['sig_personal']);
                for (const emp of staff) {
                    await connection.query(`
                        INSERT INTO personal (id, name, role, dept, status, photo)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [emp.id, emp.name, emp.role || '', emp.dept || '', emp.status || 'Activo', emp.photo || '']);
                }
                console.log("Personal migrado.");
            }

            // 4. Migrar el resto de claves analizando su formato multi-tenant
            for (const key in dbData) {
                // Saltar las ya migradas
                if (['sig_organizations', 'sig_users', 'sig_personal'].includes(key)) continue;

                let baseKey = key;
                let tenantId = '1'; // Inquilino legacy predeterminado para claves sin sufijo

                const match = key.match(/^(sig_[a-zA-Z0-9_]+?)_([a-zA-Z0-9]+)$/);
                if (match) {
                    baseKey = match[1];
                    tenantId = match[2];
                }

                const value = dbData[key];
                if (!value) continue;

                // Configuración de Settings Globals / IA Logs
                if (['sig_active_tenant', 'sig_ai_compliance_active', 'sig_ai_compliance_logs', 'sig_ai_actions_count', 'sig_ai_last_check', 'sig_current_user'].includes(key)) {
                    await connection.query("INSERT INTO sige_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?", [key, String(value), String(value)]);
                    continue;
                }

                // Intentar parsear el contenido JSON
                let parsedContent;
                try {
                    parsedContent = JSON.parse(value);
                } catch(e) {
                    // Es un valor no JSON
                    await connection.query("INSERT INTO sige_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?", [key, String(value), String(value)]);
                    continue;
                }

                // Mapear claves a tablas
                if (baseKey === 'sig_document_manager') {
                    for (const doc of parsedContent) {
                        await connection.query(`
                            INSERT INTO documents (id, code, tipo, title, version, date, ambito, status, resp, tenant_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [doc.id, doc.code || '', doc.tipo || '', doc.title, doc.version || '', doc.date || '', doc.ambito || '', doc.status || '', doc.resp || '', tenantId]);
                    }
                } else if (baseKey === 'sig_requisitos_legales') {
                    for (const req of parsedContent) {
                        await connection.query(`
                            INSERT INTO requisitos_legales (id, tipo, titulo, \`desc\`, ambito, norma, estado, fecha_rev, responsable, enlace, tenant_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [req.id, req.tipo || '', req.titulo || '', req.desc || '', req.ambito || '', req.norma || '', req.estado || '', req.fechaRev || '', req.responsable || '', req.enlace || '', tenantId]);
                    }
                } else if (baseKey === 'sig_dafo') {
                    for (const row of parsedContent) {
                        await connection.query(`
                            INSERT INTO dafo (id, type, title, \`desc\`, impact, action, tenant_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `, [row.id, row.type, row.title, row.desc || '', row.impact || '', row.action || '', tenantId]);
                    }
                } else if (baseKey === 'sig_partes_interesadas') {
                    for (const pi of parsedContent) {
                        await connection.query(`
                            INSERT INTO partes_interesadas (id, name, category, type, influence, impact, requirements, action_plan, last_evaluation, next_evaluation, periodicity, history, tenant_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [pi.id, pi.name, pi.category || '', pi.type || '', pi.influence || '', pi.impact || '', JSON.stringify(pi.requirements || []), pi.actionPlan || '', pi.lastEvaluation || '', pi.nextEvaluation || '', parseInt(pi.periodicity) || 0, JSON.stringify(pi.history || []), tenantId]);
                    }
                } else if (baseKey === 'sig_cambios_ti') {
                    for (const ch of parsedContent) {
                        await connection.query(`
                            INSERT INTO cambios_ti (id, title, type, \`desc\`, ci, owner, impact, risk, date, tests, rollback, approver, status, tenant_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [ch.id, ch.title, ch.type || '', ch.desc || '', ch.ci || '', ch.owner || '', ch.impact || '', ch.risk || '', ch.date || '', ch.tests || '', ch.rollback || '', ch.approver || '', ch.status || '', tenantId]);
                    }
                } else if (baseKey === 'sig_bcp_processes') {
                    for (const p of parsedContent) {
                        await connection.query(`
                            INSERT INTO bcp_processes (id, name, mtpd, rto, rpo, imp_fin, imp_op, imp_rep, tenant_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [p.id, p.name, parseInt(p.mtpd) || 0, parseInt(p.rto) || 0, parseInt(p.rpo) || 0, parseInt(p.impFin) || 0, parseInt(p.impOp) || 0, parseInt(p.impRep) || 0, tenantId]);
                    }
                } else if (baseKey === 'sig_bcp_exercises') {
                    for (const ex of parsedContent) {
                        await connection.query(`
                            INSERT INTO bcp_exercises (id, title, date, scenario, target_rto, actual_rto, status, notes, tenant_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [ex.id, ex.title, ex.date || '', ex.scenario || '', parseInt(ex.targetRto) || 0, parseInt(ex.actualRto) || 0, ex.status || '', ex.notes || '', tenantId]);
                    }
                } else if (baseKey === 'sig_acciones_correctivas') {
                    for (const ac of parsedContent) {
                        await connection.query(`
                            INSERT INTO acciones_correctivas (id, origen, resumen, responsable, estado, tenant_id)
                            VALUES (?, ?, ?, ?, ?, ?)
                        `, [ac.id, ac.origen || '', ac.resumen || '', ac.responsable || '', ac.estado || '', tenantId]);
                    }
                } else if (baseKey === 'sig_audits_actions') {
                    for (const a of parsedContent) {
                        await connection.query(`
                            INSERT INTO audits_actions (id, audit_id, finding, \`desc\`, resp, deadline, status, tenant_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `, [a.id, a.auditId || '', a.finding || '', a.desc || '', a.resp || '', a.deadline || '', a.status || '', tenantId]);
                    }
                } else if (baseKey === 'sig_canal_denuncias') {
                    for (const d of parsedContent) {
                        await connection.query(`
                            INSERT INTO canal_denuncias (id, date, cat, priority, \`desc\`, dept, responsible, anonymous, reporter_name, reporter_contact, status, notes, closed_date, track_code, tenant_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [d.id, d.date || '', d.cat || '', d.priority || '', d.desc || '', d.dept || '', d.responsible || '', d.anonymous || false, d.reporterName || '', d.reporterContact || '', d.status || '', d.notes || '', d.closedDate || '', d.trackCode || '', tenantId]);
                    }
                } else if (baseKey === 'sig_procesos') {
                    for (const pr of parsedContent) {
                        await connection.query(`
                            INSERT INTO procesos (id, name, type, compliance, ok_kpis, warn_kpis, crit_kpis, owner, inputs, outputs, risks, activities, tenant_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [pr.id, pr.name, pr.type || '', parseInt(pr.compliance) || 0, parseInt(pr.okKpis) || 0, parseInt(pr.warnKpis) || 0, parseInt(pr.critKpis) || 0, pr.owner || '', pr.inputs || '', pr.outputs || '', JSON.stringify(pr.risks || {}), JSON.stringify(pr.activities || []), tenantId]);
                    }
                } else if (baseKey === 'sig_politicas_sgi') {
                    for (const pol of parsedContent) {
                        await connection.query(`
                            INSERT INTO politicas_sgi (id, name, norm, version, date, review, owner, status, scope, content, evidences, tenant_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [pol.id, pol.name, pol.norm || '', pol.version || '', pol.date || '', pol.review || '', pol.owner || '', pol.status || '', pol.scope || '', pol.content || '', JSON.stringify(pol.evidences || {}), tenantId]);
                    }
                } else if (baseKey === 'sig_compras_proveedores_data') {
                    await connection.query(`
                        INSERT INTO compras_proveedores_data (tenant_id, proveedores, pedidos, evaluaciones, incidencias)
                        VALUES (?, ?, ?, ?, ?)
                    `, [tenantId, JSON.stringify(parsedContent.proveedores || []), JSON.stringify(parsedContent.pedidos || []), JSON.stringify(parsedContent.evaluaciones || []), JSON.stringify(parsedContent.incidencias || [])]);
                } else if (baseKey === 'sig_incidencias_nc_data') {
                    await connection.query(`
                        INSERT INTO incidencias_nc_data (tenant_id, incidencias)
                        VALUES (?, ?)
                    `, [tenantId, JSON.stringify(parsedContent.incidencias || [])]);
                } else if (baseKey === 'sig_pedidos_clientes') {
                    for (const pc of parsedContent) {
                        await connection.query(`
                            INSERT INTO pedidos_clientes (id, name, type, svc_id, svc_name, concept, delivery, scope, demand_soporte, demand_infra, demand_material, status, tenant_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [pc.id, pc.name, pc.type || '', pc.svcId || '', pc.svcName || '', pc.concept || '', pc.delivery || '', pc.scope || '', parseInt(pc.demandSoporte) || 0, parseInt(pc.demandInfra) || 0, parseInt(pc.demandMaterial) || 0, pc.status || '', tenantId]);
                    }
                } else if (baseKey === 'sig_catalogo_general') {
                    for (const item of parsedContent) {
                        await connection.query(`
                            INSERT INTO catalogo_general (id, name, tipo, cat, cost, stock, min_stock, unit, tenant_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [item.id, item.name, item.tipo || '', item.cat || '', parseFloat(item.cost) || 0.0, parseInt(item.stock) || 0, parseInt(item.minStock) || 0, item.unit || '', tenantId]);
                    }
                } else if (baseKey === 'sig_desempeno_proveedores') {
                    for (const dp of parsedContent) {
                        await connection.query(`
                            INSERT INTO desempeno_proveedores (id, name, date, quality, delivery, support, compliance, avg, sla, owner, obs, tenant_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [dp.id, dp.name, dp.date || '', parseFloat(dp.quality) || 0, parseFloat(dp.delivery) || 0, parseFloat(dp.support) || 0, parseFloat(dp.compliance) || 0, parseFloat(dp.avg) || 0, parseFloat(dp.sla) || 0, dp.owner || '', dp.obs || '', tenantId]);
                    }
                } else if (baseKey === 'sig_inventario_equipos') {
                    for (const eq of parsedContent) {
                        await connection.query(`
                            INSERT INTO inventario_equipos (id, name, model, last_cal, next_cal, status, section, criticidad, tenant_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [eq.id, eq.name, eq.model || '', eq.lastCal || '', eq.nextCal || '', eq.status || '', eq.section || '', eq.criticidad || '', tenantId]);
                    }
                } else if (baseKey === 'sig_clima_laboral_encuestas') {
                    for (const cl of parsedContent) {
                        await connection.query(`
                            INSERT INTO clima_laboral_encuestas (id, fecha, periodo, empleado, respuestas, comentarios, score, tenant_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `, [cl.id, cl.fecha || '', cl.periodo || '', cl.empleado || '', JSON.stringify(cl.respuestas || {}), JSON.stringify(cl.comentarios || {}), parseFloat(cl.score) || 0, tenantId]);
                    }
                } else if (baseKey === 'sig_perfiles_cualificacion') {
                    for (const pf of parsedContent) {
                        await connection.query(`
                            INSERT INTO perfiles_cualificacion (id, name, dept, description, normas, status, competencias, educacion, experiencia, tenant_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [pf.id, pf.name, pf.dept || '', pf.description || '', JSON.stringify(pf.normas || []), pf.status || '', JSON.stringify(pf.competencias || []), pf.educacion || '', pf.experiencia || '', tenantId]);
                    }
                } else if (baseKey === 'sig_ens_checklist') {
                    for (const ch of parsedContent) {
                        await connection.query(`
                            INSERT INTO ens_checklist (id, pilar, name, \`desc\`, val, note, evidence, status, tenant_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [ch.id, ch.pilar || '', ch.name, ch.desc || '', ch.val || '', ch.note || '', ch.evidence || '', ch.status || '', tenantId]);
                    }
                } else if (baseKey === 'sig_management_review') {
                    // Puede ser un objeto o un string en db.json
                    const review = parsedContent;
                    await connection.query(`
                        INSERT INTO management_review (tenant_id, periodo, desempeno, trend, meta, aud_planificadas, aud_ejecutadas, capa_abiertas, capa_cerradas, capa_eficacia, resolucion, estado_sistema, proxima_revision, objetivos, riesgos)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [tenantId, review.periodo || '', parseFloat(review.desempeno) || 0, review.trend || '', parseFloat(review.meta) || 0, parseInt(review.audPlanificadas) || 0, parseInt(review.audEjecutadas) || 0, parseInt(review.capaAbiertas) || 0, parseInt(review.capaCerradas) || 0, parseFloat(review.capaEficacia) || 0, review.resolucion || '', review.estadoSistema || '', review.proximaRevision || '', JSON.stringify(review.objetivos || []), JSON.stringify(review.riesgos || [])]);
                } else {
                    // Cualquier otra clave no especificada va a sige_settings por precaución
                    await connection.query("INSERT INTO sige_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?", [key, String(value), String(value)]);
                }
            }

            console.log("¡Migración de datos de db.json a MariaDB completada exitosamente!");
            
            // Renombrar db.json a db.json.bak
            fs.renameSync(dbJsonPath, dbJsonPath + '.bak');
            console.log("Fichero db.json renombrado a db.json.bak como copia de seguridad.");
        }

    } catch (e) {
        console.error("Error crítico durante la migración del esquema / datos:", e);
        throw e;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    migrate().then(() => {
        console.log("Migración finalizada con éxito.");
        process.exit(0);
    }).catch(err => {
        console.error("Migración falló:", err);
        process.exit(1);
    });
}

module.exports = { migrate };
