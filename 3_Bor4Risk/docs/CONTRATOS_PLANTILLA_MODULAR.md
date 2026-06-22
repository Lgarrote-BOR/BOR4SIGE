# Contratos del Patron Modular BOR4SIGE (Clon Risk 3_Bor4Risk v0.1.0)

> **Estado:** generado el 2026-06-21 al cerrar el clon C (orden C del cuaderno v1.5a, con M1 + S1 + S2/S4 aplicados tras review).
> **Rol:** clon de 2_Bor4Legal/ y 3_Bor4Quality/ aplicado al dominio **Gestion de Riesgos MAGERIT v3**.
> **Predecesores ratificados:** 2_Bor4Legal/ v0.2 (orden A) y 3_Bor4Quality/ v0.1.0 (orden B), 5 contratos ratificados.

## Tabla resumen de contratos

| ID   | Nombre              | Estado |
|------|---------------------|--------|
| C-ID | IDENTIDAD           | RATIFICADO |
| C-DAT| DATOS               | RATIFICADO |
| C-DEP| DESPLIEGUE          | RATIFICADO (solo stdlib) |
| C-BIT| BITACORA            | RATIFICADO (in-memory) |
| C-HT | HASH-TEMPLATE (D12) | RATIFICADO |

## 1. C-IDENTIDAD (Risk)

No lee tabla `usuarios` B4S. `PlataformaContexto.token_version` placeholder hasta D-002. Cabecera `X-Internal-Tenant-Risk` post-`integra` con HMAC-SHA256 (key=`BOR4RISK_HMAC_KEY`).

## 2. C-DATOS (Risk)

**Compartidas B4S**: `organizations`, `users`, `personal`, `audit_log_central`. **Aisladas Risk**: catalogos `lkp_magerit_activos`, `lkp_magerit_amenazas`, `lkp_magerit_salvaguardas`; resultados `roe_emitidas`, `matriz_riesgos`, `evaluaciones_l2`. **Prefijo modulo**: `r` / `roe_*` / `r_*`.

## 3. C-DESPLIEGUE (Risk)

`pyproject.toml` con `dependencies = []` (solo stdlib). `python>=3.10`. CLI: `python -m bor4risk.cli <perfil.json>`.

## 4. C-BITACORA (Risk)

Cada ROE incluye: `roe_id`, `snapshot_id`, `snapshot_emision`, `rule_id`, `anchor_id`, `roe_snapshot_hash`, `template_id_used`. Hook_trace en `VectorActivacion` para reproducibilidad determinista. `audit_log_central` real: D-002.

## 5. C-HASH-TEMPLATE (Risk) — clon D12

`roe_snapshot_hash` calculado sobre `{rule_id, snapshot_id, v_f, template_id_used, idioma}`. Texto literal NO entra al hash; git history del archivo `src/bor4risk/engine/oe_renderer.py` (cada `template_id` corresponde a un commit). `_validate_tpl_router_consistency()` corre en import-time. Para reconstruccion del texto archivado: `git log -p -S 'tpl-R-101-v1' -- src/bor4risk/engine/oe_renderer.py`.

## Variaciones legitimas del patron (riesgos)

- **V_CE almacena listas** (ids de amenazas o sub-struct de riesgos vulnerables).
- **Reglas R-201 + R-301 son JOINs computacionales** entre activos/amenazas/salvaguardas.
- **R-101 + R-401 retornan multi-output (dict)** con trigger bool + content field (`activos_criticos`/`pct_preventivas`).
- **S2 fix:** normalizacion de `tipo` (lowercase + rstrip 's').
- **S4 fix:** rename `i_` → `incidencia`.

## C-RBAC (transversal)

4 roles (R-MOD-1..4). CAPACIDADES risk-flavored. SoD estricto con `_SOD_EXENTAS={oe.replay}`. Audit D11: `rbac_audit[]` + `rbac_audit_summary{}` como campos hermanos del JSON.

## Estado del clon v0.1.0 (Risk)

- AST estricto: 11 archivos .py AST-OK.
- 4/4 pytest verde en tests/cantera/test_smoke_e2e.py.
- M1+S1+S2+S4 aplicados.

## DEFER explicitos

F3/S10 boundary tests, D-002 "integra", OE_SCHEMA jsonschema, versionado efectivo del router, cross-module RBAC review (`bitacora.leer:R-MOD-2=True`).

## Conclusion inductiva

Por TERCER dominio consecutivo (Legal -> Quality ISO 9001 -> Risk MAGERIT), los 5 contratos del patron BOR4SIGE aguantan **incluso cuando el sustrato computacional es estructuralmente distinto**. Cierra el N=3.

## Propagacion D-002 (2026-06-21)

Estado: **Risk MAGERIT v3 v0.3.0** — clon del piloto Legal `2_Bor4Legal/` v0.3.0.

Cambios aplicados:
- `src/bor4risk/security/integration.py`: copia IDENTICA al piloto (self-contained, importa `.rbac` local).
- `src/bor4risk/cli.py`: `PlataformaContexto` ahora via `from_env()` (antes literal single-line); `main()` con argparse `--token/--token-secret/--snapshot-id`; `--token` sin `--token-secret` devuelve exit code 3; `version_piloto 0.1.0 -> 0.3.0`.
- `tests/cantera/test_integration.py`: 12 tests adaptados del piloto (imports `bor4risk`).

Contrato heredado: 5 contratos ratificados (C-IDENTIDAD, C-DATOS, C-DESPLIEGUE, C-BITACORA, C-HASH-TEMPLATE). Ver `2_Bor4Legal/docs/CONTRATOS_PLANTILLA_MODULAR.md` §6 "D-002 INTEGRA" para la especificacion completa del piloto.

Modo standalone preservado: sin `B4S_JWT`/`B4S_JWT_SECRET`, `from_env()` cae al placeholder del clon (rol_plataforma='usuario', tenant_id='es', token_version=0).
