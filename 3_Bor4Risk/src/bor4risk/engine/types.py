"""Vectores V_U/V_S/V_CE del clon Risk MAGERIT con campos computacionales derivables."""
from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List


@dataclass
class VectorUbicacion:
    organizacion:         Any       = None
    normas_objetivo:      List[str] = field(default_factory=list)
    predominio_reactivo:  bool      = False        # R-401 trigger
    pct_preventivas:      float     = 0.0          # R-401 content (0..100)
    def to_dict(self):
        return asdict(self)


@dataclass
class VectorSector:
    sector:                  Any   = None
    tamano:                  Any   = None
    perfil_proteccion_alta:  bool  = False        # R-101 trigger (derived)
    activos_criticos:        List[Dict[str, Any]] = field(default_factory=list)  # R-101 content (los ids reales)
    def to_dict(self):
        return asdict(self)


@dataclass
class VectorCuestionesEspeciales:
    amenazas_huerfanas:   List[str] = field(default_factory=list)   # R-201
    riesgos_vulnerados:   List[Dict[str, Any]] = field(default_factory=list)  # R-301
    idioma_canonico:      Any        = None
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
            "V_U":        self.V_U.to_dict(),
            "V_S":        self.V_S.to_dict(),
            "V_CE":       self.V_CE.to_dict(),
            "hook_trace": self.hook_trace,
        }
