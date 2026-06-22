# -*- coding: utf-8 -*-
"""
engine.oe_renderer
==================
OE renderer Privacy: plantillas RGPD_DPIA_* con D12 hash inmutable.

D12: hash sobre {rule_id, snapshot_id, json.dumps(v_f_dict, sort_keys=True),
template_id_used, idioma}. Mismo contrato D12 que piloto Legal + clones.
"""
from __future__ import annotations
import hashlib
import json
from typing import Any, Dict

from .types import VectorActivacion


PLANTILLAS = {
    "RGPD_DPIA_TRIGGER": (
        "== DPIA OBLIGATORIA RGPD art. 35 ==\n"
        "TENANT: {tenant_id}\nPERFIL_PII: {perfil_riesgo_pii}\n"
        "INVENTARIO_PII_SIZE: {pii_inventory_size}\n"
        "TRANSFER_SIZE: {transfers_size}\nIDIOMA: {idioma_canonico}\n"
        "REQUISITO: EIPD remitida a AEPD antes de tratamiento.\n"
    ),
    "RGPD_DPIA_5SECCIONES": (
        "== EIPD 5 SECCIONES (RGPD art. 35(7)) ==\n"
        "SECCION 1. DESCRIPCION TRATAMIENTOS:\n"
        "  - Inventario PII: {pii_inventory_size} entradas\n"
        "  - Transferencias fuera UE: {transfers_size}\n"
        "SECCION 2. NECESIDAD Y PROPORCIONALIDAD:\n"
        "  - Bases juridicas cumplidas: {bases_juridicas_count}\n"
        "SECCION 3. RIESGOS:\n"
        "  - Retenciones incumplidas: {retenciones_incumplidas_count}\n"
        "SECCION 4. MEDIDAS MITIGACION:\n"
        "  - Perfil PII: {perfil_riesgo_pii}\n"
        "SECCION 5. CONCLUSION EIPD:\n  - {conclusion_eipd}\n"
    ),
    "RGPD_TRANSFERENCIA_FUERA_UE": (
        "== TRANSFERENCIA FUERA UE (RGPD art. 45-46) ==\n"
        "TENANT: {tenant_id}\nTRANSFERENCIAS: {transfers_size}\n"
        "IDIOMA: {idioma_canonico}\n"
        "REQUISITO: SCC 2021/914 + EPP documentado antes del flujo.\n"
    ),
}


def renderizar_oe(rule_id, snapshot_id, v_f, plantilla_id, idioma):
    """Devuelve dict OE firmable con D12 hash inmutable."""
    plantilla_texto = PLANTILLAS.get(plantilla_id, PLANTILLAS["RGPD_DPIA_TRIGGER"])
    tenant_id = v_f.V_U.principal or "es"
    payload = {
        "tenant_id": tenant_id,
        "perfil_riesgo_pii": v_f.V_S.perfil_riesgo_pii,
        "pii_inventory_size": len(v_f.V_S.pii_inventario or []),
        "transfers_size": len(v_f.V_CE.transferencias_protegidas or []),
        "idioma_canonico": idioma,
        "bases_juridicas_count": len(v_f.V_CE.bases_juridicas_cumplidas or []),
        "retenciones_incumplidas_count": len(v_f.V_CE.retenciones_incumplidas or []),
        "conclusion_eipd": "Procede EIPD favorable bajo RGPD art. 35 si mitigacion robusta.",
    }
    rendered_body = plantilla_texto.format(**payload)
    v_f_dict = v_f.to_dict()
    hash_input = "{}\n{}\n{}\n{}\n{}".format(
        rule_id, snapshot_id,
        json.dumps(v_f_dict, sort_keys=True, separators=(",", ":")),
        plantilla_id, idioma,
    ).encode("utf-8")
    d12_hash = hashlib.sha256(hash_input).hexdigest()
    return {
        "rule_id": rule_id,
        "snapshot_id": snapshot_id,
        "v_f": v_f_dict,
        "template_id_used": plantilla_id,
        "idioma": idioma,
        "body": rendered_body,
        "d12_hash": d12_hash,
    }


__all__ = ["renderizar_oe", "PLANTILLAS"]
