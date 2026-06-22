# -*- coding: utf-8 -*-
"""
cli
===
CLI del clon Privacy (ISO 27701 + RGPD + LOPDGDD) v0.3.0.

Adaptado al RBAC canónico del piloto Legal (CapaScope con tenant_id, ResultadoCapacidad).
"""
from __future__ import annotations
import argparse
import json
import sys
from typing import Any, Dict, List, Optional

from .engine.types import (
    VectorActivacion, VectorCuestionesEspeciales, VectorSector, VectorUbicacion,
)
from .engine.reglas import REGISTRO_REGLAS
from .engine.oe_renderer import renderizar_oe, PLANTILLAS
from .security.rbac import (
    CAPACIDADES, CapaScope, PlataformaContexto, ROLES_MODULO,
    ResultadoCapacidad, RolModulo, evaluar_capa_scope,
)

VERSION_PILOTO = "0.3.0"

PERFILES_PRIVACY = [
    {"id": "P-00", "tenant": "es", "tamano": "pyme",         "perfil_riesgo_pii": "bajo"},
    {"id": "P-01", "tenant": "es", "tamano": "pyme",         "perfil_riesgo_pii": "medio"},
    {"id": "P-02", "tenant": "es", "tamano": "gran_empresa", "perfil_riesgo_pii": "alto"},
    {"id": "P-03", "tenant": "pt", "tamano": "pyme",         "perfil_riesgo_pii": "bajo"},
    {"id": "P-04", "tenant": "mx", "tamano": "gran_empresa", "perfil_riesgo_pii": "alto"},
    {"id": "P-05", "tenant": "br", "tamano": "pyme",         "perfil_riesgo_pii": "medio"},
]


def _evaluar_perfil(perfil):
    pii_size = 1500 if perfil["perfil_riesgo_pii"] == "alto" else 500
    transfers = 1 if perfil["tenant"] != "es" else 0
    retenciones_inc = [{"id": "R1", "retain_days": 365, "max_dias": 180}] \
        if perfil["perfil_riesgo_pii"] == "alto" else []
    v_f = VectorActivacion(
        V_U=VectorUbicacion(principal="es", applicable=["es", "pt", "mx", "br"]),
        V_S=VectorSector(sector="SaaS", tamano=perfil["tamano"],
            perfil_riesgo_pii=perfil["perfil_riesgo_pii"],
            pii_inventario=[{"t": "email"}] * pii_size),
        V_CE=VectorCuestionesEspeciales(
            bases_juridicas_cumplidas=["ejecucion_contrato", "obligacion_legal"],
            retenciones_incumplidas=retenciones_inc,
            transferencias_protegidas=[{"pais": perfil["tenant"]}] * transfers,
            idioma_canonico="es",
        ),
        hook_trace=[],
    )
    snapshot_id = "snap-{}".format(perfil["id"])
    out = []
    for regla in REGISTRO_REGLAS:
        try:
            aplica = regla["apply"](v_f)
        except Exception:
            aplica = False
        if aplica:
            idioma = "es" if regla["rule_id"] in ("P-101", "P-201") else "en"
            oe = renderizar_oe(regla["rule_id"], snapshot_id, v_f,
                               regla["plantilla"], idioma)
            out.append(oe)
    return {"perfil": perfil, "oes": out}


def _run(perfiles, snapshot_id=None, plataforma=None):
    res = []
    for p in perfiles:
        r = _evaluar_perfil(p)
        rbac_hits = []
        if plataforma is not None:
            tenant_id_sesion = plataforma.tenant_id if plataforma.tenant_id != "*" else "es"
            for oe in r["oes"]:
                capa = CapaScope(
                    rol_modulo=RolModulo.MANTENEDOR.value,
                    accion="oe.leer",
                    recurso=oe["rule_id"],
                    tenant_id=tenant_id_sesion,
                    snapshot_id=snapshot_id or "smoke",
                )
                res_rbac = evaluar_capa_scope(
                    capa,
                    plataforma=plataforma,
                    roles_modulo=list(ROLES_MODULO),
                )
                rbac_hits.append({
                    "rule_id": oe["rule_id"],
                    "ok": res_rbac.permit,
                    "outcome": res_rbac.outcome,
                    "motivo": res_rbac.reasons[0] if res_rbac.reasons else "",
                })
        r["rbac_audit"] = rbac_hits
        res.append(r)
    return {
        "version_piloto": VERSION_PILOTO,
        "snapshot_id": snapshot_id,
        "rbac_audit_summary": {
            "totales": len(res),
            "all_match_expected": all(
                all(h["ok"] for h in r["rbac_audit"]) for r in res
            ),
            "by_user": res,
        },
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description="bor4privacy CLI v0.3.0")
    parser.add_argument("perfil_json", help="JSON con perfiles a evaluar")
    parser.add_argument("--token", help="JWT B4S firmado por auth.js")
    parser.add_argument("--token-secret", help="Secret HMAC del gateway B4S")
    parser.add_argument("--snapshot-id", default="snap-default")
    args = parser.parse_args(argv)

    if args.token and not args.token_secret:
        print("Error: --token requiere --token-secret", file=sys.stderr)
        return 3

    from .security.integration import from_env as _from_env
    plataforma = _from_env()

    try:
        perfiles = json.loads(args.perfil_json)
        if not isinstance(perfiles, list):
            perfiles = [perfiles]
    except json.JSONDecodeError as e:
        print("Error: perfil_json no es JSON valido: {!r}".format(e), file=sys.stderr)
        return 1

    out = _run(perfiles, args.snapshot_id, plataforma)
    print(json.dumps(out, sort_keys=True, default=str))
    return 0


if __name__ == "__main__":
    sys.exit(main())
