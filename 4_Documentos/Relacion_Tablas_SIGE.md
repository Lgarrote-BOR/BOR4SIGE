# Relación de Tablas de la Base de Datos MariaDB - Bor4SIGE

Este documento describe el diccionario físico de datos del esquema relacional puro implementado en **MariaDB** para la persistencia del Sistema Integrado de Gestión (SGI) y Compliance de **Bor4SIGE**.

## Arquitectura General
* **Motor de persistencia:** MariaDB (Motor InnoDB).
* **Aislamiento Multi-tenant:** Implementado mediante claves primarias compuestas `PRIMARY KEY (id, tenant_id)` y relaciones foráneas vinculadas a la tabla maestra `organizations`.
* **Integridad Referencial:** Restricciones de claves foráneas con propagación en cascada (`ON DELETE CASCADE ON UPDATE CASCADE`) para garantizar la consistencia relacional.

---

## 1. Tablas Maestras y de Configuración

### 🏢 Tabla: `organizations`
Almacena las organizaciones/inquilinos del sistema y sus métricas de alto nivel.
* **Clave Primaria:** `id` (VARCHAR)
* **Campos:**
  * `id` VARCHAR(50) [PK]: Identificador del inquilino (ej: `alfa`, `omega`).
  * `name` VARCHAR(255): Nombre corporativo de la organización.
  * `compliance` INT: Porcentaje general de cumplimiento (0-100%).
  * `trend` VARCHAR(50): Tendencia de rendimiento.
  * `trend_up` BOOLEAN: Indicador si la tendencia es alcista.
  * `capa_total`, `capa_criticas`, `capa_abiertas` INT: Contadores de no conformidades (CAPA).
  * `risks_total`, `risks_mitigated`, `risks_unmitigated` INT: Contadores de gestión de riesgos.
  * `audits_planned`, `audits_retrasada` INT: Métricas de auditorías.
  * `ens_c`, `ens_i`, `ens_d`, `ens_a`, `ens_t` VARCHAR(50): Niveles de seguridad ENS.
  * `scores_iso9001` ... `scores_ens` INT: Puntuaciones específicas por norma.
  * `activities` JSON: Historial de actividad reciente.
  * `alerts` JSON: Alertas de cumplimiento activas.
  * `systems` JSON: Estado de disponibilidad de sistemas.

### 👤 Tabla: `users`
Contiene las cuentas de usuario de la plataforma y su vinculación de tenant.
* **Clave Primaria:** `id` (VARCHAR)
* **Clave Foránea:** `tenant_id` -> `organizations(id)` `ON DELETE SET NULL ON UPDATE CASCADE`.
* **Campos:**
  * `id` VARCHAR(50) [PK]: ID del usuario.
  * `name` VARCHAR(255): Nombre del usuario.
  * `email` VARCHAR(255) [UNIQUE]: Correo electrónico de acceso.
  * `role` VARCHAR(100): Rol funcional (ej: `admin`, `editor`).
  * `department` VARCHAR(255): Departamento asociado.
  * `tenant_id` VARCHAR(50): ID del inquilino asociado.
  * `status` VARCHAR(50): Estado de cuenta (ej: `Activo`).
  * `is_superadmin` BOOLEAN: Indicador de permisos globales del sistema.

### 👥 Tabla: `personal`
Catálogo general del personal / colaboradores de la empresa.
* **Clave Primaria:** `id` (VARCHAR)
* **Campos:**
  * `id` VARCHAR(50) [PK]: ID del colaborador.
  * `name` VARCHAR(255): Nombre completo.
  * `role` VARCHAR(255): Cargo.
  * `dept` VARCHAR(100): Departamento.
  * `status` VARCHAR(50): Estado laboral.
  * `photo` TEXT: Imagen o avatar.

### ⚙️ Tabla: `sige_settings`
Configuración global persistente y logs del sistema.
* **Clave Primaria:** `setting_key` (VARCHAR)
* **Campos:**
  * `setting_key` VARCHAR(255) [PK]
  * `setting_value` LONGTEXT: Valor configurado o cadenas de texto/JSON.

---

## 2. Tablas Multi-Tenant (Relación Estricta de Negocio)
*Todas estas tablas cuentan con `PRIMARY KEY (id, tenant_id)` y `FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE`.*

### 📄 Tabla: `documents`
Control documental exigido por ISO 9001 §7.5.
* **Campos:** `id` [PK], `tenant_id` [PK], `code` VARCHAR(100) [UNIQUE], `tipo` VARCHAR(100), `title` VARCHAR(255), `version` VARCHAR(50), `date` VARCHAR(50), `ambito` VARCHAR(255), `status` VARCHAR(50), `resp` VARCHAR(255).

### ⚖️ Tabla: `requisitos_legales`
Matriz de requisitos legales y cumplimiento (ISO 27001 §A.5.36 / ISO 14001).
* **Campos:** `id` [PK], `tenant_id` [PK], `tipo` VARCHAR(100), `titulo` VARCHAR(255), `desc` TEXT, `ambito` VARCHAR(255), `norma` VARCHAR(255), `estado` VARCHAR(50), `fecha_rev` VARCHAR(50), `responsable` VARCHAR(255), `enlace` TEXT.

### 📊 Tabla: `dafo`
Factores del análisis estratégico DAFO.
* **Campos:** `id` [PK], `tenant_id` [PK], `type` VARCHAR(100), `title` VARCHAR(255), `desc` TEXT, `impact` VARCHAR(50), `action` VARCHAR(255).

### 🤝 Tabla: `partes_interesadas`
Necesidades y expectativas de partes interesadas (ISO 9001 §4.2).
* **Campos:** `id` [PK], `tenant_id` [PK], `name` VARCHAR(255), `category` VARCHAR(100), `type` VARCHAR(100), `influence` VARCHAR(50), `impact` VARCHAR(50), `requirements` JSON, `action_plan` TEXT, `last_evaluation` VARCHAR(50), `next_evaluation` VARCHAR(50), `periodicity` INT, `history` JSON.

### 🔌 Tabla: `cambios_ti`
Solicitudes de cambio en infraestructura y TI (RFC - ISO 20000-1).
* **Campos:** `id` [PK], `tenant_id` [PK], `title` VARCHAR(255), `type` VARCHAR(100), `desc` TEXT, `ci` VARCHAR(255), `owner` VARCHAR(255), `impact` VARCHAR(50), `risk` VARCHAR(50), `date` VARCHAR(50), `tests` TEXT, `rollback` TEXT, `approver` VARCHAR(255), `status` VARCHAR(50).

### 📈 Tabla: `bcp_processes`
Procesos de continuidad del negocio (BIA - ISO 22301).
* **Campos:** `id` [PK], `tenant_id` [PK], `name` VARCHAR(255), `mtpd` INT, `rto` INT, `rpo` INT, `imp_fin` INT, `imp_op` INT, `imp_rep` INT.

### 🏃 Tabla: `bcp_exercises`
Ejercicios y simulacros de continuidad de negocio (ISO 22301 §8.5).
* **Campos:** `id` [PK], `tenant_id` [PK], `title` VARCHAR(255), `date` VARCHAR(50), `scenario` TEXT, `target_rto` INT, `actual_rto` INT, `status` VARCHAR(50), `notes` TEXT.

### 🔴 Tabla: `acciones_correctivas`
No conformidades y acciones correctivas (CAPA - ISO 9001 §10.2).
* **Campos:** `id` [PK], `tenant_id` [PK], `origen` VARCHAR(100), `resumen` VARCHAR(255), `responsable` VARCHAR(255), `estado` VARCHAR(50).

### 🔍 Tabla: `audits_actions`
Hallazgos y acciones de auditoría (ISO 9001 §9.2).
* **Campos:** `id` [PK], `tenant_id` [PK], `audit_id` VARCHAR(50), `finding` VARCHAR(255), `desc` TEXT, `resp` VARCHAR(255), `deadline` VARCHAR(50), `status` VARCHAR(50).

### 🚨 Tabla: `canal_denuncias`
Canal ético y de denuncias confidencial (Ley 2/2023).
* **Campos:** `id` [PK], `tenant_id` [PK], `date` VARCHAR(50), `cat` VARCHAR(100), `priority` VARCHAR(50), `desc` TEXT, `dept` VARCHAR(255), `responsible` VARCHAR(255), `anonymous` BOOLEAN, `reporter_name` VARCHAR(255), `reporter_contact` VARCHAR(255), `status` VARCHAR(50), `notes` TEXT, `closed_date` VARCHAR(50), `track_code` VARCHAR(100).

### ⚙️ Tabla: `procesos`
Fichas y actividades de procesos del SGI (ISO 9001 §4.4).
* **Campos:** `id` [PK], `tenant_id` [PK], `name` VARCHAR(255), `type` VARCHAR(50), `compliance` INT, `ok_kpis` INT, `warn_kpis` INT, `crit_kpis` INT, `owner` VARCHAR(255), `inputs` TEXT, `outputs` TEXT, `risks` JSON, `activities` JSON.

### 🛡️ Tabla: `politicas_sgi`
Políticas corporativas aprobadas para el SGI (ISO 9001 §5.2).
* **Campos:** `id` [PK], `tenant_id` [PK], `name` VARCHAR(255), `norm` VARCHAR(100), `version` VARCHAR(50), `date` VARCHAR(50), `review` VARCHAR(50), `owner` VARCHAR(255), `status` VARCHAR(50), `scope` TEXT, `content` LONGTEXT, `evidences` JSON.

### 📦 Tabla: `pedidos_clientes`
Pedidos de clientes y demanda asociada a recursos (ISO 20000-1).
* **Campos:** `id` [PK], `tenant_id` [PK], `name` VARCHAR(255), `type` VARCHAR(100), `svc_id` VARCHAR(50), `svc_name` VARCHAR(255), `concept` TEXT, `delivery` VARCHAR(50), `scope` VARCHAR(100), `demand_soporte` INT, `demand_infra` INT, `demand_material` INT, `status` VARCHAR(50).

### 🏷️ Tabla: `catalogo_general`
Productos e inventarios unificados (ISO 9001 §8.5.1).
* **Campos:** `id` [PK], `tenant_id` [PK], `name` VARCHAR(255), `tipo` VARCHAR(50), `cat` VARCHAR(100), `cost` DECIMAL(10,2), `stock` INT, `min_stock` INT, `unit` VARCHAR(50).

### 📈 Tabla: `desempeno_proveedores`
Evaluación histórica y SLAs de proveedores (ISO 9001 §8.4.2).
* **Campos:** `id` [PK], `tenant_id` [PK], `name` VARCHAR(255), `date` VARCHAR(50), `quality` DECIMAL(3,2), `delivery` DECIMAL(3,2), `support` DECIMAL(3,2), `compliance` DECIMAL(3,2), `avg` DECIMAL(3,2), `sla` DECIMAL(5,2), `owner` VARCHAR(255), `obs` TEXT.

### 🛠️ Tabla: `inventario_equipos`
Equipos de seguimiento, medición e infraestructura (EIME - ISO 9001 §7.1.5).
* **Campos:** `id` [PK], `tenant_id` [PK], `name` VARCHAR(255), `model` VARCHAR(255), `last_cal` VARCHAR(50), `next_cal` VARCHAR(50), `status` VARCHAR(50), `section` VARCHAR(255), `criticidad` VARCHAR(50).

### 💬 Tabla: `clima_laboral_encuestas`
Encuestas cuantitativas Likert y feedback cualitativo (ISO 45001 §5.4).
* **Campos:** `id` [PK], `tenant_id` [PK], `fecha` VARCHAR(50), `periodo` VARCHAR(50), `empleado` VARCHAR(255), `respuestas` JSON, `comentarios` JSON, `score` DECIMAL(3,2).

### 🎓 Tabla: `perfiles_cualificacion`
Perfiles del puesto y competencias profesionales (ISO 9001 §7.2).
* **Campos:** `id` [PK], `tenant_id` [PK], `name` VARCHAR(255), `dept` VARCHAR(255), `description` TEXT, `normas` JSON, `status` VARCHAR(50), `competencias` JSON, `educacion` TEXT, `experiencia` TEXT.

### 🛡️ Tabla: `ens_checklist`
Autoevaluación de cumplimiento con medidas del Esquema Nacional de Seguridad (ENS).
* **Campos:** `id` [PK], `tenant_id` [PK], `pilar` VARCHAR(100), `name` VARCHAR(255), `desc` TEXT, `val` VARCHAR(100), `note` TEXT, `evidence` TEXT, `status` VARCHAR(50).

---

## 3. Tablas de Relación Única o Integrada por Tenant

### 🛒 Tabla: `compras_proveedores_data`
Persistencia de los listados completos de compras y homologaciones integrados por inquilino.
* **Clave Primaria:** `tenant_id` (VARCHAR)
* **Campos:**
  * `tenant_id` VARCHAR(50) [PK]
  * `proveedores` JSON: Listado histórico de proveedores del inquilino.
  * `pedidos` JSON: Listado histórico de pedidos de compra emitidos.
  * `evaluaciones` JSON: Listado de evaluaciones de compras.
  * `incidencias` JSON: Listado de incidencias/devoluciones de pedidos.

### ⚠️ Tabla: `incidencias_nc_data`
Histórico de incidencias y no conformidades globales a nivel de inquilino.
* **Clave Primaria:** `tenant_id` (VARCHAR)
* **Campos:**
  * `tenant_id` VARCHAR(50) [PK]
  * `incidencias` JSON: Objetos de incidencias operativas registradas.

### 📋 Tabla: `management_review`
Acta y decisiones tomadas en la revisión anual por dirección (ISO 9001 §9.3).
* **Clave Primaria:** `tenant_id` (VARCHAR)
* **Campos:**
  * `tenant_id` VARCHAR(50) [PK]
  * `periodo` VARCHAR(50)
  * `desempeno` DECIMAL(5,2)
  * `trend` VARCHAR(50)
  * `meta` DECIMAL(5,2)
  * `aud_planificadas`, `aud_ejecutadas` INT
  * `capa_abiertas`, `capa_cerradas` INT
  * `capa_eficacia` DECIMAL(5,2)
  * `resolucion` TEXT
  * `estado_sistema` VARCHAR(100)
  * `proxima_revision` VARCHAR(50)
  * `objetivos` JSON
  * `riesgos` JSON

---

## 4. Índices Secundarios de Rendimiento (Optimización de Consultas)

Se implementaron índices específicos sobre las columnas de mayor uso operacional:
* `idx_users_tenant` en `users(tenant_id)`
* `idx_documents_tenant_status` en `documents(tenant_id, status)`
* `idx_requisitos_tenant_estado` en `requisitos_legales(tenant_id, estado)`
* `idx_dafo_tenant` en `dafo(tenant_id)`
* `idx_partes_tenant` en `partes_interesadas(tenant_id)`
* `idx_cambios_tenant_status` en `cambios_ti(tenant_id, status)`
* `idx_acciones_corr_tenant_estado` en `acciones_correctivas(tenant_id, estado)`
* `idx_canal_denuncias_tenant` en `canal_denuncias(tenant_id, status)`
* `idx_pedidos_tenant` en `pedidos_clientes(tenant_id)`
* `idx_catalogo_tenant` en `catalogo_general(tenant_id)`
* `idx_desempeno_tenant` en `desempeno_proveedores(tenant_id)`
* `idx_inventario_tenant` en `inventario_equipos(tenant_id)`
* `idx_clima_tenant` en `clima_laboral_encuestas(tenant_id)`
* `idx_ens_tenant` en `ens_checklist(tenant_id)`
