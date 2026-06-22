"""Catalogo de reglas MAGERIT. R-101 + R-401 retornan dicts (multi-output)."""
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
    "R-101": ReglaSpec(
        id="R-101", nombre="perfil_activos_criticos",
        operador="IMPLIES", inputs=("R-01",), output_a="V_S",
        output_key="perfil_proteccion_alta",
        weight=8, jurisdiction="MAGERIT v3",
        citation="MAGERIT v3 - Catalogo de elementos: activos con valoracion >= 8 o tipo persona(s)",
    ),
    "R-201": ReglaSpec(
        id="R-201", nombre="amenazas_sin_salvaguarda",
        operador="JOIN_MISSING", inputs=("R-01", "R-02", "R-03"), output_a="V_CE",
        output_key="amenazas_huerfanas",
        weight=9, jurisdiction="ENS - Deficiencias de control",
        citation="CCN-STIC 804 - Tipologia de amenazas sin controles asociados",
    ),
    "R-301": ReglaSpec(
        id="R-301", nombre="riesgo_residual_intolerable",
        operador="COMPUTE_THRESHOLD", inputs=("R-01", "R-02", "R-03", "R-04"), output_a="V_CE",
        output_key="riesgos_vulnerados",
        weight=10, jurisdiction="MAGERIT v3 - Analisis de Riesgos",
        citation="MAGERIT v3 cap. 5 - Riesgo residual = (valor * D * incidencia) * (1 - cobertura)",
    ),
    "R-401": ReglaSpec(
        id="R-401", nombre="madurez_salvaguardas_preventivas",
        operador="RATIO_TEST", inputs=("R-03",), output_a="V_U",
        output_key="predominio_reactivo",
        weight=6, jurisdiction="ISO 27005 + MAGERIT",
        citation="ISO 27005 / MAGERIT - equilibrio preventivo vs correctivo",
    ),
}


def _norm_tipo(t):
    return str(t or "").strip().lower().rstrip("s")


def _activos_criticos(activos):
    out = []
    for a in activos or []:
        try:
            if int(a.get("valor", 0)) >= 8:
                out.append(a)
            elif _norm_tipo(a.get("tipo")) == "persona":
                out.append(a)
        except (TypeError, ValueError):
            continue
    return out


def _amenazas_huerfanas(amenazas, salvaguardas):
    cubiertos = set()
    for s in salvaguardas or []:
        try:
            cubiertos.add(s["amenaza_id"])
        except (TypeError, KeyError):
            continue
    return [a for a in (amenazas or []) if a.get("id") not in cubiertos]


def _riesgos_vulnerados(activos, amenazas, salvaguardas, umbral):
    activos_idx = {a.get("id"): a for a in (activos or [])}
    cob_por_amenaza: Dict[str, float] = {}
    for s in salvaguardas or []:
        try:
            cob_por_amenaza[s["amenaza_id"]] = cob_por_amenaza.get(s["amenaza_id"], 0.0) + float(s.get("cobertura", 0.0))
        except (TypeError, KeyError, ValueError):
            continue
    vulnerables = []
    for am in amenazas or []:
        try:
            act = activos_idx.get(am.get("activo_id"))
            if act is None:
                continue
            v = int(act.get("valor", 0))
            d = int(am.get("D", 0))
            incidencia = int(am.get("I", 0))
        except (TypeError, ValueError):
            continue
        r_inh = v * d * incidencia
        cob = cob_por_amenaza.get(am.get("id"), 0.0)
        r_res = r_inh * (1.0 - cob)
        if r_res > umbral:
            vulnerables.append({"amenaza_id": am.get("id"), "activo_id": am.get("activo_id"), "r_inherente": r_inh, "cobertura": cob, "r_residual": r_res})
    return vulnerables


def aplicar_regla(rid, anchors):
    if rid == "R-101":
        criticos = _activos_criticos(anchors.get("R-01") or [])
        return {"perfil_proteccion_alta": bool(criticos), "activos_criticos": criticos}
    if rid == "R-201":
        am = anchors.get("R-02") or []
        sg = anchors.get("R-03") or []
        return {"amenazas_huerfanas": [a.get("id") for a in _amenazas_huerfanas(am, sg) if a.get("id")]}
    if rid == "R-301":
        try:
            umbral = int(anchors.get("R-04", 0))
        except (TypeError, ValueError):
            return None
        return {"riesgos_vulnerados": _riesgos_vulnerados(anchors.get("R-01") or [], anchors.get("R-02") or [], anchors.get("R-03") or [], umbral)}
    if rid == "R-401":
        sg = anchors.get("R-03") or []
        prevs = sum(1 for s in sg if _norm_tipo(s.get("tipo")) == "preventiva")
        total = len(sg)
        pct = (prevs / total * 100.0) if total else 0.0
        return {"predominio_reactivo": (prevs < 0.5 * total) if total else False, "pct_preventivas": pct}
    return None
