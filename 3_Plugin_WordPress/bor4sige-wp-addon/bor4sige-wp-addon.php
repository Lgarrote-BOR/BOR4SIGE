<?php
/**
 * Plugin Name: Bor4SIGE Addon
 * Plugin URI: https://sige-compliance.com
 * Description: Addon de integración para embeber y gestionar la suite Bor4SIGE (SGI & Compliance) dentro de WordPress de forma multi-tenant y centralizada.
 * Version: 1.0.0
 * Author: Bor4SIGE Compliance
 * Author URI: https://sige-compliance.com
 * License: GPL2
 * Text Domain: bor4sige-wp-addon
 */

// Si este archivo es llamado directamente, abortar.
if (!defined('WPINC')) {
    die;
}

// Definir constantes del plugin
define('BOR4SIGE_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('BOR4SIGE_PLUGIN_URL', plugin_dir_url(__FILE__));

// Incluir la página de administración y ajustes
require_once BOR4SIGE_PLUGIN_DIR . 'admin-settings.php';

/**
 * Inicializar el menú de administración principal de Bor4SIGE en WordPress.
 */
function bor4sige_register_admin_menu() {
    // Verificar permisos del usuario antes de registrar el menú
    $capability = get_option('bor4sige_admin_capability', 'manage_options');

    add_menu_page(
        __('Portal Bor4SIGE', 'bor4sige-wp-addon'),
        __('Bor4SIGE SGI', 'bor4sige-wp-addon'),
        $capability,
        'bor4sige-app-portal',
        'bor4sige_render_admin_portal',
        'dashicons-shield-alt', // Icono de escudo de seguridad
        2 // Posición alta en el menú lateral de WP
    );
}
add_action('admin_menu', 'bor4sige_register_admin_menu');

/**
 * Renderiza el portal completo en el back-office cargándolo en el iframe seguro.
 */
function bor4sige_render_admin_portal() {
    // Obtener variables de configuración
    $server_url = esc_url(get_option('bor4sige_server_url', 'http://localhost:3000'));
    $tenant = sanitize_key(get_option('bor4sige_default_tenant', 'alfa'));
    
    // Obtener datos del usuario logueado en WordPress
    $current_user = wp_get_current_user();
    $wp_username = sanitize_user($current_user->user_login);
    $wp_role = !empty($current_user->roles) ? sanitize_key($current_user->roles[0]) : 'subscriber';
    $wp_email = sanitize_email($current_user->user_email);

    // Ensamblar URL final
    $app_url = add_query_arg(array(
        'tenant' => $tenant,
        'wp_user' => $wp_username,
        'wp_role' => $wp_role,
        'wp_email' => $wp_email,
        'context' => 'wp-admin'
    ), $server_url);

    // Cargar plantilla cargadora
    include BOR4SIGE_PLUGIN_DIR . 'templates/app-loader.php';
}

/**
 * Shortcode [bor4sige_app] para insertar el sistema o un submódulo en páginas públicas.
 * Ejemplo: [bor4sige_app module="canal_de_denuncias"]
 */
function bor4sige_app_shortcode($atts) {
    $a = shortcode_atts(array(
        'module' => '', // Módulo específico a cargar (opcional)
        'height' => '800px'
    ), $atts);

    $server_url = esc_url(get_option('bor4sige_server_url', 'http://localhost:3000'));
    $tenant = sanitize_key(get_option('bor4sige_default_tenant', 'alfa'));

    // Si se especifica un módulo, ajustar la ruta del iframe
    $target_url = $server_url;
    if (!empty($a['module'])) {
        $module_path = sanitize_text_field($a['module']);
        // Asegurar formato correcto del submódulo
        $target_url = trailingslashit($server_url) . $module_path . '/code.html';
    }

    // Obtener datos del usuario logueado en WordPress para SSO simulado
    $current_user = wp_get_current_user();
    if ($current_user->ID !== 0) {
        $wp_username = sanitize_user($current_user->user_login);
        $wp_role = !empty($current_user->roles) ? sanitize_key($current_user->roles[0]) : 'subscriber';
    } else {
        $wp_username = 'anonimo';
        $wp_role = 'guest';
    }

    $app_url = add_query_arg(array(
        'tenant' => $tenant,
        'wp_user' => $wp_username,
        'wp_role' => $wp_role,
        'context' => 'wp-shortcode'
    ), $target_url);

    // Capturar salida del iframe
    ob_start();
    ?>
    <div class="bor4sige-wp-iframe-container" style="width: 100%; height: <?php echo esc_attr($a['height']); ?>; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; background: #f8f9fb;">
        <iframe src="<?php echo esc_url($app_url); ?>" style="width: 100%; height: 100%; border: none;" allow="clipboard-write; camera"></iframe>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('bor4sige_app', 'bor4sige_app_shortcode');

/**
 * Shortcode [bor4sige_landing] para insertar la landing page de presentación premium.
 */
function bor4sige_landing_shortcode($atts) {
    $a = shortcode_atts(array(
        'lang' => '' // 'es', 'en', o vacío para dinámico con conmutador
    ), $atts);

    $sige_lang = sanitize_text_field(strtolower($a['lang']));

    ob_start();
    include BOR4SIGE_PLUGIN_DIR . 'templates/landing-template.php';
    return ob_get_clean();
}
add_shortcode('bor4sige_landing', 'bor4sige_landing_shortcode');
