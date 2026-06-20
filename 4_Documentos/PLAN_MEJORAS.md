# Plan de Mejoras Bor4SIGE — Hoja de Ruta

## Estado Actual (Auditoría)

| # | Propuesta | Estado |
|---|-----------|--------|
| 1.1 | Aislamiento Multi-Tenant en api-sync.js | ✅ **YA IMPLEMENTADO** |
| 1.2 | Agente IA centralizado en index.html | ✅ **YA IMPLEMENTADO** |
| 1.3 | Limpiar nav duplicada de submódulos | ✅ **YA IMPLEMENTADO** |
| 2.1 | Chatbot Gemini + RAG (proxy backend autenticado) | ✅ **YA IMPLEMENTADO** |
| 2.2 | Reglas IA adicionales (Auditorías §9.2, EIME) | ✅ **YA IMPLEMENTADO** |
| 3.1 | BCP: BIA dinámico + Simulacros | ✅ **YA IMPLEMENTADO** |
| 3.2 | Canal Denuncias: Tracking + CAPA | ✅ **YA IMPLEMENTADO** |
| 3.3 | Investigación SST: 5 Porqués + Ishikawa | ✅ **YA IMPLEMENTADO** |
| 3.4 | Ambientales: Significancia dinámica + CC | ✅ **YA IMPLEMENTADO** |
| 4.1 | Módulo Políticas del SGI | ✅ **YA IMPLEMENTADO** |
| 4.2 | Módulo Satisfacción de Clientes | ✅ **YA IMPLEMENTADO** |
| 4.3 | Módulo Consulta/Participación Trabajadores | ✅ **YA IMPLEMENTADO** |
| 4.4 | Módulo SoA ISO 27001 | ✅ **YA IMPLEMENTADO** |

## Orden de Ejecución

### 🔵 Fase 1 — Infraestructura visual (Rápido, alto impacto UX)
1. Inyectar script de auto-limpieza de nav/header duplicados en todos los submódulos (1.3)
2. Enriquecer `index.html` con reglas IA adicionales (2.2)

### 🟢 Fase 2 — Mejoras funcionales (Iteración en submódulos)
3. BCP: BIA interactivo + Registro de Simulacros (3.1)
4. Canal Denuncias: Código seguimiento + CAPA (3.2)
5. Investigación SST: 5 Porqués + Ishikawa + Testigos (3.3)
6. Ambientales: Matriz dinámica + Vinculación CC (3.4)

### 🟣 Fase 3 — Nuevos Módulos
7. Módulo de Políticas del SGI (4.1)
8. Módulo de Satisfacción del Cliente (4.2)
9. Módulo de Participación de Trabajadores (4.3)
10. Módulo de Declaración de Aplicabilidad (SoA) (4.4)

## Enfoque Técnico

- **Patrón de interceptor:** Modificar `api-sync.js` para inyectar en cada submódulo un script de limpieza que detecte `window.self !== window.top` y oculte headers/sidebars duplicadas.
- **Datos:** Usar `localStorage` con claves tenantizadas `sig_<modulo>_<tenant>` (ya funcionando).
- **Sin frameworks nuevos:** Mantener HTML + Tailwind + JS vanilla para coherencia con la base existente.
- **Estilo:** Reutilizar el sistema de diseño de Bor4SIGE (azul marino `#003366`, IBM Plex Sans, Material Symbols).

---

## Auditoría 2026-06-20 — Correcciones aplicadas

Ver detalle completo en [`INFORME_AUDITORIA_2026-06-20.md`](INFORME_AUDITORIA_2026-06-20.md).

| # | Corrección | Estado |
|---|------------|--------|
| 2.1 | `.env` sacado de git + `.gitignore` + `.env.example` | ✅ Aplicado |
| 2.2 | Secretos JWT/cifrado rotados; sin fallback en producción | ✅ Aplicado |
| 2.3 | Control de rol en claves globales de `/api/store` (anti-escalada) | ✅ Aplicado |
| 2.4 | `/api/chat` autenticado + rate-limiting + validación de entrada | ✅ Aplicado |
| 2.5 | Helmet (CSP), CORS allowlist, rate-limit en login | ✅ Aplicado |
| 2.6 | Sembrado de credenciales demo bloqueado en producción + cambio de contraseña | ✅ Aplicado |
| 2.7 | Cifrado con scrypt + salt por registro | ✅ Aplicado |
| 3.1 | Fallback en memoria reparado (consulta alineada) | ✅ Aplicado |
| 3.2 | Recursión en `api-sync.js` corregida | ✅ Aplicado |
| 3.3 | Conmutación de tenant del superadmin en backend | ✅ Aplicado |
| 3.4 | `sig_current_user` como estado por sesión (`/api/auth/me`) | ✅ Aplicado |
| 3.5/3.6 | Enlace `continuidad` e iconos `smart_toy` corregidos | ✅ Aplicado |
| 4.2 | `build_packages.ps1` incluye módulos backend en el instalable | ✅ Aplicado |
| 4.1 | Instalable sincronizado con la versión segura | ✅ Aplicado |
| 5.3/5.4 | `dotenv` + pruebas automatizadas (`npm test`) | ✅ Aplicado |
| 5.1 | Migración a modelo relacional (`db_operations`/`db_migration` + paginación) | ✅ Integrado (verificar con MariaDB) |
| 4.3 | SSO real desde WordPress | ⏳ Pendiente (requiere diseño de secreto compartido) |
| 5.2 | Build de producción con Tailwind compilado (sin CDN) | ⏳ Roadmap |