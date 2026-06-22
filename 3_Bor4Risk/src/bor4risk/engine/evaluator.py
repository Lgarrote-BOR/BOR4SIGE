"""Evaluador F(U,S,CE) determinista para el clon Risk MAGERIT."""
from __future__ import annotations
import hashlib
import json
from typing import Any, Dict

from bor4risk.engine.reglas import REGLAS_CATALOGO, aplicar_regla
from bor4risk.engine.types import VectorActivacion, VectorCuestionesEspeciales, VectorSector, VectorUbicacion


class Evaluador:
    def __init__(self, *, snapshot_id="test"):
        self.snapshot_id = snapshot_id

    def evaluar(self, anchors):
        v_u = VectorUbicacion(organizacion=anchors.get("R-00"))
        v_s = VectorSector(sector=anchors.get("R-05"))
        v_ce = VectorCuestionesEspeciales()
        hook_trace = []
        for rid in sorted(REGLAS_CATALOGO.keys()):
            res = aplicar_regla(rid, anchors)
            if res is None:
                continue
            spec = REGLAS_CATALOGO[rid]
            target = {"V_U": v_u, "V_S": v_s, "V_CE": v_ce}.get(spec.output_a)
            if target is None or not hasattr(target, spec.output_key):
                continue
            setattr(target, spec.output_key, res)
            hook_trace.append(rid)
        return VectorActivacion(V_U=v_u, V_S=v_s, V_CE=v_ce, hook_trace=hook_trace)

    @staticmethod
    def determinism_check(v_f, snapshot_id):
        payload = {"snapshot_id": snapshot_id, "v_f": v_f.to_dict()}
        blob = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")
        return hashlib.sha256(blob).hexdigest()
