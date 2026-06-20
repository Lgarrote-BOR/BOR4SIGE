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

// Tamaño mínimo aceptado para la clave de cifrado E2E (128 bits en caracteres).
const ENCRYPTION_KEY_MIN_LENGTH = 16;

// Lista negra de placeholders comunes: si la variable coincide, se rechaza el arranque en producción.
const ENCRYPTION_FAILSAFE_DENYLIST = new Set([
    '',
    'change-me',
    'encryption-key',
    'clave-de-cifrado',
    'bor4sige',
    'dev-only-key'
]);

/**
 * Valida un valor concreto de ENCRYPTION_KEY:
 *  - En producción: debe existir y ser >=16 caracteres (y no estar en la lista negra).
 *  - En desarrollo: si falta o es débil, devuelve una clave de fallback claramente marcada.
 * @param {string|undefined|null} value
 * @param {boolean} isProd
 * @returns {string} passphrase utilizable (ya sea la del entorno o el fallback de desarrollo).
 */
function validateEncryptionKey(value, isProd) {
    const asString = value == null ? '' : String(value);
    const lower = asString.toLowerCase();

    if (ENCRYPTION_FAILSAFE_DENYLIST.has(lower)) {
        const msg = `FATAL: ENCRYPTION_KEY coincide con un valor de la lista negra (${asString}).`;
        if (isProd) {
            console.error(msg);
            throw new Error(msg);
        }
        console.warn(`⚠️ ${msg} Se usará la clave de desarrollo.`);
        return 'Bor4SIGE-Compliance-Dev-Only-Key';
    }

    if (asString.length >= ENCRYPTION_KEY_MIN_LENGTH) {
        return asString;
    }

    if (isProd) {
        const reason = !asString
            ? 'ENCRYPTION_KEY ausente en producción.'
            : `ENCRYPTION_KEY demasiado corta (${asString.length}<${ENCRYPTION_KEY_MIN_LENGTH}) en producción.`;
        const msg = `FATAL: ${reason} Defina un valor robusto (>= ${ENCRYPTION_KEY_MIN_LENGTH} caracteres aleatorios).`;
        console.error(msg);
        throw new Error(msg);
    }

    if (asString) {
        console.warn(`⚠️ ENCRYPTION_KEY demasiado corta (${asString.length}<${ENCRYPTION_KEY_MIN_LENGTH}). Usando clave de desarrollo.`);
    } else {
        console.warn("⚠️ ALERTA DE SEGURIDAD (ENS): ENCRYPTION_KEY no configurada. Usando clave de desarrollo temporal (NO usar en producción).");
    }
    return 'Bor4SIGE-Compliance-Dev-Only-Key';
}

/**
 * Obtiene el passphrase base de cifrado.
 * En producción es OBLIGATORIO definir ENCRYPTION_KEY (o suministrar customKey);
 * de lo contrario se lanza un error para evitar cifrar con una clave conocida.
 */
function getPassphrase(customKey = null) {
    // Si se inyectó una clave explícita por sesión (customKey), se respeta tal cual
    // (su robustez la garantiza el flujo de Oficial de Cumplimiento).
    if (customKey != null) {
        return customKey;
    }
    return validateEncryptionKey(process.env.ENCRYPTION_KEY, IS_PROD);
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
    decrypt,
    getPassphrase,
    validateEncryptionKey,
    ENCRYPTION_KEY_MIN_LENGTH
};
