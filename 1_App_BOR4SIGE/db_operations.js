const mysql = require('mysql2/promise');

// Helper para convertir nombres de columna camelCase a snake_case y viceversa
function toCamel(str) {
    return str.replace(/([-_][a-z])/g, group =>
        group.toUpperCase().replace('-', '').replace('_', '')
    );
}

function toSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

async function loadAllData(pool) {
    const dbCache = {};
    let connection;
    try {
        connection = await pool.getConnection();

        // 1. Cargar Settings e IA Logs (sige_settings)
        const [settingsRows] = await connection.query("SELECT * FROM sige_settings");
        for (const row of settingsRows) {
            dbCache[row.setting_key] = row.setting_value;
        }

        // 2. Cargar Organizaciones (sig_organizations)
        const [orgRows] = await connection.query("SELECT * FROM organizations");
        const orgs = {};
        for (const row of orgRows) {
            orgs[row.id] = {
                name: row.name,
                compliance: row.compliance,
                trend: row.trend,
                trendUp: row.trend_up === 1,
                capa: { total: row.capa_total, criticas: row.capa_criticas, abiertas: row.capa_abiertas },
                risks: { total: row.risks_total, mitigated: row.risks_mitigated, unmitigated: row.risks_unmitigated },
                audits: { planned: row.audits_planned, retrasada: row.audits_retrasada },
                ens: { c: row.ens_c, i: row.ens_i, d: row.ens_d, a: row.ens_a, t: row.ens_t },
                scores: {
                    iso9001: row.scores_iso9001,
                    iso14001: row.scores_iso14001,
                    iso45001: row.scores_iso45001,
                    iso27001: row.scores_iso27001,
                    iso22301: row.scores_iso22301,
                    iso37001: row.scores_iso37001,
                    iso37301: row.scores_iso37301,
                    iso20000: row.scores_iso20000,
                    iso27701: row.scores_iso27701,
                    ens: row.scores_ens
                },
                activities: typeof row.activities === 'string' ? JSON.parse(row.activities) : row.activities || [],
                alerts: typeof row.alerts === 'string' ? JSON.parse(row.alerts) : row.alerts || [],
                systems: typeof row.systems === 'string' ? JSON.parse(row.systems) : row.systems || {}
            };
        }
        dbCache['sig_organizations'] = JSON.stringify(orgs);

        // 3. Cargar Usuarios (sig_users)
        const [userRows] = await connection.query("SELECT * FROM users");
        const users = userRows.map(row => ({
            id: row.id,
            name: row.name,
            email: row.email,
            role: row.role,
            department: row.department,
            tenantId: row.tenant_id,
            status: row.status,
            isSuperadmin: row.is_superadmin === 1
        }));
        dbCache['sig_users'] = JSON.stringify(users);

        // 4. Cargar Personal (sig_personal)
        const [personalRows] = await connection.query("SELECT * FROM personal");
        const staff = personalRows.map(row => ({
            id: row.id,
            name: row.name,
            role: row.role,
            dept: row.dept,
            status: row.status,
            photo: row.photo
        }));
        dbCache['sig_personal'] = JSON.stringify(staff);

        // Helper para agrupar datos multi-tenant
        const groupAndStringify = (rows, key, rowFormatter) => {
            const groups = {};
            for (const row of rows) {
                const tenant = row.tenant_id || '1';
                if (!groups[tenant]) groups[tenant] = [];
                groups[tenant].push(rowFormatter(row));
            }
            for (const tenant in groups) {
                const cacheKey = tenant === '1' ? key : `${key}_${tenant}`;
                dbCache[cacheKey] = JSON.stringify(groups[tenant]);
            }
        };

        // Helper para objetos de tenant únicos (compras, incidencias, management_review)
        const groupObjectAndStringify = (rows, key, rowFormatter) => {
            for (const row of rows) {
                const tenant = row.tenant_id || '1';
                const cacheKey = tenant === '1' ? key : `${key}_${tenant}`;
                dbCache[cacheKey] = JSON.stringify(rowFormatter(row));
            }
        };

        // 5. Cargar Documents
        const [docRows] = await connection.query("SELECT * FROM documents");
        groupAndStringify(docRows, 'sig_document_manager', r => ({
            id: r.id, code: r.code, tipo: r.tipo, title: r.title, version: r.version, date: r.date, ambito: r.ambito, status: r.status, resp: r.resp
        }));

        // 6. Cargar Requisitos Legales
        const [reqRows] = await connection.query("SELECT * FROM requisitos_legales");
        groupAndStringify(reqRows, 'sig_requisitos_legales', r => ({
            id: r.id, tipo: r.tipo, titulo: r.titulo, desc: r.desc, ambito: r.ambito, norma: r.norma, estado: r.estado, fechaRev: r.fecha_rev, responsable: r.responsable, enlace: r.enlace
        }));

        // 7. Cargar DAFO
        const [dafoRows] = await connection.query("SELECT * FROM dafo");
        groupAndStringify(dafoRows, 'sig_dafo', r => ({
            id: r.id, type: r.type, title: r.title, desc: r.desc, impact: r.impact, action: r.action
        }));

        // 8. Cargar Partes Interesadas
        const [piRows] = await connection.query("SELECT * FROM partes_interesadas");
        groupAndStringify(piRows, 'sig_partes_interesadas', r => ({
            id: r.id, name: r.name, category: r.category, type: r.type, influence: r.influence, impact: r.impact,
            requirements: typeof r.requirements === 'string' ? JSON.parse(r.requirements) : r.requirements,
            actionPlan: r.action_plan, lastEvaluation: r.last_evaluation, nextEvaluation: r.next_evaluation,
            periodicity: r.periodicity,
            history: typeof r.history === 'string' ? JSON.parse(r.history) : r.history
        }));

        // 9. Cargar Cambios TI (RFC)
        const [rfcRows] = await connection.query("SELECT * FROM cambios_ti");
        groupAndStringify(rfcRows, 'sig_cambios_ti', r => ({
            id: r.id, title: r.title, type: r.type, desc: r.desc, ci: r.ci, owner: r.owner, impact: r.impact, risk: r.risk, date: r.date, tests: r.tests, rollback: r.rollback, approver: r.approver, status: r.status
        }));

        // 10. Cargar BCP Processes
        const [bcpProcRows] = await connection.query("SELECT * FROM bcp_processes");
        groupAndStringify(bcpProcRows, 'sig_bcp_processes', r => ({
            id: r.id, name: r.name, mtpd: r.mtpd, rto: r.rto, rpo: r.rpo, impFin: r.imp_fin, impOp: r.imp_op, impRep: r.imp_rep
        }));

        // 11. Cargar BCP Exercises
        const [bcpExRows] = await connection.query("SELECT * FROM bcp_exercises");
        groupAndStringify(bcpExRows, 'sig_bcp_exercises', r => ({
            id: r.id, title: r.title, date: r.date, scenario: r.scenario, targetRto: r.target_rto, actualRto: r.actual_rto, status: r.status, notes: r.notes
        }));

        // 12. Cargar Acciones Correctivas
        const [acRows] = await connection.query("SELECT * FROM acciones_correctivas");
        groupAndStringify(acRows, 'sig_acciones_correctivas', r => ({
            id: r.id, origen: r.origen, resumen: r.resumen, responsable: r.responsable, estado: r.estado
        }));

        // 13. Cargar Audits Actions
        const [audRows] = await connection.query("SELECT * FROM audits_actions");
        groupAndStringify(audRows, 'sig_audits_actions', r => ({
            id: r.id, auditId: r.audit_id, finding: r.finding, desc: r.desc, resp: r.resp, deadline: r.deadline, status: r.status
        }));

        // 14. Cargar Canal Denuncias
        const [denRows] = await connection.query("SELECT * FROM canal_denuncias");
        groupAndStringify(denRows, 'sig_canal_denuncias', r => ({
            id: r.id, date: r.date, cat: r.cat, priority: r.priority, desc: r.desc, dept: r.dept, responsible: r.responsible, anonymous: r.anonymous === 1, reporterName: r.reporter_name, reporterContact: r.reporter_contact, status: r.status, notes: r.notes, closedDate: r.closed_date, trackCode: r.track_code
        }));

        // 15. Cargar Procesos
        const [prRows] = await connection.query("SELECT * FROM procesos");
        groupAndStringify(prRows, 'sig_procesos', r => ({
            id: r.id, name: r.name, type: r.type, compliance: r.compliance, okKpis: r.ok_kpis, warnKpis: r.warn_kpis, critKpis: r.crit_kpis, owner: r.owner, inputs: r.inputs, outputs: r.outputs,
            risks: typeof r.risks === 'string' ? JSON.parse(r.risks) : r.risks,
            activities: typeof r.activities === 'string' ? JSON.parse(r.activities) : r.activities
        }));

        // 16. Cargar Politicas SGI
        const [polRows] = await connection.query("SELECT * FROM politicas_sgi");
        groupAndStringify(polRows, 'sig_politicas_sgi', r => ({
            id: r.id, name: r.name, norm: r.norm, version: r.version, date: r.date, review: r.review, owner: r.owner, status: r.status, scope: r.scope, content: r.content,
            evidences: typeof r.evidences === 'string' ? JSON.parse(r.evidences) : r.evidences
        }));

        // 17. Cargar Compras Proveedores Data
        const [comprasRows] = await connection.query("SELECT * FROM compras_proveedores_data");
        groupObjectAndStringify(comprasRows, 'sig_compras_proveedores_data', r => ({
            proveedores: typeof r.proveedores === 'string' ? JSON.parse(r.proveedores) : r.proveedores || [],
            pedidos: typeof r.pedidos === 'string' ? JSON.parse(r.pedidos) : r.pedidos || [],
            evaluaciones: typeof r.evaluaciones === 'string' ? JSON.parse(r.evaluaciones) : r.evaluaciones || [],
            incidencias: typeof r.incidencias === 'string' ? JSON.parse(r.incidencias) : r.incidencias || []
        }));

        // 18. Cargar Incidencias NC Data
        const [incNCRows] = await connection.query("SELECT * FROM incidencias_nc_data");
        groupObjectAndStringify(incNCRows, 'sig_incidencias_nc_data', r => ({
            incidencias: typeof r.incidencias === 'string' ? JSON.parse(r.incidencias) : r.incidencias || []
        }));

        // 19. Cargar Pedidos Clientes
        const [pedRows] = await connection.query("SELECT * FROM pedidos_clientes");
        groupAndStringify(pedRows, 'sig_pedidos_clientes', r => ({
            id: r.id, name: r.name, type: r.type, svcId: r.svc_id, svcName: r.svc_name, concept: r.concept, delivery: r.delivery, scope: r.scope, demandSoporte: r.demand_soporte, demandInfra: r.demand_infra, demandMaterial: r.demand_material, status: r.status
        }));

        // 20. Cargar Catalogo General
        const [catRows] = await connection.query("SELECT * FROM catalogo_general");
        groupAndStringify(catRows, 'sig_catalogo_general', r => ({
            id: r.id, name: r.name, tipo: r.tipo, cat: r.cat, cost: parseFloat(r.cost), stock: r.stock, minStock: r.min_stock, unit: r.unit
        }));

        // 21. Cargar Desempeño Proveedores
        const [desRows] = await connection.query("SELECT * FROM desempeno_proveedores");
        groupAndStringify(desRows, 'sig_desempeno_proveedores', r => ({
            id: r.id, name: r.name, date: r.date, quality: parseFloat(r.quality), delivery: parseFloat(r.delivery), support: parseFloat(r.support), compliance: parseFloat(r.compliance), avg: parseFloat(r.avg), sla: parseFloat(r.sla), owner: r.owner, obs: r.obs
        }));

        // 22. Cargar Inventario Equipos
        const [eqRows] = await connection.query("SELECT * FROM inventario_equipos");
        groupAndStringify(eqRows, 'sig_inventario_equipos', r => ({
            id: r.id, name: r.name, model: r.model, lastCal: r.last_cal, nextCal: r.next_cal, status: r.status, section: r.section, criticidad: r.criticidad
        }));

        // 23. Cargar Clima Laboral Encuestas
        const [climaRows] = await connection.query("SELECT * FROM clima_laboral_encuestas");
        groupAndStringify(climaRows, 'sig_clima_laboral_encuestas', r => ({
            id: r.id, fecha: r.fecha, periodo: r.periodo, empleado: r.empleado,
            respuestas: typeof r.respuestas === 'string' ? JSON.parse(r.respuestas) : r.respuestas,
            comentarios: typeof r.comentarios === 'string' ? JSON.parse(r.comentarios) : r.comentarios,
            score: parseFloat(r.score)
        }));

        // 24. Cargar Perfiles Cualificación
        const [perfRows] = await connection.query("SELECT * FROM perfiles_cualificacion");
        groupAndStringify(perfRows, 'sig_perfiles_cualificacion', r => ({
            id: r.id, name: r.name, dept: r.dept, description: r.description,
            normas: typeof r.normas === 'string' ? JSON.parse(r.normas) : r.normas,
            status: r.status,
            competencias: typeof r.competencias === 'string' ? JSON.parse(r.competencias) : r.competencias,
            educacion: r.educacion, experiencia: r.experiencia
        }));

        // 25. Cargar ENS Checklist
        const [ensCheckRows] = await connection.query("SELECT * FROM ens_checklist");
        groupAndStringify(ensCheckRows, 'sig_ens_checklist', r => ({
            id: r.id, pilar: r.pilar, name: r.name, desc: r.desc, val: r.val, note: r.note, evidence: r.evidence, status: r.status
        }));

        // 26. Cargar Management Review
        const [mngRows] = await connection.query("SELECT * FROM management_review");
        for (const r of mngRows) {
            const tenant = r.tenant_id || '1';
            const cacheKey = tenant === '1' ? 'sig_management_review' : `sig_management_review_${tenant}`;
            dbCache[cacheKey] = JSON.stringify({
                periodo: r.periodo, desempeno: parseFloat(r.desempeno), trend: r.trend, meta: parseFloat(r.meta),
                audPlanificadas: r.aud_planificadas, audEjecutadas: r.aud_ejecutadas,
                capaAbiertas: r.capa_abiertas, capaCerradas: r.capa_cerradas, capaEficacia: parseFloat(r.capa_eficacia),
                resolucion: r.resolucion, estadoSistema: r.estado_sistema, proximaRevision: r.proxima_revision,
                objetivos: typeof r.objetivos === 'string' ? JSON.parse(r.objetivos) : r.objetivos,
                riesgos: typeof r.riesgos === 'string' ? JSON.parse(r.riesgos) : r.riesgos
            });
        }

    } catch (e) {
        console.error("Error cargando base de datos MariaDB:", e);
        throw e;
    } finally {
        if (connection) connection.release();
    }
    return dbCache;
}

async function saveDataKey(pool, key, value) {
    let connection;
    try {
        connection = await pool.getConnection();

        // 1. Configuración de Settings Globals / IA Logs
        if (['sig_active_tenant', 'sig_ai_compliance_active', 'sig_ai_compliance_logs', 'sig_ai_actions_count', 'sig_ai_last_check', 'sig_current_user'].includes(key)) {
            if (value === null) {
                await connection.query("DELETE FROM sige_settings WHERE setting_key = ?", [key]);
            } else {
                await connection.query("INSERT INTO sige_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?", [key, String(value), String(value)]);
            }
            return;
        }

        // 2. Parsear el tenant e identificar la tabla
        let baseKey = key;
        let tenantId = '1';

        const match = key.match(/^(sig_[a-zA-Z0-9_]+?)_([a-zA-Z0-9]+)$/);
        if (match) {
            baseKey = match[1];
            tenantId = match[2];
        }

        if (value === null) {
            // Manejar borrado de claves completas por tenant
            await deleteTenantData(connection, baseKey, tenantId);
            return;
        }

        let parsedContent;
        try {
            parsedContent = typeof value === 'string' ? JSON.parse(value) : value;
        } catch (e) {
            // No es un objeto JSON, guardar en sige_settings como fallback de texto
            await connection.query("INSERT INTO sige_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?", [key, String(value), String(value)]);
            return;
        }

        // Iniciar transacción para garantizar la consistencia relacional
        await connection.beginTransaction();

        if (baseKey === 'sig_organizations') {
            // Reemplazar la lista completa de organizaciones
            const activeIds = Object.keys(parsedContent);
            if (activeIds.length > 0) {
                await connection.query("DELETE FROM organizations WHERE id NOT IN (?)", [activeIds]);
            } else {
                await connection.query("DELETE FROM organizations");
            }
            for (const orgId in parsedContent) {
                const org = parsedContent[orgId];
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
                    ON DUPLICATE KEY UPDATE 
                        name = VALUES(name), compliance = VALUES(compliance), trend = VALUES(trend), trend_up = VALUES(trend_up),
                        capa_total = VALUES(capa_total), capa_criticas = VALUES(capa_criticas), capa_abiertas = VALUES(capa_abiertas),
                        risks_total = VALUES(risks_total), risks_mitigated = VALUES(risks_mitigated), risks_unmitigated = VALUES(risks_unmitigated),
                        audits_planned = VALUES(audits_planned), audits_retrasada = VALUES(audits_retrasada),
                        ens_c = VALUES(ens_c), ens_i = VALUES(ens_i), ens_d = VALUES(ens_d), ens_a = VALUES(ens_a), ens_t = VALUES(ens_t),
                        scores_iso9001 = VALUES(scores_iso9001), scores_iso14001 = VALUES(scores_iso14001), scores_iso45001 = VALUES(scores_iso45001),
                        scores_iso27001 = VALUES(scores_iso27001), scores_iso22301 = VALUES(scores_iso22301), scores_iso37001 = VALUES(scores_iso37001),
                        scores_iso37301 = VALUES(scores_iso37301), scores_iso20000 = VALUES(scores_iso20000), scores_iso27701 = VALUES(scores_iso27701),
                        scores_ens = VALUES(scores_ens), activities = VALUES(activities), alerts = VALUES(alerts), systems = VALUES(systems)
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

        } else if (baseKey === 'sig_users') {
            const activeIds = parsedContent.map(u => u.id);
            if (activeIds.length > 0) {
                await connection.query("DELETE FROM users WHERE id NOT IN (?)", [activeIds]);
            } else {
                await connection.query("DELETE FROM users");
            }
            for (const user of parsedContent) {
                await connection.query(`
                    INSERT INTO users (id, name, email, role, department, tenant_id, status, is_superadmin)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        name = VALUES(name), email = VALUES(email), role = VALUES(role), department = VALUES(department),
                        tenant_id = VALUES(tenant_id), status = VALUES(status), is_superadmin = VALUES(is_superadmin)
                `, [user.id, user.name, user.email, user.role, user.department || '', user.tenantId, user.status || 'Activo', user.isSuperadmin || false]);
            }

        } else if (baseKey === 'sig_personal') {
            const activeIds = parsedContent.map(e => e.id);
            if (activeIds.length > 0) {
                await connection.query("DELETE FROM personal WHERE id NOT IN (?)", [activeIds]);
            } else {
                await connection.query("DELETE FROM personal");
            }
            for (const emp of parsedContent) {
                await connection.query(`
                    INSERT INTO personal (id, name, role, dept, status, photo)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        name = VALUES(name), role = VALUES(role), dept = VALUES(dept), status = VALUES(status), photo = VALUES(photo)
                `, [emp.id, emp.name, emp.role || '', emp.dept || '', emp.status || 'Activo', emp.photo || '']);
            }

        } else {
            // Guardar tablas multi-tenant relacionales
            await syncTenantTable(connection, baseKey, tenantId, parsedContent);
        }

        await connection.commit();

    } catch (e) {
        if (connection) await connection.rollback();
        console.error(`Error guardando clave ${key} en MariaDB:`, e);
        throw e;
    } finally {
        if (connection) connection.release();
    }
}

async function deleteTenantData(connection, baseKey, tenantId) {
    const tableMap = {
        'sig_document_manager': 'documents',
        'sig_requisitos_legales': 'requisitos_legales',
        'sig_dafo': 'dafo',
        'sig_partes_interesadas': 'partes_interesadas',
        'sig_cambios_ti': 'cambios_ti',
        'sig_bcp_processes': 'bcp_processes',
        'sig_bcp_exercises': 'bcp_exercises',
        'sig_acciones_correctivas': 'acciones_correctivas',
        'sig_audits_actions': 'audits_actions',
        'sig_canal_denuncias': 'canal_denuncias',
        'sig_procesos': 'procesos',
        'sig_politicas_sgi': 'politicas_sgi',
        'sig_compras_proveedores_data': 'compras_proveedores_data',
        'sig_incidencias_nc_data': 'incidencias_nc_data',
        'sig_pedidos_clientes': 'pedidos_clientes',
        'sig_catalogo_general': 'catalogo_general',
        'sig_desempeno_proveedores': 'desempeno_proveedores',
        'sig_inventario_equipos': 'inventario_equipos',
        'sig_clima_laboral_encuestas': 'clima_laboral_encuestas',
        'sig_perfiles_cualificacion': 'perfiles_cualificacion',
        'sig_ens_checklist': 'ens_checklist',
        'sig_management_review': 'management_review'
    };
    const table = tableMap[baseKey];
    if (table) {
        if (['compras_proveedores_data', 'incidencias_nc_data', 'management_review'].includes(table)) {
            await connection.query(`DELETE FROM ${table} WHERE tenant_id = ?`, [tenantId]);
        } else {
            await connection.query(`DELETE FROM ${table} WHERE tenant_id = ?`, [tenantId]);
        }
    }
}

async function syncTenantTable(connection, baseKey, tenantId, data) {
    if (baseKey === 'sig_document_manager') {
        const activeIds = data.map(d => d.id);
        if (activeIds.length > 0) {
            await connection.query("DELETE FROM documents WHERE tenant_id = ? AND id NOT IN (?)", [tenantId, activeIds]);
        } else {
            await connection.query("DELETE FROM documents WHERE tenant_id = ?", [tenantId]);
        }
        for (const doc of data) {
            await connection.query(`
                INSERT INTO documents (id, code, tipo, title, version, date, ambito, status, resp, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    code = VALUES(code), tipo = VALUES(tipo), title = VALUES(title), version = VALUES(version), 
                    date = VALUES(date), ambito = VALUES(ambito), status = VALUES(status), resp = VALUES(resp)
            `, [doc.id, doc.code || '', doc.tipo || '', doc.title, doc.version || '', doc.date || '', doc.ambito || '', doc.status || '', doc.resp || '', tenantId]);
        }
    } else if (baseKey === 'sig_requisitos_legales') {
        const activeIds = data.map(d => d.id);
        if (activeIds.length > 0) {
            await connection.query("DELETE FROM requisitos_legales WHERE tenant_id = ? AND id NOT IN (?)", [tenantId, activeIds]);
        } else {
            await connection.query("DELETE FROM requisitos_legales WHERE tenant_id = ?", [tenantId]);
        }
        for (const req of data) {
            await connection.query(`
                INSERT INTO requisitos_legales (id, tipo, titulo, \`desc\`, ambito, norma, estado, fecha_rev, responsable, enlace, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    tipo = VALUES(tipo), titulo = VALUES(titulo), \`desc\` = VALUES(\`desc\`), ambito = VALUES(ambito), 
                    norma = VALUES(norma), estado = VALUES(estado), fecha_rev = VALUES(fecha_rev), responsable = VALUES(responsable), enlace = VALUES(enlace)
            `, [req.id, req.tipo || '', req.titulo || '', req.desc || '', req.ambito || '', req.norma || '', req.estado || '', req.fechaRev || '', req.responsable || '', req.enlace || '', tenantId]);
        }
    } else if (baseKey === 'sig_dafo') {
        const activeIds = data.map(d => d.id);
        if (activeIds.length > 0) {
            await connection.query("DELETE FROM dafo WHERE tenant_id = ? AND id NOT IN (?)", [tenantId, activeIds]);
        } else {
            await connection.query("DELETE FROM dafo WHERE tenant_id = ?", [tenantId]);
        }
        for (const row of data) {
            await connection.query(`
                INSERT INTO dafo (id, type, title, \`desc\`, impact, action, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    type = VALUES(type), title = VALUES(title), \`desc\` = VALUES(\`desc\`), impact = VALUES(impact), action = VALUES(action)
            `, [row.id, row.type, row.title, row.desc || '', row.impact || '', row.action || '', tenantId]);
        }
    } else if (baseKey === 'sig_partes_interesadas') {
        const activeIds = data.map(d => d.id);
        if (activeIds.length > 0) {
            await connection.query("DELETE FROM partes_interesadas WHERE tenant_id = ? AND id NOT IN (?)", [tenantId, activeIds]);
        } else {
            await connection.query("DELETE FROM partes_interesadas WHERE tenant_id = ?", [tenantId]);
        }
        for (const pi of data) {
            await connection.query(`
                INSERT INTO partes_interesadas (id, name, category, type, influence, impact, requirements, action_plan, last_evaluation, next_evaluation, periodicity, history, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    name = VALUES(name), category = VALUES(category), type = VALUES(type), influence = VALUES(influence), impact = VALUES(impact),
                    requirements = VALUES(requirements), action_plan = VALUES(action_plan), last_evaluation = VALUES(last_evaluation), next_evaluation = VALUES(next_evaluation),
                    periodicity = VALUES(periodicity), history = VALUES(history)
            `, [pi.id, pi.name, pi.category || '', pi.type || '', pi.influence || '', pi.impact || '', JSON.stringify(pi.requirements || []), pi.actionPlan || '', pi.lastEvaluation || '', pi.nextEvaluation || '', parseInt(pi.periodicity) || 0, JSON.stringify(pi.history || []), tenantId]);
        }
    } else if (baseKey === 'sig_cambios_ti') {
        const activeIds = data.map(d => d.id);
        if (activeIds.length > 0) {
            await connection.query("DELETE FROM cambios_ti WHERE tenant_id = ? AND id NOT IN (?)", [tenantId, activeIds]);
        } else {
            await connection.query("DELETE FROM cambios_ti WHERE tenant_id = ?", [tenantId]);
        }
        for (const ch of data) {
            await connection.query(`
                INSERT INTO cambios_ti (id, title, type, \`desc\`, ci, owner, impact, risk, date, tests, rollback, approver, status, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    title = VALUES(title), type = VALUES(type), \`desc\` = VALUES(\`desc\`), ci = VALUES(ci), owner = VALUES(owner),
                    impact = VALUES(impact), risk = VALUES(risk), date = VALUES(date), tests = VALUES(tests), rollback = VALUES(rollback), approver = VALUES(approver), status = VALUES(status)
            `, [ch.id, ch.title, ch.type || '', ch.desc || '', ch.ci || '', ch.owner || '', ch.impact || '', ch.risk || '', ch.date || '', ch.tests || '', ch.rollback || '', ch.approver || '', ch.status || '', tenantId]);
        }
    } else if (baseKey === 'sig_bcp_processes') {
        const activeIds = data.map(d => d.id);
        if (activeIds.length > 0) {
            await connection.query("DELETE FROM bcp_processes WHERE tenant_id = ? AND id NOT IN (?)", [tenantId, activeIds]);
        } else {
            await connection.query("DELETE FROM bcp_processes WHERE tenant_id = ?", [tenantId]);
        }
        for (const p of data) {
            await connection.query(`
                INSERT INTO bcp_processes (id, name, mtpd, rto, rpo, imp_fin, imp_op, imp_rep, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    name = VALUES(name), mtpd = VALUES(mtpd), rto = VALUES(rto), rpo = VALUES(rpo), imp_fin = VALUES(imp_fin), imp_op = VALUES(imp_op), imp_rep = VALUES(imp_rep)
            `, [p.id, p.name, parseInt(p.mtpd) || 0, parseInt(p.rto) || 0, parseInt(p.rpo) || 0, parseInt(p.impFin) || 0, parseInt(p.impOp) || 0, parseInt(p.impRep) || 0, tenantId]);
        }
    } else if (baseKey === 'sig_bcp_exercises') {
        const activeIds = data.map(d => d.id);
        if (activeIds.length > 0) {
            await connection.query("DELETE FROM bcp_exercises WHERE tenant_id = ? AND id NOT IN (?)", [tenantId, activeIds]);
        } else {
            await connection.query("DELETE FROM bcp_exercises WHERE tenant_id = ?", [tenantId]);
        }
        for (const ex of data) {
            await connection.query(`
                INSERT INTO bcp_exercises (id, title, date, scenario, target_rto, actual_rto, status, notes, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    title = VALUES(title), date = VALUES(date), scenario = VALUES(scenario), target_rto = VALUES(target_rto), actual_rto = VALUES(actual_rto), status = VALUES(status), notes = VALUES(notes)
            `, [ex.id, ex.title, ex.date || '', ex.scenario || '', parseInt(ex.targetRto) || 0, parseInt(ex.actualRto) || 0, ex.status || '', ex.notes || '', tenantId]);
        }
    } else if (baseKey === 'sig_acciones_correctivas') {
        const activeIds = data.map(d => d.id);
        if (activeIds.length > 0) {
            await connection.query("DELETE FROM acciones_correctivas WHERE tenant_id = ? AND id NOT IN (?)", [tenantId, activeIds]);
        } else {
            await connection.query("DELETE FROM acciones_correctivas WHERE tenant_id = ?", [tenantId]);
        }
        for (const ac of data) {
            await connection.query(`
                INSERT INTO acciones_correctivas (id, origen, resumen, responsable, estado, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    origen = VALUES(origen), resumen = VALUES(resumen), responsable = VALUES(responsable), estado = VALUES(estado)
            `, [ac.id, ac.origen || '', ac.resumen || '', ac.responsable || '', ac.estado || '', tenantId]);
        }
    } else if (baseKey === 'sig_audits_actions') {
        const activeIds = data.map(d => d.id);
        if (activeIds.length > 0) {
            await connection.query("DELETE FROM audits_actions WHERE tenant_id = ? AND id NOT IN (?)", [tenantId, activeIds]);
        } else {
            await connection.query("DELETE FROM audits_actions WHERE tenant_id = ?", [tenantId]);
        }
        for (const a of data) {
            await connection.query(`
                INSERT INTO audits_actions (id, audit_id, finding, \`desc\`, resp, deadline, status, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    audit_id = VALUES(audit_id), finding = VALUES(finding), \`desc\` = VALUES(\`desc\`), resp = VALUES(resp), deadline = VALUES(deadline), status = VALUES(status)
            `, [a.id, a.auditId || '', a.finding || '', a.desc || '', a.resp || '', a.deadline || '', a.status || '', tenantId]);
        }
    } else if (baseKey === 'sig_canal_denuncias') {
        const activeIds = data.map(d => d.id);
        if (activeIds.length > 0) {
            await connection.query("DELETE FROM canal_denuncias WHERE tenant_id = ? AND id NOT IN (?)", [tenantId, activeIds]);
        } else {
            await connection.query("DELETE FROM canal_denuncias WHERE tenant_id = ?", [tenantId]);
        }
        for (const d of data) {
            await connection.query(`
                INSERT INTO canal_denuncias (id, date, cat, priority, \`desc\`, dept, responsible, anonymous, reporter_name, reporter_contact, status, notes, closed_date, track_code, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    date = VALUES(date), cat = VALUES(cat), priority = VALUES(priority), \`desc\` = VALUES(\`desc\`), dept = VALUES(dept), responsible = VALUES(responsible),
                    anonymous = VALUES(anonymous), reporter_name = VALUES(reporter_name), reporter_contact = VALUES(reporter_contact), status = VALUES(status), notes = VALUES(notes),
                    closed_date = VALUES(closed_date), track_code = VALUES(track_code)
            `, [d.id, d.date || '', d.cat || '', d.priority || '', d.desc || '', d.dept || '', d.responsible || '', d.anonymous || false, d.reporterName || '', d.reporterContact || '', d.status || '', d.notes || '', d.closedDate || '', d.trackCode || '', tenantId]);
        }
    } else if (baseKey === 'sig_procesos') {
        const activeIds = data.map(d => d.id);
        if (activeIds.length > 0) {
            await connection.query("DELETE FROM procesos WHERE tenant_id = ? AND id NOT IN (?)", [tenantId, activeIds]);
        } else {
            await connection.query("DELETE FROM procesos WHERE tenant_id = ?", [tenantId]);
        }
        for (const pr of data) {
            await connection.query(`
                INSERT INTO procesos (id, name, type, compliance, ok_kpis, warn_kpis, crit_kpis, owner, inputs, outputs, risks, activities, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    name = VALUES(name), type = VALUES(type), compliance = VALUES(compliance), ok_kpis = VALUES(ok_kpis), warn_kpis = VALUES(warn_kpis), crit_kpis = VALUES(crit_kpis),
                    owner = VALUES(owner), inputs = VALUES(inputs), outputs = VALUES(outputs), risks = VALUES(risks), activities = VALUES(activities)
            `, [pr.id, pr.name, pr.type || '', parseInt(pr.compliance) || 0, parseInt(pr.okKpis) || 0, parseInt(pr.warnKpis) || 0, parseInt(pr.critKpis) || 0, pr.owner || '', pr.inputs || '', pr.outputs || '', JSON.stringify(pr.risks || {}), JSON.stringify(pr.activities || []), tenantId]);
        }
    } else if (baseKey === 'sig_politicas_sgi') {
        const activeIds = data.map(d => d.id);
        if (activeIds.length > 0) {
            await connection.query("DELETE FROM politicas_sgi WHERE tenant_id = ? AND id NOT IN (?)", [tenantId, activeIds]);
        } else {
            await connection.query("DELETE FROM politicas_sgi WHERE tenant_id = ?", [tenantId]);
        }
        for (const pol of data) {
            await connection.query(`
                INSERT INTO politicas_sgi (id, name, norm, version, date, review, owner, status, scope, content, evidences, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    name = VALUES(name), norm = VALUES(norm), version = VALUES(version), date = VALUES(date), review = VALUES(review), owner = VALUES(owner),
                    status = VALUES(status), scope = VALUES(scope), content = VALUES(content), evidences = VALUES(evidences)
            `, [pol.id, pol.name, pol.norm || '', pol.version || '', pol.date || '', pol.review || '', pol.owner || '', pol.status || '', pol.scope || '', pol.content || '', JSON.stringify(pol.evidences || {}), tenantId]);
        }
    } else if (baseKey === 'sig_compras_proveedores_data') {
        await connection.query(`
            INSERT INTO compras_proveedores_data (tenant_id, proveedores, pedidos, evaluaciones, incidencias)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                proveedores = VALUES(proveedores), pedidos = VALUES(pedidos), evaluaciones = VALUES(evaluaciones), incidencias = VALUES(incidencias)
        `, [tenantId, JSON.stringify(data.proveedores || []), JSON.stringify(data.pedidos || []), JSON.stringify(data.evaluaciones || []), JSON.stringify(data.incidencias || [])]);
    } else if (baseKey === 'sig_incidencias_nc_data') {
        await connection.query(`
            INSERT INTO incidencias_nc_data (tenant_id, incidencias)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE incidencias = VALUES(incidencias)
        `, [tenantId, JSON.stringify(data.incidencias || [])]);
    } else if (baseKey === 'sig_pedidos_clientes') {
        const activeIds = data.map(d => d.id);
        if (activeIds.length > 0) {
            await connection.query("DELETE FROM pedidos_clientes WHERE tenant_id = ? AND id NOT IN (?)", [tenantId, activeIds]);
        } else {
            await connection.query("DELETE FROM pedidos_clientes WHERE tenant_id = ?", [tenantId]);
        }
        for (const pc of data) {
            await connection.query(`
                INSERT INTO pedidos_clientes (id, name, type, svc_id, svc_name, concept, delivery, scope, demand_soporte, demand_infra, demand_material, status, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    name = VALUES(name), type = VALUES(type), svc_id = VALUES(svc_id), svc_name = VALUES(svc_name), concept = VALUES(concept), delivery = VALUES(delivery),
                    scope = VALUES(scope), demand_soporte = VALUES(demand_soporte), demand_infra = VALUES(demand_infra), demand_material = VALUES(demand_material), status = VALUES(status)
            `, [pc.id, pc.name, pc.type || '', pc.svcId || '', pc.svcName || '', pc.concept || '', pc.delivery || '', pc.scope || '', parseInt(pc.demandSoporte) || 0, parseInt(pc.demandInfra) || 0, parseInt(pc.demandMaterial) || 0, pc.status || '', tenantId]);
        }
    } else if (baseKey === 'sig_catalogo_general') {
        const activeIds = data.map(d => d.id);
        if (activeIds.length > 0) {
            await connection.query("DELETE FROM catalogo_general WHERE tenant_id = ? AND id NOT IN (?)", [tenantId, activeIds]);
        } else {
            await connection.query("DELETE FROM catalogo_general WHERE tenant_id = ?", [tenantId]);
        }
        for (const item of data) {
            await connection.query(`
                INSERT INTO catalogo_general (id, name, tipo, cat, cost, stock, min_stock, unit, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    name = VALUES(name), tipo = VALUES(tipo), cat = VALUES(cat), cost = VALUES(cost), stock = VALUES(stock), min_stock = VALUES(min_stock), unit = VALUES(unit)
            `, [item.id, item.name, item.tipo || '', item.cat || '', parseFloat(item.cost) || 0.0, parseInt(item.stock) || 0, parseInt(item.minStock) || 0, item.unit || '', tenantId]);
        }
    } else if (baseKey === 'sig_desempeno_proveedores') {
        const activeIds = data.map(d => d.id);
        if (activeIds.length > 0) {
            await connection.query("DELETE FROM desempeno_proveedores WHERE tenant_id = ? AND id NOT IN (?)", [tenantId, activeIds]);
        } else {
            await connection.query("DELETE FROM desempeno_proveedores WHERE tenant_id = ?", [tenantId]);
        }
        for (const dp of data) {
            await connection.query(`
                INSERT INTO desempeno_proveedores (id, name, date, quality, delivery, support, compliance, avg, sla, owner, obs, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    name = VALUES(name), date = VALUES(date), quality = VALUES(quality), delivery = VALUES(delivery), support = VALUES(support),
                    compliance = VALUES(compliance), avg = VALUES(avg), sla = VALUES(sla), owner = VALUES(owner), obs = VALUES(obs)
            `, [dp.id, dp.name, dp.date || '', parseFloat(dp.quality) || 0, parseFloat(dp.delivery) || 0, parseFloat(dp.support) || 0, parseFloat(dp.compliance) || 0, parseFloat(dp.avg) || 0, parseFloat(dp.sla) || 0, dp.owner || '', dp.obs || '', tenantId]);
        }
    } else if (baseKey === 'sig_inventario_equipos') {
        const activeIds = data.map(d => d.id);
        if (activeIds.length > 0) {
            await connection.query("DELETE FROM inventario_equipos WHERE tenant_id = ? AND id NOT IN (?)", [tenantId, activeIds]);
        } else {
            await connection.query("DELETE FROM inventario_equipos WHERE tenant_id = ?", [tenantId]);
        }
        for (const eq of data) {
            await connection.query(`
                INSERT INTO inventario_equipos (id, name, model, last_cal, next_cal, status, section, criticidad, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    name = VALUES(name), model = VALUES(model), last_cal = VALUES(last_cal), next_cal = VALUES(next_cal), status = VALUES(status), section = VALUES(section), criticidad = VALUES(criticidad)
            `, [eq.id, eq.name, eq.model || '', eq.lastCal || '', eq.nextCal || '', eq.status || '', eq.section || '', eq.criticidad || '', tenantId]);
        }
    } else if (baseKey === 'sig_clima_laboral_encuestas') {
        const activeIds = data.map(d => d.id);
        if (activeIds.length > 0) {
            await connection.query("DELETE FROM clima_laboral_encuestas WHERE tenant_id = ? AND id NOT IN (?)", [tenantId, activeIds]);
        } else {
            await connection.query("DELETE FROM clima_laboral_encuestas WHERE tenant_id = ?", [tenantId]);
        }
        for (const cl of data) {
            await connection.query(`
                INSERT INTO clima_laboral_encuestas (id, fecha, periodo, empleado, respuestas, comentarios, score, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    fecha = VALUES(fecha), periodo = VALUES(periodo), empleado = VALUES(empleado), respuestas = VALUES(respuestas), comentarios = VALUES(comentarios), score = VALUES(score)
            `, [cl.id, cl.fecha || '', cl.periodo || '', cl.empleado || '', JSON.stringify(cl.respuestas || {}), JSON.stringify(cl.comentarios || {}), parseFloat(cl.score) || 0, tenantId]);
        }
    } else if (baseKey === 'sig_perfiles_cualificacion') {
        const activeIds = data.map(d => d.id);
        if (activeIds.length > 0) {
            await connection.query("DELETE FROM perfiles_cualificacion WHERE tenant_id = ? AND id NOT IN (?)", [tenantId, activeIds]);
        } else {
            await connection.query("DELETE FROM perfiles_cualificacion WHERE tenant_id = ?", [tenantId]);
        }
        for (const pf of data) {
            await connection.query(`
                INSERT INTO perfiles_cualificacion (id, name, dept, description, normas, status, competencies, educacion, experiencia, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    name = VALUES(name), dept = VALUES(dept), description = VALUES(description), normas = VALUES(normas), status = VALUES(status),
                    competencias = VALUES(competencias), educacion = VALUES(educacion), experiencia = VALUES(experiencia)
            `, [pf.id, pf.name, pf.dept || '', pf.description || '', JSON.stringify(pf.normas || []), pf.status || '', JSON.stringify(pf.competencias || []), pf.educacion || '', pf.experiencia || '', tenantId]);
        }
    } else if (baseKey === 'sig_ens_checklist') {
        const activeIds = data.map(d => d.id);
        if (activeIds.length > 0) {
            await connection.query("DELETE FROM ens_checklist WHERE tenant_id = ? AND id NOT IN (?)", [tenantId, activeIds]);
        } else {
            await connection.query("DELETE FROM ens_checklist WHERE tenant_id = ?", [tenantId]);
        }
        for (const ch of data) {
            await connection.query(`
                INSERT INTO ens_checklist (id, pilar, name, \`desc\`, val, note, evidence, status, tenant_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    pilar = VALUES(pilar), name = VALUES(name), \`desc\` = VALUES(\`desc\`), val = VALUES(val), note = VALUES(note), evidence = VALUES(evidence), status = VALUES(status)
            `, [ch.id, ch.pilar || '', ch.name, ch.desc || '', ch.val || '', ch.note || '', ch.evidence || '', ch.status || '', tenantId]);
        }
    } else if (baseKey === 'sig_management_review') {
        const review = data;
        await connection.query(`
            INSERT INTO management_review (tenant_id, periodo, desempeno, trend, meta, aud_planificadas, aud_ejecutadas, capa_abiertas, capa_cerradas, capa_eficacia, resolucion, estado_sistema, proxima_revision, objetivos, riesgos)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                periodo = VALUES(periodo), desempeno = VALUES(desempeno), trend = VALUES(trend), meta = VALUES(meta), aud_planificadas = VALUES(aud_planificadas),
                aud_ejecutadas = VALUES(aud_ejecutadas), capa_abiertas = VALUES(capa_abiertas), capa_cerradas = VALUES(capa_cerradas), capa_eficacia = VALUES(capa_eficacia),
                resolucion = VALUES(resolucion), estado_sistema = VALUES(estado_sistema), proxima_revision = VALUES(proxima_revision), objetivos = VALUES(objetivos), riesgos = VALUES(riesgos)
        `, [tenantId, review.periodo || '', parseFloat(review.desempeno) || 0, review.trend || '', parseFloat(review.meta) || 0, parseInt(review.audPlanificadas) || 0, parseInt(review.audEjecutadas) || 0, parseInt(review.capaAbiertas) || 0, parseInt(review.capaCerradas) || 0, parseFloat(review.capaEficacia) || 0, review.resolucion || '', review.estadoSistema || '', review.proximaRevision || '', JSON.stringify(review.objetivos || []), JSON.stringify(review.riesgos || [])]);
    }
}

module.exports = { loadAllData, saveDataKey };
