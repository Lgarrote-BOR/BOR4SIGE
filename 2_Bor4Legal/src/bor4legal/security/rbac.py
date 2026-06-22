# -*- coding: utf-8 -*-
"""
security.rbac
=============
Modelo RBAC del motor externo (§24).

Roles del modulo: R-MOD-1..4 (Auditor, Cliente, Revisor, Mantenedor Cat).
Roles de plataforma (cuando llega el gateway): R-PLAT-1 (Propietario de
Plataforma, alcance *) y R-PLAT-2 (Superadministrador, alcance tenant con
conmutacion).

Invariantes (§24.3 y §24.4):
  - Deny-by-default (§24.4.A).
  - Tenant inheritance desde gateway (§24.3.A — limites plataforma).
  - SoD incompatibilidades §24.5.
"""
from __future__ import annotations
from bor4common.security.rbac import PlataformaContexto


from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, FrozenSet, List, Optional, Tuple


class RolModulo(str, Enum):
    AUDITOR = "R-MOD-1"
    CLIENTE = "R-MOD-2"
    REVISOR = "R-MOD-3"
    MANTENEDOR = "R-MOD-4"


class RolPlataforma(str, Enum):
    PROPIETARIO = "Propietario de Plataforma"
    SUPERADMIN = "Superadministrador"
    USUARIO_NORMAL = "usuario"


ROLES_MODULO: Tuple[str, ...] = tuple(r.value for r in RolModulo)
ROLES_PLATAFORMA: Tuple[str, ...] = tuple(r.value for r in RolPlataforma)


# --- Matriz de capacidades por accion × rol del modulo ---
CAPACIDADES: Dict[str, Dict[str, bool]] = {
    "oe.leer":              {"R-MOD-1": True,  "R-MOD-2": True,  "R-MOD-3": True,  "R-MOD-4": True},
    "oe.firmar":            {"R-MOD-2": True},
    "oe.dictaminar":        {"R-MOD-3": True},
    "oe.replay":            {"R-MOD-1": True,  "R-MOD-2": True,  "R-MOD-3": True,  "R-MOD-4": True},
    "perfil.leer":          {"R-MOD-1": True,  "R-MOD-2": True,  "R-MOD-3": True},
    "perfil.cargar":        {"R-MOD-2": True},
    "regla.leer":           {"R-MOD-1": True,  "R-MOD-2": True,  "R-MOD-3": True,  "R-MOD-4": True},
    "regla.modificar":      {"R-MOD-4": True},
    "regla.depurar_N2":     {"R-MOD-4": True},
    "catalogo.leer":        {"R-MOD-1": True,  "R-MOD-2": True,  "R-MOD-3": True,  "R-MOD-4": True},
    "catalogo.publicar":    {"R-MOD-4": True},
    "replay.caso_historico":{"R-MOD-1": True,  "R-MOD-2": True,  "R-MOD-3": True,  "R-MOD-4": True},
    "bitacora.leer":        {"R-MOD-1": True,  "R-MOD-2": True,  "R-MOD-3": True,  "R-MOD-4": True},
}


# --- SoD: pares incompatibles en la misma sesion ---
INCOMPATIBLES: List[Tuple[str, str]] = [
    ("R-MOD-4", "R-MOD-3"),   # Mantenedor <-> Revisor: auto-certificacion.
    ("R-MOD-1", "R-MOD-2"),   # Auditor <-> Cliente: auto-auditoria.
    ("R-MOD-4", "R-MOD-2"),   # Mantenedor <-> Cliente: conflicto intereses.
]




@dataclass(frozen=True)
class CapaScope:
    """Declaracion de capacidad bajo evaluacion (§24.4)."""

    rol_modulo: str
    accion:     str
    recurso:    str
    tenant_id:  str
    snapshot_id: str = "test"
    extra:      Dict[str, Any] = field(default_factory=dict)


# Resultado de evaluacion de capacidad.
@dataclass
class ResultadoCapacidad:
    permit:   bool
    outcome:  str                     # "ALLOW" | "DENY" | "ALLOW_AND_LOG".
    reasons:  List[str]               = field(default_factory=list)


def _viola_sod(
    roles_modulo: List[str],
    accion: Optional[str] = None,
) -> Optional[str]:
    """Detecta incompatibilidades SoD dentro de los roles del modulo.

    Si `accion` figura en `_SOD_EXENTAS`, se permite la coexistencia
    (lectura historica / coexistencia controlada). El resto de acciones
    son bloqueadas si el par incompatible esta presente.

    Exentas a 2026-06-21 (cerrado piloto):
      - oe.replay: lectura historica de OE firmadas - no inventariable.
      - NO bitacora.leer (riesgo de auto-certificacion del Revisor sobre
        bitácora escrita por el Mantenedor).
    """
    # Exenciones primero: si la accion es una de las coexistentes, no hay
    # SoD que reportar aunque los pares incompatibles esten presentes.
    if accion is not None and accion in _SOD_EXENTAS:
        return None
    roles = set(roles_modulo)
    for a, b in INCOMPATIBLES:
        if a in roles and b in roles:
            return f"SoD violada: {a} incompatible con {b}"
    return None


# Acciones en las que los pares incompatibles de _viola_sod pueden coexistir.
# Tras el fix A (code-reviewer 2026-06-21), bitacora.leer queda FUERA: el
# Mantenedor debe escribir bitacora sin cruzarla con la del Revisor.
_SOD_EXENTAS: FrozenSet[str] = frozenset({"oe.replay"})


def evaluar_capa_scope(
    scope: CapaScope,
    *,
    plataforma: PlataformaContexto,
    roles_modulo: List[str],
    tenant_objetivo: Optional[str] = None,
) -> ResultadoCapacidad:
    """Decisor deny-by-default (§24.4).

    Reglas:
      1. Deny-by-default: si no hay entrada, return deny.
      2. tenant_match: tenant_objetivo (default = scope.tenant_id) debe coincidir
         con plataforma.tenant_id, salvo is_platform_owner=True (alcance *).
      3. role_match: scope.rol_modulo debe estar en las capacidades de la accion.
      4. SoD: roles_modulo no deben tener incompatibilidades con scope.rol_modulo.
    """
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
    # `_viola_sod` ya considera `_SOD_EXENTAS` internamente; si retorna
    # algo, es que la coexistencia NO esta permitida.
    if sod is not None:
        reasons.append(sod)
        return ResultadoCapacidad(False, "DENY", reasons)

    cap = CAPACIDADES.get(scope.accion, {})
    if cap.get(scope.rol_modulo, False):
        outcome = "ALLOW_AND_LOG" if scope.accion == "regla.depurar_N2" else "ALLOW"
        return ResultadoCapacidad(True, outcome, reasons)

    reasons.append(f"rol {scope.rol_modulo} no tiene capacidad sobre '{scope.accion}'")
    return ResultadoCapacidad(False, "DENY", reasons)
