<?php
/**
 * Limpieza al desinstalar el plugin.
 * No se borra la página publicada (puede contener contenido en uso); solo se elimina la opción interna.
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'bor4d_wc_page_id' );
