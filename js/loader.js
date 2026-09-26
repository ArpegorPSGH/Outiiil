/**
 * loader.js
 * Chargeur dynamique et résilient pour Outiiil.
 * 
 * - En mode développement (DEV_MODE = true) :
 *   Injecte séquentiellement chaque fichier source local spécifié dans bundle_sources.json
 *   (ou fallback sur dist/bundle.js). Aucune mise en cache dans chrome.storage.local,
 *   aucune vérification de mise à jour distante. Chaque actualisation (F5) prend directement vos modifications locales.
 * 
 * - En mode production (DEV_MODE = false) :
 *   Stratégie Stale-While-Revalidate :
 *   1. Injecte immédiatement le bundle CSS et JS depuis dist/ (embarqué dans l'extension).
 *   2. Vérifie en arrière-plan (fetch asynchrone) la disponibilité d'une nouvelle configuration sur GitHub Pages (branche gh-pages).
 *   3. Si une nouvelle configuration existe, télécharge le JSON de configuration et les images listées
 *      et met à jour le cache local pour la navigation suivante.
 *   4. Pour les mises à jour de logique/comportement : l'utilisateur doit recharger l'extension.
 */

(async function () {
    'use strict';

    const DEV_MODE = true;

    const BASE_UPDATE_URL = 'https://arpegorpsgh.github.io/Outiiil/dist/';
    const VERSION_URL = BASE_UPDATE_URL + 'version.json?_t=' + Date.now();
    const STORAGE_KEY_CONFIG = 'outiiil_cached_config';
    const STORAGE_KEY_VERSION = 'outiiil_cached_version';
    const STORAGE_KEY_IMAGES = 'outiiil_cached_images';
    const ATTR_BASE_URL = 'data-outiiil-base-url';

    const extensionBaseUrl = chrome.runtime.getURL('');
    document.documentElement.setAttribute(ATTR_BASE_URL, extensionBaseUrl);
    document.documentElement.setAttribute('data-outiiil-dev-mode', DEV_MODE ? 'true' : 'false');

    async function appliquerImagesDepuisCache() {
        const images = await new Promise((resolve) => chrome.storage.local.get([STORAGE_KEY_IMAGES], (cache) => resolve(cache[STORAGE_KEY_IMAGES] || null)));
        if (!images || Object.keys(images).length === 0) return;
        const blobs = {};
        for (const [chemin, dataUrl] of Object.entries(images)) {
            try {
                const mime = chemin.toLowerCase().endsWith('.gif') ? 'image/gif'
                    : chemin.toLowerCase().endsWith('.jpg') || chemin.toLowerCase().endsWith('.jpeg') ? 'image/jpeg'
                        : 'image/png';
                const octets = Uint8Array.from(atob(dataUrl.split(',')[1]), c => c.charCodeAt(0));
                blobs[chemin] = URL.createObjectURL(new Blob([octets], { type: mime }));
            } catch (e) {
                console.warn('[Outiiil Loader] Image en cache illisible : ' + chemin, e);
            }
        }
        await chrome.runtime.sendMessage({
            type: 'EXECUTE_SCRIPT',
            funcName: 'setImages',
            args: [blobs]
        });
    }

    async function mettreAJourImagesEnCache(listeImages) {
        if (!Array.isArray(listeImages) || listeImages.length === 0) return;
        const dataUrls = {};
        const echecs = [];
        await Promise.all(listeImages.map(async (chemin) => {
            try {
                const res = await fetch(BASE_UPDATE_URL + chemin + '?_t=' + Date.now(), { cache: 'no-store' });
                if (!res.ok) {
                    echecs.push(chemin);
                    return;
                }
                const blob = await res.blob();
                const dataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(blob);
                });
                if (dataUrl) dataUrls[chemin] = dataUrl;
                else echecs.push(chemin);
            } catch (e) {
                echecs.push(chemin);
            }
        }));
        if (echecs.length) {
            console.warn('[Outiiil Loader] Images non mises à jour (conserve les précédentes) :', echecs.join(', '));
        }
        if (Object.keys(dataUrls).length === 0) return;
        const precedentes = await new Promise((resolve) => chrome.storage.local.get([STORAGE_KEY_IMAGES], (c) => resolve(c[STORAGE_KEY_IMAGES] || {})));
        const fusion = Object.assign({}, precedentes, dataUrls);
        chrome.storage.local.set({ [STORAGE_KEY_IMAGES]: fusion }, () => {
            console.log(`[Outiiil Loader] ${Object.keys(dataUrls).length} image(s) mises à jour dans le cache.`);
            appliquerImagesDepuisCache();
        });
    }

    function injecterCSS(cssContent) {
        if (!cssContent) return;
        const style = document.createElement('style');
        style.type = 'text/css';
        style.setAttribute('data-source', 'outiiil-bundle');
        style.appendChild(document.createTextNode(cssContent));
        (document.head || document.documentElement).appendChild(style);
    }

    function injecterLienCSS(url) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = url;
        (document.head || document.documentElement).appendChild(link);
    }

    function injecterScriptSrc(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = false;
            script.src = url;
            script.onload = () => resolve();
            script.onerror = (e) => reject(e);
            (document.head || document.documentElement).appendChild(script);
        });
    }

    function comparerVersions(v1, v2) {
        if (!v1 || !v2) return 0;
        const parts1 = v1.toString().split('.').map(n => parseInt(n, 10) || 0);
        const parts2 = v2.toString().split('.').map(n => parseInt(n, 10) || 0);
        const len = Math.max(parts1.length, parts2.length);
        for (let i = 0; i < len; i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;
            if (p1 > p2) return 1;
            if (p1 < p2) return -1;
        }
        return 0;
    }

    async function verifierEtMettreAJourConfig(versionActuelle) {
        try {
            const response = await fetch(VERSION_URL, { cache: 'no-store' });
            if (!response.ok) {
                console.log('[Outiiil Loader] Serveur distant non joignable (code ' + response.status + ').');
                return;
            }

            const remoteInfo = await response.json();
            const remoteVersion = remoteInfo.version;

            if (comparerVersions(remoteVersion, versionActuelle) > 0) {
                console.log(`[Outiiil Loader] Nouvelle configuration détectée : ${remoteVersion} (Actuelle: ${versionActuelle}). Téléchargement...`);

                // Télécharger la configuration (JSON) au lieu du bundle JS
                if (remoteInfo.configUrl) {
                    const configRes = await fetch(BASE_UPDATE_URL + remoteInfo.configUrl + '?_t=' + Date.now());
                    if (configRes.ok) {
                        const newConfig = await configRes.json();
                        const dataToSave = {};
                        dataToSave[STORAGE_KEY_CONFIG] = JSON.stringify(newConfig);
                        dataToSave[STORAGE_KEY_VERSION] = remoteVersion;

                        if (Array.isArray(remoteInfo.images)) {
                            await mettreAJourImagesEnCache(remoteInfo.images);
                        }

                        chrome.storage.local.set(dataToSave, () => {
                            console.log(`[Outiiil Loader] Configuration ${remoteVersion} enregistrée dans le cache.`);
                            if (window.$ && window.$.toast) {
                                window.$.toast({
                                    heading: 'Configuration Outiiil mise à jour',
                                    text: `La version ${remoteVersion} est téléchargée et sera active au prochain changement de page.`,
                                    icon: 'info',
                                    position: 'top-right',
                                    hideAfter: 6000
                                });
                            }
                        });
                    }
                } else {
                    // Pas de configUrl = mise à jour de logique (bundle.js) => nécessite rechargement
                    console.log('[Outiiil Loader] Mise à jour du bundle détectée. Rechargement de l\'extension requis.');
                    if (window.$ && window.$.toast) {
                        window.$.toast({
                            heading: 'Mise à jour Outiiil disponible',
                            text: `La version ${remoteVersion} contient des changements de logique. Rechargez l'extension pour l'appliquer.`,
                            icon: 'warning',
                            position: 'top-right',
                            hideAfter: 10000
                        });
                    }
                }
            } else {
                console.log(`[Outiiil Loader] L'extension est à jour (${versionActuelle}).`);
            }
        } catch (e) {
            console.warn('[Outiiil Loader] Échec de la vérification de mise à jour distante (réseau/offline) :', e);
        }
    }

    // --- MODE DÉVELOPPEMENT LOCAL ---
    if (DEV_MODE) {
        console.log('%c[Outiiil Loader] MODE DÉVELOPPEMENT ACTIF - Chargement direct des sources locales', 'color: #2196F3; font-weight: bold;');
        try {
            const sourcesUrl = chrome.runtime.getURL('scripts/bundle_sources.json');
            const sourcesRes = await fetch(sourcesUrl);
            if (sourcesRes.ok) {
                const sources = await sourcesRes.json();

                for (const cssFile of sources.css || []) {
                    injecterLienCSS(chrome.runtime.getURL(cssFile));
                }

                for (const jsFile of sources.js || []) {
                    await injecterScriptSrc(chrome.runtime.getURL(jsFile));
                }
                console.log('[Outiiil Loader] Tous les modules locaux de développement ont été injectés avec succès.');
                return;
            } else {
                console.warn('[Outiiil Loader] bundle_sources.json non trouvé, repli sur le bundle local.');
            }
        } catch (devErr) {
            console.error('[Outiiil Loader] Erreur lors du chargement des sources de dev, repli sur le bundle local :', devErr);
        }
    }

    // --- MODE PRODUCTION (STALE-WHILE-REVALIDATE) ---
    try {
        // 1. Injection immédiate du bundle local (embarqué dans l'extension)
        const cssUrl = chrome.runtime.getURL('dist/bundle.css');
        const jsUrl = chrome.runtime.getURL('dist/bundle.js');

        const [cssRes, jsRes] = await Promise.all([
            fetch(cssUrl),
            fetch(jsUrl)
        ]);

        if (cssRes.ok) {
            const cssContent = await cssRes.text();
            injecterCSS(cssContent);
        }

        if (jsRes.ok) {
            await injecterScriptSrc(jsUrl);
        }

        // 2. Exposition des images mises à jour
        await appliquerImagesDepuisCache();

        // 3. Récupérer la version active depuis le storage ou version.json
        chrome.storage.local.get([STORAGE_KEY_VERSION], async (cache) => {
            let versionActive = cache[STORAGE_KEY_VERSION];
            if (!versionActive) {
                try {
                    const verRes = await fetch(chrome.runtime.getURL('dist/version.json'));
                    if (verRes.ok) {
                        const verData = await verRes.json();
                        versionActive = verData.version;
                    }
                } catch (e) { }
            }

            // 4. Lancer la vérification de mise à jour de CONFIG en tâche de fond
            setTimeout(() => {
                verifierEtMettreAJourConfig(versionActive || '0.0.0');
            }, 1000);
        });
    } catch (err) {
        console.error('[Outiiil Loader] Erreur critique lors de l\'amorce :', err);
    }
})();
