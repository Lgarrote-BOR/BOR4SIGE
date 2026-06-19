# Relación de Tablas de la Base de Datos MariaDB - Bor4SIGE

Este documento describe el diccionario físico de datos del esquema relacional puro implementado en **MariaDB** para la persistencia del Sistema Integrado de Gestión (SGI) y Compliance de **Bor4SIGE**.

## Arquitectura de Persistencia Avanzada (Modelo E-R Puro)
* **Motor de persistencia:** MariaDB (Motor InnoDB).
* **Identificadores UUID:** Todas las tablas maestras utilizan claves primarias basadas en UUID (`CHAR(36)`) generadas de forma única.
* **Separación Clave-Valor (Tablas de Lookup):** Los campos que representan estados, categorías o tipos fijos no se guardan como cadenas de texto libres en las tablas maestras, sino que están normalizados en tablas de catálogo/lookup (`lkp_*`) asociadas por su identificador autoincremental (`INT UNSIGNED`).
* **Aislamiento Multi-tenant:** Implementado mediante claves primarias compuestas `PRIMARY KEY (id, tenant_id)` y relaciones foráneas vinculadas a la tabla maestra `organizations` (que actúa como la raíz de inquilinos).
* **Integridad Referencial:** Restricciones de claves foráneas con propagación en cascada (`ON DELETE CASCADE ON UPDATE CASCADE`) para tablas hijas, y resolución segura (`ON DELETE SET NULL ON UPDATE CASCADE`) para referencias a tablas lookup.

---

## 1. Tablas de Catálogo / Lookup (Clave-Valor)
Todas las tablas de lookup (`lkp_*`) comparten la siguiente estructura física común:
* **`id`** `INT UNSIGNED AUTO_INCREMENT PRIMARY KEY`: Identificador único autoincremental de la clave.
* **`code`** `VARCHAR(100) UNIQUE KEY`: Código interno normalizado (ej: `activo`, `baja`, `urgente`).
* **`label`** `VARCHAR(255)`: Etiqueta descriptiva en lenguaje humano visible en la interfaz de usuario (ej: `Activo`, `Baja`, `Urgente`).
* **`description`** `TEXT`: Detalle opcional de la opción.
* **`active`** `TINYINT(1)`: Estado activo/inactivo (1 por defecto).
* **`sort_order`** `INT UNSIGNED`: Orden de visualización en selectores.
* **`created_at`** `TIMESTAMP`: Marca de tiempo de creación.

### Catálogos Existentes:
1. **`lkp_status`**: Estados de registros (`Activo`, `Pendiente`, `Cerrado`, `En Proceso`, `Baja`, etc.).
2. **`lkp_tipo_documento`**: Tipos de documentos del SGI (`Procedimiento`, `Instrucción`, `Manual`, `Registro`, etc.).
3. **`lkp_tipo_requisito`**: Tipos de requisitos legales (`Nacional`, `Autonómico`, `Local`, `Sectorial`).
4. **`lkp_tipo_proceso`**: Tipos de procesos de negocio (`Estratégico`, `Clave`, `Soporte`).
5. **`lkp_tipo_catalogo`**: Tipos de catálogo general (`Producto`, `Servicio`).
6. **`lkp_categoria_catalogo`**: Categorías de productos (`Soporte`, `Infraestructura`, `Licencia`, etc.).
7. **`lkp_unidad_catalogo`**: Unidades de medida del inventario (`Unidad`, `Hora`, `Licencia`, `Mes`).
8. **`lkp_tipo_dafo`**: Clasificación DAFO (`Debilidad`, `Amenaza`, `Fortaleza`, `Oportunidad`).
9. **`lkp_prioridad`**: Niveles de prioridad (`Alta`, `Media`, `Baja`).
10. **`lkp_nivel_impacto`**: Niveles de impacto, influencia, criticidad o riesgo (`Alto`, `Medio`, `Bajo`).
11. **`lkp_categoria_parte_interesada`**: Categorías de partes interesadas (`Cliente`, `Proveedor`, `Regulador`, `Empleado`).
12. **`lkp_tipo_parte_interesada`**: Clasificación de partes interesadas (`Interna`, `Externa`).
13. **`lkp_tipo_cambio_ti`**: Tipos de cambios RFC en TI (`Estándar`, `Normal`, `Emergencia`).
14. **`lkp_nivel_ens`**: Niveles del Esquema Nacional de Seguridad (`Bajo`, `Medio`, `Alto`, `No Aplica`).
15. **`lkp_pilar_ens`**: Pilares/Dimensiones del ENS (`Marco Organizativo`, `Marco Operacional`, `Medidas de Protección`).
16. **`lkp_tipo_pedido`**: Tipos de pedidos de clientes (`Nuevo`, `Ampliación`, `Mantenimiento`).
17. **`lkp_rol_usuario`**: Roles de acceso del sistema (`Superadmin`, `Admin`, `Responsable`, `Consultor`).
18. **`lkp_departamento`**: Departamentos de la empresa (`TI`, `Calidad`, `Operaciones`, `Recursos Humanos`, etc.).

---

## 2. Tablas Maestras (Estructura Relacional con UUID)

### 🏢 Tabla: `organizations`
Inquilino raíz del sistema.
* **`id`** `CHAR(36) NOT NULL PRIMARY KEY`: UUID identificativo de la organización.
* **`name`** `VARCHAR(255) NOT NULL`: Nombre de la organización.
* **`compliance`** `INT`: Porcentaje general de cumplimiento.
* **`trend`** `VARCHAR(50)`: Tendencia.
* **`trend_up`** `TINYINT(1)`: Dirección de la tendencia.
* **`capa_total`, `capa_criticas`, `capa_abiertas`, `risks_total`, `risks_mitigated`, `risks_unmitigated`, `audits_planned`, `audits_retrasada`** `INT`: Contadores métricos agregados.
* **`ens_c_id`, `ens_i_id`, `ens_d_id`, `ens_a_id`, `ens_t_id`** `INT UNSIGNED` (FK): Referencias a `lkp_nivel_ens(id)`.
* **`scores_iso9001` ... `scores_ens`** `INT`: Puntuaciones de cumplimiento por norma.
* **`activities`, `alerts`, `systems`** `JSON`: Registros internos estructurados.

### 👤 Tabla: `users`
Cuentas de usuario de la plataforma.
* **`id`** `CHAR(36) NOT NULL PRIMARY KEY`: UUID de usuario.
* **`name`** `VARCHAR(255) NOT NULL`: Nombre completo.
* **`email`** `VARCHAR(255) NOT NULL UNIQUE`: Correo de acceso.
* **`role_id`** `INT UNSIGNED` (FK): Referencia a `lkp_rol_usuario(id)`.
* **`department_id`** `INT UNSIGNED` (FK): Referencia a `lkp_departamento(id)`.
* **`tenant_id`** `CHAR(36)` (FK): Referencia a `organizations(id)`.
* **`status_id`** `INT UNSIGNED` (FK): Referencia a `lkp_status(id)`.
* **`is_superadmin`** `TINYINT(1)`: Indicador de superadministrador global.

### 👥 Tabla: `personal`
Colaboradores de la organización.
* **`id`** `CHAR(36) NOT NULL PRIMARY KEY`: UUID del colaborador.
* **`name`** `VARCHAR(255) NOT NULL`: Nombre y apellidos.
* **`role`** `VARCHAR(255)`: Cargo descriptivo.
* **`dept_id`** `INT UNSIGNED` (FK): Referencia a `lkp_departamento(id)`.
* **`status_id`** `INT UNSIGNED` (FK): Referencia a `lkp_status(id)`.
* **`photo`** `TEXT`: URL o base64 de la fotografía.

### ⚙️ Tabla: `sige_settings`
Configuración global persistente de clave-valor.
* **`setting_key`** `VARCHAR(255) NOT NULL PRIMARY KEY`: Clave de configuración.
* **`setting_value`** `LONGTEXT`: Valor almacenado (JSON o texto plano).

---

## 3. Tablas Operativas Multi-Tenant (Clave Primaria Compuesta)
*Todas estas tablas tienen la PK compuesta `(id, tenant_id)` y `tenant_id` referencia a `organizations(id) ON DELETE CASCADE ON UPDATE CASCADE`.*

### 📄 Tabla: `documents` (Control Documental - ISO 9001 §7.5)
* **`id`** `CHAR(36) NOT NULL`, **`tenant_id`** `CHAR(36) NOT NULL` (PK).
* **`code`** `VARCHAR(100)`: Código del documento.
* **`tipo_id`** `INT UNSIGNED` (FK): Referencia a `lkp_tipo_documento(id)`.
* **`title`** `VARCHAR(255)`: Título del documento.
* **`version`, `date`, `ambito`, `resp`** `VARCHAR(255)`: Metadatos.
* **`status_id`** `INT UNSIGNED` (FK): Referencia a `lkp_status(id)`.

### ⚖️ Tabla: `requisitos_legales` (Cumplimiento Legal - ISO 27001 §A.5.36)
* **`id`** `CHAR(36) NOT NULL`, **`tenant_id`** `CHAR(36) NOT NULL` (PK).
* **`tipo_id`** `INT UNSIGNED` (FK): Referencia a `lkp_tipo_requisito(id)`.
* **`titulo`** `VARCHAR(255)`: Título de la norma.
* **`desc`** `TEXT`: Descripción de obligaciones.
* **`ambito`, `norma`, `responsable`** `VARCHAR(255)`: Metadatos operacionales.
* **`estado_id`** `INT UNSIGNED` (FK): Referencia a `lkp_status(id)`.
* **`fecha_rev`** `VARCHAR(50)`, **`enlace`** `TEXT`.

### 📊 Tabla: `dafo` (Análisis Estratégico DAFO)
* **`id`** `CHAR(36) NOT NULL`, **`tenant_id`** `CHAR(36) NOT NULL` (PK).
* **`type_id`** `INT UNSIGNED` (FK): Referencia a `lkp_tipo_dafo(id)`.
* **`title`** `VARCHAR(255)`: Nombre del factor.
* **`desc`** `TEXT`: Descripción.
* **`impact_id`** `INT UNSIGNED` (FK): Referencia a `lkp_nivel_impacto(id)`.
* **`action`** `TEXT`: Acción correctiva/preventiva propuesta.

### 🤝 Tabla: `partes_interesadas` (Requisitos de Partes Interesadas - ISO 9001 §4.2)
* **`id`** `CHAR(36) NOT NULL`, **`tenant_id`** `CHAR(36) NOT NULL` (PK).
* **`name`** `VARCHAR(255)`: Nombre de la entidad.
* **`category_id`** `INT UNSIGNED` (FK): Referencia a `lkp_categoria_parte_interesada(id)`.
* **`type_id`** `INT UNSIGNED` (FK): Referencia a `lkp_tipo_parte_interesada(id)`.
* **`influence_id`** `INT UNSIGNED` (FK): Referencia a `lkp_nivel_impacto(id)`.
* **`impact_id`** `INT UNSIGNED` (FK): Referencia a `lkp_nivel_impacto(id)`.
* **`requirements`** `JSON`: Requisitos acordados.
* **`action_plan`** `TEXT`, **`last_evaluation`**, **`next_evaluation`** `VARCHAR(50)`, **`periodicity`** `INT`, **`history`** `JSON`.

### 🔌 Tabla: `cambios_ti` (Gestión de Cambios RFC - ISO 20000-1)
* **`id`** `CHAR(36) NOT NULL`, **`tenant_id`** `CHAR(36) NOT NULL` (PK).
* **`title`** `VARCHAR(255)`: Título del cambio.
* **`type_id`** `INT UNSIGNED` (FK): Referencia a `lkp_tipo_cambio_ti(id)`.
* **`desc`** `TEXT`: Descripción y justificación.
* **`ci`, `owner`, `date`, `approver`** `VARCHAR(255)`: Metadatos.
* **`impact_id`** `INT UNSIGNED` (FK): Referencia a `lkp_nivel_impacto(id)`.
* **`risk_id`** `INT UNSIGNED` (FK): Referencia a `lkp_nivel_impacto(id)`.
* **`tests`, `rollback`** `TEXT`.
* **`status_id`** `INT UNSIGNED` (FK): Referencia a `lkp_status(id)`.

### 📈 Tabla: `bcp_processes` (BIA Continuidad - ISO 22301)
* **`id`** `CHAR(36) NOT NULL`, **`tenant_id`** `CHAR(36) NOT NULL` (PK).
* **`name`** `VARCHAR(255)`: Proceso de negocio.
* **`mtpd`, `rto`, `rpo`, `imp_fin`, `imp_op`, `imp_rep`** `INT`: Métricas BIA.

### 🏃 Tabla: `bcp_exercises` (Simulacros Continuidad - ISO 22301 §8.5)
* **`id`** `CHAR(36) NOT NULL`, **`tenant_id`** `CHAR(36) NOT NULL` (PK).
* **`title`** `VARCHAR(255)`: Nombre del ejercicio.
* **`date`** `VARCHAR(50)`, **`scenario`** `TEXT`.
* **`target_rto`, `actual_rto`** `INT`.
* **`status_id`** `INT UNSIGNED` (FK): Referencia a `lkp_status(id)`.
* **`notes`** `TEXT`.

### 🔴 Tabla: `acciones_correctivas` (CAPA - ISO 9001 §10.2)
* **`id`** `CHAR(36) NOT NULL`, **`tenant_id`** `CHAR(36) NOT NULL` (PK).
* **`origen`, `responsable`** `VARCHAR(255)`.
* **`resumen`** `TEXT`.
* **`estado_id`** `INT UNSIGNED` (FK): Referencia a `lkp_status(id)`.

### 🔍 Tabla: `audits_actions` (Acciones de Auditoría - ISO 9001 §9.2)
* **`id`** `CHAR(36) NOT NULL`, **`tenant_id`** `CHAR(36) NOT NULL` (PK).
* **`audit_id`** `VARCHAR(50)`: ID de la auditoría asociada.
* **`finding`, `desc`** `TEXT`.
* **`resp`, `deadline`** `VARCHAR(255)`.
* **`status_id`** `INT UNSIGNED` (FK): Referencia a `lkp_status(id)`.

### 🚨 Tabla: `canal_denuncias` (Ley 2/2023 & ISO 37002)
* **`id`** `CHAR(36) NOT NULL`, **`tenant_id`** `CHAR(36) NOT NULL` (PK).
* **`date`, `cat`, `dept`, `responsible`, `reporter_name`, `reporter_contact`, `closed_date`, `track_code`** `VARCHAR(255)`.
* **`priority_id`** `INT UNSIGNED` (FK): Referencia a `lkp_prioridad(id)`.
* **`desc`, `notes`** `TEXT`.
* **`anonymous`** `TINYINT(1)`.
* **`status_id`** `INT UNSIGNED` (FK): Referencia a `lkp_status(id)`.

### ⚙️ Tabla: `procesos` (Fichas de Proceso - ISO 9001 §4.4)
* **`id`** `CHAR(36) NOT NULL`, **`tenant_id`** `CHAR(36) NOT NULL` (PK).
* **`name`, `owner`** `VARCHAR(255)`.
* **`type_id`** `INT UNSIGNED` (FK): Referencia a `lkp_tipo_proceso(id)`.
* **`compliance`, `ok_kpis`, `warn_kpis`, `crit_kpis`** `INT`.
* **`inputs`, `outputs`** `TEXT`.
* **`risks`, `activities`** `JSON`.

### 🛡️ Tabla: `politicas_sgi` (Políticas SGI - ISO 9001 §5.2)
* **`id`** `CHAR(36) NOT NULL`, **`tenant_id`** `CHAR(36) NOT NULL` (PK).
* **`name`, `norm`, `version`, `date`, `review`, `owner`** `VARCHAR(255)`.
* **`status_id`** `INT UNSIGNED` (FK): Referencia a `lkp_status(id)`.
* **`scope`, `content`** `TEXT`.
* **`evidences`** `JSON`.

### 📦 Tabla: `pedidos_clientes` (Gestión de Pedidos - ISO 20000-1)
* **`id`** `CHAR(36) NOT NULL`, **`tenant_id`** `CHAR(36) NOT NULL` (PK).
* **`name`, `svc_id`, `svc_name`, `delivery`** `VARCHAR(255)`.
* **`type_id`** `INT UNSIGNED` (FK): Referencia a `lkp_tipo_pedido(id)`.
* **`concept`, `scope`** `TEXT`.
* **`demand_soporte`, `demand_infra`, `demand_material`** `INT`.
* **`status_id`** `INT UNSIGNED` (FK): Referencia a `lkp_status(id)`.

### 🏷️ Tabla: `catalogo_general` (Productos e Inventarios - ISO 9001 §8.5.1)
* **`id`** `CHAR(36) NOT NULL`, **`tenant_id`** `CHAR(36) NOT NULL` (PK).
* **`name`** `VARCHAR(255)`.
* **`tipo_id`** `INT UNSIGNED` (FK): Referencia a `lkp_tipo_catalogo(id)`.
* **`cat_id`** `INT UNSIGNED` (FK): Referencia a `lkp_categoria_catalogo(id)`.
* **`cost`** `DECIMAL(10,2)`.
* **`stock`, `min_stock`** `INT`.
* **`unit_id`** `INT UNSIGNED` (FK): Referencia a `lkp_unidad_catalogo(id)`.

### 📈 Tabla: `desempeno_proveedores` (SLA Proveedores - ISO 9001 §8.4.2)
* **`id`** `CHAR(36) NOT NULL`, **`tenant_id`** `CHAR(36) NOT NULL` (PK).
* **`name`, `date`, `owner`** `VARCHAR(255)`.
* **`quality`, `delivery`, `support`, `compliance`, `avg`, `sla`** `DECIMAL(5,2)`.
* **`obs`** `TEXT`.

### 🛠️ Tabla: `inventario_equipos` (EIME e Infraestructura - ISO 9001 §7.1.5)
* **`id`** `CHAR(36) NOT NULL`, **`tenant_id`** `CHAR(36) NOT NULL` (PK).
* **`name`, `model`, `last_cal`, `next_cal`, `section`** `VARCHAR(255)`.
* **`status_id`** `INT UNSIGNED` (FK): Referencia a `lkp_status(id)`.
* **`criticidad_id`** `INT UNSIGNED` (FK): Referencia a `lkp_nivel_impacto(id)`.

### 💬 Tabla: `clima_laboral_encuestas` (ISO 45001 §5.4)
* **`id`** `CHAR(36) NOT NULL`, **`tenant_id`** `CHAR(36) NOT NULL` (PK).
* **`fecha`, `periodo`, `empleado`** `VARCHAR(255)`.
* **`respuestas`, `comentarios`** `JSON`.
* **`score`** `DECIMAL(5,2)`.

### 🎓 Tabla: `perfiles_cualificacion` (Competencias - ISO 9001 §7.2)
* **`id`** `CHAR(36) NOT NULL`, **`tenant_id`** `CHAR(36) NOT NULL` (PK).
* **`name`, `dept`** `VARCHAR(255)`.
* **`description`, `educacion`, `experiencia`** `TEXT`.
* **`normas`, `competencias`** `JSON`.
* **`status_id`** `INT UNSIGNED` (FK): Referencia a `lkp_status(id)`.

### 🛡️ Tabla: `ens_checklist` (Cumplimiento Medidas ENS)
* **`id`** `CHAR(36) NOT NULL`, **`tenant_id`** `CHAR(36) NOT NULL` (PK).
* **`name`, `val`** `VARCHAR(255)`.
* **`pilar_id`** `INT UNSIGNED` (FK): Referencia a `lkp_pilar_ens(id)`.
* **`desc`, `note`, `evidence`** `TEXT`.
* **`status_id`** `INT UNSIGNED` (FK): Referencia a `lkp_status(id)`.

---

## 4. Tablas Especiales Integradas por Inquilino (PK Compuesta Singular)
*Estas tablas persisten conjuntos serializados agregados y no llevan UUID secundario.*

### 🛒 Tabla: `compras_proveedores_data`
* **`tenant_id`** `CHAR(36) NOT NULL PRIMARY KEY` (FK a `organizations(id)`).
* **`proveedores`, `pedidos`, `evaluaciones`, `incidencias`** `JSON`.

### ⚠️ Tabla: `incidencias_nc_data`
* **`tenant_id`** `CHAR(36) NOT NULL PRIMARY KEY` (FK a `organizations(id)`).
* **`incidencias`** `JSON`.

### 📋 Tabla: `management_review`
* **`tenant_id`** `CHAR(36) NOT NULL PRIMARY KEY` (FK a `organizations(id)`).
* **`periodo`, `trend`, `estado_sistema`, `proxima_revision`** `VARCHAR(255)`.
* **`desempeno`, `meta`, `capa_eficacia`** `DECIMAL(5,2)`.
* **`aud_planificadas`, `aud_ejecutadas`, `capa_abiertas`, `capa_cerradas`** `INT`.
* **`resolucion`** `TEXT`.
* **`objetivos`, `riesgos`** `JSON`.

---

## 5. Índices de Base de Datos y Claves Foráneas
La base de datos utiliza índices optimizados en cascada para agilizar el aislamiento por inquilino y la integridad del negocio:
* Las claves primarias compuestas `PRIMARY KEY (id, tenant_id)` indexan por defecto las consultas filtradas por inquilino.
* Se añaden índices adicionales sobre claves foráneas y columnas clave (`tenant_id`, `status_id`, `role_id`, `department_id`, etc.) para un óptimo rendimiento en joins relacionales.
