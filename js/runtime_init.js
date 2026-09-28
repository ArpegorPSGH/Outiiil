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
            if (info && info.version) {
                window.VERSION = info.version;
            }
        } catch (e) {
            // Fallback: try reading version from storage
            try {
                var stored = await window.browserAPI.storage.local.get([STORAGE_KEY_VERSION]);
                if (stored[STORAGE_KEY_VERSION]) {
                    window.VERSION = stored[STORAGE_KEY_VERSION];
                }
            } catch (e2) {
                // Ignore - main.js handles version detection
            }
        }
    }

    // Start initialization (non-blocking)
    initRuntime();
})();
