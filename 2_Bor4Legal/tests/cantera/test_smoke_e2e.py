# -*- coding: utf-8 -*-
"""tests/cantera/test_smoke_e2e.py - validacion end-to-end del piloto."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent.resolve()
sys.path.insert(0, str(ROOT / "src"))

from bor4legal.domain.profile.converter import EXAMPLE_RAW_INPUT, ProfileConverter
from bor4legal.engine.evaluator import Evaluador
from bor4legal.engine.oe_renderer import render_oes
from bor4legal.security.rbac import (
    CapaScope, PlataformaContexto, RolModulo,
    _viola_sod, evaluar_capa_scope,
)


def test_e2e_pipeline_runs_ok():
    # 1) Conversor (validator de entrada).
    res = ProfileConverter().convert(EXAMPLE_RAW_INPUT).to_dict()
    assert res["anchor_bundle"]["snapshot_hash"]
    assert res["accepted_count"] == 15

    # 2) Motor puro.
    flat = {
        k: (v.get("value") if isinstance(v, dict) else v)
        for k, v in res["anchor_bundle"]["anchors"].items()
        if v is not None
    }
    v = Evaluador(snapshot_id="pilot").evaluar(flat)
    assert v.hook_trace, "motor no ha disparado ninguna regla"

    # 3) Renderer OE.
    oes = render_oes(v, snapshot_id="pilot")
    assert oes, "renderer no ha producido ninguna OE"
    assert all(len(oe.oe_snapshot_hash) == 64 for oe in oes)

    # 4) RBAC: Propietario de Plataforma global -> ALLOW.
    plataforma = PlataformaContexto(
        rol_plataforma="Propietario de Plataforma",
        tenant_id="*", user_id="owner", is_platform_owner=True,
    )
    scope = CapaScope(
        rol_modulo=RolModulo.MANTENEDOR.value,
        accion="catalogo.publicar",
        recurso="lkp_normativa", tenant_id="de",
    )
    r = evaluar_capa_scope(
        scope, plataforma=plataforma, roles_modulo=["R-MOD-4"]
    )
    assert r.permit is True and r.outcome == "ALLOW"

    # 5) SoD estricto (fix A aplicado): Mantenedor + Revisor + oe.firmar -> DENY.
    assert _viola_sod(["R-MOD-4", "R-MOD-3"], accion="oe.firmar") is not None
    plataforma2 = PlataformaContexto(
        rol_plataforma="Superadministrador",
        tenant_id="es", user_id="u1", is_superadmin=True,
    )
    scope2 = CapaScope(
        rol_modulo=RolModulo.MANTENEDOR.value,
        accion="oe.firmar", recurso="oe-1", tenant_id="es",
    )
    r2 = evaluar_capa_scope(
        scope2, plataforma=plataforma2, roles_modulo=["R-MOD-4", "R-MOD-3"]
    )
    assert r2.permit is False and r2.outcome == "DENY"

    # 6) SoD exenta (fix B): oe.replay -> coexistencia permitida (ALLOW).
    scope3 = CapaScope(
        rol_modulo=RolModulo.MANTENEDOR.value,
        accion="oe.replay", recurso="oe-1", tenant_id="es",
    )
    r3 = evaluar_capa_scope(
        scope3, plataforma=plataforma2, roles_modulo=["R-MOD-4", "R-MOD-3"]
    )
    assert r3.outcome in ("ALLOW", "ALLOW_AND_LOG")


def test_d11_rbac_audit_profile_cubre_allow_y_deny(tmp_path):
    """D11 (cierre v0.2): el CLI emite rbac_audit[] + rbac_audit_summary como
    campos hermanos con al menos un escenario ALLOW y un DENY, todos
    reproducibles y matching expected.

    Asi un cambio futuro en CAPACIDADES o en la matriz SoD que rompa el
    contrato se detecta en CI sin necesidad de mantener 5 tests a mano.
    El summary como campo hermano (no embutido dentro del array) reduce la
    ambiguedad estructural del output.
    """
    import json
    from bor4legal.cli import _run

    perfil = tmp_path / "perfil_min.json"
    perfil.write_text(json.dumps({
        "C-01": {"present": True, "value": "ES"},
        "C-02": {"present": True, "value": ["UE", "ES"]},
        "C-04": {"present": True, "value": "2511"},
        "C-07": {"present": True, "value": "pequena"},
        "C-08": {"present": True, "value": ["es"]},
        "C-12": {"present": True, "value": 12.0},
    }))
    out = _run(perfil)
    assert "rbac_audit" in out and "rbac_audit_summary" in out, (
        "D11: el output del CLI debe incluir rbac_audit[] y rbac_audit_summary{}"
    )
    assert isinstance(out["rbac_audit"], list), "D11: rbac_audit debe ser lista"
    assert isinstance(out["rbac_audit_summary"], dict), (
        "D11: rbac_audit_summary debe ser dict (hermano)"
    )
    scenarios = out["rbac_audit"]
    assert len(scenarios) >= 4, "D11: al menos 4 escenarios; hay " + str(len(scenarios))
    allow = [x for x in scenarios if x["permit"]]
    deny  = [x for x in scenarios if not x["permit"]]
    assert allow, "D11: ningun ALLOW en rbac_audit"
    assert deny, "D11: ningun DENY en rbac_audit"
    summary = out["rbac_audit_summary"]
    assert summary["total"] == len(scenarios)
    assert summary["allow_count"] == len(allow)
    assert summary["deny_count"] == len(deny)
    bad = [x for x in scenarios if not x["matches_expected"]]
    assert not bad, (
        "D11: escenarios que no matchean expected: " + str(
            [{"scenario": x["scenario"], "expected": x["expected"],
              "actual": x["actual_outcome"]} for x in bad]
        )
    )
