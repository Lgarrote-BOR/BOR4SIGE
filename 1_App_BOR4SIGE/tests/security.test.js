// tests/security.test.js
// Pure unit tests for:
//   1) Secret-strength policy (auth.js, encryption.js).
//   2) Multi-tenant store guards (server.js).
// No MariaDB or Express required. Runs under `npm test`.
const test = require('node:test');
const assert = require('node:assert');

const auth = require('../auth');
const encryption = require('../encryption');
// server.js exposes its guards; the HTTP listener is gated by require.main===module.
const server = require('../server');

const FIXTURE_OK = 'a'.repeat(48);          // 48 chars: OK in any env
const FIXTURE_SHORT = 'too-short';          // 9 chars: rejected in production
const FIXTURE_DENYLIST = 'change-me';       // denylist value

// ----------------------------------------------------------------
// auth.js :: validateJwtSecret
// ----------------------------------------------------------------

test('auth.validateJwtSecret: accepts >=32 chars in production', () => {
    assert.strictEqual(auth.validateJwtSecret(FIXTURE_OK, true), FIXTURE_OK);
});

test('auth.validateJwtSecret: accepts >=32 chars in development', () => {
    assert.strictEqual(auth.validateJwtSecret(FIXTURE_OK, false), FIXTURE_OK);
});

test('auth.validateJwtSecret: rejects <32 chars in production', () => {
    assert.throws(
        () => auth.validateJwtSecret(FIXTURE_SHORT, true),
        /JWT_SECRET demasiado corto/
    );
});

test('auth.validateJwtSecret: in dev, short secret yields ephemeral', () => {
    const out = auth.validateJwtSecret(FIXTURE_SHORT, false);
    assert.ok(out && out.length >= auth.JWT_SECRET_MIN_LENGTH);
    assert.notStrictEqual(out, FIXTURE_SHORT);
});

test('auth.validateJwtSecret: rejects denylist value in production', () => {
    assert.throws(
        () => auth.validateJwtSecret(FIXTURE_DENYLIST, true),
        /lista negra/
    );
});

test('auth.validateJwtSecret: rejects missing secret in production', () => {
    assert.throws(
        () => auth.validateJwtSecret(undefined, true),
        /JWT_SECRET ausente en producci/
    );
});

test('auth.validateJwtSecret: in dev, missing secret yields ephemeral', () => {
    const out = auth.validateJwtSecret(undefined, false);
    assert.ok(typeof out === 'string' && out.length >= auth.JWT_SECRET_MIN_LENGTH);
});

test('auth.validateJwtSecret: JWT_SECRET_MIN_LENGTH constant is 32', () => {
    assert.strictEqual(auth.JWT_SECRET_MIN_LENGTH, 32);
});

// ----------------------------------------------------------------
// encryption.js :: validateEncryptionKey
// ----------------------------------------------------------------

test('encryption.validateEncryptionKey: accepts >=16 chars', () => {
    assert.strictEqual(encryption.validateEncryptionKey(FIXTURE_OK, false), FIXTURE_OK);
});

test('encryption.validateEncryptionKey: rejects <16 chars in production', () => {
    assert.throws(
        () => encryption.validateEncryptionKey(FIXTURE_SHORT, true),
        /ENCRYPTION_KEY demasiado corta/
    );
});

test('encryption.validateEncryptionKey: rejects denylist in production', () => {
    assert.throws(
        () => encryption.validateEncryptionKey('clave-de-cifrado', true),
        /lista negra/
    );
});

test('encryption.validateEncryptionKey: in dev, missing key falls back to known string', () => {
    const out = encryption.validateEncryptionKey(undefined, false);
    assert.ok(typeof out === 'string' && out.length >= encryption.ENCRYPTION_KEY_MIN_LENGTH);
});

test('encryption.validateEncryptionKey: ENCRYPTION_KEY_MIN_LENGTH constant is 16', () => {
    assert.strictEqual(encryption.ENCRYPTION_KEY_MIN_LENGTH, 16);
});

// ----------------------------------------------------------------
// Robustness: unexpected input types must NOT hang the process.
// ----------------------------------------------------------------

test('auth.validateJwtSecret: empty object becomes "too short" in production', () => {
    // String({}) -> "[object Object]" (15 chars) -> shorter than 32 -> throws
    assert.throws(() => auth.validateJwtSecret({}, true), /JWT_SECRET demasiado corto/);
});

test('encryption.validateEncryptionKey: empty string falls back in dev', () => {
    const out = encryption.validateEncryptionKey('', false);
    assert.ok(typeof out === 'string' && out.length >= encryption.ENCRYPTION_KEY_MIN_LENGTH);
});

// ----------------------------------------------------------------
// server.js :: normalizeIsSuperadmin
// ----------------------------------------------------------------

test('server.normalizeIsSuperadmin: true / 1 / "1" are accepted and normalized to boolean', () => {
    const reqT = { is_superadmin: true };
    assert.strictEqual(server.normalizeIsSuperadmin(reqT), true);
    assert.strictEqual(reqT.is_superadmin, true);

    const reqN = { is_superadmin: 1 };
    assert.strictEqual(server.normalizeIsSuperadmin(reqN), true);
    assert.strictEqual(reqN.is_superadmin, true);

    const reqS = { is_superadmin: '1' };
    assert.strictEqual(server.normalizeIsSuperadmin(reqS), true);
    assert.strictEqual(reqS.is_superadmin, true);
});

test('server.normalizeIsSuperadmin: any other value is treated as false', () => {
    assert.strictEqual(server.normalizeIsSuperadmin({ is_superadmin: 0 }), false);
    assert.strictEqual(server.normalizeIsSuperadmin({ is_superadmin: '0' }), false);
    assert.strictEqual(server.normalizeIsSuperadmin({ is_superadmin: 'true' }), false); // string != '1'
    assert.strictEqual(server.normalizeIsSuperadmin({ is_superadmin: null }), false);
    assert.strictEqual(server.normalizeIsSuperadmin({ is_superadmin: undefined }), false);
    assert.strictEqual(server.normalizeIsSuperadmin({}), false);
});

// ----------------------------------------------------------------
// server.js :: evaluateStoreWriteGuard
// ----------------------------------------------------------------

const TENANT_A = 'acme';
const TENANT_B = 'initech';

test('server.evaluateStoreWriteGuard: superadmin can write any key', () => {
    assert.strictEqual(server.evaluateStoreWriteGuard('sig_organizations', true, TENANT_A), null);
    assert.strictEqual(server.evaluateStoreWriteGuard('sig_data_' + TENANT_B, true, TENANT_A), null);
    assert.strictEqual(server.evaluateStoreWriteGuard('sig_ai_compliance_active', true, TENANT_A), null);
});

test('server.evaluateStoreWriteGuard: non-superadmin cannot write privileged global keys', () => {
    const denial = server.evaluateStoreWriteGuard('sig_organizations', false, TENANT_A);
    assert.ok(denial, 'should return a denial detail');
    assert.strictEqual(denial.code, 'PRIVILEGED_GLOBAL_KEY_FORBIDDEN');
    assert.strictEqual(denial.status, 403);
});

test('server.evaluateStoreWriteGuard: non-superadmin cannot write another tenant data', () => {
    const denial = server.evaluateStoreWriteGuard('sig_data_' + TENANT_B, false, TENANT_A);
    assert.ok(denial, 'should return a denial detail');
    assert.strictEqual(denial.code, 'CROSS_TENANT_WRITE_FORBIDDEN');
    assert.strictEqual(denial.status, 403);
});

test('server.evaluateStoreWriteGuard: non-superadmin CAN write inside their own tenant', () => {
    assert.strictEqual(server.evaluateStoreWriteGuard('sig_data_' + TENANT_A, false, TENANT_A), null);
    assert.strictEqual(server.evaluateStoreWriteGuard('sig_ai_compliance_active', false, TENANT_A), null);
    // Operational global keys (not privileged) are writable by anyone.
    assert.strictEqual(server.evaluateStoreWriteGuard('sig_ai_last_check', false, TENANT_A), null);
});

test('server.evaluateStoreWriteGuard: client-only keys return SKIP sentinel (defense in depth)', () => {
    // Even if a future caller invokes this guard without pre-filtering client-only keys,
    // the guard must NOT let them be persisted: it returns a distinguishable skip.
    const skip = server.evaluateStoreWriteGuard('sig_current_user', false, TENANT_A);
    assert.ok(skip && typeof skip === 'object', 'must return a sentinel, not null');
    assert.strictEqual(skip.code, 'CLIENT_ONLY_SKIP');
    assert.strictEqual(skip.skip, true);
});

// ----------------------------------------------------------------
// server.js :: safeKeyForLog
// ----------------------------------------------------------------

test('server.safeKeyForLog: truncates keys over the limit with ASCII "..." suffix', () => {
    const out = server.safeKeyForLog('x'.repeat(200), 32);
    // 32 prefix chars + 3 ASCII dots = 35 total
    assert.strictEqual(out.length, 35);
    assert.ok(out.startsWith('x'.repeat(32)));
    assert.ok(out.endsWith('...'));
});

test('server.safeKeyForLog: short keys are returned unchanged', () => {
    assert.strictEqual(server.safeKeyForLog('sig_x'), 'sig_x');
});

test('server.safeKeyForLog: non-string inputs are stringified without throwing', () => {
    assert.strictEqual(typeof server.safeKeyForLog(null), 'string');
    assert.strictEqual(typeof server.safeKeyForLog(undefined), 'string');
});
