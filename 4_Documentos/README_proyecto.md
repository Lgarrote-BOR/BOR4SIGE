# Bor4SIGE - Sistema de Gestión Integrado y Compliance (Webapp)

Esta es la versión Webapp lista para producción del Sistema de Gestión Integrado (Bor4SIGE). Permite un despliegue multiusuario en servidor (o local compartido) manteniendo todas las interfaces premium interactivas desarrolladas.

---

## 📋 Requisitos Previos

Antes de ejecutar la aplicación, asegúrate de tener instalado **Node.js** en tu sistema:
* Descargar e instalar desde: [https://nodejs.org/](https://nodejs.org/) (se recomienda la versión LTS).

---

## 🚀 Instrucciones de Instalación y Ejecución

### Opción A: Despliegue Automatizado (Recomendado)

#### En Windows:
1. Haz doble clic en el archivo **`iniciar_servidor.bat`** en la raíz de esta carpeta.
2. El script detectará si faltan las dependencias, las instalará de forma automática (`npm install`), levantará el servidor backend y abrirá el portal SGI en tu navegador web por defecto en la dirección: **`http://localhost:3000`**.

#### En macOS o Linux:
1. Abre una terminal en la carpeta de la aplicación.
2. Da permisos de ejecución al script:
   ```bash
   chmod +x iniciar_servidor.sh
   ```
3. Ejecuta el script:
   ```bash
   ./iniciar_servidor.sh
   ```

---

### Opción B: Ejecución Manual por Consola

Si prefieres ejecutar los comandos manualmente:

1. Instala las dependencias en la terminal:
   ```bash
   npm install
   ```
2. Inicia la aplicación:
   ```bash
   npm start
   ```
3. Accede al sistema desde tu navegador en la dirección: [http://localhost:3000](http://localhost:3000)

---

## 💾 Persistencia de Datos y Despliegue en Servidores

* **Base de Datos:** La persistencia de datos se realiza en una base de datos relacional de **MariaDB** de forma centralizada y robusta. Los parámetros de conexión de red se configuran en el archivo `.env` del backend (utilizando las variables `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`). El esquema físico cuenta con restricciones en cascada e índices secundarios óptimos.
* **Despliegue en Servidor Remoto:** Para desplegar esta Webapp en producción, copia esta carpeta al servidor, configura las variables en tu archivo `.env`, asegura que la base de datos MariaDB esté activa y ejecuta `npm install` y `npm start` (o levanta el servicio mediante un gestor de procesos como **PM2**).
* **Ejecución Local Estática (Fallback):** Si se abre la interfaz estática (`index.html`) directamente (bajo protocolo `file://`) sin el backend activo, el interceptor `api-sync.js` derivará la persistencia a la memoria local (`localStorage`) de manera offline y autónoma.
* **Capa de almacenamiento con fallback:** el backend usa la capa relacional normalizada (`db_operations.js`, con paginación vía `GET /api/store/paginated`). Si MariaDB no está disponible, conmuta de forma transparente a un almacén clave-valor con simulador en memoria, de modo que la app sigue funcionando en desarrollo sin base de datos.

---

## 🔐 Configuración de seguridad (importante)

1. **Variables de entorno:** copia `.env.example` a `.env` e introduce tus valores. **Nunca** subas el `.env` real al control de versiones (ya está en `.gitignore`).
2. **Secretos únicos por despliegue:** genera `JWT_SECRET` y `ENCRYPTION_KEY` aleatorios. En producción (`NODE_ENV=production`) el servidor **no arrancará** si faltan o son débiles:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```
3. **CORS y embebido:** define `CORS_ORIGINS` (separado por comas) con los dominios autorizados a consumir la API o a embeber el portal (p. ej. tu WordPress). Sin valor, solo se permite el mismo origen.
4. **Primer arranque:** ejecuta `npm run setup` para crear las tablas de autenticación. En producción **no se siembran** usuarios demo (crea el primer usuario manualmente o usa `SEED_DEMO=true` solo en pruebas).
5. **Endpoints protegidos:** todo `/api/*` (salvo el login) exige JWT. El proxy de IA `/api/chat` está autenticado y limitado por tasa. La escritura multi-tenant valida que nadie escriba en la organización de otro.

### 🧪 Pruebas

```bash
npm test
```
Ejecuta las pruebas automatizadas de cifrado E2E (AES-256-GCM), política de contraseñas y control de rol.
