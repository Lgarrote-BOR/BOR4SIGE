<?php
/**
 * Plugin Name:       Bor4D · Web Corporativa
 * Plugin URI:        https://bor4d.com
 * Description:       Publica en WordPress la web de presentación corporativa de Bor4D (bilingüe ES/EN, con dashboard de cumplimiento). Crea una página publicada a pantalla completa y ofrece el shortcode [bor4d_web_corporativa] para incrustarla en cualquier página.
 * Version:           1.1.0
 * Author:            Bor4D Consultoría y Tecnología
 * Author URI:        https://bor4d.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       bor4d-web-corporativa
 * Requires at least: 5.5
 * Requires PHP:      7.2
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'BOR4D_WC_VERSION', '1.1.0' );
define( 'BOR4D_WC_DIR', plugin_dir_path( __FILE__ ) );
define( 'BOR4D_WC_URL', plugin_dir_url( __FILE__ ) );
define( 'BOR4D_WC_ASSETS_URL', BOR4D_WC_URL . 'assets/' );
define( 'BOR4D_WC_PAGE_SLUG', 'web-corporativa' );
define( 'BOR4D_WC_OPTION_PAGE', 'bor4d_wc_page_id' );

/**
 * Incluye el fragmento corporativo (plantilla bilingüe autocontenida) y devuelve su HTML.
 *
 * @param string $lang 'es' | 'en' — idioma inicial.
 * @return string
 */
function bor4d_wc_get_fragment( $lang = 'es' ) {
	$path = BOR4D_WC_DIR . 'assets/landing-template.php';
	if ( ! is_readable( $path ) ) {
		return '';
	}
	$sige_lang = ( 'en' === $lang ) ? 'en' : 'es'; // usado por la plantilla incluida.
	ob_start();
	include $path;
	return ob_get_clean();
}

/**
 * Sirve la web corporativa a pantalla completa (sin la plantilla del tema) en su página dedicada.
 */
function bor4d_wc_template_redirect() {
	$page_id   = (int) get_option( BOR4D_WC_OPTION_PAGE );
	$is_target = ( $page_id && is_page( $page_id ) ) || is_page( BOR4D_WC_PAGE_SLUG );

	if ( ! $is_target || isset( $_GET['embed'] ) ) {
		return;
	}

	$lang     = ( isset( $_GET['lang'] ) && 'en' === $_GET['lang'] ) ? 'en' : 'es';
	$fragment = bor4d_wc_get_fragment( $lang );
	if ( '' === $fragment ) {
		return; // si falta la plantilla, deja que WordPress renderice la página normal.
	}

	if ( ! headers_sent() ) {
		status_header( 200 );
		nocache_headers();
		header( 'Content-Type: text/html; charset=utf-8' );
	}
	?><!DOCTYPE html>
<html lang="<?php echo esc_attr( $lang ); ?>">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>Bor4D — Web Corporativa</title>
	<meta name="description" content="Bor4D · Consultoría y Tecnología — Gobernanza corporativa e Inteligencia Artificial." />
</head>
<body style="margin:0;padding:0;background:#030712;">
<?php
	echo $fragment; // phpcs:ignore WordPress.Security.EscapeOutput — fragmento propio y controlado.
	?>
</body>
</html>
<?php
	exit;
}
add_action( 'template_redirect', 'bor4d_wc_template_redirect' );

/**
 * Shortcode [bor4d_web_corporativa lang="es"] — incrusta la web corporativa en cualquier página
 * (la plantilla es autocontenida: trae sus propios estilos y conmutador de idioma).
 */
function bor4d_wc_shortcode( $atts ) {
	$atts = shortcode_atts(
		array( 'lang' => 'es' ),
		$atts,
		'bor4d_web_corporativa'
	);
	return bor4d_wc_get_fragment( 'en' === $atts['lang'] ? 'en' : 'es' );
}
add_shortcode( 'bor4d_web_corporativa', 'bor4d_wc_shortcode' );

/**
 * Shortcode auxiliar [bor4d_logo width="240"] — logotipo auténtico de Bor4D.
 */
function bor4d_wc_logo_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'width' => '240',
			'class' => 'bor4d-logo',
		),
		$atts,
		'bor4d_logo'
	);
	return sprintf(
		'<img src="%s" alt="Bor4D — Consultoría y Tecnología" width="%s" class="%s" style="height:auto;max-width:100%%;" />',
		esc_url( BOR4D_WC_ASSETS_URL . 'logo-bor4d.png' ),
		esc_attr( $atts['width'] ),
		esc_attr( $atts['class'] )
	);
}
add_shortcode( 'bor4d_logo', 'bor4d_wc_logo_shortcode' );

/**
 * Activación: crea la página publicada que muestra la web corporativa.
 */
function bor4d_wc_activate() {
	$existing = get_page_by_path( BOR4D_WC_PAGE_SLUG );

	if ( $existing instanceof WP_Post ) {
		$page_id = $existing->ID;
	} else {
		$page_id = wp_insert_post(
			array(
				'post_title'     => 'Bor4D — Web Corporativa',
				'post_name'      => BOR4D_WC_PAGE_SLUG,
				'post_content'   => '[bor4d_web_corporativa]',
				'post_status'    => 'publish',
				'post_type'      => 'page',
				'comment_status' => 'closed',
				'ping_status'    => 'closed',
			)
		);
	}

	if ( $page_id && ! is_wp_error( $page_id ) ) {
		update_option( BOR4D_WC_OPTION_PAGE, (int) $page_id );
	}

	flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'bor4d_wc_activate' );

register_deactivation_hook( __FILE__, 'flush_rewrite_rules' );

/**
 * Aviso en el administrador con el enlace directo a la web publicada.
 */
function bor4d_wc_admin_notice() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$page_id = (int) get_option( BOR4D_WC_OPTION_PAGE );
	if ( ! $page_id ) {
		return;
	}
	$screen = get_current_screen();
	if ( $screen && 'plugins' !== $screen->id ) {
		return;
	}
	$url = get_permalink( $page_id );
	if ( ! $url ) {
		return;
	}
	printf(
		'<div class="notice notice-success is-dismissible"><p><strong>Bor4D · Web Corporativa:</strong> publicada en <a href="%1$s" target="_blank" rel="noopener">%1$s</a>. Shortcode para incrustar: <code>[bor4d_web_corporativa]</code>.</p></div>',
		esc_url( $url )
	);
}
add_action( 'admin_notices', 'bor4d_wc_admin_notice' );
