"""Vectores V_U/V_S/V_CE del clon Privacy ISO 27701 + RGPD."""
from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List

@dataclass
class VectorUbicacion:
    principal:                 Any       = None
    applicable:                List[str] = field(default_factory=list)
    obligaciones_principales:  List[str] = field(default_factory=list)
    def to_dict(self):
        return asdict(self)

@dataclass
class VectorSector:
    sector:                  Any   = None
    tamano:                  Any   = None
    perfil_riesgo_pii:       str   = "no_aplicable"
    pii_inventario:          List[Dict[str, Any]] = field(default_factory=list)
    def to_dict(self):
        return asdict(self)

@dataclass
class VectorCuestionesEspeciales:
    bases_juridicas_cumplidas:  List[str] = field(default_factory=list)
    retenciones_incumplidas:    List[Dict[str, Any]] = field(default_factory=list)
    transferencias_protegidas:  List[Dict[str, Any]] = field(default_factory=list)
    idioma_canonico:            Any       = None
    def to_dict(self):
        return asdict(self)

@dataclass
class VectorActivacion:
    V_U:  VectorUbicacion            = field(default_factory=VectorUbicacion)
    V_S:  VectorSector               = field(default_factory=VectorSector)
    V_CE: VectorCuestionesEspeciales = field(default_factory=VectorCuestionesEspeciales)
    hook_trace: List[str] = field(default_factory=list)

    def to_dict(self):
        return {
            "V_U": self.V_U.to_dict(),
            "V_S": self.V_S.to_dict(),
            "V_CE": self.V_CE.to_dict(),
            "hook_trace": self.hook_trace,
        }
