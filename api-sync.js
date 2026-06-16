/**
 * api-sync.js
 * Interceptor transparente de localStorage para sincronización cliente-servidor en SIGE 2.0.
 * Si detecta que está corriendo dentro del portal (iframe) y el servidor está activo, 
 * redirige las consultas a la base de datos centralizada de la Webapp en el parent.
 * De lo contrario, cae en el comportamiento por defecto de localStorage de forma segura.
 * Incorpora aislamiento de datos multi-tenant para cada organización activa.
 */
(function() {
    // Verificar si estamos dentro del iframe del portal y el parent tiene el estado de base de datos
    if (window.parent && window.parent !== window && window.parent.sigDbState) {
        const db = window.parent.sigDbState;

        // Claves globales compartidas entre todas las organizaciones
        const globalKeys = [
            'sig_current_user',
            'sig_users',
            'sig_active_tenant',
            'sig_organizations',
            'sig_personal',
            'sig_ai_compliance_active',
            'sig_ai_compliance_logs',
            'sig_ai_actions_count',
            'sig_ai_last_check'
        ];

        // Función auxiliar para obtener la clave tenantizada
        function getTenantKey(key) {
            if (key && key.startsWith('sig_') && !globalKeys.includes(key)) {
                const tenant = db['sig_active_tenant'] || 'alfa';
                // Si la clave no termina ya en _<tenant>, añadir el sufijo
                if (!key.endsWith(`_${tenant}`)) {
                    return `${key}_${tenant}`;
                }
            }
            return key;
        }

        // Sobreescribir getItem
        Storage.prototype.getItem = function(key) {
            const tenantKey = getTenantKey(key);
            if (tenantKey in db) {
                return db[tenantKey];
            }
            return null;
        };

        // Sobreescribir setItem
        Storage.prototype.setItem = function(key, value) {
            const tenantKey = getTenantKey(key);
            db[tenantKey] = value;
            // Notificar al portal para guardar en el backend
            if (typeof window.parent.saveKeyToServer === 'function') {
                window.parent.saveKeyToServer(tenantKey, value);
            }
        };

        // Sobreescribir removeItem
        Storage.prototype.removeItem = function(key) {
            const tenantKey = getTenantKey(key);
            delete db[tenantKey];
            if (typeof window.parent.saveKeyToServer === 'function') {
                window.parent.saveKeyToServer(tenantKey, null);
            }
        };

        // Sobreescribir clear
        Storage.prototype.clear = function() {
            const tenant = db['sig_active_tenant'] || 'alfa';
            for (let key in db) {
                // Solo borrar claves que correspondan al tenant activo y no sean globales
                if (key.startsWith('sig_') && key.endsWith(`_${tenant}`) && !globalKeys.includes(key)) {
                    delete db[key];
                    if (typeof window.parent.saveKeyToServer === 'function') {
                        window.parent.saveKeyToServer(key, null);
                    }
                }
            }
        };

        // Auto-limpieza de cabeceras y barras laterales duplicadas cuando se renderiza dentro del iframe del portal
        function cleanDuplicateChrome() {
            // Si no estamos dentro de un iframe, no hacemos nada
            if (window.self === window.top) return;

            // Selectores de los elementos duplicados a ocultar
            const sidebarSelectors = [
                'nav.sidebar', 'aside.sidebar', '.sidebar',
                '[aria-label="Main Navigation"]',
                'header.app-header', 'header.dashboard-header', 'header.module-header',
                '.app-header', '.module-header', '.dashboard-header'
            ];

            sidebarSelectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                    el.style.display = 'none';
                });
            });

            // Ajustar contenedor principal para que aproveche el espacio liberado
            const mainCandidates = document.querySelectorAll('main, .main-content, .content, body > div > div, body > div');
            mainCandidates.forEach(el => {
                if (el.tagName === 'MAIN' || el.classList.contains('main-content') || el.classList.contains('content')) {
                    el.style.paddingLeft = '0';
                    el.style.marginLeft = '0';
                    el.style.width = '100%';
                }
            });

            // Inyectar banner sutil de pertenencia al portal
            if (!document.getElementById('sig-iframe-badge')) {
                const badge = document.createElement('div');
                badge.id = 'sig-iframe-badge';
                badge.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:linear-gradient(135deg,#003366,#0060ac);color:#fff;font-family:Inter,IBM Plex Sans,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.4px;border-radius:0 0 8px 8px;box-shadow:0 2px 6px rgba(0,0,0,0.15)"><span class="material-symbols-outlined" style="font-size:14px">verified_user</span> SIGE 2.0 — ' + (document.title || 'Módulo SGI') + '</span>';
                badge.style.cssText = 'position:fixed;top:0;left:16px;z-index:9999;pointer-events:none;';
                document.body.appendChild(badge);
            }
        }

        // Interceptar clics en los enlaces de navegación de la barra lateral del sub-módulo
        // para redirigirlos a la navegación principal del parent (index.html)
        document.addEventListener("DOMContentLoaded", function() {
            // Limpiar UI duplicada al cargar y tras pequeñas esperas (por si hay renderizado diferido)
            cleanDuplicateChrome();
            setTimeout(cleanDuplicateChrome, 250);
            setTimeout(cleanDuplicateChrome, 800);
            // Observar el DOM para limpiar elementos que aparezcan dinámicamente
            try {
                const observer = new MutationObserver(() => cleanDuplicateChrome());
                observer.observe(document.body, { childList: true, subtree: true });
            } catch(e) { /* navegador sin MutationObserver */ }
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
