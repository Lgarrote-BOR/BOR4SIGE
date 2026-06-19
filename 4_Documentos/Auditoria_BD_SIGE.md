# Informe de Auditoría y Análisis del Diseño de la Base de Datos — Bor4SIGE

Este documento contiene un análisis técnico exhaustivo del diseño físico y lógico de la base de datos de **Bor4SIGE**, evaluando su integridad referencial, el modelo de datos, la gestión de excepciones, el rendimiento y la seguridad.

---

## 1. Bases de Datos Utilizadas
El ecosistema de Bor4SIGE implementa una estrategia híbrida de persistencia (online/offline):

1. **MariaDB (Motor InnoDB) [Primaria - Servidor]:**
   * Es el motor relacional principal del backend Node.js (`server.js`). 
   * Se ejecuta localmente en el puerto `3306` (empaquetado a través de XAMPP).
   * Almacena de forma centralizada y relacional pura todos los datos operacionales de los inquilinos y catálogos globales de configuración.
   * Utiliza el driver de conexión de alto rendimiento sin bloqueo `mysql2/promise` para Node.js.

2. **Web Storage API (localStorage) [Fallback - Cliente]:**
   * Implementado en el cliente frontend (SPA) mediante el interceptor de peticiones `api-sync.js`.
   * Sirve como mecanismo de resiliencia y tolerancia a fallos (offline). Si el servidor backend Express no está activo, las escrituras y lecturas se derivan de forma transparente a la memoria persistente local del navegador de manera aislada por inquilino.

---

## 2. Relación y Descripción de Tablas (Diccionario Físico de Datos)

El esquema relacional de MariaDB consta de tres tipos de tablas perfectamente diferenciadas:

### A. Tablas de Catálogo y Lookup (Clave-Valor / Normalización)
Para evitar la duplicidad de cadenas de texto redundantes y asegurar un modelo E-R puro, todas las enumeraciones y clasificaciones se centralizan en tablas lookup (`lkp_*`) con ID autoincremental (`INT UNSIGNED`) y un código normalizado único (`UNIQUE KEY uk_code`).

| Tabla Lookup | Descripción |
| :--- | :--- |
| `lkp_status` | Controla los estados de los flujos de trabajo (ej: `Activo`, `Pendiente`, `En Proceso`, `Cerrado`, `Baja`). |
| `lkp_tipo_documento` | Tipos de documentos del gestor documental SGI (ej: `Procedimiento`, `Manual`, `Instrucción`). |
| `lkp_tipo_requisito` | Ámbito geográfico/competencial de los requisitos legales (ej: `Nacional`, `Autonómico`, `Local`). |
| `lkp_tipo_proceso` | Clasificación de procesos de negocio (ej: `Estratégico`, `Clave`, `Soporte`). |
| `lkp_tipo_catalogo` | Clasificación de catálogo general (ej: `Producto`, `Servicio`). |
| `lkp_categoria_catalogo`| Categoría de inventario (ej: `Infraestructura`, `Soporte`, `Licencias`). |
| `lkp_unidad_catalogo` | Unidades de medida (ej: `Unidad`, `Hora`, `Mes`, `Licencia`). |
| `lkp_tipo_dafo` | Factores del análisis DAFO (ej: `Debilidad`, `Amenaza`, `Fortaleza`, `Oportunidad`). |
| `lkp_prioridad` | Prioridades asociadas a flujos éticos o tareas (ej: `Alta`, `Media`, `Baja`). |
| `lkp_nivel_impacto` | Grado de repercusión unificado para riesgos, DAFO y BIA (ej: `Alto`, `Medio`, `Bajo`). |
| `lkp_categoria_parte_interesada` | Tipos de entidades interesadas (ej: `Cliente`, `Regulador`, `Proveedor`). |
| `lkp_tipo_parte_interesada` | Ubicación organizativa (ej: `Interna`, `Externa`). |
| `lkp_tipo_cambio_ti` | Tipo de cambio en control RFC (ej: `Estándar`, `Normal`, `Emergencia`). |
| `lkp_nivel_ens` | Niveles exigidos en el Esquema Nacional de Seguridad (ej: `Bajo`, `Medio`, `Alto`, `No Aplica`). |
| `lkp_pilar_ens` | Clasificación de controles del ENS (ej: `Marco Organizativo`, `Medidas de Protección`). |
| `lkp_tipo_pedido` | Tipo de demanda de cliente (ej: `Nuevo`, `Ampliación`, `Mantenimiento`). |
| `lkp_rol_usuario` | Roles funcionales del sistema (ej: `Superadmin`, `Admin`, `Responsable`). |
| `lkp_departamento` | Departamentos organizacionales (ej: `Sistemas`, `Calidad`, `Recursos Humanos`). |

---

### B. Tablas Maestras con Identificador UUID (`CHAR(36)`)
Estas tablas representan las entidades globales del sistema que no dependen jerárquicamente de la multi-residencia del negocio de forma compuesta, sirviendo como maestros principales.

#### 1. Tabla `organizations`
* **Descripción:** Entidad raíz de inquilinos (Tenants). Todo el aislamiento de datos corporativo converge en esta tabla.
* **Clave Primaria:** `id` `CHAR(36) NOT NULL PRIMARY KEY` (UUID).
* **Restricciones/FKs:**
  * `ens_c_id` FK a `lkp_nivel_ens(id) ON DELETE SET NULL`
  * `ens_i_id` FK a `lkp_nivel_ens(id) ON DELETE SET NULL`
  * `ens_d_id` FK a `lkp_nivel_ens(id) ON DELETE SET NULL`
  * `ens_a_id` FK a `lkp_nivel_ens(id) ON DELETE SET NULL`
  * `ens_t_id` FK a `lkp_nivel_ens(id) ON DELETE SET NULL`

#### 2. Tabla `users`
* **Descripción:** Usuarios registrados en la aplicación.
* **Clave Primaria:** `id` `CHAR(36) NOT NULL PRIMARY KEY` (UUID).
* **Restricciones/FKs:**
  * `tenant_id` FK a `organizations(id) ON DELETE SET NULL`
  * `role_id` FK a `lkp_rol_usuario(id) ON DELETE SET NULL`
  * `department_id` FK a `lkp_departamento(id) ON DELETE SET NULL`
  * `status_id` FK a `lkp_status(id) ON DELETE SET NULL`
  * `email` VARCHAR(255) `UNIQUE KEY`

#### 3. Tabla `personal`
* **Descripción:** Colaboradores internos de la empresa para métricas de carga y perfiles de competencias.
* **Clave Primaria:** `id` `CHAR(36) NOT NULL PRIMARY KEY` (UUID).
* **Restricciones/FKs:**
  * `dept_id` FK a `lkp_departamento(id) ON DELETE SET NULL`
  * `status_id` FK a `lkp_status(id) ON DELETE SET NULL`

#### 4. Tabla `sige_settings`
* **Descripción:** Tabla clave-valor global persistente para configuración interna de la suite.
* **Clave Primaria:** `setting_key` `VARCHAR(255) NOT NULL PRIMARY KEY`.

---

### C. Tablas Operativas Multi-Tenant (Clave Primaria Compuesta)
Para garantizar un aislamiento robusto por inquilino, estas tablas utilizan una clave primaria compuesta estructurada como `PRIMARY KEY (id, tenant_id)`, donde `id` es un UUID (`CHAR(36)`) del registro y `tenant_id` es el UUID (`CHAR(36)`) de la organización, enlazado directamente por integridad física a la tabla maestra `organizations`.

| Tabla Operativa | Descripción del Negocio | Relaciones Foráneas principales (FK) |
| :--- | :--- | :--- |
| `documents` | Control documental (ISO 9001 §7.5) | `tenant_id` -> `organizations(id)` `CASCADE`<br>`tipo_id` -> `lkp_tipo_documento(id)` `SET NULL`<br>`status_id` -> `lkp_status(id)` `SET NULL` |
| `requisitos_legales` | Matriz de cumplimiento legal (ISO 27001) | `tenant_id` -> `organizations(id)` `CASCADE`<br>`tipo_id` -> `lkp_tipo_requisito(id)` `SET NULL`<br>`estado_id` -> `lkp_status(id)` `SET NULL` |
| `dafo` | Análisis DAFO | `tenant_id` -> `organizations(id)` `CASCADE`<br>`type_id` -> `lkp_tipo_dafo(id)` `SET NULL`<br>`impact_id` -> `lkp_nivel_impacto(id)` `SET NULL` |
| `partes_interesadas` | Matriz de partes interesadas (ISO 9001 §4.2) | `tenant_id` -> `organizations(id)` `CASCADE`<br>`category_id` -> `lkp_categoria_parte_interesada(id)` `SET NULL`<br>`type_id` -> `lkp_tipo_parte_interesada(id)` `SET NULL`<br>`influence_id` -> `lkp_nivel_impacto(id)` `SET NULL`<br>`impact_id` -> `lkp_nivel_impacto(id)` `SET NULL` |
| `cambios_ti` | Gestión de cambios RFC en TI (ISO 20000-1) | `tenant_id` -> `organizations(id)` `CASCADE`<br>`type_id` -> `lkp_tipo_cambio_ti(id)` `SET NULL`<br>`impact_id` -> `lkp_nivel_impacto(id)` `SET NULL`<br>`risk_id` -> `lkp_nivel_impacto(id)` `SET NULL`<br>`status_id` -> `lkp_status(id)` `SET NULL` |
| `bcp_processes` | Procesos de negocio del BIA (ISO 22301) | `tenant_id` -> `organizations(id)` `CASCADE` |
| `bcp_exercises` | Simulacros y pruebas de BCP (ISO 22301) | `tenant_id` -> `organizations(id)` `CASCADE`<br>`status_id` -> `lkp_status(id)` `SET NULL` |
| `acciones_correctivas` | No conformidades y planes CAPA | `tenant_id` -> `organizations(id)` `CASCADE`<br>`estado_id` -> `lkp_status(id)` `SET NULL` |
| `audits_actions` | Acciones derivadas de auditoría (ISO 9001) | `tenant_id` -> `organizations(id)` `CASCADE`<br>`status_id` -> `lkp_status(id)` `SET NULL` |
| `canal_denuncias` | Canal de denuncias ético (Ley 2/2023) | `tenant_id` -> `organizations(id)` `CASCADE`<br>`priority_id` -> `lkp_prioridad(id)` `SET NULL`<br>`status_id` -> `lkp_status(id)` `SET NULL` |
| `procesos` | Fichas de procesos SGI (ISO 9001 §4.4) | `tenant_id` -> `organizations(id)` `CASCADE`<br>`type_id` -> `lkp_tipo_proceso(id)` `SET NULL` |
| `politicas_sgi` | Declaraciones de políticas corporativas | `tenant_id` -> `organizations(id)` `CASCADE`<br>`status_id` -> `lkp_status(id)` `SET NULL` |
| `pedidos_clientes` | Control de demanda de clientes (ISO 20000-1) | `tenant_id` -> `organizations(id)` `CASCADE`<br>`type_id` -> `lkp_tipo_pedido(id)` `SET NULL`<br>`status_id` -> `lkp_status(id)` `SET NULL` |
| `catalogo_general` | Catálogo e inventarios | `tenant_id` -> `organizations(id)` `CASCADE`<br>`tipo_id` -> `lkp_tipo_catalogo(id)` `SET NULL`<br>`cat_id` -> `lkp_categoria_catalogo(id)` `SET NULL`<br>`unit_id` -> `lkp_unidad_catalogo(id)` `SET NULL` |
| `desempeno_proveedores`| Evaluación histórica de proveedores | `tenant_id` -> `organizations(id)` `CASCADE` |
| `inventario_equipos` | Equipos de medición e infraestructura (EIME) | `tenant_id` -> `organizations(id)` `CASCADE`<br>`status_id` -> `lkp_status(id)` `SET NULL`<br>`criticidad_id` -> `lkp_nivel_impacto(id)` `SET NULL` |
| `clima_laboral_encuestas`| Encuestas Likert cuantitativas y cualitativas | `tenant_id` -> `organizations(id)` `CASCADE` |
| `perfiles_cualificacion`| Matriz de competencias de personal | `tenant_id` -> `organizations(id)` `CASCADE`<br>`status_id` -> `lkp_status(id)` `SET NULL` |
| `ens_checklist` | Lista de comprobación de medidas ENS | `tenant_id` -> `organizations(id)` `CASCADE`<br>`pilar_id` -> `lkp_pilar_ens(id)` `SET NULL`<br>`status_id` -> `lkp_status(id)` `SET NULL` |
| `management_review` | Revisiones de la dirección (ISO 9001 §9.3) | `tenant_id` -> `organizations(id)` `CASCADE` |
| `compras_proveedores_data`| Resumen histórico de homologación | `tenant_id` -> `organizations(id)` `CASCADE` |
| `incidencias_nc_data` | Registro histórico de incidencias agregadas | `tenant_id` -> `organizations(id)` `CASCADE` |

---

## 3. Integridad Referencial
El diseño implementa políticas específicas de propagación para garantizar que no existan inconsistencias o registros huérfanos:

1. **Políticas en Cascación (`ON DELETE CASCADE ON UPDATE CASCADE`):**
   * Aplicado a todas las tablas operativas multi-tenant enlazadas con `organizations(id)`.
   * **Consecuencia:** Si una organización/inquilino es eliminada del sistema, MariaDB purga de forma inmediata y automática todos los registros asociados en las tablas operativas hijas en una única acción transaccional, liberando almacenamiento y garantizando la privacidad (RGPD).

2. **Políticas de Anulación de Nulos (`ON DELETE SET NULL ON UPDATE CASCADE`):**
   * Aplicado en las claves foráneas que apuntan a las tablas de lookup (`lkp_*`).
   * **Consecuencia:** Permite una administración flexible de catálogos. Si un administrador elimina una opción de estado o departamento inactivo de una tabla lookup, los registros maestros y operativos asociados no se eliminan; en su lugar, el valor de la relación se establece en `NULL`, lo que preserva la integridad del historial de transacciones operativas.

---

## 4. Control de Excepciones y Transaccionalidad
El backend administra la interacción con la base de datos de manera atómica y segura mediante bloques de transacción explícitos en `db_operations.js`:

1. **Uso de Transacciones:**
   * La función de escritura `saveDataKey` agrupa las operaciones bajo `await connection.beginTransaction()`.
   * Esto asegura el comportamiento **ACID** (Atomicidad, Consistencia, Aislamiento y Durabilidad). Si una tabla operativa es reemplazada (usando la estrategia de borrar obsolete y realizar upserts `ON DUPLICATE KEY UPDATE`), todas las consultas del inquilino correspondiente se consolidan de forma atómica.

2. **Mecanismo de Rollback:**
   * En caso de que ocurra algún fallo de red, restricción de clave foránea violada o datos corruptos durante el bucle de consultas, el bloque `catch (e)` ejecuta de forma segura `await connection.rollback()`.
   * Evita estados inconsistentes o inserciones parciales que corrompan el histórico del SGI.

3. **Liberación de Recursos (Pool de conexiones):**
   * La conexión extraída del pool se libera siempre dentro de un bloque `finally` con `connection.release()`, impidiendo fugas de sockets o agotamiento de conexiones en el pool bajo tráfico concurrente.

---

## 5. Auditoría de Seguridad y Rendimiento

### Puntos Fuertes (Alineación con Buenas Prácticas)
* **Inyección SQL Imposible:** No hay concatenación de cadenas de texto en las consultas de SQL. Todas las lecturas y escrituras se ejecutan mediante marcadores de parámetros parametrizados (`connection.query(sql, [params])`), lo que mitiga por completo los riesgos de inyección SQL (SQLi).
* **Inserción Atómica Dinámica (Upsert):** El uso de `INSERT INTO ... ON DUPLICATE KEY UPDATE` permite actualizar registros existentes o insertarlos en una sola llamada de ida y vuelta a MariaDB, reduciendo la latencia de red.
* **Resolución Automática de Catálogos:** La función helper `rid()` realiza una validación e inserción al vuelo (upserting) para valores lookup que no existan previamente en la caché en memoria, manteniendo la consistencia de los diccionarios de datos de forma dinámica.

### Oportunidades de Mejora / Recomendaciones
1. **Partición de Memoria en Lecturas Masivas:** Actualmente, `loadAllData` lee todas las tablas de MariaDB completas a memoria (`SELECT *`) para formatearlas y servirlas al cliente SPA en un único payload JSON gigante. Esto es extremadamente rápido para entornos medianos, pero a medida que el volumen de datos de múltiples inquilinos crezca, se recomienda implementar paginación o endpoints de lectura parciales y bajo demanda.
2. **Cifrado de PII en Reposo:** Aunque los correos de usuario y nombres de personal se guardan estructurados, si se manejan datos personales de alta sensibilidad en producción, es aconsejable implementar cifrado transparente de datos (TDE) en MariaDB o cifrar campos específicos de forma simétrica (AES-256) a nivel de aplicación en el backend.
3. **Credenciales en Producción:** Se debe asegurar que las credenciales por defecto (`root` sin contraseña) en el archivo `.env` se reemplacen en entornos productivos por un usuario MariaDB con privilegios limitados (únicamente `SELECT`, `INSERT`, `UPDATE` y `DELETE` sobre la base de datos `bor4sige`).
