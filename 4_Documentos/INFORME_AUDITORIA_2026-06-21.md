# Informe de Auditoría Crítica del Estado Actual — Bor4SIGE

**Fecha:** 2026-06-21
**Versión revisada:** v2.4.0 (rama `main`, árbol limpio antes de esta revisión)
**Alcance:** backend (Node.js/Express + MariaDB), 75 HTML del frontend (Tailwind CDN + JS vanilla), `api-sync.js`, plugin WordPress, script de empaquetado y documentación.
**Método:** Lectura estática + búsquedas ripgrep + razonamiento profundo. No se han ejecutado ni modificado archivos.

> Leyenda: 🔴 Crítico (bloqueante para producción) · 🟠 Alto · 🟡 Medio (deuda seria) · 🔵 Bajo/UX · ✅ Bien

---

## 1. Resumen ejecutivo

Bor4SIGE ha alcanzado un nivel funcional impresionante (75 módulos HTML, cifrado E2E, multi-tenant, chatbot IA y plugin para WordPress), pero arrastra un cúmulo de deuda técnica y decisiones no sostenibles. La auditoría previa (2026-06-20) marcó 4 tareas pendientes (SSO WP, build Tailwind, Git LFS, verificar MariaDB) que siguen abiertas dos semanas después. Sobre esa base aparecen nuevos hallazgos en prácticamente todas las capas:

1. 🔴 **75 HTML escribiendo `localStorage.setItem` directo**: el aislamiento multi-tenant solo se cumple si el módulo corre dentro del iframe del portal padre. Si se abre un módulo directamente, el interceptor no se activa y los datos se mezclan entre organizaciones.
2. 🔴 **Prompt injection en el chatbot**: `/api/chat` confía en el `systemPrompt` enviado por el cliente (hasta 12 000 caracteres) y lo concatena con el contexto RAG.
3. 🔴 **CSP rota**: `script-src` con `'unsafe-inline'` y `'unsafe-eval'` para soportar la inyección dinámica de Tailwind CDN, anulando la defensa XSS.
4. 🔴 **Destrucción accidental de datos**: ejecutar `setup_db.js` o `migrate_to_uuid_kv.js` puede sobrescribir contraseñas reales o hacer `DROP TABLE` sin confirmación.
5. 🟠 **Polling agresivo del Agente IA**: `setInterval(..., 6000)` por cada pestaña abierta, sin backoff ni deduplicación.

El sistema funciona bien para un único tenant en local, pero no está listo para multi-tenant real, ni para exposición a Internet, ni para uso simultáneo por equipos distribuidos. La buena noticia: la mayoría de problemas son reorganización, no reescritura.

---

## 2. Hallazgos críticos (bloqueantes de producción)

### 🔴 2.1 Aislamiento multi-tenant roto fuera del iframe del portal
**Archivos:** los 75 `*code.html`, `api-sync.js`.

`api-sync.js` solo sobrescribe `Storage.prototype.setItem/getItem` cuando `window.parent && window.parent.sigDbState` existe. Pero los módulos llaman a `localStorage.setItem(...)` directamente (`acciones_correctivas/code.html:444`, `compras_y_evaluacion_proveedores/code.html:854`, `directorio_de_personal/code.html:346/480/533`, etc.). Cuando un usuario abre cualquiera de esos HTML directamente:

- Se escribe en `localStorage` real sin sufijo de tenant.
- NO se envía nada al backend.
- Al volver al portal, los datos aparecen como si fueran globales.

**Impacto:** fuga de datos entre tenants en el navegador, pérdida silenciosa de escrituras, inconsistencia entre clientes.

**Acción:** centralizar TODA persistencia en `window.sigSet/sigGet` en `api-sync.js` y prohibir `localStorage.*` directo (regla ESLint).

### 🔴 2.2 Prompt injection en `/api/chat`
**Archivos:** `index.html:1017-1100`, `server.js:222-282`.

El endpoint recibe `systemPrompt` del cliente, lo acepta sin validar y lo concatena con RAG. Límite 12 000 caracteres. Un usuario logueado puede manipular el texto para extraer otros datos del contexto o desviar a Gemini.

**Acción:** el servidor construye el `systemPrompt` completo desde RAG + configuración interna. El cliente solo envía `query`.

### 🔴 2.3 CSP anulada por requisitos del frontend
**Archivos:** `server.js:20-30`, `index.html:30-46`.

`script-src: "'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com"`. La razón: `<script id="tailwind-config">` inline + clases dinámicas generadas por Tailwind CDN.

**Acción:** migrar a Tailwind compilado (Vite + PostCSS), eliminar `'unsafe-inline'`/`'unsafe-eval'`, sustituir por Nonce dinámico por petición.

### 🔴 2.4 Destrucción de datos por scripts con acciones irreversibles
- `setup_db.js:220-228`: `INSERT ... ON DUPLICATE KEY UPDATE password=VALUES(password)` resetea contraseñas reales si se ejecuta en producción sin el flag correcto.
- `migrate_to_uuid_kv.js:71-103`: `SET FOREIGN_KEY_CHECKS = 0; DROP TABLE IF EXISTS` para 23 tablas, sin confirmación.

**Acción:** añadir banners `--force`, requerir `PRODUCTION_ACK=true`, separar `setup_demo` y `setup_prod`.

### 🔴 2.5 Plugin WordPress embebido sin `sandbox`, con permisos excesivos
**Archivos:** `templates/app-loader.php`, `bor4sige-wp-addon.php`.

```html
<iframe id="bor4sige-iframe" src="..." allow="clipboard-write; camera; geolocation" ...>
```

Sin `sandbox`, sin `referrerpolicy`, sin `credentialless`. Si el WP sufriera un XSS, el atacante obtiene control total dentro del iframe.

**Acción:** añadir `sandbox="allow-scripts allow-same-origin allow-forms"` y reducir `allow` a lo imprescindible.

### 🔴 2.6 Secretos JWT/ENCRYPTION con fallback a valores conocidos
(Ya marcado en auditoría 2026-06-20). `auth.js:25-29` aborta en producción si falta `JWT_SECRET`, pero conviene un test automatizado que falle el build si el `.env` contiene los valores de fallback.

---

## 3. Debilidades de arquitectura

### 🟠 3.1 Inconsistencia capa relacional vs clave-valor
**Archivos:** `db_operations.js:402-405, 527-555`, `server.js:111-130`.

Cuatro scripts compiten:
1. `setup_db.js` → tablas básicas (`usuarios`, `tenant_store`, `auditorias`, `canal_de_denuncias`).
2. `db_migration.js` → 26 tablas SIN lookups (`VARCHAR` libres para enums).
3. `migrate_to_uuid_kv.js` → recrea con FKs a lookups + `DROP TABLE` masivo.
4. `db_operations.js` → módulo de lectura/escritura del backend.

Para llegar al "E-R puro" hay que correr los tres primeros en orden (no documentado) y confiar en que `db_operations.js` mantenga coherencia (no siempre: `saveDataKey` para `sig_users` no escribe en `users`, solo en `sige_settings` mapeado en `db_operations.js:418`).

**Acción:** un único `npm run migrate` idempotente.

### 🟠 3.2 Pérdida de datos offline con sesión expirada
**Archivo:** `api-sync.js:128-172`.

Al reconectar, si el JWT caducó, `handleUnauthorized()` borra la cola entera. Los datos offline creados durante la desconexión se pierden sin advertencia.

**Acción:** preservar en `dead_letter_queue` con marca `EXPIRED_AT`.

### 🟠 3.3 Agente IA con polling por pestaña
**Archivos:** `index.html:614-625, 902-908`.

`setInterval(runAiComplianceScan, 6000)` por pestaña. Con 5 pestañas son 5 escaneos cada 6 s, leyendo todas las claves `sig_*` y emitiendo hasta 8 logs al backend.

**Acción:** un único timer global del portal padre + Web Worker + SSE.

### 🟠 3.4 `loadAllData` sin caché ni ETag
**Archivo:** `db_operations.js:64-344`.

Cada `GET /api/store` recorre las 26 tablas íntegramente. En una organización mediana, cientos de KB por respuesta.

**Acción:** caché con invalidación por escritura o ETag por timestamp de tenant.

### 🟠 3.5 SSO WordPress sigue sin implementarse
**Archivos:** `templates/app-loader.php`, `bor4sige-wp-addon.php`, `index.html`.

El plugin pasa `wp_user`, `wp_role`, `tenant` por query string, pero el portal los ignora y exige login JWT propio.

**Acción:** HMAC compartido WP ↔ backend para emitir JWT, o documentar la limitación.

### 🟠 3.6 Endpoints sin versionar / sin compresión / sin healthcheck / sin logging profesional
- Sin `/api/v1/*`.
- Express sin `compression`.
- Sin `/healthz` para Cloud Run.
- `console.log/error` en lugar de `pino`/`winston`.

**Acción:** middleware estándar, `/healthz`, versionado, logging estructurado.

---

## 4. Deuda técnica importante

### 🟡 4.1 75 HTML con duplicación masiva
Cada HTML duplica Tailwind CDN, Google Fonts, Material Symbols, `<script src="../api-sync.js"></script>`, cabeceras, lógica de bootstrap. `index.html` pesa +1 100 líneas.

**Acción:** Web Components (`<bor4-layout>`, `<bor4-modal>`) o build con Vite + Handlebars.

### 🟡 4.2 Vite declarado pero no usado
`pac
