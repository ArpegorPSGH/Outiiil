/*
 * browserAPI.js
 * Abstraction layer placed at the top of the dynamic runtime (user script in MAIN world).
 * Provides window.browserAPI that proxies any chrome.* / browser.* call through
 * a generic RPC channel (window.postMessage -> bridge content script -> background).
 *
 * Message protocol:
 *   Request:  { type: 'OUTIIIL_RPC_REQUEST', target: 'outiiil', id, path, args }
 *   Response: { type: 'OUTIIIL_RPC_RESPONSE', target: 'outiiil', id, ok, result }
 *   Event:    { type: 'OUTIIIL_RPC_EVENT',   target: 'outiiil', cbId, payload }
 *   Ready:    { type: 'OUTIIIL_BRIDGE_READY', target: 'outiiil' }
 */

(function () {
    'use strict';

    const OUTIIIL_TARGET = 'outiiil';
    const REQUEST_TYPE = 'OUTIIIL_RPC_REQUEST';
    const RESPONSE_TYPE = 'OUTIIIL_RPC_RESPONSE';
    const EVENT_TYPE = 'OUTIIIL_RPC_EVENT';
    const BRIDGE_READY_TYPE = 'OUTIIIL_BRIDGE_READY';
    const DEV_MODE_TYPE = 'OUTIIIL_DEV_MODE';
    const RPC_TIMEOUT_MS = 15000;

    let msgId = 0;
    const pendingRequests = new Map();
    const eventCallbacks = new Map();
    let bridgeReady = false;
    let devMode = false;
    let devModeResolved = false;

    function nextId() {
        return Date.now().toString(36) + '_' + (msgId++);
    }

    function isEventNamespace(namespace) {
        const lastPart = namespace.split('.').pop();
        return lastPart && lastPart.startsWith('on');
    }

    function handleMessage(event) {
        const data = event.data;
        if (!data || data.target !== OUTIIIL_TARGET) return;

        if (data.type === BRIDGE_READY_TYPE) {
            bridgeReady = true;
        }

        if (data.type === DEV_MODE_TYPE) {
            devMode = data.devMode === true;
            devModeResolved = true;
            document.documentElement.setAttribute('data-outiiil-dev-mode', devMode ? 'true' : 'false');
        }

        if (data.type === RESPONSE_TYPE) {
            const p = pendingRequests.get(data.id);
            if (!p) {
                console.warn('[Outiiil browserAPI] RPC response for unknown id:', data.id,
                    'bridgeReady=' + bridgeReady,
                    'pending=' + pendingRequests.size);
                return;
            }
            clearTimeout(p.timeout);
            pendingRequests.delete(data.id);
            if (data.ok) {
                console.log('[Outiiil browserAPI] RPC success:', data.path);
                p.resolve(data.result);
            } else {
                console.warn('[Outiiil browserAPI] RPC error:', data.path, data.error,
                    'full response=' + JSON.stringify(data));
                var errMsg = data.error || ('RPC error: ' + data.path);
                var errObj = new Error(errMsg);
                try {
                    errObj.rawResponse = data;
                } catch (e) { }
                p.reject(errObj);
            }
        }

        if (data.type === EVENT_TYPE) {
            const cb = eventCallbacks.get(data.cbId);
            if (cb) cb(data.payload);
        }
    }

    function start() {
        window.addEventListener('message', handleMessage);
    }

    function callApi(path, args) {
        const id = nextId();
        const fullPath = typeof path === 'string' ? path : path.join('.');

        console.log('[Outiiil browserAPI] Sending RPC request:', fullPath, 'id=' + id);

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                if (pendingRequests.has(id)) {
                    pendingRequests.delete(id);
                    reject(new Error('RPC timeout: ' + fullPath));
                }
            }, RPC_TIMEOUT_MS);

            pendingRequests.set(id, { resolve, reject, timeout, path: fullPath });

            window.postMessage({
                type: REQUEST_TYPE,
                target: OUTIIIL_TARGET,
                id: id,
                path: fullPath,
                args: args || []
            }, '*');
        });
    }

    function registerEventListener(path, callback) {
        var parts = path.split('.');
        if (!isEventNamespace(parts.slice(0, -1).join('.'))) {
            return Promise.resolve(false);
        }
        var cbId = 'listener_' + nextId();
        eventCallbacks.set(cbId, callback);
        return callApi(path, [cbId]);
    }

    function unregisterEventListener(path, callback) {
        var cbId = null;
        for (var [id, cb] of eventCallbacks.entries()) {
            if (cb === callback) {
                cbId = id;
                eventCallbacks.delete(id);
                break;
            }
        }
        if (!cbId) return Promise.resolve(false);
        return callApi(path, [cbId]);
    }

    // Create a deep proxy that turns any property chain into an RPC call.
    // e.g. browserAPI.tabs.query(...)  ->  rpcCall('tabs.query', args)
    function createProxy(path) {
        function makeCallable(fullPath) {
            var fn = function () {
                var args = Array.prototype.slice.call(arguments);
                return callApi(fullPath, args);
            };
            fn._outiiilPath = fullPath;
            return fn;
        }

        var proxyHandler = {
            get: function (target, prop) {
                if (prop === 'then' || prop === Symbol.toPrimitive ||
                    prop === Symbol.toStringTag || prop === 'length' ||
                    prop === 'name' || prop === 'prototype' ||
                    prop === 'arguments' || prop === 'caller' || prop === '_outiiilPath') {
                    return undefined;
                }

                var propStr = String(prop);
                var newPath = path ? path + '.' + propStr : propStr;

                // For event namespaces (e.g. webNavigation.onCompleted), return an event object
                if (isEventNamespace(newPath)) {
                    return {
                        addListener: function (callback) {
                            return registerEventListener(newPath + '.addListener', callback);
                        },
                        removeListener: function (callback) {
                            return unregisterEventListener(newPath + '.removeListener', callback);
                        },
                        hasListener: function () {
                            return callApi(newPath + '.hasListener', []);
                        }
                    };
                }

                // For regular functions, return a callable proxy
                // Create a new proxy with a handler that captures the current newPath
                return createProxy(newPath);
            }
        };

        return new Proxy(makeCallable(path), proxyHandler);
    }

    window.browserAPI = createProxy('');
    window.browserAPI._callApi = callApi;
    window.browserAPI._ready = new Promise(function (resolve) {
        if (bridgeReady) {
            resolve();
        } else {
            var handler = function (event) {
                if (event.data && event.data.type === BRIDGE_READY_TYPE && event.data.target === OUTIIIL_TARGET) {
                    resolve();
                    window.removeEventListener('message', handler);
                }
            };
            window.addEventListener('message', handler);
            setTimeout(resolve, 500);
        }
    });

    window.browserAPI._devModeReady = new Promise(function (resolve) {
        if (devModeResolved) {
            resolve(devMode);
        } else {
            var handler = function (event) {
                if (event.data && event.data.type === DEV_MODE_TYPE && event.data.target === OUTIIIL_TARGET) {
                    resolve(event.data.devMode === true);
                    window.removeEventListener('message', handler);
                }
            };
            window.addEventListener('message', handler);
            setTimeout(function () { resolve(false); }, 500);
        }
    });

    start();
})();
