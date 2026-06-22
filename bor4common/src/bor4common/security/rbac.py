# -*- coding: utf-8 -*-
"""
bor4common.security.rbac
========================
PlataformaContexto canonica BOR4SIGE (frozen dataclass, compartido por los
4 clones del patron: Legal / Quality / Risk / Privacy).

El `from_jwt()` de bor4common.security.integration produce esta misma clase,
garantizando intercambiabilidad 1:1 entre los clones: cualquier codigo que
hoy construye una `PlataformaContexto` literal sigue funcionando porque el
frozen dataclass mantiene la misma firma exacta (mismos params obligatorios
+ defaults identicos).

El resto del RBAC (CAPACIDADES / INCOMPATIBLES / _viola_sod /
evaluar_capa_scope / CapaScope / ResultadoCapacidad / RolModulo Enum)
queda LOCAL en cada clon, porque sus matrices de capacidades difieren
segun el dominio (Legal/Quality/Risk/Privacy vocab distintos).
"""
from __future__ import annotations
from dataclasses import dataclass


@dataclass(frozen=True)
class PlataformaContexto:
    """Contexto de plataforma (D-002). Shape IDENTICO al piloto Legal.

    Parametros:
      rol_plataforma:    rol del usuario en la plataforma B4S
                         ('Propietario de Plataforma' | 'Superadministrador' | 'usuario' | ...).
      tenant_id:         identificador del tenant de la sesion
                         ('*' para Propietario de Plataforma con alcance global).
      user_id:           identificador unico del usuario dentro del tenant.
      is_platform_owner: True unicamente para Propietario de Plataforma (B4S owner con alcance *).
      is_superadmin:     True para superadmin dentro de su tenant (conmutacion X-Tenant-ID).
      token_version:     contador de revocacion (ISO 27001 A.9.2.3). Incrementado por
                         la B4S en cambio de contrasena; el JWT con token_version stale
                         es rechazado aguas arriba.
    """
    rol_plataforma:    str
    tenant_id:         str
    user_id:           str
    is_platform_owner: bool = False
    is_superadmin:     bool = False
    token_version:     int  = 0


__all__ = ["PlataformaContexto"]
