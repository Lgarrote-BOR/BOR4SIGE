=== SIGE 2.0 Addon ===
Contributors: sige-compliance
Tags: iso, compliance, sgi, audit, security, ens
Requires at least: 5.5
Tested up to: 6.5
Stable tag: 1.0.0
License: GPLv2 or later

Addon oficial de SIGE 2.0 para integrar la suite de Sistema de Gestión Integrado y Compliance en entornos WordPress.

== Description ==

Este plugin permite embeber de forma transparente, segura y multi-tenant el software de cumplimiento **SIGE 2.0** directamente en su sitio web de WordPress.

Muestra toda la suite operativa en el panel de administración (back-office) de WordPress o módulos públicos específicos como el **Canal de Denuncias Seguro** o el panel de visualización premium en páginas de frontend mediante shortcodes sencillos.

=== Módulos que integra ===
* **Cuadro de Mando Integral (Dashboard)** con indicadores en tiempo real de todos los sistemas.
* **Continuidad de Negocio (BCP) e Impacto (BIA)** (ISO 22301:2019).
* **Canal Ético y de Denuncias Seguro** (Ley 2/2023 & ISO 37002).
* **Investigación de Accidentes de Trabajo Wizard** (ISO 45001:2018).
* **Gestión Documental del SGI** (ISO 9001 §7.5).
* **Matriz de Riesgos Multitarea e Integración CAPA** automatizada.

== Installation ==

1. Copie la carpeta `sige20-wp-addon` en el directorio `/wp-content/plugins/` o suba el archivo `.zip` a través del panel de WordPress (`Plugins -> Añadir nuevo -> Subir plugin`).
2. Active el plugin a través del menú 'Plugins' en WordPress.
3. Vaya a `Ajustes -> SIGE 2.0 Settings` en su menú de WordPress y configure la URL de su servidor SIGE 2.0 (por defecto `http://localhost:3000`) y la organización/tenant correspondiente (por defecto `alfa`).
4. Utilice el portal desde la barra lateral bajo la opción **SIGE 2.0 SGI** o publique las plantillas utilizando los shortcodes.

== Shortcodes ==

El plugin registra los siguientes shortcodes para ser utilizados en páginas públicas o bloques HTML:

* `[sige20_landing]` — Muestra la página de presentación corporativa de SIGE 2.0 con animaciones fluidas y scroll optimizado.
* `[sige20_app]` — Inserta el portal completo de SIGE 2.0 en su sitio público (usando un iframe responsivo).
* `[sige20_app module="canal_de_denuncias"]` — Muestra únicamente la página pública para registrar y dar seguimiento a denuncias de forma anónima.
