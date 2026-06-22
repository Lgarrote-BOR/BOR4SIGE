from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple


@dataclass(frozen=True)
class ReglaSpec:
    id: str
    nombre: str
    operador: str
    inputs: Tuple[str, ...]
    output_a: str
    output_key: str
    weight: int = 1
    jurisdiction: str = ""
    citation: str = ""


REGLAS_CATALOGO: Dict[str, ReglaSpec] = {
    "Q-101": ReglaSpec(
        id="Q-101", nombre="iso_9001_aplicable",
        operador="IMPLIES", inputs=("Q-02",), output_a="V_U",
        output_key="normas_objetivo",
        weight=10, jurisdiction="ISO 9001:2015",
        citation="ISO 9001:2015 cap. 4 - Contexto de la organizacion",
    ),
    "Q-201": ReglaSpec(
        id="Q-201", nombre="nc_obligan_accion",
        operador="IMPLIES", inputs=("Q-11",), output_a="V_CE",
        output_key="nc_abiertas",
        weight=8, jurisdiction="ISO 9001:2015 cap. 10.2",
        citation="ISO 9001:2015 cap. 10.2 - No conformidad y accion correctiva",
    ),
    "Q-301": ReglaSpec(
        id="Q-301", nombre="documentacion_en_idioma_principal",
        operador="IMPLIES", inputs=("Q-02", "Q-14"),
        output_a="V_CE", output_key="idioma_principal",
        weight=5, jurisdiction="ISO 9001:2015 cap. 7.5",
        citation="ISO 9001:2015 cap. 7.5 - Informacion documentada",
    ),
    "Q-401": ReglaSpec(
        id="Q-401", nombre="ciclo_auditoria_segun_madurez",
        operador="IMPLIES", inputs=("Q-15",), output_a="V_S",
        output_key="madurez_calidad",
        weight=6, jurisdiction="ISO 9001:2015 cap. 9.2",
        citation="ISO 9001:2015 cap. 9.2 - Auditoria interna",
    ),
}


def aplicar_regla(rid: str, anchors: Dict[str, Any]) -> Optional[Any]:
    if rid == "Q-101":
        normas = anchors.get("Q-02") or []
        if "ISO 9001:2015" in normas:
            return ["ISO 9001:2015"]
        return None
    if rid == "Q-201":
        nc = anchors.get("Q-11")
        if nc is None:
            return None
        try:
            return int(nc)
        except (TypeError, ValueError):
            return None
    if rid == "Q-301":
        normas = anchors.get("Q-02") or []
        if "ISO 9001:2015" in normas and anchors.get("Q-14"):
            return anchors["Q-14"]
        return None
    if rid == "Q-401":
        m = anchors.get("Q-15")
        if m in ("inicial", "formal", "optimizado"):
            return m
        return None
    return None
