from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, FrozenSet, List, Optional, Tuple
from bor4common.security.rbac import PlataformaContexto



class RolModulo(str, Enum):
    AUDITOR = "R-MOD-1"
    CLIENTE = "R-MOD-2"
    REVISOR = "R-MOD-3"
    MANTENEDOR = "R-MOD-4"


CAPACIDADES: Dict[str, Dict[str, bool]] = {
    "oe.leer":              {"R-MOD-1": True, "R-MOD-2": True, "R-MOD-3": True, "R-MOD-4": True},
    "oe.firmar":            {"R-MOD-2": True},
    "oe.dictaminar":        {"R-MOD-3": True},
    "oe.replay":            {"R-MOD-1": True, "R-MOD-2": True, "R-MOD-3": True, "R-MOD-4": True},
    "perfil.leer":          {"R-MOD-1": True, "R-MOD-2": True, "R-MOD-3": True},
    "perfil.cargar":        {"R-MOD-2": True},
    "regla.leer":           {"R-MOD-1": True, "R-MOD-2": True, "R-MOD-3": True, "R-MOD-4": True},
    "regla.modificar":      {"R-MOD-4": True},
    "catalogo.leer":        {"R-MOD-1": True, "R-MOD-2": True, "R-MOD-3": True, "R-MOD-4": True},
    "catalogo.publicar":    {"R-MOD-4": True},
    "replay.caso_historico":{"R-MOD-1": True, "R-MOD-2": True, "R-MOD-3": True, "R-MOD-4": True},
    "bitacora.leer":        {"R-MOD-1": True, "R-MOD-2": True, "R-MOD-3": True, "R-MOD-4": True},
}


INCOMPATIBLES: List[Tuple[str, str]] = [
    ("R-MOD-4", "R-MOD-3"),
    ("R-MOD-1", "R-MOD-2"),
    ("R-MOD-4", "R-MOD-2"),
]




@dataclass(frozen=True)
class CapaScope:
    rol_modulo: str
    accion: str
    recurso: str
    tenant_id: str
    snapshot_id: str = "test"
    extra: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ResultadoCapacidad:
    permit: bool
    outcome: str
    reasons: List[str] = field(default_factory=list)


_SOD_EXENTAS: FrozenSet[str] = frozenset({"oe.replay"})


def _viola_sod(roles_modulo: List[str], accion: Optional[str] = None) -> Optional[str]:
    if accion is not None and accion in _SOD_EXENTAS:
        return None
    roles = set(roles_modulo)
    for a, b in INCOMPATIBLES:
        if a in roles and b in roles:
            return f"SoD violada: {a} incompatible con {b}"
    return None


def evaluar_capa_scope(scope, *, plataforma, roles_modulo, tenant_objetivo=None):
    reasons = []
    target_tenant = tenant_objetivo or scope.tenant_id
    if scope.rol_modulo not in roles_modulo:
        reasons.append("rol " + scope.rol_modulo + " no asignado en sesion")
        return ResultadoCapacidad(False, "DENY", reasons)
    if not plataforma.is_platform_owner and target_tenant != plataforma.tenant_id:
        reasons.append("tenant mismatch")
        return ResultadoCapacidad(False, "DENY", reasons)
    sod = _viola_sod(roles_modulo, accion=scope.accion)
    if sod is not None:
        reasons.append(sod)
        return ResultadoCapacidad(False, "DENY", reasons)
    cap = CAPACIDADES.get(scope.accion, {})
    if cap.get(scope.rol_modulo, False):
        return ResultadoCapacidad(True, "ALLOW", reasons)
    reasons.append("rol " + scope.rol_modulo + " sin capacidad sobre '" + scope.accion + "'")
    return ResultadoCapacidad(False, "DENY", reasons)
