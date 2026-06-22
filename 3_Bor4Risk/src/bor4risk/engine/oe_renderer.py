"""Renderer ROE con D12. Texto literal NO entra al hash. _validate_tpl_router_consistency() al import-time."""
from __future__ import annotations
import hashlib
import json
import logging
import re
from dataclasses import asdict, dataclass, field
from datetime import date
from typing import Any, Dict, List, Optional

from bor4risk.engine.reglas import REGLAS_CATALOGO
from bor4risk.engine.types import VectorActivacion

_logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ROE:
    roe_id: str
    snapshot_id: str
    snapshot_emision: str
    version_roe: str
    rule_id: str
    anchor_id: str
    oe_legal_fuente: str
    roe_cita_externa: str
    roe_normal_text: str
    roe_snapshot_hash: str
    template_id_used: str = ""
    idioma: str = "es"
    jurisdiccion: str = ""
    peso: int = 1

    def to_dict(self):
        return asdict(self)


ROE_PLANTILLAS = {
    "tpl-R-101-v1": {"roe_cita_externa": "https://www.ccn-cert.cni.es/documentos/herramientas/magerit.html",
                     "roe_normal_text": "Conforme al catalogo MAGERIT v3, el entorno organizativo presenta un PERFIL DE PROTECCION ALTA. Se han identificado activos criticos (valoracion >= 8 o tipo personas): {activos_criticos}. Documentar valoracion, dependencias y plan de tratamiento en el modulo de riesgos."},
    "tpl-R-201-v1": {"roe_cita_externa": "https://www.ccn-cert.cni.es/ens/guias/guia-stic-804-tipologia-amenazas.html",
                     "roe_normal_text": "Segun CCN-STIC 804, EXPOSICIONES DIRECTAS: amenazas sin controles preventivos asociados: {amenazas_huerfanas}. Cada amenaza requiere como minimo una salvaguarda preventiva o detectiva antes del cierre MAGERIT."},
    "tpl-R-301-v1": {"roe_cita_externa": "https://www.ccn-cert.cni.es/documentos/herramientas/magerit/libroMagerit.pdf",
                     "roe_normal_text": "MAGERIT v3 cap. 5: el RIESGO RESIDUAL tras aplicar salvaguardas SUPERA el umbral organizativo (R-04={umbral}). Amenazas excedidas: {riesgos_vulnerados}. Accion inmediata: reforzar cobertura o aceptar formalmente el riesgo."},
    "tpl-R-401-v1": {"roe_cita_externa": "https://www.iso.org/standard/75281.html",
                     "roe_normal_text": "ISO 27005 + MAGERIT: la arquitectura de seguridad presenta PREDOMINIO REACTIVO (<50% salvaguardas preventivas). El %preventivas={pct_preventivas} indica que la organizacion detecta y corrige mas de lo que previene. Revisar estrategia."},
}


_REGLAS_LKP = {"R-101": "activo_critico_magerit", "R-201": "amenaza_huerfana_ens_804", "R-301": "riesgo_residual_intolerable_magerit", "R-401": "predominio_reactivo_iso27005"}


def _lkp_fuente(rid, version="v1.0"):
    return f"lkp_risk[{_REGLAS_LKP.get(rid, rid.lower())}@{version}]"


_REGLAS_TPL_VERSION = {"R-101": "tpl-R-101-v1", "R-201": "tpl-R-201-v1", "R-301": "tpl-R-301-v1", "R-401": "tpl-R-401-v1"}


def _humanize(v):
    if v is None:
        return "no_categorizable"
    if isinstance(v, bool):
        return "si" if v else "no"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, str):
        return v
    if isinstance(v, dict):
        return str(v.get("amenaza_id", v.get("id", "?")))
    if isinstance(v, list):
        if not v:
            return "no_categorizable"
        if all(isinstance(x, dict) for x in v):
            parts = [f"{x.get('amenaza_id','?')}(R_inh={x.get('r_inherente','?')},R_res={x.get('r_residual','?')})" for x in v]
            return ", ".join(parts)
        return ", ".join(str(x) for x in v)
    return str(v)


def redactar_roe(rid, v_f, *, snapshot_id="test", idioma="es"):
    if rid not in REGLAS_CATALOGO:
        _logger.warning("redactar_roe: rid %s no esta en REGLAS_CATALOGO", rid)
        return None
    if rid not in _REGLAS_TPL_VERSION:
        _logger.warning("redactar_roe: rid %s fired pero no esta en _REGLAS_TPL_VERSION", rid)
        return None
    tpl_id = _REGLAS_TPL_VERSION[rid]
    if tpl_id not in ROE_PLANTILLAS:
        _logger.warning("redactar_roe: tpl_id %s (de rid %s) no esta en ROE_PLANTILLAS", tpl_id, rid)
        return None
    spec = REGLAS_CATALOGO[rid]
    template = ROE_PLANTILLAS[tpl_id]

    extras = {}
    if rid == "R-101":
        criticos = list(v_f.V_S.activos_criticos or [])
        ids = [str(a.get("id", "?")) for a in criticos]
        extras["activos_criticos"] = ", ".join(ids) if ids else "(sin activos criticos detectados)"
    if rid == "R-201":
        extras["amenazas_huerfanas"] = list(v_f.V_CE.amenazas_huerfanas or [])
    if rid == "R-301":
        vulnerables = v_f.V_CE.riesgos_vulnerados or []
        extras["umbral"] = "no_categorizable"
        extras["riesgos_vulnerados"] = [
            (f"{r.get('amenaza_id','?')}(R_inh={r.get('r_inherente','?')},R_res={r.get('r_residual','?')})"
             if isinstance(r, dict) else str(r))
            for r in vulnerables
        ]
    if rid == "R-401":
        extras["pct_preventivas"] = f"{int(round(v_f.V_U.pct_preventivas))}%"

    mapping = {
        "activos_criticos": extras.get("activos_criticos"),
        "amenazas_huerfanas": extras.get("amenazas_huerfanas"),
        "riesgos_vulnerados": extras.get("riesgos_vulnerados"),
        "umbral": extras.get("umbral"),
        "pct_preventivas": extras.get("pct_preventivas"),
    }
    placeholders_in_template = set(re.findall(r"\{([a-z_]+)\}", template["roe_normal_text"]))
    valores = {k: _humanize(v) for k, v in mapping.items()}
    for ph in placeholders_in_template:
        valores.setdefault(ph, "no_categorizable")
    text = template["roe_normal_text"].format(**valores)

    payload = {"rule_id": rid, "snapshot_id": snapshot_id, "v_f": v_f.to_dict(), "template_id_used": tpl_id, "idioma": idioma}
    h = hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()
    hoy = date.today().isoformat()
    return ROE(
        roe_id=f"ROE-{snapshot_id}-{rid}", snapshot_id=snapshot_id, snapshot_emision=hoy, version_roe="v1.0",
        rule_id=rid, anchor_id=",".join(spec.inputs) or "R-N/A", oe_legal_fuente=_lkp_fuente(rid),
        roe_cita_externa=template["roe_cita_externa"], roe_normal_text=text, roe_snapshot_hash=h,
        template_id_used=tpl_id, idioma=idioma, jurisdiccion=spec.jurisdiction, peso=spec.weight,
    )


def render_roes(v_f, *, snapshot_id="test", idioma="es"):
    result = []
    for rid in v_f.hook_trace:
        roe = redactar_roe(rid, v_f, snapshot_id=snapshot_id, idioma=idioma)
        if roe is not None:
            result.append(roe)
    return result


def _validate_tpl_router_consistency():
    orphan_templates = set(ROE_PLANTILLAS.keys()) - set(_REGLAS_TPL_VERSION.values())
    if orphan_templates:
        _logger.warning("TPL huerfanas en ROE_PLANTILLAS sin router activo: %s", sorted(orphan_templates))
    undeclared = set(_REGLAS_TPL_VERSION.values()) - set(ROE_PLANTILLAS.keys())
    if undeclared:
        _logger.warning("tpl_ids activos sin entrada en ROE_PLANTILLAS: %s", sorted(undeclared))


_validate_tpl_router_consistency()
