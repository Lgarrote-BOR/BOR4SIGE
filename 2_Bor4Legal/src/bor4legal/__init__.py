# -*- coding: utf-8 -*-
"""
bor4legal v0.1.0
=================
Subproyecto piloto de Requisitos Legales para BOR4SIGE (modulo independiente).

Fase: Construccion INDEPENDIENTE del monorepo BOR4SIGE (D-001 + D-001-A).
Hasta la palabra "integra" este modulo NO comparte dependencias, pipelines, BD
ni autenticacion con BOR4SIGE.

Paquete:
    domain.profile  - Conversor de Perfil (seccion 18 del cuaderno v1.5a)
    engine          - Motor F(U,S,CE) y Reglas (seccion 19 y 20)
    catalogs        - Esquemas de catalogos externos (seccion 21)
    security        - RBAC + amnesia L2 (seccion 24)
"""
__version__ = "0.1.0"
__phase__   = "D-001 + D-001-A (independiente)"
