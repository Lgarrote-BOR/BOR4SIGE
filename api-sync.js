/**
 * api-sync.js
 * Interceptor transparente de localStorage para sincronización cliente-servidor en SIGE 2.0.
 * Si detecta que está corriendo dentro del portal (iframe) y el servidor está activo, 
 * redirige las consultas a la base de datos centralizada de la Webapp en el parent.
 * De lo contrario, cae en el comportamiento por defecto de localStorage de forma segura.
 */
(function() {
    // Verificar si estamos dentro del iframe del portal y el parent tiene el estado de base de datos
    if (window.parent && window.parent !== window && window.parent.sigDbState) {
        const db = window.parent.sigDbState;

        // Sobreescribir getItem
        Storage.prototype.getItem = function(key) {
            if (key in db) {
                return db[key];
            }
            return null;
        };

        // Sobreescribir setItem
        Storage.prototype.setItem = function(key, value) {
            db[key] = value;
            // Notificar al portal para guardar en el backend
            if (typeof window.parent.saveKeyToServer === 'function') {
                window.parent.saveKeyToServer(key, value);
            }
        };

        // Sobreescribir removeItem
        Storage.prototype.removeItem = function(key) {
            delete db[key];
            if (typeof window.parent.saveKeyToServer === 'function') {
                window.parent.saveKeyToServer(key, null);
            }
        };

        // Sobreescribir clear
        Storage.prototype.clear = function() {
            for (let key in db) {
                delete db[key];
                if (typeof window.parent.saveKeyToServer === 'function') {
                    window.parent.saveKeyToServer(key, null);
                }
            }
        };

        // Interceptar clics en los enlaces de navegación de la barra lateral del sub-módulo
        // para redirigirlos a la navegación principal del parent (index.html)
        document.addEventListener("DOMContentLoaded", function() {
            setTimeout(() => {
                const links = document.querySelectorAll("nav a, aside a, .sidebar a, [aria-label='Main Navigation'] a");
                links.forEach(link => {
                    const text = link.textContent.trim().toLowerCase();
                    const iconSpan = link.querySelector(".material-symbols-outlined");
                    const iconName = iconSpan ? iconSpan.textContent.trim().toLowerCase() : "";
                    
                    let targetPath = null;
                    if (text.includes("interesadas") || text.includes("partes int") || iconName === "group_work") {
                        targetPath = "./gesti_n_de_partes_interesadas/code.html";
                    } else if (text.includes("dafo") || text.includes("d.a.f.o.")) {
                        targetPath = "./an_lisis_dafo_estrat_gico/code.html";
                    } else if (text.includes("dashboard") || iconName === "dashboard" || text.includes("inicio") || iconName === "grid_view") {
                        targetPath = "./dashboard_de_gesti_n_sig/code.html";
                    } else if (text.includes("personas") || iconName === "groups" || text.includes("personal")) {
                        targetPath = "./directorio_de_personal/code.html";
                    } else if (text.includes("riesgos") || iconName === "warning" || iconName === "shield" || text.includes("riesgo")) {
                        targetPath = "./matriz_de_riesgos_es_v2/code.html";
                    } else if (text.includes("auditorías") || text.includes("auditorias") || iconName === "fact_check" || iconName === "task_alt" || iconName === "rule") {
                        targetPath = "./gestor_de_auditor_as/code.html";
                    } else if (text.includes("configuración") || text.includes("configuracion") || text.includes("perfil") || iconName === "settings" || iconName === "person") {
                        targetPath = "./roles_y_permisos/code.html";
                    }
                    
                    if (targetPath) {
                        link.addEventListener("click", function(e) {
                            if (window.parent && typeof window.parent.navigateToPath === "function") {
                                e.preventDefault();
                                window.parent.navigateToPath(targetPath);
                            }
                        });
                    }
                });
            }, 100);
        });
    }
})();
