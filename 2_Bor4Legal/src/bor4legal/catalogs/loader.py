# -*- coding: utf-8 -*-
"""catalogs.loader - Carga los 8 catalogos externos desde directorio o dict."""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List

from bor4legal.catalogs.schemas import (
    LKP_JURISDICCIONES_SCHEMA, LKP_ACTIVIDADES_SCHEMA,
    LKP_NORMATIVA_SCHEMA, LKP_REGLAS_SCHEMA, LKP_UE_SCHEMA,
    LKP_US_FEDERAL_SCHEMA, LKP_US_STATES_SCHEMA, LKP_TECNICA_UNE_SCHEMA,
)


SCHEMAS_BY_KEY: Dict[str, Dict[str, Any]] = {
    "lkp_jurisdicciones": LKP_JURISDICCIONES_SCHEMA,
    "lkp_actividades":   LKP_ACTIVIDADES_SCHEMA,
    "lkp_normativa":     LKP_NORMATIVA_SCHEMA,
    "lkp_reglas":        LKP_REGLAS_SCHEMA,
    "lkp_ue":            LKP_UE_SCHEMA,
    "lkp_us_federal":    LKP_US_FEDERAL_SCHEMA,
    "lkp_us_states":     LKP_US_STATES_SCHEMA,
    "lkp_tecnica_une":   LKP_TECNICA_UNE_SCHEMA,
}


@dataclass
class CatalogoLoader:
    snapshot_id: str
    data:        Dict[str, List[Dict[str, Any]]] = field(default_factory=dict)
    errors:      List[str]                            = field(default_factory=list)

    @classmethod
    def from_dict(cls, raw: Dict[str, List[Dict[str, Any]]], *, snapshot_id: str = "test") -> "CatalogoLoader":
        out = cls(snapshot_id=snapshot_id)
        for key, entries in raw.items():
            if key in SCHEMAS_BY_KEY and isinstance(entries, list):
                out.data[key] = list(entries)
        return out

    @classmethod
    def from_directory(cls, path: Path, *, snapshot_id: str = "test") -> "CatalogoLoader":
        out = cls(snapshot_id=snapshot_id)
        if not path.exists():
            return out
        for f in sorted(path.glob("*.json")):
            key = f.stem
            if key in SCHEMAS_BY_KEY:
                try:
                    entries = json.loads(f.read_text(encoding="utf-8"))
                    if isinstance(entries, list):
                        out.data[key] = entries
                except Exception as exc:
                    out.errors.append(f"{f.name}: {exc}")
        return out

    def get(self, key: str) -> List[Dict[str, Any]]:
        return list(self.data.get(key, []))


def build_pilot_loader() -> CatalogoLoader:
    """Smoke test: 1 entrada minima por cada catalogo clave."""
    return CatalogoLoader.from_dict(
        {
            "lkp_jurisdicciones": [{
                "id": "es", "version": "@v1", "idioma_canonico": "es",
                "fuente_url": "https://www.boe.es/",
                "iso_3166_1_alpha2": "ES", "nivel": "estatal",
            }],
            "lkp_actividades": [{
                "id": "cnae_2511", "version": "@v1", "idioma_canonico": "es",
                "fuente_url": "https://www.cnae.es/",
                "codigo": "2511", "nomenclatura": "CNAE",
                "applicable_iso": ["ISO 9001", "ISO 14001", "ISO 45001"],
            }],
            "lkp_normativa": [{
                "id": "rd_769_1999", "version": "@v1", "idioma_canonico": "es",
                "fuente_url": "https://www.boe.es/buscar/act.php?id=BOE-A-1999-17686",
                "titulo": "RD 769/1999 PED",
                "organo": "BOE", "articulo": "art. 3",
                "applicable_iso": ["ISO 9001"], "estado_vigencia": "vigente",
                "cadencia_max": "5a",
            }],
            "lkp_reglas": [{
                "id": "R-202-presion_ped", "version": "@v1", "idioma_canonico": "es",
                "fuente_url": "https://www.boe.es/buscar/act.php?id=BOE-A-1999-17686",
                "rule_id": "R-202", "inputs": ["C-12"],
                "output_a": "V_CE", "weight": 9,
                "cited_by": ["rd_769_1999"],
            }],
            "lkp_ue": [], "lkp_us_federal": [], "lkp_us_states": [], "lkp_tecnica_une": [],
        },
        snapshot_id="pilot-2026-06-21",
    )
