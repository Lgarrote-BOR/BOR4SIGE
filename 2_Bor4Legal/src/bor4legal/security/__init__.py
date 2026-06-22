# -*- coding: utf-8 -*-
"""
security
========
RBAC + Amnesia L2 (§24) — Piloto del patron "SaaS modular".

Hasta la palabra "integra" este modulo NO LEE la BD de BOR4SIGE.
Maneja identidades propias (R-MOD-1..4) y respeta los 2 roles de plataforma cuando el gateway los reenvie.
"""
from bor4legal.security.rbac import (
    CapaScope,
    PlataformaContexto,
    ROLES_MODULO,
    ROLES_PLATAFORMA,
    evaluar_capa_scope,
)
from bor4legal.security.l2_amnesia import L2AmnesiaSession, l2_wrapper

__all__ = [
    "CapaScope",
    "PlataformaContexto",
    "ROLES_MODULO",
    "ROLES_PLATAFORMA",
    "evaluar_capa_scope",
    "L2AmnesiaSession",
    "l2_wrapper",
]
