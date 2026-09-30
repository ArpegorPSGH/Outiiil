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

    async function applyImagesFromCache() {
        try {
            var cached = await window.browserAPI.storage.local.get([STORAGE_KEY_IMAGES]);
            var images = cached[STORAGE_KEY_IMAGES];
            if (!images || Object.keys(images).length === 0) return;

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

        // Try to get version info from background
        try {
            var info = await window.browserAPI.runtime.sendMessage({ type: 'RUNTIME_INFO' });
            if (info && info.result && info.result.version) {
                window.VERSION = info.result.version;
                console.log('[Outiiil Runtime] Version from RUNTIME_INFO: ' + window.VERSION +
                    ' (manifest=' + (info.result.manifestVersion || '?') + ')');
            }
        } catch (e) {
            console.warn('[Outiiil Runtime] RUNTIME_INFO failed:', e);
            // Fallback: try reading version from storage
            try {
                var stored = await window.browserAPI.storage.local.get([STORAGE_KEY_VERSION]);
                if (stored[STORAGE_KEY_VERSION]) {
                    window.VERSION = stored[STORAGE_KEY_VERSION];
                    console.log('[Outiiil Runtime] Version from storage: ' + window.VERSION);
                }
            } catch (e2) {
                // Ignore - main.js handles version detection
            }
        }

        // Trigger an update check so the runtime version stays fresh.
        // If a new version is downloaded, show an "update in progress" banner and
        // wait for completion (polling storage) before continuing.
        try {
            var updateResult = await window.browserAPI.runtime.sendMessage({ type: 'CHECK_UPDATE' });
            console.log('[Outiiil Runtime] CHECK_UPDATE result:', JSON.stringify(updateResult));
            if (updateResult && updateResult.result && updateResult.result.updated) {
                await attendreFinMiseAJour(updateResult.result.version);
            }
        } catch (e) {
            console.warn('[Outiiil Runtime] CHECK_UPDATE failed:', e);
        }
    }

    function afficherBanniereMiseAJour(message, type) {
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
            // At document_start, document.body may not exist yet; documentElement always does.
            var host = document.body || document.documentElement;
            host.appendChild(banner);
        } catch (e) {
            // Ignore - banner is cosmetic
        }
    }

    async function attendreFinMiseAJour(targetVersion) {
        afficherBanniereMiseAJour('Mise à jour Outiiil en cours...', 'pending');
        var maxAttempts = 60; // up to ~60s
        var attempt = 0;
        while (attempt < maxAttempts) {
            attempt++;
            try {
                var stored = await window.browserAPI.storage.local.get([STORAGE_KEY_VERSION]);
                if (stored[STORAGE_KEY_VERSION] === targetVersion) {
                    afficherBanniereMiseAJour('Mise à jour effectuée. Rechargement de la page...', 'done');
                    // Give the user a moment to see the message, then reload
                    await new Promise(function (resolve) { setTimeout(resolve, 1500); });
                    location.reload();
                    return;
                }
            } catch (e) {
                // Ignore - retry on next attempt
            }
            await new Promise(function (resolve) { setTimeout(resolve, 1000); });
        }
        afficherBanniereMiseAJour('Timeout de mise à jour. Veuillez recharger la page manuellement.', 'error');
    }

    // Start initialization (non-blocking). Expose the promise so main.js can await it
    // before reading window.VERSION (avoids a race where VERSION is read before the
    // background has reported the runtime version).
    window.__outiiil_runtime_init_promise = initRuntime();
})();
