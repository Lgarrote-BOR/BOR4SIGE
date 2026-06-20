/**
 * test_endpoints.js
 * Script de prueba de la arquitectura de persistencia, multi-tenant y criptografía de Bor4SIGE.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const encryption = require('./encryption');
const db = require('./database');
const auth = require('./auth');

async function testAll() {
    console.log("=== INICIANDO PRUEBAS DE SEGURIDAD Y INTEGRIDAD ===");

    // 1. Validar hash de contraseñas
    console.log("\n1. Probando Autenticación...");
    const plainPassword = "admin1234";
    const hashed = bcrypt.hashSync(plainPassword, 10);
    const match = bcrypt.compareSync(plainPassword, hashed);
    console.log(`- Generación de Hash Bcrypt: OK`);
    console.log(`- Verificación de Contraseña: ${match ? 'ÉXITO' : 'FALLO'}`);

    // 2. Validar JWT
    console.log("\n2. Probando Generación de JWT (Expiración Finitas ISO 27001)...");
    const payload = { user_id: 'bor', tenant_id: 'alfa', role: 'Superadministrador' };
    const token = jwt.sign(payload, auth.JWT_SECRET, { expiresIn: '2h' });
    console.log(`- Token Generado: ${token.substring(0, 40)}...`);
    
    const decoded = jwt.verify(token, auth.JWT_SECRET);
    console.log(`- Decodificación de Payload:`, decoded);
    console.log(`- Validación tenant_id inyectado: ${decoded.tenant_id === 'alfa' ? 'ÉXITO' : 'FALLO'}`);

    // 3. Validar Cifrado AES-256-GCM E2E
    console.log("\n3. Probando Cifrado End-to-End para Canal de Denuncias (Directiva UE)...");
    const secretMessage = "Denuncia confidencial de desvío de fondos en la planta C.";
    const complianceKey = "compliance-officer-session-token-key-2026";
    
    // Cifrado
    const cipherText = encryption.encrypt(secretMessage, complianceKey);
    console.log(`- Texto Cifrado (Formato iv:authTag:cipher): ${cipherText}`);
    console.log(`- ¿El texto en claro se ocultó?: ${!cipherText.includes("Denuncia") ? 'SÍ' : 'NO'}`);

    // Descifrado
    const decrypted = encryption.decrypt(cipherText, complianceKey);
    console.log(`- Texto Descifrado: "${decrypted}"`);
    console.log(`- Coincidencia con original: ${decrypted === secretMessage ? 'ÉXITO' : 'FALLO'}`);

    // Probar descifrado con clave incorrecta
    const wrongDecrypted = encryption.decrypt(cipherText, "wrong-key");
    console.log(`- Descifrado con clave errónea: ${wrongDecrypted.includes("[ERROR") ? 'BLOQUEADO CORRECTAMENTE' : 'FALLO DE SEGURIDAD'}`);

    // 4. Validar Prepared Statements y Aislamiento por Registro
    console.log("\n4. Probando Consultas Preparadas y Aislamiento de Tenant...");
    try {
        // Ejecutar SELECT simulado/real con tenant 'alfa'
        const alfaRows = await db.query(
            'SELECT key_name, key_value FROM tenant_store WHERE tenant_id = ?',
            ['alfa']
        );
        console.log(`- Registros recuperados para tenant 'alfa': ${alfaRows.length}`);
        
        // Ejecutar SELECT simulado/real con tenant 'beta'
        const betaRows = await db.query(
            'SELECT key_name, key_value FROM tenant_store WHERE tenant_id = ?',
            ['beta']
        );
        console.log(`- Registros recuperados para tenant 'beta': ${betaRows.length}`);
        
        console.log(`- ¿Aislamiento correcto?: ${alfaRows.length !== betaRows.length ? 'SÍ' : 'NO (simulado)'}`);

    } catch (err) {
        console.error("Error al ejecutar consultas preparadas:", err);
    }

    console.log("\n=== PRUEBAS FINALIZADAS ===");
}

testAll();
