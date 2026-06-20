// tests/api-sync.test.js
// Pure unit tests for the helpers exported by api-sync.js.
// No DOM, no fetch, no localStorage -- only logic.
const test = require('node:test');
const assert = require('node:assert');

// Stub browser globals so api-sync.js does not crash if it
// accidentally falls through to the browser path.
global.window = global.window || {
    fetch: function () { throw new Error('no fetch in tests'); },
    addEventListener: function () {},
    dispatchEvent: function () {},
    localStorage: {}
};
global.document = global.document || {
    createElement: function () { return {}; },
    head: { appendChild: function () {} }
};
global.localStorage = global.localStorage || {};

// api-sync.js detects CommonJS exports and exits early,
// returning the helper object.
const apiSync = require('../api-sync.js');

// ----------------------------------------------------------------
// validateTenantSlug
// ----------------------------------------------------------------

test('apiSync.validateTenantSlug: accepts lowercase alphanumeric slugs', () => {
    assert.strictEqual(apiSync.validateTenantSlug('alfa'), 'alfa');
    assert.strictEqual(apiSync.validateTenantSlug('beta-team'), 'beta-team');
    assert.strictEqual(apiSync.validateTenantSlug('org_42'), 'org_42');
});

test('apiSync.validateTenantSlug: rejects invalid slugs', () => {
    assert.strictEqual(apiSync.validateTenantSlug('ALFA'), null, 'must be lowercase');
    assert.strictEqual(apiSync.validateTenantSlug('a b'), null, 'no spaces');
    assert.strictEqual(apiSync.validateTenantSlug('a<script>'), null, 'no special chars');
    assert.strictEqual(apiSync.validateTenantSlug('admin/../etc'), null, 'no slashes');
    assert.strictEqual(apiSync.validateTenantSlug(''), null, 'empty');
    assert.strictEqual(apiSync.validateTenantSlug(null), null, 'null');
    assert.strictEqual(apiSync.validateTenantSlug(undefined), null, 'undefined');
});

test('apiSync.validateTenantSlug: rejects reserved words', () => {
    assert.strictEqual(apiSync.validateTenantSlug('undefined'), null);
    assert.strictEqual(apiSync.validateTenantSlug('null'), null);
});

// ----------------------------------------------------------------
// extractTenantFromJwt
// ----------------------------------------------------------------

function craftJwt(payload) {
    function b64url(s) {
        return Buffer.from(s, 'utf-8').toString('base64')
            .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    }
    return 'eyJhbGciOiJub25lIn0.' + b64url(JSON.stringify(payload)) + '.sig';
}

// ----------------------------------------------------------------
// tenantizedKey
// ----------------------------------------------------------------

test('apiSync.tenantizedKey: appends tenant suffix to domain keys', () => {
    assert.strictEqual(apiSync.tenantizedKey('sig_dashboard_data', 'alfa'),
        'sig_dashboard_data_alfa');
    assert.strictEqual(apiSync.tenantizedKey('sig_riesgos_iso', 'beta'),
        'sig_riesgos_iso_beta');
});

test('apiSync.tenantizedKey: leaves global keys unsuffixed', () => {
    apiSync.GLOBAL_KEYS.forEach(function (gk) {
        assert.strictEqual(apiSync.tenantizedKey(gk, 'alfa'), gk,
            'global key ' + gk + ' must not be suffixed');
    });
});

test('apiSync.tenantizedKey: leaves client-only keys unsuffixed', () => {
    apiSync.CLIENT_ONLY_KEYS.forEach(function (ck) {
        assert.strictEqual(apiSync.tenantizedKey(ck, 'alfa'), ck);
    });
});

test('apiSync.tenantizedKey: preserves already-suffixed keys (idempotent)', () => {
    assert.strictEqual(apiSync.tenantizedKey('sig_data_alfa', 'alfa'),
        'sig_data_alfa', 'must not double-suffix');
    assert.strictEqual(apiSync.tenantizedKey('sig_datos_beta', 'beta'),
        'sig_datos_beta');
});

test('apiSync.tenantizedKey: returns internal keys as-is', () => {
    assert.strictEqual(apiSync.tenantizedKey('sig_time_x', 'alfa'),
        'sig_time_x');
    assert.strictEqual(apiSync.tenantizedKey('foo', 'alfa'),
        'foo');
});

test('apiSync.pickTenant: non-superadmin with JWT cannot override with ?tenant=', () => {
    const out = apiSync.pickTenant({
        urlTenant: 'gamma',
        lsTenant: 'beta-legacy',
        jwtTenant: 'beta',
        isSuperadmin: false,
        jwtValue: 'token'
    });
    assert.strictEqual(out, 'beta', 'must be locked to JWT tenant for non-superadmin');
});

test('apiSync.pickTenant: superadmin with JWT honours ?tenant=', () => {
    const out = apiSync.pickTenant({
        urlTenant: 'gamma',
        lsTenant: null,
        jwtTenant: 'beta',
        isSuperadmin: true,
        jwtValue: 'token'
    });
    assert.strictEqual(out, 'gamma', 'superadmin can switch tenant via URL');
});

test('apiSync.pickTenant: ?tenant= works when there is no JWT', () => {
    const out = apiSync.pickTenant({
        urlTenant: 'gamma',
        lsTenant: 'beta',
        jwtTenant: null,
        isSuperadmin: false,
        jwtValue: null
    });
    assert.strictEqual(out, 'gamma');
});

test('apiSync.pickTenant: invalid urlTenant falls back to localStorage', () => {
    const out = apiSync.pickTenant({
        urlTenant: '<script>',
        lsTenant: 'beta',
        jwtTenant: null,
        isSuperadmin: false,
        jwtValue: null
    });
    assert.strictEqual(out, 'beta');
});

test('apiSync.pickTenant: defaults to "alfa" when nothing else is available', () => {
    const out = apiSync.pickTenant({
        urlTenant: null,
        lsTenant: null,
        jwtTenant: null,
        isSuperadmin: false,
        jwtValue: null
    });
    assert.strictEqual(out, 'alfa');
});

// ----------------------------------------------------------------
// isInternalKey
// ----------------------------------------------------------------

test('apiSync.isInternalKey: marks non-sig keys as internal', () => {
    assert.strictEqual(apiSync.isInternalKey('foo'), true);
    assert.strictEqual(apiSync.isInternalKey(''), true);
    assert.strictEqual(apiSync.isInternalKey(null), true);
});

test('apiSync.isInternalKey: marks sig_time_ and meta keys as internal', () => {
    assert.strictEqual(apiSync.isInternalKey('sig_time_x'), true);
    assert.strictEqual(apiSync.isInternalKey('sig_jwt_token'), true);
    assert.strictEqual(apiSync.isInternalKey('sig_login_alert'), true);
    assert.strictEqual(apiSync.isInternalKey('sig_offline_queue'), true);
    assert.strictEqual(apiSync.isInternalKey('sig_search_nc'), true);
    // sig_ai_compliance_active is operational but NOT internal -- it needs
    // cross-iframe sync via GLOBAL_KEYS path.
    assert.strictEqual(apiSync.isInternalKey('sig_ai_compliance_active'), false);
});

test('apiSync.isInternalKey: keeps domain keys as non-internal', () => {
    assert.strictEqual(apiSync.isInternalKey('sig_acciones_correctivas'), false);
    assert.strictEqual(apiSync.isInternalKey('sig_dashboard_data'), false);
});

test('apiSync.extractTenantFromJwt: parses tenant_id and is_superadmin', () => {
    const info = apiSync.extractTenantFromJwt(craftJwt({ tenant_id: 'beta', is_superadmin: false }));
    assert.strictEqual(info.valid, true);
    assert.strictEqual(info.tenant, 'beta');
    assert.strictEqual(info.isSuperadmin, false);
});

test('apiSync.extractTenantFromJwt: accepts tenantId camelCase variant', () => {
    const info = apiSync.extractTenantFromJwt(craftJwt({ tenantId: 'gamma', isSuperadmin: true }));
    assert.strictEqual(info.tenant, 'gamma');
    assert.strictEqual(info.isSuperadmin, true);
});

test('apiSync.extractTenantFromJwt: is_superadmin="1" is recognized', () => {
    const info = apiSync.extractTenantFromJwt(craftJwt({ tenant_id: 'alfa', is_superadmin: '1' }));
    assert.strictEqual(info.isSuperadmin, true);
});

test('apiSync.extractTenantFromJwt: malformed token is invalid', () => {
    assert.strictEqual(apiSync.extractTenantFromJwt('not.a.jwt').valid, false);
    assert.strictEqual(apiSync.extractTenantFromJwt('').valid, false);
    assert.strictEqual(apiSync.extractTenantFromJwt(null).valid, false);
});

// ----------------------------------------------------------------
// pickTenant (priority cascade)
// ----------------------------------------------------------------
