# -*- coding: utf-8 -*-
"""
cli
===
Entry point CLI: `python -m bor4legal.cli <perfil.json>`.

Flujo: Conversor (§18) -> Evaluador (§19) -> Renderer OE (§20) -> RBAC (§24).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict


def _flatten_anchors(anchors: Dict[str, Any]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for k, v in anchors.items():
        if isinstance(v, dict):
            out[k] = v.get("value")
        else:
            out[k] = v
    return out


def _run(path: Path, *, snapshot_id: str = "pilot-2026-06-21") -> Dict[str, Any]:
    from bor4legal.domain.profile.converter import ProfileConverter
    from bor4legal.engine.evaluator import Evaluador
    from bor4legal.engine.oe_renderer import render_oes
    from bor4legal.security.rbac import (
        CapaScope, PlataformaContexto, RolModulo, evaluar_capa_scope,
    )

    raw = json.loads(path.read_text(encoding="utf-8"))
    conv = ProfileConverter()
    res = conv.convert(raw)

    anchors_flat = _flatten_anchors(res.anchor_bundle.anchors)
    ev = Evaluador(snapshot_id=snapshot_id)
    v_f = ev.evaluar(anchors_flat)
    oes = [oe.to_dict() for oe in render_oes(v_f, snapshot_id=snapshot_id, idioma="es")]

    # D-002 (integra): hidratar PlataformaContexto desde JWT real si
    # B4S_JWT y B4S_JWT_SECRET estan en el entorno del subshell; si no,
    # cae al placeholder del piloto (modo standalone, no requiere gateway).
    from bor4legal.security.integration import from_env as _from_env
    plataforma = _from_env(placeholder_tenant="es", placeholder_user="demo-user")
    alcance_oe = evaluar_capa_scope(
        CapaScope(
            rol_modulo=RolModulo.CLIENTE.value, accion="oe.firmar",
            recurso="*", tenant_id="es", snapshot_id=snapshot_id,
        ),
        plataforma=plataforma,
        roles_modulo=[RolModulo.CLIENTE.value],
    )
    rbac_audit, rbac_audit_summary = _build_rbac_audit(plataforma, snapshot_id)

    return {
        "version_piloto": "0.3.0",
        "snapshot_id": snapshot_id,
        "perfil_input_keys": sorted(list(raw.keys())),
        "anchor_bundle": res.anchor_bundle.to_dict(),
        "v_f": v_f.to_dict(),
        "snapshot_hash_v_f": Evaluador.determinism_check(v_f, snapshot_id),
        "oes": oes,
        "rechazos": {
            "count": res.reject_count,
            "registros": [r.to_dict() for r in res.anchor_bundle.rejects],
        },
        "rbac_check_ejemplo": {
            "scope": "oe.firmar",
            "permit": alcance_oe.permit,
            "outcome": alcance_oe.outcome,
            "reasons": alcance_oe.reasons,
        },
        # D11 (cierre v0.2): rbac_audit[] + rbac_audit_summary como campos
        # hermanos (no embutido). Cada escenario declara expected y el run
        # verifica que el outcome real coincida. Asi, un cambio en CAPACIDADES
        # o en SoD que rompa el contrato se detecta en CI sin necesidad de
        # mantener 5 tests a mano. El summary como campo hermano reduce la
        # ambiguedad estructural sobre donde esta la metadata agregada.
        "rbac_audit": rbac_audit,
        "rbac_audit_summary": rbac_audit_summary,
    }


def _build_rbac_audit(plataforma: Any, snapshot_id: str) -> tuple:
    """Construye el audit RBAC y retorna tupla `(audit_array, summary_dict)`
    (D11). El motivo del tuple-return es exponer ambos como campos hermanos
    en el JSON de salida de `_run()` (no embutido), evitando el patron fragil
    `next((x for x in audit if "summary" in x), None)`.

    Escenarios cubiertos:
      1. Cliente firmando su OE (capacidad propia) -> ALLOW.
      2. Revisor intentando publicar catalogo (sin capacidad) -> DENY.
      3. Mantenedor + Revisor firmando OE (SoD estricto) -> DENY.
      4. Mantenedor publicando catalogo (capacidad propia) -> ALLOW.
      5. Cliente leyendo bitacora (no asignado) -> DENY.
    """
    from bor4legal.security.rbac import (
        CapaScope, RolModulo, evaluar_capa_scope,
    )
    audit_scenarios = [
        {"desc": "Cliente firmando su OE (capacidad propia)",
         "acc": "oe.firmar", "rol": RolModulo.CLIENTE.value,
         "roles_modulo": [RolModulo.CLIENTE.value], "expected": "ALLOW"},
        {"desc": "Revisor intentando publicar catalogo (sin capacidad)",
         "acc": "catalogo.publicar", "rol": RolModulo.REVISOR.value,
         "roles_modulo": [RolModulo.REVISOR.value], "expected": "DENY"},
        {"desc": "Mantenedor + Revisor firmando OE (SoD estricto)",
         "acc": "oe.firmar", "rol": RolModulo.MANTENEDOR.value,
         "roles_modulo": [RolModulo.MANTENEDOR.value, RolModulo.REVISOR.value],
         "expected": "DENY"},
        {"desc": "Mantenedor publicando catalogo (capacidad propia)",
         "acc": "catalogo.publicar", "rol": RolModulo.MANTENEDOR.value,
         "roles_modulo": [RolModulo.MANTENEDOR.value], "expected": "ALLOW"},
        {"desc": "Cliente intentando dictaminar OE (sin capacidad)",
         "acc": "oe.dictaminar", "rol": RolModulo.CLIENTE.value,
         "roles_modulo": [RolModulo.CLIENTE.value], "expected": "DENY"},
    ]
    audit = []
    for sce in audit_scenarios:
        scope_x = CapaScope(
            rol_modulo=sce["rol"], accion=sce["acc"], recurso="audit-x",
            tenant_id="es", snapshot_id=snapshot_id,
        )
        res_x = evaluar_capa_scope(
            scope_x, plataforma=plataforma, roles_modulo=sce["roles_modulo"],
        )
        rol_modulo_companion = [
            r for r in sce["roles_modulo"] if r != sce["rol"]
        ] or None
        audit.append({
            "scenario": sce["desc"],
            "accion": sce["acc"],
            "rol_modulo": sce["rol"],
            "rol_modulo_companion": rol_modulo_companion,
            "expected": sce["expected"],
            "actual_outcome": res_x.outcome,
            "permit": res_x.permit,
            "reasons": res_x.reasons,
            "matches_expected": res_x.outcome == sce["expected"],
        })
    summary = {
        "total": len(audit),
        "allow_count": sum(1 for x in audit if x["permit"]),
        "deny_count": sum(1 for x in audit if not x["permit"]),
        "all_match_expected": all(x["matches_expected"] for x in audit),
    }
    return audit, summary


def main(argv: Any = None) -> int:
    """CLI con argumentos opcionales (D-002: --token + --token-secret)."""
    import argparse
    import os
    parser = argparse.ArgumentParser(
        prog="bor4legal-cli",
        description="Piloto Legal BOR4SIGE - genera OE firmables a partir de un perfil.",
    )
    parser.add_argument("perfil", help="Ruta al perfil JSON de entrada.")
    parser.add_argument(
        "--token",
        help="JWT HS256 emitido por BOR4SIGE auth.js (D-002). "
             "Si se omite, se intenta B4S_JWT del entorno.",
    )
    parser.add_argument(
        "--token-secret",
        help="Secreto HMAC para validar --token "
             "(o B4S_JWT_SECRET del entorno).",
    )
    parser.add_argument(
        "--snapshot-id",
        default="pilot-2026-06-21",
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
