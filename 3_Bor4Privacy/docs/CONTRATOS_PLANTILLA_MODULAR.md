# CONTRATOS_PLANTILLA_MODULAR.md (Privacy v0.3.0)

## Trazabilidad del clon

- **N=5 (orden E del cuaderno v1.5a)**: sustrato **Privacy ISO 27701 + RGPD + LOPDGDD**.
- Cierra el loop SaaS `B4S-procesa-PII`: extiende el gateway `auth.js` + D-002 con un modulo formal de catalogo PII (bases juridicas, retencion, transferencias).
- Vocabulario Privacy-flavored (`pii.*`, `dpia.*`, `oe.*`, `perfil.*`, `catalogo.*`) **diferenciado** de N=1 Legal / N=2 Quality / N=3 Risk para evitar colisiones.

## Los 5 contratos ratificados

### C-IDENTIDAD
- `PlataformaContexto(rol_plataforma, tenant_id, user_id, is_platform_owner, is_superadmin, token_version)` shape IDENTICO al piloto Legal.
- Hidratacion dual: `from_env()` placeholder (modo standalone) | `from_jwt()` con HMAC (modo gateway).
- Propietario de Plataforma: bypass global SaaS (`is_platform_owner=True`).

### C-DATOS
- `BASES_JURIDICAS_VALIDAS` (RGPD art. 6) inmutable: 6 entradas canonicas.
- `RETENCIONES_MAXIMAS_DIAS` inmutable por snapshot_id: `consentimiento_cliente=1825`, `obligacion_legal_facturacion=730`, etc.
- `ADECUADOS_UE` inmutable (RGPD art. 45-46): `adecuado_ue`, `scc_firmadas`, `epp_certificado`, `bcr_vinculante`, `exencion_art49`.
- Catalogo externo versionado por snapshot_id (RGPD art. 30 registro de actividades).

### C-DESPLIEGUE
- `pyproject.toml` (`bor4privacy v0.3.0`) con `dependencies=[]` y `requires-python>=3.10`.
- CLI argparse: `--token`, `--token-secret`, `--snapshot-id`; exit 3 si `--token` sin `--token-secret`.
- Modo standalone: ejecuta sin gateway B4S (placeholder).
- Modo gateway: `B4S_JWT` + `B4S_JWT_SECRET` en subshell hidrata `PlataformaContexto`.

### C-BITACORA
- OE firmable con D12 hash inmutable: `sha256(rule_id\nsnapshot_id\njson.dumps(v_f, sort_keys=True)\nplantilla_id\nidioma)`.
- 3 plantillas DPIA (sin solapamiento con N=1 Legal):
  - `RGPD_DPIA_TRIGGER` (RGPD art. 35).
  - `RGPD_DPIA_5SECCIONES` (RGPD art. 35(7)).
  - `RGPD_TRANSFERENCIA_FUERA_UE` (RGPD cap. V).
- ev endiannes_open = True (orden canonico del JSON incluye todos los campos del V_F).

### C-HASH-TEMPLATE
- D12 incluye `template_id_used` y `idioma` (NO `body` post-renderizado) -> el hash es invariante ante cambio de whitespaces en blanco.
- Cambiar plantilla invalida el hash (anti-tampering) verificado con `test_d12_hash_inmutable`.

## D-002 propagacion (sha-gateway)

- `security/integration.py` shim IDENTICO al piloto Legal / clones Quality/Risk (mismas funciones `from_jwt`, `sign_internal_headers`, `verify_internal_headers`, `from_env`).
- Helper `_hdr_coherence` aplicado a Tenant-Id / User-Id / Rol (Token-Version omitido por ser informativo).
- JWT firmado por BOR4SIGE gateway `auth.js` con: `alg=HS256`, claim `is_platform_owner`, `token_version` (revocacion por cambio de contrasena).

## M1 DPIA pivot (sin solapamiento con N=1 Legal)

- **Substrate**: validacion TAXONOMICA contra catalogos externos inmutables por snapshot_id.
- **Plantillas DPIA baked-in**: las 3 plantillas `RGPD_DPIA_*` son NO intercambiables con N=1 Legal (que usa `C-XX` Reclamacion/RequisitoLegal/cliente).
- **Reglas P-101/P-201/P-301**: orientadas a RGPD art. 35 + cap. V (transferencias fuera UE con SCC + EPP).
- **Diferenciacion respecto N=1 Legal**: Privacy NO evalua anclas escalares `C-XX`; Quality NO evalua plantillas `tpl-Q-*`; Risk NO lista computacional `R-01..R-05`.

## Smoke E2E (9 tests)

- `test_pipeline_P101_P201_P301_disparadas`
- `test_regla_P101_perfil_bajo_NO_dispara`
- `test_plantilla_DPIA_5SECCIONES_estructura`
- `test_d12_hash_inmutable` (con anti-tampering check)
- `test_catalogos_inmutables_v0_3_0`
- `test_rbac_Propietario_de_Plataforma_allow_oe_leer`
- `test_rbac_USUARIO_sin_caps_es_DENY`
- `test_cli_VERSION_y_perfiles_constantes`
- `test_cli__run_all_match_expected_con_Propietario`

## Hardening v0.3.3 backdrop

- Este clon hereda la propagacion v0.3.3 (JWT confusion attacks) del piloto Legal: `test_integration.py` (17 tests = 10 base + 5 + 2 tampering) copiado via sed selectivo `bor4legal` -> `bor4privacy`.

## Versionado

- 0.1.0: esqueleto inicial (4 archivos en `pyproject.toml` + `__init__.py` + `types.py` + `integration.py`).
- 0.3.0: cierre homologo al patron (5 archivos mas: `rbac.py` + `reglas.py` + `oe_renderer.py` + `cli.py` + test_smoke_e2e.py + tests/cantera/__init__.py + docs).
