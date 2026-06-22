# 2_Bor4Legal - Quickstart

Subproyecto piloto de Requisitos Legales. Independiente de BOR4SIGE
(D-001 + D-001-A) hasta la palabra **"integra"**.

## Instalacion (modo desarrollo)

```bash
cd 2_Bor4Legal
pip install -e .
```

Sin dependencias externas: solo stdlib Python 3.10+.

## Ejecutar tests de humo

```bash
cd 2_Bor4Legal
PYTHONPATH=src python -m pytest tests/cantera/ -q
```

Esperado: 13 tests pasados

- 7 tests del conversor de perfil (seccion 18): idempotencia, determinismo,
  bidireccionalidad cero, no persistencia de valores rechazados.
- 6 tests del motor + renderer + RBAC (seccion 19 + 20 + 24).

## Ejecutar CLI end-to-end

El modulo incluye un CLI que ejercita todo el flujo:

```bash
cd 2_Bor4Legal
cat > /tmp/perfil_demo.json <<'JSON'
{
  "C-01": {"present": true, "value": "ES"},
  "C-02": {"present": true, "value": ["UE", "ES"]},
  "C-04": {"present": true, "value": "2511"},
  "C-07": {"present": true, "value": "pequena"},
  "C-12": {"present": true, "value": 12.0},
  "C-13": {"present": true, "value": 4500.0}
}
JSON
PYTHONPATH=src python -m bor4legal.cli /tmp/perfil_demo.json
```

Esperado: JSON con `anchor_bundle`, `v_f`, `oes` (al menos R-201, R-202,
R-302), `rechazos`, `rbac_check_ejemplo`.

## Estructura del proyecto

```
2_Bor4Legal/
+-- pyproject.toml
+-- README.md
+-- docs/
|   +-- CONTRATOS_PLANTILLA_MODULAR.md   (los 4 contratos - clave)
|   +-- QUICKSTART.md
+-- src/bor4legal/
|   +-- __init__.py
|   +-- domain/profile/converter.py       (Conversor seccion 18)
|   +-- engine/
|   |   +-- types.py                      (V_U, V_S, V_CE)
|   |   +-- reglas.py                     (catalogo de R-NNN)
|   |   +-- evaluator.py                  (motor puro F)
|   |   +-- oe_renderer.py                (renderer OE seccion 20)
|   +-- catalogs/
|   |   +-- schemas.py                    (8 catalogos seccion 21)
|   |   +-- loader.py                     (carga desde dict/directorio)
|   +-- security/
|   |   +-- rbac.py                       (CapaScope + SoD seccion 24)
|   |   +-- l2_amnesia.py                 (Protocolo Nivel 2 seccion 24.7)
|   +-- cli.py                            (entry point)
+-- tests/cantera/
    +-- test_converter.py                 (tests del conversor)
    +-- test_engine.py                    (tests motor + RBAC)
```

## Que valida el piloto

El piloto valida **3 capacidades** que BOR4SIGE reusara al extraer
proximos modulos:

1. **Aislamiento real:** `2_Bor4Legal/` no toca `1_App_BOR4SIGE/`,
   ni dependencias, ni BD, ni auth.
2. **Reproducibilidad bit-a-bit:** mismo input + mismo snapshot_id =
   mismo `snapshot_hash` (sha256).
3. **RBAC + privacidad:** roles del modulo + amnesia L2 sobre PII.

Tras **"integra"** (D-002), se conectara a BOR4SIGE via proxy inverso
con SSO B4S. Hasta entonces, funciona standalone.

## Proximos pasos

- Cerrar ISO 14001:2026 + ISO 9001:2026: redactar **§25** del cuaderno
  con cambios previsibles en catalogo `lkp_normativa`.
- Si quieres extraer `3_Bor4Quality/`: copia la estructura y aplica
  los 4 contratos (`docs/CONTRATOS_PLANTILLA_MODULAR.md`).
- Decisiones pendientes abiertas: ver P-081..P-090 al final del doc
  de contratos.
