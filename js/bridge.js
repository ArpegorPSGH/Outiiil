/*
 * bridge.js
 * Content script that runs in the ISOLATED world.
 * Acts as the communication bridge between the dynamic runtime (MAIN world
 * user script) and the background service worker.
 *
 * Message flow:
 *   MAIN world (runtime.js)  --postMessage-->  Isolated (this script)  --runtime.sendMessage-->  Background (SW)
 *   Background (SW)          --sendMessage-->  Isolated (this script)  --postMessage-->        MAIN world (runtime.js)
 */

(function () {
    'use strict';

    const OUTIIIL_TARGET = 'outiiil';
    const REQUEST_TYPE = 'OUTIIIL_RPC_REQUEST';
    const RESPONSE_TYPE = 'OUTIIIL_RPC_RESPONSE';
    const EVENT_TYPE = 'OUTIIIL_RPC_EVENT';
    const BRIDGE_READY_TYPE = 'OUTIIIL_BRIDGE_READY';
    const TOAST_CONFIG_TYPE = 'OUTIIIL_TOAST_CONFIG';
    const UPDATE_STATUS_ACTION = 'OUTIIIL_UPDATE_STATUS';
    const UPDATE_AVAILABLE_TYPE = 'OUTIIIL_UPDATE_AVAILABLE';
    const SHOW_PENDING_TYPE = 'OUTIIIL_SHOW_PENDING';
    const RELOAD_NOW_TYPE = 'OUTIIIL_RELOAD_NOW';
    const ORIGIN = '*';

    // Toast configuration pushed by the MAIN-world runtime on startup.
    // null = use built-in fallbacks inside getToastConfig().
    let toastConfig = null;

    // Set the extension base URL (used by Utils.getExtensionURL fallback)
    const extensionBaseUrl = chrome.runtime.getURL('');
    document.documentElement.setAttribute('data-outiiil-base-url', extensionBaseUrl);

    // Initialize dev mode to unknown, will be set by background response
    document.documentElement.setAttribute('data-outiiil-dev-mode', 'false');

    // Signal bridge readiness to the MAIN world runtime
    window.postMessage({
        type: BRIDGE_READY_TYPE,
        target: OUTIIIL_TARGET
    }, ORIGIN);

    // Query background for DEV_MODE state
    chrome.runtime.sendMessage({ type: 'GET_DEV_MODE' }, function (response) {
        if (chrome.runtime.lastError) {
            console.warn('[Outiiil Bridge] GET_DEV_MODE failed:', chrome.runtime.lastError.message);
            document.documentElement.setAttribute('data-outiiil-dev-mode', 'false');
            window.postMessage({
                type: 'OUTIIIL_DEV_MODE',
                target: OUTIIIL_TARGET,
                devMode: false
            }, ORIGIN);
            return;
        }
        if (response && response.devMode !== undefined) {
            document.documentElement.setAttribute('data-outiiil-dev-mode', response.devMode ? 'true' : 'false');
            // Signal dev mode info to the MAIN world runtime
            window.postMessage({
                type: 'OUTIIIL_DEV_MODE',
                target: OUTIIIL_TARGET,
                devMode: response.devMode
            }, ORIGIN);
        }
    });

    // --- RPC Request Forwarding (runtime -> bridge -> background) ---

    window.addEventListener('message', function (event) {
        var data = event.data;
        if (!data || typeof data !== 'object') return;
        if (data.target !== OUTIIIL_TARGET) return;

        // Runtime pushes its toast configuration to the bridge
        if (data.type === TOAST_CONFIG_TYPE) {
            toastConfig = (data.config && typeof data.config === 'object') ? data.config : null;
            console.log('[Outiiil Bridge] Toast config received from runtime');
            return;
        }

        // Runtime asks the bridge to show the "update pending" toast.
        if (data.type === SHOW_PENDING_TYPE) {
            showToast('success', data.version, null);
            return;
        }

        // Runtime reached a safe point (no in-progress transaction) and asks the
        // bridge to reload the page so the new runtime takes effect. The bridge owns
        // the toast DOM and the actual location.reload().
        if (data.type === RELOAD_NOW_TYPE) {
            console.log('[Outiiil Bridge] Reload now requested by runtime, version=' + data.version);
            performReload(data.version);
            return;
        }

        if (data.type !== REQUEST_TYPE) return;

        console.log('[Outiiil Bridge] RPC request received:', data.path, 'id=' + data.id);

        // Forward the RPC call to the background service worker
        chrome.runtime.sendMessage({
            type: 'CHROME_API_CALL',
            requestId: data.id,
            path: data.path,
            args: data.args
        }, function (response) {
            var lastErr = chrome.runtime.lastError;
            if (lastErr) {
                console.warn('[Outiiil Bridge] RPC forward to background FAILED for',
                    data.path, 'id=' + data.id,
                    'lastError keys=' + Object.keys(lastErr).join(',') +
                    ' lastError=' + JSON.stringify(lastErr) +
                    ' response=' + JSON.stringify(response));
                var errMsg = lastErr.message || JSON.stringify(lastErr) || 'RPC error (no details)';
                window.postMessage({
                    type: RESPONSE_TYPE,
                    target: OUTIIIL_TARGET,
                    id: data.id,
                    ok: false,
                    error: errMsg
                }, ORIGIN);
                return;
            }

            if (!response) {
                console.warn('[Outiiil Bridge] RPC forward to background returned no response for',
                    data.path, 'id=' + data.id,
                    'lastError=' + JSON.stringify(chrome.runtime.lastError));
                window.postMessage({
                    type: RESPONSE_TYPE,
                    target: OUTIIIL_TARGET,
                    id: data.id,
                    ok: false,
                    error: 'RPC error: no response from background'
                }, ORIGIN);
                return;
            }

            if (response.ok === undefined) {
                console.warn('[Outiiil Bridge] RPC response from background is malformed (missing ok) for',
                    data.path, 'id=' + data.id,
                    'response=' + JSON.stringify(response) +
                    ' lastError=' + JSON.stringify(chrome.runtime.lastError));
                window.postMessage({
                    type: RESPONSE_TYPE,
                    target: OUTIIIL_TARGET,
                    id: data.id,
                    ok: false,
                    error: 'RPC error: malformed response from background'
                }, ORIGIN);
                return;
            }

            var respErr = response && !response.ok ? response.error : undefined;
            console.log('[Outiiil Bridge] RPC response from background for',
                data.path, 'id=' + data.id, 'ok=' + response.ok,
                'error=' + respErr,
                'response=' + JSON.stringify(response));
            window.postMessage({
                type: RESPONSE_TYPE,
                target: OUTIIIL_TARGET,
                id: data.id,
                path: data.path,
                ok: response.ok,
                result: response.ok ? response.result : undefined,
                error: response.ok ? undefined : respErr
            }, ORIGIN);
        });
    });

    // --- Update Status Toast ---
    // The bridge owns the toast DOM. Update status arrives from the background
    // service worker (chrome.tabs.sendMessage) and is rendered here. The page
    // reload, however, is only triggered on OUTIIIL_RELOAD_NOW, which the
    // MAIN-world runtime sends once it has confirmed no in-progress transaction.
    // This keeps the toast visible even before the runtime is ready, while still
    // deferring the actual reload so it never interrupts a transaction.

    function getToastConfig() {
        return (toastConfig && typeof toastConfig === 'object') ? toastConfig : {};
    }

    function applyStyle(el, props) {
        for (var key in props) {
            el.style[key] = props[key];
        }
    }

    function showToast(status, version, error) {
        if (!status) return;
        var cfg = getToastConfig();
        var pos = cfg.position || 'top-right';

        // Remove any previous update toast
        var existing = document.getElementById('outiiil-update-toast');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

        var toast = document.createElement('div');
        toast.id = 'outiiil-update-toast';

        var fixed = {
            position: 'fixed',
            zIndex: String(cfg.zIndex || 2147483646),
            maxWidth: cfg.maxWidth || '360px',
            minWidth: cfg.minWidth || '240px',
            padding: '12px 14px',
            borderRadius: (cfg.radius !== undefined) ? cfg.radius : '10px',
            boxShadow: (cfg.shadow !== undefined) ? cfg.shadow : '0 8px 24px rgba(0,0,0,0.28)',
            background: cfg.background || 'rgba(255,255,255,0.95)',
            color: cfg.textColor || '#111111',
            fontFamily: '-apple-system, "Segoe UI", Roboto, Arial, sans-serif',
            fontSize: '13px',
            lineHeight: '1.4',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            opacity: '0',
            transition: 'opacity 180ms ease'
        };

        var p;
        switch (pos) {
            case 'top-left': p = { top: '16px', left: '16px' }; break;
            case 'top-center': p = { top: '16px', left: '50%', transform: 'translateX(-50%)' }; break;
            case 'bottom-left': p = { bottom: '16px', left: '16px' }; break;
            case 'bottom-center': p = { bottom: '16px', left: '50%', transform: 'translateX(-50%)' }; break;
            case 'bottom-right': p = { bottom: '16px', right: '16px' }; break;
            default: p = { top: '16px', right: '16px' }; break;
        }
        for (var pk in p) fixed[pk] = p[pk];
        applyStyle(toast, fixed);
        document.documentElement.appendChild(toast);
        requestAnimationFrame(function () { toast.style.opacity = '1'; });

        function setKind(kind) {
            while (toast.firstChild) toast.removeChild(toast.firstChild);

            var icon, text, color;
            if (kind === 'success') {
                icon = cfg.iconSuccess || '✅';
                text = (cfg.successText || 'Mise à jour v{version} terminée').replace('{version}', version || '');
                color = cfg.successColor || '#16a34a';
            } else if (kind === 'reloading') {
                icon = cfg.iconInProgress || '⏳';
                text = cfg.reloadingText || 'Rechargement en cours...';
                color = cfg.reloadingTextColor || '#8a6d1a';
                toast.style.background = cfg.reloadingBackground || 'rgba(255,247,214,0.97)';
            } else if (kind === 'error') {
                icon = cfg.iconError || '⚠️';
                text = (cfg.errorText || 'Mise à jour échouée : {error}').replace('{error}', error || 'erreur inconnue');
                color = cfg.errorColor || '#dc2626';
            } else if (kind === 'blocked') {
                icon = cfg.iconBlocked || '⚠️';
                text = (cfg.blockedText || 'Mise à jour bloquée : le socle de l\'extension a changé. ' +
                    'Réinstallez Outiiil v{version} depuis les releases GitHub.').replace('{version}', version || '');
                color = cfg.blockedColor || '#dc2626';
            } else { // in_progress (default)
                icon = cfg.iconInProgress || '⏳';
                text = cfg.inProgressText || 'Mise à jour en cours...';
                color = cfg.textColor || '#111111';
            }

            var iconEl = document.createElement('span');
            iconEl.textContent = icon;
            iconEl.style.cssText = 'flex:0 0 auto;font-size:18px;line-height:1;';

            var textEl = document.createElement('span');
            textEl.textContent = text;
            textEl.style.cssText = 'flex:1 1 auto;';
            if (color) textEl.style.color = color;

            toast.appendChild(iconEl);
            toast.appendChild(textEl);

            if (kind === 'error' && cfg.cancelable) {
                var btn = document.createElement('button');
                btn.textContent = 'Réessayer';
                btn.style.cssText = 'flex:0 0 auto;margin-left:8px;padding:6px 10px;border:none;border-radius:6px;background:#dc2626;color:#fff;cursor:pointer;font-size:12px;font-family:inherit;';
                btn.addEventListener('click', function () {
                    toast.style.opacity = '0';
                    chrome.runtime.sendMessage({ type: 'CHECK_UPDATE' }, function () { });
                });
                toast.appendChild(btn);
            }

            if (kind === 'blocked' && cfg.cancelable) {
                var btnReinstall = document.createElement('button');
                btnReinstall.textContent = cfg.blockedButton || 'Réinstaller';
                btnReinstall.style.cssText = 'flex:0 0 auto;margin-left:8px;padding:6px 10px;border:none;border-radius:6px;background:#dc2626;color:#fff;cursor:pointer;font-size:12px;font-family:inherit;';
                btnReinstall.addEventListener('click', function () {
                    toast.style.opacity = '0';
                    chrome.runtime.sendMessage({ type: 'OPEN_RELEASES_PAGE' });
                });
                toast.appendChild(btnReinstall);
            }
        }

        setKind(status);
    }

    // Actually reload the page. Called only when the MAIN-world runtime has
    // confirmed a safe point (no in-progress transaction). Shows the "reloading"
    // state briefly, then reloads.
    function performReload(version) {
        showToast('reloading', version, null);
        setTimeout(function () { window.location.reload(); }, 600);
    }

    // --- Event Forwarding (background -> bridge -> runtime) ---
    // The background uses chrome.tabs.sendMessage to forward events to the tab,
    // which arrives here via chrome.runtime.onMessage.

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (!message) return false;

        // Update status pushed by the background service worker
        if (message.action === UPDATE_STATUS_ACTION) {
            if (message.status === 'in_progress') {
                showToast('in_progress', message.version, null);
            } else if (message.status === 'error') {
                showToast('error', null, message.error);
            } else if (message.status === 'blocked') {
                showToast('blocked', message.version, null);
            } else if (message.status === 'success') {
                // New runtime is cached/registered. Show the "pending" toast and hand
                // the decision to the MAIN world, which reloads only at a safe point
                // (never mid-transaction) and then sends OUTIIIL_RELOAD_NOW back.
                showToast('success', message.version, null);
                window.postMessage({
                    type: UPDATE_AVAILABLE_TYPE,
                    target: OUTIIIL_TARGET,
                    version: message.version
                }, ORIGIN);
            }
            return false;
        }

        if (!message.target) return false;
        if (message.target !== OUTIIIL_TARGET) return false;

        if (message.type === EVENT_TYPE) {
            window.postMessage({
                type: EVENT_TYPE,
                target: OUTIIIL_TARGET,
                cbId: message.cbId,
                payload: message.payload
            }, ORIGIN);
            return false;
        }

        return false;
    });
})();
