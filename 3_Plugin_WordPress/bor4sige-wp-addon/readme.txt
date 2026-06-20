=== Bor4SIGE Addon ===
Contributors: sige-compliance
Tags: iso, compliance, sgi, audit, security, ens
Requires at least: 5.5
Tested up to: 6.5
Stable tag: 1.2.0
License: GPLv2 or later

Addon oficial de Bor4SIGE para integrar la suite de Sistema de Gestión Integrado y Compliance en entornos WordPress.

== Description ==

Este plugin permite embeber de forma transparente, segura y multi-tenant el software de cumplimiento **Bor4SIGE** directamente en su sitio web de WordPress.

Muestra toda la suite operativa en el panel de administración (back-office) de WordPress o módulos públicos específicos como el **Canal de Denuncias Seguro** o el panel de visualización premium en páginas de frontend mediante shortcodes sencillos.

=== Módulos que integra ===
* **Cuadro de Mando Integral (Dashboard)** con indicadores en tiempo real de todos los sistemas.
* **Continuidad de Negocio (BCP) e Impacto (BIA)** (ISO 22301:2019).
* **Canal Ético y de Denuncias Seguro** (Ley 2/2023 & ISO 37002).
* **Investigación de Accidentes de Trabajo Wizard** (ISO 45001:2018).
* **Gestión Documental del SGI** (ISO 9001 §7.5).
* **Matriz de Riesgos Multitarea e Integración CAPA** automatizada.
* **Cumplimiento RGPD & Protección de Datos** (RAT, EIPD, derechos ARSULIPO con cuenta atrás legal de 30 días, control de brechas de seguridad de 72h).
* **Evaluación de Proveedores y Compras** (Control de stock mínimo, alertas de segregación y flujo CAPA automático).
* **Capacidad, Disponibilidad y Clima Laboral** (Proyecciones de capacidad a 6 meses, medidores de carga e indicador ICL con encuesta interactiva Likert).
* **Declaración de Aplicabilidad (SoA)** (Autoevaluación de madurez de controles de seguridad ISO 27001).
* **Catálogo Unificado de Productos y Servicios** (ISO 20000-1 & ISO 9001 §8.5.1) con niveles de inventario y SLAs integrados.

== Installation ==

1. Copie la carpeta `bor4sige-wp-addon` en el directorio `/wp-content/plugins/` o suba el archivo `.zip` a través del panel de WordPress (`Plugins -> Añadir nuevo -> Subir plugin`).
2. Active el plugin a través del menú 'Plugins' en WordPress.
3. Vaya a `Ajustes -> Bor4SIGE Settings` en su menú de WordPress y configure la URL de su servidor Bor4SIGE (por defecto `http://localhost:3000`) y la organización/tenant correspondiente (por defecto `alfa`).
4. Utilice el portal desde la barra lateral bajo la opción **Bor4SIGE SGI** o publique las plantillas utilizando los shortcodes.

== Shortcodes ==

El plugin registra los siguientes shortcodes para ser utilizados en páginas públicas o bloques HTML:

* `[bor4sige_landing]` — Muestra la página de presentación corporativa de Bor4SIGE con animaciones fluidas y scroll optimizado.
* `[bor4sige_app]` — Inserta el portal completo de Bor4SIGE en su sitio público (usando un iframe responsivo).
* `[bor4sige_app module="canal_de_denuncias"]` — Muestra únicamente la página pública para registrar y dar seguimiento a denuncias de forma anónima.

== Changelog ==

= 1.2.0 =
* Compatibilidad con el backend endurecido: autenticación JWT, cabeceras de seguridad (Helmet/CSP) y CORS con lista blanca.
* Nuevo aviso en Ajustes: el dominio de WordPress debe incluirse en `CORS_ORIGINS` del servidor para permitir el embebido (política frame-ancestors), y el portal requiere inicio de sesión.
* Recomendación de uso de HTTPS en producción.

= 1.1.0 =
* Soporte nativo para base de datos relacional MariaDB en el backend, sustituyendo la persistencia antigua basada en archivo db.json.
