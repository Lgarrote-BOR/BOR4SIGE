/**
 * encryption.js
 * Módulo de Cifrado End-to-End utilizando la librería nativa 'crypto' de Node.js.
 * Implementa AES-256-GCM con derivación de clave scrypt + salt aleatorio por registro.
 * Compatible con normativas ENS y la Directiva de Denunciantes de la UE.
 *
 * Formato de salida (v2):  v2:salt:iv:authTag:cipher   (todo en hex)
 * Formato legado admitido en descifrado:  iv:authTag:cipher  (clave = SHA-256 del passphrase)
 */
const crypto = require('crypto');

const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Obtiene el passphrase base de cifrado.
 * En producción es OBLIGATORIO definir ENCRYPTION_KEY (o suministrar customKey);
 * de lo contrario se lanza un error para evitar cifrar con una clave conocida.
 */
function getPassphrase(customKey = null) {
    const keySource = customKey || process.env.ENCRYPTION_KEY;
    if (!keySource) {
        if (IS_PROD) {
            throw new Error("ENCRYPTION_KEY no configurada: el cifrado E2E es obligatorio en producción.");
        }
        console.warn("⚠️ ALERTA DE SEGURIDAD (ENS): ENCRYPTION_KEY no configurada. Usando clave de desarrollo temporal (NO usar en producción).");
        return 'Bor4SIGE-Compliance-Dev-Only-Key';
    }
    return keySource;
}

/**
 * Deriva una clave de 256 bits con scrypt a partir del passphrase y un salt.
 */
function deriveKey(passphrase, salt) {
    return crypto.scryptSync(passphrase, salt, 32);
}

/**
 * Cifra un texto usando AES-256-GCM con clave derivada (scrypt + salt aleatorio).
 * @param {string} text - El texto en claro.
 * @param {string} [customKey] - Clave opcional suministrada en la sesión (Oficial de Cumplimiento).
 */
function encrypt(text, customKey = null) {
    if (!text) return '';
    try {
        const passphrase = getPassphrase(customKey);
        const salt = crypto.randomBytes(16);
        const key = deriveKey(passphrase, salt);
        const iv = crypto.randomBytes(12); // 12 bytes recomendado para GCM
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');

        return `v2:${salt.toString('hex')}:${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
        console.error("Error al cifrar datos:", error.message);
        throw new Error("Fallo en el cifrado de datos confidenciales.");
    }
}

/**
 * Descifra texto en formato v2 (scrypt+salt) o legado (SHA-256).
 * Si el texto no cumple ningún formato cifrado, lo devuelve tal cual (retrocompatibilidad).
 * @param {string} cipherText - El texto cifrado.
 * @param {string} [customKey] - Clave opcional suministrada en la sesión.
 */
function decrypt(cipherText, customKey = null) {
    if (!cipherText || typeof cipherText !== 'string') return cipherText;

    const parts = cipherText.split(':');

    try {
        let key, iv, authTag, encryptedHex;

        if (parts[0] === 'v2' && parts.length === 5) {
            const passphrase = getPassphrase(customKey);
            const salt = Buffer.from(parts[1], 'hex');
            iv = Buffer.from(parts[2], 'hex');
            authTag = Buffer.from(parts[3], 'hex');
            encryptedHex = parts[4];
            key = deriveKey(passphrase, salt);
        } else if (parts.length === 3) {
            // Formato legado: clave = SHA-256 del passphrase, sin salt.
            const passphrase = getPassphrase(customKey);
            iv = Buffer.from(parts[0], 'hex');
            authTag = Buffer.from(parts[1], 'hex');
            encryptedHex = parts[2];
            key = crypto.createHash('sha256').update(passphrase).digest();
        } else {
            // No es una cadena cifrada con este módulo; devolver tal cual.
            return cipherText;
        }

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error("Error al descifrar datos (¿Clave incorrecta?):", error.message);
        return '[ERROR: Los datos confidenciales no pudieron descifrarse con la clave actual]';
    }
}

module.exports = {
    encrypt,
    decrypt
};
