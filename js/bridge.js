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
    const ORIGIN = '*';

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
        if (data.type !== REQUEST_TYPE) return;

        // Forward the RPC call to the background service worker
        chrome.runtime.sendMessage({
            type: 'CHROME_API_CALL',
            requestId: data.id,
            path: data.path,
            args: data.args
        }, function (response) {
            if (chrome.runtime.lastError) {
                window.postMessage({
                    type: RESPONSE_TYPE,
                    target: OUTIIIL_TARGET,
                    id: data.id,
                    ok: false,
                    error: chrome.runtime.lastError.message
                }, ORIGIN);
                return;
            }

            window.postMessage({
                type: RESPONSE_TYPE,
                target: OUTIIIL_TARGET,
                id: data.id,
                path: data.path,
                ok: response.ok,
                result: response.ok ? response.result : undefined,
                error: response.ok ? undefined : response.error
            }, ORIGIN);
        });
    });

    // --- Event Forwarding (background -> bridge -> runtime) ---
    // The background uses chrome.tabs.sendMessage to forward events to the tab,
    // which arrives here via chrome.runtime.onMessage.

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (!message || !message.target) return false;
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
