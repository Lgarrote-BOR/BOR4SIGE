<?php
/**
 * Limpieza al desinstalar. No borra la página publicada; solo la opción interna.
 */
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}
delete_option( 'bor4sige_pp_page_id' );
