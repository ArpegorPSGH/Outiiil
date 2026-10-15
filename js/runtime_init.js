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

    // The update toast is owned by the bridge (isolated world). The runtime only
    // ships this configuration so the toast matches the product's look & wording.
    // The bridge applies a built-in fallback for any field left undefined.
    const TOAST_CONFIG = {
        title: 'Outiiil',
        inProgressText: 'Mise à jour Outiiil en cours...',
        successText: 'Mise à jour v{version} disponible — application imminente.',
        errorText: 'Mise à jour échouée : {error}',
        reloadingText: 'Rechargement de la page...',
        blockedText: 'Mise à jour bloquée : le socle de l\'extension a changé. ' +
            'Réinstallez Outiiil v{version} depuis les releases GitHub.',
        position: 'top-right',
        zIndex: 2147483646,
        maxWidth: '360px',
        minWidth: '240px',
        delayBeforeReload: 2500,
        cancelable: true,
        textColor: '#111111',
        radius: '10px',
        shadow: '0 8px 24px rgba(0,0,0,0.28)',
        background: 'rgba(255,255,255,0.95)',
        iconInProgress: '⏳',
        iconSuccess: '✅',
        iconError: '⚠️',
        iconBlocked: '⚠️',
        successColor: '#16a34a',
        errorColor: '#dc2626',
        blockedColor: '#dc2626',
        blockedButton: 'Télécharger',
        reloadingTextColor: '#8a6d1a',
        reloadingBackground: 'rgba(255,247,214,0.97)'
    };

    function sendToastConfig() {
        try {
            window.postMessage({
                type: 'OUTIIIL_TOAST_CONFIG',
                target: 'outiiil',
                config: TOAST_CONFIG
            }, '*');
        } catch (e) {
            console.warn('[Outiiil] Failed to send toast config to bridge:', e);
        }
    }

    // --- Reload coordination (keep in-progress transactions intact) ----------
    // Only the MAIN world knows whether a Transaction is running. Transaction.js
    // publishes `window.__outiiilTransactionActive` and dispatches
    // `outiiil:transaction:end` when none remain. We therefore schedule the page
    // reload only at a safe point, and ask the bridge (isolated world) to perform
    // it via OUTIIIL_RELOAD_NOW. If a reload is refused (beforeunload), the update
    // is already cached in the background and will apply on the next navigation.
    let versionMiseAJourEnAttente = null;
    let rechargementDemandePour = null;

    function afficherMiseAJourDisponibleBridge(version) {
        try {
            window.postMessage({ type: 'OUTIIIL_SHOW_PENDING', target: 'outiiil', version: version }, '*');
        } catch (e) {
            console.warn('[Outiiil] Failed to notify bridge (show pending):', e);
        }
    }

    function demanderRechargementBridge(version) {
        try {
            window.postMessage({ type: 'OUTIIIL_RELOAD_NOW', target: 'outiiil', version: version }, '*');
        } catch (e) {
            console.warn('[Outiiil] Failed to notify bridge (reload now):', e);
        }
    }

    function rechargerAuPointSur() {
        if (!versionMiseAJourEnAttente) return;
        if (window.__outiiilTransactionActive) {
            return; // operation in progress: defer
        }
        if (rechargementDemandePour === versionMiseAJourEnAttente) return; // already requested
        rechargementDemandePour = versionMiseAJourEnAttente;
        demanderRechargementBridge(versionMiseAJourEnAttente);
    }

    function miseAJourDisponible(version) {
        if (!version || versionMiseAJourEnAttente === version) return;
        versionMiseAJourEnAttente = version;
        rechargementDemandePour = null;
        afficherMiseAJourDisponibleBridge(version);
        rechargerAuPointSur();
    }

    // The background pushed a new version (relayed by the bridge).
    window.addEventListener('message', function (event) {
        const data = event.data;
        if (!data || typeof data !== 'object' || data.target !== 'outiiil') return;
        if (data.type === 'OUTIIIL_UPDATE_AVAILABLE') {
            miseAJourDisponible(data.version);
        }
    });
    // Safe point reached after a transaction finished.
    window.addEventListener('outiiil:transaction:end', rechargerAuPointSur);

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
        // Ship the toast configuration to the bridge up front, before any status can
        // arrive, so the bridge can render updates with the product's styling.
        sendToastConfig();

        // Wait for the bridge to be ready
        try {
            await window.browserAPI._ready;
        } catch (e) {
            console.warn('[Outiiil] Browser API not ready, continuing with limited functionality:', e);
        }

        // Load cached images
        await applyImagesFromCache();

        // Trigger an update check so the service worker is woken up and the latest
        // cached runtime version is available. The returned `version` is the newest
        // runtime the background has (either just downloaded, or already cached by
        // its periodic timer).
        var availableVersion = null;
        try {
            var updateResult = await rpcWithRetry(function () {
                return window.browserAPI.runtime.sendMessage({ type: 'CHECK_UPDATE' });
            }, 3, 1000);
            console.log('[Outiiil Runtime] CHECK_UPDATE result:', JSON.stringify(updateResult));
            availableVersion = updateResult && updateResult.version;
        } catch (e) {
            console.warn('[Outiiil Runtime] CHECK_UPDATE failed:', e);
        }

        // This running runtime's own version, baked into dist/runtime.js at build
        // time. Compare it to the available version to decide whether the page is
        // executing stale code. (NOT compared to the manifest version, which stays
        // fixed at the installed bootstrapper's version and would loop forever.)
        var runningVersion = window.__OUTIIIL_RUNTIME_VERSION;
        console.log('[Outiiil Runtime] running=' + runningVersion + ' available=' + availableVersion);

        // If the running runtime matches the available version, we're good — proceed.
        // If they differ, we may be running stale code OR the background may have just
        // registered this exact runtime (e.g., after a socle reinstall). Check the stored
        // version to distinguish these cases.
        if (runningVersion && availableVersion && runningVersion !== availableVersion) {
            // Check whether the background just registered this exact runtime version.
            // If the stored version matches the running version, the background is
            // reporting a different version because it's the LATEST available one,
            // not the one currently installed. This happens during socle reinstalls
            // where the runtime was updated to a new version but the background check
            // returned the latest from the registry.
            var storedVersion = null;
            try {
                var storedResult = await rpcWithRetry(function () {
                    return window.browserAPI.storage.local.get([STORAGE_KEY_VERSION]);
                });
                storedVersion = storedResult[STORAGE_KEY_VERSION];
            } catch (e) {
                console.warn('[Outiiil Runtime] Failed to read stored version:', e);
            }

            // If the stored version matches what's running, the background is simply
            // reporting a newer available version (not an error). Only trigger reload
            // if the stored version differs from both running and available, meaning
            // the runtime is truly stale.
            if (storedVersion && storedVersion === runningVersion) {
                console.log('[Outiiil Runtime] Running version matches stored version ' +
                    '(stored=' + storedVersion + '), background reports newer available=' +
                    availableVersion + '. Proceeding with current runtime.');
            } else {
                // This page is running a stale runtime while a newer one is available.
                // Schedule the reload at a safe point (never mid-transaction). After the
                // reload, running === available, so this will not fire again.
                console.log('[Outiiil Runtime] Running ' + runningVersion +
                    ' differs from available ' + availableVersion + ' -> update pending, will reload at a safe point');
                miseAJourDisponible(availableVersion);
                return;
            }
        }

        // Expose the current (available) version for the game logic.
        if (availableVersion) {
            window.VERSION = availableVersion;
            console.log('[Outiiil Runtime] window.VERSION = ' + window.VERSION);
        }

        // Fallback: read the version from background/storage if the check above did
        // not yield one (e.g. transient RPC failure).
        if (!window.VERSION) {
            try {
                var info = await rpcWithRetry(function () {
                    return window.browserAPI.runtime.sendMessage({ type: 'RUNTIME_INFO' });
                });
                if (info && info.result && info.result.version) {
                    window.VERSION = info.result.version;
                    console.log('[Outiiil Runtime] Version from RUNTIME_INFO: ' + window.VERSION);
                }
            } catch (e) {
                console.warn('[Outiiil Runtime] RUNTIME_INFO failed:', e);
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
    }

    // Start initialization (non-blocking). Expose the promise so main.js can await it
    // before reading window.VERSION (avoids a race where VERSION is read before the
    // background has reported the runtime version).
    // Safety timeout: if initRuntime takes longer than 15 seconds (e.g., service worker
    // unresponsive), we resolve with a warning so main.js can still execute.
    window.__outiiil_runtime_init_promise = Promise.race([
        initRuntime().then(function () {
            // Notify the bridge that initialization is complete so it can dismiss
            // any pending "success" toast from a background update.
            try {
                window.postMessage({
                    type: 'OUTIIIL_RUNTIME_READY',
                    target: 'outiiil',
                    version: window.VERSION
                }, '*');
            } catch (e) {
                console.warn('[Outiiil] Failed to notify bridge of runtime readiness:', e);
            }
        }),
        new Promise(function (resolve) {
            setTimeout(function () {
                console.warn('[Outiiil Runtime] Initialization timeout (15s) — proceeding anyway');
                window.__outiiil_runtime_init_timed_out = true;
                resolve();
            }, 15000);
        })
    ]);
})();
