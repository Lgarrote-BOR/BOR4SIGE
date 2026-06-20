/**
 * tests/unit.test.js
 * Pruebas automatizadas (node:test) de criptografía y autorización.
 * Ejecutar con:  npm test
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const test = require('node:test');
const assert = require('node:assert');

const encryption = require('../encryption');
const auth = require('../auth');

test('cifrado E2E: ida y vuelta recupera el texto original', () => {
    const plain = 'Denuncia confidencial: desvío de fondos en planta C.';
    const cipher = encryption.encrypt(plain);
    assert.ok(cipher.startsWith('v2:'), 'debe usar el formato v2 (scrypt+salt)');
    assert.ok(!cipher.includes('Denuncia'), 'el texto en claro no debe quedar visible');
    assert.strictEqual(encryption.decrypt(cipher), plain);
});

test('cifrado E2E: dos cifrados del mismo texto producen salidas distintas (salt/iv aleatorios)', () => {
    const a = encryption.encrypt('mismo texto');
    const b = encryption.encrypt('mismo texto');
    assert.notStrictEqual(a, b);
});

test('cifrado E2E: clave incorrecta NO descifra', () => {
    const cipher = encryption.encrypt('secreto', 'clave-correcta');
    const out = encryption.decrypt(cipher, 'clave-incorrecta');
    assert.ok(out.includes('[ERROR'), 'debe bloquear el descifrado con clave errónea');
});

test('cifrado E2E: manipulación del ciphertext es detectada (GCM authTag)', () => {
    const cipher = encryption.encrypt('integridad', 'k');
    const parts = cipher.split(':');
    // Alterar el último carácter del bloque cifrado
    parts[4] = parts[4].slice(0, -1) + (parts[4].slice(-1) === 'a' ? 'b' : 'a');
    const tampered = parts.join(':');
    const out = encryption.decrypt(tampered, 'k');
    assert.ok(out.includes('[ERROR'), 'la alteración debe invalidar el authTag');
});

test('cifrado: cadena no cifrada se devuelve tal cual (retrocompatibilidad)', () => {
    assert.strictEqual(encryption.decrypt('texto plano sin formato'), 'texto plano sin formato');
});

test('política de contraseñas: rechaza débiles y acepta fuertes', () => {
    assert.ok(auth.validatePasswordStrength('123'), 'demasiado corta debe dar error');
    assert.ok(auth.validatePasswordStrength('sololetrasaqui'), 'sin números debe dar error');
    assert.strictEqual(auth.validatePasswordStrength('ClaveSegura2026'), null, 'fuerte debe ser válida');
});

test('rol: detección de superadministrador por flag o por rol', () => {
    assert.strictEqual(auth.userIsSuperadmin({ is_superadmin: 1, role: 'X' }), true);
    assert.strictEqual(auth.userIsSuperadmin({ is_superadmin: 0, role: 'Superadministrador' }), true);
    assert.strictEqual(auth.userIsSuperadmin({ is_superadmin: 0, role: 'Auditor Interno' }), false);
});
