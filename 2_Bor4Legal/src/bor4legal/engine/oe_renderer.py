# -*- coding: utf-8 -*-
"""
engine.oe_renderer
==================
Renderiza la OE (§20) a partir de V_F + catalogo.

OE = Obligacion Elemental, atomo inmutable firmado por cliente y auditor.
Campos §20.2 (10 canonicos + 5 derivados).

Determinista: dicta('{rid}@{template_hash}') + v_f_dict + idioma -> sha256.
"""
from __future__ import annotations

import hashlib
import json
import logging
import re
from dataclasses import asdict, dataclass, field
from datetime import date
from typing import Any, Dict, List, Optional

from bor4legal.engine.reglas import REGLAS_CATALOGO
from bor4legal.engine.types import VectorActivacion

_logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class OE:
    """Cap. 20 - Estructura canonica de la OE (§20.2)."""
    oe_id:              str
    snapshot_id:        str
    snapshot_emision:   str
    version_oe:         str
    rule_id:            str
    anchor_id:          str
    oe_legal_fuente:    str
    oe_cita_externa:    str
    oe_normal_text:     str
    oe_snapshot_hash:   str
    template_id_used:   str       = ""           # D12: id estable de instancia de plantilla.
                                                 # Distinto de version_oe: este identifica la plantilla
                                                 # concreta para una regla; version_oe es la version
                                                 # canonica del motor que produjo la OE.
    idioma:             str       = "es"
    jurisdiccion:       str       = ""
    peso:               int       = 1
    periodo_vigencia:   str       = ""
    estado_vigencia:    str       = "activa"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


OE_SCHEMA: Dict[str, Any] = {
    "title": "OE_v0.1",
    "type": "object",
    "required": [
        "oe_id", "snapshot_id", "snapshot_emision", "version_oe",
        "rule_id", "anchor_id", "oe_legal_fuente", "oe_cita_externa",
        "oe_normal_text", "oe_snapshot_hash",
        # NOTA: template_id_used se popula siempre en redactar_oe() (D12),
        # pero permitimos default "" para que el dataclass pueda construirse
        # sin pasar el campo (tests legacy / callers externos pioneros).
    ],
    "properties": {
        "oe_id":            {"type": "string"},
        "snapshot_id":      {"type": "string"},
        "snapshot_emision": {"type": "string"},
        "version_oe":       {"type": "string"},
        "rule_id":          {"type": "string"},
        "anchor_id":        {"type": "string"},
        "oe_legal_fuente":  {"type": "string"},
        "oe_cita_externa":  {"type": "string"},
        "oe_normal_text":   {"type": "string"},
        "oe_snapshot_hash": {"type": "string"},
        "template_id_used": {"type": "string"},   # D12: estable aunque cambie el texto
        "idioma":           {"type": "string"},
        "jurisdiccion":     {"type": "string"},
        "peso":             {"type": "integer"},
        "periodo_vigencia": {"type": "string"},
        "estado_vigencia":  {"type": "string"},
    },
}


# D12: OE_PLANTILLAS esta versionada por template_id. El snapshot_hash usa el
# template_id (estable) y NO el texto literal, de modo que correcciones
# tipograficas o mejoras de redaccion NO invalidan las OE historicas. Para
# reproducir bit-a-bit una OE firmada, basta con (anchors_snapshot,
# template_id) y el texto archivado en Git (fuente autoritativa del "como").
OE_PLANTILLAS: Dict[str, Dict[str, str]] = {
    "tpl-R-101-v1": {
        "oe_cita_externa": "https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32003R0361",
        "oe_normal_text": "La organizacion de tipo {tamano} aplica las obligaciones del Reglamento UE 2003/361 sobre definicion de micro/pequena/mediana empresa. Categorizacion vigente. Verificar plazo de revision.",
    },
    "tpl-R-201-v1": {
        "oe_cita_externa": "https://www.boe.es/buscar/act.php?id=BOE-A-2017-12620",
        "oe_normal_text": "Conforme al RD 513/2017 (RIPCI), recategorizar la instalacion por carga termica total: {carga_termica}. Aplicar obligaciones correspondientes (revision, mantenimiento) segun resultado.",
    },
    "tpl-R-202-v1": {
        "oe_cita_externa": "https://www.boe.es/buscar/act.php?id=BOE-A-1999-17686",
        "oe_normal_text": "Conforme al RD 769/1999 (PED), recategorizar la instalacion por presion: {presion}. Aplicar obligaciones de evaluacion de conformidad apropiadas.",
    },
    "tpl-R-302-v1": {
        "oe_cita_externa": "https://www.boe.es/buscar/act.php?id=BOE-A-2015-10565",
        "oe_normal_text": "La organizacion aplica, en el ambito territorial {applicable}, las obligaciones derivadas de las jurisdicciones enumeradas. Vigilar concurrencia normativa.",
    },
    "tpl-R-401-v1": {
        "oe_cita_externa": "https://www.boe.es/buscar/act.php?id=BOE-1889-4730",
        "oe_normal_text": "La organizacion, como tipo {tipo_org}, esta sujeta a las obligaciones especificas de su forma juridica. Atenerse al Codigo Civil y normativa sectorial.",
    },
    "tpl-R-501-v1": {
        "oe_cita_externa": "https://www.boe.es/buscar/act.php?id=BOE-A-2014-12729",
        "oe_normal_text": "Sector regulado: {reg_sectores}. Aplicar obligaciones especificas (Ley 24/2013 Sector Electrico; NIS2 RD-L 12/2018; ATC segun sector).",
    },
    "tpl-R-503-v1": {
        "oe_cita_externa": "https://eur-lex.europa.eu/eli/reg/2019/1020/oj",
        "oe_normal_text": "Mercados destino exportacion: {export}. Verificar cumplimiento de normativas locales (RGPD equivalencia, certificaciones, controles aduaneros).",
    },
    "tpl-R-506-v1": {
        "oe_cita_externa": "https://www.unicode.org/cldr/charts/latest/supplemental/language_territory_information.html",
        "oe_normal_text": "Idiomas oficiales: {idiomas}. Adecuar documentacion oficial y traduccion jurada segun jurisdiccion.",
    },
    "tpl-R-601-v1": {
        "oe_cita_externa": "https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673",
        "oe_normal_text": "Activos inventariados: {assets}. Aplicar RGPD art. 32 + ISO 27002 A.8.1 (inventario y propiedad de activos).",
    },
    "tpl-R-701-v1": {
        "oe_cita_externa": "https://www.boe.es/buscar/act.php?id=BOE-A-2022-24857",
        "oe_normal_text": "Cliente objetivo: {cliente}. Aplicar obligaciones derivadas (ENS RD 311/2022 si AAPP, NIS2 RD-L 12/2018 si esencial).",
    },
}

# Router estable rid -> template_id activo. Para un bump de plantilla (cambio
# mayor de redaccion o cobertura legal) incrementar la v en el id y actualizar
# esta entrada. Las OE previas siguen siendo reproducibles con el texto
# archivado en Git correspondiente a ese template_id.
_REGLAS_TPL_VERSION: Dict[str, str] = {
    "R-101": "tpl-R-101-v1",
    "R-201": "tpl-R-201-v1",
    "R-202": "tpl-R-202-v1",
    "R-302": "tpl-R-302-v1",
    "R-401": "tpl-R-401-v1",
    "R-501": "tpl-R-501-v1",
    "R-503": "tpl-R-503-v1",
    "R-506": "tpl-R-506-v1",
    "R-601": "tpl-R-601-v1",
    "R-701": "tpl-R-701-v1",
}


# Mapeo estable rid -> lkp_normativa id (sin templates @vN magicos).
_REGLAS_LKP: Dict[str, str] = {
    "R-101": "reg_ue_2003_0361",
    "R-201": "rd_513_2017",
    "R-202": "rd_769_1999",
    "R-302": "lo_4_2015",
    "R-401": "cc_art_35",
    "R-501": "ley_24_2013",
    "R-503": "reg_ue_2019_1020",
    "R-506": "iso_cldr",
    "R-601": "rgpd_art_32",
    "R-701": "ens_rd_311_2022",
}


def _lkp_fuente(rid: str, version: str = "v1.0") -> str:
    """Mapeo directo sin templates magicos."""
    return f"lkp_normativa[{_REGLAS_LKP.get(rid, rid.lower())}@{version}]"


def redactar_oe(
    rid: str,
    v_f: VectorActivacion,
    *,
    snapshot_id: str = "test",
    idioma: str = "es",
) -> Optional[OE]:
    if rid not in REGLAS_CATALOGO:
        _logger.warning("redactar_oe: rid %s no esta en REGLAS_CATALOGO", rid)
        return None
    if rid not in _REGLAS_TPL_VERSION:
        _logger.warning(
            "redactar_oe: rid %s fired pero no esta en _REGLAS_TPL_VERSION "
            "(router desincronizado; la OE se descarta)",
            rid,
        )
        return None
    tpl_id = _REGLAS_TPL_VERSION[rid]
    if tpl_id not in OE_PLANTILLAS:
        _logger.warning(
            "redactar_oe: tpl_id %s (de rid %s) no esta en OE_PLANTILLAS "
            "(catalogo incompleto; la OE se descarta)",
            tpl_id, rid,
        )
        return None
    spec = REGLAS_CATALOGO[rid]
    template = OE_PLANTILLAS[tpl_id]
    # §20.4.B humanización: las listas se serializan como "a, b, c" para que
    # la OE firmada sea legible por un auditor no-técnico. Si la lista está
    # vacía o es None, el marcador neutro `no_categorizable` se mantiene.
    def _humanize(v: Any) -> Any:
        if isinstance(v, list):
            if not v:
                return "no_categorizable"
            return ", ".join(str(x) for x in v)
        return v

    mapping: Dict[str, Any] = {
        "tamano":        v_f.V_S.tamano,
        "tipo_org":      v_f.V_S.tipo_org,
        "carga_termica": v_f.V_CE.carga_termica,
        "presion":       v_f.V_CE.presion,
        "applicable":    v_f.V_U.applicable,
        "reg_sectores":  v_f.V_CE.reg_sectores,
        "export":        v_f.V_CE.export,
        "idiomas":       v_f.V_CE.idiomas,
        "assets":        v_f.V_CE.assets,
        "cliente":       v_f.V_CE.cliente,
    }
    # Construimos `valores` cubriendo SIEMPRE todos los placeholders del
    # template (defensivo: si V_F no aporta el dato, marca neutra).
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
    # D12: el snapshot_hash usa el template_id (estable) en vez del dict literal
    # del template. Asi correcciones tipograficas o mejoras de redaccion NO
    # invalidan OEs historicas. La reproducibilidad bit-a-bit exige
    # (anchors + template_id) y el texto vN archivado en Git.
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
    # §20.4.B replay bit-a-bit: oe_id debe ser determinista a partir del snapshot,
    # NO de la fecha de emision (date.today() rompe reproducibilidad cross-dia).
    return OE(
        oe_id=f"OE-{snapshot_id}-{rid}",
        snapshot_id=snapshot_id,
        snapshot_emision=hoy,
        version_oe="v1.0",   # version canonica del piloto; revisar en v0.2 si requiere versionado por regla.
        rule_id=rid,
        anchor_id=",".join(spec.inputs) or "C-N/A",
        oe_legal_fuente=_lkp_fuente(rid),
        oe_cita_externa=template["oe_cita_externa"],
        oe_normal_text=text,
        oe_snapshot_hash=h,
        template_id_used=tpl_id,   # D12: sellado en cada OE para reproducibilidad
        idioma=idioma,
        jurisdiccion=spec.jurisdiction,
        peso=spec.weight,
        periodo_vigencia="",
        estado_vigencia="activa",
    )


def render_oes(
    v_f: VectorActivacion,
    *,
    snapshot_id: str = "test",
    idioma: str = "es",
) -> List[OE]:
    result: List[OE] = []
    for rid in v_f.hook_trace:
        oe = redactar_oe(rid, v_f, snapshot_id=snapshot_id, idioma=idioma)
        if oe is not None:
            result.append(oe)
    return result


# --- D12 SR2: validador de consistencia router vs catalogo (import-time) ---


def _validate_tpl_router_consistency() -> None:
    """Chequeo defensivo en import-time (D12 SR2).

    Detecta desincronizacion entre:
      - `OE_PLANTILLAS` (contenido: tpl_ids + texto).
      - `_REGLAS_TPL_VERSION` (router: rid -> tpl_id activo).

    Casos cubiertos:
      a) TPL huerfana: entrada en OE_PLANTILLAS sin router activo.
      b) Router huerfano: tpl_id activo sin entrada en OE_PLANTILLAS.

    Solo emite WARNING; no aborta, porque el router activo puede referenciar
    tpl_ids validas aunque el contenido tarde en anexarse brevemente.
    Permite detectar drift en code review antes de que llegue a produccion.
    """
    orphan_templates = set(OE_PLANTILLAS.keys()) - set(_REGLAS_TPL_VERSION.values())
    if orphan_templates:
        _logger.warning(
            "TPL huerfanas en OE_PLANTILLAS sin router activo: %s",
            sorted(orphan_templates),
        )
    undeclared_active_routes = (
        set(_REGLAS_TPL_VERSION.values()) - set(OE_PLANTILLAS.keys())
    )
    if undeclared_active_routes:
        _logger.warning(
            "tpl_ids activos sin entrada en OE_PLANTILLAS: %s",
            sorted(undeclared_active_routes),
        )


_validate_tpl_router_consistency()
