# -*- coding: utf-8 -*-
"""
bor4quality
===========
Modulo de Calidad ISO 9001 del patron BOR4SIGE.

Version 0.1.0 - 2026-06-21.

Clon piloto del patron validado por 2_Bor4Legal/ (orden B del cuaderno
v1.5a). Reproduce los 5 contratos (C-IDENTIDAD, C-DATOS, C-DESPLIEGUE,
C-BITACORA, C-HASH-TEMPLATE v0.2) con prefijo `quality_*`.

Hasta la palabra "integra" este modulo es independiente de BOR4SIGE;
post-"integra" se enchufa via gateway B4S + cabeceras firmadas
X-Internal-* (HMAC-SHA256, key=BOR4QUALITY_HMAC_KEY).
"""
__version__ = "0.1.0"

from bor4quality.engine.evaluator import Evaluador
from bor4quality.engine.oe_renderer import render_oes
from bor4quality.engine.reglas import REGLAS_CATALOGO, aplicar_regla
from bor4quality.engine.types import (
    VectorActivacion,
    VectorCuestionesEspeciales,
    VectorSector,
    VectorUbicacion,
)
from bor4quality.security.rbac import (
    CapaScope,
    PlataformaContexto,
    ResultadoCapacidad,
    RolModulo,
    evaluar_capa_scope,
)

__all__ = [
    "__version__",
    "Evaluador", "render_oes", "REGLAS_CATALOGO", "aplicar_regla",
    "VectorActivacion", "VectorCuestionesEspeciales", "VectorSector", "VectorUbicacion",
    "CapaScope", "PlataformaContexto", "ResultadoCapacidad", "RolModulo",
    "evaluar_capa_scope",
]
