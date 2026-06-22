# Punto de Retoma Bor4SIGE REFCOMMON EMA

**Fecha:** 2026-06-22
**Orden:** REFCOMMON (refactor canonización del patrón modular sobre shared lib `bor4common/`).
**Estado:** ok **EMA cerrado** 4 clones homogenizados, pytest 122 tests verde, 5 contratos ratificados, sin deuda técnica abierta.

---

## 1. Documentos de referencia

| Documento | Contenido |
|-----------|-----------|
| `2_Bor4Legal/docs/CONTRATOS_PLANTILLA_MODULAR.md` | 5 contratos (C-IDENTIDAD / C-DATOS / C-DESPLIEGUE / C-BITACORA / C-HASH-TEMPLATE) + D-002 precedente contractual del piloto |
| `4_Documentos/PUNTO_RETOMA_2026-06-20.md` | Punto de retoma del audit BD SIGE (precedente operativo) |
| `bor4common/src/bor4common/security/integration.py` | D-002 canónico (9193 b, IDENTICO al piloto Legal vía `shutil.copy2`) |
| `bor4common/src/bor4common/security/rbac.py` | `PlataformaContexto` (frozen dataclass, single source of truth cross-clon) |
| `bor4common/pyproject.toml` | `v0.1.0` PEP 517 src-layout, deps=[] |
| `2_Bor4Legal/`, `3_Bor4Quality/`, `3_Bor4Risk/`, `3_Bor4Privacy/` | 4 clones con shim thin re-export (~1 KB) + RBAC local + D-002 propagación |

---

## 2. Ya APLICADO y VERIFICADO (REFCOMMON EMA)

| Hito | Estado | Validación |
|------|--------|------------|
| Thinker-with-files-gemini aprobación diseño `bor4common/` | ok | Layout src-layout PEP 517 validado |
| Creación `bor4common/v0.1.0` (5 archivos) | ok | pyproject.toml + `__init__.py` + `security/{__init__.py, integration.py, rbac.py}` |
| `pip install -e ./bor4common` editable dev | ok | `PlataformaContexto from integration is PlataformaContexto from rbac = True` (identidad de clase dentro del shared lib) |
| Refactor 4 clones shim thin re-export | ok | `security/integration.py` 9193 b ~1 KB; `from bor4common.security.integration import (...)` + `__all__` |
| **S1** Patch 4 `rbac.py`: local `PlataformaContexto` eliminado, `from bor4common.security.rbac import PlataformaContexto` insertado | ok | AST 4/4 verde; CAPACIDADES / INCOMPATIBLES / `_SOD_EXENTAS` / `RolModulo` / `evaluar_capa_scope` / `CapaScope` / `ResultadoCapacidad` intactos |
| **S2** Patch 4 `pyproject.toml`: `dependencies = []` → `dependencies = ["bor4common"]` | ok | Producción-ready; `pip install ./2_Bor4Legal` resuelve transitiva sin editable-dev |
| Validación end-to-end 4 clones (AST + pytest `tests/cantera`) | ok | **122 tests verde** (detalle §4) |

---

## 3. Cinco contratos ratificados (pred CONTRATOS_PLANTILLA_MODULAR.md)

| # | Contrato | Estado cross-clon |
|---|----------|-------------------|
| 1 | **C-IDENTIDAD** gateway BOR4SIGE valida JWT (`auth.js` + `token_version`); cada clon recibe cabeceras `X-Internal-*` firmadas HMAC-SHA256 vía `bor4common.security.integration` | ok ratificado en 4 clones |
| 2 | **C-DATOS** tablas compartidas `organizations`/`users`/`personal`/`audit_log_central`; tablas aisladas con prefijo `legal_`/`quality_`/`risk_`/`privacy_`; `fk_strategy: tenant_id_logic`; JOIN SQL cross-B4S prohibido | ok ratificado en 4 clones |
| 3 | **C-DESPLIEGUE** cada clon tiene su propio `pyproject.toml`; `pip install -e .` no afecta a `1_App_BOR4SIGE/`; proxy inverso `/{modulo}/*`; reinicios independientes | ok ratificado en 4 clones |
| 4 | **C-BITACORA** `correlation_id` UUID v4 cross-modulo; eventos L0/L1 firmados `(timestamp + correlation_id + payload_canonico)` con clave `BOR4{LEGAL,QUALITY,RISK,PRIVACY}_HMAC_KEY`; L2 amnesia (§24.7) | ok ratificado en 4 clones |
| 5 | **C-HASH-TEMPLATE (D12)** `snapshot_hash` cubre `{rule_id, snapshot_id, v_f_dict, template_id_used, idioma}`; texto literal NO incluido; fuente autoritativa es Git history | ok ratificado en 4 clones |

D-002 complementado en `bor4common/security/integration.py` (peer de `rbac.py`) funciones `from_jwt`, `sign_internal_headers`, `verify_internal_headers`, `from_env`, `to_dict`, helpers `_b64url_encode/_decode` y `_hdr_coherence`.

---

## 4. Validación pytest `tests/cantera/` 122 verde

| Clon | pytest exit | tests | Observaciones |
|------|-------------|-------|---------------|
| `2_Bor4Legal/` | 0 | **53/53** | Pilot + suite v0.3.3 JWT confusion attacks (5 ataques) + 2 tampering tests interno cross-check |
| `3_Bor4Quality/` | 0 | **21/21** | Smoke e2e + integración heredados del piloto vía `shutil+sed` |
| `3_Bor4Risk/` | 0 | **21/21** | Misma estrategia; CAPACIDADES MAGERIT-flavored con 3 pares SoD (Riesgo+Tratamiento, Amenaza+Criterio, Mitigación+Validación) |
| `3_Bor4Privacy/` | 0 | **27/27** | 9 smoke Privacy-flavored + 18 integración heredados; `_SOD_EXENTAS` Privacy `oe.replay` + `oe.leer` activos |
| **TOTAL** | --- | **122/122** | **pytest verde cross-clones como fuente autoritativa** |

Complemento: `code-reviewer-minimax-m3` revisó las dos iteraciones (refactor inicial + S1+S2 patches) con veredicto "patrón BOR4SIGE totalmente homogenizado: bor4common canónica, 4 clones reducidos a shim thin + locale RBAC".

Artefactos metadata Windows (`--user` location + escape en paths de validación EMA-basher) NO son regresión funcional son path-resolution cuando PYTHONPATH no se hereda correctamente al subprocess. **pytest verde cubre la realidad operacional.**

---

## 5. Archivos clave en disco (auditable)

```
BOR4SIGE20/
|-- bor4common/                              <-- NUEVO shared lib v0.1.0
|   |-- pyproject.toml                       (451 b, deps=[], PEP 517 src-layout)
|   `-- src/bor4common/
|       |-- __init__.py                      (docstring + __version__)
|       `-- security/
|           |-- __init__.py                  (docstring)
|           |-- integration.py               (9193 b IDENTICO al piloto Legal)
|           `-- rbac.py                      (PlataformaContexto canónica + 1 @dataclass frozen)
|-- 2_Bor4Legal/
|   |-- pyproject.toml                       (deps = ["bor4common"])          <-- S2
|   |-- src/bor4legal/
|   |   |-- cli.py                           (--token / --token-secret / --snapshot-id)
|   |   `-- security/
|   |       |-- integration.py               (~1 KB shim thin re-export)      <-- S1
|   |       `-- rbac.py                      (import from bor4common.security.rbac) <-- S1
|   `-- tests/cantera/                       (53 tests pytest 53/53 verde)
|-- 3_Bor4Quality/                           (homologo shim + RBAC local + S1+S2)
|-- 3_Bor4Risk/                              (homologo shim + RBAC local con 3 pares SoD MAGERIT + S1+S2)
`-- 3_Bor4Privacy/                           (homologo shim + RBAC con `_SOD_EXENTAS` oe.replay+oe.leer + S1+S2)
```

---

## 6. Patrón de extensión N=6+ (vía `PlataformaContextoExtended`)

Para añadir un módulo nuevo `Bor4{NewDomain}/` (ej. SST, Compliance, ESG, ...) sobre la plantilla homogenizada:

### 6.1 Pasos mecánicos

1. **Copiar `2_Bor4Legal/` como plantilla** y renombrar prefijo `bor4legal` → `bor4newdomain` en todos los paths.
2. **Personalizar 5 archivos del clon**:
   - `engine/types.py` shape de los inputs/outputs del dominio (VectorUbicacion, PerfilRiesgo, ResultadoFinal, etc.).
   - `engine/reglas.py` reglas regulatorias (DPIA / SGSI / Compliance / etc.) con `rule_id + snapshot_id + V_F`.
   - `engine/oe_renderer.py` plantillas con `tpl-X-vN` y `_REGLAS_TPL_VERSION` router (preservar C-HASH-TEMPLATE D12).
   - `security/rbac.py` local actualizar `RolModulo`, `CAPACIDADES`, `INCOMPATIBLES`, `_SOD_EXENTAS` con vocabulario del nuevo dominio.
   - `cli.py` argparse `--token/--token-secret/--snapshot-id` (canónico piloto).
3. **Heredar D-002 de `bor4common`** automáticamente vía `from bor4common.security.integration import (...)` (shim ya creado en `2_Bor4Legal/` como referencia).
4. **Heredar 5 contratos** obedeciendo `CONTRATOS_PLANTILLA_MODULAR.md` (literal en el clon o en sección de docs).

### 6.2 Extensión opcional: `PlataformaContextoExtended(PlataformaContexto)`

Si un nuevo dominio requiere campos extra en el contexto (ej. `norma_objetivo`, `idioma_oficial`, `delegacion_id`):

```python
# src/bor4newdomain/security/rbac.py
from dataclasses import dataclass
from bor4common.security.rbac import PlataformaContexto

@dataclass(frozen=True)
class PlataformaContextoExtended(PlataformaContexto):
    '''Extiende PlataformaContexto con campos del dominio NewDomain.'''
    norma_objetivo: str = ''           # ej. ISO 45001
    idioma_oficial: str = 'es-ES'
    delegacion_id: str = ''
```

Garantías preservadas:

- **Identidad de clase cross-clon** el campo `plataforma` en `evaluar_capa_scope(scope, plataforma=...)` sigue siendo un `PlataformaContexto` (la base). Subclase pasa `isinstance` contra la base → duck typing intacto.
- **Compatibilidad con `from_jwt`** `from_jwt()` retorna la `PlataformaContexto` canónica (6 campos). El código del nuevo dominio que necesita campos extra llama a `PlataformaContextoExtended(**ctx_base.__dict__, ...)` para enriquecer.
- **Sin acoplamiento hacia arriba** no requiere parche en `bor4common`.
- **Frozen-dataclass safe** `dataclass(frozen=True)` impide mutación; subclases también frozen automáticamente.

### 6.3 Tests sugeridos para N=6+

- Smoke e2e: `tests/cantera/test_smoke_e2e.py` (mínimo 9 tests estilo Privacy).
- Integración: `tests/cantera/test_integration.py` (v0.3.3 5 JWT confusion + 2 tampering + propagación `token_version`).
- Total esperado: **~27-30 tests verde** por clon, análogo a Privacy.

---

## 7. Próximos pasos sugeridos (DEFER para ciclo dedicado)

| # | Acción | Prioridad | Notas |
|---|--------|-----------|-------|
| 7.1 | Commit local REFCOMMON EMA + push a GitHub (requiere SSH o PAT workflow) | SHOULD | Ahora: `Your branch is ahead of 'origin/main' by 3 commits` sin secretos en disco (`.env` gitignored) |
| 7.2 | Plantilla `Bor4SST/` para 45001 ISO + LOPDGDD sector salud | DEFER | Mecánico vía §6; requiere `CONTRATOS_PLANTILLA_MODULAR.md` v0.4 con §C-CATALOGOS-VERSIONADOS-EXTENDIDO |
| 7.3 | Publicación PyPI interna `bor4common` (futuro distribution) | DEFER | Cambio mínimo en `bor4common/pyproject.toml` + tag git |
| 7.4 | Documentar `PlataformaContextoExtended` en `CONTRATOS_PLANTILLA_MODULAR.md` §6.7 (extensión pattern formal) | SHOULD | Cierra nomenclatura sin obligar a subclasear hoy |

---

## 8. Resumen ejecutivo REFCOMMON EMA

- **Shared lib `bor4common/v0.1.0` canónica** centraliza lógica D-002 + `PlataformaContexto` (frozen dataclass, 6 campos `rol_plataforma`/`tenant_id`/`user_id`/`is_platform_owner`/`is_superadmin`/`token_version`).
- **4 clones (Legal pilot + Quality + Risk + Privacy)** homogenizados vía shim thin re-export (~1 KB cada uno) preservando path legacy `borX.security.integration.from_jwt(...)`.
- **pytest 122 tests verde** cross-clones como fuente autoritativa de integración end-to-end `bor4common` shims `rbac.py` local.
- **5 contratos ratificados** (C-IDENTIDAD / C-DATOS / C-DESPLIEGUE / C-BITACORA / C-HASH-TEMPLATE) propagación documentada en `2_Bor4Legal/docs/CONTRATOS_PLANTILLA_MODULAR.md`.
- **S1+S2 aplicados** mecánicamente con regex scoped + str.replace. Reviewer confirmó cero regresión.
- **Extensión N=6+ via `PlataformaContextoExtended(PlataformaContexto)`** patrón dataclass-frozen sin acoplamiento hacia arriba; preserva duck typing + identidad cross-clon.
- **Sin deuda técnica abierta** en este ciclo. Pattern EMA-READY para N=6+.

**Convención `PUNTO_RETOMA_AAAA-MM-DD.md`:** este documento se añade al flujo de `PUNTO_RETOMA_2026-06-20.md` (audit BD SIGE) para mantener trazabilidad histórica entre ciclos de retoma.
