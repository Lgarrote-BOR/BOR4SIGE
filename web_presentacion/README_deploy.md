# SIGE 2.0 — Web de Presentación
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
scp -r web_presentacion/ root@<IP_HETZNER>:/var/www/sige20/

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
sudo mkdir -p /var/www/sige20
sudo cp -r /ruta/subida/* /var/www/sige20/
sudo chown -R www-data:www-data /var/www/sige20
sudo chmod -R 755 /var/www/sige20
```

---

## 4. Configurar Nginx

```bash
# Editar el nombre de dominio en nginx.conf (sustituye "sige20.tudominio.com")
sudo nano /var/www/sige20/nginx.conf

# Copiar la configuración al directorio de Nginx
sudo cp /var/www/sige20/nginx.conf /etc/nginx/sites-available/sige20

# Activar el sitio
sudo ln -s /etc/nginx/sites-available/sige20 /etc/nginx/sites-enabled/sige20

# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

---

## 5. Obtener certificado SSL (HTTPS gratuito)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d sige20.tudominio.com
```

> Sigue las instrucciones en pantalla. Certbot configura el HTTPS automáticamente.

---

## 6. Verificar el despliegue

Abre el navegador en:  
👉 `https://sige20.tudominio.com`

---

## 7. (Opcional) Apuntar el DNS

En tu proveedor de dominio, crea un registro A:

| Tipo | Nombre | Valor           | TTL   |
|------|--------|-----------------|-------|
| A    | sige20 | `<IP_HETZNER>`  | 300   |

---

## Estructura de archivos desplegados

```
/var/www/sige20/
├── index.html          ← Página principal de presentación
├── nginx.conf          ← Configuración del servidor web
└── README_deploy.md    ← Esta guía
```

---

## Notas importantes

- La web es **100% estática** — no requiere Node.js, PHP ni base de datos.
- Las fuentes se cargan desde Google Fonts CDN (requiere internet en el cliente).
- El botón "Acceder al Portal" apunta a `../index.html` — debes ajustarlo a la URL real de tu instancia SIGE 2.0 si la alojas en el mismo servidor.

---

*SIGE 2.0 © 2026 — Sistema Integrado de Gestión Empresarial*
