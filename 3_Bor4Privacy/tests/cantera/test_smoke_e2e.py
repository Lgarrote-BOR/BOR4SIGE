# -*- coding: utf-8 -*-
"""Smoke E2E Privacy ISO 27701 + RGPD + LOPDGDD (v0.3.0) — pilot canonical API."""
import json

import pytest

from bor4privacy.engine.reglas import (
    BASES_JURIDICAS_VALIDAS, RETENCIONES_MAXIMAS_DIAS,
    REGISTRO_REGLAS, ADECUADOS_UE,
)
from bor4privacy.engine.oe_renderer import renderizar_oe, PLANTILLAS
from bor4privacy.engine.types import (
    VectorActivacion, VectorCuestionesEspeciales, VectorSector, VectorUbicacion,
)
from bor4privacy.security.rbac import (
    CAPACIDADES, CapaScope, PlataformaContexto, ROLES_MODULO,
    RolModulo, ResultadoCapacidad, evaluar_capa_scope,
)
from bor4privacy.cli import VERSION_PILOTO, _evaluar_perfil, _run, PERFILES_PRIVACY


def _v_alto_con_transferencias():
    return VectorActivacion(
        V_U=VectorUbicacion(principal="es", applicable=["es", "us"]),
        V_S=VectorSector(perfil_riesgo_pii="alto",
            pii_inventario=[{"t": "email"}] * 1500),
        V_CE=VectorCuestionesEspeciales(
            bases_juridicas_cumplidas=["ejecucion_contrato"],
            transferencias_protegidas=[{"pais": "us"}]),
    )


def test_pipeline_P101_P201_P301_disparadas():
    v_f = _v_alto_con_transferencias()
    matched = [r["rule_id"] for r in REGISTRO_REGLAS if r["apply"](v_f)]
    assert matched == ["P-101", "P-201", "P-301"]


def test_regla_P101_perfil_bajo_NO_dispara():
    v_f = VectorActivacion(
        V_U=VectorUbicacion(principal="es"),
        V_S=VectorSector(perfil_riesgo_pii="bajo",
            pii_inventario=[{"t": "email"}] * 1500),
        V_CE=VectorCuestionesEspeciales(
            transferencias_protegidas=[{"pais": "us"}]),
    )
    matched = [r["rule_id"] for r in REGISTRO_REGLAS if r["apply"](v_f)]
    assert "P-101" not in matched


def test_plantilla_DPIA_5SECCIONES_estructura():
    v_f = _v_alto_con_transferencias()
    oe = renderizar_oe("P-201", "snap-1", v_f,
                       "RGPD_DPIA_5SECCIONES", "es")
    for n in ("SECCION 1", "SECCION 2", "SECCION 3", "SECCION 4", "SECCION 5"):
        assert n in oe["body"]
    assert len(oe["d12_hash"]) == 64


def test_d12_hash_inmutable():
    v_f = _v_alto_con_transferencias()
    o1 = renderizar_oe("P-101", "snap-1", v_f,
                       "RGPD_DPIA_TRIGGER", "es")
    o2 = renderizar_oe("P-101", "snap-1", v_f,
                       "RGPD_DPIA_TRIGGER", "es")
    assert o1["d12_hash"] == o2["d12_hash"]
    o3 = renderizar_oe("P-101", "snap-1", v_f,
                       "RGPD_TRANSFERENCIA_FUERA_UE", "es")
    assert o3["d12_hash"] != o1["d12_hash"]


def test_catalogos_inmutables_v0_3_0():
    assert len(BASES_JURIDICAS_VALIDAS) == 6
    assert "consentimiento" in BASES_JURIDICAS_VALIDAS
    assert "obligacion_legal" in BASES_JURIDICAS_VALIDAS
    assert RETENCIONES_MAXIMAS_DIAS["obligacion_legal_facturacion"] <= 730
    assert "adecuado_ue" in ADECUADOS_UE
    assert "scc_firmadas" in ADECUADOS_UE


def test_rbac_Propietario_de_Plataforma_allow_oe_leer():
    """Propietario bypass => permit=True en cualquier tenant."""
    p = PlataformaContexto(rol_plataforma="Propietario de Plataforma",
                           tenant_id="*", is_platform_owner=True, user_id="owner")
    capa = CapaScope(rol_modulo=RolModulo.MANTENEDOR.value,
                     accion="oe.leer", recurso="P-101",
                     tenant_id="de", snapshot_id="smoke-rbac")
    r = evaluar_capa_scope(capa, plataforma=p, roles_modulo=list(ROLES_MODULO))
    assert r.permit is True
    assert r.outcome == "ALLOW"


def test_rbac_MANTENEDOR_catalogo_publicar_in_es_ALLOW():
    """MANTENEDOR en su propio tenant con accion catalogada -> ALLOW."""
    p = PlataformaContexto(rol_plataforma="MANTENEDOR-RBAC",
                           tenant_id="es", user_id="lucia")
    capa = CapaScope(rol_modulo=RolModulo.MANTENEDOR.value,
                     accion="catalogo.publicar", recurso="lkp",
                     tenant_id="es", snapshot_id="smoke-rbac")
    r = evaluar_capa_scope(capa, plataforma=p,
                           roles_modulo=[RolModulo.MANTENEDOR.value])
    # NOTA: PlataformaContexto.rol_plataforma no es 'MANTENEDOR' (rol de plataforma),
    # sino 'Propietario de Plataforma' o 'Superadministrador'. Por tanto el evaluador
    # cae al chequeo de caps y ALLOWs.
    assert r.permit is True


def test_rbac_USUARIO_sin_caps_es_DENY():
    """Rol sin capacidad sobre accion -> DENY (RolePlataforma bypass NO aplica)."""
    p = PlataformaContexto(rol_plataforma="usuario", tenant_id="es", user_id="user")
    capa = CapaScope(rol_modulo=RolModulo.USUARIO.value,
                     accion="pii.borrar", recurso="PII-X",
                     tenant_id="es", snapshot_id="smoke-rbac")
    r = evaluar_capa_scope(capa, plataforma=p,
                           roles_modulo=[RolModulo.USUARIO.value])
    assert r.permit is False
    assert r.outcome == "DENY"


def test_cli_VERSION_y_perfiles_constantes():
    assert VERSION_PILOTO == "0.3.0"
    assert len(PERFILES_PRIVACY) == 6


def test_cli__run_all_match_expected_con_Propietario():
    plataforma = PlataformaContexto(
        rol_plataforma="Propietario de Plataforma",
        tenant_id="*", is_platform_owner=True, user_id="owner",
    )
    out = _run(PERFILES_PRIVACY, snapshot_id="smoke-cli", plataforma=plataforma)
    assert out["version_piloto"] == "0.3.0"
    assert out["rbac_audit_summary"]["all_match_expected"] is True
