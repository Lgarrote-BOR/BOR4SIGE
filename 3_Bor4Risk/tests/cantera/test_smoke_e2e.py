import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent.resolve()
sys.path.insert(0, str(ROOT / "src"))

from bor4risk.engine.evaluator import Evaluador
from bor4risk.engine.oe_renderer import render_roes
from bor4risk.security.rbac import (
    CapaScope, PlataformaContexto, RolModulo,
    evaluar_capa_scope,
)


PERFIL_RISK = {
    "R-00": "BOR4D_DEMO_RISK",
    "R-01": [
        {"id": "A1", "tipo": "informacion", "valor": 9},
        {"id": "A2", "tipo": "servicios", "valor": 5},
    ],
    "R-02": [
        {"id": "T1", "activo_id": "A1", "tipo": "ataque", "I": 8, "D": 10},
        {"id": "T2", "activo_id": "A2", "tipo": "deficiencia", "I": 5, "D": 5},
    ],
    "R-03": [
        {"id": "S1", "amenaza_id": "T1", "tipo": "detectiva", "cobertura": 0.2},
    ],
    "R-04": 30,
    "R-05": "fabricacion_diseno",
}


def test_risk_smoke_e2e_pipeline_runs_ok():
    v_f = Evaluador(snapshot_id="snap-risk").evaluar(PERFIL_RISK)
    assert v_f.hook_trace, "Risk motor sin reglas fired"
    assert sorted(v_f.hook_trace) == sorted(["R-101", "R-201", "R-301", "R-401"]), f"Esperaba las 4 reglas fired; actual={v_f.hook_trace}"
    roes = render_roes(v_f, snapshot_id="snap-risk")
    assert roes, "Risk renderer sin ROEs"
    for roe in roes:
        assert len(roe.roe_snapshot_hash) == 64
        assert roe.template_id_used, f"ROE sin template_id_used: {roe.rule_id}"
        assert roe.template_id_used.startswith("tpl-R-")


def test_risk_rbac_audit_cubre_allow_y_deny():
    plataforma = PlataformaContexto(rol_plataforma="usuario", tenant_id="es", user_id="demo")
    audit_scenarios = [
        ("oe.firmar", RolModulo.CLIENTE.value, [RolModulo.CLIENTE.value], "ALLOW"),
        ("catalogo.publicar", RolModulo.REVISOR.value, [RolModulo.REVISOR.value], "DENY"),
        ("oe.firmar", RolModulo.MANTENEDOR.value, [RolModulo.MANTENEDOR.value, RolModulo.REVISOR.value], "DENY"),
        ("gestion_activos", RolModulo.MANTENEDOR.value, [RolModulo.MANTENEDOR.value], "ALLOW"),
        ("evaluar_amenazas", RolModulo.CLIENTE.value, [RolModulo.CLIENTE.value], "DENY"),
    ]
    for acc, rol, roles_modulo, expected in audit_scenarios:
        scope = CapaScope(rol_modulo=rol, accion=acc, recurso="*", tenant_id="es", snapshot_id="snap-risk")
        res = evaluar_capa_scope(scope, plataforma=plataforma, roles_modulo=roles_modulo)
        assert res.outcome == expected, f"Risk RBAC fail: {acc} rol={rol} esperaba {expected}, actual {res.outcome}"


def test_risk_roe_snapshot_hash_inmune_a_typo(monkeypatch):
    from bor4risk.engine import oe_renderer as rmod
    original = rmod.ROE_PLANTILLAS["tpl-R-101-v1"]["roe_normal_text"]
    monkeypatch.setitem(rmod.ROE_PLANTILLAS["tpl-R-101-v1"], "roe_normal_text", original + " [TYPO_INJECTED]")
    v1 = Evaluador(snapshot_id="snap-d12").evaluar(PERFIL_RISK)
    h_dirty = next(o.roe_snapshot_hash for o in render_roes(v1, snapshot_id="snap-d12") if o.rule_id == "R-101")
    monkeypatch.setitem(rmod.ROE_PLANTILLAS["tpl-R-101-v1"], "roe_normal_text", original)
    v2 = Evaluador(snapshot_id="snap-d12").evaluar(PERFIL_RISK)
    h_clean = next(o.roe_snapshot_hash for o in render_roes(v2, snapshot_id="snap-d12") if o.rule_id == "R-101")
    assert h_dirty == h_clean, "Risk clone D12: hash debe ser inmune al texto del template"


def test_risk_validate_tpl_router_detecta_huerfanas(caplog):
    import logging
    from bor4risk.engine import oe_renderer as rmod
    orphan = "tpl-R-ORPHAN-v1"
    rmod.ROE_PLANTILLAS[orphan] = {"roe_cita_externa": "https://example.com/test", "roe_normal_text": "tpl huerfana de test"}
    try:
        with caplog.at_level(logging.WARNING, logger="bor4risk.engine.oe_renderer"):
            rmod._validate_tpl_router_consistency()
        warnings = [r.getMessage() for r in caplog.records if r.levelno >= logging.WARNING]
        assert any(orphan in m for m in warnings), f"Esperado WARNING sobre {orphan}; emitido: {'; '.join(warnings)}"
    finally:
        del rmod.ROE_PLANTILLAS[orphan]
