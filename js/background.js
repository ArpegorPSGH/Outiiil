/*
 * background.js
 * Static bootstrapper - Service Worker (MV3).
 *
 * Responsibilities:
 *   1. Generic Chrome API RPC dispatcher (resolves any chrome.* path dynamically).
 *   2. Dynamic runtime update coordinator (version check, download, hash verification,
 *      register/update userScripts).
 *   3. Event routing (forwards chrome.* events back to the runtime via the bridge).
 *
 * This file is part of the stable bootstrapper and must avoid game-specific logic.
 */

// --- Configuration ---
const DEV_MODE = true;

const BASE_UPDATE_URL = 'https://arpegorpsgh.github.io/Outiiil/dist/';
const VERSION_URL = BASE_UPDATE_URL + 'version.json';
const GAME_MATCHES = ['http://*.fourmizzz.fr/*', 'https://*.fourmizzz.fr/*'];
const USER_SCRIPT_ID = 'outiiil-runtime';
const STORAGE_KEY_VERSION = 'outiiil_runtime_version';
const STORAGE_KEY_CODE = 'outiiil_runtime_code';
const STORAGE_KEY_CSS = 'outiiil_runtime_css';
const STORAGE_KEY_IMAGES = 'outiiil_cached_images';
const UPDATE_CHECK_INTERVAL_MS = 60000;

// --- API Security ---
const BLACKLISTED_TOP_LEVEL = new Set(['extension', 'i18n', 'test', 'devtools', 'debugger', 'system']);
const BLACKLISTED_PATHS = new Set([
    'management', 'identity', 'certificateProvider', 'pkcs8Token',
    'vpnProvider', 'wallpaper', 'enterprise.platformKeys', 'offscreen',
    'declarativeNetRequest', 'declarativeNetRequestFeedback', 'processes'
]);

function isPathBlacklisted(path) {
    const parts = path.split('.');
    if (BLACKLISTED_TOP_LEVEL.has(parts[0])) return true;
    for (let i = 1; i <= parts.length; i++) {
        if (BLACKLISTED_PATHS.has(parts.slice(0, i).join('.'))) return true;
    }
    return false;
}

// --- State ---
let userScriptRegistered = false;
const registeredEvents = new Map();
let registrationLock = false;

// --- Chrome API Resolution ---

function resolveChromeApiPath(path) {
    let obj = chrome;
    for (const p of path.split('.')) {
        if (obj === undefined || obj === null || obj[p] === undefined) return null;
        obj = obj[p];
    }
    return obj;
}

function getParentContext(path) {
    const parts = path.split('.').slice(0, -1);
    let parent = chrome;
    for (const p of parts) {
        if (parent === undefined || parent === null || parent[p] === undefined) return null;
        parent = parent[p];
    }
    return parent;
}

function wrapForSerialization(val) {
    if (val === undefined || val === null) return null;
    if (typeof val === 'function') return '[Function]';
    if (typeof val === 'symbol') return val.toString();
    if (typeof val === 'bigint') return val.toString() + 'n';
    if (typeof val !== 'object') return val;
    if (typeof val.then === 'function') {
        return val.then(
            (v) => wrapForSerialization(v),
            (e) => { throw e; }
        );
    }
    try { JSON.stringify(val); return val; }
    catch {
        const copy = {};
        for (const key of Object.keys(val)) {
            copy[key] = (typeof val[key] === 'function') ? '[Function]' : val[key];
        }
        return copy;
    }
}

// --- Event Listener Management ---

function handleEventListener(path, args, sender) {
    const parts = path.split('.');
    const method = parts.pop();
    const eventName = parts.pop();
    const fullEventPath = parts.join('.');
    const cbId = args && args.length > 0 ? args[0] : null;
    const tabId = sender && sender.tab ? sender.tab.id : undefined;

    const eventObj = resolveChromeApiPath(fullEventPath + '.' + eventName);
    if (!eventObj) {
        return { ok: false, error: 'Event not found: ' + fullEventPath + '.' + eventName };
    }

    if (method === 'addListener') {
        const wrapper = function (...eventArgs) {
            const reg = registeredEvents.get(cbId);
            if (!reg) return;
            const wrapped = eventArgs.map(a => {
                try { return wrapForSerialization(a); }
                catch { return '[Inaccessible]'; }
            });
            chrome.tabs.sendMessage(reg.tabId, {
                type: 'OUTIIIL_RPC_EVENT',
                target: 'outiiil',
                cbId: cbId,
                payload: wrapped.length === 1 ? wrapped[0] : wrapped
            }).catch(() => {});
        };

        eventObj.addListener(wrapper);
        registeredEvents.set(cbId, { tabId: tabId, wrapper: wrapper });
        return { ok: true, result: true };
    }

    if (method === 'removeListener') {
        const reg = registeredEvents.get(cbId);
        if (reg) {
            eventObj.removeListener(reg.wrapper);
            registeredEvents.delete(cbId);
        }
        return { ok: true, result: undefined };
    }

    if (method === 'hasListener') {
        return { ok: true, result: registeredEvents.has(cbId) };
    }

    return { ok: false, error: 'Unknown event method: ' + method };
}

// --- Generic RPC Dispatcher ---

async function dispatchChromeApiCall(path, args, sender) {
    if (isPathBlacklisted(path)) {
        return { ok: false, error: 'API blocked for security: ' + path };
    }

    // Special handling: runtime.sendMessage from the runtime (MAIN world)
    // is an RPC call, not a real chrome.runtime.sendMessage that would loop back.
    if (path === 'runtime.sendMessage') {
        const runtimeMsg = args && args.length > 0 ? args[0] : {};
        return handleRuntimeMessage(runtimeMsg, sender);
    }

    const isEventOp = path.endsWith('.addListener') || path.endsWith('.removeListener') || path.endsWith('.hasListener');
    if (isEventOp) {
        return handleEventListener(path, args, sender);
    }

    const parent = getParentContext(path);
    if (parent === null) {
        return { ok: false, error: 'API not found: ' + path };
    }

    const prop = path.split('.').pop();
    const fn = parent[prop];
    if (typeof fn !== 'function') {
        return { ok: false, error: 'Not a function: ' + path };
    }

    try {
        const result = fn.apply(parent, args || []);
        const wrapped = await wrapForSerialization(result);
        return { ok: true, result: wrapped };
    } catch (error) {
        return { ok: false, error: error.message || String(error) };
    }
}

// --- Runtime Message Handling (browserAPI.runtime.sendMessage) ---
// When the runtime calls browserAPI.runtime.sendMessage(...), the RPC dispatcher
// receives path 'runtime.sendMessage'. Instead of calling chrome.runtime.sendMessage
// (which would broadcast to other extension components), we handle the message directly.

function handleRuntimeMessage(message, sender) {
    if (!message || typeof message !== 'object') {
        return { ok: false, error: 'Invalid message format' };
    }

    switch (message.type) {
        case 'RUNTIME_INFO':
            return {
                ok: true,
                result: {
                    devMode: DEV_MODE,
                    version: chrome.runtime.getManifest().version,
                    baseUrl: chrome.runtime.getURL('')
                }
            };

        case 'CHECK_UPDATE':
            checkAndRegisterRuntime().then(result => {
                if (sender && sender.tab) {
                    chrome.tabs.sendMessage(sender.tab.id, {
                        type: 'OUTIIIL_UPDATE_RESULT',
                        target: 'outiiil',
                        result: result
                    }).catch(() => {});
                }
            });
            return { ok: true, result: { checking: true } };

        case 'LOG_ERROR':
            console.error('[Outiiil Runtime]', message.error || message);
            return { ok: true, result: { logged: true } };

        case 'LOG_INFO':
            console.log('[Outiiil Runtime]', message.message || JSON.stringify(message));
            return { ok: true, result: { logged: true } };

        default:
            console.warn('[Outiiil Background] Unhandled runtime message type:', message.type);
            return { ok: true, result: undefined };
    }
}

// --- Message Listener ---

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) return false;

    if (message.type === 'CHROME_API_CALL') {
        dispatchChromeApiCall(message.path, message.args, sender).then(response => {
            sendResponse({ requestId: message.requestId, ...response });
        }).catch(error => {
            sendResponse({
                requestId: message.requestId,
                ok: false,
                error: error.message || String(error)
            });
        });
        return true;
    }

    if (message.type === 'CHECK_UPDATE') {
        checkAndRegisterRuntime().then(result => {
            sendResponse({ type: 'UPDATE_RESULT', ...result });
        });
        return true;
    }

    if (message.type === 'RUNTIME_INFO') {
        sendResponse({
            type: 'RUNTIME_INFO_RESPONSE',
            devMode: DEV_MODE,
            version: chrome.runtime.getManifest().version,
            baseUrl: chrome.runtime.getURL('')
        });
        return true;
    }

    if (message.type === 'GET_DEV_MODE') {
        sendResponse({ devMode: DEV_MODE });
        return true;
    }

    return false;
});

// --- Update Coordinator ---

async function checkAndRegisterRuntime(forceReRegister = false) {
    if (registrationLock) {
        console.log('[Outiiil Background] Registration already in progress, skipping');
        return { ok: false, error: 'Registration in progress' };
    }
    registrationLock = true;
    try {
        if (DEV_MODE) {
            return await registerDevRuntime(forceReRegister);
        }
        return await checkAndDownloadRuntime();
    } catch (error) {
        console.error('[Outiiil Background] Update error:', error);
        return { ok: false, error: error.message };
    } finally {
        registrationLock = false;
    }
}

// DEV_MODE: Register each source file individually via userScripts.register() `file:` entries
// so the service worker can re-resolve them on extension reload.
async function registerDevRuntime(forceReRegister) {
    const version = chrome.runtime.getManifest().version;
    const manifestVersion = version;

    const jsEntries = [];
    let cssCode = '';

    try {
        const sourcesRes = await fetch(chrome.runtime.getURL('scripts/bundle_sources.json'));
        if (sourcesRes.ok) {
            const sources = await sourcesRes.json();

            for (const jsFile of sources.js || []) {
                jsEntries.push({ file: jsFile });
            }

            for (const cssFile of sources.css || []) {
                const fileRes = await fetch(chrome.runtime.getURL(cssFile));
                if (fileRes.ok) {
                    cssCode += '\n' + await fileRes.text();
                }
            }
        } else {
            jsEntries.push({ file: 'dist/runtime.js' });
            const cssRes = await fetch(chrome.runtime.getURL('dist/runtime.css'));
            if (cssRes.ok) {
                cssCode = await cssRes.text();
            }
        }
    } catch (e) {
        console.warn('[Outiiil Background] DEV_MODE: Could not read source files, falling back to dist bundle', e);
        jsEntries.push({ file: 'dist/runtime.js' });
    }

    await registerOrUpdateUserScript(jsEntries, cssCode, manifestVersion, forceReRegister);
    return { ok: true, version: manifestVersion, dev: true };
}

// PROD_MODE: Check version.json, download runtime, verify hash, register
async function checkAndDownloadRuntime() {
    const storedVersion = await getStorage(STORAGE_KEY_VERSION) || '0.0.0';

    try {
        const versionRes = await fetch(VERSION_URL + '?_t=' + Date.now(), { cache: 'no-store' });
        if (!versionRes.ok) {
            console.log('[Outiiil Background] Remote version check failed:', versionRes.status);
            const storedCode = await getStorage(STORAGE_KEY_CODE);
            const storedCss = await getStorage(STORAGE_KEY_CSS);
            if (storedCode) {
                await registerOrUpdateUserScript(storedCode, storedCss || '', storedVersion);
                return { ok: true, version: storedVersion, dev: false, fromCache: true };
            }
            return { ok: false, error: 'No remote access and no cached runtime' };
        }

        const remoteInfo = await versionRes.json();
        const remoteVersion = remoteInfo.version;

        if (compareVersions(remoteVersion, storedVersion) <= 0) {
            if (!userScriptRegistered) {
                const storedCode = await getStorage(STORAGE_KEY_CODE);
                const storedCss = await getStorage(STORAGE_KEY_CSS);
                if (storedCode) {
                    await registerOrUpdateUserScript(storedCode, storedCss || '', storedVersion);
                }
            }
            return { ok: true, version: storedVersion, dev: false, upToDate: true };
        }

        console.log('[Outiiil Background] New runtime available: v' + remoteVersion + ' (current: v' + storedVersion + ')');
        const runtimeFile = remoteInfo.runtime || 'runtime.js';
        const cssFile = remoteInfo.css || 'runtime.css';
        const imageFiles = Array.isArray(remoteInfo.images) ? remoteInfo.images : [];

        const fetchPromises = [
            fetch(BASE_UPDATE_URL + runtimeFile + '?_t=' + Date.now(), { cache: 'no-store' }),
            fetch(BASE_UPDATE_URL + cssFile + '?_t=' + Date.now(), { cache: 'no-store' }),
            ...imageFiles.map(path => fetch(BASE_UPDATE_URL + path + '?_t=' + Date.now(), { cache: 'no-store' }))
        ];

        const responses = await Promise.all(fetchPromises);
        const [runtimeRes, cssRes, ...imageResponses] = responses;

        if (!runtimeRes.ok) {
            throw new Error('Failed to download runtime.js: ' + runtimeRes.status);
        }

        const runtimeCode = await runtimeRes.text();
        const cssCode = cssRes.ok ? await cssRes.text() : '';

        // Rebuild the dist hash from remote files in a stable order
        const remoteBlobs = new Map();
        remoteBlobs.set(runtimeFile, new Uint8Array(await runtimeRes.arrayBuffer()));
        if (cssRes.ok) remoteBlobs.set(cssFile, new Uint8Array(await cssRes.arrayBuffer()));
        for (let i = 0; i < imageFiles.length; i++) {
            const path = imageFiles[i];
            const res = imageResponses[i];
            if (res.ok) remoteBlobs.set(path, new Uint8Array(await res.arrayBuffer()));
        }

        const sortedEntries = Array.from(remoteBlobs.keys()).sort();
        let combinedLength = 0;
        for (const relPath of sortedEntries) {
            const blob = remoteBlobs.get(relPath);
            combinedLength += new TextEncoder().encode(`dist/${relPath}\n`).length + blob.length;
        }
        const combined = new Uint8Array(combinedLength);
        let offset = 0;
        for (const relPath of sortedEntries) {
            const blob = remoteBlobs.get(relPath);
            const prefix = new TextEncoder().encode(`dist/${relPath}\n`);
            combined.set(prefix, offset);
            offset += prefix.length;
            combined.set(blob, offset);
            offset += blob.length;
        }
        const computedHash = await sha256(combined);

        // Verify SHA-256
        if (remoteInfo.sha256) {
            if (computed !== remoteInfo.sha256) {
                const msg = 'SHA-256 verification failed: expected ' + remoteInfo.sha256 + ', got ' + computed + ' (version=' + remoteVersion + ', bytes=' + combined.length + ')';
                console.warn('[Outiiil Background] ' + msg);
                const storedCode = await getStorage(STORAGE_KEY_CODE);
                const storedCss = await getStorage(STORAGE_KEY_CSS);
                if (storedCode) {
                    console.warn('[Outiiil Background] Falling back to cached runtime because remote runtime looks inconsistent.');
                    await registerOrUpdateUserScript(storedCode, storedCss || '', storedVersion);
                    return { ok: true, version: storedVersion, dev: false, fromCache: true, fallback: msg };
                }
                throw new Error(msg);
            }
            console.log('[Outiiil Background] SHA-256 verified for v' + remoteVersion);
        }

        // Download images if listed
        if (Array.isArray(remoteInfo.images) && remoteInfo.images.length > 0) {
            await downloadImages(remoteInfo.images, remoteVersion);
        }

        // Persist code and version
        await chrome.storage.local.set({
            [STORAGE_KEY_CODE]: runtimeCode,
            [STORAGE_KEY_CSS]: cssCode,
            [STORAGE_KEY_VERSION]: remoteVersion
        });

        await registerOrUpdateUserScript(runtimeCode, cssCode, remoteVersion);
        return { ok: true, version: remoteVersion, dev: false, updated: true };
    } catch (error) {
        console.error('[Outiiil Background] Remote update failed:', error);
        const storedCode = await getStorage(STORAGE_KEY_CODE);
        const storedCss = await getStorage(STORAGE_KEY_CSS);
        if (storedCode) {
            await registerOrUpdateUserScript(storedCode, storedCss || '', storedVersion);
            return { ok: true, version: storedVersion, dev: false, fromCache: true, fallback: error.message };
        }
        return { ok: false, error: error.message };
    }
}

async function requestUserScriptsPermission() {
    if (chrome.userScripts) return true;

    // Firefox requires optional permission for userScripts
    try {
        if (chrome.permissions && chrome.permissions.request) {
            const granted = await chrome.permissions.request({ permissions: ['userScripts'] });
            return granted;
        }
    } catch (e) {
        console.warn('[Outiiil Background] Permission request failed:', e);
    }
    return false;
}

async function registerOrUpdateUserScript(jsCode, cssCode, version, forceReRegister = false) {
    if (!chrome.userScripts) {
        console.warn('[Outiiil Background] chrome.userScripts not available, requesting permission...');
        const granted = await requestUserScriptsPermission();
        if (!granted) {
            console.error('[Outiiil Background] userScripts permission not granted - runtime cannot be registered');
            return false;
        }
    }

    // userScripts.register() does not support CSS - inject CSS via the runtime code
    // The runtime code creates a <style> tag to apply the CSS in MAIN world
    let jsEntries;
    if (Array.isArray(jsCode)) {
        jsEntries = jsCode.slice();
    } else {
        jsEntries = [{ code: jsCode }];
    }

    if (cssCode) {
        const cssJson = JSON.stringify(cssCode);
        jsEntries.unshift({
            code: '(function(){var s=document.createElement("style");s.type="text/css";s.textContent=' + cssJson + ';(document.head||document.documentElement).appendChild(s);})();'
        });
    }

    const scriptDef = {
        id: USER_SCRIPT_ID,
        matches: GAME_MATCHES,
        world: 'MAIN',
        runAt: 'document_start',
        js: jsEntries
    };

    try {
        if (forceReRegister) {
            // Force re-registration: unregister first, then register fresh
            try { await chrome.userScripts.unregister({ ids: [USER_SCRIPT_ID] }); } catch (e) {}
            userScriptRegistered = false;
            await chrome.userScripts.register([scriptDef]);
            userScriptRegistered = true;
            console.log('[Outiiil Background] Runtime (re)registered (v' + version + ')');
        } else if ((userScriptRegistered || await isUserScriptRegistered())) {
            await chrome.userScripts.update([scriptDef]);
            console.log('[Outiiil Background] Runtime updated to v' + version);
        } else {
            await chrome.userScripts.register([scriptDef]);
            userScriptRegistered = true;
            console.log('[Outiiil Background] Runtime registered (v' + version + ')');
        }
        return true;
    } catch (error) {
        console.error('[Outiiil Background] Failed to register/update user script:', error);
        // Fallback: try to unregister and re-register
        try {
            await chrome.userScripts.unregister({ ids: [USER_SCRIPT_ID] });
            await chrome.userScripts.register([scriptDef]);
            userScriptRegistered = true;
            console.log('[Outiiil Background] Runtime (re)registered (v' + version + ')');
            return true;
        } catch (retryError) {
            console.error('[Outiiil Background] Retry registration failed:', retryError);
            return false;
        }
    }
}

async function isUserScriptRegistered() {
    try {
        const scripts = await chrome.userScripts.getScripts();
        return scripts && scripts.some(s => s.id === USER_SCRIPT_ID);
    } catch {
        return false;
    }
}

// --- Image Download ---

async function downloadImages(imageList, version) {
    try {
        const dataUrls = {};
        const failures = [];

        await Promise.all(imageList.map(async (path) => {
            try {
                const res = await fetch(BASE_UPDATE_URL + path + '?_t=' + Date.now(), { cache: 'no-store' });
                if (!res.ok) { failures.push(path); return; }
                const blob = await res.blob();
                const dataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(blob);
                });
                if (dataUrl) dataUrls[path] = dataUrl;
                else failures.push(path);
            } catch (e) {
                failures.push(path);
            }
        }));

        if (Object.keys(dataUrls).length > 0) {
            const prev = await getStorage(STORAGE_KEY_IMAGES) || {};
            const merged = Object.assign({}, prev, dataUrls);
            await chrome.storage.local.set({ [STORAGE_KEY_IMAGES]: merged });
            console.log('[Outiiil Background] Cached ' + Object.keys(dataUrls).length + ' images (v' + version + ')');
        }
        if (failures.length > 0) {
            console.warn('[Outiiil Background] Failed to download images:', failures.join(', '));
        }
    } catch (error) {
        console.error('[Outiiil Background] Image download error:', error);
    }
}

// --- Utilities ---

function getStorage(key) {
    return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
            resolve(result[key] !== undefined ? result[key] : null);
        });
    });
}

function compareVersions(v1, v2) {
    if (!v1 || !v2) return 0;
    const parts1 = String(v1).split('.').map(n => parseInt(n, 10) || 0);
    const parts2 = String(v2).split('.').map(n => parseInt(n, 10) || 0);
    const len = Math.max(parts1.length, parts2.length);
    for (let i = 0; i < len; i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
    }
    return 0;
}

async function sha256(str) {
    const data = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Lifecycle ---

chrome.runtime.onInstalled.addListener(() => {
    console.log('[Outiiil Background] Extension installed/updated');
    checkAndRegisterRuntime(true);
});

chrome.runtime.onStartup.addListener(() => {
    console.log('[Outiiil Background] Service worker started');
    checkAndRegisterRuntime();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Force re-registration when navigating to fourmizzz.fr in DEV_MODE
    if (DEV_MODE && changeInfo.status === 'loading' && tab.url && tab.url.includes('fourmizzz.fr')) {
        if (!registrationLock) {
            checkAndRegisterRuntime(true);
        }
    }
});

setInterval(() => {
    if (!DEV_MODE) {
        checkAndRegisterRuntime(false);
    }
}, UPDATE_CHECK_INTERVAL_MS);

// Initial registration
checkAndRegisterRuntime();
