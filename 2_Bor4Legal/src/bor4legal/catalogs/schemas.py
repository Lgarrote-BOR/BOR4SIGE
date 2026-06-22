# -*- coding: utf-8 -*-
"""
catalogs.schemas
================
Esquemas minimos de los 8 catalogos externos del motor (§21):
  1. lkp_jurisdicciones      - Arbol de paises (UE/Estado/CCAA/Municipio).
  2. lkp_actividades         - ISIC + CNAE + catalogo de tareas.
  3. lkp_normativa           - Norma, articulo, organo emisor.
  4. lkp_reglas              - Versionado explicito de reglas R-NNN.
  5. lkp_ue                  - Supra-UE: Reglamentos, Directivas, Decisiones.
  6. lkp_us_federal          - Leyes federales US (CFR + USC).
  7. lkp_us_states           - 50 leyes estatales US (CCPA, VCDPA, CPRA, ...).
  8. lkp_tecnica_une         - Normas tecnicas (UNE, EN, EN-ISO, ISO, IEC).

Invariantes (I-21.A..I del cuaderno v1.5a):
  - Identificadores estables (id lowercase_underscore + version @vN).
  - Inmutabilidad por snapshot.
  - Multilingue declarado.
  - Sin texto legal literal (solo referencia + URL oficial).
"""
from __future__ import annotations

from typing import Any, Dict


_BASE: Dict[str, Any] = {
    "type": "object",
    "required": ["id", "version", "idioma_canonico", "fuente_url"],
    "properties": {
        "id":              {"type": "string", "pattern": "^[a-z0-9_]+$"},
        "version":         {"type": "string", "pattern": "^@v[0-9]+$|^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},
        "idioma_canonico": {"type": "string", "minLength": 2},
        "fuente_url":      {"type": "string", "format": "uri"},
        "snapshot_id":     {"type": "string"},
        "estado_vigencia": {"type": "string", "enum": ["vigente", "modificado", "derogado"]},
    },
}


LKP_JURISDICCIONES_SCHEMA: Dict[str, Any] = {
    "title": "lkp_jurisdicciones",
    "description": "Arbol de paises con niveles UE/Estado/CCAA/Municipio.",
    "allOf": [_BASE],
    "properties": {
        **_BASE["properties"],
        "iso_3166_1_alpha2": {"type": "string", "minLength": 2, "maxLength": 2},
        "nivel":              {"type": "string", "enum": ["supranational", "estatal", "autonomico", "municipal"]},
        "parent_id":          {"type": "string"},
    },
}

LKP_ACTIVIDADES_SCHEMA: Dict[str, Any] = {
    "title": "lkp_actividades",
    "description": "ISIC + CNAE + catalogo de actividades/tareas.",
    "allOf": [_BASE],
    "properties": {
        **_BASE["properties"],
        "codigo":        {"type": "string"},
        "nomenclatura":  {"type": "string", "enum": ["ISIC", "CNAE", "NACE", "NAICS"]},
        "applicable_iso":{"type": "array", "items": {"type": "string"}},
    },
}

LKP_NORMATIVA_SCHEMA: Dict[str, Any] = {
    "title": "lkp_normativa",
    "description": "Detalle de norma, articulo, organo emisor.",
    "allOf": [_BASE],
    "properties": {
        **_BASE["properties"],
        "titulo":         {"type": "string"},
        "organo":         {"type": "string", "enum": ["BOE", "EUR-Lex", "RGPD", "ISO", "UNE", "EN", "ANPD", "CNIL", "BSI", "FDA"]},
        "articulo":       {"type": "string"},
        "applicable_iso": {"type": "array", "items": {"type": "string"}},
        "cadencia_max":   {"type": "string"},
    },
}

LKP_REGLAS_SCHEMA: Dict[str, Any] = {
    "title": "lkp_reglas",
    "description": "Versionado explicito de las reglas R-NNN del cuaderno v1.5a (§19).",
    "allOf": [_BASE],
    "properties": {
        **_BASE["properties"],
        "rule_id":  {"type": "string", "pattern": "^R-[0-9]+$"},
        "inputs":   {"type": "array", "items": {"type": "string", "pattern": "^C-[0-9]+$"}},
        "output_a": {"type": "string", "enum": ["V_U", "V_S", "V_CE"]},
        "weight":   {"type": "integer", "minimum": 1, "maximum": 10},
        "cited_by": {"type": "array", "items": {"type": "string"}},
    },
}

LKP_UE_SCHEMA: Dict[str, Any] = {
    "title": "lkp_ue",
    "description": "Vista supra-UE: Reglamentos, Directivas, Decisiones, ETR.",
    "allOf": [_BASE],
    "properties": {
        **_BASE["properties"],
        "tipo":  {"type": "string", "enum": ["reglamento", "directiva", "decision", "ETR"]},
        "celex": {"type": "string"},
    },
}

LKP_US_FEDERAL_SCHEMA: Dict[str, Any] = {
    "title": "lkp_us_federal",
    "description": "Leyes federales US (CFR + USC).",
    "allOf": [_BASE],
    "properties": {
        **_BASE["properties"],
        "title_num":   {"type": "string"},
        "cfr_section": {"type": "string", "pattern": r"^[0-9]+ CFR [0-9]+\.[0-9]+$"},
    },
}

LKP_US_STATES_SCHEMA: Dict[str, Any] = {
    "title": "lkp_us_states",
    "description": "50 leyes estatales US (CCPA, VCDPA, CPRA...).",
    "allOf": [_BASE],
    "properties": {
        **_BASE["properties"],
        "state_code": {"type": "string", "minLength": 2, "maxLength": 2},
        "short_name": {"type": "string"},
    },
}

LKP_TECNICA_UNE_SCHEMA: Dict[str, Any] = {
    "title": "lkp_tecnica_une",
    "description": "Normas tecnicas (UNE, EN, EN-ISO, ISO, IEC).",
    "allOf": [_BASE],
    "properties": {
        **_BASE["properties"],
        "tipo_norma": {"type": "string", "enum": ["UNE", "EN", "EN-ISO", "ISO", "IEC"]},
        "comite":     {"type": "string"},
    },
}
