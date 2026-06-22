from __future__ import annotations
import hashlib
import json
from typing import Any, Dict

from bor4quality.engine.reglas import REGLAS_CATALOGO, aplicar_regla
from bor4quality.engine.types import (
    VectorActivacion,
    VectorCuestionesEspeciales,
    VectorSector,
    VectorUbicacion,
)


class Evaluador:
    def __init__(self, *, snapshot_id: str = "test") -> None:
        self.snapshot_id = snapshot_id

    def evaluar(self, anchors: Dict[str, Any]) -> VectorActivacion:
        v_u = VectorUbicacion(
            organizacion=anchors.get("Q-01"),
            normas_objetivo=list(anchors.get("Q-02", []) or []),
        )
        v_s = VectorSector(
            sector=anchors.get("Q-04"),
            tamano=anchors.get("Q-07"),
            madurez_calidad=anchors.get("Q-15"),
        )
        v_ce = VectorCuestionesEspeciales()
        hook_trace = []

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
        payload = {"snapshot_id": snapshot_id, "v_f": v_f.to_dict()}
        blob = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")
        return hashlib.sha256(blob).hexdigest()
