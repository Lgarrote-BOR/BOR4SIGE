from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import os
import time
from dataclasses import asdict
from typing import Any, Dict, Optional

from .rbac import PlataformaContexto

_logger = logging.getLogger(__name__)


JWTC_B4S_LEEWAY_SECONDS = 30
INTERNAL_HEADER_TTL_SECONDS = 60
INTERNAL_HEADER_LEEWAY_SECONDS = 30


def _b64url_decode(s):
    s = s.strip()
    if not s:
        return b""
    pad = "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)


def _b64url_encode(b):
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")


def from_jwt(jwt_str, secret, *, leeway_seconds=JWTC_B4S_LEEWAY_SECONDS):
    """Decodifica + verifica un JWT HS256 emitido por BOR4SIGE auth.js."""
    if not jwt_str:
        raise ValueError("from_jwt: jwt_str vacio.")
    if not secret:
        raise ValueError("from_jwt: secret requerido para validar firma.")
    parts = jwt_str.split(".")
    if len(parts) != 3:
        raise ValueError("from_jwt: JWT malformado ({} partes; esperadas 3).".format(len(parts)))
    header_b64, payload_b64, signature_b64 = parts
    message = "{}.{}".format(header_b64, payload_b64).encode("utf-8")
    expected_sig = hmac.new(secret.encode("utf-8"), message, hashlib.sha256).digest()
    actual_sig = _b64url_decode(signature_b64)
    if not expected_sig or not actual_sig:
        raise ValueError("from_jwt: firma no es bytes HMAC-SHA256 validos.")
    if not hmac.compare_digest(expected_sig, actual_sig):
        raise ValueError("from_jwt: firma JWT invalida (HMAC compare_digest fail).")

    # 2) Header decode + algorithm allowlist.
    try:
        header = json.loads(_b64url_decode(header_b64).decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError, ValueError) as e:
        raise ValueError('from_jwt: header JWT no es JSON: {!r}'.format(e)) from e
    if header.get('alg') != 'HS256':
        raise ValueError('from_jwt: algoritmo no soportado: {!r}'.format(header.get('alg')))

    # 3) Payload decode.
    try:
        payload = json.loads(_b64url_decode(payload_b64).decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError, ValueError) as e:
        raise ValueError('from_jwt: payload JWT no es JSON: {!r}'.format(e)) from e

    # 4) exp validation (RFC 7519): venza + leeway configurable.
    exp_raw = payload.get('exp', 0)
    try:
        exp = int(exp_raw)
    except (TypeError, ValueError):
        raise ValueError('from_jwt: exp no es entero: {!r}'.format(exp_raw))
    now = int(time.time())
    if exp <= 0:
        raise ValueError('from_jwt: exp ausente o invalido ({}).'.format(exp))
    if (now - leeway_seconds) >= exp:
        raise ValueError('from_jwt: JWT expirado (exp={}, now={}, leeway={}s).'.format(exp, now, leeway_seconds))

    return PlataformaContexto(
        rol_plataforma=str(payload.get('role', 'usuario')),
        tenant_id=str(payload.get('tenant_id', '')),
        user_id=str(payload.get('user_id', '')),
        is_platform_owner=bool(payload.get('is_platform_owner', False)),
        is_superadmin=bool(payload.get('is_superadmin', False) or payload.get('is_platform_owner', False)),
        token_version=int(payload.get('token_version', 0)),
    )


def sign_internal_headers(ctx, secret, *, ttl_seconds=INTERNAL_HEADER_TTL_SECONDS):
    """Firma HMAC-SHA256 y emite dict X-Internal-* sobre body canonico."""
    if not secret:
        raise ValueError("sign_internal_headers: secret requerido.")
    issued_at = int(time.time())
    expires_at = issued_at + ttl_seconds
    body_dict = {
        "t": ctx.tenant_id,
        "u": ctx.user_id,
        "r": ctx.rol_plataforma,
        "v": ctx.token_version,
        "ipo": ctx.is_platform_owner,
        "isa": ctx.is_superadmin,
        "ts": issued_at,
        "exp": expires_at,
    }
    body_canon = json.dumps(body_dict, sort_keys=True, separators=(",", ":")).encode("utf-8")
    signature = hmac.new(secret.encode("utf-8"), body_canon, hashlib.sha256).hexdigest()
    return {
        "X-Internal-Tenant-Id": ctx.tenant_id,
        "X-Internal-User-Id": ctx.user_id,
        "X-Internal-Rol": ctx.rol_plataforma,
        "X-Internal-Token-Version": str(ctx.token_version),
        "X-Internal-Timestamp": str(issued_at),
        "X-Internal-Expires": str(expires_at),
        "X-Internal-Signature": signature,
        "X-Internal-Body": _b64url_encode(body_canon),
    }

def _hdr_coherence(headers, hdr_key, payload, payload_key):
    """Cross-check (S2 polish): el header externo `hdr_key` debe coincidir
    con el campo firmado `payload_key` del body. Tampering sin re-firma
    produce divergencia detectable. Levanta ValueError('firma invalida')
    para conservar el contrato del test.
    """
    expected = str(payload.get(payload_key, ""))
    actual = headers.get(hdr_key, "")
    if actual != expected:
        raise ValueError(
            "verify_internal_headers: firma invalida - {}={!r} no coincide "
            "con body firmado {}={!r}".format(hdr_key, actual, payload_key, expected)
        )


def verify_internal_headers(headers, secret, *, leeway_seconds=INTERNAL_HEADER_LEEWAY_SECONDS):
    """Inverso de sign_internal_headers. Verifica HMAC + ttl + decodifica body."""
    if not secret:
        raise ValueError("verify_internal_headers: secret requerido.")
    body_b64 = headers.get("X-Internal-Body", "")
    signature = headers.get("X-Internal-Signature", "")
    if not body_b64 or not signature:
        raise ValueError("verify_internal_headers: X-Internal-Body o X-Internal-Signature vacios.")
    try:
        body = _b64url_decode(body_b64)
    except ValueError as e:
        raise ValueError("verify_internal_headers: body no es base64url: {}".format(e)) from e
    expected = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise ValueError("verify_internal_headers: firma X-Internal-Signature invalida.")
    try:
        payload = json.loads(body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        raise ValueError("verify_internal_headers: body no es JSON: {}".format(e)) from e
    exp = int(payload.get("exp", 0))
    now = int(time.time())
    if exp <= 0:
        raise ValueError("verify_internal_headers: exp ausente.")
    if (now - leeway_seconds) >= exp:
        raise ValueError("verify_internal_headers: cabecera expirada (exp={}, now={}).".format(exp, now))

    # Cross-check de defensa en profundidad (S1+S2 polish): los headers
    # externos visibles Tenant-Id / User-Id / Rol deben coincidir con los
    # campos firmados del body. Token-Version se omite (informativo, no
    # de control). Si un atacante altera una cabecera externa sin poder
    # re-firmar, la firma del body sigue valida PERO el header diverge ->
    # detectado como tampering.
    _hdr_coherence(headers, "X-Internal-Tenant-Id", payload, "t")
    _hdr_coherence(headers, "X-Internal-User-Id", payload, "u")
    _hdr_coherence(headers, "X-Internal-Rol", payload, "r")

    return PlataformaContexto(
        rol_plataforma=str(payload.get("r", "usuario")),
        tenant_id=str(payload.get("t", "")),
        user_id=str(payload.get("u", "")),
        is_platform_owner=bool(payload.get("ipo", False)),
        is_superadmin=bool(payload.get("isa", False)),
        token_version=int(payload.get("v", 0)),
    )


def from_env(*, jwt_var="B4S_JWT", secret_var="B4S_JWT_SECRET",
             placeholder_tenant="es", placeholder_user="demo-user"):
    """Lee B4S_JWT + B4S_JWT_SECRET del entorno. Si existen, hidrata el contexto real;
    en su defecto, cae al placeholder legacy (modo standalone, sin gateway).
    """
    jwt = os.environ.get(jwt_var)
    secret = os.environ.get(secret_var)
    if jwt and secret:
        # S3 polish v2: hidratar primero, loggear despues con valores
        # reales (sin PII: user_id omitido, solo tenant/rol/token_version).
        # Observabilidad operativa distinguible del placeholder.
        ctx = from_jwt(jwt, secret)
        _logger.info(
            "from_env: hidratado desde %s: tenant_id=%r rol=%r token_version=%d is_platform_owner=%s",
            jwt_var, ctx.tenant_id, ctx.rol_plataforma,
            ctx.token_version, ctx.is_platform_owner,
        )
        return ctx
    _logger.info(
        "from_env: B4S_JWT/B4S_JWT_SECRET no presentes en el subshell; usando placeholder "
        "(rol_plataforma='usuario', tenant_id=%r, token_version=0).",
        placeholder_tenant,
    )
    return PlataformaContexto(
        rol_plataforma="usuario",
        tenant_id=placeholder_tenant,
        user_id=placeholder_user,
        is_platform_owner=False,
        is_superadmin=False,
        token_version=0,
    )


def to_dict(ctx):
    return asdict(ctx)


__all__ = [
    "from_jwt",
    "sign_internal_headers",
    "verify_internal_headers",
    "from_env",
    "to_dict",
    "PlataformaContexto",
]
