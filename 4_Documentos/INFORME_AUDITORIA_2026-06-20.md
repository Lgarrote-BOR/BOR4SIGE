# Informe de Auditoría Técnica — Bor4SIGE

**Fecha:** 2026-06-20
**Alcance:** Revisión completa del proyecto (backend, frontend/SPA, base de datos, seguridad, empaquetado, plugin WordPress, web corporativa y documentación).
**Estado del repositorio:** rama `main`, cambios sin commitear (nuevos `auth.js`, `database.js`, `encryption.js`, `setup_db.js`, `test_endpoints.js`, `.env`).

> Leyenda de severidad: 🔴 Crítico · 🟠 Alto · 🟡 Medio · 🔵 Bajo / Deuda técnica

---

## 1. Resumen ejecutivo

El proyecto ha evolucionado de una webapp local sencilla (db.json + Ollama) a una arquitectura multi-tenant con JWT, MariaDB y cifrado AES-256-GCM. La intención de seguridad es buena, pero la implementación tiene **varios defectos críticos de seguridad y de funcionamiento** que impiden un despliegue en producción tal cual, y una **divergencia grave entre la app de desarrollo y el paquete instalable** que se distribuye.

Los 5 puntos más urgentes:

1. 🔴 **`.env` con secretos reales versionado en git** (clave de Gemini, JWT_SECRET, ENCRYPTION_KEY).
2. 🔴 **Secretos por defecto predecibles** (JWT y cifrado usan exactamente el valor de respaldo del código → tokens falsificables).
3. 🔴 **Escalada de privilegios** en `POST /api/store`: cualquier usuario puede sobrescribir las claves "globales" (`sig_users`, etc.) y autoconcederse superadmin.
4. 🔴 **El paquete Instalable está obsoleto y sin seguridad**, y el script de build genera un instalable que **no arranca**.
5. 🟠 **El modo fallback en memoria está roto** (la consulta real no coincide con el simulador → se pierden todos los datos sin MariaDB).

---

## 2. Seguridad

### 🔴 2.1 `.env` versionado con secretos reales
`1_App_BOR4SIGE/.env` está **trackeado en git** (`git ls-files` lo confirma) y `.gitignore` no lo excluye. Contiene una `GEMINI_API_KEY` aparentemente real, además de `JWT_SECRET` y `ENCRYPTION_KEY`.
- **Impacto:** fuga de credenciales; cualquiera con acceso al repo (o a su historial) puede usar/agotar la clave de Gemini y descifrar denuncias.
- **Acción:** añadir `.env` a `.gitignore`, eliminarlo del índice (`git rm --cached`), **rotar todas las claves**, purgar del historial (`git filter-repo`), y crear un `.env.example` sin valores.

### 🔴 2.2 Secretos por defecto = secretos reales
`auth.js` define `JWT_SECRET = process.env.JWT_SECRET || 'bor4sige_high_entropy_jwt_secret_key_minimum_32_characters'` y el `.env` usa **exactamente ese mismo valor**. Igual ocurre con `ENCRYPTION_KEY` en `encryption.js`.
- **Impacto:** el secreto es público (está en el código). Un atacante puede **firmar JWT válidos** para cualquier `tenant_id`/`role` y descifrar el canal de denuncias.
- **Acción:** generar secretos aleatorios de alta entropía por entorno; que el servidor **rechace arrancar** si faltan (no usar fallback en producción).

### 🔴 2.3 Escalada de privilegios y fuga multi-tenant en `/api/store`
En `POST /api/store` (server.js:76), las claves de `globalKeys` (`sig_users`, `sig_current_user`, `sig_organizations`, `sig_personal`…) se guardan en el tenant `global` **sin comprobar rol**. Cualquier usuario autenticado de cualquier tenant puede:
- Sobrescribir `sig_users` y **autoconcederse `isSuperadmin`**.
- Modificar la organización/usuarios de **todos** los tenants (las claves globales son compartidas).
- **Acción:** las claves globales solo deben ser escribibles por superadmin; idealmente sacar usuarios/organizaciones del almacén key-value y tratarlos como entidades con control de acceso por rol.

### 🔴 2.4 `/api/chat` sin autenticación ni límite de uso
El endpoint de IA (server.js:222) **no usa `auth.enforceTenant`** ni rate-limiting. Está expuesto públicamente y consume la API key de Gemini.
- **Impacto:** abuso de coste y DoS sobre la clave de Gemini desde Internet.
- **Acción:** exigir JWT, añadir rate-limiting (p.ej. `express-rate-limit`) y validar tamaño/contenido del prompt.

### 🟠 2.5 Falta de endurecimiento HTTP
- `app.use(cors())` abre CORS a **todos** los orígenes.
- Sin `helmet` (faltan CSP, HSTS, X-Frame-Options, etc.).
- Sin rate-limiting en `/api/auth/login` → **fuerza bruta** de credenciales.
- **Acción:** CORS con allowlist, `helmet`, rate-limiting en login y endpoints sensibles.

### 🟠 2.6 Credenciales por defecto en código
`setup_db.js` y `database.js` siembran usuarios con contraseñas triviales (`admin1234`, `ana1234`…) versionadas. Si llegan a producción son una puerta trasera.
- **Acción:** forzar cambio de contraseña en primer login; no sembrar datos reales en producción; mover semillas a un script de demo separado.

### 🟡 2.7 Diseño criptográfico mejorable
- La clave se deriva con un simple `SHA-256` del passphrase (sin `scrypt`/`PBKDF2` ni salt).
- Clave de respaldo hardcodeada (`Bor4SIGE-Compliance-Fallback-Key-2026!`).
- La `X-Compliance-Key` viaja en cabecera en cada petición (riesgo si se registra en logs/proxies).
- **Acción:** derivación con `scrypt`+salt; eliminar fallback en producción; documentar gestión de la clave de cumplimiento (idealmente fuera de la cabecera).

---

## 3. Errores funcionales (bugs)

### 🟠 3.1 Modo fallback en memoria roto
`server.js` GET `/api/store` ejecuta:
```sql
SELECT tenant_id, key_name, key_value, updated_at FROM tenant_store WHERE tenant_id = ? OR tenant_id = "global"
```
pero el simulador `runMockQuery` (database.js:172) solo reconoce `SELECT key_name, key_value FROM tenant_store WHERE tenant_id = ?`. Sin MariaDB:
- La consulta cae en "Consulta SQL no soportada" → devuelve `[]`.
- Además el mock **no devuelve `tenant_id`**, que el servidor necesita para re-sufijar las claves.
- **Impacto:** sin MariaDB la app **no carga ningún dato** (justo el "modo resiliencia" que promete el README).
- **Acción:** alinear el simulador con la consulta real (incluir `OR global` y el campo `tenant_id`), o sustituir el simulador por SQLite/better-sqlite3.

### 🟠 3.2 Recursión infinita en `api-sync.js` *(verificar ejecutando)*
El override de `Storage.prototype.setItem` (api-sync.js:272) llama internamente a `localStorage.setItem('sig_time_'+tenantKey, …)`, que vuelve a ser interceptado por el mismo override; como `sig_time_*` también empieza por `sig_`, `getTenantKey` lo re-sufija y se vuelve a llamar a `setItem` → **recursión infinita / stack overflow** en el primer guardado de cualquier clave `sig_` dentro de un módulo (iframe).
- **Acción:** excluir las claves internas (`sig_time_*`) del interceptor y usar una referencia no interceptada para el timestamp. **Conviene verificarlo arrancando la app** y guardando un dato en un módulo.

### 🟠 3.3 El cambio de tenant del superadmin no funciona con servidor activo
`enforceTenant` usa `decoded.tenant_id` del JWT e **ignora la cabecera `X-Tenant-ID`** que envía el cliente. El selector de organización del superadmin solo cambia `sig_active_tenant` en el cliente, pero el backend sigue devolviendo el tenant del token.
- **Impacto:** el superadmin no ve datos de otros tenants cuando el servidor está activo (solo en fallback localStorage).
- **Acción:** permitir, **solo para rol superadmin**, conmutar tenant vía cabecera validada en el backend.

### 🟡 3.4 `sig_current_user` como clave global compartida
Al guardarse en el tenant `global`, todos los navegadores/sesiones comparten el mismo "usuario actual" en el servidor → en multiusuario real **se pisan entre sí**.
- **Acción:** el usuario actual debe derivarse del JWT/sesión, no almacenarse como estado global compartido.

### 🟡 3.5 Enlace roto en el chatbot
En `chatbotResponses` (index.html:1074): `./plan_de_continidad_de_negocio/code.html` tiene una errata (`continidad`); la carpeta real es `plan_de_continuidad_de_negocio`.

### 🔵 3.6 Icono inexistente
Se usa el símbolo Material `robot` (index.html:1117, 1359) que no existe en Material Symbols → no se renderiza. Usar p.ej. `smart_toy`.

---

## 4. Consistencia y empaquetado

### 🔴 4.1 El Instalable está obsoleto y sin seguridad
`2_Instalable_BOR4SIGE/.../server.js` es una **versión anterior**: sin JWT, sin multi-tenant, sin cifrado, persistencia en `db.json` plano y `GET /api/store` que **devuelve toda la base de datos a cualquiera**; además su `/api/chat` usa **Ollama**, no Gemini. La documentación describe la versión segura → el paquete que reciben los clientes **no coincide** y es inseguro.

### 🔴 4.2 `build_packages.ps1` genera un instalable que no arranca
El script copia `server.js` (nuevo, que hace `require('./database'|'./auth'|'./encryption')`) pero **no copia** `auth.js`, `database.js`, `encryption.js` ni `setup_db.js` (ver `rootFiles`, build_packages.ps1:51).
- **Impacto:** tras `build`, el instalable falla con `MODULE_NOT_FOUND` al iniciar.
- **Acción:** añadir esos módulos a la lista de copia y un `.env.example`; regenerar los `.zip`.

### 🟡 4.3 Integración WordPress: "SSO simulado" no implementado
El plugin pasa `wp_user`, `wp_role`, `tenant` por query string, pero `index.html` **no lee** esos parámetros (siempre exige login JWT). La promesa de SSO no está conectada.

---

## 5. Arquitectura y deuda técnica

- 🟡 **5.1 Modelo key-value como base de datos:** `tenant_store` (LONGTEXT con JSON) no aporta integridad referencial, consultas ni reporting SQL. Solo `auditorias` y `canal_de_denuncias` están normalizadas. Replantear un modelo relacional por módulo a medio plazo.
- 🟡 **5.2 +60 módulos como HTML estáticos** independientes con **Tailwind por CDN** (no recomendado en producción) y lógica duplicada. Vite está declarado en `package.json` pero **no se usa** (no hay bundling real).
- 🔵 **5.3 Carga de `.env` "manual"** duplicada en `server.js` y `setup_db.js`; usar `dotenv`.
- 🔵 **5.4 Sin tests automatizados ni CI:** `test_endpoints.js` es un script manual; además su consulta sí coincide con el mock, ocultando el bug 3.1.
- 🔵 **5.5 Peso del repositorio:** PDFs versionados en `4_Documentos` (~28 MB + ~9 MB) y artefactos (`image.png_*`, `standardized_enterprise_core_*`, capturas `screen.png`). Considerar Git LFS o sacarlos del repo.
- 🔵 **5.6 IA:** modelo `gemini-1.5-flash` fijo, sin streaming ni timeout configurable.

---

## 6. Documentación

- 🟡 **6.1 `PLAN_MEJORAS.md`** marca todo como "YA IMPLEMENTADO" y cita "Chatbot Ollama + RAG", cuando la app actual usa **Gemini**. Está desactualizado.
- 🟡 **6.2 `README_proyecto.md`** describe la arquitectura segura (JWT/MariaDB/cifrado) que **no está** en el paquete instalable real (ver 4.1).

---

## 7. Plan de desarrollo propuesto (por fases)

### Fase 0 — Contención de seguridad (inmediato, < 1 día)
1. Sacar `.env` de git, añadirlo a `.gitignore`, crear `.env.example`. *(2.1)*
2. **Rotar** GEMINI_API_KEY, JWT_SECRET y ENCRYPTION_KEY; purgar del historial. *(2.1, 2.2)*
3. Hacer que el servidor falle si faltan secretos en producción (sin fallback). *(2.2, 2.7)*

### Fase 1 — Correcciones críticas de seguridad (1–3 días)
4. Proteger `/api/chat` con JWT + rate-limiting + validación de entrada. *(2.4)*
5. Control de rol en claves globales de `/api/store` (solo superadmin). *(2.3)*
6. `helmet`, CORS con allowlist, rate-limiting en login. *(2.5)*
7. Política de contraseñas y cambio forzado en primer login; retirar semillas de producción. *(2.6)*

### Fase 2 — Corrección de bugs funcionales (2–4 días)
8. Reparar el simulador en memoria (alinear con la consulta real) o migrar a SQLite. *(3.1)*
9. Corregir la recursión de `api-sync.js` (excluir `sig_time_*`). *(3.2)* — **verificar en navegador**.
10. Conmutación de tenant para superadmin en backend. *(3.3)*
11. Derivar el usuario actual del JWT, no de clave global. *(3.4)*
12. Corregir enlace `continuidad` e icono `robot`. *(3.5, 3.6)*

### Fase 3 — Coherencia de distribución (2–3 días)
13. Unificar el Instalable con la app segura; actualizar `build_packages.ps1` para incluir `auth.js`/`database.js`/`encryption.js`/`setup_db.js`/`.env.example`. *(4.1, 4.2)*
14. Implementar de verdad el SSO desde WordPress (leer query params y emitir JWT) o documentar que requiere login. *(4.3)*
15. Regenerar y verificar los `.zip` arrancando cada paquete.

### Fase 4 — Calidad y arquitectura (continuo)
16. Tests automatizados (auth, aislamiento de tenant, cifrado, store) + CI. *(5.4)*
17. `dotenv`, limpieza de artefactos, Git LFS para PDFs. *(5.3, 5.5)*
18. Plan de migración del modelo key-value a relacional por módulo. *(5.1)*
19. Build real con Vite / Tailwind compilado para producción. *(5.2)*
20. Actualizar `PLAN_MEJORAS.md` y `README_proyecto.md`. *(6.1, 6.2)*

---

## 8. Matriz de priorización

| ID | Hallazgo | Sev. | Esfuerzo | Fase |
|----|----------|------|----------|------|
| 2.1 | `.env` en git | 🔴 | Bajo | 0 |
| 2.2 | Secretos por defecto | 🔴 | Bajo | 0 |
| 2.3 | Escalada de privilegios `/api/store` | 🔴 | Medio | 1 |
| 2.4 | `/api/chat` sin auth | 🔴 | Bajo | 1 |
| 4.1 | Instalable obsoleto/inseguro | 🔴 | Medio | 3 |
| 4.2 | Build genera instalable roto | 🔴 | Bajo | 3 |
| 3.1 | Fallback en memoria roto | 🟠 | Medio | 2 |
| 3.2 | Recursión `api-sync.js` | 🟠 | Bajo | 2 |
| 3.3 | Tenant switch superadmin | 🟠 | Medio | 2 |
| 2.5 | Endurecimiento HTTP | 🟠 | Bajo | 1 |
| 2.6 | Credenciales por defecto | 🟠 | Medio | 1 |
| 3.4 | `sig_current_user` global | 🟡 | Medio | 2 |
| 3.5 | Enlace roto chatbot | 🟡 | Trivial | 2 |
| 4.3 | SSO WP no implementado | 🟡 | Medio | 3 |
| 5.x | Deuda técnica | 🔵/🟡 | Alto | 4 |
| 6.x | Documentación | 🟡 | Bajo | 4 |

---

---

## 9. Estado de remediación (actualizado 2026-06-20)

Tras la auditoría se aplicaron y **verificaron** las correcciones de las Fases 0–4. Resumen:

| ID | Hallazgo | Estado | Verificación |
|----|----------|--------|--------------|
| 2.1 | `.env` en git | ✅ Corregido | `.env` fuera del índice + `.gitignore` + `.env.example` |
| 2.2 | Secretos por defecto | ✅ Corregido | Rotados; el servidor aborta sin secreto en producción |
| 2.3 | Escalada de privilegios `/api/store` | ✅ Corregido | Test: usuario normal → 403; superadmin → 200 |
| 2.4 | `/api/chat` sin auth | ✅ Corregido | Test: sin token → 401; rate-limit activo |
| 2.5 | Endurecimiento HTTP | ✅ Corregido | Helmet (CSP), CORS allowlist, rate-limit login |
| 2.6 | Credenciales por defecto | ✅ Mitigado | Sin seed demo en producción; cambio de contraseña |
| 2.7 | Diseño criptográfico | ✅ Mejorado | scrypt + salt por registro (formato `v2:`) |
| 3.1 | Fallback en memoria roto | ✅ Corregido | Test: GET /api/store devuelve 35 claves (antes `[]`) |
| 3.2 | Recursión `api-sync.js` | ✅ Corregido | Métodos nativos + exclusión `sig_time_*` |
| 3.3 | Tenant switch superadmin | ✅ Corregido | Test: superadmin ve beta; usuario normal no |
| 3.4 | `sig_current_user` global | ✅ Corregido | Estado por sesión + `/api/auth/me` |
| 3.5/3.6 | Enlace roto / icono | ✅ Corregido | `continuidad` + `smart_toy` |
| 4.1 | Instalable obsoleto | ✅ Corregido | Sincronizado con la versión segura |
| 4.2 | Build genera instalable roto | ✅ Corregido | `build_packages.ps1` incluye módulos backend |
| 5.3 | Carga `.env` manual | ✅ Corregido | `dotenv` |
| 5.4 | Sin tests | ✅ Corregido | `npm test` (7 pruebas, todas en verde) |
| 5.1 | Modelo relacional | ✅ Integrado | Capa `db_operations.js`/`db_migration.js` como almacén primario + paginación; **pendiente de verificar con MariaDB** |
| 4.3 | SSO WordPress | ⏳ Pendiente | Requiere diseño de secreto compartido WP↔backend |
| 5.2 | Build Tailwind producción | ⏳ Roadmap | — |
| 5.5 | Peso del repo / Git LFS | ⏳ Roadmap | — |

### Integración de la capa relacional (decisión del 2026-06-20)

Se optó por **integrar ambas arquitecturas**: la capa relacional normalizada (`db_operations.js` + `db_migration.js`, con paginación) actúa como almacén primario, y toda la capa de seguridad se mantiene encima:

- `GET /api/store` carga vía `db_operations.loadAllData` y **filtra por tenant** (la función relacional devuelve todos los tenants; el filtrado evita fugas entre organizaciones).
- `POST /api/store` aplica control de rol, claves cliente-only y **guardia de escritura cross-tenant** (un usuario no superadmin solo escribe claves globales o de su propio tenant).
- Si MariaDB no está disponible, el backend **conmuta de forma transparente** al almacén clave-valor con simulador en memoria (verificado).
- Nuevo endpoint `GET /api/store/paginated` para conjuntos grandes (requiere MariaDB).

**Despliegue con MariaDB (orden):** `node db_migration.js` (esquema relacional de módulos) **y** `npm run setup` / `node setup_db.js` (tablas de autenticación `usuarios`, `tenant_store`, `auditorias`, `canal_de_denuncias`).

**Deuda técnica resultante del merge (a reconciliar más adelante):**
- Duplicidad `users` (relacional, sin password, para el directorio) vs `usuarios` (autenticación). La auth usa `usuarios`.
- Solapamiento `canal_denuncias` (relacional, sin cifrar) vs `canal_de_denuncias` (endpoint dedicado con cifrado E2E).
- La ruta relacional **no se ha podido probar en este entorno** (sin MariaDB); sí se verificó el fallback y toda la capa de seguridad.

### Acciones manuales pendientes para el responsable
1. **Rotar la `GEMINI_API_KEY` en la consola de Google** (la anterior quedó expuesta y debe revocarse). Ya hay un valor en `.env`, pero conviene emitir una clave nueva.
2. Definir `CORS_ORIGINS` y `NODE_ENV=production` en el servidor de producción.
3. Generar secretos `JWT_SECRET`/`ENCRYPTION_KEY` propios del entorno de producción (los del `.env` actual son de desarrollo).
4. **Verificar la ruta relacional con MariaDB activa**: ejecutar `node db_migration.js` + `node setup_db.js`, arrancar el servidor y comprobar `GET /api/store` y `GET /api/store/paginated` (no ha sido posible probarlo en el entorno de auditoría por no haber MariaDB).

*Informe inicial: auditoría sin cambios. Sección 9 añadida tras aplicar y verificar las correcciones.*
