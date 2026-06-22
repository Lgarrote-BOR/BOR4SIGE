# -*- coding: utf-8 -*-
"""
engine
======
Motor F(U, S, CE) — §19 + render OE §20.
"""
from bor4legal.engine.types import VectorActivacion
from bor4legal.engine.evaluator import Evaluador
from bor4legal.engine.reglas import REGLAS_CATALOGO, ReglaSpec, aplicar_regla
from bor4legal.engine.oe_renderer import OE, OE_SCHEMA, render_oes

__all__ = [
    "VectorActivacion",
    "Evaluador",
    "REGLAS_CATALOGO",
    "ReglaSpec",
    "aplicar_regla",
    "OE",
    "OE_SCHEMA",
    "render_oes",
]
