# -*- coding: utf-8 -*-
"""tests/cantera/test_integration.py - validacion E2E de integracion D-002.

Cubre:
  - from_jwt valido / expirado / firma mala.
  - HMAC sign/verify roundtrip en cabeceras X-Internal-*.
  - Tampering de tenant en cabecera -> DENY.
  - token_version propagation coherente (no es el placeholder=0).
  - Propagacion de rol plataforma al RBAC (Propietario -> ALLOW).
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import sys
import time
from pathlib import Path

import pytest

ROOT = Path(__file__).parent.parent.parent.resolve()
sys.path.insert(0, str(ROOT / "src"))

from bor4legal.security.integration import (
    from_env,
    from_jwt,
    sign_internal_headers,
    verify_internal_headers,
)
from bor4legal.security.rbac import (
    CapaScope,
    PlataformaContexto,
    RolModulo,
    evaluar_capa_scope,
)

SECRET = "test-shared-secret-32-bytes-or-more__ok__"
ALG = "HS256"


def _b64url(data):
    if isinstance(data, str):
        data = data.encode("utf-8")
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def make_test_jwt(payload):
    header = {"alg": ALG, "typ": "JWT"}
    h = _b64url(json.dumps(header, separators=(",", ":")))
    p = _b64url(json.dumps(payload, separators=(",", ":")))
    msg = "{}.{}".format(h, p).encode("utf-8")
    sig = hmac.new(SECRET.encode(), msg, hashlib.sha256).digest()
    s = _b64url(sig)
    return "{}.{}.{}".format(h, p, s)


def test_from_jwt_valid_propietario_pasa():
    jwt_str = make_test_jwt({
        "user_id": "lgarrote",
        "tenant_id": "*",
        "role": "Propietario de Plataforma",
        "is_superadmin": True,
        "is_platform_owner": True,
        "token_version": 7,
        "iat": int(time.time()),
        "exp": int(time.time()) + 60,
    })
    ctx = from_jwt(jwt_str, SECRET)
    assert ctx.tenant_id == "*"
    assert ctx.user_id == "lgarrote"
    assert ctx.token_version == 7
    assert ctx.is_platform_owner is True
    assert ctx.is_superadmin is True
    assert ctx.rol_plataforma == "Propietario de Plataforma"


def test_from_jwt_expired_rechaza():
    jwt_str = make_test_jwt({
        "user_id": "u", "tenant_id": "es",
        "role": "usuario", "token_version": 1,
        "iat": int(time.time()) - 600,
        "exp": int(time.time()) - 60,
    })
    with pytest.raises(ValueError, match="expirado"):
        from_jwt(jwt_str, SECRET, leeway_seconds=0)


def test_from_jwt_bad_signature_rechaza():
    jwt_str = make_test_jwt({
        "user_id": "u", "tenant_id": "es",
        "role": "usuario", "token_version": 1,
        "iat": int(time.time()),
        "exp": int(time.time()) + 60,
    })
    with pytest.raises(ValueError, match="firma"):
        from_jwt(jwt_str, "wrong-secret-not-real-32bytes-x-xxx")


def test_from_jwt_malformed_rechaza():
    with pytest.raises(ValueError, match="malformado"):
        from_jwt("a.b", SECRET)
    with pytest.raises(ValueError, match="vacio"):
        from_jwt("", SECRET)
    with pytest.raises(ValueError, match="secret"):
        from_jwt("a.b.c", "")


def test_internal_headers_hmac_roundtrip():
    ctx = PlataformaContexto(
        rol_plataforma="Quality Manager",
        tenant_id="es",
        user_id="ana",
        token_version=3,
        is_superadmin=False,
    )
    headers = sign_internal_headers(ctx, SECRET, ttl_seconds=60)
    assert "X-Internal-Tenant-Id" in headers
    assert headers["X-Internal-Tenant-Id"] == "es"
    ctx2 = verify_internal_headers(headers, SECRET)
    assert ctx2.tenant_id == "es"
    assert ctx2.user_id == "ana"
    assert ctx2.token_version == 3
    assert ctx2.rol_plataforma == "Quality Manager"


def test_internal_headers_tampered_tenant_rechaza():
    ctx = PlataformaContexto(
        rol_plataforma="usuario", tenant_id="es", user_id="u",
        token_version=1,
    )
    headers = sign_internal_headers(ctx, SECRET, ttl_seconds=60)
    headers["X-Internal-Tenant-Id"] = "*"
    with pytest.raises(ValueError, match="firma"):
        verify_internal_headers(headers, SECRET)


def test_from_env_sin_vars_devuelve_placeholder():
    """Sin B4S_JWT/B4S_JWT_SECRET: cae al placeholder del piloto."""
    import os
    saved_jwt = os.environ.pop("B4S_JWT", None)
    saved_secret = os.environ.pop("B4S_JWT_SECRET", None)
    try:
        ctx = from_env(placeholder_tenant="es", placeholder_user="demo-user")
        assert ctx.tenant_id == "es"
        assert ctx.user_id == "demo-user"
        assert ctx.is_platform_owner is False
    finally:
        if saved_jwt is not None:
            os.environ["B4S_JWT"] = saved_jwt
        if saved_secret is not None:
            os.environ["B4S_JWT_SECRET"] = saved_secret


def test_from_env_con_vars_hidrata_real():
    jwt_str = make_test_jwt({
        "user_id": "bor", "tenant_id": "alfa",
        "role": "Superadministrador", "is_superadmin": True,
        "token_version": 5,
        "iat": int(time.time()), "exp": int(time.time()) + 60,
    })
    import os
    os.environ["B4S_JWT"] = jwt_str
    os.environ["B4S_JWT_SECRET"] = SECRET
    try:
        ctx = from_env()
        assert ctx.tenant_id == "alfa"
        assert ctx.user_id == "bor"
        assert ctx.token_version == 5
        assert ctx.is_superadmin is True
    finally:
        del os.environ["B4S_JWT"]
        del os.environ["B4S_JWT_SECRET"]


def test_token_version_propagation_no_es_placeholder():
    """El contexto real del JWT difiere del placeholder (token_version=0)."""
    jwt_str = make_test_jwt({
        "user_id": "u", "tenant_id": "es", "role": "usuario",
        "token_version": 42,
        "iat": int(time.time()), "exp": int(time.time()) + 60,
    })
    ctx_jwt = from_jwt(jwt_str, SECRET)
    ctx_ph = PlataformaContexto(
        rol_plataforma="usuario", tenant_id="es", user_id="demo-user"
    )
    assert ctx_jwt.token_version != ctx_ph.token_version
    assert ctx_jwt.token_version == 42


def test_rbac_propietario_es_global_ALLOW():
    """Propietario de Plataforma con tenant '*' pasa cualquier RBAC."""
    jwt_str = make_test_jwt({
        "user_id": "lgarrote", "tenant_id": "*",
        "role": "Propietario de Plataforma",
        "is_platform_owner": True, "is_superadmin": True,
        "token_version": 1,
        "iat": int(time.time()), "exp": int(time.time()) + 60,
    })
    ctx = from_jwt(jwt_str, SECRET)
    capa = CapaScope(
        rol_modulo=RolModulo.MANTENEDOR.value,
        accion="catalogo.publicar",
        recurso="lkp", tenant_id="de",
    )
    r = evaluar_capa_scope(
        capa, plataforma=ctx, roles_modulo=[RolModulo.MANTENEDOR.value],
    )
    assert r.permit is True, "Propietario debe pasar capacidades en cualquier tenant"


def test_internal_headers_tampered_user_rechaza():
    """S2 polish: cross-check User-Id es rechazado sin re-firma."""
    ctx = PlataformaContexto(
        rol_plataforma="usuario", tenant_id="es", user_id="ana",
        token_version=1,
    )
    headers = sign_internal_headers(ctx, SECRET, ttl_seconds=60)
    headers["X-Internal-User-Id"] = "evil"
    with pytest.raises(ValueError, match="firma"):
        verify_internal_headers(headers, SECRET)


def test_internal_headers_tampered_rol_rechaza():
    """S2 polish: cross-check Rol es rechazado sin re-firma."""
    ctx = PlataformaContexto(
        rol_plataforma="usuario", tenant_id="es", user_id="u",
        token_version=1,
    )
    headers = sign_internal_headers(ctx, SECRET, ttl_seconds=60)
    headers["X-Internal-Rol"] = "Propietario de Plataforma"
    with pytest.raises(ValueError, match="firma"):
        verify_internal_headers(headers, SECRET)


# --- v0.3.3 JWT confusion attacks hardening ---

def test_from_jwt_alg_none_rechaza():
    """CVE-2015-9235: JWT con alg=none + HMAC VALIDO del mensaje DEBE rechazarse por alg allowlist.

    El ataque canonico: header alg=none + firma HMAC valida del mensaje
    (porque todavia es posible en libs permisivas). Mi HMAC compare_digest
    pasa (firma legitima sobre el mensaje), pero la capa de alg allowlist
    (header.get('alg') != 'HS256') debe cortar. La firma vacia seria
    rechazada por HMAC primero (test cubierto por test_from_jwt_firma_vacia_rechaza).
    """
    header = {"alg": "none", "typ": "JWT"}
    h = _b64url(json.dumps(header, separators=(",", ":")))
    p = _b64url(json.dumps({"user_id": "evil", "tenant_id": "*", "role": "Propietario de Plataforma", "iat": int(time.time()), "exp": int(time.time()) + 60}, separators=(",", ":")))
    msg = "{}.{}".format(h, p).encode("utf-8")
    sig = _b64url(hmac.new(SECRET.encode(), msg, hashlib.sha256).digest())
    jwt_str = "{}.{}.{}".format(h, p, sig)
    with pytest.raises(ValueError, match="alg"):
        from_jwt(jwt_str, SECRET)


def test_from_jwt_alg_RS256_rechaza():
    """CVE-2022-23529 / algorithm confusion: alg=RS256 no debe colarse como HS256."""
    h = _b64url(json.dumps({"alg": "RS256", "typ": "JWT"}, separators=(",", ":")))
    p = _b64url(json.dumps({"user_id": "u", "tenant_id": "es", "role": "u", "iat": int(time.time()), "exp": int(time.time()) + 60}, separators=(",", ":")))
    # Firma fragmento vacio -> primer check de firma ya detecta invalido (raise).
    jwt_str = "{}.{}.{}".format(h, p, _b64url(b"\\x00" * 32))
    with pytest.raises(ValueError):
        from_jwt(jwt_str, SECRET)


def test_from_jwt_firma_vacia_rechaza():
    """JWT con tercer segmento vacio: HMAC compare_digest detecta."""
    h = _b64url(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")))
    p = _b64url(json.dumps({"user_id": "u", "tenant_id": "es", "role": "u", "iat": int(time.time()), "exp": int(time.time()) + 60}, separators=(",", ":")))
    jwt_str = "{}.{}.".format(h, p)
    with pytest.raises(ValueError, match="firma"):
        from_jwt(jwt_str, SECRET)


def test_from_jwt_payload_no_es_json_rechaza():
    """Payload base64 valido pero NO decodificable como JSON: defensa profundidad."""
    h = _b64url(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")))
    bad_payload = b"this is not json {{"
    p = _b64url(bad_payload)
    msg = "{}.{}".format(h, p).encode("utf-8")
    sig = _b64url(hmac.new(SECRET.encode(), msg, hashlib.sha256).digest())
    jwt_str = "{}.{}.{}".format(h, p, sig)
    with pytest.raises(ValueError, match="JSON"):
        from_jwt(jwt_str, SECRET)


def test_internal_headers_body_corrupto_rechaza():
    """X-Internal-Body no es base64url valido: debe rechazar sin caer."""
    ctx = PlataformaContexto(rol_plataforma="u", tenant_id="es", user_id="u", token_version=1)
    headers = sign_internal_headers(ctx, SECRET, ttl_seconds=60)
    headers["X-Internal-Body"] = "!!!not-base64-at-all@@@"
    with pytest.raises(ValueError, match="base64url"):
        verify_internal_headers(headers, SECRET)
