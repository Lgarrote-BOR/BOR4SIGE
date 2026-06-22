# -*- coding: utf-8 -*-
"""tests/cantera/test_engine.py - tests del motor + renderer + RBAC."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).parent.parent.parent.resolve()
sys.path.insert(0, str(ROOT / "src"))

from bor4legal.engine.evaluator import Evaluador  # noqa: E402
from bor4legal.engine.oe_renderer import render_oes  # noqa: E402
from bor4legal.engine.reglas import REGLAS_CATALOGO  # noqa: E402
from bor4legal.security.rbac import (  # noqa: E402
    CapaScope, _viola_sod, PlataformaContexto, RolModulo, evaluar_capa_scope,
)


ANCHORS_COMPLETO = {
    "C-01": "ES", "C-02": ["UE", "ES"], "C-03": "C",
    "C-04": "2511", "C-05": "Fabricacion estructuras metalicas",
    "C-06": "privada_mercantil", "C-07": "pequena",
    "C-08": ["es"], "C-09": [], "C-10": ["FR", "DE"],
    "C-11": ["compresor-A"], "C-12": 12.0, "C-13": 4500.0,
    "C-14": 350.0, "C-15": "industrial_privado",
}


ANCHORS_BASE = {
    "C-01": "ES", "C-02": ["UE", "ES"], "C-04": "2511",
    "C-06": "privada_mercantil", "C-07": "pequena",
    "C-08": ["es"], "C-09": [], "C-10": ["FR", "DE"],
    "C-11": ["compresor-A"], "C-12": 12.0, "C-13": 4500.0,
    "C-15": "industrial_privado",
}


def test_evaluador_puro_determinista():
    a = Evaluador(snapshot_id="snap-A").evaluar(ANCHORS_COMPLETO)
    b = Evaluador(snapshot_id="snap-A").evaluar(ANCHORS_COMPLETO)
    ha = Evaluador.determinism_check(a, "snap-A")
    hb = Evaluador.determinism_check(b, "snap-A")
    assert ha == hb
    assert len(ha) == 64


def test_r_201_y_r_202_se_aplican():
    v = Evaluador().evaluar(ANCHORS_COMPLETO)
    assert "R-201" in v.hook_trace
    assert "R-202" in v.hook_trace


def test_render_oes_basico():
    v = Evaluador().evaluar(ANCHORS_COMPLETO)
    oes = render_oes(v, snapshot_id="snap-A")
    assert isinstance(oes, list)
    assert all(oe.rule_id.startswith("R-") for oe in oes)
    assert all(len(oe.oe_snapshot_hash) == 64 for oe in oes)


def test_reglas_catalogo_minimo_10():
    assert len(REGLAS_CATALOGO) >= 10


def test_rbac_deny_by_default():
    plataforma = PlataformaContexto(
        rol_plataforma="usuario", tenant_id="es", user_id="u1"
    )
    scope = CapaScope(
        rol_modulo=RolModulo.CLIENTE.value, accion="oe.firmar",
        recurso="oe-1", tenant_id="es",
    )
    res = evaluar_capa_scope(
        scope, plataforma=plataforma, roles_modulo=["X-NO-EXISTE"]
    )
    assert res.permit is False
    assert res.outcome == "DENY"


def test_rbac_propietario_global_permite_cualquier_tenant():
    plataforma = PlataformaContexto(
        rol_plataforma="Propietario de Plataforma", tenant_id="*",
        user_id="u-owner", is_platform_owner=True,
    )
    scope = CapaScope(
        rol_modulo=RolModulo.MANTENEDOR.value, accion="catalogo.publicar",
        recurso="lkp_normativa", tenant_id="de",
    )
    res = evaluar_capa_scope(
        scope, plataforma=plataforma, roles_modulo=[RolModulo.MANTENEDOR.value]
    )
    assert res.permit is True
    assert res.outcome == "ALLOW"


def test_oe_snapshot_hash_determinista():
    """Mismo V_F + mismo snapshot_id = mismo oe_snapshot_hash (§20.4.B)."""
    v1 = Evaluador(snapshot_id="snap-iso").evaluar(ANCHORS_BASE)
    v2 = Evaluador(snapshot_id="snap-iso").evaluar(ANCHORS_BASE)
    oes1 = render_oes(v1, snapshot_id="snap-iso")
    oes2 = render_oes(v2, snapshot_id="snap-iso")
    assert len(oes1) == len(oes2) > 0
    for a, b in zip(oes1, oes2):
        assert a.rule_id == b.rule_id
        assert a.oe_snapshot_hash == b.oe_snapshot_hash


def test_oe_snapshot_hash_cambia_con_snapshot_id():
    """snapshot_id diferente -> hash diferente (regresion)."""
    v = Evaluador(snapshot_id="snap-base").evaluar(ANCHORS_BASE)
    oes_a = render_oes(v, snapshot_id="snap-A")
    oes_b = render_oes(v, snapshot_id="snap-B")
    assert oes_a[0].oe_snapshot_hash != oes_b[0].oe_snapshot_hash


def test_oe_snapshot_hash_cambia_con_anchor():
    """Cambio cross-categoria en un anchor del V_F -> hash R-201 distinto (§20.4.B).
    C-12: 12.0 -> 60.0 fuerza PED categoria 'baja' -> 'alta'.
    """
    v_base = Evaluador(snapshot_id="snap").evaluar(ANCHORS_BASE)
    anchors_alt = dict(ANCHORS_BASE)
    anchors_alt["C-12"] = 60.0   # cruza umbral media->alta en PED RD 769/1999
    v_alt = Evaluador(snapshot_id="snap").evaluar(anchors_alt)
    oes_base = render_oes(v_base, snapshot_id="snap")
    oes_alt = render_oes(v_alt, snapshot_id="snap")
    # Encuentra la OE R-202 (presion) en ambas listas.
    base_r_202 = next(o for o in oes_base if o.rule_id == "R-202")
    alt_r_202 = next(o for o in oes_alt if o.rule_id == "R-202")
    assert base_r_202.oe_snapshot_hash != alt_r_202.oe_snapshot_hash
    assert base_r_202.oe_normal_text != alt_r_202.oe_normal_text


def test_sod_estricto_en_incompatibles():
    """R-MOD-4 + R-MOD-3 sobre oe.firmar -> DENY (§24.5)."""
    assert _viola_sod(["R-MOD-4", "R-MOD-3"]) is not None
    plataforma = PlataformaContexto(
        rol_plataforma="Superadministrador", tenant_id="es",
        user_id="u1", is_superadmin=True,
    )
    scope = CapaScope(
        rol_modulo=RolModulo.MANTENEDOR.value, accion="oe.firmar",
        recurso="oe-1", tenant_id="es",
    )
    res = evaluar_capa_scope(
        scope, plataforma=plataforma, roles_modulo=["R-MOD-4", "R-MOD-3"]
    )
    assert res.permit is False
    assert res.outcome == "DENY"


def test_sod_oe_replay_coexistencia_permitida():
    """R-MOD-4 + R-MOD-3 sobre oe.replay -> ALLOW (lectura historica, no auto-cert)."""
    plataforma = PlataformaContexto(
        rol_plataforma="Superadministrador", tenant_id="es",
        user_id="u1", is_superadmin=True,
    )
    scope = CapaScope(
        rol_modulo=RolModulo.MANTENEDOR.value, accion="oe.replay",
        recurso="oe-1", tenant_id="es",
    )
    res = evaluar_capa_scope(
        scope, plataforma=plataforma, roles_modulo=["R-MOD-4", "R-MOD-3"]
    )
    assert res.outcome in ("ALLOW", "ALLOW_AND_LOG")


def test_sod_bitacora_leer_NO_exento():
    """bitacora.leer NO esta en _SOD_EXENTAS tras fix A: M+R -> DENY."""
    plataforma = PlataformaContexto(
        rol_plataforma="Superadministrador", tenant_id="es",
        user_id="u1", is_superadmin=True,
    )
    scope = CapaScope(
        rol_modulo=RolModulo.MANTENEDOR.value, accion="bitacora.leer",
        recurso="bitacora-1", tenant_id="es",
    )
    res = evaluar_capa_scope(
        scope, plataforma=plataforma, roles_modulo=["R-MOD-4", "R-MOD-3"]
    )
    assert res.permit is False
    assert res.outcome == "DENY"


# --- D12 (C-HASH-TEMPLATE): hash desacoplado del texto, anclado a template_id ---


def test_oe_lleva_template_id_used_poblado_en_todas_las_oes():
    """D12 §5.2/§5.4: TODAS las OEs fired llevan template_id_used (no cadena vacia).
    El conteo exacto depende del perfil (algunas reglas requieren anchors
    concretos para fire); aqui validamos la SANIDAD sobre las fired."""
    v = Evaluador().evaluar(ANCHORS_COMPLETO)
    oes = render_oes(v, snapshot_id="snap-D12-full")
    assert len(oes) >= 1, "Perfil completo deberia disparar al menos 1 regla"
    for o in oes:
        assert o.template_id_used, f"{o.rule_id} sin template_id_used"
        assert o.template_id_used.startswith("tpl-")
        assert "-v" in o.template_id_used, (
            f"{o.rule_id} template_id sin version: {o.template_id_used}"
        )


def test_redactar_oe_loggea_warning_si_router_desincronizado(caplog):
    """D12 §5.5 / S1: si rid fired pero NO esta en _REGLAS_TPL_VERSION,
    se loggea WARNING y la OE se descarta (antes: fallo silencioso)."""
    import logging
    from bor4legal.engine import oe_renderer as rmod
    snapshot_id = "snap-D12-desync"
    v = Evaluador(snapshot_id=snapshot_id).evaluar(ANCHORS_BASE)
    # R-101 fired en ANCHORS_BASE (tamano "pequena" -> aplica R-101).
    # Forzamos desincronizacion: lo quitamos del router temporalmente.
    original_route = rmod._REGLAS_TPL_VERSION.pop("R-101", None)
    try:
        assert original_route is not None, "Test mal planteado: R-101 deberia estar en router"
        with caplog.at_level(logging.WARNING, logger="bor4legal.engine.oe_renderer"):
            oes = render_oes(v, snapshot_id=snapshot_id)
        # R-101 debe haberse descartado de los OEs resultantes.
        assert not any(o.rule_id == "R-101" for o in oes), (
            "R-101 deberia haberse descartado por desincronizacion del router"
        )
        # El logger del modulo debe haber emitido un WARNING que mencione R-101.
        warnings = [r for r in caplog.records if r.levelno >= logging.WARNING]
        assert any("R-101" in r.getMessage() for r in warnings), (
            "Esperado WARNING del logger mencionando R-101; "
            f"caplog emitido: {[r.getMessage() for r in warnings]}"
        )
    finally:
        if original_route is not None:
            rmod._REGLAS_TPL_VERSION["R-101"] = original_route


# --- D12 SR2: validador de consistencia router vs catalogo --


def test_validate_tpl_router_detecta_tpl_huerfana_emite_warning(caplog):
    """D12 SR2: una tpl_id en OE_PLANTILLAS sin router activo
    debe emitir WARNING al invocar _validate_tpl_router_consistency()."""
    import logging
    from bor4legal.engine import oe_renderer as rmod
    orphan_added = "tpl-T-ORPHAN-v1"
    rmod.OE_PLANTILLAS[orphan_added] = {
        "oe_cita_externa": "https://example.com/test-orphan",
        "oe_normal_text": "tpl huerfana de test",
    }
    try:
        with caplog.at_level(logging.WARNING, logger="bor4legal.engine.oe_renderer"):
            rmod._validate_tpl_router_consistency()
        warnings = [r.getMessage() for r in caplog.records if r.levelno >= logging.WARNING]
        assert any(orphan_added in m for m in warnings), (
            "Esperado WARNING mencionando " + orphan_added +
            "; emitido por el logger: " + "; ".join(warnings)
        )
    finally:
        del rmod.OE_PLANTILLAS[orphan_added]


def test_validate_tpl_router_detecta_router_huerfano_emite_warning(caplog):
    """D12 SR2: un router activo apuntando a tpl_id sin entrada en
    OE_PLANTILLAS debe emitir WARNING al invocar el validador."""
    import logging
    from bor4legal.engine import oe_renderer as rmod
    fake_tpl = "tpl-T-NONEXISTENT-v9"
    rmod._REGLAS_TPL_VERSION["R-302"] = fake_tpl
    try:
        with caplog.at_level(logging.WARNING, logger="bor4legal.engine.oe_renderer"):
            rmod._validate_tpl_router_consistency()
        warnings = [r.getMessage() for r in caplog.records if r.levelno >= logging.WARNING]
        assert any(fake_tpl in m for m in warnings), (
            "Esperado WARNING mencionando " + fake_tpl +
            "; emitido por el logger: " + "; ".join(warnings)
        )
    finally:
        rmod._REGLAS_TPL_VERSION["R-302"] = "tpl-R-302-v1"


# --- F3/S10: tests de frontera PED, RIPCI y UE 2003/361 ---


def test_categorizer_presion_ped_frontera_justo_en_limites():
    """F3/S10: categorizador PED RD 769/1999 en sus limites exactos.

    Tabla de decision (operador < estricto):
        < 0.5  -> 'no_categorizable'
        < 10   -> 'baja'      (>= 0.5 y < 10)
        < 50   -> 'media'     (>= 10 y < 50)
        >= 50  -> 'alta'
    """
    from bor4legal.domain.profile.converter import categorize_presion_ped_rd_769_1999
    assert categorize_presion_ped_rd_769_1999(0.49) == "no_categorizable"
    assert categorize_presion_ped_rd_769_1999(0.5)  == "baja"
    assert categorize_presion_ped_rd_769_1999(9.99) == "baja"
    assert categorize_presion_ped_rd_769_1999(10.0) == "media"
    assert categorize_presion_ped_rd_769_1999(49.99) == "media"
    assert categorize_presion_ped_rd_769_1999(50.0) == "alta"


def test_categorizer_carga_termica_ripci_frontera_justo_en_limites():
    """F3/S10: categorizador RIPCI RD 513/2017 en sus limites exactos.

    Tabla de decision (operador < estricto):
        < 3500     -> 'baja'
        < 20000    -> 'media'    (>= 3500 y < 20000)
        < 100000   -> 'alta'     (>= 20000 y < 100000)
        >= 100000  -> 'muy_alta'
    """
    from bor4legal.domain.profile.converter import (
        categorize_carga_termica_ripci_rd_513_2017,
    )
    assert categorize_carga_termica_ripci_rd_513_2017(3499.0) == "baja"
    assert categorize_carga_termica_ripci_rd_513_2017(3500.0) == "media"
    assert categorize_carga_termica_ripci_rd_513_2017(19999.0) == "media"
    assert categorize_carga_termica_ripci_rd_513_2017(20000.0) == "alta"
    assert categorize_carga_termica_ripci_rd_513_2017(99999.0) == "alta"
    assert categorize_carga_termica_ripci_rd_513_2017(100000.0) == "muy_alta"


def test_categorizer_tamano_ue2003_361_frontera_justo_en_limites():
    """F3/S10: categorizador UE 2003/361 en sus limites exactos.

    Tabla de decision (operadores < y <=):
        < 10 + fact <= 2M  -> 'micro'
        < 50 + fact <= 10M -> 'pequena'
        < 250 + fact <= 50M -> 'mediana'
        resto               -> 'grande'
    """
    from bor4legal.domain.profile.converter import categorize_tamano_ue2003_361
    # Micro -> Pequena: 10 empleados rompe < 10 pero entra en < 50 con fact<=10M.
    assert categorize_tamano_ue2003_361(9,  2_000_000, None) == "micro"
    assert categorize_tamano_ue2003_361(10, 2_000_000, None) == "pequena"
    # Pequena -> Mediana: 50 empleados rompe < 50 pero sigue < 250 con fact<=50M.
    assert categorize_tamano_ue2003_361(49, 10_000_000, None) == "pequena"
    assert categorize_tamano_ue2003_361(50, 10_000_000, None) == "mediana"
    # Mediana -> Grande: 250 empleados rompe < 250.
    assert categorize_tamano_ue2003_361(249, 50_000_000, None) == "mediana"
    assert categorize_tamano_ue2003_361(250, 50_000_000, None) == "grande"


def test_oe_snapshot_hash_inmune_a_typo_en_texto(monkeypatch):
    """D12 §5.2: cambiar el texto del template NO altera el hash
    (el payload usa template_id, no el dict literal de la plantilla)."""
    from bor4legal.engine import oe_renderer as rmod
    original = rmod.OE_PLANTILLAS["tpl-R-101-v1"]["oe_normal_text"]
    # 1) Evaluacion con texto "sucio" inyectado.
    monkeypatch.setitem(
        rmod.OE_PLANTILLAS["tpl-R-101-v1"], "oe_normal_text",
        original + " [TEXTO_INJECTADO_PARA_TEST_D12]"
    )
    v_typo = Evaluador(snapshot_id="snap-D12-typo").evaluar(ANCHORS_BASE)
    h_typo = next(
        o.oe_snapshot_hash for o in render_oes(v_typo, snapshot_id="snap-D12-typo")
        if o.rule_id == "R-101"
    )
    # 2) Evaluacion con texto original (monkeypatch reversa mid-test).
    monkeypatch.setitem(
        rmod.OE_PLANTILLAS["tpl-R-101-v1"], "oe_normal_text", original
    )
    v_orig = Evaluador(snapshot_id="snap-D12-typo").evaluar(ANCHORS_BASE)
    h_orig = next(
        o.oe_snapshot_hash for o in render_oes(v_orig, snapshot_id="snap-D12-typo")
        if o.rule_id == "R-101"
    )
    assert h_typo == h_orig, (
        "D12: el hash debe ser inmune al texto porque incluye template_id, "
        "no el dict literal de la plantilla."
    )


def test_oe_snapshot_hash_cambia_con_bump_de_template_id():
    """D12 §5.2: bump de template_id (v1 -> v2) SI cambia el hash,
    manteniendo la entrada v1 archivada para reproduccion historica."""
    from bor4legal.engine import oe_renderer as rmod
    snapshot_id = "snap-D12-bump"
    v = Evaluador(snapshot_id=snapshot_id).evaluar(ANCHORS_BASE)
    h_v1 = next(
        o.oe_snapshot_hash for o in render_oes(v, snapshot_id=snapshot_id)
        if o.rule_id == "R-101"
    )
    tpl_id_v1 = next(
        o.template_id_used for o in render_oes(v, snapshot_id=snapshot_id)
        if o.rule_id == "R-101"
    )
    assert tpl_id_v1 == "tpl-R-101-v1"

    # Simula bump: NO tocar v1 (seguira archivada), crear v2, cambiar router.
    archived_text_v1 = rmod.OE_PLANTILLAS["tpl-R-101-v1"]["oe_normal_text"]
    original_route = rmod._REGLAS_TPL_VERSION["R-101"]
    rmod.OE_PLANTILLAS["tpl-R-101-v2"] = {
        "oe_cita_externa": "https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32003R0361",
        "oe_normal_text": archived_text_v1 + " [redaccion mejorada v2]",
    }
    rmod._REGLAS_TPL_VERSION["R-101"] = "tpl-R-101-v2"
    try:
        h_v2 = next(
            o.oe_snapshot_hash for o in render_oes(v, snapshot_id=snapshot_id)
            if o.rule_id == "R-101"
        )
        tpl_id_v2 = next(
            o.template_id_used for o in render_oes(v, snapshot_id=snapshot_id)
            if o.rule_id == "R-101"
        )
    finally:
        rmod._REGLAS_TPL_VERSION["R-101"] = original_route
        del rmod.OE_PLANTILLAS["tpl-R-101-v2"]

    assert tpl_id_v2 == "tpl-R-101-v2"
    assert h_v1 != h_v2, "D12: bump de template_id debe cambiar el hash de forma predecible"


def test_reproduccion_bit_a_bit_con_template_archivo():
    """D12 §5.4: dado un OE firmada, su template_id_used permite
    recuperar el texto literal archivado (fuente autoritativa)."""
    from bor4legal.engine import oe_renderer as rmod
    v = Evaluador(snapshot_id="snap-D12-rp").evaluar(ANCHORS_BASE)
    r101 = next(
        o for o in render_oes(v, snapshot_id="snap-D12-rp")
        if o.rule_id == "R-101"
    )
    archived = rmod.OE_PLANTILLAS[r101.template_id_used]
    assert archived["oe_cita_externa"] == r101.oe_cita_externa
    # Re-render con los mismos parametros produce la misma OE bit-a-bit.
    v2 = Evaluador(snapshot_id="snap-D12-rp").evaluar(ANCHORS_BASE)
    r101b = next(
        o for o in render_oes(v2, snapshot_id="snap-D12-rp")
        if o.rule_id == "R-101"
    )
    assert r101.oe_snapshot_hash == r101b.oe_snapshot_hash
    assert r101.oe_normal_text == r101b.oe_normal_text
