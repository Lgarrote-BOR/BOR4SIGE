<?php
/**
 * app-loader.php
 * Plantilla cargadora del iframe para visualizar Bor4SIGE dentro del back-office de WordPress.
 */

// Si este archivo es llamado directamente, abortar.
if (!defined('WPINC')) {
    die;
}
?>
<div class="wrap bor4sige-wp-portal-wrap" style="margin: 0; padding: 0; height: calc(100vh - 32px); position: relative; overflow: hidden; box-sizing: border-box;">
    <!-- Indicador de Carga Premium -->
    <div id="bor4sige-loader" style="position: absolute; inset: 0; background: #f8f9fb; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 9999; font-family: sans-serif; transition: opacity 0.5s ease;">
        <div class="sige-spinner" style="width: 50px; height: 50px; border: 4px solid rgba(0, 51, 102, 0.1); border-top: 4px solid #003366; border-radius: 50%; animation: sige-spin 1s linear infinite; margin-bottom: 15px;"></div>
        <div style="font-weight: 700; color: #003366; font-size: 16px; letter-spacing: -0.5px;">Bor4SIGE</div>
        <div style="color: #718096; font-size: 11px; margin-top: 5px;">Conectando de forma segura con el SGI...</div>
    </div>

    <!-- Iframe de la Suite Principal -->
    <iframe 
        id="bor4sige-iframe" 
        src="<?php echo esc_url($app_url); ?>" 
        style="width: 100%; height: 100%; border: none; background: #f8f9fb;"
        allow="clipboard-write"
        onload="bor4sigeHideLoader()"
    ></iframe>
</div>

<style>
@keyframes sige-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
/* Estilo para ajustar el área de administración de WordPress al lienzo de Bor4SIGE */
#wpbody-content {
    padding-bottom: 0 !important;
}
.bor4sige-wp-portal-wrap {
    /* Ajuste para la barra de WordPress */
    height: calc(100vh - 32px) !important;
}
@media (max-width: 782px) {
    .bor4sige-wp-portal-wrap {
        height: calc(100vh - 46px) !important;
    }
}
</style>

<script>
function bor4sigeHideLoader() {
    var loader = document.getElementById('bor4sige-loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(function() {
            loader.style.display = 'none';
        }, 500);
    }
}

// Fallback por si la red va muy lenta y no dispara el onload inmediatamente
setTimeout(bor4sigeHideLoader, 5000);
</script>
