# -*- coding: utf-8 -*-
"""
engine.types
============
Tipos vectoriales §19.4: V_U, V_S, V_CE + Vector de Activacion V_F.

Sin dependencias externas. Schema declarativo para uso por Sphinx / OpenAPI.
"""
from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List


@dataclass
class VectorUbicacion:
    """V_U: vector de ubicacion/jurisdiccion derivada (§19.4)."""
    principal:   Any                = None   # C-01
    applicable:  List[str]          = field(default_factory=list)   # C-02

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class VectorSector:
    """V_S: vector de sector/tamano/tipo-organizacion (§19.4)."""
    tamano:      Any                = None   # C-07
    tipo_org:    Any                = None   # C-06
    cnae:        Any                = None   # C-04
    actividad:   Any                = None   # C-05

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class VectorCuestionesEspeciales:
    """V_CE: vector de cuestiones especiales / derivadas (§19.4)."""
    carga_termica: Any             = None                # R-201
    presion:       Any             = None                # R-202
    export:        List[str]       = field(default_factory=list)   # R-503
    assets:        List[str]       = field(default_factory=list)   # R-601
    reg_sectores:  List[str]       = field(default_factory=list)   # R-501
    idiomas:       List[str]       = field(default_factory=list)   # R-506
    cliente:       Any             = None                # R-701

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class VectorActivacion:
    """V_F: Vector de Activacion canonico (§19.4, §20)."""
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


V_F_SCHEMA: Dict[str, Any] = {
    "title": "VectorActivacion_v0.1",
    "type": "object",
    "required": ["V_U", "V_S", "V_CE", "hook_trace"],
    "properties": {
        "V_U":        {"$ref": "#/definitions/VectorUbicacion"},
        "V_S":        {"$ref": "#/definitions/VectorSector"},
        "V_CE":       {"$ref": "#/definitions/VectorCuestionesEspeciales"},
        "hook_trace": {"type": "array", "items": {"type": "string"}},
    },
}
