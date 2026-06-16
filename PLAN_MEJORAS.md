# Plan de Mejoras Bor4SIGE — Hoja de Ruta

## Estado Actual (Auditoría)

| # | Propuesta | Estado |
|---|-----------|--------|
| 1.1 | Aislamiento Multi-Tenant en api-sync.js | ✅ **YA IMPLEMENTADO** |
| 1.2 | Agente IA centralizado en index.html | ✅ **YA IMPLEMENTADO** |
| 1.3 | Limpiar nav duplicada de submódulos | 🔴 Pendiente |
| 2.1 | Chatbot Ollama + RAG | ✅ **YA IMPLEMENTADO** |
| 2.2 | Reglas IA adicionales (Auditorías §9.2, EIME) | 🔴 Pendiente |
| 3.1 | BCP: BIA dinámico + Simulacros | 🔴 Pendiente |
| 3.2 | Canal Denuncias: Tracking + CAPA | 🔴 Pendiente |
| 3.3 | Investigación SST: 5 Porqués + Ishikawa | 🔴 Pendiente |
| 3.4 | Ambientales: Significancia dinámica + CC | 🔴 Pendiente |
| 4.1 | Módulo Políticas del SGI | 🔴 Pendiente |
| 4.2 | Módulo Satisfacción de Clientes | 🔴 Pendiente |
| 4.3 | Módulo Consulta/Participación Trabajadores | 🔴 Pendiente |
| 4.4 | Módulo SoA ISO 27001 | 🔴 Pendiente |

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