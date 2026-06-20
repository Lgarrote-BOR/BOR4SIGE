# 🛡️ Bor4SIGE — Proyecto Integral

**Sistema Integrado de Gestión Empresarial, Compliance y Automatización con IA**

---

## 📁 Estructura del Proyecto

```
BOR4SIGE/
│
├── 1_App_BOR4SIGE/           ← Aplicación completa (servidor + portal + módulos)
├── 2_Instalable_BOR4SIGE/    ← Paquetes instalables listos para producción
├── 3_Plugin_WordPress/       ← Plugin de integración con WordPress / Divi 5
├── 4_Documentos/             ← Documentación, manuales, normas y dossiers
├── 5_Web_Corporativa/        ← Landing web de presentación de Bor4D
│
├── build_packages.ps1        ← Script de empaquetado y sincronización
├── .gitignore
└── README.md                 ← Este archivo
```

---

## 📦 Descripción de cada Carpeta

### 1️⃣ `1_App_BOR4SIGE/`
El corazón del sistema. Contiene el portal SGI completo con +60 módulos operativos, el servidor Express (Node.js) y la API REST multi-tenant.

**Para ejecutar la aplicación:**
```bash
cd 1_App_BOR4SIGE
npm install
cp .env.example .env      # configura tus secretos y la clave de Gemini
npm run setup             # crea las tablas de autenticación (requiere MariaDB)
node db_migration.js      # crea el esquema relacional de módulos (requiere MariaDB)
npm start
# Abre http://localhost:3000
```

O simplemente haz doble clic en `1_App_BOR4SIGE/iniciar_servidor.bat` (Windows). Sin MariaDB, la app arranca igualmente con un almacén en memoria de respaldo.

> 🔐 **Seguridad:** la app usa autenticación JWT, cifrado AES-256-GCM del canal de denuncias y aislamiento multi-tenant. Configura `JWT_SECRET`, `ENCRYPTION_KEY`, `GEMINI_API_KEY` y `CORS_ORIGINS` en `.env` (nunca lo subas al repo). Pruebas: `npm test`.

---

### 2️⃣ `2_Instalable_BOR4SIGE/`
Paquetes `.zip` listos para desplegar en servidores de producción o distribución a clientes.

| Archivo | Descripción |
|---|---|
| `bor4sige_webapp_instalable.zip` | Paquete completo con PDFs de normas (~56 MB) |
| `bor4sige_webapp_instalable_sgi.zip` | Versión ligera sin PDFs (~29 MB) |
| `bor4sige_webapp_instalable/` | Directorio fuente del instalable |

---

### 3️⃣ `3_Plugin_WordPress/`
Plugin oficial de integración con WordPress y Divi 5. Permite embeber BOR4SIGE en el backoffice de WP y publicar la landing corporativa con shortcodes.

| Shortcode | Resultado |
|---|---|
| `[bor4sige_landing]` | Landing de presentación corporativa bilingüe |
| `[bor4sige_app]` | Portal completo del SGI |
| `[bor4sige_app module="canal_de_denuncias"]` | Módulo específico |

---

### 4️⃣ `4_Documentos/`
Toda la documentación del proyecto: manual de uso, plan de mejoras, dossier corporativo y PDFs de normativas legales.

---

### 5️⃣ `5_Web_Corporativa/`
Landing page estática de presentación de Bor4D y BOR4SIGE, lista para desplegar en un servidor web (Nginx en Hetzner). Incluye guía de deploy y configuración SSL.

---

## ⚙️ Script de Empaquetado

```powershell
# Desde la raíz del proyecto:
.\build_packages.ps1
```

Genera los 4 paquetes `.zip` y sincroniza con el directorio espejo `SIG 2.0`.

---

*Bor4SIGE © 2026 — Bor4D Technology & Professional Services*
