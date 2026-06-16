# Bor4SIGE — Web de Presentación
## Guía de Despliegue en Servidor Hetzner

---

## Requisitos del servidor

- Ubuntu 22.04 LTS (recomendado en Hetzner)
- Nginx
- Certbot (Let's Encrypt, para HTTPS)

---

## 1. Subir los archivos al servidor

```bash
# Desde tu máquina local (Windows)
scp -r web_presentacion/ root@<IP_HETZNER>:/var/www/bor4sige/

# Alternativa con WinSCP o FileZilla (SFTP)
# Host: <IP_HETZNER>  |  Puerto: 22  |  Usuario: root
```

---

## 2. Instalar Nginx en el servidor

```bash
sudo apt update && sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## 3. Crear el directorio web y copiar archivos

```bash
sudo mkdir -p /var/www/bor4sige
sudo cp -r /ruta/subida/* /var/www/bor4sige/
sudo chown -R www-data:www-data /var/www/bor4sige
sudo chmod -R 755 /var/www/bor4sige
```

---

## 4. Configurar Nginx

```bash
# Editar el nombre de dominio en nginx.conf (sustituye "bor4sige.tudominio.com")
sudo nano /var/www/bor4sige/nginx.conf

# Copiar la configuración al directorio de Nginx
sudo cp /var/www/bor4sige/nginx.conf /etc/nginx/sites-available/bor4sige

# Activar el sitio
sudo ln -s /etc/nginx/sites-available/bor4sige /etc/nginx/sites-enabled/bor4sige

# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

---

## 5. Obtener certificado SSL (HTTPS gratuito)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d bor4sige.tudominio.com
```

> Sigue las instrucciones en pantalla. Certbot configura el HTTPS automáticamente.

---

## 6. Verificar el despliegue

Abre el navegador en:  
👉 `https://bor4sige.tudominio.com`

---

## 7. (Opcional) Apuntar el DNS

En tu proveedor de dominio, crea un registro A:

| Tipo | Nombre | Valor           | TTL   |
|------|--------|-----------------|-------|
| A    | bor4sige | `<IP_HETZNER>`  | 300   |

---

## Estructura de archivos desplegados

```
/var/www/bor4sige/
├── index.html          ← Página principal de presentación
├── nginx.conf          ← Configuración del servidor web
└── README_deploy.md    ← Esta guía
```

---

## Notas importantes

- La web es **100% estática** — no requiere Node.js, PHP ni base de datos.
- Las fuentes se cargan desde Google Fonts CDN (requiere internet en el cliente).
- El botón "Acceder al Portal" apunta a `../index.html` — debes ajustarlo a la URL real de tu instancia Bor4SIGE si la alojas en el mismo servidor.

---

*Bor4SIGE © 2026 — Sistema Integrado de Gestión Empresarial*
