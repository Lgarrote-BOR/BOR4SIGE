/**
 * api-sync.js
 * Interceptor de red y almacenamiento para Bor4SIGE.
 * Gestiona:
 * 1. Inyección de JWT y X-Tenant-ID en cabeceras de peticiones.
 * 2. Redirección y limpieza ante errores 401/403.
 * 3. Cola offline (FIFO) para resiliencia ante cortes de red o errores 5xx.
 * 4. Aislamiento lógico multi-tenant en iframes y resolución de conflictos visual.
 */
(function() {
    // Inyectar animación de CSS para el modal flotante
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .sig-conflict-modal {
            position: fixed;
            bottom: 24px;
            left: 24px;
            z-index: 10000;
            width: 380px;
            background: #ffffff;
            border-left: 5px solid #0060ac;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            border-radius: 8px;
            padding: 16px;
            font-family: 'Inter', sans-serif;
            animation: slideUp 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);

    const originalFetch = window.fetch;
    let isSyncing = false;

    // --- INTERCEPTOR DE PETICIONES (FETCH) ---
    window.fetch = async function(resource, options = {}) {
        const urlStr = typeof resource === 'string' ? resource : resource.url;
        
        // Inyectar tokens solo si es petición interna a la API y no es el login
        if (urlStr.includes('/api/') && !urlStr.includes('/api/auth/login')) {
            options.headers = options.headers || {};
            const token = localStorage.getItem('sig_jwt_token');
            if (token) {
                options.headers['Authorization'] = `Bearer ${token}`;
            }
            const tenant = localStorage.getItem('sig_active_tenant') || 'alfa';
            options.headers['X-Tenant-ID'] = tenant;
        }

        try {
            const response = await originalFetch(resource, options);

            // Interceptor de respuesta 401/403 (Sesión Expirada)
            if ((response.status === 401 || response.status === 403) && !urlStr.includes('/api/auth/login')) {
                handleUnauthorized();
                return response;
            }

            // Interceptor de errores 5xx para encolar operaciones de escritura
            if (response.status >= 500 && response.status < 600) {
                const method = options.method || 'GET';
                if (['POST', 'PUT', 'DELETE'].includes(method.toUpperCase())) {
                    enqueueOfflineRequest(method, urlStr, options.body);
                }
            }

            // Interceptor de resolución de conflictos en GET /api/store
            if (urlStr.includes('/api/store') && (!options.method || options.method.toUpperCase() === 'GET') && response.ok) {
                const clone = response.clone();
                clone.json().then(data => {
                    const metadata = data.sig_metadata || {};
                    for (const [key, serverVal] of Object.entries(data)) {
                        if (key === 'sig_metadata') continue;
                        
                        const localVal = localStorage.getItem(key);
                        const localTime = localStorage.getItem(`sig_time_${key}`);
                        const serverTime = metadata[key];

                        if (localVal && localTime && serverTime && localVal !== serverVal) {
                            if (new Date(serverTime) > new Date(localTime)) {
                                showConflictModal(key, localVal, serverVal);
                            }
                        }
                    }
                }).catch(e => console.error("Error al auditar conflictos en segundo plano:", e));
            }

            return response;
        } catch (err) {
            // Petición fallida por pérdida de conexión (offline)
            const method = options.method || 'GET';
            if (['POST', 'PUT', 'DELETE'].includes(method.toUpperCase())) {
                enqueueOfflineRequest(method, urlStr, options.body);
            }
            throw err;
        }
    };

    // --- COLA DE SINCRONIZACIÓN OFFLINE (FIFO) ---
    function enqueueOfflineRequest(method, url, body) {
        let queue = [];
        try {
            queue = JSON.parse(localStorage.getItem('sig_offline_queue')) || [];
        } catch (e) {
            queue = [];
        }

        const newRequest = {
            method,
            url,
            body: typeof body === 'string' ? body : JSON.stringify(body),
            timestamp: new Date().toISOString()
        };

        // Evitar encolar duplicados exactos seguidos
        if (queue.length > 0) {
            const last = queue[queue.length - 1];
            if (last.url === newRequest.url && last.body === newRequest.body) return;
        }

        queue.push(newRequest);
        localStorage.setItem('sig_offline_queue', JSON.stringify(queue));
        console.log("📥 Petición de escritura encolada en sig_offline_queue:", newRequest);
    }

    async function syncOfflineQueue() {
        if (isSyncing) return;
        let queue = [];
        try {
            queue = JSON.parse(localStorage.getItem('sig_offline_queue')) || [];
        } catch (e) {
            queue = [];
        }

        if (queue.length === 0) return;

        isSyncing = true;
        console.log(`🔄 Reconexión detectada. Enviando ${queue.length} peticiones pendientes al backend...`);

        while (queue.length > 0) {
            const req = queue[0];
            try {
                const token = localStorage.getItem('sig_jwt_token');
                const tenant = localStorage.getItem('sig_active_tenant') || 'alfa';
                
                const response = await originalFetch(req.url, {
                    method: req.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : '',
                        'X-Tenant-ID': tenant
                    },
                    body: req.body
                });

                if (response.ok) {
                    queue.shift(); // Eliminar de la cola tras éxito
                    localStorage.setItem('sig_offline_queue', JSON.stringify(queue));
                } else if (response.status === 401 || response.status === 403) {
                    handleUnauthorized();
                    break;
                } else {
                    console.warn(`⚠️ Error del servidor (${response.status}) procesando cola. Deteniendo reintentos.`);
                    break;
                }
            } catch (err) {
                console.error("🔌 Fallo de conexión durante reenvío FIFO:", err.message);
                break;
            }
        }
        isSyncing = false;
    }

    window.addEventListener('online', syncOfflineQueue);

    // --- MANEJO DE DESAUTENTICACIÓN ---
    function handleUnauthorized() {
        localStorage.setItem('sig_login_alert', 'Sesión expirada por motivos de seguridad.');
        localStorage.removeItem('sig_jwt_token');
        localStorage.removeItem('sig_offline_queue');
        
        if (window.parent && window.parent.sigDbState) {
            window.parent.sigDbState = {};
            window.parent.isServerActive = false;
        }

        const topLocation = window.top ? window.top.location : window.location;
        if (!topLocation.pathname.endsWith('/index.html') && !topLocation.pathname.endsWith('/')) {
            topLocation.href = '/index.html';
        }
    }

    // --- RESOLUCIÓN DE CONFLICTOS (MODAL PREMIUM FLOTANTE) ---
    function showConflictModal(key, localVal, serverVal) {
        if (document.getElementById('sig-conflict-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'sig-conflict-modal';
        modal.className = 'sig-conflict-modal';
        
        modal.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                <span class="material-symbols-outlined" style="color:#0060ac;font-size:24px;">sync_problem</span>
                <h4 style="margin:0;color:#003366;font-size:14px;font-weight:700;">Conflicto de Sincronización</h4>
            </div>
            <p style="margin:0 0-12px 0;font-size:11px;color:#555;line-height:1.4;">
                La clave <strong>${key}</strong> tiene cambios más recientes en el servidor. ¿Desea mantener su versión local o cargar la del servidor?
            </p>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
                <button id="btn-keep-local" style="background:#f1f3f9;color:#003366;border:none;padding:6px 12px;font-size:10px;font-weight:700;border-radius:4px;cursor:pointer;">Conservar Mío</button>
                <button id="btn-load-server" style="background:#003366;color:#ffffff;border:none;padding:6px 12px;font-size:10px;font-weight:700;border-radius:4px;cursor:pointer;">Cargar Servidor</button>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('btn-keep-local').addEventListener('click', () => {
            window.saveKeyToServer(key, localVal);
            modal.remove();
        });

        document.getElementById('btn-load-server').addEventListener('click', () => {
            localStorage.setItem(key, serverVal);
            if (window.parent && window.parent.sigDbState) {
                window.parent.sigDbState[key] = serverVal;
            }
            modal.remove();
            
            // Recargar iframe del módulo para refrescar la UI con los datos del servidor
            const iframe = document.getElementById('content-iframe');
            if (iframe) iframe.src = iframe.src;
        });
    }

    // --- AISLAMIENTO MULTI-TENANT EN IFRAMES (PROTOTYPE STORAGE) ---
    if (window.parent && window.parent !== window && window.parent.sigDbState) {
        const db = window.parent.sigDbState;

        // Capturar los métodos NATIVOS antes de sobrescribir el prototipo, para usarlos
        // con las claves internas (marcas de tiempo) sin reentrar en el interceptor.
        const nativeGetItem = Storage.prototype.getItem;
        const nativeSetItem = Storage.prototype.setItem;
        const nativeRemoveItem = Storage.prototype.removeItem;

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

        // Claves que NO deben tenantizarse ni interceptarse (timestamps internos y no-sig).
        function isInternalKey(key) {
            return !key || key.indexOf('sig_time_') === 0 || key.indexOf('sig_') !== 0;
        }

        function getTenantKey(key) {
            if (key && key.indexOf('sig_') === 0 && key.indexOf('sig_time_') !== 0 && !globalKeys.includes(key)) {
                const tenant = db['sig_active_tenant'] || 'alfa';
                if (!key.endsWith(`_${tenant}`)) {
                    return `${key}_${tenant}`;
                }
            }
            return key;
        }

        Storage.prototype.getItem = function(key) {
            // Claves internas o ajenas al SGI: usar el almacenamiento real.
            if (isInternalKey(key)) {
                return nativeGetItem.call(this, key);
            }
            const tenantKey = getTenantKey(key);
            if (tenantKey in db) {
                return db[tenantKey];
            }
            return null;
        };

        Storage.prototype.setItem = function(key, value) {
            if (isInternalKey(key)) {
                return nativeSetItem.call(this, key, value);
            }
            const tenantKey = getTenantKey(key);
            db[tenantKey] = value;

            // Marca de tiempo local mediante el método nativo (evita recursión).
            nativeSetItem.call(this, `sig_time_${tenantKey}`, new Date().toISOString());

            if (typeof window.parent.saveKeyToServer === 'function') {
                window.parent.saveKeyToServer(tenantKey, value);
            }
        };

        Storage.prototype.removeItem = function(key) {
            if (isInternalKey(key)) {
                return nativeRemoveItem.call(this, key);
            }
            const tenantKey = getTenantKey(key);
            delete db[tenantKey];

            nativeRemoveItem.call(this, `sig_time_${tenantKey}`);

            if (typeof window.parent.saveKeyToServer === 'function') {
                window.parent.saveKeyToServer(tenantKey, null);
            }
        };

        Storage.prototype.clear = function() {
            const tenant = db['sig_active_tenant'] || 'alfa';
            for (let key in db) {
                if (key.startsWith('sig_') && key.endsWith(`_${tenant}`) && !globalKeys.includes(key)) {
                    delete db[key];
                    nativeRemoveItem.call(this, `sig_time_${key}`);
                    if (typeof window.parent.saveKeyToServer === 'function') {
                        window.parent.saveKeyToServer(key, null);
                    }
                }
            }
        };
    }
})();
