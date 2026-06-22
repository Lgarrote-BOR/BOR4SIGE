# Changelog BOR4SIGE

> Registro cronológico de releases, cierres de ciclo y snapshots inmutables del proyecto `BOR4SIGE/`.
> **Convención:** archivo único, versiones más recientes arriba, semver + sufijos para snapshots inmutables (ej. `v0.3.0-REFCOMMON-EMA`).
> **Referencias cruzadas:** cada entrada enlaza tag git + documento de cierre (`PUNTO_RETOMA_AAAA-MM-DD.md`) + pytest summary.
>
> Formato inspirado en [Keep a Changelog 1.1.0](https://keepachangelog.com/es-ES/1.1.0/).

---

## [v0.3.0-REFCOMMON-EMA] &mdash; 2026-06-22

> **Tipo:** Snapshot inmutable (annotated tag).
> **Tag point:** `2ae02719e207e3849e5bc0d9f53fea63e427c1be` (short: `2ae0271`).
> **Commit message:** `feat(refactor): introduce bor4common shared lib + 4 clones homogenizados a shim thin re-export + pytest 122 verde cross-clones + 5 contratos ratificados`.
> **Alcance:** cierre del refactor canonizador del patrón modular sobre shared lib `bor4common/`.

### Added (NUEVO)

- **`bor4common/ v0.1.0`** (shared lib canónica, 5 archivos):
  - `bor4common/src/bor4common/__init__.py`
  - `bor4common/src/bor4common/security/__init__.py`
  - `bor4common/src/bor4common/security/integration.py` &mdash; D-002 hardened v0.3.3, **IDENTICO** a los 4 clones vía `shutil.copy2` desde piloto Legal.
  - `bor4common/src/bor4common/security/rbac.py` &mdash; único origen del `@dataclass(frozen=True) class PlataformaContexto`.
  - `bor4common/pyproject.toml` &mdash; PEP 517 src-layout.
- **Homogenización cross-clones** (N+1..N+4) &mdash; cada clon pasa de D-002 local duplicada a shim thin re-export (~1 KB) sobre `bor4common/`:
  - `2_Bor4Legal` (piloto)
  - `3_Bor4Quality`
  - `3_Bor4Risk`
  - `3_Bor4Privacy`
- **Patrón de extensión oficial N+5+** documentado: `PlataformaContextoExtended(PlataformaContexto)` vía herencia frozen-dataclass.
- **Documentación nueva**:
  - `4_Documentos/PUNTO_RETOMA_2026-06-22.md` &mdash; documento de cierre completo del ciclo REFCOMMON EMA.
  - `4_Documentos/CHANGELOG.md` &mdash; este archivo.

### Changed

- **S1** &mdash; `from bor4common.security.rbac import PlataformaContexto` insertado en `security/rbac.py` local de cada clon (4 ocurrencias).
- **S2** &mdash; `dependencies = ["bor4common"]` añadido en `pyproject.toml` de cada clon (4 ocurrencias).
- **S3** &mdash; `@dataclass(frozen=True) class PlataformaContexto` eliminado de cada `security/rbac.py` local (4 ocurrencias; ahora vive solo en `bor4common/`).
- **D-002 hardening v0.3.3** (JWT confusion attack protection: `alg=none`, `alg=RS256`, firma vacía, payload no JSON) propagado a `bor4common/security/integration.py` y a los shims de los 4 clones.

### Verified (autoritativo)

- **pytest 122 tests verde cross-clones**:
  - `2_Bor4Legal` &mdash; 53/53 &check;
  - `3_Bor4Quality` &mdash; 21/21 &check;
  - `3_Bor4Risk` &mdash; 21/21 &check;
  - `3_Bor4Privacy` &mdash; 27/27 &check;
- **Sin deuda técnica abierta** al cierre del ciclo.

### Contratos ratificados (5)

| # | Contrato | Función |
|:-:|----------|---------|
| 1 | **C-IDENTIDAD** | Modelo de identidad compartida (Propietario de Plataforma > Superadmin > Roles módulo). |
| 2 | **C-DATOS** | Formato/serialización canónica (JSON-schema compatible cross-clon). |
| 3 | **C-DESPLIEGUE** | Instrucciones reproducibles de instalación/uso (editable install + `bor4common`). |
| 4 | **C-BITACORA** | Bitácora/observabilidad mínimas comunes. |
| 5 | **C-HASH-TEMPLATE** | Invariantes de hashing para plantillas OE inmutables. |

### Documentación cruzada

| Recurso | Ref |
|---------|-----|
| Documento de cierre | `4_Documentos/PUNTO_RETOMA_2026-06-22.md` |
| Git tag | `v0.3.0-REFCOMMON-EMA` (annotated) |
| Commit anclado | `2ae02719e207e3849e5bc0d9f53fea63e427c1be` |
| Contratos N+1 template | `2_Bor4Legal/docs/CONTRATOS_PLANTILLA_MODULAR.md` |
| Shared lib canónica | `bor4common/src/bor4common/security/` |
| Predecesor conceptual | cuaderno v1.5a (§24 RBAC) |

### Estado del snapshot

| Recurso | Estado | Notas |
|---------|:------:|-------|
| Tag en local | OK | `git tag -l` lista `v0.3.0-REFCOMMON-EMA` |
| Tag en remoto | Pausa | Push bloqueado por PAT sin `workflow` scope; pendiente de auth decision |
| Branch `main` | ahead 7 commits | `282c930`, `2ae0271` REFCOMMON, 5 más |
| Working tree | clean | untracked=0 modified=0 staged=0 |
| `stash@{0}` | preservado | WIP sobre `abeb36b` (no afecta a REFCOMMON) |

---

<!-- Próxima entrada: ciclo N+5 Compliance (ISO 37301 + ISO 37001) sobre arquitectura homogenizada, pendiente de pytest verde EMA. -->
