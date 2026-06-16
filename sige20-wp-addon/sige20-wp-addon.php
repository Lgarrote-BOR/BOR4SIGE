<?php
/**
 * Plugin Name: SIGE 2.0 Addon
 * Plugin URI: https://sige-compliance.com
 * Description: Addon de integración para embeber y gestionar la suite SIGE 2.0 (SGI & Compliance) dentro de WordPress de forma multi-tenant y centralizada.
 * Version: 1.0.0
 * Author: SIGE Compliance
 * Author URI: https://sige-compliance.com
 * License: GPL2
 * Text Domain: sige20-wp-addon
 */

// Si este archivo es llamado directamente, abortar.
if (!defined('WPINC')) {
    die;
}

// Definir constantes del plugin
define('SIGE20_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SIGE20_PLUGIN_URL', plugin_dir_url(__FILE__));

// Incluir la página de administración y ajustes
require_once SIGE20_PLUGIN_DIR . 'admin-settings.php';

/**
 * Inicializar el menú de administración principal de SIGE 2.0 en WordPress.
 */
function sige20_register_admin_menu() {
    // Verificar permisos del usuario antes de registrar el menú
    $capability = get_option('sige20_admin_capability', 'manage_options');

    add_menu_page(
        __('Portal SIGE 2.0', 'sige20-wp-addon'),
        __('SIGE 2.0 SGI', 'sige20-wp-addon'),
        $capability,
        'sige20-app-portal',
        'sige20_render_admin_portal',
        'dashicons-shield-alt', // Icono de escudo de seguridad
        2 // Posición alta en el menú lateral de WP
    );
}
add_action('admin_menu', 'sige20_register_admin_menu');

/**
 * Renderiza el portal completo en el back-office cargándolo en el iframe seguro.
 */
function sige20_render_admin_portal() {
    // Obtener variables de configuración
    $server_url = esc_url(get_option('sige20_server_url', 'http://localhost:3000'));
    $tenant = sanitize_key(get_option('sige20_default_tenant', 'alfa'));
    
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
    include SIGE20_PLUGIN_DIR . 'templates/app-loader.php';
}

/**
 * Shortcode [sige20_app] para insertar el sistema o un submódulo en páginas públicas.
 * Ejemplo: [sige20_app module="canal_de_denuncias"]
 */
function sige20_app_shortcode($atts) {
    $a = shortcode_atts(array(
        'module' => '', // Módulo específico a cargar (opcional)
        'height' => '800px'
    ), $atts);

    $server_url = esc_url(get_option('sige20_server_url', 'http://localhost:3000'));
    $tenant = sanitize_key(get_option('sige20_default_tenant', 'alfa'));

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
    <div class="sige20-wp-iframe-container" style="width: 100%; height: <?php echo esc_attr($a['height']); ?>; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; background: #f8f9fb;">
        <iframe src="<?php echo esc_url($app_url); ?>" style="width: 100%; height: 100%; border: none;" allow="clipboard-write; camera"></iframe>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('sige20_app', 'sige20_app_shortcode');

/**
 * Shortcode [sige20_landing] para insertar la landing page de presentación premium.
 */
function sige20_landing_shortcode() {
    ob_start();
    include SIGE20_PLUGIN_DIR . 'templates/landing-template.php';
    return ob_get_clean();
}
add_shortcode('sige20_landing', 'sige20_landing_shortcode');
