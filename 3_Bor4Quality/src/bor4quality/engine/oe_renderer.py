from __future__ import annotations
import hashlib
import json
import logging
import re
from dataclasses import asdict, dataclass, field
from datetime import date
from typing import Any, Dict, List, Optional

from bor4quality.engine.reglas import REGLAS_CATALOGO
from bor4quality.engine.types import VectorActivacion

_logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class OE:
    oe_id: str
    snapshot_id: str
    snapshot_emision: str
    version_oe: str
    rule_id: str
    anchor_id: str
    oe_legal_fuente: str
    oe_cita_externa: str
    oe_normal_text: str
    oe_snapshot_hash: str
    template_id_used: str = ""
    idioma: str = "es"
    jurisdiccion: str = ""
    peso: int = 1
    periodo_vigencia: str = ""
    estado_vigencia: str = "activa"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


QOE_PLANTILLAS: Dict[str, Dict[str, str]] = {
    "tpl-Q-101-v1": {
        "oe_cita_externa": "https://www.iso.org/standard/62085.html",
        "oe_normal_text": "Conforme a ISO 9001:2015, la organizacion debe demostrar conformidad con los requisitos del sistema de gestion de calidad aplicables a: {normas_objetivo}. Documentar alcance, exclusiones y justificaciones en el manual de calidad (cap. 4.3).",
    },
    "tpl-Q-201-v1": {
        "oe_cita_externa": "https://www.iso.org/obp/ui/#iso:std:iso:9001:ed-5:v1:en:sec:10.2",
        "oe_normal_text": "Segun ISO 9001:2015 cap. 10.2, las no conformidades abiertas ({nc_abiertas}) requieren: (a) reaccion ante la no conformidad, (b) evaluacion de la necesidad de accion para eliminar la causa, (c) implementacion de accion correctiva documentada, (d) revision de eficacia. Documentar ticket, causa raiz y verificacion.",
    },
    "tpl-Q-301-v1": {
        "oe_cita_externa": "https://www.iso.org/obp/ui/#iso:std:iso:9001:ed-5:v1:en:sec:7.5",
        "oe_normal_text": "ISO 9001:2015 cap. 7.5 obliga a que la informacion documentada este disponible en idioma {idioma_principal} (o traduction jurada al margin de las auditorias externas). Verificar identificacion, descripcion, formato, revision y aprobacion de Docs L0-L2.",
    },
    "tpl-Q-401-v1": {
        "oe_cita_externa": "https://www.iso.org/obp/ui/#iso:std:iso:9001:ed-5:v1:en:sec:9.2",
        "oe_normal_text": "ISO 9001:2015 cap. 9.2: el ciclo de auditoria interna depende de la madurez '{madurez_calidad}'. Madurez inicial -> 6 meses; formal -> 12 meses; optimizado -> 18 meses. Programa documentado en plan anual de auditorias.",
    },
}


_REGLAS_LKP: Dict[str, str] = {
    "Q-101": "iso_9001_2015",
    "Q-201": "iso_9001_2015_cap_10_2",
    "Q-301": "iso_9001_2015_cap_7_5",
    "Q-401": "iso_9001_2015_cap_9_2",
}


def _lkp_fuente(rid: str, version: str = "v1.0") -> str:
    return f"lkp_quality[{_REGLAS_LKP.get(rid, rid.lower())}@{version}]"


_REGLAS_TPL_VERSION: Dict[str, str] = {
    "Q-101": "tpl-Q-101-v1",
    "Q-201": "tpl-Q-201-v1",
    "Q-301": "tpl-Q-301-v1",
    "Q-401": "tpl-Q-401-v1",
}


def redactar_oe(rid: str, v_f: VectorActivacion, *, snapshot_id: str = "test", idioma: str = "es") -> Optional[OE]:
    if rid not in REGLAS_CATALOGO:
        _logger.warning("redactar_oe: rid %s no esta en REGLAS_CATALOGO", rid)
        return None
    if rid not in _REGLAS_TPL_VERSION:
        _logger.warning("redactar_oe: rid %s fired pero no esta en _REGLAS_TPL_VERSION", rid)
        return None
    tpl_id = _REGLAS_TPL_VERSION[rid]
    if tpl_id not in QOE_PLANTILLAS:
        _logger.warning("redactar_oe: tpl_id %s (de rid %s) no esta en QOE_PLANTILLAS", tpl_id, rid)
        return None

    spec = REGLAS_CATALOGO[rid]
    template = QOE_PLANTILLAS[tpl_id]

    def _humanize(v: Any) -> Any:
        if isinstance(v, list):
            if not v:
                return "no_categorizable"
            return ", ".join(str(x) for x in v)
        return v

    mapping: Dict[str, Any] = {
        "normas_objetivo": v_f.V_U.normas_objetivo,
        "nc_abiertas":     v_f.V_CE.nc_abiertas,
        "idioma_principal": v_f.V_CE.idioma_principal,
        "madurez_calidad": v_f.V_S.madurez_calidad,
    }
    placeholders_in_template = set(re.findall(r"\{([a-z_]+)\}", template["oe_normal_text"]))
    valores: Dict[str, Any] = {}
    for k, v in mapping.items():
        if v in (None, []):
            valores[k] = "no_categorizable"
        else:
            valores[k] = _humanize(v)
    for ph in placeholders_in_template:
        valores.setdefault(ph, "no_categorizable")
    text = template["oe_normal_text"].format(**valores)

    payload = {
        "rule_id": rid,
        "snapshot_id": snapshot_id,
        "v_f": v_f.to_dict(),
        "template_id_used": tpl_id,
        "idioma": idioma,
    }
    h = hashlib.sha256(
        json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")
    ).hexdigest()
    hoy = date.today().isoformat()
    return OE(
        oe_id=f"OE-{snapshot_id}-{rid}",
        snapshot_id=snapshot_id,
        snapshot_emision=hoy,
        version_oe="v1.0",
        rule_id=rid,
        anchor_id=",".join(spec.inputs) or "Q-N/A",
        oe_legal_fuente=_lkp_fuente(rid),
        oe_cita_externa=template["oe_cita_externa"],
        oe_normal_text=text,
        oe_snapshot_hash=h,
        template_id_used=tpl_id,
        idioma=idioma,
        jurisdiccion=spec.jurisdiction,
        peso=spec.weight,
    )


def render_oes(v_f: VectorActivacion, *, snapshot_id: str = "test", idioma: str = "es") -> List[OE]:
    result: List[OE] = []
    for rid in v_f.hook_trace:
        oe = redactar_oe(rid, v_f, snapshot_id=snapshot_id, idioma=idioma)
        if oe is not None:
            result.append(oe)
    return result


def _validate_tpl_router_consistency() -> None:
    orphan_templates = set(QOE_PLANTILLAS.keys()) - set(_REGLAS_TPL_VERSION.values())
    if orphan_templates:
        _logger.warning(
            "TPL huerfanas en QOE_PLANTILLAS sin router activo: %s",
            sorted(orphan_templates),
        )
    undeclared = set(_REGLAS_TPL_VERSION.values()) - set(QOE_PLANTILLAS.keys())
    if undeclared:
        _logger.warning(
            "tpl_ids activos sin entrada en QOE_PLANTILLAS: %s",
            sorted(undeclared),
        )


_validate_tpl_router_consistency()
