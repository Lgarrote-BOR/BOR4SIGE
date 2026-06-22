# -*- coding: utf-8 -*-
"""
security.rbac
=============
RBAC del clon Privacy (ISO 27701 + RGPD + LOPDGDD).

Mirror of pilot Legal's CANONICAL schema (str-Enum RolModulo + action->role
matrix CAPACIDADES + SoD + frozen PlataformaContexto + ResultadoCapacidad +
evaluar_capa_scope). Adaptado a vocabulary Privacy-flavored (pii.*, dpia.*,
oe.*, perfil.*, regla.*, catalogo.*). Hermano con Quality/Risk.
"""
from __future__ import annotations
from bor4common.security.rbac import PlataformaContexto


from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, FrozenSet, List, Optional, Tuple


class RolModulo(str, Enum):
    AUDITOR    = "R-MOD-1"
    USUARIO    = "R-MOD-2"
    CONSULTOR  = "R-MOD-3"
    MANTENEDOR = "R-MOD-4"


class RolPlataforma(str, Enum):
    PROPIETARIO    = "Propietario de Plataforma"
    SUPERADMIN     = "Superadministrador"
    USUARIO_NORMAL = "usuario"


ROLES_MODULO: Tuple[str, ...] = tuple(r.value for r in RolModulo)
ROLES_PLATAFORMA: Tuple[str, ...] = tuple(r.value for r in RolPlataforma)


# Matriz accion -> rol (este patron es el canonico para que test_integration.py
# del pilot funcione via sed sin cambios estructurales).
CAPACIDADES: Dict[str, Dict[str, bool]] = {
    "oe.leer":              {"R-MOD-1": True, "R-MOD-2": True, "R-MOD-3": True, "R-MOD-4": True},
    "oe.firmar":            {"R-MOD-4": True},
    "oe.dictaminar":        {"R-MOD-1": True, "R-MOD-4": True},
    "oe.replay":            {"R-MOD-1": True, "R-MOD-2": True, "R-MOD-3": True, "R-MOD-4": True},
    "perfil.ver":           {"R-MOD-1": True, "R-MOD-2": True, "R-MOD-3": True},
    "perfil.crear":         {"R-MOD-4": True},
    "perfil.editar":        {"R-MOD-4": True},
    "regla.ver":            {"R-MOD-1": True, "R-MOD-2": True, "R-MOD-3": True, "R-MOD-4": True},
    "regla.crear":          {"R-MOD-4": True},
    "regla.editar":         {"R-MOD-4": True},
    "catalogo.ver":         {"R-MOD-1": True, "R-MOD-2": True, "R-MOD-3": True, "R-MOD-4": True},
    "catalogo.crear":       {"R-MOD-4": True},
    "catalogo.publicar":    {"R-MOD-4": True},  # Clave canonica para test_integration.py.
    "pii.inventariar":      {"R-MOD-1": True, "R-MOD-4": True},
    "pii.exportar":         {"R-MOD-4": True},
    "pii.borrar":           {"R-MOD-4": True},
    "dpia.iniciar":         {"R-MOD-4": True},
    "dpia.aprobar":         {"R-MOD-4": True},
    "bitacora.leer":        {"R-MOD-1": True, "R-MOD-2": True, "R-MOD-3": True, "R-MOD-4": True},
}


# SoD: pares incompatibles dentro de la misma sesion (mantenedor <-> revisor).
INCOMPATIBLES: List[Tuple[str, str]] = [
    ("R-MOD-4", "R-MOD-1"),  # Mantenedor <-> Auditor: auto-certificacion.
    ("R-MOD-4", "R-MOD-3"),  # Mantenedor <-> Consultor: conflicto intereses.
    ("R-MOD-2", "R-MOD-4"),  # Usuario <-> Mantenedor: segregacion basica.
]




@dataclass(frozen=True)
class CapaScope:
    """Declaracion de capacidad bajo evaluacion.
    Pilot canonical field names: rol_modulo (no 'rol'), tenant_id, snapshot_id, extra.
    """
    rol_modulo: str
    accion:     str
    recurso:    str
    tenant_id:  str
    snapshot_id: str = "test"
    extra:      Dict[str, Any] = field(default_factory=dict)


@dataclass
class ResultadoCapacidad:
    """Resultado de evaluacion (pilot canonical: permit/outcome/reasons)."""
    permit:   bool
    outcome:  str
    reasons:  List[str] = field(default_factory=list)


_SOD_EXENTAS: FrozenSet[str] = frozenset({"oe.replay", "oe.leer"})


def _viola_sod(roles_modulo, accion=None):
    if accion is not None and accion in _SOD_EXENTAS:
        return None
    roles = set(roles_modulo)
    for a, b in INCOMPATIBLES:
        if a in roles and b in roles:
            return f"SoD violada: {a} incompatible con {b}"
    return None


def evaluar_capa_scope(
    scope: CapaScope,
    *,
    plataforma: PlataformaContexto,
    roles_modulo: List[str],
    tenant_objetivo: Optional[str] = None,
) -> ResultadoCapacidad:
    """Decisor deny-by-default (pilot canonical)."""
    reasons: List[str] = []
    target_tenant = tenant_objetivo or scope.tenant_id

    if scope.rol_modulo not in roles_modulo:
        reasons.append(f"rol {scope.rol_modulo} no asignado en sesion")
        return ResultadoCapacidad(False, "DENY", reasons)

    if not plataforma.is_platform_owner and target_tenant != plataforma.tenant_id:
        reasons.append(
            f"tenant mismatch: sesion={plataforma.tenant_id} target={target_tenant} "
            "y no es Propietario de Plataforma"
        )
        return ResultadoCapacidad(False, "DENY", reasons)

    sod = _viola_sod(roles_modulo, accion=scope.accion)
    if sod is not None:
        reasons.append(sod)
        return ResultadoCapacidad(False, "DENY", reasons)

    cap = CAPACIDADES.get(scope.accion, {})
    if cap.get(scope.rol_modulo, False):
        return ResultadoCapacidad(True, "ALLOW", reasons)

    reasons.append(f"rol {scope.rol_modulo} no tiene capacidad sobre '{scope.accion}'")
    return ResultadoCapacidad(False, "DENY", reasons)


__all__ = [
    "RolModulo",
    "RolPlataforma",
    "ROLES_MODULO",
    "ROLES_PLATAFORMA",
    "CAPACIDADES",
    "INCOMPATIBLES",
    "PlataformaContexto",
    "CapaScope",
    "ResultadoCapacidad",
    "evaluar_capa_scope",
]
