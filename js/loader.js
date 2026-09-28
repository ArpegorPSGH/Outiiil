/*
 * loader.js — DEPRECATED
 *
 * This file has been replaced by the new two-layer architecture:
 *   - Static bootstrapper:  js/background.js (service worker) + js/bridge.js (content script)
 *   - Dynamic runtime:      runtime.js registered via chrome.userScripts (world: MAIN)
 *
 * The bridge.js content script (declared in manifest.json) now handles:
 *   - Setting data-outiiil-base-url and data-outiiil-dev-mode on <html>
 *   - Bridging postMessage between the dynamic runtime (MAIN world) and
 *     the background service worker (RPC dispatcher).
 *
 * If loaded as a fallback content script, it simply ensures the base URL
 * attribute is set so Utils.getExtensionURL still works.
 */

(function () {
    'use strict';

    var extensionBaseUrl = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
        ? chrome.runtime.getURL('')
        : (document.documentElement.getAttribute('data-outiiil-base-url') || '');
    document.documentElement.setAttribute('data-outiiil-base-url', extensionBaseUrl);

    console.log('[Outiiil] Loader deprecated. Using bridge.js + userScripts architecture.');
})();
