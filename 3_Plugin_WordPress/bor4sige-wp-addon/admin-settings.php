<?php
/**
 * admin-settings.php
 * Archivo de configuración para la página de ajustes de Bor4SIGE en WordPress.
 */

// Si este archivo es llamado directamente, abortar.
if (!defined('WPINC')) {
    die;
}

/**
 * Registrar los campos de ajuste en la base de datos de WordPress.
 */
function bor4sige_register_settings() {
    register_setting('bor4sige_settings_group', 'bor4sige_server_url', array(
        'type' => 'string',
        'sanitize_callback' => 'esc_url_raw',
        'default' => 'http://localhost:3000'
    ));

    register_setting('bor4sige_settings_group', 'bor4sige_default_tenant', array(
        'type' => 'string',
        'sanitize_callback' => 'sanitize_key',
        'default' => 'alfa'
    ));

    register_setting('bor4sige_settings_group', 'bor4sige_admin_capability', array(
        'type' => 'string',
        'sanitize_callback' => 'sanitize_key',
        'default' => 'manage_options'
    ));
}
add_action('admin_init', 'bor4sige_register_settings');

/**
 * Añadir la subpágina de ajustes dentro del menú "Ajustes" de WordPress.
 */
function bor4sige_add_settings_page() {
    add_options_page(
        __('Ajustes de Bor4SIGE', 'bor4sige-wp-addon'),
        __('Bor4SIGE Settings', 'bor4sige-wp-addon'),
        'manage_options',
        'bor4sige-settings',
        'bor4sige_render_settings_page'
    );
}
add_action('admin_menu', 'bor4sige_add_settings_page');

/**
 * Renderiza la interfaz premium de la página de Ajustes.
 */
function bor4sige_render_settings_page() {
    ?>
    <style>
        .sige-settings-wrap {
            max-width: 800px;
            margin: 20px auto 20px 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
            background: #fff;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            border: 1px solid #e2e8f0;
        }
        .sige-header {
            display: flex;
            align-items: center;
            gap: 15px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .sige-logo-icon {
            width: 48px;
            height: 48px;
            background: #003366;
            color: #fff;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
        }
        .sige-header h2 {
            margin: 0;
            font-size: 24px;
            color: #003366;
            font-weight: 700;
        }
        .sige-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .sige-card h3 {
            margin-top: 0;
            font-size: 16px;
            color: #003366;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .sige-form-table th {
            width: 200px;
            text-align: left;
            padding: 15px 10px 15px 0;
            font-weight: 600;
            color: #4a5568;
        }
        .sige-form-table td input[type="text"], 
        .sige-form-table td select {
            width: 100%;
            max-width: 400px;
            padding: 8px 12px;
            border: 1px solid #cbd5e0;
            border-radius: 6px;
            box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
        }
        .sige-form-table td input[type="text"]:focus {
            border-color: #0060ac;
            outline: none;
            box-shadow: 0 0 0 3px rgba(0,96,172,0.15);
        }
        .sige-desc {
            font-size: 12px;
            color: #718096;
            margin-top: 5px;
        }
        .sige-submit-btn {
            background: #0060ac !important;
            border-color: #0060ac !important;
            box-shadow: 0 2px 4px rgba(0,96,172,0.2) !important;
            color: #fff !important;
            font-weight: 600 !important;
            border-radius: 6px !important;
            padding: 6px 18px !important;
            height: auto !important;
        }
        .sige-submit-btn:hover {
            background: #003366 !important;
            border-color: #003366 !important;
        }
        .sige-shortcodes-list code {
            background: #edf2f7;
            padding: 3px 6px;
            border-radius: 4px;
            font-family: monospace;
            color: #2d3748;
        }
    </style>
    <div class="sige-settings-wrap">
        <div class="sige-header">
            <div class="sige-logo-icon">🛡️</div>
            <div>
                <h2>Bor4SIGE — Ajustes de Integración</h2>
                <p style="margin: 3px 0 0 0; color: #718096; font-size: 13px;">Configure la comunicación de su WordPress con el núcleo del SGI.</p>
            </div>
        </div>

        <form method="post" action="options.php">
            <?php settings_fields('bor4sige_settings_group'); ?>

            <div class="sige-card">
                <h3>🔌 Servidor y Tenant</h3>
                <table class="form-table sige-form-table">
                    <tr valign="top">
                        <th scope="row">URL de Bor4SIGE</th>
                        <td>
                            <input type="text" name="bor4sige_server_url" value="<?php echo esc_url(get_option('bor4sige_server_url', 'http://localhost:3000')); ?>" />
                            <p class="sige-desc">La URL base de su servidor de producción o local (ej: http://localhost:3000 o https://sgi.mi-empresa.com).</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Tenant (Organización)</th>
                        <td>
                            <input type="text" name="bor4sige_default_tenant" value="<?php echo esc_attr(get_option('bor4sige_default_tenant', 'alfa')); ?>" />
                            <p class="sige-desc">Identificador único de organización para el aislamiento de base de datos multi-tenant de api-sync.js.</p>
                        </td>
                    </tr>
                </table>
            </div>

            <div class="sige-card">
                <h3>🔑 Permisos y Seguridad</h3>
                <table class="form-table sige-form-table">
                    <tr valign="top">
                        <th scope="row">Permiso de Acceso en Admin</th>
                        <td>
                            <select name="bor4sige_admin_capability">
                                <option value="manage_options" <?php selected(get_option('bor4sige_admin_capability', 'manage_options'), 'manage_options'); ?>>Administrador (manage_options)</option>
                                <option value="edit_pages" <?php selected(get_option('bor4sige_admin_capability'), 'edit_pages'); ?>>Editor (edit_pages)</option>
                                <option value="edit_posts" <?php selected(get_option('bor4sige_admin_capability'), 'edit_posts'); ?>>Colaborador (edit_posts)</option>
                            </select>
                            <p class="sige-desc">Capacidad mínima de WordPress requerida para visualizar la pestaña del portal en la barra lateral del admin de WP.</p>
                        </td>
                    </tr>
                </table>
            </div>

            <div class="sige-card" style="background:#fff7ed;border-color:#fed7aa;">
                <h3 style="color:#9a3412;border-color:#fed7aa;">⚠️ Requisitos del backend (versión segura)</h3>
                <div style="font-size:13px;color:#7c2d12;line-height:1.6;">
                    <p>Desde la versión con autenticación JWT y cabeceras de seguridad (Helmet/CSP), el servidor Bor4SIGE debe estar configurado para permitir el embebido desde este sitio:</p>
                    <ul style="margin:8px 0 0 18px;list-style:disc;">
                        <li>En el <code>.env</code> del servidor, añada el dominio de este WordPress a <code>CORS_ORIGINS</code> (separado por comas). Sin esto, el navegador bloqueará el iframe por la política <em>frame-ancestors</em>.</li>
                        <li>El portal exige <strong>inicio de sesión</strong> (JWT). El SSO automático desde WordPress aún no está disponible: el usuario deberá autenticarse en el portal.</li>
                        <li>Use <strong>HTTPS</strong> en producción tanto en WordPress como en el servidor Bor4SIGE.</li>
                    </ul>
                </div>
            </div>

            <div class="sige-card">
                <h3>📖 Shortcodes Disponibles</h3>
                <div class="sige-shortcodes-list" style="line-height: 2;">
                    <p>Utilice estos códigos dentro de cualquier bloque de HTML o Shortcode en Gutenberg o temas clásicos:</p>
                    <p>🔹 <code>[bor4sige_landing]</code> — Inserta la landing page de presentación del sistema con estilo premium y scroll animado.</p>
                    <p>🔹 <code>[bor4sige_app]</code> — Inserta el portal completo de Bor4SIGE (se adapta al rol de WordPress activo).</p>
                    <p>🔹 <code>[bor4sige_app module="canal_de_denuncias"]</code> — Inserta directamente el submódulo del canal ético (denuncias).</p>
                </div>
            </div>

            <?php submit_button('Guardar Ajustes', 'primary sige-submit-btn'); ?>
        </form>
    </div>
    <?php
}
