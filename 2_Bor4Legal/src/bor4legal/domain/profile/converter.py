# -*- coding: utf-8 -*-
"""
domain.profile.converter
========================
Conversor de Perfil v0.1.0 - implementa la Politica 18 del cuaderno v1.5a.

Fase actual: Construccion INDEPENDIENTE del monorepo BOR4SIGE (D-001 + D-001-A).
Hasta la palabra "integra" este modulo NO comparte dependencias, pipelines,
BD ni autenticacion con BOR4SIGE.

Caracteristicas formales (subset entregable piloto):
- 15 anclajes parametrizables (ANCHOR_IDS C-01..C-15) + WHITELIST declarativa.
- 13 categorias rechazables (BLACKLIST_KEYS B-01..B-13) + regex defensa en profundidad.
- 4 categorizadores (UE 2003/361, RIPCI RD 513/2017, PED RD 769/1999, EN 1090-2).
- 4 esquemas JSON-Schema (PROFILE_INPUT_SCHEMA, ANCHOR_OUTPUT_SCHEMA,
  REJECTION_SCHEMA, V_F_OUTPUT_SCHEMA).

Invariantes vinculantes (seccion 18):
- Determinismo: snapshot_hash reproducible via sha256 con sort_keys=True.
- Idempotencia: aplicar 2 veces el mismo input = mismo output.
- Bidireccionalidad cero: no se reconstruye el input original del output.
- No persistencia de campos rechazados: solo el campo "razon_rechazo".
- Privacidad por construccion (RGPD art. 5(1)(c) + ISO 27001 A.8.10):
  cero PII nominal en logs persistentes o reproductores L2.
"""
from __future__ import annotations

import copy
import hashlib
import json
import re
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# 18.2 - Lista blanca de 15 anclajes parametrizables
# ---------------------------------------------------------------------------
ANCHOR_IDS: Tuple[str, ...] = (
    "C-01", "C-02", "C-03", "C-04", "C-05",
    "C-06", "C-07", "C-08", "C-09", "C-10",
    "C-11", "C-12", "C-13", "C-14", "C-15",
)


WHITELIST: Dict[str, Dict[str, Any]] = {
    "C-01": {"nombre": "jurisdiccion_principal",
             "tipo": "ISO3166-1-alpha2", "ejemplo": "ES"},
    "C-02": {"nombre": "jurisdicciones_aplicables",
             "tipo": "list[ISO3166-1-alpha2]",
             "ejemplo": ["UE", "ES", "CA-Valencia", "ES-Sagunto"]},
    "C-03": {"nombre": "tipo_persona_juridica",
             "tipo": "enum", "ejemplo": "C",
             "valores": ["A", "B", "C", "D", "E", "F", "G", "H"]},
    "C-04": {"nombre": "codigo_actividad_cnae",
             "tipo": "string(N)", "ejemplo": "2511"},
    "C-05": {"nombre": "actividad_principal",
             "tipo": "string", "ejemplo": "Fabricacion de estructuras metalicas"},
    "C-06": {"nombre": "categoria_organizacion",
             "tipo": "enum", "ejemplo": "privada_mercantil",
             "valores": ["privada_mercantil", "publica_AAPP", "mixta_pyme",
                         "gran_empresa", "ONG", "fundacion", "universidad_publica"]},
    "C-07": {"nombre": "tamano_organizacion",
             "tipo": "enum", "ejemplo": "mediana",
             "valores": ["micro", "pequena", "mediana", "grande"]},
    "C-08": {"nombre": "idiomas_oficiales",
             "tipo": "list[ISO639-1]", "ejemplo": ["es"]},
    "C-09": {"nombre": "sectores_regulados_especiales",
             "tipo": "list[enum]", "ejemplo": [],
             "valores": ["defensa", "energia", "salud", "banca", "nuclear",
                         "alimentos", "transporte", "educacion"]},
    "C-10": {"nombre": "mercados_destino_exportacion",
             "tipo": "list[ISO3166-1-alpha2]", "ejemplo": ["FR", "DE"]},
    "C-11": {"nombre": "activos_inventario_resumen",
             "tipo": "list[string]", "ejemplo": ["compresor-A"]},
    "C-12": {"nombre": "magnitud_presion_max",
             "tipo": "number(bar)", "ejemplo": 12.0},
    "C-13": {"nombre": "magnitud_carga_termica_total_MJ",
             "tipo": "number(MJ)", "ejemplo": 4500.0},
    "C-14": {"nombre": "magnitud_potencia_instalada_kW",
             "tipo": "number(kW)", "ejemplo": 350.0},
    "C-15": {"nombre": "cliente_objetivo_tipo",
             "tipo": "enum", "ejemplo": "industrial_privado",
             "valores": ["industrial_privado", "AAPP_ENS", "defensa_ITAR",
                         "banca_DORA", "consumidor_B2C"]},
}


# ---------------------------------------------------------------------------
# 18.3 - Lista negra de 13 categorias de campos NO procesables
# ---------------------------------------------------------------------------
BLACKLIST_CATEGORIES: Tuple[str, ...] = (
    "B-01", "B-02", "B-03", "B-04", "B-05",
    "B-06", "B-07", "B-08", "B-09", "B-10",
    "B-11", "B-12", "B-13",
)

BLACKLIST_KEYS: Dict[str, Dict[str, str]] = {
    "B-01": {"categoria": "dni_nif_nie",
             "razon_rechazo": "RGPD art. 4(1): identificador directo de persona fisica."},
    "B-02": {"categoria": "direccion_postal_fisica",
             "razon_rechazo": "RGPD art. 4(1): dato de localizacion de persona fisica."},
    "B-03": {"categoria": "email_personal",
             "razon_rechazo": "RGPD art. 4(1): canal de contacto de persona fisica."},
    "B-04": {"categoria": "telefono_personal",
             "razon_rechazo": "RGPD art. 4(1): canal de contacto de persona fisica."},
    "B-05": {"categoria": "iban_cuenta_bancaria",
             "razon_rechazo": "Dato financiero reservado; ENS ALTA para AAPP."},
    "B-06": {"categoria": "tarjeta_credito_cvv",
             "razon_rechazo": "PCI-DSS violacion directa; nunca procesar."},
    "B-07": {"categoria": "know_how_secreto_industrial",
             "razon_rechazo": "Ley 1/2019 Secretos Empresariales."},
    "B-08": {"categoria": "precio_comprometido_contrato",
             "razon_rechazo": "Compromete confidencialidad contractual."},
    "B-09": {"categoria": "esquema_electrico_instalacion",
             "razon_rechazo": "Documentacion critica; ENS MEDIA/ALTA."},
    "B-10": {"categoria": "credenciales_usuario",
             "razon_rechazo": "Credencial; jamas debe llegar al perfil."},
    "B-11": {"categoria": "datos_salud_persona_fisica",
             "razon_rechazo": "RGPD art. 9: categoria especial de datos."},
    "B-12": {"categoria": "datos_personales_menores",
             "razon_rechazo": "LOPDGDD art. 7: garantia del menor."},
    "B-13": {"categoria": "geo_localizacion_precisa",
             "razon_rechazo": "RGPD art. 9: dato biométrico / ubicacion precisa."},
}

BLACKLIST_REGEX: Dict[str, "re.Pattern[str]"] = {
    "B-01": re.compile(r"^\d{8}[A-Z]$|^\d{8}$|^[XYZ]\d{6,7}[A-Z]$"),
    "B-03": re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"),
    "B-04": re.compile(r"^[+]\d{1,3}[-\s]?\d{6,12}$|^\d{9,12}$"),
    "B-05": re.compile(r"^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$"),
    "B-06": re.compile(r"^(?:\d[ -]*?){13,19}$"),
}


# ---------------------------------------------------------------------------
# 18.1.A - Categorizadores (4 declarativos)
# ---------------------------------------------------------------------------
def categorize_tamano_ue2003_361(
    empleados: Optional[int],
    facturacion_anual_euros: Optional[float],
    balance_euros: Optional[float],
) -> str:
    """Reglamento UE 2003/361: micro / pequena / mediana / grande."""
    if empleados is None and facturacion_anual_euros is None and balance_euros is None:
        return "no_categorizable"
    if (empleados is not None and empleados < 10) \
       and (facturacion_anual_euros is not None and facturacion_anual_euros <= 2_000_000):
        return "micro"
    if (empleados is not None and empleados < 50) \
       and (facturacion_anual_euros is not None and facturacion_anual_euros <= 10_000_000):
        return "pequena"
    if (empleados is not None and empleados < 250) \
       and (facturacion_anual_euros is not None and facturacion_anual_euros <= 50_000_000):
        return "mediana"
    return "grande"


def categorize_carga_termica_ripci_rd_513_2017(mj_total: float) -> str:
    """RD 513/2017 RIPCI: carga termica total MJ categoriza."""
    if mj_total < 3_500:
        return "baja"
    if mj_total < 20_000:
        return "media"
    if mj_total < 100_000:
        return "alta"
    return "muy_alta"


def categorize_presion_ped_rd_769_1999(bar: float) -> str:
    """RD 769/1999 PED: categorizacion por presion."""
    if bar < 0.5:
        return "no_categorizable"
    if bar < 10:
        return "baja"
    if bar < 50:
        return "media"
    return "alta"


def categorize_exc_en_1090_2(espesor_mm: Optional[float]) -> str:
    """EN 1090-2: clase de ejecucion (EXC1..EXC4) por espesor material."""
    if espesor_mm is None:
        return "no_categorizable"
    if espesor_mm < 6:
        return "EXC1"
    if espesor_mm < 12:
        return "EXC2"
    if espesor_mm < 25:
        return "EXC3"
    return "EXC4"


# ---------------------------------------------------------------------------
# 18 hooks derivativos (los puramente declarativos viven en engine/reglas.py)
# ---------------------------------------------------------------------------
DERIVATION_HOOKS: Dict[str, Dict[str, Any]] = {
    "R-101": {"anclajes_requeridos": ["C-04"], "produces": "metadata.C-07"},
    "R-201": {"anclajes_requeridos": ["C-13"], "produces": "derived.categoria_carga_termica"},
    "R-202": {"anclajes_requeridos": ["C-12"], "produces": "derived.categoria_presion"},
    "R-302": {"anclajes_requeridos": ["C-01", "C-02"], "produces": "derived.jurisdiction_tree"},
    "R-401": {"anclajes_requeridos": ["C-03", "C-06"], "produces": "metadata.tipo_org_espec"},
    "R-501": {"anclajes_requeridos": ["C-09"], "produces": "derived.regulated_sectors"},
    "R-503": {"anclajes_requeridos": ["C-10"], "produces": "derived.export_targets"},
    "R-506": {"anclajes_requeridos": ["C-02", "C-08"], "produces": "derived.idioma_por_pais"},
    "R-601": {"anclajes_requeridos": ["C-11"], "produces": "derived.assets_risk_hint"},
    "R-701": {"anclajes_requeridos": ["C-15"], "produces": "derived.cliente_especial"},
}


# ---------------------------------------------------------------------------
# Esquemas JSON-Schema para OpenAPI / Sphinx
# ---------------------------------------------------------------------------
PROFILE_INPUT_SCHEMA: Dict[str, Any] = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "ProfileInput_v0.1",
    "type": "object",
    "required": list(ANCHOR_IDS),
    "additionalProperties": True,
}

ANCHOR_OUTPUT_SCHEMA: Dict[str, Any] = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "AnchorOutput_v0.1",
    "type": "object",
    "required": ["anchors", "metadata", "derived", "snapshot_hash"],
}

REJECTION_SCHEMA: Dict[str, Any] = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "Rejection_v0.1",
    "type": "object",
    "required": ["anchor_id", "category_id", "razon_rechazo"],
    "properties": {
        "category_id": {"type": "string", "enum": list(BLACKLIST_CATEGORIES)},
    },
}

V_F_OUTPUT_SCHEMA: Dict[str, Any] = {
    "title": "VectorActivacion_v0.1",
    "type": "object",
    "required": ["V_U", "V_S", "V_CE", "hook_trace"],
}


# ---------------------------------------------------------------------------
# Tipos de datos (dataclasses)
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class RejectionRecord:
    anchor_id:      str
    category_id:    str
    razon_rechazo:  str
    regex_match:    bool = False

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class AnchorBundle:
    anchors:   Dict[str, Any]                = field(default_factory=dict)
    metadata:  Dict[str, Any]                = field(default_factory=dict)
    derived:   Dict[str, Any]                = field(default_factory=dict)
    rejects:   List[RejectionRecord]         = field(default_factory=list)

    def _snapshot_hash(self) -> str:
        payload = {
            "anchors":  _sort_jsonable(self.anchors),
            "metadata": _sort_jsonable(self.metadata),
            "derived":  _sort_jsonable(self.derived),
            "rejects":  sorted(
                [r.to_dict() for r in self.rejects],
                key=lambda x: (x["anchor_id"], x["category_id"]),
            ),
        }
        blob = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")
        return hashlib.sha256(blob).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "anchors":       self.anchors,
            "metadata":      self.metadata,
            "derived":       self.derived,
            "rejects":       [r.to_dict() for r in self.rejects],
            "snapshot_hash": self._snapshot_hash(),
        }


@dataclass
class ConversionResult:
    anchor_bundle:  AnchorBundle
    reject_count:   int = 0
    accepted_count: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "anchor_bundle":  self.anchor_bundle.to_dict(),
            "reject_count":   self.reject_count,
            "accepted_count": self.accepted_count,
        }


# ---------------------------------------------------------------------------
# Helpers internos
# ---------------------------------------------------------------------------
def _sort_jsonable(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: _sort_jsonable(v) for k, v in sorted(obj.items(), key=lambda kv: str(kv[0]))}
    if isinstance(obj, list):
        return [_sort_jsonable(v) for v in obj]
    return obj


def _is_blacklisted_value(value: Any) -> Optional[str]:
    s = str(value) if value is not None else ""
    for cat_id, pattern in BLACKLIST_REGEX.items():
        if pattern.search(s):
            return cat_id
    return None


# ---------------------------------------------------------------------------
# Conversor principal
# ---------------------------------------------------------------------------
class ProfileConverter:
    """
    Conversor de Perfil v0.1.0 - orquestador de 18 del cuaderno v1.5a.
    API:
        c = ProfileConverter()
        res = c.convert(raw_input_dict)
        payload = res.to_dict()
        snapshot_hash = payload["anchor_bundle"]["snapshot_hash"]
    """

    def __init__(self, *, seed: Optional[int] = None) -> None:
        self._seed = seed

    def _apply_blacklist(
        self, raw: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], List[RejectionRecord]]:
        accepted: Dict[str, Any] = {
            aid: copy.deepcopy(raw.get(aid)) for aid in ANCHOR_IDS
        }
        rejects: List[RejectionRecord] = []

        for anchor_id in ANCHOR_IDS:
            payload = accepted.get(anchor_id)
            if payload is None:
                continue
            if isinstance(payload, dict):
                cats: List[str] = list(payload.get("categories", []))
                rejected_this_anchor = False
                for cat_id in cats:
                    if cat_id in BLACKLIST_KEYS:
                        rejects.append(
                            RejectionRecord(
                                anchor_id=anchor_id,
                                category_id=cat_id,
                                razon_rechazo=BLACKLIST_KEYS[cat_id]["razon_rechazo"],
                                regex_match=False,
                            )
                        )
                        rejected_this_anchor = True
                for v in payload.values():
                    if isinstance(v, (str, int)):
                        cat_id = _is_blacklisted_value(v)
                        if cat_id:
                            rejects.append(
                                RejectionRecord(
                                    anchor_id=anchor_id,
                                    category_id=cat_id,
                                    razon_rechazo=BLACKLIST_KEYS[cat_id]["razon_rechazo"],
                                    regex_match=True,
                                )
                            )
                            rejected_this_anchor = True
                # §18.4 determinismo: el hash del bundle debe capturar el valor
                # aceptado, solo se silencia `value` cuando hubo rechazo.
                if rejected_this_anchor:
                    accepted[anchor_id] = {
                        "present": payload.get("present", True),
                        "categories": [],
                    }
                else:
                    accepted[anchor_id] = {
                        "present": payload.get("present", True),
                        "categories": [],
                        "value": payload.get("value"),
                    }
            else:
                cat_id = _is_blacklisted_value(payload)
                if cat_id:
                    rejects.append(
                        RejectionRecord(
                            anchor_id=anchor_id,
                            category_id=cat_id,
                            razon_rechazo=BLACKLIST_KEYS[cat_id]["razon_rechazo"],
                            regex_match=True,
                        )
                    )
                    accepted[anchor_id] = None
                else:
                    # Scalar aceptado: persistir su valor para determinismo del hash.
                    accepted[anchor_id] = {
                        "present": True,
                        "categories": [],
                        "value": payload,
                    }
        return accepted, rejects

    def _apply_whitelist_and_categorize(
        self, accepted: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        anchors_out: Dict[str, Any] = {}
        for anchor_id, payload in accepted.items():
            if payload is None:
                anchors_out[anchor_id] = None
                continue
            if isinstance(payload, dict):
                cleaned = {
                    k: v for k, v in payload.items()
                    if k in {"present", "categories", "value"}
                }
            else:
                cleaned = {"present": True, "categories": [], "value": payload}
            anchors_out[anchor_id] = cleaned

        metadata: Dict[str, Any] = {}
        c07 = anchors_out.get("C-07")
        if c07 and isinstance(c07, dict) and c07.get("value"):
            metadata["C-07"] = c07["value"]
        else:
            metadata["C-07"] = "no_categorizable"

        c13 = anchors_out.get("C-13")
        if c13 and isinstance(c13, dict) and c13.get("value") is not None:
            metadata["categoria_carga_termica"] = \
                categorize_carga_termica_ripci_rd_513_2017(float(c13["value"]))

        c12 = anchors_out.get("C-12")
        if c12 and isinstance(c12, dict) and c12.get("value") is not None:
            metadata["categoria_presion"] = \
                categorize_presion_ped_rd_769_1999(float(c12["value"]))
        return anchors_out, metadata

    def _apply_derivation_hooks(
        self, anchors: Dict[str, Any], metadata: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], List[str]]:
        derived: Dict[str, Any] = {}
        trace: List[str] = []
        for hook_id, spec in DERIVATION_HOOKS.items():
            req = spec["anclajes_requeridos"]
            if all(anchors.get(aid) for aid in req):
                trace.append(hook_id)
        c01 = (anchors.get("C-01") or {}).get("value") \
            if isinstance(anchors.get("C-01"), dict) else None
        c02 = anchors.get("C-02")
        c02_val = c02.get("value") if isinstance(c02, dict) else None
        if c01:
            derived["jurisdiction_tree"] = {
                "principal": c01,
                "applicable": c02_val or [c01],
            }
        c10 = anchors.get("C-10")
        if c10 and isinstance(c10, dict) and c10.get("value"):
            derived["export_targets"] = list(c10["value"])
        c11 = anchors.get("C-11")
        if c11 and isinstance(c11, dict) and c11.get("value"):
            derived["assets_risk_hint"] = list(c11["value"])
        c09 = anchors.get("C-09")
        if c09 and isinstance(c09, dict) and c09.get("value"):
            derived["regulated_sectors"] = list(c09["value"])
        return derived, trace

    def convert(self, raw_input: Dict[str, Any]) -> ConversionResult:
        if not isinstance(raw_input, dict):
            raise TypeError(
                "ProfileConverter.convert() expects dict, got {}.".format(
                    type(raw_input).__name__
                )
            )
        accepted, rejects = self._apply_blacklist(raw_input)
        anchors, metadata = self._apply_whitelist_and_categorize(accepted)
        derived, trace = self._apply_derivation_hooks(anchors, metadata)
        bundle = AnchorBundle(
            anchors=anchors,
            metadata=metadata,
            derived=derived,
            rejects=list(rejects),
        )
        accepted_count = sum(1 for a in anchors.values() if a is not None)
        return ConversionResult(
            anchor_bundle=bundle,
            reject_count=len(rejects),
            accepted_count=accepted_count,
        )


# ---------------------------------------------------------------------------
# Ejemplo end-to-end (se ejecuta al hacer `python -m bor4legal.domain.profile.converter`)
# ---------------------------------------------------------------------------
EXAMPLE_RAW_INPUT: Dict[str, Any] = {
    "C-01": {"present": True, "value": "ES"},
    "C-02": {"present": True, "value": ["UE", "ES", "CA-Valencia", "ES-Sagunto"]},
    "C-03": {"present": True, "value": "C"},
    "C-04": {"present": True, "value": "2511"},
    "C-05": {"present": True, "value": "Fabricacion de estructuras metalicas"},
    "C-06": {"present": True, "value": "privada_mercantil"},
    "C-07": {"present": True, "value": "pequena"},
    "C-08": {"present": True, "value": ["es"]},
    "C-09": {"present": True, "value": []},
    "C-10": {"present": True, "value": ["FR", "DE"]},
    "C-11": {"present": True, "value": ["compresor-A"]},
    "C-12": {"present": True, "value": 12.0},
    "C-13": {"present": True, "value": 4500.0},
    "C-14": {"present": True, "value": 350.0},
    "C-15": {"present": True, "value": "industrial_privado"},
    "_banco": {"present": True, "categories": ["B-05"], "value": "ES9121000418450200051332"},
    "_persona": {"present": True, "categories": ["B-01"]},
    "_email": {"present": True, "categories": ["B-03"], "value": "ana@pyme.com"},
    "_salud": {"present": True, "categories": ["B-11"]},
    "_cvv": {"present": True, "categories": ["B-06"], "value": "4532 1234 5678 9010"},
}


def _build_example() -> Dict[str, Any]:
    res = ProfileConverter().convert(EXAMPLE_RAW_INPUT)
    return res.to_dict()


if __name__ == "__main__":
    print(json.dumps(_build_example(), indent=2, ensure_ascii=False, sort_keys=True))
