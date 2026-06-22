=== Bor4D · Web Corporativa ===
Contributors: bor4d
Tags: corporativa, bor4d, landing, presentacion, bilingue
Requires at least: 5.5
Tested up to: 6.5
Requires PHP: 7.2
Stable tag: 1.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Publica en WordPress la web de presentación corporativa de Bor4D (bilingüe ES/EN).

== Description ==

Empaqueta la plantilla corporativa de Bor4D (bilingüe español/inglés, con dashboard de
cumplimiento y conmutador de idioma) y la publica dentro de WordPress.

Al activarlo:
1. Crea automáticamente una página publicada con el slug `/web-corporativa/`.
2. Esa página sirve la web corporativa A PANTALLA COMPLETA, sin que el tema altere el diseño.

Shortcodes:
* `[bor4d_web_corporativa lang="es"]` — incrusta la web corporativa (la plantilla es autocontenida).
* `[bor4d_logo width="240"]` — pinta el logotipo auténtico de Bor4D.

Añade `?embed=1` a la URL de la página para verla CON la plantilla del tema, o `?lang=en` para
forzar el inicio en inglés.

== Installation ==

1. WordPress: Plugins → Añadir nuevo → Subir plugin.
2. Selecciona `bor4d_web_corporativa.zip` → Instalar ahora.
3. Activa "Bor4D · Web Corporativa".
4. Visita `https://TU-DOMINIO/web-corporativa/`.

== Changelog ==

= 1.1.0 =
* El plugin pasa a servir la web CORPORATIVA de Bor4D (plantilla bilingüe), separada de la
  presentación de producto BOR4SIGE (plugin independiente).

= 1.0.0 =
* Versión inicial.
