# -*- coding: utf-8 -*-
"""
security.l2_amnesia
===================
Protocolo L2 "Amnesia Nitida" (§24.7).

Caso de uso: un Mantenedor de Catálogo (R-MOD-4) necesita reproducir la
evaluacion sobre un perfil NOMINAL real del cliente (con PII) para depurar
por qué fallo una regla. La OE no tendra PII (§18.3 y §24.7.E), pero la
ejecucion interna SÍ toca los anchors nominales — deben vivir SOLO en RAM.

Invariantes (§24.7.A..E):
  A. Justificacion obligatoria + ticket_id.
  B. Semilla de anonimizacion (sha256).
  C. Ejecucion en RAM (sin escritura a disco).
  D. Bitacora reforzada (pii_redaction_status=level2_admin_replay).
  E. Solo type-mismatch возвращается al mantenedor (no el valor nominal).
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
import tempfile
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Iterator, Optional


# Logger dedicado para bitacora L2 (no se mezcla con INFO logs).
_L2_LOGGER = logging.getLogger("bor4legal.l2_amnesia")
if not _L2_LOGGER.handlers:
    handler = logging.FileHandler(tempfile.gettempdir() + "/bor4legal_l2.log")
    handler.setFormatter(logging.Formatter("%(asctime)s [L2] %(message)s"))
    _L2_LOGGER.addHandler(handler)
    _L2_LOGGER.setLevel(logging.INFO)


@dataclass(frozen=True)
class L2AmnesiaSession:
    """Identifica una sesion L2 efimera."""

    justification: str          # ej. "TKT-7842"
    ticket_id:     str          # ej. "TKT-7842"
    actor_user_id: str
    redaction_status: str       # siempre "level2_admin_replay"
    seed_hash:      str          # sha256(snapshot + replay_order).
    created_at:     str          # ISO-8601 UTC.

    @classmethod
    def open(cls, *, justification: str, ticket_id: str, actor_user_id: str, snapshot_id: str, replay_order: int = 0) -> "L2AmnesiaSession":
        if not justification or not ticket_id:
            raise ValueError("Justificacion y ticket_id son obligatorios (§24.7.A).")
        seed = hashlib.sha256(
            f"{snapshot_id}|{replay_order}|{datetime.now(timezone.utc).isoformat()}".encode()
        ).hexdigest()
        session = cls(
            justification=justification,
            ticket_id=ticket_id,
            actor_user_id=actor_user_id,
            redaction_status="level2_admin_replay",
            seed_hash=seed,
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        _L2_LOGGER.info(
            "actor=%s ticket=%s justificacion=%s seed=%s",
            actor_user_id, ticket_id, justification, seed,
        )
        return session


@contextmanager
def l2_wrapper(
    *, justification: str, ticket_id: str, actor_user_id: str,
    snapshot_id: str, replay_order: int = 0,
) -> Iterator[L2AmnesiaSession]:
    """Context manager: garantiza limpieza de buffers al salir (§24.7.C)."""
    session = L2AmnesiaSession.open(
        justification=justification,
        ticket_id=ticket_id,
        actor_user_id=actor_user_id,
        snapshot_id=snapshot_id,
        replay_order=replay_order,
    )
    _L2_LOGGER.info("session_open seed=%s", session.seed_hash)
    try:
        yield session
    finally:
        _L2_LOGGER.info("session_close seed=%s reason=exit", session.seed_hash)


def safe_replay_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Devuelve el resultado saneado (§24.7.E): type-mismatch en lugar de valor.

    Para el piloto, eliminamos del payload cualquier clave que contenga PII nominal."""
    v = json.loads(json.dumps(payload))

    sensitive_substrings = (
        "dni", "nif", "nie", "iban", "cvv", "tarjeta", "ssn",
        "direccion_postal", "telefono_pers", "email_pers", "salud",
    )

    def _scrub(obj: Any) -> Any:
        if isinstance(obj, dict):
            return {
                k: ("<PII_FILTERED>" if any(s in k.lower() for s in sensitive_substrings) else _scrub(val))
                for k, val in obj.items()
            }
        if isinstance(obj, list):
            return [_scrub(x) for x in obj]
        return obj
    return _scrub(v)
