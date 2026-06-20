/**
 * auth.js
 * Módulo de Autenticación y Autorización para Bor4SIGE.
 * Gestiona login, hashes bcrypt, firma/validación de JWT y control de rol.
 * Cumple con directrices ISO 27001 de sesiones finitas (expiración estricta 2h).
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./database');

const IS_PROD = process.env.NODE_ENV === 'production';

// Resolución del secreto JWT:
//  - Producción: OBLIGATORIO definir JWT_SECRET (si falta, el proceso aborta).
//  - Desarrollo: si falta, se genera un secreto efímero (las sesiones se invalidan al reiniciar).
function resolveJwtSecret() {
    const fromEnv = process.env.JWT_SECRET;
    if (fromEnv && fromEnv.length >= 32) return fromEnv;
    if (IS_PROD) {
        console.error("FATAL: JWT_SECRET ausente o demasiado corto (mínimo 32 caracteres) en producción.");
        process.exit(1);
    }
    console.warn("⚠️ JWT_SECRET no definido: usando secreto efímero de desarrollo (las sesiones caducan al reiniciar).");
    return crypto.randomBytes(48).toString('base64url');
}

const JWT_SECRET = resolveJwtSecret();

const SUPERADMIN_ROLES = ['Superadministrador', 'superadmin', 'administrator'];

function userIsSuperadmin(user) {
    return !!user.is_superadmin || SUPERADMIN_ROLES.includes(user.role);
}

/**
 * Valida la robustez mínima de una contraseña (ISO 27001 / ENS).
 */
function validatePasswordStrength(password) {
    if (!password || password.length < 10) {
        return "La contraseña debe tener al menos 10 caracteres.";
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return "La contraseña debe incluir letras y números.";
    }
    return null;
}

/**
 * Controlador de login. Verifica credenciales y genera un JWT.
 */
async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Faltan campos obligatorios: email y password." });
    }

    try {
        const rows = await db.query('SELECT * FROM usuarios WHERE email = ? LIMIT 1', [email]);

        if (!rows || rows.length === 0) {
            return res.status(401).json({ error: "Credenciales incorrectas o usuario no registrado." });
        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Credenciales incorrectas o usuario no registrado." });
        }

        if (user.status !== 'Activo') {
            return res.status(403).json({ error: "Su cuenta de usuario no está activa." });
        }

        const isSuper = userIsSuperadmin(user);

        // Payload del JWT: identidad mínima necesaria. Expiración de 2 horas.
        const payload = {
            user_id: user.id,
            tenant_id: user.tenant_id,
            role: user.role,
            is_superadmin: isSuper
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });

        return res.json({
            token,
            mustChangePassword: !!user.must_change_password,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                tenantId: user.tenant_id,
                isSuperadmin: isSuper,
                status: user.status
            }
        });

    } catch (error) {
        console.error("Error durante el login:", error);
        return res.status(500).json({ error: "Error en el servidor al autenticar." });
    }
}

/**
 * Devuelve el perfil del usuario autenticado a partir del JWT (no de estado compartido).
 */
async function me(req, res) {
    try {
        const rows = await db.query('SELECT * FROM usuarios WHERE id = ? LIMIT 1', [req.user_id]);
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }
        const user = rows[0];
        return res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            tenantId: user.tenant_id,
            isSuperadmin: userIsSuperadmin(user),
            status: user.status
        });
    } catch (error) {
        console.error("Error en /me:", error);
        return res.status(500).json({ error: "Error en el servidor." });
    }
}

/**
 * Cambio de contraseña del usuario autenticado.
 */
async function changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword) {
        return res.status(400).json({ error: "Falta la nueva contraseña." });
    }
    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) {
        return res.status(400).json({ error: strengthError });
    }

    try {
        const rows = await db.query('SELECT * FROM usuarios WHERE id = ? LIMIT 1', [req.user_id]);
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }
        const user = rows[0];

        // Si la cuenta no está marcada para cambio forzado, exigir la contraseña actual.
        if (!user.must_change_password) {
            const ok = currentPassword && await bcrypt.compare(currentPassword, user.password);
            if (!ok) {
                return res.status(401).json({ error: "La contraseña actual no es correcta." });
            }
        }

        const hashed = await bcrypt.hash(newPassword, 12);
        await db.execute('UPDATE usuarios SET password = ?, must_change_password = 0 WHERE id = ?', [hashed, req.user_id]);

        return res.json({ success: true, message: "Contraseña actualizada correctamente." });
    } catch (error) {
        console.error("Error al cambiar la contraseña:", error);
        return res.status(500).json({ error: "Error en el servidor al cambiar la contraseña." });
    }
}

/**
 * Middleware: valida el JWT e inyecta identidad y tenant en la petición.
 * El superadministrador puede operar sobre otro tenant mediante la cabecera X-Tenant-ID.
 */
function enforceTenant(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Acceso denegado: Token de autenticación ausente." });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                error: "Sesión expirada o token inválido.",
                code: "TOKEN_EXPIRED_OR_INVALID"
            });
        }

        req.user_id = decoded.user_id;
        req.user_role = decoded.role;
        req.is_superadmin = !!decoded.is_superadmin;

        // El tenant efectivo proviene SIEMPRE del token, salvo que un superadmin
        // solicite explícitamente otro tenant vía cabecera (conmutación controlada).
        let effectiveTenant = decoded.tenant_id;
        const requested = req.headers['x-tenant-id'];
        if (requested && req.is_superadmin) {
            effectiveTenant = String(requested).trim();
        }

        req.tenant_id = effectiveTenant;
        req.tenant = effectiveTenant;
        req.token_tenant_id = decoded.tenant_id;

        next();
    });
}

/**
 * Middleware: exige rol de superadministrador.
 */
function requireSuperadmin(req, res, next) {
    if (!req.is_superadmin) {
        return res.status(403).json({ error: "Operación restringida a superadministradores." });
    }
    next();
}

// Alias por consistencia con otros módulos
const checkAuth = enforceTenant;

module.exports = {
    login,
    me,
    changePassword,
    enforceTenant,
    requireSuperadmin,
    checkAuth,
    validatePasswordStrength,
    userIsSuperadmin,
    JWT_SECRET
};
