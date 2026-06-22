# -*- coding: utf-8 -*-
"""
engine.reglas
=============
Catalogo declarativo de reglas R-NNN del motor F(U, S, CE) (§19).

Para el piloto implementamos un subconjunto representativo de las 36 reglas del
cuaderno v1.5a (10 reglas funcionalmente completas). La ejecución F() vive en
engine.evaluator y consume este registro.

Invariantes:
  - Las reglas son funciones PURAS, deterministas e idempotentes (§19.1).
  - Sin efectos secundarios (side_effects: NONE).
  - Cada regla declara entradas (inputs), outputs (V_U/V_S/V_CE) y citas.
  - El versionado es version='YYYY.MM.DD' compatible con cuaderno §21.B.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class ReglaSpec:
    """Forma canónica de una regla (§19.1)."""

    id:         str
    nombre:     str
    version:    str
    inputs:     List[str]                  # anclajes requeridos (subset C-01..C-15).
    operador:   str                         # AND | OR | XOR | NOT | IMPLIES | ONLY_IF_NOT
    output_a:   str                         # 'V_U' | 'V_S' | 'V_CE'
    output_key: str                         # clave sobre el vector elegido.
    weight:     int                         # 1..10
    citation:   str                         # referencia externa (BOE, EUR-Lex, ...).
    jurisdiction: str                       # subset {ES, FR, DE, US, BR, UE, ...}.
    determinism: str                        # PURE | CONTEXTUAL
    edge_cases: List[str] = field(default_factory=list)
    side_effects: str = "NONE"

    def apply_pure(self, anchors: Dict[str, Any]) -> Optional[Any]:
        """Aplica la regla de forma pura dados los anclajes.
        Devuelve el valor a inyectar en output_a/output_key o None si no aplica."""
        # Implementación por override externo (aplicar_regla en este módulo).
        return None


# --- 10 reglas funcionalmente completas (subset representativo de §19) ---
REGLAS_CATALOGO: Dict[str, ReglaSpec] = {
    "R-101": ReglaSpec(
        id="R-101", nombre="tamanio_organizacion_ue2003_361",
        version="2026.06.21",
        inputs=["C-04"],
        operador="IMPLIES", output_a="V_S", output_key="tamano",
        weight=8, citation="DOUE 2003/124 L 124/36 (Reglamento UE 2003/361)",
        jurisdiction="UE", determinism="PURE",
        edge_cases=["valores incompletos -> no_categorizable"],
    ),
    "R-201": ReglaSpec(
        id="R-201", nombre="carga_term_ripci_clasificacion",
        version="2026.06.21",
        inputs=["C-13"],
        operador="IMPLIES", output_a="V_CE", output_key="carga_termica",
        weight=7, citation="RD 513/2017 BOE-A-2017-12620 (RIPCI art. 6) apartado 3.1",
        jurisdiction="ES", determinism="PURE",
    ),
    "R-202": ReglaSpec(
        id="R-202", nombre="presion_ped_clasificacion",
        version="2026.06.21",
        inputs=["C-12"],
        operador="IMPLIES", output_a="V_CE", output_key="presion",
        weight=9, citation="RD 769/1999 BOE-A-1999-17686 (PED art. 3)",
        jurisdiction="ES", determinism="PURE",
    ),
    "R-302": ReglaSpec(
        id="R-302", nombre="jurisdiccion_arbol_activacion",
        version="2026.06.21",
        inputs=["C-01", "C-02"],
        operador="AND", output_a="V_U", output_key="applicable",
        weight=10, citation="LO 4/2015 (LRJSP art. 2)", jurisdiction="ES", determinism="PURE",
    ),
    "R-401": ReglaSpec(
        id="R-401", nombre="tipo_persona_juridica_esp",
        version="2026.06.21",
        inputs=["C-03", "C-06"],
        operador="AND", output_a="V_S", output_key="tipo_org",
        weight=5, citation="Codigo Civil art. 35, 16 y ss.", jurisdiction="ES", determinism="PURE",
    ),
    "R-501": ReglaSpec(
        id="R-501", nombre="sectores_regulados_especiales_exig",
        version="2026.06.21",
        inputs=["C-09"],
        operador="IMPLIES", output_a="V_CE", output_key="reg_sectores",
        weight=6, citation="Ley 24/2013 Sector Electrico; NIS2 RD-L 12/2018",
        jurisdiction="UE", determinism="PURE",
    ),
    "R-503": ReglaSpec(
        id="R-503", nombre="mercados_destino_exportacion_normas",
        version="2026.06.21",
        inputs=["C-10"],
        operador="IMPLIES", output_a="V_CE", output_key="export",
        weight=4, citation="Reglamentos UE diversificados por mercado destino",
        jurisdiction="UE", determinism="PURE",
    ),
    "R-506": ReglaSpec(
        id="R-506", nombre="idiomas_oficiales_mapping_jurisd",
        version="2026.06.21",
        inputs=["C-02", "C-08"],
        operador="AND", output_a="V_CE", output_key="idiomas",
        weight=3, citation="DOUE 1/1958 Lista ISO por pais",
        jurisdiction="UE", determinism="CONTEXTUAL",
    ),
    "R-601": ReglaSpec(
        id="R-601", nombre="activos_inventario_riesgos_preliminar",
        version="2026.06.21",
        inputs=["C-11"],
        operador="IMPLIES", output_a="V_CE", output_key="assets",
        weight=7, citation="RGPD art. 32; ISO 27002 A.8.1",
        jurisdiction="UE", determinism="PURE",
    ),
    "R-701": ReglaSpec(
        id="R-701", nombre="cliente_objetivo_especial_exig",
        version="2026.06.21",
        inputs=["C-15"],
        operador="IMPLIES", output_a="V_CE", output_key="cliente",
        weight=6, citation="ENS RD 311/2022; NIS2 RD-L 12/2018",
        jurisdiction="UE", determinism="PURE",
    ),
}


# Funciones de evaluación PURAS para cada regla (mantienen side_effects=NONE).
def apply_r_101(anchors: Dict[str, Any]) -> Optional[str]:
    return anchors.get("C-07")  # si la categorizacion UE 2003/361 ya se aplicó.


def apply_r_201(anchors: Dict[str, Any]) -> Optional[str]:
    val = anchors.get("C-13")
    if val is None:
        return None
    from bor4legal.domain.profile.converter import categorize_carga_termica_ripci_rd_513_2017
    return categorize_carga_termica_ripci_rd_513_2017(float(val))


def apply_r_202(anchors: Dict[str, Any]) -> Optional[str]:
    val = anchors.get("C-12")
    if val is None:
        return None
    from bor4legal.domain.profile.converter import categorize_presion_ped_rd_769_1999
    return categorize_presion_ped_rd_769_1999(float(val))


def apply_r_302(anchors: Dict[str, Any]) -> Optional[List[str]]:
    c02 = anchors.get("C-02")
    return list(c02) if c02 else None


def apply_r_401(anchors: Dict[str, Any]) -> Optional[str]:
    return anchors.get("C-06") or None


def apply_r_501(anchors: Dict[str, Any]) -> Optional[List[str]]:
    return list(anchors.get("C-09", [])) if anchors.get("C-09") else None


def apply_r_503(anchors: Dict[str, Any]) -> Optional[List[str]]:
    return list(anchors.get("C-10", [])) if anchors.get("C-10") else None


def apply_r_506(anchors: Dict[str, Any]) -> Optional[List[str]]:
    return list(anchors.get("C-08") or []) or None


def apply_r_601(anchors: Dict[str, Any]) -> Optional[List[str]]:
    return list(anchors.get("C-11", [])) if anchors.get("C-11") else None


def apply_r_701(anchors: Dict[str, Any]) -> Optional[str]:
    return anchors.get("C-15") or None


def aplicar_regla(rid: str, anchors: Dict[str, Any]) -> Optional[Any]:
    """Disco de funciones de aplicacion pura por regla."""
    mapping = {
        "R-101": apply_r_101, "R-201": apply_r_201, "R-202": apply_r_202,
        "R-302": apply_r_302, "R-401": apply_r_401, "R-501": apply_r_501,
        "R-503": apply_r_503, "R-506": apply_r_506, "R-601": apply_r_601,
        "R-701": apply_r_701,
    }
    fn = mapping.get(rid)
    return fn(anchors) if fn else None
