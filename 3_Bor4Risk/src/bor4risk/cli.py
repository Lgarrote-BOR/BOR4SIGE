"""CLI del clon Risk MAGERIT."""
from __future__ import annotations
import json
import sys
from pathlib import Path


def _flatten_anchors(anchors):
    out = {}
    for k, v in anchors.items():
        if isinstance(v, dict):
            out[k] = v.get("value")
        else:
            out[k] = v
    return out


def _run(path, *, snapshot_id="pilot-risk-2026-06-21"):
    from bor4risk.engine.evaluator import Evaluador
    from bor4risk.engine.oe_renderer import render_roes
    from bor4risk.security.rbac import (
        CapaScope, PlataformaContexto, RolModulo, evaluar_capa_scope,
    )
    raw = json.loads(path.read_text(encoding="utf-8"))
    anchors_flat = _flatten_anchors(raw)
    ev = Evaluador(snapshot_id=snapshot_id)
    v_f = ev.evaluar(anchors_flat)
    roes = [roe.to_dict() for roe in render_roes(v_f, snapshot_id=snapshot_id, idioma="es")]
    # D-002 (propagado al clon Risk MAGERIT): README bor4risk.security.integration.
    # Lee B4S_JWT + B4S_JWT_SECRET del entorno del subshell; en su defecto cae
    # al placeholder legacy (modo standalone, sin gateway).
    from bor4risk.security.integration import from_env as _from_env
    plataforma = _from_env(placeholder_tenant="es", placeholder_user="demo-user")
    alcance_roe = evaluar_capa_scope(
        CapaScope(rol_modulo=RolModulo.CLIENTE.value, accion="oe.firmar", recurso="*", tenant_id="es", snapshot_id=snapshot_id),
        plataforma=plataforma, roles_modulo=[RolModulo.CLIENTE.value],
    )
    audit_scenarios = [
        {"desc": "Cliente firmando su ROE", "acc": "oe.firmar", "rol": RolModulo.CLIENTE.value, "roles_modulo": [RolModulo.CLIENTE.value], "expected": "ALLOW"},
        {"desc": "Revisor intentando publicar catalogo", "acc": "catalogo.publicar", "rol": RolModulo.REVISOR.value, "roles_modulo": [RolModulo.REVISOR.value], "expected": "DENY"},
        {"desc": "Mantenedor + Revisor firmando ROE (SoD)", "acc": "oe.firmar", "rol": RolModulo.MANTENEDOR.value, "roles_modulo": [RolModulo.MANTENEDOR.value, RolModulo.REVISOR.value], "expected": "DENY"},
        {"desc": "Mantenedor gestionando activos", "acc": "gestion_activos", "rol": RolModulo.MANTENEDOR.value, "roles_modulo": [RolModulo.MANTENEDOR.value], "expected": "ALLOW"},
        {"desc": "Cliente intentando evaluar amenazas", "acc": "evaluar_amenazas", "rol": RolModulo.CLIENTE.value, "roles_modulo": [RolModulo.CLIENTE.value], "expected": "DENY"},
    ]
    rbac_audit = []
    for sce in audit_scenarios:
        scope_x = CapaScope(rol_modulo=sce["rol"], accion=sce["acc"], recurso="audit-x", tenant_id="es", snapshot_id=snapshot_id)
        res_x = evaluar_capa_scope(scope_x, plataforma=plataforma, roles_modulo=sce["roles_modulo"])
        rbac_audit.append({"scenario": sce["desc"], "accion": sce["acc"], "rol_modulo": sce["rol"], "expected": sce["expected"], "actual_outcome": res_x.outcome, "permit": res_x.permit, "matches_expected": res_x.outcome == sce["expected"]})
    rbac_audit_summary = {"total": len(rbac_audit), "allow_count": sum(1 for x in rbac_audit if x["permit"]), "deny_count": sum(1 for x in rbac_audit if not x["permit"]), "all_match_expected": all(x["matches_expected"] for x in rbac_audit)}
    return {
        "version_piloto": "0.3.0", "snapshot_id": snapshot_id, "perfil_input_keys": sorted(list(raw.keys())),
        "v_f": v_f.to_dict(), "snapshot_hash_v_f": Evaluador.determinism_check(v_f, snapshot_id),
        "oes": roes,
        "rbac_check_ejemplo": {"scope": "oe.firmar", "permit": alcance_roe.permit, "outcome": alcance_roe.outcome},
        "rbac_audit": rbac_audit, "rbac_audit_summary": rbac_audit_summary,
    }


def main(argv=None):
    """CLI con argumentos opcionales (D-002 propagado: --token + --token-secret)."""
    import argparse
    import os
    parser = argparse.ArgumentParser(
        prog="bor4risk-cli",
        description="Clon Risk MAGERIT v3 - genera ROE firmables a partir de un perfil.",
    )
    parser.add_argument("perfil", help="Ruta al perfil JSON de entrada.")
    parser.add_argument(
        "--token",
        help="JWT HS256 emitido por BOR4SIGE auth.js (D-002). "
             "Si se omite, se intenta B4S_JWT del entorno.",
    )
    parser.add_argument(
        "--token-secret",
        help="Secreto HMAC para validar --token (o B4S_JWT_SECRET del entorno).",
    )
    parser.add_argument(
        "--snapshot-id",
        default="pilot-risk-2026-06-21",
        help="Identificador del snapshot de catalogos activos.",
    )
    parsed = parser.parse_args(argv if argv is not None else sys.argv[1:])

    # D-002: si --token se pasa por CLI, exponer al entorno para que
    # from_env() dentro de _run() lo recoja. Mantiene _run() sin cambios
    # de signatura (compat v0.x).
    if parsed.token:
        if not parsed.token_secret:
            print("Error: --token requiere --token-secret.", file=sys.stderr)
            return 3
        os.environ["B4S_JWT"] = parsed.token
        os.environ["B4S_JWT_SECRET"] = parsed.token_secret

    path = Path(parsed.perfil)
    if not path.exists():
        print(f"Fichero no encontrado: {path}", file=sys.stderr)
        return 2
    out = _run(path, snapshot_id=parsed.snapshot_id)
    print(json.dumps(out, indent=2, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
