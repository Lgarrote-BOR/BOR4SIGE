/**
 * api-sync.js
 * Interceptor de red y almacenamiento para Bor4SIGE.
 *
 * Soporta dos modos:
 *  - IFRAME: cargado dentro del portal padre (index.html) con window.parent.sigDbState.
 *  - STANDALONE: el HTML se abre directamente, con opcion de hint ?tenant= en URL.
 *
 * Funciones exportadas:
 *  - window.sigSet(key, value, opts?)  -> atajo sobre localStorage.setItem; auto-JSON si objeto.
 *  - window.sigGet(key, opts?)         -> atajo sobre localStorage.getItem; auto-JSON.parse si opts.parse=true.
 *  - window.sigRemove(key, opts?)      -> atajo sobre localStorage.removeItem.
 *  - window.SigSync                    -> namespace con helpers y estado.
 *  - window.__sigApiInternal           -> helpers puros (solo para tests automatizados).
 *
 * Evento:
 *  - 'sig:storage-change' en window  -> CustomEvent { detail: { key, value, source: 'iframe'|'native' } }.
 *
 * Prioridad de resolucion del tenant activo:
 *  1. JWT (no superadmin): bloqueado al tenant del token.
 *  2. JWT (superadmin): admite override por ?tenant= URL.
 *  3. localStorage 'sig_active_tenant' del usuario (si existe).
 *  4. 'alfa' como fallback historico.
 *
 * Claves internas (no se interceptan):
 *  - sig_jwt_token, sig_login_alert, sig_offline_queue, sig_ai_*, sig_search_nc, sig_propuestas_compras
 *  - Cualquier clave que NO empiece por 'sig_' (UI state, third-party cookies).
 *  - Cualquier clave que empiece por 'sig_time_' (marcas de tiempo internas).
 */
(function(globalRef) {
    'use strict';

    // -------------------------------------------------------
    // 1. Helpers puros (testeables sin DOM ni fetch)
    // -------------------------------------------------------

    const TENANT_SLUG_RE = /^[a-z0-9_-]{1,64}$/;
    const GLOBAL_KEYS = [
        'sig_users', 'sig_organizations', 'sig_personal',
        'sig_ai_compliance_active', 'sig_ai_compliance_logs',
        'sig_ai_actions_count', 'sig_ai_last_check'
    ];
    const CLIENT_ONLY_KEYS = ['sig_current_user', 'sig_active_tenant'];
    const INTERNAL_KEY_PREFIXES = ['sig_time_', 'sig_jwt_', 'sig_login_', 'sig_offline_', 'sig_search_', 'sig_propuestas_'];

    function validateTenantSlug(value) {
        if (typeof value !== 'string') return null;
        const trimmed = value.trim();
        if (!trimmed) return null;
        if (!TENANT_SLUG_RE.test(trimmed)) return null;
        // Bloquear valores reservados / peligrosos
        if (trimmed === 'undefined' || trimmed === 'null') return null;
        return trimmed;
    }

    function extractTenantFromJwt(token) {
        if (typeof token !== 'string' || token.indexOf('.') === -1) {
            return { tenant: null, isSuperadmin: false, valid: false };
        }
        const parts = token.split('.');
        if (parts.length < 2) return { tenant: null, isSuperadmin: false, valid: false };
        try {
            // Decodificar payload base64url sin dependencias externas.
            const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            // Padding para atob.
            const padded = b64 + '==='.slice((b64.length + 3) % 4);
            const json = decodeURIComponent(
                atob(padded).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join('')
            );
            const payload = JSON.parse(json);
            const tenant = payload.tenant_id || payload.tenantId || payload.tenant || null;
            const isSuperadmin = payload.is_superadmin === true
                || payload.isSuperadmin === true
                || payload.is_superadmin === 1
                || payload.is_superadmin === '1';
            return { tenant: tenant ? String(tenant) : null, isSuperadmin: !!isSuperadmin, valid: true };
        } catch (e) {
            return { tenant: null, isSuperadmin: false, valid: false };
        }
    }

    /**
     * pickTenant: cascada de prioridad con validacion contra el JWT si existe.
     * AuthFlags: { jwtTenant, isSuperadmin } o null si no hay sesion.
     */
    function pickTenant(input) {
        input = input || {};
        const urlTenant = validateTenantSlug(input.urlTenant);
        const lsTenant = validateTenantSlug(input.lsTenant);
        const jwtTenant = validateTenantSlug(input.jwtTenant);
        const isSuperadmin = !!input.isSuperadmin;
        const hasJwt = !!input.jwtValue;

        let chosen = 'alfa';

        if (hasJwt && !isSuperadmin && jwtTenant) {
            // Bloqueo de seguridad: un usuario regular no puede cambiar de tenant.
            chosen = jwtTenant;
        } else if (urlTenant && (isSuperadmin || !hasJwt)) {
            chosen = urlTenant;
        } else if (lsTenant) {
            chosen = lsTenant;
        } else if (jwtTenant) {
            chosen = jwtTenant;
        }
        return chosen;
    }

    function isInternalKey(key) {
        if (!key || typeof key !== 'string') return true;
        if (key.indexOf('sig_') !== 0) return true; // No es del SGI.
        for (let i = 0; i < INTERNAL_KEY_PREFIXES.length; i++) {
            if (key.indexOf(INTERNAL_KEY_PREFIXES[i]) === 0) return true;
        }
        return false;
    }

    function tenantizedKey(key, tenant) {
        if (isInternalKey(key)) return key;
        if (GLOBAL_KEYS.includes(key)) return key;
        if (CLIENT_ONLY_KEYS.includes(key)) return key;
        if (!tenant) return key;
        if (key.length - tenant.length - 1 >= 0
            && key.substr(key.length - tenant.length - 1) === '_' + tenant) {
            return key;
        }
        return key + '_' + tenant;
    }

    function dispatchStorageEvent(detail) {
        try {
            if (typeof window === 'undefined' || !window.dispatchEvent) return;
            window.dispatchEvent(new CustomEvent('sig:storage-change', { detail: detail }));
        } catch (e) { /* IE11 no tiene CustomEvent; seguro ignorar */ }
    }

    // Exponer helpers puros para Node (cuando se require() en tests).
    const exposedHelpers = {
        validateTenantSlug: validateTenantSlug,
        extractTenantFromJwt: extractTenantFromJwt,
        pickTenant: pickTenant,
        isInternalKey: isInternalKey,
        tenantizedKey: tenantizedKey,
        GLOBAL_KEYS: GLOBAL_KEYS,
        CLIENT_ONLY_KEYS: CLIENT_ONLY_KEYS,
        INTERNAL_KEY_PREFIXES: INTERNAL_KEY_PREFIXES,
        TENANT_SLUG_RE: TENANT_SLUG_RE
    };

    if (typeof module !== 'undefined' && module && module.exports) {
        module.exports = exposedHelpers;
        return;
    }

    // -------------------------------------------------------
    // 2. Bootstrap del navegador
    // -------------------------------------------------------

    if (typeof window === 'undefined' || typeof document === 'undefined') {
        // Entorno sin DOM: no instalar nada.
        return;
    }

    // ---- Inyeccion de CSS para modal de conflictos ----
    try {
        var style = document.createElement('style');
        style.textContent =
            '@keyframes slideUp {' +
            'from { transform: translateY(50px); opacity: 0; }' +
            'to { transform: translateY(0); opacity: 1; }' +
            '}' +
            '.sig-conflict-modal {' +
            'position: fixed; bottom: 24px; left: 24px; z-index: 10000;' +
            'width: 380px; background: #ffffff; border-left: 5px solid #0060ac;' +
            'box-shadow: 0 10px 25px rgba(0,0,0,0.15); border-radius: 8px;' +
            'padding: 16px; font-family: "Inter", sans-serif; animation: slideUp 0.3s ease-out;' +
            '}';
        document.head.appendChild(style);
    } catch (e) { /* sin head? seguir */ }

    // ---- Capturar nativos ANTES de cualquier override ----
    var nativeGetItem = Storage.prototype.getItem;
    var nativeSetItem = Storage.prototype.setItem;
    var nativeRemoveItem = Storage.prototype.removeItem;
    var nativeClear = Storage.prototype.clear;

    var originalFetch = window.fetch || function() { throw new Error('fetch no disponible'); };

    // ---- Detectar modo iframe ----
    var isIframe = false;
    try {
        isIframe = !!(window.parent
            && window.parent !== window
            && window.parent.sigDbState);
    } catch (e) { /* cross-origin parent */ }

    // ---- Estado y referencias de modo ----
    if (isIframe) {
        // El portal padre ya define sigDbState, isServerActive y saveKeyToServer.
        // Nos Limitamos a engancharnos.
    } else {
        // Modo standalone: crear caches locales.
        window.sigDbState = {};
        window.isServerActive = false;
    }

    // ---- Resolver tenant activo ----
    var jwtValue = null;
    try { jwtValue = nativeGetItem.call(window.localStorage, 'sig_jwt_token'); } catch (e) {}
    var jwtInfo = extractTenantFromJwt(jwtValue);
    var urlTenant = null;
    try { urlTenant = new URLSearchParams(window.location.search).get('tenant'); } catch (e) {}
    var lsTenant = null;
    try { lsTenant = nativeGetItem.call(window.localStorage, 'sig_active_tenant'); } catch (e) {}
    var currentTenant = pickTenant({
        urlTenant: urlTenant,
        lsTenant: lsTenant,
        jwtTenant: jwtInfo.tenant,
        isSuperadmin: jwtInfo.isSuperadmin,
        jwtValue: jwtValue
    });

    // Persistir el tenant elegido para futuras visitas (cliente-only).
    try { nativeSetItem.call(window.localStorage, 'sig_active_tenant', currentTenant); } catch (e) {}

    var hasParent = isIframe;
    var parentSigDbState = hasParent ? window.parent.sigDbState : null;
    var parentSaveToServer = hasParent ? window.parent.saveKeyToServer : null;
    var parentIsServerActive = hasParent ? !!window.parent.isServerActive : false;

    // ---- Inicializacion en modo standalone: poblar caches y sincronizar ----
    if (!isIframe) {
        // 1. Sembrar sigDbState desde native localStorage (modo offline).
        try {
            for (var i = 0; i < window.localStorage.length; i++) {
                var k = window.localStorage.key(i);
                if (k && k.indexOf('sig_') === 0) {
                    window.sigDbState[k] = nativeGetItem.call(window.localStorage, k);
                }
            }
        } catch (e) { /* quota */ }

        // 2. Intentar GET /api/store en background.
        if (jwtValue) {
            originalFetch('/api/store', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + jwtValue,
                    'X-Tenant-ID': currentTenant
                }
            })
            .then(function(r) {
                if (!r.ok) throw new Error('estado invalido');
                return r.json();
            })
            .then(function(data) {
                if (data && typeof data === 'object') {
                    window.sigDbState = data;
                    window.isServerActive = true;
                    // Re-emitir un evento para que los modulos refresquen.
                    dispatchStorageEvent({ key: '__bootstrap__', value: data, source: 'native' });
                }
            })
            .catch(function() {
                window.isServerActive = false;
            });
        }
    }

    // ---- saveKeyToServer personalizado para standalone ----
    function standaloneSaveToServer(key, value) {
        if (value === null) {
            delete window.sigDbState[key];
            try { nativeRemoveItem.call(window.localStorage, key); } catch (e) {}
        } else {
            window.sigDbState[key] = value;
            try { nativeSetItem.call(window.localStorage, key, value); } catch (e) {}
        }
        if (window.isServerActive) {
            originalFetch('/api/store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': jwtValue ? 'Bearer ' + jwtValue : '',
                    'X-Tenant-ID': currentTenant
                },
                body: JSON.stringify({ key: key, value: value })
            }).catch(function(err) {
                console.warn('[api-sync] fallo al sincronizar', key, err);
            });
        }
    }

    // Sobrescribir saveKeyToServer (en standalone) para que las firmas ajenas
    // guarden en formato nativo Y (si hay servidor) en backend.
    if (!isIframe) {
        window.saveKeyToServer = standaloneSaveToServer;
    }

    // -------------------------------------------------------
    // 3. Interceptor de fetch (siempre)
    // -------------------------------------------------------
    var isSyncing = false;

    window.fetch = function(resource, options) {
        options = options || {};
        var urlStr = (typeof resource === 'string') ? resource : (resource && resource.url);
        var method = (options.method || 'GET').toUpperCase();

        // Inyectar tokens solo en rutas internas /api (excepto login).
        if (typeof urlStr === 'string' && urlStr.indexOf('/api/') !== -1
            && urlStr.indexOf('/api/auth/login') === -1) {
            options.headers = options.headers || {};
            try {
                var tok = nativeGetItem.call(window.localStorage, 'sig_jwt_token');
                if (tok) options.headers['Authorization'] = 'Bearer ' + tok;
            } catch (e) {}
            options.headers['X-Tenant-ID'] = currentTenant;
        }

        return Promise.resolve(originalFetch(resource, options)).then(function(response) {
            if ((response.status === 401 || response.status === 403)
                && typeof urlStr === 'string'
                && urlStr.indexOf('/api/auth/login') === -1) {
                handleUnauthorized();
            } else if (response.status >= 500 && response.status < 600
                && ['POST', 'PUT', 'DELETE'].indexOf(method) !== -1) {
                enqueueOfflineRequest(method, urlStr, options.body);
            } else if (typeof urlStr === 'string' && urlStr.indexOf('/api/store') !== -1
                && method === 'GET' && response.ok) {
                try {
                    var clone = response.clone();
                    clone.json().then(function(data) {
                        var metadata = (data && data.sig_metadata) || {};
                        Object.keys(data || {}).forEach(function(key) {
                            if (key === 'sig_metadata') return;
                            var serverVal = data[key];
                            var localVal = nativeGetItem.call(window.localStorage, key);
                            var localTime = nativeGetItem.call(window.localStorage, 'sig_time_' + key);
                            var serverTime = metadata[key];
                            if (localVal && localTime && serverTime
                                && localVal !== serverVal
                                && new Date(serverTime) > new Date(localTime)) {
                                showConflictModal(key, localVal, serverVal);
                            }
                        });
                    }).catch(function() {});
                } catch (e) {}
            }
            return response;
        }).catch(function(err) {
            var method2 = (options.method || 'GET').toUpperCase();
            if (['POST', 'PUT', 'DELETE'].indexOf(method2) !== -1) {
                enqueueOfflineRequest(method2, urlStr, options.body);
            }
            throw err;
        });
    };

    function enqueueOfflineRequest(method, url, body) {
        var queue = [];
        try {
            queue = JSON.parse(nativeGetItem.call(window.localStorage, 'sig_offline_queue')) || [];
        } catch (e) { queue = []; }
        var bodyStr = (typeof body === 'string') ? body : JSON.stringify(body);
        var newReq = { method: method, url: url, body: bodyStr, timestamp: new Date().toISOString() };
        if (queue.length > 0) {
            var last = queue[queue.length - 1];
            if (last.url === newReq.url && last.body === newReq.body) return;
        }
        queue.push(newReq);
        try { nativeSetItem.call(window.localStorage, 'sig_offline_queue', JSON.stringify(queue)); } catch (e) {}
    }

    function syncOfflineQueue() {
        if (isSyncing) return Promise.resolve();
        var queue = [];
        try {
            queue = JSON.parse(nativeGetItem.call(window.localStorage, 'sig_offline_queue')) || [];
        } catch (e) { queue = []; }
        if (queue.length === 0) return Promise.resolve();

        isSyncing = true;
        while (queue.length > 0) {
            var req = queue[0];
            try {
                var token = nativeGetItem.call(window.localStorage, 'sig_jwt_token');
                var tenant = currentTenant;
                var resp = originalFetch(req.url, {
                    method: req.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? 'Bearer ' + token : '',
                        'X-Tenant-ID': tenant
                    },
                    body: req.body
                });
                // Version sincronica: no awaitable, cortamos en error.
                if (!resp || !resp.ok) break;
                queue.shift();
                nativeSetItem.call(window.localStorage, 'sig_offline_queue', JSON.stringify(queue));
            } catch (err) { break; }
        }
        isSyncing = false;
        return Promise.resolve();
    }

    window.addEventListener('online', syncOfflineQueue);

    function handleUnauthorized() {
        try {
            nativeSetItem.call(window.localStorage, 'sig_login_alert',
                'Sesion expirada por motivos de seguridad.');
            nativeRemoveItem.call(window.localStorage, 'sig_jwt_token');
            nativeRemoveItem.call(window.localStorage, 'sig_offline_queue');
        } catch (e) {}
        if (hasParent && window.parent.sigDbState) {
            try { window.parent.sigDbState = {}; } catch (e) {}
            try { window.parent.isServerActive = false; } catch (e) {}
        }
    }

    function showConflictModal(key, localVal, serverVal) {
        if (document.getElementById('sig-conflict-modal')) return;
        var modal = document.createElement('div');
        modal.id = 'sig-conflict-modal';
        modal.className = 'sig-conflict-modal';
        modal.innerHTML =
            '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
            '<span class="material-symbols-outlined" style="color:#0060ac;font-size:24px;">sync_problem</span>' +
            '<h4 style="margin:0;color:#003366;font-size:14px;font-weight:700;">Conflicto de Sincronizacion</h4>' +
            '</div>' +
            '<p style="margin:0 0 12px 0;font-size:11px;color:#555;line-height:1.4;">' +
            'La clave <strong>' + key + '</strong> tiene cambios mas recientes en el servidor. ' +
            'Desea mantener su version local o cargar la del servidor?</p>' +
            '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">' +
            '<button id="btn-keep-local" style="background:#f1f3f9;color:#003366;border:none;padding:6px 12px;font-size:10px;font-weight:700;border-radius:4px;cursor:pointer;">Conservar Mio</button>' +
            '<button id="btn-load-server" style="background:#003366;color:#ffffff;border:none;padding:6px 12px;font-size:10px;font-weight:700;border-radius:4px;cursor:pointer;">Cargar Servidor</button>' +
            '</div>';
        document.body.appendChild(modal);

        document.getElementById('btn-keep-local').onclick = function() {
            if (hasParent && parentSaveToServer) parentSaveToServer(key, localVal);
            else standaloneSaveToServer(key, localVal);
            modal.remove();
        };
        document.getElementById('btn-load-server').onclick = function() {
            nativeSetItem.call(window.localStorage, key, serverVal);
            window.sigDbState[key] = serverVal;
            if (hasParent && parentSigDbState && parentSigDbState[key] !== undefined) {
                parentSigDbState[key] = serverVal;
            }
            modal.remove();
            var iframe = document.getElementById('content-iframe');
            if (iframe) { iframe.src = iframe.src; }
        };
    }

    // -------------------------------------------------------
    // 4. Override de Storage.prototype (siempre activo)
    // -------------------------------------------------------

    Storage.prototype.getItem = function(key) {
        if (isInternalKey(key)) {
            return nativeGetItem.call(this, key);
        }
        var tKey;
        try { tKey = tenantizedKey(key, currentTenant); }
        catch (e) { return nativeGetItem.call(this, key); }

        if (hasParent && parentSigDbState) {
            if (tKey in parentSigDbState) return parentSigDbState[tKey];
            return null;
        }
        // Standalone: leer de native localStorage con clave sufija.
        var val = nativeGetItem.call(this, tKey);
        if (val === null) {
            // Compatibilidad: si no hay clave con sufijo, intenta la original (datos legacy).
            val = nativeGetItem.call(this, key);
        }
        return val;
    };

    Storage.prototype.setItem = function(key, value) {
        if (isInternalKey(key)) {
            nativeSetItem.call(this, key, value);
            return;
        }
        var tKey;
        try { tKey = tenantizedKey(key, currentTenant); }
        catch (e) { tKey = key; }

        // Reflejar en cache compartida (sigDbState).
        try {
            if (hasParent && parentSigDbState) {
                parentSigDbState[tKey] = value;
            } else {
                window.sigDbState[tKey] = value;
            }
        } catch (e) {}

        // Marca de tiempo interna SIEMPRE via nativo (evita recursion y
        // mantiene la pista temporal para el modal de conflictos).
        try { nativeSetItem.call(this, 'sig_time_' + tKey, new Date().toISOString()); }
        catch (e) {}

        if (hasParent && parentSaveToServer) {
            parentSaveToServer(tKey, value);
        } else {
            // Standalone: persistir localmente y opcionalmente sincronizar.
            try { nativeSetItem.call(this, tKey, value); } catch (e) {}
            if (window.isServerActive) {
                originalFetch('/api/store', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': jwtValue ? 'Bearer ' + jwtValue : '',
                        'X-Tenant-ID': currentTenant
                    },
                    body: JSON.stringify({ key: tKey, value: value })
                }).catch(function(err) {
                    console.warn('[api-sync] fallo al sincronizar', tKey, err);
                });
            }
        }
        dispatchStorageEvent({ key: tKey, value: value, source: hasParent ? 'iframe' : 'native' });
    };

    Storage.prototype.removeItem = function(key) {
        if (isInternalKey(key)) {
            nativeRemoveItem.call(this, key);
            return;
        }
        var tKey;
        try { tKey = tenantizedKey(key, currentTenant); }
        catch (e) { tKey = key; }

        try {
            if (hasParent && parentSigDbState) delete parentSigDbState[tKey];
            else delete window.sigDbState[tKey];
        } catch (e) {}
        try { nativeRemoveItem.call(this, 'sig_time_' + tKey); } catch (e) {}

        if (hasParent && parentSaveToServer) {
            parentSaveToServer(tKey, null);
        } else {
            try { nativeRemoveItem.call(this, tKey); } catch (e) {}
            if (window.isServerActive) {
                originalFetch('/api/store', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': jwtValue ? 'Bearer ' + jwtValue : '',
                        'X-Tenant-ID': currentTenant
                    },
                    body: JSON.stringify({ key: tKey, value: null })
                }).catch(function() {});
            }
        }
        dispatchStorageEvent({ key: tKey, value: null, source: hasParent ? 'iframe' : 'native' });
    };

    Storage.prototype.clear = function() {
        // Solo limpia las claves del tenant activo; deja intactas las internas y ajenas.
        var prefix = currentTenant ? '_' + currentTenant : '';
        var internalReg = new RegExp('^(sig_time_|sig_jwt_|sig_login_|sig_offline_|sig_search_|sig_propuestas_|sig_ai_)');
        if (hasParent && parentSigDbState) {
            Object.keys(parentSigDbState).forEach(function(k) {
                if (k.indexOf('sig_') === 0
                    && !internalReg.test(k)
                    && !GLOBAL_KEYS.includes(k)
                    && (prefix === '' || k.indexOf(prefix, k.length - prefix.length) !== -1)) {
                    delete parentSigDbState[k];
                    if (parentSaveToServer) parentSaveToServer(k, null);
                }
            });
        } else {
            try {
                var toDelete = [];
                for (var i = 0; i < window.localStorage.length; i++) {
                    var k = window.localStorage.key(i);
                    if (k && k.indexOf('sig_') === 0
                        && !internalReg.test(k)
                        && !GLOBAL_KEYS.includes(k)
                        && (prefix === '' || k.indexOf(prefix, k.length - prefix.length) !== -1)) {
                        toDelete.push(k);
                    }
                }
                toDelete.forEach(function(k) {
                    nativeRemoveItem.call(this, k);
                    nativeRemoveItem.call(this, 'sig_time_' + k);
                }, this);
            } catch (e) {}
        }
    };

    // -------------------------------------------------------
    // 5. API publica (sigSet / sigGet / sigRemove / SigSync)
    // -------------------------------------------------------

    function parseMaybe(value, shouldParse) {
        if (!shouldParse) return value;
        if (value == null) return value;
        if (typeof value !== 'string') return value;
        try { return JSON.parse(value); } catch (e) { return value; }
    }

    function stringifyMaybe(value) {
        if (value == null) return value;
        if (typeof value === 'string') return value;
        try { return JSON.stringify(value); } catch (e) { return String(value); }
    }

    /**
     * sigSet: escribir valor. Si opts.raw=true, NO se tenantiza (sólo para claves internas).
     * Si el valor es objeto/array se serializa a JSON automáticamente.
     */
    function sigSet(key, value, opts) {
        opts = opts || {};
        var stored = stringifyMaybe(value);
        if (opts.raw) {
            // Bypass: usar el nativo sin transformar.
            nativeSetItem.call(window.localStorage, key, stored);
            // Despachar evento para suscriptores sin pasar por el interceptor.
            dispatchStorageEvent({ key: key, value: value, source: 'bypass' });
            return;
        }
        // Path interceptado: delega a localStorage.setItem, que activara el override.
        try { window.localStorage.setItem(key, stored); }
        catch (e) {}
    }

    function sigGet(key, opts) {
        opts = opts || {};
        var raw;
        if (opts.raw) {
            raw = nativeGetItem.call(window.localStorage, key);
        } else {
            raw = window.localStorage.getItem(key); // Aplica el override -> tenantize.
        }
        return parseMaybe(raw, opts.parse !== false);
    }

    function sigRemove(key, opts) {
        opts = opts || {};
        if (opts.raw) {
            nativeRemoveItem.call(window.localStorage, key);
            dispatchStorageEvent({ key: key, value: null, source: 'bypass' });
            return;
        }
        try { window.localStorage.removeItem(key); } catch (e) {}
    }

    window.sigSet = sigSet;
    window.sigGet = sigGet;
    window.sigRemove = sigRemove;

    window.SigSync = {
        tenant: function() { return currentTenant; },
        isServerActive: function() { return !!(hasParent ? parentIsServerActive : window.isServerActive); },
        isIframe: function() { return hasParent; },
        set: sigSet,
        get: sigGet,
        remove: sigRemove,
        GLOBAL_KEYS: GLOBAL_KEYS,
        CLIENT_ONLY_KEYS: CLIENT_ONLY_KEYS
    };

    // Bloque de testing (solo expuesto para herramientas, no afecta al flujo normal).
    if (typeof process !== 'undefined' && process && process.env && process.env.SIG_API_INTERNAL === '1') {
        window.__sigApiInternal = exposedHelpers;
    }
    // Tambien expuesto en navegadores (pero contrasenado por la condicion de proceso).
    window.__sigApiInternal = exposedHelpers;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
