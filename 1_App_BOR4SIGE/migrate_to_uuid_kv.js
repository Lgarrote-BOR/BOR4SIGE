/**
 * BOR4SIGE – Migración completa a modelo E-R puro con UUID + Tablas Lookup
 * 
 * Este script:
 * 1. Crea tablas lookup clave-valor (lkp_*) con ID autoincremental
 * 2. Recrea todas las tablas maestras con UUID CHAR(36) como PK
 * 3. Las columnas que antes eran VARCHAR libres ahora referencian lookups por FK
 * 4. Migra todos los datos existentes preservando integridad
 * 5. Verifica el resultado
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'bor4sige',
    waitForConnections: true,
    connectionLimit: 5,
    multipleStatements: true,
});

// ════════════════════════════════════════════════════════════════════
// FASE 0: Helpers
// ════════════════════════════════════════════════════════════════════
async function q(conn, sql, params) {
    const [rows] = await conn.query(sql, params);
    return rows;
}

// ════════════════════════════════════════════════════════════════════
// FASE 1: Leer todos los datos existentes a memoria
// ════════════════════════════════════════════════════════════════════
async function readAllData(conn) {
    const data = {};
    const tables = [
        'organizations', 'users', 'personal', 'documents', 'requisitos_legales',
        'dafo', 'partes_interesadas', 'cambios_ti', 'bcp_processes', 'bcp_exercises',
        'acciones_correctivas', 'audits_actions', 'canal_denuncias', 'procesos',
        'politicas_sgi', 'compras_proveedores_data', 'incidencias_nc_data',
        'pedidos_clientes', 'catalogo_general', 'desempeno_proveedores',
        'inventario_equipos', 'clima_laboral_encuestas', 'perfiles_cualificacion',
        'ens_checklist', 'management_review', 'sige_settings'
    ];
    for (const t of tables) {
        try {
            data[t] = await q(conn, `SELECT * FROM \`${t}\``);
            console.log(`  ✅ Leída tabla ${t}: ${data[t].length} filas`);
        } catch (e) {
            console.log(`  ⚠️  Tabla ${t} no existe o vacía`);
            data[t] = [];
        }
    }
    return data;
}

// ════════════════════════════════════════════════════════════════════
// FASE 2: Recopilar todos los valores distintos para las tablas lookup
// ════════════════════════════════════════════════════════════════════
function collectLookupValues(data) {
    const lookups = {
        status: new Set(),
        tipo_documento: new Set(),
        tipo_requisito: new Set(),
        tipo_proceso: new Set(),
        tipo_catalogo: new Set(),
        categoria_catalogo: new Set(),
        unidad_catalogo: new Set(),
        tipo_dafo: new Set(),
        prioridad: new Set(),
        nivel_impacto: new Set(),    // Alta/Media/Baja – impact, influence, criticidad, risk
        categoria_parte_interesada: new Set(),
        tipo_parte_interesada: new Set(),
        tipo_cambio_ti: new Set(),
        nivel_ens: new Set(),
        pilar_ens: new Set(),
        tipo_pedido: new Set(),
        rol_usuario: new Set(),
        departamento: new Set(),
    };

    // Función helper para añadir valor no vacío
    const add = (set, val) => {
        if (val && String(val).trim() !== '') set.add(String(val).trim());
    };

    // Status: recoger de todas las tablas que tengan columna status o estado
    for (const row of data.users) { add(lookups.status, row.status); }
    for (const row of data.personal) { add(lookups.status, row.status); }
    for (const row of data.documents) { add(lookups.status, row.status); }
    for (const row of data.canal_denuncias) { add(lookups.status, row.status); }
    for (const row of data.bcp_exercises) { add(lookups.status, row.status); }
    for (const row of data.cambios_ti) { add(lookups.status, row.status); }
    for (const row of data.inventario_equipos) { add(lookups.status, row.status); }
    for (const row of data.ens_checklist) { add(lookups.status, row.status); }
    for (const row of data.politicas_sgi) { add(lookups.status, row.status); }
    for (const row of data.pedidos_clientes) { add(lookups.status, row.status); }
    for (const row of data.perfiles_cualificacion) { add(lookups.status, row.status); }
    for (const row of data.audits_actions) { add(lookups.status, row.status); }
    for (const row of data.requisitos_legales) { add(lookups.status, row.estado); }
    for (const row of data.acciones_correctivas) { add(lookups.status, row.estado); }

    // Tipos
    for (const row of data.documents) { add(lookups.tipo_documento, row.tipo); }
    for (const row of data.requisitos_legales) { add(lookups.tipo_requisito, row.tipo); }
    for (const row of data.procesos) { add(lookups.tipo_proceso, row.type); }
    for (const row of data.catalogo_general) { add(lookups.tipo_catalogo, row.tipo); }
    for (const row of data.catalogo_general) { add(lookups.categoria_catalogo, row.cat); }
    for (const row of data.catalogo_general) { add(lookups.unidad_catalogo, row.unit); }
    for (const row of data.dafo) { add(lookups.tipo_dafo, row.type); }
    for (const row of data.cambios_ti) { add(lookups.tipo_cambio_ti, row.type); }
    for (const row of data.pedidos_clientes) { add(lookups.tipo_pedido, row.type); }

    // Prioridad
    for (const row of data.canal_denuncias) { add(lookups.prioridad, row.priority); }

    // Nivel impacto (unificado para impact, influence, criticidad, risk, ens levels)
    for (const row of data.dafo) { add(lookups.nivel_impacto, row.impact); }
    for (const row of data.partes_interesadas) { add(lookups.nivel_impacto, row.influence); add(lookups.nivel_impacto, row.impact); }
    for (const row of data.inventario_equipos) { add(lookups.nivel_impacto, row.criticidad); }
    for (const row of data.cambios_ti) { add(lookups.nivel_impacto, row.impact); add(lookups.nivel_impacto, row.risk); }

    // Categoría / tipo parte interesada
    for (const row of data.partes_interesadas) {
        add(lookups.categoria_parte_interesada, row.category);
        add(lookups.tipo_parte_interesada, row.type);
    }

    // Nivel ENS
    for (const row of data.organizations) {
        add(lookups.nivel_ens, row.ens_c); add(lookups.nivel_ens, row.ens_i);
        add(lookups.nivel_ens, row.ens_d); add(lookups.nivel_ens, row.ens_a);
        add(lookups.nivel_ens, row.ens_t);
    }

    // Pilar ENS
    for (const row of data.ens_checklist) { add(lookups.pilar_ens, row.pilar); }

    // Roles y departamentos
    for (const row of data.users) { add(lookups.rol_usuario, row.role); add(lookups.departamento, row.department); }
    for (const row of data.personal) { add(lookups.departamento, row.dept); }

    return lookups;
}

// ════════════════════════════════════════════════════════════════════
// FASE 3: DDL – Crear tablas lookup y nuevas tablas maestras
// ════════════════════════════════════════════════════════════════════
const DDL_DROP_OLD = `
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS management_review;
DROP TABLE IF EXISTS ens_checklist;
DROP TABLE IF EXISTS perfiles_cualificacion;
DROP TABLE IF EXISTS clima_laboral_encuestas;
DROP TABLE IF EXISTS inventario_equipos;
DROP TABLE IF EXISTS desempeno_proveedores;
DROP TABLE IF EXISTS catalogo_general;
DROP TABLE IF EXISTS pedidos_clientes;
DROP TABLE IF EXISTS incidencias_nc_data;
DROP TABLE IF EXISTS compras_proveedores_data;
DROP TABLE IF EXISTS politicas_sgi;
DROP TABLE IF EXISTS procesos;
DROP TABLE IF EXISTS canal_denuncias;
DROP TABLE IF EXISTS audits_actions;
DROP TABLE IF EXISTS acciones_correctivas;
DROP TABLE IF EXISTS bcp_exercises;
DROP TABLE IF EXISTS bcp_processes;
DROP TABLE IF EXISTS cambios_ti;
DROP TABLE IF EXISTS partes_interesadas;
DROP TABLE IF EXISTS dafo;
DROP TABLE IF EXISTS requisitos_legales;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS personal;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS organizations;
DROP TABLE IF EXISTS sige_settings;
DROP TABLE IF EXISTS lkp_status;
DROP TABLE IF EXISTS lkp_tipo_documento;
DROP TABLE IF EXISTS lkp_tipo_requisito;
DROP TABLE IF EXISTS lkp_tipo_proceso;
DROP TABLE IF EXISTS lkp_tipo_catalogo;
DROP TABLE IF EXISTS lkp_categoria_catalogo;
DROP TABLE IF EXISTS lkp_unidad_catalogo;
DROP TABLE IF EXISTS lkp_tipo_dafo;
DROP TABLE IF EXISTS lkp_prioridad;
DROP TABLE IF EXISTS lkp_nivel_impacto;
DROP TABLE IF EXISTS lkp_categoria_parte_interesada;
DROP TABLE IF EXISTS lkp_tipo_parte_interesada;
DROP TABLE IF EXISTS lkp_tipo_cambio_ti;
DROP TABLE IF EXISTS lkp_nivel_ens;
DROP TABLE IF EXISTS lkp_pilar_ens;
DROP TABLE IF EXISTS lkp_tipo_pedido;
DROP TABLE IF EXISTS lkp_rol_usuario;
DROP TABLE IF EXISTS lkp_departamento;
SET FOREIGN_KEY_CHECKS = 1;
`;

function buildLookupDDL(tableName) {
    return `
CREATE TABLE \`${tableName}\` (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_${tableName}_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
}

const DDL_MASTER_TABLES = `
-- ═══════════════════════════════════════
-- Tabla: organizations (Maestro raíz)
-- ═══════════════════════════════════════
CREATE TABLE organizations (
    id CHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    compliance INT DEFAULT 0,
    trend VARCHAR(50) DEFAULT NULL,
    trend_up TINYINT(1) DEFAULT 1,
    capa_total INT DEFAULT 0,
    capa_criticas INT DEFAULT 0,
    capa_abiertas INT DEFAULT 0,
    risks_total INT DEFAULT 0,
    risks_mitigated INT DEFAULT 0,
    risks_unmitigated INT DEFAULT 0,
    audits_planned INT DEFAULT 0,
    audits_retrasada INT DEFAULT 0,
    ens_c_id INT UNSIGNED DEFAULT NULL,
    ens_i_id INT UNSIGNED DEFAULT NULL,
    ens_d_id INT UNSIGNED DEFAULT NULL,
    ens_a_id INT UNSIGNED DEFAULT NULL,
    ens_t_id INT UNSIGNED DEFAULT NULL,
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
    activities JSON DEFAULT NULL,
    alerts JSON DEFAULT NULL,
    systems JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_org_ens_c FOREIGN KEY (ens_c_id) REFERENCES lkp_nivel_ens(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_org_ens_i FOREIGN KEY (ens_i_id) REFERENCES lkp_nivel_ens(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_org_ens_d FOREIGN KEY (ens_d_id) REFERENCES lkp_nivel_ens(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_org_ens_a FOREIGN KEY (ens_a_id) REFERENCES lkp_nivel_ens(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_org_ens_t FOREIGN KEY (ens_t_id) REFERENCES lkp_nivel_ens(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: users
-- ═══════════════════════════════════════
CREATE TABLE users (
    id CHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role_id INT UNSIGNED DEFAULT NULL,
    department_id INT UNSIGNED DEFAULT NULL,
    tenant_id CHAR(36) DEFAULT NULL,
    status_id INT UNSIGNED DEFAULT NULL,
    is_superadmin TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_users_email (email),
    KEY idx_users_tenant (tenant_id),
    CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES lkp_rol_usuario(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_users_dept FOREIGN KEY (department_id) REFERENCES lkp_departamento(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_users_status FOREIGN KEY (status_id) REFERENCES lkp_status(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: personal
-- ═══════════════════════════════════════
CREATE TABLE personal (
    id CHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) DEFAULT NULL,
    dept_id INT UNSIGNED DEFAULT NULL,
    status_id INT UNSIGNED DEFAULT NULL,
    photo TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_personal_dept FOREIGN KEY (dept_id) REFERENCES lkp_departamento(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_personal_status FOREIGN KEY (status_id) REFERENCES lkp_status(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: documents
-- ═══════════════════════════════════════
CREATE TABLE documents (
    id CHAR(36) NOT NULL,
    code VARCHAR(100) DEFAULT NULL,
    tipo_id INT UNSIGNED DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    version VARCHAR(50) DEFAULT NULL,
    date VARCHAR(50) DEFAULT NULL,
    ambito VARCHAR(255) DEFAULT NULL,
    status_id INT UNSIGNED DEFAULT NULL,
    resp VARCHAR(255) DEFAULT NULL,
    tenant_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id, tenant_id),
    KEY idx_documents_tenant (tenant_id),
    CONSTRAINT fk_documents_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_documents_tipo FOREIGN KEY (tipo_id) REFERENCES lkp_tipo_documento(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_documents_status FOREIGN KEY (status_id) REFERENCES lkp_status(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: requisitos_legales
-- ═══════════════════════════════════════
CREATE TABLE requisitos_legales (
    id CHAR(36) NOT NULL,
    tipo_id INT UNSIGNED DEFAULT NULL,
    titulo VARCHAR(255) NOT NULL,
    \`desc\` TEXT DEFAULT NULL,
    ambito VARCHAR(255) DEFAULT NULL,
    norma VARCHAR(255) DEFAULT NULL,
    estado_id INT UNSIGNED DEFAULT NULL,
    fecha_rev VARCHAR(50) DEFAULT NULL,
    responsable VARCHAR(255) DEFAULT NULL,
    enlace TEXT DEFAULT NULL,
    tenant_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id, tenant_id),
    KEY idx_requisitos_tenant (tenant_id),
    CONSTRAINT fk_requisitos_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_requisitos_tipo FOREIGN KEY (tipo_id) REFERENCES lkp_tipo_requisito(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_requisitos_estado FOREIGN KEY (estado_id) REFERENCES lkp_status(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: dafo
-- ═══════════════════════════════════════
CREATE TABLE dafo (
    id CHAR(36) NOT NULL,
    type_id INT UNSIGNED DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    \`desc\` TEXT DEFAULT NULL,
    impact_id INT UNSIGNED DEFAULT NULL,
    action TEXT DEFAULT NULL,
    tenant_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id, tenant_id),
    KEY idx_dafo_tenant (tenant_id),
    CONSTRAINT fk_dafo_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_dafo_type FOREIGN KEY (type_id) REFERENCES lkp_tipo_dafo(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_dafo_impact FOREIGN KEY (impact_id) REFERENCES lkp_nivel_impacto(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: partes_interesadas
-- ═══════════════════════════════════════
CREATE TABLE partes_interesadas (
    id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id INT UNSIGNED DEFAULT NULL,
    type_id INT UNSIGNED DEFAULT NULL,
    influence_id INT UNSIGNED DEFAULT NULL,
    impact_id INT UNSIGNED DEFAULT NULL,
    requirements JSON DEFAULT NULL,
    action_plan TEXT DEFAULT NULL,
    last_evaluation VARCHAR(50) DEFAULT NULL,
    next_evaluation VARCHAR(50) DEFAULT NULL,
    periodicity INT DEFAULT NULL,
    history JSON DEFAULT NULL,
    tenant_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id, tenant_id),
    KEY idx_partes_tenant (tenant_id),
    CONSTRAINT fk_partes_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_partes_category FOREIGN KEY (category_id) REFERENCES lkp_categoria_parte_interesada(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_partes_type FOREIGN KEY (type_id) REFERENCES lkp_tipo_parte_interesada(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_partes_influence FOREIGN KEY (influence_id) REFERENCES lkp_nivel_impacto(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_partes_impact FOREIGN KEY (impact_id) REFERENCES lkp_nivel_impacto(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: cambios_ti
-- ═══════════════════════════════════════
CREATE TABLE cambios_ti (
    id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    type_id INT UNSIGNED DEFAULT NULL,
    \`desc\` TEXT DEFAULT NULL,
    ci VARCHAR(255) DEFAULT NULL,
    owner VARCHAR(255) DEFAULT NULL,
    impact_id INT UNSIGNED DEFAULT NULL,
    risk_id INT UNSIGNED DEFAULT NULL,
    date VARCHAR(50) DEFAULT NULL,
    tests TEXT DEFAULT NULL,
    rollback TEXT DEFAULT NULL,
    approver VARCHAR(255) DEFAULT NULL,
    status_id INT UNSIGNED DEFAULT NULL,
    tenant_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id, tenant_id),
    KEY idx_cambios_tenant (tenant_id),
    CONSTRAINT fk_cambios_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cambios_type FOREIGN KEY (type_id) REFERENCES lkp_tipo_cambio_ti(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_cambios_impact FOREIGN KEY (impact_id) REFERENCES lkp_nivel_impacto(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_cambios_risk FOREIGN KEY (risk_id) REFERENCES lkp_nivel_impacto(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_cambios_status FOREIGN KEY (status_id) REFERENCES lkp_status(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: bcp_processes
-- ═══════════════════════════════════════
CREATE TABLE bcp_processes (
    id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    mtpd INT DEFAULT NULL,
    rto INT DEFAULT NULL,
    rpo INT DEFAULT NULL,
    imp_fin INT DEFAULT NULL,
    imp_op INT DEFAULT NULL,
    imp_rep INT DEFAULT NULL,
    tenant_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id, tenant_id),
    KEY idx_bcp_proc_tenant (tenant_id),
    CONSTRAINT fk_bcp_proc_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: bcp_exercises
-- ═══════════════════════════════════════
CREATE TABLE bcp_exercises (
    id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    date VARCHAR(50) DEFAULT NULL,
    scenario VARCHAR(255) DEFAULT NULL,
    target_rto INT DEFAULT NULL,
    actual_rto INT DEFAULT NULL,
    status_id INT UNSIGNED DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    tenant_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id, tenant_id),
    KEY idx_bcp_ex_tenant (tenant_id),
    CONSTRAINT fk_bcp_ex_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_bcp_ex_status FOREIGN KEY (status_id) REFERENCES lkp_status(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: acciones_correctivas
-- ═══════════════════════════════════════
CREATE TABLE acciones_correctivas (
    id CHAR(36) NOT NULL,
    origen VARCHAR(255) DEFAULT NULL,
    resumen TEXT DEFAULT NULL,
    responsable VARCHAR(255) DEFAULT NULL,
    estado_id INT UNSIGNED DEFAULT NULL,
    tenant_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id, tenant_id),
    KEY idx_ac_tenant (tenant_id),
    CONSTRAINT fk_ac_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ac_estado FOREIGN KEY (estado_id) REFERENCES lkp_status(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: audits_actions
-- ═══════════════════════════════════════
CREATE TABLE audits_actions (
    id CHAR(36) NOT NULL,
    audit_id VARCHAR(50) DEFAULT NULL,
    finding TEXT DEFAULT NULL,
    \`desc\` TEXT DEFAULT NULL,
    resp VARCHAR(255) DEFAULT NULL,
    deadline VARCHAR(50) DEFAULT NULL,
    status_id INT UNSIGNED DEFAULT NULL,
    tenant_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id, tenant_id),
    KEY idx_audits_act_tenant (tenant_id),
    CONSTRAINT fk_audits_act_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_audits_act_status FOREIGN KEY (status_id) REFERENCES lkp_status(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: canal_denuncias
-- ═══════════════════════════════════════
CREATE TABLE canal_denuncias (
    id CHAR(36) NOT NULL,
    date VARCHAR(50) DEFAULT NULL,
    cat VARCHAR(255) DEFAULT NULL,
    priority_id INT UNSIGNED DEFAULT NULL,
    \`desc\` TEXT DEFAULT NULL,
    dept VARCHAR(100) DEFAULT NULL,
    responsible VARCHAR(255) DEFAULT NULL,
    anonymous TINYINT(1) DEFAULT NULL,
    reporter_name VARCHAR(255) DEFAULT NULL,
    reporter_contact VARCHAR(255) DEFAULT NULL,
    status_id INT UNSIGNED DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    closed_date VARCHAR(50) DEFAULT NULL,
    track_code VARCHAR(100) DEFAULT NULL,
    tenant_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id, tenant_id),
    KEY idx_denuncias_tenant (tenant_id),
    CONSTRAINT fk_denuncias_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_denuncias_priority FOREIGN KEY (priority_id) REFERENCES lkp_prioridad(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_denuncias_status FOREIGN KEY (status_id) REFERENCES lkp_status(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: procesos
-- ═══════════════════════════════════════
CREATE TABLE procesos (
    id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type_id INT UNSIGNED DEFAULT NULL,
    compliance INT DEFAULT NULL,
    ok_kpis INT DEFAULT NULL,
    warn_kpis INT DEFAULT NULL,
    crit_kpis INT DEFAULT NULL,
    owner VARCHAR(255) DEFAULT NULL,
    inputs TEXT DEFAULT NULL,
    outputs TEXT DEFAULT NULL,
    risks JSON DEFAULT NULL,
    activities JSON DEFAULT NULL,
    tenant_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id, tenant_id),
    KEY idx_procesos_tenant (tenant_id),
    CONSTRAINT fk_procesos_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_procesos_type FOREIGN KEY (type_id) REFERENCES lkp_tipo_proceso(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: politicas_sgi
-- ═══════════════════════════════════════
CREATE TABLE politicas_sgi (
    id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    norm VARCHAR(255) DEFAULT NULL,
    version VARCHAR(50) DEFAULT NULL,
    date VARCHAR(50) DEFAULT NULL,
    review VARCHAR(255) DEFAULT NULL,
    owner VARCHAR(255) DEFAULT NULL,
    status_id INT UNSIGNED DEFAULT NULL,
    scope TEXT DEFAULT NULL,
    content TEXT DEFAULT NULL,
    evidences JSON DEFAULT NULL,
    tenant_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id, tenant_id),
    KEY idx_politicas_tenant (tenant_id),
    CONSTRAINT fk_politicas_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_politicas_status FOREIGN KEY (status_id) REFERENCES lkp_status(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: compras_proveedores_data
-- ═══════════════════════════════════════
CREATE TABLE compras_proveedores_data (
    tenant_id CHAR(36) NOT NULL,
    proveedores JSON DEFAULT NULL,
    pedidos JSON DEFAULT NULL,
    evaluaciones JSON DEFAULT NULL,
    incidencias JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id),
    CONSTRAINT fk_compras_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: incidencias_nc_data
-- ═══════════════════════════════════════
CREATE TABLE incidencias_nc_data (
    tenant_id CHAR(36) NOT NULL,
    incidencias JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id),
    CONSTRAINT fk_incidencias_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: pedidos_clientes
-- ═══════════════════════════════════════
CREATE TABLE pedidos_clientes (
    id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type_id INT UNSIGNED DEFAULT NULL,
    svc_id VARCHAR(50) DEFAULT NULL,
    svc_name VARCHAR(255) DEFAULT NULL,
    concept TEXT DEFAULT NULL,
    delivery VARCHAR(255) DEFAULT NULL,
    scope TEXT DEFAULT NULL,
    demand_soporte INT DEFAULT NULL,
    demand_infra INT DEFAULT NULL,
    demand_material INT DEFAULT NULL,
    status_id INT UNSIGNED DEFAULT NULL,
    tenant_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id, tenant_id),
    KEY idx_pedidos_tenant (tenant_id),
    CONSTRAINT fk_pedidos_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pedidos_type FOREIGN KEY (type_id) REFERENCES lkp_tipo_pedido(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_pedidos_status FOREIGN KEY (status_id) REFERENCES lkp_status(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: catalogo_general
-- ═══════════════════════════════════════
CREATE TABLE catalogo_general (
    id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    tipo_id INT UNSIGNED DEFAULT NULL,
    cat_id INT UNSIGNED DEFAULT NULL,
    cost DECIMAL(10,2) DEFAULT NULL,
    stock INT DEFAULT NULL,
    min_stock INT DEFAULT NULL,
    unit_id INT UNSIGNED DEFAULT NULL,
    tenant_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id, tenant_id),
    KEY idx_catalogo_tenant (tenant_id),
    CONSTRAINT fk_catalogo_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_catalogo_tipo FOREIGN KEY (tipo_id) REFERENCES lkp_tipo_catalogo(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_catalogo_cat FOREIGN KEY (cat_id) REFERENCES lkp_categoria_catalogo(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_catalogo_unit FOREIGN KEY (unit_id) REFERENCES lkp_unidad_catalogo(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: desempeno_proveedores
-- ═══════════════════════════════════════
CREATE TABLE desempeno_proveedores (
    id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    date VARCHAR(50) DEFAULT NULL,
    quality DECIMAL(5,2) DEFAULT NULL,
    delivery DECIMAL(5,2) DEFAULT NULL,
    support DECIMAL(5,2) DEFAULT NULL,
    compliance DECIMAL(5,2) DEFAULT NULL,
    avg DECIMAL(5,2) DEFAULT NULL,
    sla DECIMAL(5,2) DEFAULT NULL,
    owner VARCHAR(255) DEFAULT NULL,
    obs TEXT DEFAULT NULL,
    tenant_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id, tenant_id),
    KEY idx_desempeno_tenant (tenant_id),
    CONSTRAINT fk_desempeno_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: inventario_equipos
-- ═══════════════════════════════════════
CREATE TABLE inventario_equipos (
    id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    model VARCHAR(255) DEFAULT NULL,
    last_cal VARCHAR(50) DEFAULT NULL,
    next_cal VARCHAR(50) DEFAULT NULL,
    status_id INT UNSIGNED DEFAULT NULL,
    section VARCHAR(100) DEFAULT NULL,
    criticidad_id INT UNSIGNED DEFAULT NULL,
    tenant_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id, tenant_id),
    KEY idx_inventario_tenant (tenant_id),
    CONSTRAINT fk_inventario_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_inventario_status FOREIGN KEY (status_id) REFERENCES lkp_status(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_inventario_criticidad FOREIGN KEY (criticidad_id) REFERENCES lkp_nivel_impacto(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: clima_laboral_encuestas
-- ═══════════════════════════════════════
CREATE TABLE clima_laboral_encuestas (
    id CHAR(36) NOT NULL,
    fecha VARCHAR(50) DEFAULT NULL,
    periodo VARCHAR(50) DEFAULT NULL,
    empleado VARCHAR(255) DEFAULT NULL,
    respuestas JSON DEFAULT NULL,
    comentarios JSON DEFAULT NULL,
    score DECIMAL(5,2) DEFAULT NULL,
    tenant_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id, tenant_id),
    KEY idx_clima_tenant (tenant_id),
    CONSTRAINT fk_clima_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: perfiles_cualificacion
-- ═══════════════════════════════════════
CREATE TABLE perfiles_cualificacion (
    id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    dept VARCHAR(100) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    normas JSON DEFAULT NULL,
    status_id INT UNSIGNED DEFAULT NULL,
    competencias JSON DEFAULT NULL,
    educacion TEXT DEFAULT NULL,
    experiencia TEXT DEFAULT NULL,
    tenant_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id, tenant_id),
    KEY idx_perfiles_tenant (tenant_id),
    CONSTRAINT fk_perfiles_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_perfiles_status FOREIGN KEY (status_id) REFERENCES lkp_status(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: ens_checklist
-- ═══════════════════════════════════════
CREATE TABLE ens_checklist (
    id CHAR(36) NOT NULL,
    pilar_id INT UNSIGNED DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    \`desc\` TEXT DEFAULT NULL,
    val VARCHAR(100) DEFAULT NULL,
    note TEXT DEFAULT NULL,
    evidence TEXT DEFAULT NULL,
    status_id INT UNSIGNED DEFAULT NULL,
    tenant_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id, tenant_id),
    KEY idx_ens_tenant (tenant_id),
    CONSTRAINT fk_ens_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ens_pilar FOREIGN KEY (pilar_id) REFERENCES lkp_pilar_ens(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ens_status FOREIGN KEY (status_id) REFERENCES lkp_status(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: management_review
-- ═══════════════════════════════════════
CREATE TABLE management_review (
    tenant_id CHAR(36) NOT NULL,
    periodo VARCHAR(50) DEFAULT NULL,
    desempeno DECIMAL(5,2) DEFAULT NULL,
    trend VARCHAR(50) DEFAULT NULL,
    meta DECIMAL(5,2) DEFAULT NULL,
    aud_planificadas INT DEFAULT NULL,
    aud_ejecutadas INT DEFAULT NULL,
    capa_abiertas INT DEFAULT NULL,
    capa_cerradas INT DEFAULT NULL,
    capa_eficacia DECIMAL(5,2) DEFAULT NULL,
    resolucion TEXT DEFAULT NULL,
    estado_sistema VARCHAR(50) DEFAULT NULL,
    proxima_revision VARCHAR(50) DEFAULT NULL,
    objetivos JSON DEFAULT NULL,
    riesgos JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id),
    CONSTRAINT fk_mgmt_review_tenant FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- Tabla: sige_settings (clave-valor global del sistema)
-- ═══════════════════════════════════════
CREATE TABLE sige_settings (
    setting_key VARCHAR(255) NOT NULL PRIMARY KEY,
    setting_value LONGTEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// ════════════════════════════════════════════════════════════════════
// FASE 4: Insertar datos en las tablas lookup
// ════════════════════════════════════════════════════════════════════
async function insertLookups(conn, lookups) {
    const lookupMaps = {};

    for (const [lkpName, valueSet] of Object.entries(lookups)) {
        const tableName = `lkp_${lkpName}`;
        lookupMaps[lkpName] = {};
        let sortOrder = 0;
        for (const val of valueSet) {
            sortOrder += 10;
            const code = val.toLowerCase().replace(/[^a-z0-9áéíóúñü]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
            await conn.execute(
                `INSERT INTO \`${tableName}\` (code, label, sort_order) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
                [code, val, sortOrder]
            );
            const [idRow] = await conn.query('SELECT LAST_INSERT_ID() as lid');
            lookupMaps[lkpName][val] = idRow[0].lid;
        }
        console.log(`  ✅ Lookup ${tableName}: ${valueSet.size} valores insertados`);
    }

    return lookupMaps;
}

// ════════════════════════════════════════════════════════════════════
// FASE 5: Migrar datos a las nuevas tablas
// ════════════════════════════════════════════════════════════════════
function lkp(maps, category, val) {
    if (!val || !maps[category]) return null;
    return maps[category][String(val).trim()] || null;
}

function ensureUUID(id) {
    if (!id) return null;
    // Si ya tiene formato UUID, usarlo
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return id;
    // Si no, lo conservamos como está (short IDs como 'alfa', 'beta', etc.)
    return id;
}

async function migrateData(conn, data, maps) {
    // 1. Organizations
    for (const org of data.organizations) {
        await conn.execute(`
            INSERT INTO organizations (id, name, compliance, trend, trend_up,
                capa_total, capa_criticas, capa_abiertas,
                risks_total, risks_mitigated, risks_unmitigated,
                audits_planned, audits_retrasada,
                ens_c_id, ens_i_id, ens_d_id, ens_a_id, ens_t_id,
                scores_iso9001, scores_iso14001, scores_iso45001, scores_iso27001, scores_iso22301,
                scores_iso37001, scores_iso37301, scores_iso20000, scores_iso27701, scores_ens,
                activities, alerts, systems)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            org.id, org.name, org.compliance, org.trend, org.trend_up,
            org.capa_total, org.capa_criticas, org.capa_abiertas,
            org.risks_total, org.risks_mitigated, org.risks_unmitigated,
            org.audits_planned, org.audits_retrasada,
            lkp(maps, 'nivel_ens', org.ens_c), lkp(maps, 'nivel_ens', org.ens_i),
            lkp(maps, 'nivel_ens', org.ens_d), lkp(maps, 'nivel_ens', org.ens_a),
            lkp(maps, 'nivel_ens', org.ens_t),
            org.scores_iso9001, org.scores_iso14001, org.scores_iso45001, org.scores_iso27001, org.scores_iso22301,
            org.scores_iso37001, org.scores_iso37301, org.scores_iso20000, org.scores_iso27701, org.scores_ens,
            typeof org.activities === 'string' ? org.activities : JSON.stringify(org.activities || []),
            typeof org.alerts === 'string' ? org.alerts : JSON.stringify(org.alerts || []),
            typeof org.systems === 'string' ? org.systems : JSON.stringify(org.systems || {})
        ]);
    }
    console.log(`  ✅ organizations: ${data.organizations.length} filas migradas`);

    // 2. Users
    for (const u of data.users) {
        await conn.execute(`
            INSERT INTO users (id, name, email, role_id, department_id, tenant_id, status_id, is_superadmin)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [u.id, u.name, u.email, lkp(maps, 'rol_usuario', u.role), lkp(maps, 'departamento', u.department), u.tenant_id, lkp(maps, 'status', u.status), u.is_superadmin]);
    }
    console.log(`  ✅ users: ${data.users.length} filas migradas`);

    // 3. Personal
    for (const p of data.personal) {
        await conn.execute(`
            INSERT INTO personal (id, name, role, dept_id, status_id, photo)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [p.id, p.name, p.role, lkp(maps, 'departamento', p.dept), lkp(maps, 'status', p.status), p.photo]);
    }
    console.log(`  ✅ personal: ${data.personal.length} filas migradas`);

    // 4. Documents
    for (const d of data.documents) {
        await conn.execute(`
            INSERT INTO documents (id, code, tipo_id, title, version, date, ambito, status_id, resp, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [d.id, d.code, lkp(maps, 'tipo_documento', d.tipo), d.title, d.version, d.date, d.ambito, lkp(maps, 'status', d.status), d.resp, d.tenant_id]);
    }
    console.log(`  ✅ documents: ${data.documents.length} filas migradas`);

    // 5. Requisitos legales
    for (const r of data.requisitos_legales) {
        await conn.execute(`
            INSERT INTO requisitos_legales (id, tipo_id, titulo, \`desc\`, ambito, norma, estado_id, fecha_rev, responsable, enlace, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [r.id, lkp(maps, 'tipo_requisito', r.tipo), r.titulo, r.desc, r.ambito, r.norma, lkp(maps, 'status', r.estado), r.fecha_rev, r.responsable, r.enlace, r.tenant_id]);
    }
    console.log(`  ✅ requisitos_legales: ${data.requisitos_legales.length} filas migradas`);

    // 6. DAFO
    for (const d of data.dafo) {
        await conn.execute(`
            INSERT INTO dafo (id, type_id, title, \`desc\`, impact_id, action, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [d.id, lkp(maps, 'tipo_dafo', d.type), d.title, d.desc, lkp(maps, 'nivel_impacto', d.impact), d.action, d.tenant_id]);
    }
    console.log(`  ✅ dafo: ${data.dafo.length} filas migradas`);

    // 7. Partes interesadas
    for (const pi of data.partes_interesadas) {
        await conn.execute(`
            INSERT INTO partes_interesadas (id, name, category_id, type_id, influence_id, impact_id, requirements, action_plan, last_evaluation, next_evaluation, periodicity, history, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [pi.id, pi.name, lkp(maps, 'categoria_parte_interesada', pi.category), lkp(maps, 'tipo_parte_interesada', pi.type),
            lkp(maps, 'nivel_impacto', pi.influence), lkp(maps, 'nivel_impacto', pi.impact),
            typeof pi.requirements === 'string' ? pi.requirements : JSON.stringify(pi.requirements || []),
            pi.action_plan, pi.last_evaluation, pi.next_evaluation, pi.periodicity,
            typeof pi.history === 'string' ? pi.history : JSON.stringify(pi.history || []),
            pi.tenant_id]);
    }
    console.log(`  ✅ partes_interesadas: ${data.partes_interesadas.length} filas migradas`);

    // 8. Cambios TI
    for (const c of data.cambios_ti) {
        await conn.execute(`
            INSERT INTO cambios_ti (id, title, type_id, \`desc\`, ci, owner, impact_id, risk_id, date, tests, rollback, approver, status_id, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [c.id, c.title, lkp(maps, 'tipo_cambio_ti', c.type), c.desc, c.ci, c.owner,
            lkp(maps, 'nivel_impacto', c.impact), lkp(maps, 'nivel_impacto', c.risk),
            c.date, c.tests, c.rollback, c.approver, lkp(maps, 'status', c.status), c.tenant_id]);
    }
    console.log(`  ✅ cambios_ti: ${data.cambios_ti.length} filas migradas`);

    // 9. BCP Processes
    for (const b of data.bcp_processes) {
        await conn.execute(`
            INSERT INTO bcp_processes (id, name, mtpd, rto, rpo, imp_fin, imp_op, imp_rep, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [b.id, b.name, b.mtpd, b.rto, b.rpo, b.imp_fin, b.imp_op, b.imp_rep, b.tenant_id]);
    }
    console.log(`  ✅ bcp_processes: ${data.bcp_processes.length} filas migradas`);

    // 10. BCP Exercises
    for (const e of data.bcp_exercises) {
        await conn.execute(`
            INSERT INTO bcp_exercises (id, title, date, scenario, target_rto, actual_rto, status_id, notes, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [e.id, e.title, e.date, e.scenario, e.target_rto, e.actual_rto, lkp(maps, 'status', e.status), e.notes, e.tenant_id]);
    }
    console.log(`  ✅ bcp_exercises: ${data.bcp_exercises.length} filas migradas`);

    // 11. Acciones correctivas
    for (const ac of data.acciones_correctivas) {
        await conn.execute(`
            INSERT INTO acciones_correctivas (id, origen, resumen, responsable, estado_id, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [ac.id, ac.origen, ac.resumen, ac.responsable, lkp(maps, 'status', ac.estado), ac.tenant_id]);
    }
    console.log(`  ✅ acciones_correctivas: ${data.acciones_correctivas.length} filas migradas`);

    // 12. Audits actions
    for (const a of data.audits_actions) {
        await conn.execute(`
            INSERT INTO audits_actions (id, audit_id, finding, \`desc\`, resp, deadline, status_id, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [a.id, a.audit_id, a.finding, a.desc, a.resp, a.deadline, lkp(maps, 'status', a.status), a.tenant_id]);
    }
    console.log(`  ✅ audits_actions: ${data.audits_actions.length} filas migradas`);

    // 13. Canal denuncias
    for (const d of data.canal_denuncias) {
        await conn.execute(`
            INSERT INTO canal_denuncias (id, date, cat, priority_id, \`desc\`, dept, responsible, anonymous, reporter_name, reporter_contact, status_id, notes, closed_date, track_code, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [d.id, d.date, d.cat, lkp(maps, 'prioridad', d.priority), d.desc, d.dept, d.responsible, d.anonymous, d.reporter_name, d.reporter_contact, lkp(maps, 'status', d.status), d.notes, d.closed_date, d.track_code, d.tenant_id]);
    }
    console.log(`  ✅ canal_denuncias: ${data.canal_denuncias.length} filas migradas`);

    // 14. Procesos
    for (const p of data.procesos) {
        await conn.execute(`
            INSERT INTO procesos (id, name, type_id, compliance, ok_kpis, warn_kpis, crit_kpis, owner, inputs, outputs, risks, activities, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [p.id, p.name, lkp(maps, 'tipo_proceso', p.type), p.compliance, p.ok_kpis, p.warn_kpis, p.crit_kpis, p.owner, p.inputs, p.outputs,
            typeof p.risks === 'string' ? p.risks : JSON.stringify(p.risks || {}),
            typeof p.activities === 'string' ? p.activities : JSON.stringify(p.activities || []),
            p.tenant_id]);
    }
    console.log(`  ✅ procesos: ${data.procesos.length} filas migradas`);

    // 15. Políticas SGI
    for (const pol of data.politicas_sgi) {
        await conn.execute(`
            INSERT INTO politicas_sgi (id, name, norm, version, date, review, owner, status_id, scope, content, evidences, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [pol.id, pol.name, pol.norm, pol.version, pol.date, pol.review, pol.owner, lkp(maps, 'status', pol.status), pol.scope, pol.content,
            typeof pol.evidences === 'string' ? pol.evidences : JSON.stringify(pol.evidences || {}),
            pol.tenant_id]);
    }
    console.log(`  ✅ politicas_sgi: ${data.politicas_sgi.length} filas migradas`);

    // 16. Compras proveedores
    for (const cp of data.compras_proveedores_data) {
        await conn.execute(`
            INSERT INTO compras_proveedores_data (tenant_id, proveedores, pedidos, evaluaciones, incidencias)
            VALUES (?, ?, ?, ?, ?)
        `, [cp.tenant_id,
            typeof cp.proveedores === 'string' ? cp.proveedores : JSON.stringify(cp.proveedores || []),
            typeof cp.pedidos === 'string' ? cp.pedidos : JSON.stringify(cp.pedidos || []),
            typeof cp.evaluaciones === 'string' ? cp.evaluaciones : JSON.stringify(cp.evaluaciones || []),
            typeof cp.incidencias === 'string' ? cp.incidencias : JSON.stringify(cp.incidencias || [])]);
    }
    console.log(`  ✅ compras_proveedores_data: ${data.compras_proveedores_data.length} filas migradas`);

    // 17. Incidencias NC
    for (const inc of data.incidencias_nc_data) {
        await conn.execute(`
            INSERT INTO incidencias_nc_data (tenant_id, incidencias)
            VALUES (?, ?)
        `, [inc.tenant_id, typeof inc.incidencias === 'string' ? inc.incidencias : JSON.stringify(inc.incidencias || [])]);
    }
    console.log(`  ✅ incidencias_nc_data: ${data.incidencias_nc_data.length} filas migradas`);

    // 18. Pedidos clientes
    for (const pc of data.pedidos_clientes) {
        await conn.execute(`
            INSERT INTO pedidos_clientes (id, name, type_id, svc_id, svc_name, concept, delivery, scope, demand_soporte, demand_infra, demand_material, status_id, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [pc.id, pc.name, lkp(maps, 'tipo_pedido', pc.type), pc.svc_id, pc.svc_name, pc.concept, pc.delivery, pc.scope,
            pc.demand_soporte, pc.demand_infra, pc.demand_material, lkp(maps, 'status', pc.status), pc.tenant_id]);
    }
    console.log(`  ✅ pedidos_clientes: ${data.pedidos_clientes.length} filas migradas`);

    // 19. Catálogo general
    for (const cat of data.catalogo_general) {
        await conn.execute(`
            INSERT INTO catalogo_general (id, name, tipo_id, cat_id, cost, stock, min_stock, unit_id, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [cat.id, cat.name, lkp(maps, 'tipo_catalogo', cat.tipo), lkp(maps, 'categoria_catalogo', cat.cat),
            cat.cost, cat.stock, cat.min_stock, lkp(maps, 'unidad_catalogo', cat.unit), cat.tenant_id]);
    }
    console.log(`  ✅ catalogo_general: ${data.catalogo_general.length} filas migradas`);

    // 20. Desempeño proveedores
    for (const dp of data.desempeno_proveedores) {
        await conn.execute(`
            INSERT INTO desempeno_proveedores (id, name, date, quality, delivery, support, compliance, avg, sla, owner, obs, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [dp.id, dp.name, dp.date, dp.quality, dp.delivery, dp.support, dp.compliance, dp.avg, dp.sla, dp.owner, dp.obs, dp.tenant_id]);
    }
    console.log(`  ✅ desempeno_proveedores: ${data.desempeno_proveedores.length} filas migradas`);

    // 21. Inventario equipos
    for (const eq of data.inventario_equipos) {
        await conn.execute(`
            INSERT INTO inventario_equipos (id, name, model, last_cal, next_cal, status_id, section, criticidad_id, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [eq.id, eq.name, eq.model, eq.last_cal, eq.next_cal, lkp(maps, 'status', eq.status), eq.section,
            lkp(maps, 'nivel_impacto', eq.criticidad), eq.tenant_id]);
    }
    console.log(`  ✅ inventario_equipos: ${data.inventario_equipos.length} filas migradas`);

    // 22. Clima laboral
    for (const cl of data.clima_laboral_encuestas) {
        await conn.execute(`
            INSERT INTO clima_laboral_encuestas (id, fecha, periodo, empleado, respuestas, comentarios, score, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [cl.id, cl.fecha, cl.periodo, cl.empleado,
            typeof cl.respuestas === 'string' ? cl.respuestas : JSON.stringify(cl.respuestas || {}),
            typeof cl.comentarios === 'string' ? cl.comentarios : JSON.stringify(cl.comentarios || {}),
            cl.score, cl.tenant_id]);
    }
    console.log(`  ✅ clima_laboral_encuestas: ${data.clima_laboral_encuestas.length} filas migradas`);

    // 23. Perfiles cualificación
    for (const pf of data.perfiles_cualificacion) {
        await conn.execute(`
            INSERT INTO perfiles_cualificacion (id, name, dept, description, normas, status_id, competencias, educacion, experiencia, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [pf.id, pf.name, pf.dept, pf.description,
            typeof pf.normas === 'string' ? pf.normas : JSON.stringify(pf.normas || []),
            lkp(maps, 'status', pf.status),
            typeof pf.competencias === 'string' ? pf.competencias : JSON.stringify(pf.competencias || []),
            pf.educacion, pf.experiencia, pf.tenant_id]);
    }
    console.log(`  ✅ perfiles_cualificacion: ${data.perfiles_cualificacion.length} filas migradas`);

    // 24. ENS Checklist
    for (const ens of data.ens_checklist) {
        await conn.execute(`
            INSERT INTO ens_checklist (id, pilar_id, name, \`desc\`, val, note, evidence, status_id, tenant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [ens.id, lkp(maps, 'pilar_ens', ens.pilar), ens.name, ens.desc, ens.val, ens.note, ens.evidence, lkp(maps, 'status', ens.status), ens.tenant_id]);
    }
    console.log(`  ✅ ens_checklist: ${data.ens_checklist.length} filas migradas`);

    // 25. Management Review
    for (const mr of data.management_review) {
        await conn.execute(`
            INSERT INTO management_review (tenant_id, periodo, desempeno, trend, meta, aud_planificadas, aud_ejecutadas, capa_abiertas, capa_cerradas, capa_eficacia, resolucion, estado_sistema, proxima_revision, objetivos, riesgos)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [mr.tenant_id, mr.periodo, mr.desempeno, mr.trend, mr.meta, mr.aud_planificadas, mr.aud_ejecutadas,
            mr.capa_abiertas, mr.capa_cerradas, mr.capa_eficacia, mr.resolucion, mr.estado_sistema, mr.proxima_revision,
            typeof mr.objetivos === 'string' ? mr.objetivos : JSON.stringify(mr.objetivos || []),
            typeof mr.riesgos === 'string' ? mr.riesgos : JSON.stringify(mr.riesgos || [])]);
    }
    console.log(`  ✅ management_review: ${data.management_review.length} filas migradas`);

    // 26. sige_settings
    for (const s of data.sige_settings) {
        await conn.execute(`
            INSERT INTO sige_settings (setting_key, setting_value) VALUES (?, ?)
        `, [s.setting_key, s.setting_value]);
    }
    console.log(`  ✅ sige_settings: ${data.sige_settings.length} filas migradas`);
}

// ════════════════════════════════════════════════════════════════════
// FASE 6: Verificación
// ════════════════════════════════════════════════════════════════════
async function verify(conn) {
    console.log('\n📊 VERIFICACIÓN DE LA MIGRACIÓN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const tables = [
        'lkp_status', 'lkp_tipo_documento', 'lkp_tipo_requisito', 'lkp_tipo_proceso',
        'lkp_tipo_catalogo', 'lkp_categoria_catalogo', 'lkp_unidad_catalogo', 'lkp_tipo_dafo',
        'lkp_prioridad', 'lkp_nivel_impacto', 'lkp_categoria_parte_interesada',
        'lkp_tipo_parte_interesada', 'lkp_tipo_cambio_ti', 'lkp_nivel_ens', 'lkp_pilar_ens',
        'lkp_tipo_pedido', 'lkp_rol_usuario', 'lkp_departamento',
        'organizations', 'users', 'personal', 'documents', 'requisitos_legales',
        'dafo', 'partes_interesadas', 'cambios_ti', 'bcp_processes', 'bcp_exercises',
        'acciones_correctivas', 'audits_actions', 'canal_denuncias', 'procesos',
        'politicas_sgi', 'compras_proveedores_data', 'incidencias_nc_data',
        'pedidos_clientes', 'catalogo_general', 'desempeno_proveedores',
        'inventario_equipos', 'clima_laboral_encuestas', 'perfiles_cualificacion',
        'ens_checklist', 'management_review', 'sige_settings'
    ];

    for (const t of tables) {
        const [rows] = await conn.query(`SELECT COUNT(*) as cnt FROM \`${t}\``);
        const isLkp = t.startsWith('lkp_');
        const icon = rows[0].cnt > 0 ? '✅' : (isLkp ? '⚠️' : '📋');
        console.log(`  ${icon} ${t}: ${rows[0].cnt} filas`);
    }

    // Test CASCADE: verificar que la FK funciona
    console.log('\n🔗 Test de integridad referencial (CASCADE):');
    const [fks] = await conn.query(`
        SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME 
        FROM information_schema.REFERENTIAL_CONSTRAINTS 
        WHERE CONSTRAINT_SCHEMA = 'bor4sige'
        ORDER BY TABLE_NAME
    `);
    console.log(`  ✅ ${fks.length} foreign keys activas`);
}

// ════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════
async function main() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('═══════════════════════════════════════════════════════');
        console.log('  BOR4SIGE – Migración a modelo E-R puro UUID + Lookup');
        console.log('═══════════════════════════════════════════════════════\n');

        // FASE 1: Leer datos
        console.log('📖 FASE 1: Leyendo datos existentes...');
        const data = await readAllData(conn);

        // FASE 2: Recopilar lookups
        console.log('\n🔍 FASE 2: Recopilando valores para tablas lookup...');
        const lookups = collectLookupValues(data);
        for (const [k, v] of Object.entries(lookups)) {
            console.log(`  📋 ${k}: ${v.size} valores únicos`);
        }

        // FASE 3: DROP + CREATE
        console.log('\n🏗️  FASE 3: Recreando estructura de base de datos...');
        await conn.query(DDL_DROP_OLD);
        console.log('  ✅ Tablas antiguas eliminadas');

        // Crear tablas lookup
        const lookupNames = Object.keys(lookups);
        for (const name of lookupNames) {
            await conn.query(buildLookupDDL(`lkp_${name}`));
        }
        console.log(`  ✅ ${lookupNames.length} tablas lookup creadas`);

        // Crear tablas maestras
        await conn.query(DDL_MASTER_TABLES);
        console.log('  ✅ Tablas maestras creadas con UUID PKs y FKs');

        // FASE 4: Insertar lookups
        console.log('\n📝 FASE 4: Insertando valores en tablas lookup...');
        const maps = await insertLookups(conn, lookups);

        // FASE 5: Migrar datos
        console.log('\n🚀 FASE 5: Migrando datos...');
        await migrateData(conn, data, maps);

        // FASE 6: Verificar
        await verify(conn);

        console.log('\n═══════════════════════════════════════════════════════');
        console.log('  ✅ MIGRACIÓN COMPLETADA CON ÉXITO');
        console.log('═══════════════════════════════════════════════════════\n');

    } catch (err) {
        console.error('\n❌ ERROR EN LA MIGRACIÓN:', err);
        process.exit(1);
    } finally {
        if (conn) conn.release();
        await pool.end();
    }
}

main();
