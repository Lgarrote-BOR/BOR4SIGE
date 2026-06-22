import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent.resolve()
sys.path.insert(0, str(ROOT / "src"))

from bor4quality.engine.evaluator import Evaluador
from bor4quality.engine.oe_renderer import render_oes
from bor4quality.security.rbac import (
    CapaScope, PlataformaContexto, RolModulo,
    _viola_sod, evaluar_capa_scope,
)


PERFIL_QUALITY = {
    "Q-01": "BOR4D_DEMO", "Q-02": ["ISO 9001:2015"], "Q-04": "2511",
    "Q-07": "pequena", "Q-11": 3, "Q-14": "es", "Q-15": "formal",
}


def test_quality_smoke_e2e_pipeline_runs_ok():
    v_f = Evaluador(snapshot_id="snap-quality").evaluar(PERFIL_QUALITY)
    assert v_f.hook_trace, "Quality motor sin reglas fired"
    oes = render_oes(v_f, snapshot_id="snap-quality")
    assert oes, "Quality renderer sin OEs"
    for oe in oes:
        assert len(oe.oe_snapshot_hash) == 64
        assert oe.template_id_used, "QOE sin template_id_used: " + oe.rule_id
        assert oe.template_id_used.startswith("tpl-Q-")


def test_quality_rbac_audit_cubre_allow_y_deny():
    plataforma = PlataformaContexto(rol_plataforma="usuario", tenant_id="es", user_id="demo")
    audit_scenarios = [
        ("oe.firmar", RolModulo.CLIENTE.value, [RolModulo.CLIENTE.value], "ALLOW"),
        ("catalogo.publicar", RolModulo.REVISOR.value, [RolModulo.REVISOR.value], "DENY"),
        ("oe.firmar", RolModulo.MANTENEDOR.value, [RolModulo.MANTENEDOR.value, RolModulo.REVISOR.value], "DENY"),
        ("catalogo.publicar", RolModulo.MANTENEDOR.value, [RolModulo.MANTENEDOR.value], "ALLOW"),
        ("oe.dictaminar", RolModulo.CLIENTE.value, [RolModulo.CLIENTE.value], "DENY"),
    ]
    for acc, rol, roles_modulo, expected in audit_scenarios:
        scope = CapaScope(rol_modulo=rol, accion=acc, recurso="*", tenant_id="es", snapshot_id="snap-quality")
        res = evaluar_capa_scope(scope, plataforma=plataforma, roles_modulo=roles_modulo)
        assert res.outcome == expected, "Quality RBAC fail: " + acc + " rol=" + rol + " esperaba " + expected + ", actual " + res.outcome


def test_quality_oe_snapshot_hash_inmune_a_typo(monkeypatch):
    from bor4quality.engine import oe_renderer as rmod
    original = rmod.QOE_PLANTILLAS["tpl-Q-101-v1"]["oe_normal_text"]
    monkeypatch.setitem(rmod.QOE_PLANTILLAS["tpl-Q-101-v1"], "oe_normal_text", original + " [TYPO_INJECTED]")
    v1 = Evaluador(snapshot_id="snap-d12").evaluar(PERFIL_QUALITY)
    h_dirty = next(o.oe_snapshot_hash for o in render_oes(v1, snapshot_id="snap-d12") if o.rule_id == "Q-101")
    monkeypatch.setitem(rmod.QOE_PLANTILLAS["tpl-Q-101-v1"], "oe_normal_text", original)
    v2 = Evaluador(snapshot_id="snap-d12").evaluar(PERFIL_QUALITY)
    h_clean = next(o.oe_snapshot_hash for o in render_oes(v2, snapshot_id="snap-d12") if o.rule_id == "Q-101")
    assert h_dirty == h_clean, "Quality clone D12: hash debe ser inmune al texto del template"


def test_quality_validate_tpl_router_detecta_huerfanas(caplog):
    import logging
    from bor4quality.engine import oe_renderer as rmod
    orphan = "tpl-Q-ORPHAN-v1"
    rmod.QOE_PLANTILLAS[orphan] = {"oe_cita_externa": "https://example.com/test", "oe_normal_text": "tpl huerfana de test"}
    try:
        with caplog.at_level(logging.WARNING, logger="bor4quality.engine.oe_renderer"):
            rmod._validate_tpl_router_consistency()
        warnings = [r.getMessage() for r in caplog.records if r.levelno >= logging.WARNING]
        assert any(orphan in m for m in warnings), "Esperado WARNING sobre " + orphan + "; emitido: " + "; ".join(warnings)
    finally:
        del rmod.QOE_PLANTILLAS[orphan]
