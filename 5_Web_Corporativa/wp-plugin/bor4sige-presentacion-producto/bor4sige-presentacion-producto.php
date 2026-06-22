<?php
/**
 * Plugin Name:       BOR4SIGE · Presentación de Producto
 * Plugin URI:        https://bor4d.com
 * Description:       Publica en WordPress, idéntica y a pantalla completa, la web de presentación del producto BOR4SIGE (Sistema Integrado de Gestión Empresarial, bilingüe ES/EN). Crea una página publicada y ofrece el shortcode [bor4sige_presentacion].
 * Version:           1.1.0
 * Author:            Bor4D Consultoría y Tecnología
 * Author URI:        https://bor4d.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       bor4sige-presentacion-producto
 * Requires at least: 5.5
 * Requires PHP:      7.2
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'BOR4SIGE_PP_VERSION', '1.1.0' );
define( 'BOR4SIGE_PP_DIR', plugin_dir_path( __FILE__ ) );
define( 'BOR4SIGE_PP_URL', plugin_dir_url( __FILE__ ) );
define( 'BOR4SIGE_PP_ASSETS_URL', BOR4SIGE_PP_URL . 'assets/' );
define( 'BOR4SIGE_PP_PAGE_SLUG', 'bor4sige' );
define( 'BOR4SIGE_PP_OPTION_PAGE', 'bor4sige_pp_page_id' );

/**
 * Lee la presentación y reescribe rutas relativas a rutas absolutas del plugin.
 *
 * @return string|false
 */
function bor4sige_pp_render_html() {
	$path = BOR4SIGE_PP_DIR . 'assets/index.html';
	if ( ! is_readable( $path ) ) {
		return false;
	}
	$html = file_get_contents( $path );
	if ( false === $html ) {
		return false;
	}
	$html = str_replace( 'src="logo-bor4d.png"', 'src="' . esc_url( BOR4SIGE_PP_ASSETS_URL . 'logo-bor4d.png' ) . '"', $html );
	$html = str_replace( 'href="../index.html"', 'href="' . esc_url( home_url( '/' ) ) . '"', $html );
	return $html;
}

/**
 * Sirve la presentación a pantalla completa (sin la plantilla del tema) en su página dedicada.
 */
function bor4sige_pp_template_redirect() {
	$page_id   = (int) get_option( BOR4SIGE_PP_OPTION_PAGE );
	$is_target = ( $page_id && is_page( $page_id ) ) || is_page( BOR4SIGE_PP_PAGE_SLUG );

	if ( ! $is_target || isset( $_GET['embed'] ) ) {
		return;
	}

	$html = bor4sige_pp_render_html();
	if ( false === $html ) {
		return;
	}

	if ( ! headers_sent() ) {
		status_header( 200 );
		nocache_headers();
		header( 'Content-Type: text/html; charset=utf-8' );
	}
	echo $html; // phpcs:ignore WordPress.Security.EscapeOutput — HTML estático propio y controlado.
	exit;
}
add_action( 'template_redirect', 'bor4sige_pp_template_redirect' );

/**
 * Shortcode [bor4sige_presentacion height="100vh"] — incrusta la presentación mediante iframe aislado.
 */
function bor4sige_pp_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'height' => '100vh',
			'width'  => '100%',
		),
		$atts,
		'bor4sige_presentacion'
	);

	return sprintf(
		'<iframe src="%s" style="width:%s;height:%s;border:0;display:block;" loading="lazy" title="BOR4SIGE — Presentación de Producto"></iframe>',
		esc_url( BOR4SIGE_PP_ASSETS_URL . 'index.html' ),
		esc_attr( $atts['width'] ),
		esc_attr( $atts['height'] )
	);
}
add_shortcode( 'bor4sige_presentacion', 'bor4sige_pp_shortcode' );

/**
 * Activación: crea la página publicada que muestra la presentación.
 */
function bor4sige_pp_activate() {
	$existing = get_page_by_path( BOR4SIGE_PP_PAGE_SLUG );

	if ( $existing instanceof WP_Post ) {
		$page_id = $existing->ID;
	} else {
		$page_id = wp_insert_post(
			array(
				'post_title'     => 'BOR4SIGE — Presentación',
				'post_name'      => BOR4SIGE_PP_PAGE_SLUG,
				'post_content'   => '[bor4sige_presentacion]',
				'post_status'    => 'publish',
				'post_type'      => 'page',
				'comment_status' => 'closed',
				'ping_status'    => 'closed',
			)
		);
	}

	if ( $page_id && ! is_wp_error( $page_id ) ) {
		update_option( BOR4SIGE_PP_OPTION_PAGE, (int) $page_id );
	}

	flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'bor4sige_pp_activate' );

register_deactivation_hook( __FILE__, 'flush_rewrite_rules' );

/**
 * Aviso en el administrador con el enlace directo a la web publicada.
 */
function bor4sige_pp_admin_notice() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$page_id = (int) get_option( BOR4SIGE_PP_OPTION_PAGE );
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
		'<div class="notice notice-success is-dismissible"><p><strong>BOR4SIGE · Presentación de Producto:</strong> publicada en <a href="%1$s" target="_blank" rel="noopener">%1$s</a>. Shortcode para incrustar: <code>[bor4sige_presentacion]</code>.</p></div>',
		esc_url( $url )
	);
}
add_action( 'admin_notices', 'bor4sige_pp_admin_notice' );
