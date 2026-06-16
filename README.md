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

* **Base de Datos:** Los datos introducidos en los diferentes formularios (auditorías, no conformidades, aspectos ambientales, control documental, compras, etc.) se almacenan de forma segura y centralizada en el archivo físico **`db.json`** en la raíz del servidor.
* **Despliegue en Servidor Remoto:** Para desplegar esta Webapp en un servidor web en la nube, basta con copiar esta carpeta (excluyendo `node_modules` para agilizar el proceso), ejecutar `npm install` en el servidor y configurar un gestor de procesos como **PM2** o levantar el servicio mediante Node.js en el puerto deseado (`PORT=3000 npm start`).
* **Ejecución Local Estática (Fallback):** Si por algún motivo abres el archivo `index.html` directamente (bajo protocolo `file://`) sin tener activo el servidor de Node.js, la aplicación detectará el entorno y caerá de forma segura en persistencia aislada de **`localStorage`**, funcionando de manera 100% autónoma.
