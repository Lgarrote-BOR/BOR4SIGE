# -*- coding: utf-8 -*-
"""tests/cantera/test_converter.py - tests del Conversor de Perfil (sección 18)."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).parent.parent.parent.resolve()
sys.path.insert(0, str(ROOT / "src"))

from bor4legal.domain.profile.converter import (  # noqa: E402
    ANCHOR_IDS, BLACKLIST_KEYS, ProfileConverter,
    categorize_carga_termica_ripci_rd_513_2017,
)


WE_PYME_SAGUNTO = {
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
}


def _flatten(anchors):
    """Aplanar `{present,value}` -> raw values para el motor (§19)."""
    return {
        k: (v.get("value") if isinstance(v, dict) else v)
        for k, v in anchors.items()
    }


# ---------------------------------------------------------------------------
# Conversor (§18) - shape, determinismo, privacidad, blacklist
# ---------------------------------------------------------------------------

def test_basic_conversion_ok():
    c = ProfileConverter()
    out = c.convert(WE_PYME_SAGUNTO).to_dict()
    assert "anchors" in out["anchor_bundle"]
    assert "snapshot_hash" in out["anchor_bundle"]
    assert isinstance(out["anchor_bundle"]["anchors"], dict)
    # v_f NO es responsabilidad del conversor; vive en el motor (engine).
    assert "v_f" not in out
    assert out["accepted_count"] == 15


def test_idempotency():
    c = ProfileConverter()
    out1 = c.convert(WE_PYME_SAGUNTO).to_dict()
    out2 = c.convert(WE_PYME_SAGUNTO).to_dict()
    assert out1["anchor_bundle"]["snapshot_hash"] == out2["anchor_bundle"]["snapshot_hash"]


def test_determinism_same_input_same_hash():
    a = ProfileConverter().convert(WE_PYME_SAGUNTO).to_dict()
    b = ProfileConverter().convert(WE_PYME_SAGUNTO).to_dict()
    assert a["anchor_bundle"]["snapshot_hash"] == b["anchor_bundle"]["snapshot_hash"]


def test_cambio_valor_aceptado_cambia_hash():
    """seccion 18.4 determinismo: cambio en un anchor aceptado cambia el snapshot_hash.

    C-12: 12.0 -> 60.0 fuerza categoria 'media' -> 'alta' en categorizador PED
    RD 769/1999 (umbrales: <10 baja, <50 media, else alta).
    """
    a = ProfileConverter().convert(WE_PYME_SAGUNTO).to_dict()
    payload_alt = dict(WE_PYME_SAGUNTO)
    payload_alt["C-12"] = {"present": True, "value": 60.0}
    b = ProfileConverter().convert(payload_alt).to_dict()
    assert a["anchor_bundle"]["snapshot_hash"] != b["anchor_bundle"]["snapshot_hash"]
    assert a["anchor_bundle"]["metadata"]["categoria_presion"] == "media"
    assert b["anchor_bundle"]["metadata"]["categoria_presion"] == "alta"


def test_15_anchors_present():
    assert len(ANCHOR_IDS) == 15


def test_empty_input_no_crash():
    c = ProfileConverter()
    out = c.convert({}).to_dict()
    assert "snapshot_hash" in out["anchor_bundle"]
    assert out["accepted_count"] == 0
    assert isinstance(out["anchor_bundle"]["anchors"], dict)


def test_iban_rechazado_en_blacklist():
    """IBAN (regex B-05) cae en blacklist (seccion 18.2.A)."""
    payload = dict(WE_PYME_SAGUNTO)
    payload["C-12"] = {"present": True, "value": "ES9121000418450200051332"}  # IBAN
    c = ProfileConverter()
    out = c.convert(payload)
    bundle = out.anchor_bundle
    ibans_rechazados = [r for r in bundle.rejects if r.category_id == "B-05"]
    assert len(ibans_rechazados) >= 1
    bundle_dict = bundle.to_dict()
    anch_strings = [
        str(v) for a in bundle_dict["anchors"].values()
        if a is not None
        for v in (a.values() if isinstance(a, dict) else [a])
    ]
    assert not any("912100" in s for s in anch_strings)


def test_blacklist_13_categories():
    assert len(BLACKLIST_KEYS) == 13


def test_categorizer_carga_termica_umbral_real():
    """Categorizador RIPCI: comprueba saltos 'baja' -> 'media' -> 'alta'."""
    assert categorize_carga_termica_ripci_rd_513_2017(100.0) == "baja"
    assert categorize_carga_termica_ripci_rd_513_2017(4500.0) == "media"
    assert categorize_carga_termica_ripci_rd_513_2017(50_000.0) == "alta"
    assert categorize_carga_termica_ripci_rd_513_2017(200_000.0) == "muy_alta"


# ---------------------------------------------------------------------------
# Cierre empirico de los MUST-FIX del code-reviewer
# ---------------------------------------------------------------------------

def test_evaluator_routing_b2_R506():
    """El motor enruta aplicacion R-506 a V_CE.idiomas (cierre B2)."""
    from bor4legal.engine.evaluator import Evaluador
    v_f = Evaluador(snapshot_id="snap-b2").evaluar(_flatten(WE_PYME_SAGUNTO))
    assert "R-506" in v_f.hook_trace
    assert hasattr(v_f.V_CE, "idiomas")
    assert list(v_f.V_CE.idiomas) == ["es"]


def test_oe_renderer_humaniza_lista_idiomas():
    """seccion 20.4.B UX: la OE firmada debe ser legible (idiomas como 'a, b, c')."""
    from bor4legal.engine.evaluator import Evaluador
    from bor4legal.engine.oe_renderer import render_oes
    anchors_raw = {
        "C-01": "ES", "C-02": ["UE", "ES"], "C-04": "2511",
        "C-06": "privada_mercantil", "C-07": "pequena",
        "C-08": ["es", "ca", "va"], "C-09": [], "C-10": ["FR", "DE"],
        "C-11": ["compresor-A"], "C-12": 12.0, "C-13": 4500.0,
        "C-15": "industrial_privado",
    }
    v_f = Evaluador(snapshot_id="snap-ux").evaluar(anchors_raw)
    oes = render_oes(v_f, snapshot_id="snap-ux")
    r506 = next(o for o in oes if o.rule_id == "R-506")
    assert "es, ca, va" in r506.oe_normal_text
    assert "['" not in r506.oe_normal_text
    body_idiomas = r506.oe_normal_text.split("Idiomas")[1].split(".")[0]
    assert "]" not in body_idiomas


def test_oe_id_determinista_por_snapshot_id():
    """seccion 20.4.B: distintas snapshot_id -> oe_id distinto (cierre B3)."""
    from bor4legal.engine.evaluator import Evaluador
    from bor4legal.engine.oe_renderer import render_oes
    v_f = Evaluador(snapshot_id="snap-id").evaluar(_flatten(WE_PYME_SAGUNTO))
    oes1 = render_oes(v_f, snapshot_id="snap-A")
    oes2 = render_oes(v_f, snapshot_id="snap-B")
    assert oes1[0].oe_id != oes2[0].oe_id
    oes1b = render_oes(v_f, snapshot_id="snap-A")
    assert oes1[0].oe_id == oes1b[0].oe_id
