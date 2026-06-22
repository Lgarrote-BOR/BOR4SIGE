# -*- coding: utf-8 -*-
"""security.integration - shim thin re-export desde bor4common (REFCOMMON).

V0.3.0+: el codigo de D-002 (from_jwt, sign_internal_headers,
verify_internal_headers, from_env, to_dict, helpers b64url + _hdr_coherence,
constantes JWTC/INTERNAL_HEADER_*) vive en `bor4common.security.integration`.
Este shim reexporta los simbolos publicos para preservar el path
de import legacy `from borX.security.integration import ...` (cli.py y
tests/cantera/test_integration.py funcionan sin cambios).
"""
from __future__ import annotations

from bor4common.security.integration import (
    from_jwt,
    sign_internal_headers,
    verify_internal_headers,
    from_env,
    to_dict,
    PlataformaContexto,
    JWTC_B4S_LEEWAY_SECONDS,
    INTERNAL_HEADER_TTL_SECONDS,
    INTERNAL_HEADER_LEEWAY_SECONDS,
)

__all__ = [
    "from_jwt",
    "sign_internal_headers",
    "verify_internal_headers",
    "from_env",
    "to_dict",
    "PlataformaContexto",
    "JWTC_B4S_LEEWAY_SECONDS",
    "INTERNAL_HEADER_TTL_SECONDS",
    "INTERNAL_HEADER_LEEWAY_SECONDS",
]
