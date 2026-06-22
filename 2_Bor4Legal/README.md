# Bor4Legal — Subproyecto de Requisitos Legales (módulo externo de BOR4SIGE)

> **Estado:** subproyecto recién creado en `2_Bor4Legal/` el 2026-06-21.
> Cumple D-001 + D-001-A: construcción **independiente** del monorepo BOR4SIGE.
> Hasta que el fundador diga la palabra **"integra"** (D-002), este módulo:
>  - **NO** comparte dependencias con BOR4SIGE (mysql2/promise, bcrypt, helmet, etc.).
>  - **NO** comparte pipelines, tests, base de datos ni autenticación.
>  - **NO** modifica `1_App_BOR4SIGE/`.

## Estructura

```
2_Bor4Legal/
├── README.md                 (this file)
├── pyproject.toml            (empaquetado Python — sin deps externas por ahora)
├── .gitignore
├── src/bor4legal/
│   ├── __init__.py           (versión 0.1.0)
│   ├── domain/
│   │   ├── __init__.py
│   │   └── profile/
│   │       ├── __init__.py
│   │       └── converter.py  (§18 + §18.7 entregable en hilo previo)
│   ├── engine/
│   │   ├── __init__.py
│   │   └── evaluator.py      (stub — pendiente D-009 §19.6)
│   └── catalogs/
│       ├── __init__.py
│       └── schemas.py        (forma mínima §21)
├── tests/
│   ├── __init__.py
│   └── cantera/
│       ├── __init__.py
│       └── test_converter.py (cantera U-01 — pendiente §23)
└── docs/
    ├── README.md
    └── (cuaderno entregable principal reside aquí, o en 4_Documentos/ raíz)
```

## Decisiones vigentes del cuaderno

- D-001, D-001-A, D-002 (UX integrada diferida).
- D-003..D-012 (§universales y privacidad por construcción).
- P-001..P-060 — pendientes documentadas en cuaderno en línea.

## Cómo empezar (post-"integra")

```bash
cd 2_Bor4Legal
pip install -e .            # sólo cuando se decida integrar
pytest -q tests/cantera/
```

Mientras llega "integra", el módulo es **read-only** salvo para refactor en sí mismo.
