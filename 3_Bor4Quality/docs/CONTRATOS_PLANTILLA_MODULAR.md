# Contratos del Patron Modular BOR4SIGE (Clon Quality 3_Bor4Quality v0.1.0)

> **Estado:** generado el 2026-06-21 al cerrar el clon A (orden B del cuaderno v1.5a).
> **Rol:** clon de `2_Bor4Legal/` aplicado al dominio **Sistema de Gestion de Calidad ISO 9001:2015**.
> **Predecesor ratificado:** piloto `2_Bor4Legal/` v0.2 cerrado verde con 36/36 tests verdes, 5 contratos validados.
> **Proposito:** demostrar empiricamente que los 5 contratos del patron son **replicables** a otro dominio (no particularismos del piloto Legal).

---

## Tabla resumen de contratos

| ID     | Nombre                          | Estado clon Quality v0.1.0 |
|--------|---------------------------------|----------------------------|
| C-ID   | IDENTIDAD                       | RATIFICADO                 |
| C-DAT  | DATOS                           | RATIFICADO                 |
| C-DEP  | DESPLIEGUE                      | RATIFICADO                 |
| C-BIT  | BITACORA                        | RATIFICADO (in-memory)     |
| C-HT   | HASH de plantilla (D12)         | RATIFICADO                 |

Y por induccion (orden C del cuaderno): el patron aguantara un tercer dominio.

---

## 1. C-IDENTIDAD (Quality)

**ISO 27001 A.9 (control de acceso) — equivalente funcional al piloto Legal.**

- El modulo Quality **NO** lee la tabla `usuarios` de BOR4SIGE.
- `PlataformaContexto.token_version` queda como placeholder hasta que se ejecute `D-002 "integra"`, que conectara con `auth.js` (B4S).
- Cabecera esperada post-`integra`: `X-Internal-Tenant-Quality` con HMAC-SHA256 (key=`BOR4QUALITY_HMAC_KEY`).
- Roles de plataforma (pre-`integra`): placeholder `rol_plataforma="usuario"`; consulta a `auth.js` se difiere a `D-002`.

## 2. C-DATOS (Quality)

**Aislamiento por prefijo de modulo. Solo tablas compartidas con B4S son leidas.**

- **Compartidas con B4S** (solo lectura, post-`integra`): `organizations`, `users`, `personal`, `audit_log_central`.
- **Aisladas Quality** (prefijo `q` y/o su propio tenant_id):
  - Catalogos: `lkp_iso_9001_capitulos`, `lkp_kpis_calidad`, `lkp_no_conformidades_categorias`.
  - Resultados: `qoe_emitidas`, `perfiles_cantera`, `evaluaciones_l2`.
- **Prefijo de modulo**: `q` (Quality), `qoe_*` para OE del modulo, `q_*` para catalogos.
- **Multi-tenant**: `tenant_id` en cada fila; el modulo Quality se ejecuta dentro de un unico tenant por evaluacion.

## 3. C-DESPLIEGUE (Quality)

**Mismo perfil de despliegue que el piloto Legal: standalone, stdlib, ejecutable end-to-end.**

- `pyproject.toml` con `dependencies = []` (solo stdlib).
- `python>=3.10` (enum nativo, dataclasses, type hints maduros).
- CLI invokable: `python -m bor4quality.cli <perfil.json>` → JSON en stdout.
- Sin red, sin bases de datos externas: todo en memoria o json en disco.
- Tests ejecutables con `pytest tests/cantera/` sin servicios externos.

## 4. C-BITACORA (Quality)

**Trazabilidad minima reproducible.**

- Cada OE incluye: `oe_id`, `snapshot_id`, `snapshot_emision`, `version_oe`, `rule_id`, `anchor_id`, `oe_legal_fuente`, `oe_snapshot_hash`, `template_id_used`, `idioma`.
- Bitacora in-memory en este clon (`hook_trace` en `VectorActivacion`); "`audit_log_central` real" se conecta en `D-002 "integra"`.

## 5. C-HASH-TEMPLATE (Quality) — clon D12

**Reproducibilidad bit-a-bit con `template_id` versionado.**

- El snapshot_hash se calcula sobre `{rule_id, snapshot_id, v_f, template_id_used, idioma}`. Texto literal de plantilla **NO** entra al hash.
- Plantillas se identifican por `tpl-{rid}-v{N}` (ej. `tpl-Q-101-v1`); renombrado mecanico desde claves genericas.
- Router `_REGLAS_TPL_VERSION` mantiene la ligadura rid → tpl_id para todas las reglas activas (Quality: Q-101, Q-201, Q-301, Q-401).
- `_validate_tpl_router_consistency()` corre en import-time y emite WARNING si detecta:
  - TPL huerfanas en `QOE_PLANTILLAS` sin router activo.
  - tpl_ids activos sin entrada en `QOE_PLANTILLAS`.
- Garantia de evidencia del texto literal: git history del archivo `src/bor4quality/engine/oe_renderer.py` (cada `template_id` corresponde a un commit concreto). Pickaxe operativo: `git log -p -S 'tpl-Q-101-v1' -- src/bor4quality/engine/oe_renderer.py` para reconstruccion del texto archivado.

**Nota v0.1.0 — capa OE_SCHEMA omitida:** El piloto `2_Bor4Legal/` adjuntaba validacion adicional via `OE_SCHEMA` (jsonschema) sobre el payload de cada OE. El clon Quality **omite** esa capa en v0.1.0 por dos razones: (a) no hay consumidor externo que demande schema validation hoy; (b) dataclass-native + type hints maduros en Python 3.10 ya proveen safety suficiente en el contorno actual del clon cantera. Promovable a v0.2 si aparece un downstream consumer (panel frontend, integrador externo). El contrato hash de plantilla se mantiene integro independientemente de esta capa.

---

## 6. C-RBAC (transversal, suma a los 5 anteriores)

**SoD estricto por defecto, exenciones minimas.**

- 4 roles: `R-MOD-1` Audltor, `R-MOD-2` Cliente, `R-MOD-3` Revisor, `R-MOD-4` Mantenedor.
- `CAPACIDADES` declaradas; si la capacidad no esta, el resultado es DENY (fail-closed).
- `INCOMPATIBLES` define SoD estricto: combinacion de roles incompatibles → DENY automatico.
- `_SOD_EXENTAS = frozenset({"oe.replay"})` para replay historico (no muta estado).
- Audit D11: el CLI genera `rbac_audit[]` con 5 escenarios ALLOW + DENY + `rbac_audit_summary{}` como **campos hermanos** del JSON (no embutidos).

---

## Estado del clon v0.1.0 (Quality)

- 10 archivos `.py` AST-OK verificables con `python -W error::SyntaxWarning -c "import ast; ast.parse(open(f).read())"`.
- Tests verdes: 4 tests en `tests/cantera/test_smoke_e2e.py` (E2E pipeline, RBAC audit ALLOW/DENY, D12 typo immunity con monkeypatch, SR2 orphan validator con caplog).
- Reproducibilidad determinista: `Evaluador.determinism_check(v_f, snapshot_id)` (mismo input → mismo `snapshot_hash_v_f`).
- Smoke CLI exit 0 con perfil de cobertura Quality (`Q-01..Q-15`); `rbac_audit_summary.all_match_expected=True`.

## DEFER explicitos (no bloquean clon v0.1.0)

- F1/F2 cleanup: extraer `_flatten_anchors` y `_build_rbac_audit` a `bor4quality/cli/_helpers.py` solo cuando aparezca un segundo caller.
- D-002 "integra": sustituir `PlataformaContexto` placeholder por lookup real a `auth.js` (B4S); propagar `token_version`; HMAC de cabeceras internas.
- Politica RBAC: revisar `CAPACIDADES["bitacora.leer"]` (hoy 4 roles = True; quizas deba restringirse a `R-MOD-1` only).
- Versionado de `_REGLAS_TPL_VERSION`: hoy contrato implícito; promoverlo a `lkp_router_template_versions` con `effective_from` cuando haya cambio real.

---

## Conclusion del clon

Los 5 contratos ratificados en el piloto Legal **se sostienen sin cambios estructurales** al migrar al dominio Quality (ISO 9001:2015). Esto valida que el patron BOR4SIGE es **generalizable** y reduce el riesgo de una tercera clonacion. Pendiente: clon de un tercer dominio (e.g. Riesgos-Magerit o SST-ISO 45001) para cerrar el N=3.
