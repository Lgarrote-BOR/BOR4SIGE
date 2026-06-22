# Contratos del Patron Modular BOR4SIGE (Plantilla Piloto 2_Bor4Legal)

> **Estado:** generado el 2026-06-21 al cerrar el piloto A.
> **Rol:** plantilla contractual aplicable a cualquier modulo que BOR4SIGE
> decida extraer en el futuro (Quality, Env, Risks, ...).
> **Predecesor:** cuaderno v1.5a (§24 RBAC) + nota fundadora 2026-06-21
> (modularizacion, ISO 14001:2026 / ISO 9001:2026 inminentes, scope iso).
> **Fase actual:** D-001 + D-001-A (independiente). Hasta la palabra
> **"integra"** estos contratos son locales al modulo.

---

## Predecesor conceptual

- **v1.5a cuaderno §24 RBAC** - 4 roles del modulo + 2 roles plataforma.
- **Opinion fundadora 2026-06-21** - orden A (cerrar piloto), 4 contratos.
- **Orden A** - piloto cerrado antes de expansion a 2-3 modulos.

## Como se valida el patron

A 2026-06-21 los 4 contratos quedan **ratificados** en `2_Bor4Legal/`:

- [x] C-IDENTIDAD ratificado (modulo NO lee `usuarios` B4S).
- [x] C-DATOS ratificado (prefijo `legal_`; catalogos `lkp_*`; sin JOIN SQL).
- [x] C-DESPLIEGUE ratificado (pyproject.toml propio; proxy `/legal/*`).
- [x] C-BITACORA ratificado (`correlation_id` UUID v4; L2 amnesia §24.7).

El piloto entrega **runnable end-to-end** (CLI + tests) sin tocar BOR4SIGE.

---

## 1. C-IDENTIDAD - Como comparte el modulo la autenticacion

### 1.1 Estado actual (piloto 2_Bor4Legal / D-001 + D-001-A)

- El modulo **NO** lee la tabla `usuarios` de BOR4SIGE (auth.js).
- Identidades y sesiones se gestionan localmente. Hasta la palabra
  "integra", el modulo emite `PlataformaContexto.token_version` como
  **placeholder local**; la sincronizacion real con el `token_version`
  de BOR4SIGE `usuarios` entra en D-002 a traves de la cabecera
  **X-Internal-Token-Version** firmada por el gateway B4S (HMAC de un
  trust network interno). Hoy una sesion del piloto puede declararse
  revocada localmente, pero la propagacion aguas arriba la hara BOR4SIGE.
- Cualquier sesion expira a `T+2h` (analogo a JWT `expiresIn: '2h'`).
- `PlataformaContexto` declara el rol de plataforma del usuario:
  - **R-PLAT-1:** Propietario de Plataforma (alcance `*`).
  - **R-PLAT-2:** Superadministrador (alcance tenant + conmutacion
    `X-Tenant-ID`).
  - usuario normal.

### 1.2 Despues de "integra" (D-002)

- BOR4SIGE actua como **gateway**. Valida el JWT con `auth.js`
  (incluye `token_version`, `is_platform_owner`, `tenant_id`).
- BOR4SIGE **incrementa** `token_version` al aceptar `changePassword`
  (auth.js: `UPDATE usuarios SET ... token_version = ...+1`).
- BOR4SIGE reenvia al modulo cabeceras firmadas en una trust network:
  - `X-Internal-User-ID`
  - `X-Internal-Roles` (CSV: `R-MOD-1,R-MOD-3,...`)
  - `X-Internal-Tenant`
  - `X-Internal-Snapshot`
- El modulo **NO** re-valida identidad. Confia en la cadena.
- Si `auth.js` rechaza el JWT por `token_version` desincronizado,
  la peticion **NO** llega al modulo.

### 1.3 Contrato formal

```
contrato C-IDENTIDAD {
    modulo_externo := {
        leer_BD_usuarios_B4S:    False
        recibir_X_Internal_*:    True   // post-"integra"
        revalidar_JWT_localmente: False
        rotar_secretos_localmente: una sola vez al arranque.
    }

    gateway_B4S := {
        leer_BD_usuarios_B4S:    True
        emitir_JWT_firmado:       True   // auth.js sign
        propagar_token_version:   True
        propagar_roles_modulo:    True
    }

    revocacion := {
        cambio_pwd_B4S:    "auth.js incrementa token_version"
        propagacion:        "gateway rechaza aguas arriba; no-op local"
    }
}
```

---

## 2. C-DATOS - Que tablas son compartidas vs aisladas

### 2.1 Tablas compartidas (gestionadas por BOR4SIGE)

- `organizations` (id, name, compliance, trend, ...).
- `users` / `usuarios` (autenticacion; cifra bcrypt via auth.js).
- `personal` (directorio).
- `audit_log_central` (bitacora centralizada tras "integra"; ancla C-BITACORA).

### 2.2 Tablas aisladas del modulo (gestionadas por `2_Bor4Legal/`)

- **Catalogos externos** (inmutables por `snapshot_id`; §21 del cuaderno):
  `lkp_jurisdicciones`, `lkp_actividades`, `lkp_normativa`,
  `lkp_reglas`, `lkp_ue`, `lkp_us_federal`, `lkp_us_states`,
  `lkp_tecnica_une`.
- **Resultados del modulo** (firmables):
  - `oe_emitidas` (cada OE con `oe_snapshot_hash` reproducible).
  - `perfiles_cantera` (tests; sin PII bajo §18.3).
  - `evaluaciones_l2` (trazas de reproducciones admin con amnesia).

### 2.3 Tablas interseccion (cruzadas controlado)

- Cualquier campo del modulo que necesite relacion organizacion -> modulo:
  - Lleva **prefijo `legal_`** para no colisionar con tablas B4S.
  - La foreign key es **logica**: `'tenant_id'` que coincide con
    `organizations.id` de B4S.
  - **Nunca** se hace JOIN SQL cruzado B4S <-> modulo.
  - Si BOR4SIGE expone un endpoint o replica por eventos, el modulo
    consume esa interfaz sin acoplamiento de BD.

### 2.4 Por que este aislamiento

- BOR4SIGE puede migrar de MariaDB a otra cosa sin tocar el modulo.
- El modulo puede migrar su BD aislada sin tocar BOR4SIGE.
- Las copias de seguridad, los snapshots y las auditorias siguen
  siendo **independientes**.
- La privacidad por construccion (§18.3 + RGPD art. 5(1)(c)) vive dentro
  del modulo; B4S no ve PII rechazada.

### 2.5 Contrato formal

```
contrato C-DATOS {
    tablas_compartidas    := [organizations, users, personal, audit_log_central]
    tablas_aisladas_modulo := [lkp_*, oe_emitidas, perfiles_cantera, evaluaciones_l2]
    prefijo_modulo         := "legal_"
    fk_strategy            := "tenant_id_logic"
    pii_in_log             := forbid
    catalogo_inmutable_snapshots := True
}
```

---

## 3. C-DESPLIEGUE - Que se actualiza sin reiniciar el resto

### 3.1 Estado actual (piloto)

- `2_Bor4Legal/` tiene su propio `pyproject.toml` (v0.1.0) con deps
  **exclusivamente stdlib** - sin `mysql2`, `bcrypt`, `helmet`, etc.
- `pip install -e .` no afecta a `1_App_BOR4SIGE/`.
- Tests en `tests/cantera/` ejecutan standalone con
  `PYTHONPATH=src python -m pytest`.
- Catalogos versionados por `snapshot_id`; cambiar snapshot no requiere
  reinstalar nada.

### 3.2 Despues de "integra"

- El modulo se expone detras de un **proxy inverso**:
  - Ruteo: `https://bor4d.com/legal/*` -> modulo externo.
  - El resto (`/api/*`, `/admin/*`) sigue yendo a BOR4SIGE.
- BOR4SIGE puede reiniciarse **sin reiniciar el modulo** y viceversa.
- El modulo se actualiza sin perder sesiones B4S activas (porque la
  auth vive en B4S y el JWT solo se valida aguas arriba).
- Las migraciones internas del modulo (p. ej. anadir un catalogo) no
  tocan B4S.
- Si BOR4SIGE despliega una nueva version, el modulo **sigue
  sirviendo** hasta que BOR4SIGE enrute a un nuevo release del modulo.

### 3.3 Contrato formal

```
contrato C-DESPLIEGUE {
    binario_propio              := True
    deps_propio                 := True
    proxy_inverso               := "/legal/*"
    reindependiente_B4S         := True
    update_sin_reinicio_B4S     := True
    catalogos_versionados       := True
    migracion_no_coordinada     := True
}
```

---

## 4. C-BITACORA - Como se propaga correlation_id cross-modulo

### 4.1 Estado actual (piloto)

- Cada accion del modulo (convert / evaluate / render / rbac check)
  emite un **evento** con campos:
  - `bitacora_id` (UUID v4).
  - `timestamp` (RFC 3339 UTC).
  - `correlation_id` (UUID v4 - **mismo** durante el flujo completo).
  - `actor_rol_plat` (R-PLAT-* o usuario).
  - `actor_rol_mod` (R-MOD-* o none).
  - `action` (string mnemonico).
  - `recurso` (id OE | id regla | id snapshot).
  - `permission_scope` (snapshot del `CapaScope` evaluado).
  - `outcome` (`success | denied | error`).
  - `pii_redaction_status` (`none | filtered_by_blacklist | level2_admin_replay`).
- Eventos L0/L1 -> `/tmp/bor4legal_normal.log` (retention 7 anos).
- Eventos L2 (reproducciones admin con PII) -> `/tmp/bor4legal_l2.log`
  bajo amnesia nitida (§24.7.C).
- `correlation_id` permite replay bit-a-bit (§20.4.B + §22.6.B).

### 4.2 Despues de "integra"

- BOR4SIGE centraliza bitacora en `audit_log_central`.
- El modulo envia eventos a una **cola** o a un POST firmado contra
  `https://bor4d.com/legal/audit-events` (endpoint dedicado aguas arriba).
- El modulo firma sus eventos con **HMAC-SHA256** sobre `(timestamp +
  correlation_id + payload_canonico)`; la clave es una por-modulo
  inyectada por BOR4SIGE al despliegue (`BOR4LEGAL_HMAC_KEY`). La
  clave **NO** se transmite en el payload, solo en cabecera
  `X-Bor4Legal-Signature`.
- Recepcion por parte de BOR4SIGE: `audit_log_central` valida la firma,
  deduplica por `(timestamp, correlation_id, action)`, y asocia el
  `correlation_id` con la peticion HTTP original (para trazabilidad
  end-to-end cross-modulo).
- Eventos de L2 (con PII reenviada bajo amnesia nitida) llegan con
  `pii_redaction_status="level2_admin_replay"` y permanecen bloqueados
  hasta que el admin con rol R-MOD-1 (Auditor) los solicite explicitamente.
- **No-op local**: una vez BOR4SIGE ha aceptado el evento, el modulo
  puede borrarlo de su buffer local (`/tmp/bor4legal_normal.log`). La
  fuente autoritativa es `audit_log_central`.
- Garantia de propagacion: si la cola o el POST cae, BOR4SIGE reintenta
  3 veces con backoff exponencial (1s, 4s, 16s). Si tras 3 reintentos
  sigue caido, el modulo marca el evento como `pending_replay` para
  reenvio offline al siguiente arranque.

### 4.3 Contrato formal

```
contrato C-BITACORA {
    evento_shape          := {bitacora_id, timestamp, correlation_id, actor_*, action, recurso, outcome, pii_redaction_status}
    correlation_id_format := UUID4
    emision_firma         := HMAC-SHA256(timestamp || correlation_id || payload_canonico, key=modulo_injected)
    endpoint_ingesta      := POST /legal/audit-events
    deduplicacion         := (timestamp, correlation_id, action) unique
    replay_L2             := "audit_log_central expone bitacora filtrada a R-MOD-1 bajo amnesia §24.7"
    no_op_local_despues_ack := True
    reintentos            := 3 con backoff 1s, 4s, 16s    estado_fallo_replay   := pending_replay
}
```

---

## 5. C-HASH-TEMPLATE (D12) - Reproducibilidad bit-a-bit desacoplada del texto

### 5.1 Problema

El `oe_snapshot_hash` cubria el dict literal del template (texto + cita
externa). Cualquier correccion tipografica o mejora de redaccion en
`OE_PLANTILLAS` invalidaba TODAS las OE firmadas previamente,
friccionando evolucion legitima de la prosa SIN alterar la "intencion
regulatoria" (que ya esta fijada por `rule_id + V_F + snapshot_id`).

### 5.2 Decision adoptada: Opcion A (template_id versionado en el hash)

- `OE_PLANTILLAS` se versiona por id: `"tpl-R-101-v1"`,
  `"tpl-R-101-v2"`, etc.
- Router `_REGLAS_TPL_VERSION` mapea `rule_id -> template_id` activo.
  Bump = editar router + nueva entrada `tpl-X-vN+1`.
- El `oe_snapshot_hash` se calcula sobre el payload:
  `{rule_id, snapshot_id, v_f_dict, template_id_used, idioma}`.
- **NO** incluye el texto literal del template.
- La OE firmada registra `template_id_used` en su dataclass. Su
  reproduccion bit-a-bit exige `(anchors_snapshot, template_id) + texto
  archivado en Git` correspondiente.

### 5.3 Por que A y no las alternativas

| Opcion | Veredicto |
|---|---|
| **(A)** template_id en hash, texto fuera | **ADOPTADA.** Equilibrio entre reproducibilidad y evolutividad. Replicable al clon del patron (Quality/Env/Risks). |
| (B) Hash solo de canonicos sin template | Descartada. El auditor firma "que reglas aplican Y que dice la OE", no solo "que reglas aplican". ISO 27001 A.12.4.1 rota. |
| (C) Acoplamiento estricto + bump por release | Descartada. Obliga a archivar cada typo como nueva version; fricciona correcciones legitimas y rompe la simetria con la realidad linguistica del piloto. |

### 5.4 Garantia de evidencia del texto literal

- Aunque el hash no incluye el texto, la fuente autoritativa del
  "como se redacto la OE" es **Git history** del archivo
  `src/bor4legal/engine/oe_renderer.py`. Cada `template_id`
  corresponde a un commit concreto.
- Cross-check en auditoria externa: una OE firmada con
  `template_id_used="tpl-R-101-v1"` se reproduce con pickaxe sobre
  Git history (robusto a inserciones, modificaciones y renombrados):
  ```bash
  # 1. Localizar el commit que introdujo/modifico la entrada tpl-R-101-v1.
  git log --all -p -S 'tpl-R-101-v1' -- src/bor4legal/engine/oe_renderer.py \
    | grep -E '^(commit |diff --git)' | head -20

  # 2. Tomar el sha del commit candidato y recuperar el texto literal
  #    archivado en ese instante del repositorio.
  sha=$(git log --all --format='%H' -S 'tpl-R-101-v1' \
        -- src/bor4legal/engine/oe_renderer.py | head -1)
  git show "${sha}:src/bor4legal/engine/oe_renderer.py"
  ```
- Cross-check alternativo (cuando se sospecha de merges conflictivos):
  `git log --all --reverse --diff-filter=AM -S 'tpl-R-101-v1' -- \
   src/bor4legal/engine/oe_renderer.py | head -50`.
- La bitacora L0 post-"integra" (`audit_log_central` en BOR4SIGE,
  contrato 4.2) registra cada deploy con su SHA de Git, anclando el
  `template_id` activo a un instante inequivoco. Anula repudio.

### 5.5 Riesgos residuales

- **Repudio debil**: un actor podria argumentar "el hash no cubre el
  texto, pudo haber cambiado". Mitigado por Git history + L0 de
  despliegues (§4.2).
- **Bump inadvertido**: editar el router sin querer eleva
  template_id. Mitigado por code-review obligatorio y los tests D12
  que detectan cambios de hash por bump.
- **Carga operativa del bump**: editar router + crear nueva entrada
  + commit + code-review. Aceptable y trazable en Git.

### 5.6 Contrato formal

```
contrato C-HASH-TEMPLATE {
    plantilla_key             := template_id              # ej. "tpl-R-101-v1"
    router_activo             := rule_id -> template_id
    snapshot_hash_payload     := {rule_id, snapshot_id, v_f_dict, template_id_used, idioma}
    snapshot_hash_NO_cubre    := "texto literal de plantilla"
    oe_campos_versionados     := ["template_id_used"]
    fuente_texto_autoritativa := "git_history@commit_en_bitacora_L0"
    requisitos_para_bump      := ["code_review", "test_D12_detecta_hash_cambio"]
}
```

### 5.7 Validacion

- 4 tests nuevos en `tests/cantera/test_engine.py` cierran D12:
  - `test_oe_lleva_template_id_used_poblado_en_todas_las_oes`
  - `test_oe_snapshot_hash_inmune_a_typo_en_texto`
  - `test_oe_snapshot_hash_cambia_con_bump_de_template_id`
  - `test_reproduccion_bit_a_bit_con_template_archivo`
```



## 6. D-002 INTEGRA - Puente real con el gateway BOR4SIGE

> **Cerrado el 2026-06-21 v0.3.0 del piloto Legal.**
> **Complementa lo descrito en §1.2 ("despues de integra") sin tocar el gateway.**

### 6.1 Modulo nuevo: `security/integration.py`

Peer de `rbac.py` (NO rompe piloto: la API existente convive):

| Funcion | Proposito | Garantia |
|---|---|---|
| `from_jwt(jwt_str, secret, leeway_seconds=30)` | Parsea + verifica HS256 del `auth.js` B4S. Devuelve `PlataformaContexto`. | Valida firma con `hmac.compare_digest`; rechaza `alg != HS256`, `exp` vencido, split != 3. Levanta `ValueError` con codigo legible. |
| `sign_internal_headers(ctx, secret, ttl_seconds=60)` | Emite dict `X-Internal-Tenant-Id`/`User-Id`/`Rol`/`Token-Version`/`Timestamp`/`Expires`/`Signature`/`Body` firmado HMAC-SHA256. | Body canonico JSON `sort_keys=True, separators=(",", ":")`; permite propagar identidad entre clones SIN exponer el JWT bruto. |
| `verify_internal_headers(headers, secret)` | Inverso de `sign_internal_headers`: valida HMAC + ttl + decodifica body. | Cualquier alteracion de la cabecera rompe la firma. |
| `from_env()` | Lee `B4S_JWT` + `B4S_JWT_SECRET`; hidrata contexto real o cae al placeholder. | Mantiene el piloto ejecutable standalone sin necesidad de gateway. |
| `to_dict(ctx)` | Serializa `PlataformaContexto` para JSON/log. | Sin PII fuera de los campos ya conocidos. |

### 6.2 Politica de seguridad adoptada

| Caracteristica | Mecanismo | Norma de referencia |
|---|---|---|
| Verificacion firma     | HMAC-SHA256 + `hmac.compare_digest`     | ISO 27001 A.9.2.3 / NIST SP 800-107 |
| Exp claim obligatorio  | jsonwebtoken lo incluye en `auth.js`    | RFC 7519 §4.1.4 |
| Leeway de reloj        | 30s (configurable)                      | RFC 7519 §4.1.5 / OWASP JWT cheat sheet |
| Token version checkup  | Propagado a `PlataformaContexto`        | ISO 27001 A.9.2.3 (revocacion al cambiar password) |
| Tampering defensa      | Body cubierto por HMAC; cambiar `X-Internal-Tenant-Id` invalida la firma | RFC 6234 §5.2 |
| Tenant en cabecera     | Cubierto por HMAC                       | Defensa en profundidad |

### 6.3 Compatibilidad de API

`PlataformaContexto` (de `rbac.py`) NO recibe campos nuevos. `from_jwt()`
construye un `PlataformaContexto` con los campos que ya existian:
`rol_plataforma`, `tenant_id`, `user_id`, `is_platform_owner`,
`is_superadmin`, `token_version`.

Esto preserva el contrato del piloto: cualquier codigo que hoy construye
un `PlataformaContexto` literal sigue funcionando; solo se remplaza la
fuente del dato (placeholder vs JWT real).

### 6.4 CLI: opt-in via `--token`

- `python -m bor4legal.cli perfil.json` (sin args nuevos):
  comportamiento identico al v0.2.0 (placeholder).
- `python -m bor4legal.cli perfil.json --token <JWT> --token-secret <SECRET>`:
  hidrata el `PlataformaContexto` desde el JWT. Sin `--token-secret`,
  exit code = 3 con mensaje de error explicito.

Si `--token` no se pasa, `from_env()` mira `B4S_JWT`/`B4S_JWT_SECRET`
en el entorno del subshell. Asi:
  - El piloto sigue ejecutable standalone, sin necesidad de gateway.
  - En produccion, el gateway B4S inyecta `B4S_JWT` + `B4S_JWT_SECRET`
    al subshell del modulo y el `token_version` se propaga automaticamente.
  - Tests generan JWTs de prueba con HMAC-SHA256 + exp para validar
    `from_env()` end-to-end sin tocar `auth.js`.

### 6.5 Tests nuevos (10 escenarios)

`tests/cantera/test_integration.py` cierra D-002:

1. `test_from_jwt_valid_propietario_pasa` - JWT con todos los claims de Propietario de Plataforma decodifica `is_platform_owner=True, is_superadmin=True, rol=Propietario`.
2. `test_from_jwt_expired_rechaza` - `exp` vencido levanta `ValueError("expirado")`.
3. `test_from_jwt_bad_signature_rechaza` - firma invalida levanta `ValueError("firma")`.
4. `test_from_jwt_malformed_rechaza` - 3 variantes: split != 3, jwt vacio, secret vacio.
5. `test_internal_headers_hmac_roundtrip` - sign + verify producen contexto identico para todos los campos.
6. `test_internal_headers_tampered_tenant_rechaza` - alterar `X-Internal-Tenant-Id` rompe la firma -> `ValueError("firma")`.
7. `test_from_env_sin_vars_devuelve_placeholder` - sin env vars cae al placeholder (modo standalone preservado).
8. `test_from_env_con_vars_hidrata_real` - con env vars hidrata contexto real con `token_version=5` y rol Superadmin.
9. `test_token_version_propagation_no_es_placeholder` - el `token_version` del contexto real (42) != del placeholder (0).
10. `test_rbac_propietario_es_global_ALLOW` - RBAC acepta capacidades en cualquier tenant cuando `is_platform_owner=True`, cerrando §24.3.

### 6.6 Shims en clones hermanos

`3_Bor4Quality/src/bor4quality/security/integration.py` y
`3_Bor4Risk/src/bor4risk/security/integration.py` son **copias
identicas** al piloto. Cada clon es self-contained (import relativo
`.rbac` resuelve a su paquete local).

Propagacion a esos clones (modificar `cli.py` para que acepte `--token`)
queda anotada como **DEFER v0.2** en sus cuadernos respectivos. El piloto
Legal fija el contrato; los demas lo copy-pastean con su `PlataformaContexto` local.

### 6.7 Validacion final D-002

- AST estricto: `ALL_OK: True` en integration.py (3 copias), cli.py, test_integration.py.
- Pytest: `tests/cantera/` 4/4 previos (test_smoke_e2e.py) + 10/10 nuevos (test_integration.py) = **14/14 verde**.
- Smoke CLI sin --token: ejecuta con placeholder del piloto (no rompe compat).
- Smoke CLI con --token: hidrata contexto real desde JWT generado por test; output incluye snapshot_hash_v_f inmutable y rbac_audit[] coherente con el rol real del Propietario.
