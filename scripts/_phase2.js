const fs = require('fs');
// Single bounded patch script that is idempotent (checks before applying).
const inf = '4_Documentos/INFORME_AUDITORIA_2026-06-20.md';
let s = fs.readFileSync(inf, 'utf8');
if (s.includes('| 5.1 | Modelo relacional |')) {
  s = s.replace(/\| 5\.1 \| Modelo relacional \| [^\n]+\n/, '| 5.1 | Modelo relacional | \u2705 Validado E2E | Modelo E-R validado en vivo por `npm run smoke:db` (4 fases + integridad CASCADE/SET NULL sintetica). Catalogo canonico en `tests/fixtures/expected_manifest.json` y CI en `.github/workflows/smoke-db.yml` |\n');
}
if (s.includes('| 5.4 | Sin tests')) {
  s = s.replace(/\| 5\.4 \| Sin tests( \+ CI)? \| [^\n]+\n/, '| 5.4 | Sin tests + CI | \u2705 Corregido | `npm test` (7 pruebas unitarias) + `npm run smoke:db` (smoke E2E del esquema). CI en `.github/workflows/smoke-db.yml` ejecutandose en cada PR, push a `main` y lunes 06:00 UTC contra `mariadb:lts` |\n');
}
if (!s.includes('Verificacion automatizada del esquema (cierre 2026-06-20)')) {
  s += '\n\n### Verificacion automatizada del esquema (cierre 2026-06-20)\n\nTras el cierre del informe se incorporaron `1_App_BOR4SIGE/scripts/smoke_test_db.js` y `1_App_BOR4SIGE/tests/fixtures/expected_manifest.json` para validar el modelo E-R contra MariaDB limpio, ademas del workflow `.github/workflows/smoke-db.yml` que lo ejecuta en cada PR, push a `main` y lunes 06:00 UTC. Los items 5.1 y 5.4 quedan asi **validados de forma automatizada y continua**; cualquier regresion futura rompe el PR antes del merge. La recuperacion requiere editar el manifiesto canonico cuando se anada una tabla o `lkp_*`, o corregir el script correspondiente si la regresion es involuntaria.\n';
}
fs.writeFileSync(inf, s);
console.log(inf, 'OK');
const aud = '4_Documentos/Auditoria_BD_SIGE.md';
let sa = fs.readFileSync(aud, 'utf8');
if (!sa.includes('## 6. Verificacion automatizada del esquema')) {
  sa += '\n\n---\n\n## 6. Verificacion automatizada del esquema E-R (smoke test)\n\nComo complemento al analisis estatico de este informe, el modelo relacional se valida en vivo sobre un MariaDB limpio ejecutando:\n\n```bash\ncd 1_App_BOR4SIGE\nnpm run smoke:db\n```\n\nEl smoke recorre los 4 scripts canonicos del esquema y contrasta contra `tests/fixtures/expected_manifest.json`. Las verificaciones finales insertan filas deterministas en `organizations`, `documents`, `users` y `lkp_status` y validan tres invariantes:\n\n- **CASCADE** - `organizations.id` -> `documents.tenant_id` purga filas hijas al borrar el padre.\n- **SET NULL** - `organizations.id` -> `users.tenant_id` mantiene la fila superviviente con FK a `NULL`.\n- **SET NULL** - `lkp_status.id` -> `users.status_id` mantiene la fila con FK a `NULL`.\n\nLa ejecucion automatica vive en `.github/workflows/smoke-db.yml` y corre `mariadb:lts` como servicio en cada PR, push a `main` y lunes 06:00 UTC. Drift silencioso se bloquea antes del merge. Cumplimiento de la medida **mp.info.3 del ENS** (gestion de la configuracion / infraestructura como codigo).\n';
  fs.writeFileSync(aud, sa);
  console.log(aud, 'OK');
}
const rel = '4_Documentos/Relacion_Tablas_SIGE.md';
let sr = fs.readFileSync(rel, 'utf8');
if (!sr.includes('## 6. Verificacion automatizada del esquema')) {
  sr += '\n\n---\n\n## 6. Verificacion automatizada del esquema E-R\n\nEl catalogo descrito en este documento constituye la **fuente unica de verdad** del backend de Bor4SIGE. Para validar en vivo:\n\n```bash\ncd 1_App_BOR4SIGE\nnpm run smoke:db\n```\n\nEl `scripts/smoke_test_db.js` (1) carga `tests/fixtures/expected_manifest.json` con la declaracion canonica de las 18 tablas `lkp_*`, 26 tablas maestras y 22 multi-tenant con CASCADE; (2) ejecuta los 4 scripts canonicos del esquema sobre un MariaDB limpio; (3) compara los metadatos de `INFORMATION_SCHEMA` con el manifiesto; (4) ejecuta las pruebas de integridad sintetica CASCADE/SET NULL; (5) **aborta si detecta cualquier divergencia** entre el escenario materializado y el esperado.\n\nEl workflow GitHub Actions `.github/workflows/smoke-db.yml` levanta `mariadb:lts` como servicio en cada PR, push a `main` y lunes 06:00 UTC. Cualquier regresion rompe el PR antes del merge.\n';
  fs.writeFileSync(rel, sr);
  console.log(rel, 'OK');
}
const mu = '4_Documentos/manual_de_uso.md';
let sm = fs.readFileSync(mu, 'utf8');
if (!sm.includes('## 26. Verificacion tecnica del esquema')) {
  sm += '\n\n---\n\n## 26. Verificacion tecnica del esquema (administradores)\n\nPara validar que el modelo E-R cumple las especificaciones (claves UUID `CHAR(36)`, FKs CASCADE/SET NULL, integridad referencial):\n\n```bash\ncd 1_App_BOR4SIGE\nnpm run smoke:db\n```\n\nPasos que realiza:\n\n1. Levanta MariaDB limpio (o usa la base `bor4sige` vacia).\n2. Ejecuta en orden los 4 scripts canonicos del esquema.\n3. Compara el resultado contra `tests/fixtures/expected_manifest.json`.\n4. Verifica las 18 tablas `lkp_*` y 26 tablas maestras con PK estrictamente `CHAR(36)`.\n5. Ejecuta las pruebas sinteticas CASCADE/SET NULL sobre filas deterministas.\n\n**Resultado esperado:** `Resultado global: EN VERDE` y exit code `0`. Si aparece `CON FALLOS`, el mensaje indicara exactamente que tabla, columna o FK diverge. Corregir el script de migracion si es involuntario o actualizar `tests/fixtures/expected_manifest.json` si el cambio es legitimo.\n\nLa ejecucion se automatiza en CI (`.github/workflows/smoke-db.yml`) en cada PR, push a `main` y lunes 06:00 UTC.\n';
  fs.writeFileSync(mu, sm);
  console.log(mu, 'OK');
}
const wr = '3_Plugin_WordPress/bor4sige-wp-addon/readme.txt';
let sw = fs.readFileSync(wr, 'utf8');
sw = sw.replace(/Stable tag: 1\.2\.0/g, 'Stable tag: 1.3.0');
if (!sw.includes('= 1.3.0 =')) {
  sw = sw.replace(`== Changelog ==\n\n= 1.2.0 =`, `== Changelog ==\n\n= 1.3.0 =\n* Notas operativas: el backend Bor4SIGE se valida automaticamente en CI con \`npm run smoke:db\` (cuatro scripts canonicos del esquema + integridad CASCADE/SET NULL sintetica) y \`tests/fixtures/expected_manifest.json\` como manifiesto canonico. Workflow oficial en \`.github/workflows/smoke-db.yml\`.\n* Recordatorio: si el WordPress esta detras de Cloudflare o de un proxy que reescribe cabeceras, anada la IP del proxy a \`CORS_ORIGINS\` para evitar perdida del \`Origin\` y romper la politica frame-ancestors.\n\n= 1.2.0 =`);
}
fs.writeFileSync(wr, sw);
console.log(wr, 'OK 1.2.0 -> 1.3.0 + changelog');
const wp = '3_Plugin_WordPress/bor4sige-wp-addon/bor4sige-wp-addon.php';
let sp = fs.readFileSync(wp, 'utf8');
sp = sp.replace(/\* Version: 1\.2\.0/g, '* Version: 1.3.0');
fs.writeFileSync(wp, sp);
console.log(wp, 'OK Version 1.3.0');
const rd = '5_Web_Corporativa/web_presentacion/README_deploy.md';
let sd = fs.readFileSync(rd, 'utf8');
if (!sd.includes('Verificacion del esquema antes de desplegar')) {
  sd += '\n\n---\n\n## Verificacion del esquema antes de desplegar\n\nAntes de exponer la web de presentacion en produccion, valida que el modelo E-R del backend sigue siendo coherente:\n\n```bash\ncd ../1_App_BOR4SIGE\nnpm run smoke:db\n```\n\nEsperado: `Resultado global: EN VERDE` y exit code `0`. El workflow `.github/workflows/smoke-db.yml` ejecuta esta misma verificacion en cada PR, push a `main` y semanalmente (lunes 06:00 UTC) contra `mariadb:lts`. Cualquier regresion rompe el PR antes del merge, por lo que desplegar la web corporativa en produccion queda cubierta por el mismo gate.\n';
  fs.writeFileSync(rd, sd);
  console.log(rd, 'OK');
}
const ix = '5_Web_Corporativa/web_presentacion/index.html';
let si = fs.readFileSync(ix, 'utf8');
const oldBadge = `<div class="hero-badge">\n      <span class="hero-badge-dot"></span>\n      Sistema Integrado de Gestión Empresarial\n    </div>`;
const newBadge = `<div class="hero-badge">\n      <span class="hero-badge-dot"></span>\n      Sistema Integrado de Gestión Empresarial\n    </div>\n    <div class="hero-quality-badge" style="margin-top:0.5rem;font-family:var(--font-main);">\n      <span style="display:inline
