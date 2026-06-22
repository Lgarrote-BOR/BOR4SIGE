from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List


@dataclass
class VectorUbicacion:
    organizacion:    Any            = None
    normas_objetivo: List[str]      = field(default_factory=list)
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class VectorSector:
    sector:          Any            = None
    tamano:          Any            = None
    madurez_calidad: Any            = None
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class VectorCuestionesEspeciales:
    nc_abiertas:      int           = 0
    kpi_cumplimiento: List[str]     = field(default_factory=list)
    docs_pendientes:  List[str]     = field(default_factory=list)
    idioma_principal: Any           = None
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class VectorActivacion:
    V_U:        VectorUbicacion               = field(default_factory=VectorUbicacion)
    V_S:        VectorSector                  = field(default_factory=VectorSector)
    V_CE:       VectorCuestionesEspeciales    = field(default_factory=VectorCuestionesEspeciales)
    hook_trace: List[str]                     = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "V_U":        self.V_U.to_dict(),
            "V_S":        self.V_S.to_dict(),
            "V_CE":       self.V_CE.to_dict(),
            "hook_trace": self.hook_trace,
        }
