# -*- coding: utf-8 -*-
"""
engine.evaluator
================
Motor puro F(U, S, CE) - implementacion del §19.

API:
    >>> ev = Evaluador()
    >>> v_f = ev.evaluar(anchors_dict)
    >>> h = ev.determinism_check(v_f, snapshot_emision)

Garantias:
  - Determinista: mismo input + mismo snapshot -> mismo output.
  - Idempotente: eval(eval(anchors)) == eval(anchors).
  - Sin efectos secundarios sobre catalogos ni BD.
"""
from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, List, Optional

from bor4legal.engine.reglas import REGLAS_CATALOGO, aplicar_regla
from bor4legal.engine.types import (
    VectorActivacion,
    VectorCuestionesEspeciales,
    VectorSector,
    VectorUbicacion,
)


class Evaluador:
    """Motor puro F(U, S, CE) - §19."""

    def __init__(self, *, snapshot_id: str = "test") -> None:
        self.snapshot_id = snapshot_id

    def evaluar(self, anchors: Dict[str, Any]) -> VectorActivacion:
        """Aplica las reglas puras (R-101..R-701) y devuelve V_F (§19.4)."""

        v_u = VectorUbicacion(
            principal=anchors.get("C-01"),
            applicable=list(anchors.get("C-02", []) or []),
        )
        v_s = VectorSector(
            tamano=anchors.get("C-07"),
            tipo_org=anchors.get("C-06"),
            cnae=anchors.get("C-04"),
            actividad=anchors.get("C-05"),
        )
        v_ce = VectorCuestionesEspeciales()
        hook_trace: List[str] = []

        for rid in sorted(REGLAS_CATALOGO.keys()):
            res = aplicar_regla(rid, anchors)
            if res is None:
                continue
            spec = REGLAS_CATALOGO[rid]
            if spec.output_a == "V_U" and hasattr(v_u, spec.output_key):
                setattr(v_u, spec.output_key, res)
            elif spec.output_a == "V_S" and hasattr(v_s, spec.output_key):
                setattr(v_s, spec.output_key, res)
            elif spec.output_a == "V_CE" and hasattr(v_ce, spec.output_key):
                setattr(v_ce, spec.output_key, res)
            hook_trace.append(rid)

        return VectorActivacion(V_U=v_u, V_S=v_s, V_CE=v_ce, hook_trace=hook_trace)

    @staticmethod
    def determinism_check(v_f: VectorActivacion, snapshot_id: str) -> str:
        """Snapshot reproducible bit-a-bit (§20.4.B)."""
        payload = {"snapshot_id": snapshot_id, "v_f": v_f.to_dict()}
        blob = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")
        return hashlib.sha256(blob).hexdigest()
