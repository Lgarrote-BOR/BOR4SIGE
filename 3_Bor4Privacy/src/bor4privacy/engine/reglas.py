# -*- coding: utf-8 -*-
"""
engine.reglas
=============
Reglas del clon Privacy (ISO 27701 + RGPD + LOPDGDD).

M1 DPIA baked-in: pivot a validacion TAXONOMICA contra catalogos externos
inmutables. NO solapa con N=1 Legal (C-XX) / N=2 Quality (Q-XX) / N=3 Risk (R-XX).

Reglas P-101/P-201/P-301 sobre RGPD art. 35 (DPIA cap. V transferencias).
"""
from __future__ import annotations
from typing import Any, Callable, Dict, List


BASES_JURIDICAS_VALIDAS = [
    "consentimiento", "ejecucion_contrato", "obligacion_legal",
    "interes_vitale", "interes_publico", "interes_legitimo",
]
RETENCIONES_MAXIMAS_DIAS = {
    "consentimiento_cliente": 1825,
    "obligacion_legal_facturacion": 730,
    "interes_legitimo_marketing": 365,
    "ejecucion_contrato": 1825,
}
ADECUADOS_UE = [
    "adecuado_ue", "scc_firmadas", "epp_certificado",
    "bcr_vinculante", "exencion_art49",
]

REGISTRO_RGPD = {
    "id": "P-REG-001",
    "fuente": "RGPD cap. V",
    "sintesis": "Toda transferencia fuera UE requiere decision adecuacion o SCC + EPP.",
}


def _aplica_P101(v_f):
    try:
        return (v_f.V_S.perfil_riesgo_pii == "alto"
                and len(v_f.V_S.pii_inventario or []) > 1000
                and len(v_f.V_CE.transferencias_protegidas or []) > 0)
    except Exception:
        return False


def _aplica_P201(v_f):
    try:
        return (v_f.V_S.perfil_riesgo_pii == "alto"
                and len(v_f.V_S.pii_inventario or []) > 1000)
    except Exception:
        return False


def _aplica_P301(v_f):
    try:
        return len(v_f.V_CE.transferencias_protegidas or []) > 0
    except Exception:
        return False


REGISTRO_REGLAS = [
    {"rule_id": "P-101", "titulo": "DPIA obligatoria AEPD (RGPD art. 35)",
     "fuente": "RGPD + AEPD Guia DPIA 2018", "plantilla": "RGPD_DPIA_TRIGGER",
     "apply": _aplica_P101,
     "explicacion": "Perfil ALTO + PII > 1000 + transferencias fuera UE: AEPD obliga EIPD."},
    {"rule_id": "P-201", "titulo": "DPIA 5 secciones (RGPD art. 35(7))",
     "fuente": "RGPD art. 35(7) + AEPD Esquema EIPD", "plantilla": "RGPD_DPIA_5SECCIONES",
     "apply": _aplica_P201,
     "explicacion": "DPIA 5 secciones: descripcion, necesidad, riesgos, mitigacion, conclusion."},
    {"rule_id": "P-301", "titulo": "Transferencia fuera UE (RGPD cap. V)",
     "fuente": "RGPD art. 45-46 + Decision 2021/914", "plantilla": "RGPD_TRANSFERENCIA_FUERA_UE",
     "apply": _aplica_P301,
     "explicacion": "Sin decision adecuacion, requiere SCC + EPP documentado."},
]


__all__ = [
    "BASES_JURIDICAS_VALIDAS", "RETENCIONES_MAXIMAS_DIAS",
    "ADECUADOS_UE", "REGISTRO_RGPD", "REGISTRO_REGLAS",
]
