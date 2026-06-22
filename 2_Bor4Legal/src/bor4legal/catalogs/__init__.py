# -*- coding: utf-8 -*-
"""
catalogs
========
Esquemas minimos de los catalogos externos (§21).

El motor NO CONTIENE texto legal literal (BOE/EUR-Lex/RGPD/...).
Solo contiene METADATOS y REFERENCIAS durables (id + version + fuente_url).
"""
from bor4legal.catalogs.schemas import (
    LKP_JURISDICCIONES_SCHEMA,
    LKP_ACTIVIDADES_SCHEMA,
    LKP_NORMATIVA_SCHEMA,
    LKP_REGLAS_SCHEMA,
    LKP_UE_SCHEMA,
    LKP_US_FEDERAL_SCHEMA,
    LKP_US_STATES_SCHEMA,
    LKP_TECNICA_UNE_SCHEMA,
)

__all__ = [
    "LKP_JURISDICCIONES_SCHEMA",
    "LKP_ACTIVIDADES_SCHEMA",
    "LKP_NORMATIVA_SCHEMA",
    "LKP_REGLAS_SCHEMA",
    "LKP_UE_SCHEMA",
    "LKP_US_FEDERAL_SCHEMA",
    "LKP_US_STATES_SCHEMA",
    "LKP_TECNICA_UNE_SCHEMA",
]
