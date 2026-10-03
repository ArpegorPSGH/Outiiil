/*
 * runtime_init.js
 * Initialization code for the dynamic runtime (user script in MAIN world).
 * Handles:
 *   - Waiting for browserAPI to become ready
 *   - Loading cached images from chrome.storage.local via browserAPI
 *   - Setting up window.OUTIIIL_DYNAMIC_IMAGES with blob URLs
 *   - Exposing the extension version on window.VERSION
 *
 * This file is prepended to the runtime bundle before the game logic.
 */

(function () {
    'use strict';

    const STORAGE_KEY_IMAGES = 'outiiil_cached_images';
    const STORAGE_KEY_VERSION = 'outiiil_runtime_version';
    const STORAGE_KEY_BROWSER_API = 'outiiil_browser_api_code';

    function getMimeType(path) {
        var lower = path.toLowerCase();
        if (lower.endsWith('.gif')) return 'image/gif';
        if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
        if (lower.endsWith('.svg')) return 'image/svg+xml';
        return 'image/png';
    }

    // Retry helper for RPC calls to the service worker (background.js).
    // The service worker may not be running yet on first load, so transient
    // "RPC error: ..." failures should be retried.
    async function rpcWithRetry(fn, maxRetries, delayMs) {
        maxRetries = maxRetries || 5;
        delayMs = delayMs || 500;
        var lastError = null;
        for (var attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                console.log('[Outiiil Diagnostic] RPC attempt ' + (attempt + 1) + '/' + (maxRetries + 1));
                var result = await fn();
                console.log('[Outiiil Diagnostic] RPC success on attempt ' + (attempt + 1));
                return result;
            } catch (e) {
                lastError = e;
                console.log('[Outiiil Diagnostic] RPC attempt ' + (attempt + 1) + ' failed:', e.message || e);
                if (attempt < maxRetries) {
                    var waitMs = delayMs * (attempt + 1);
                    console.log('[Outiiil Diagnostic] Retrying in ' + waitMs + 'ms...');
                    await new Promise(function (r) { setTimeout(r, waitMs); });
                }
            }
        }
        console.log('[Outiiil Diagnostic] RPC all attempts failed, throwing');
        throw lastError;
    }

    async function applyImagesFromCache() {
        console.log('[Outiiil Runtime] applyImagesFromCache: starting, bridgeReady=' +
            (window.browserAPI && window.browserAPI._ready ? 'pending' : 'unknown'));
        try {
            var cached = await rpcWithRetry(function () {
                console.log('[Outiiil Runtime] applyImagesFromCache: calling storage.local.get');
                return window.browserAPI.storage.local.get([STORAGE_KEY_IMAGES]);
            });
            var images = cached[STORAGE_KEY_IMAGES];
            if (!images || Object.keys(images).length === 0) {
                console.log('[Outiiil Runtime] applyImagesFromCache: no cached images');
                return;
            }

            var blobs = {};
            for (var [path, dataUrl] of Object.entries(images)) {
                try {
                    var mime = getMimeType(path);
                    var octets = Uint8Array.from(atob(dataUrl.split(',')[1]), c => c.charCodeAt(0));
                    blobs[path] = URL.createObjectURL(new Blob([octets], { type: mime }));
                } catch (e) {
                    console.warn('[Outiiil] Image cache error for:', path, e);
                }
            }
            window.OUTIIIL_DYNAMIC_IMAGES = blobs;
            console.log('[Outiiil] Dynamic images loaded:', Object.keys(blobs).length);
        } catch (e) {
            console.warn('[Outiiil] Failed to load cached images:', e);
            console.warn('[Outiiil] applyImagesFromCache context - name=' + (e && e.name) +
                ' message=' + (e && e.message) +
                ' bridgeReady=' + (window.browserAPI ? 'defined' : 'undefined') +
                ' storage.local=' + (window.browserAPI && window.browserAPI.storage ? 'defined' : 'undefined'));
            try {
                console.warn('[Outiiil] applyImagesFromCache error object dump:',
                    JSON.stringify(e, Object.getOwnPropertyNames(e || {})));
            } catch (dumpErr) {
                console.warn('[Outiiil] applyImagesFromCache error dump failed:', dumpErr);
            }
        }
    }

    async function initRuntime() {
        // Wait for the bridge to be ready
        try {
            await window.browserAPI._ready;
        } catch (e) {
            console.warn('[Outiiil] Browser API not ready, continuing with limited functionality:', e);
        }

        // Load cached images
        await applyImagesFromCache();

        // Trigger an update check first so the service worker is woken up and the
        // freshly cached version is available. Then read RUNTIME_INFO to get the
        // version actually loaded (which may be newer than the manifest).
        try {
            var updateResult = await rpcWithRetry(function () {
                return window.browserAPI.runtime.sendMessage({ type: 'CHECK_UPDATE' });
            }, 3, 1000);
            console.log('[Outiiil Runtime] CHECK_UPDATE result:', JSON.stringify(updateResult));
            // CHECK_UPDATE response is flat: { ok, updated, version } (no nested result)
            var updated = updateResult && updateResult.updated;
            var updateVersion = updateResult && updateResult.version;
            if (updated) {
                await attendreFinMiseAJour(updateVersion);
            }
            // If CHECK_UPDATE returned a fresh version, prefer it.
            if (updateVersion) {
                window.VERSION = updateVersion;
                console.log('[Outiiil Runtime] Version from CHECK_UPDATE: ' + window.VERSION);
            }
        } catch (e) {
            console.warn('[Outiiil Runtime] CHECK_UPDATE failed:', e);
        }

        // Try to get version info from background (RUNTIME_INFO reads the cached version)
        try {
            var info = await rpcWithRetry(function () {
                return window.browserAPI.runtime.sendMessage({ type: 'RUNTIME_INFO' });
            });
            if (info && info.result && info.result.version) {
                window.VERSION = info.result.version;
                console.log('[Outiiil Runtime] Version from RUNTIME_INFO: ' + window.VERSION +
                    ' (manifest=' + (info.result.manifestVersion || '?') + ')');
            }
        } catch (e) {
            console.warn('[Outiiil Runtime] RUNTIME_INFO failed:', e);
            // Fallback: try reading version from storage
            try {
                var stored = await rpcWithRetry(function () {
                    return window.browserAPI.storage.local.get([STORAGE_KEY_VERSION]);
                });
                if (stored[STORAGE_KEY_VERSION]) {
                    window.VERSION = stored[STORAGE_KEY_VERSION];
                    console.log('[Outiiil Runtime] Version from storage: ' + window.VERSION);
                }
            } catch (e2) {
                // Ignore - main.js handles version detection
            }
        }
    }

    function afficherBanniereMiseAJour(message, type) {
        console.log('[Outiiil Runtime] afficherBanniereMiseAJour: ' + message + ' (type=' + type + ')');
        // Use jQuery toast if available for a more visible notification.
        // jQuery may not be loaded yet at document_start, so retry a few times.
        var attempts = 0;
        function tryToast() {
            if (typeof $ !== 'undefined' && typeof $.toast === 'function') {
                $.toast({
                    text: message,
                    heading: type === 'done' ? 'Mise à jour terminée' :
                            type === 'error' ? 'Mise à jour échouée' :
                            'Mise à jour en cours',
                    showHideTransition: 'slide',
                    icon: type === 'done' ? 'success' :
                           type === 'error' ? 'error' : 'info',
                    position: 'top-right',
                    loaderBg: type === 'error' ? '#c0392b' :
                             type === 'done' ? '#27ae60' : '#f39c12',
                    hideAfter: type === 'done' ? 8000 : 15000,
                    stack: false
                });
                return true;
            }
            attempts++;
            if (attempts < 10) {
                setTimeout(tryToast, 200);
                return true;
            }
            afficherBanniereFallback(message, type);
            return false;
        }
        try {
            tryToast();
        } catch (e) {
            console.warn('[Outiiil Runtime] afficherBanniereMiseAJour failed:', e);
            afficherBanniereFallback(message, type);
        }
    }

    function afficherBanniereFallback(message, type) {
        try {
            var existing = document.getElementById('o_outiiil_update_banner');
            if (existing) existing.remove();
            var banner = document.createElement('div');
            banner.id = 'o_outiiil_update_banner';
            banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:30001;' +
                'background:' + (type === 'error' ? '#c0392b' : type === 'done' ? '#27ae60' : '#f39c12') +
                ';color:#fff;text-align:center;padding:8px;font-family:sans-serif;font-size:14px;' +
                'box-shadow:0 2px 6px rgba(0,0,0,0.3);';
            banner.textContent = message;
            var host = document.body || document.documentElement;
            host.appendChild(banner);
        } catch (e) {
            // Ignore - banner is cosmetic
        }
    }

    async function attendreFinMiseAJour(targetVersion) {
        console.log('[Outiiil Runtime] attendreFinMiseAJour: waiting for version ' + targetVersion);
        afficherBanniereMiseAJour('Mise à jour Outiiil en cours...', 'pending');
        var maxAttempts = 60; // up to ~60s
        var attempt = 0;
        while (attempt < maxAttempts) {
            attempt++;
            try {
                console.log('[Outiiil Runtime] attendreFinMiseAJour: attempt ' + attempt + ', polling storage');
                var stored = await window.browserAPI.storage.local.get([STORAGE_KEY_VERSION]);
                console.log('[Outiiil Runtime] attendreFinMiseAJour: stored version=' + stored[STORAGE_KEY_VERSION] +
                    ' target=' + targetVersion);
                if (stored[STORAGE_KEY_VERSION] === targetVersion) {
                    console.log('[Outiiil Runtime] attendreFinMiseAJour: version matched, reloading page');
                    afficherBanniereMiseAJour('Mise à jour effectuée. Rechargement de la page...', 'done');
                    // Give the user a moment to see the message, then reload
                    await new Promise(function (resolve) { setTimeout(resolve, 1500); });
                    location.reload();
                    return;
                }
            } catch (e) {
                console.warn('[Outiiil Runtime] attendreFinMiseAJour: storage poll failed:', e);
                // Ignore - retry on next attempt
            }
            await new Promise(function (resolve) { setTimeout(resolve, 1000); });
        }
        console.warn('[Outiiil Runtime] attendreFinMiseAJour: timeout after ' + maxAttempts + ' attempts');
        afficherBanniereMiseAJour('Timeout de mise à jour. Veuillez recharger la page manuellement.', 'error');
    }

    // Start initialization (non-blocking). Expose the promise so main.js can await it
    // before reading window.VERSION (avoids a race where VERSION is read before the
    // background has reported the runtime version).
    window.__outiiil_runtime_init_promise = initRuntime();
})();
