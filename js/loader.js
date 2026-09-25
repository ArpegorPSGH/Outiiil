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
 *   1. Injecte immédiatement le bundle CSS et JS depuis chrome.storage.local (ou dist/bundle.* initial si premier démarrage).
 *   2. Vérifie en arrière-plan (fetch asynchrone) la disponibilité d'une nouvelle version sur GitHub Pages (branche gh-pages).
 *   3. Si une nouvelle version existe, télécharge le nouveau bundle ainsi que les images listées dans version.json
 *      et met à jour le cache local pour la navigation suivante.
 */

(async function () {
    'use strict';

    // Flag de mode développement (activé sur la branche dev, basculé à false lors d'une release)
    const DEV_MODE = true;

    const BASE_UPDATE_URL = 'https://arpegorpsgh.github.io/Outiiil/dist/';
    const VERSION_URL = BASE_UPDATE_URL + 'version.json?_t=' + Date.now();
    const STORAGE_KEY_JS = 'outiiil_cached_bundle_js';
    const STORAGE_KEY_CSS = 'outiiil_cached_bundle_css';
    const STORAGE_KEY_VERSION = 'outiiil_cached_version';
    const STORAGE_KEY_IMAGES = 'outiiil_cached_images';
    const ATTR_BASE_URL = 'data-outiiil-base-url';

    // Exposer les métadonnées de l'extension via des attributs data sur la balise html
    const extensionBaseUrl = chrome.runtime.getURL('');
    document.documentElement.setAttribute(ATTR_BASE_URL, extensionBaseUrl);
    document.documentElement.setAttribute('data-outiiil-dev-mode', DEV_MODE ? 'true' : 'false');

    /**
     * Expose au bundle (contexte de la page) les images mises à jour présentes dans le cache :
     *  - URLs blob générées depuis les contenus cachés si disponibles,
     *  - rien sinon (le bundle retombe sur les images embarquées dans l'extension/zip).
     * L'injection se fait par script inline car le bundle s'exécute dans le contexte de la page,
     * inaccessible depuis le monde isolé du content script.
     */
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
        await chrome.scripting.executeScript({
            func: function(b) {
                window.OUTIIIL_DYNAMIC_IMAGES = b;
            },
            args: [blobs]
        });
    }

    /**
     * Télécharge et met en cache toutes les images listées dans version.json.
     */
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
        // Fusion : nouvelles valeurs par-dessus les anciennes
        const precedentes = await new Promise((resolve) => chrome.storage.local.get([STORAGE_KEY_IMAGES], (c) => resolve(c[STORAGE_KEY_IMAGES] || {})));
        const fusion = Object.assign({}, precedentes, dataUrls);
        chrome.storage.local.set({ [STORAGE_KEY_IMAGES]: fusion }, () => {
            console.log(`[Outiiil Loader] ${Object.keys(dataUrls).length} image(s) mises à jour dans le cache.`);
            appliquerImagesDepuisCache();
        });
    }

    /**
     * Injecte une chaîne de style CSS dans la page.
     */
    function injecterCSS(cssContent) {
        if (!cssContent) return;
        const style = document.createElement('style');
        style.type = 'text/css';
        style.setAttribute('data-source', 'outiiil-bundle');
        style.appendChild(document.createTextNode(cssContent));
        (document.head || document.documentElement).appendChild(style);
    }

    /**
     * Injecte une feuille de style externe via balise link.
     */
    function injecterLienCSS(url) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = url;
        (document.head || document.documentElement).appendChild(link);
    }

    /**
     * Injecte et exécute un script JavaScript dans le contexte actuel.
     */
    async function injecterJS(jsContent) {
        if (!jsContent) return;
        await chrome.scripting.executeScript({
            func: function(code) {
                eval(code);
            },
            args: [jsContent]
        });
    }

    /**
     * Injecte un script externe via balise script src.
     */
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

    /**
     * Charge le bundle initial local (embarqué dans l'extension) pour amorcer l'extension si le cache est vide.
     */
    async function chargerBundleLocalFallback() {
        try {
            const cssUrl = chrome.runtime.getURL('dist/bundle.css');
            const jsUrl = chrome.runtime.getURL('dist/bundle.js');

            const [cssRes, jsRes] = await Promise.all([
                fetch(cssUrl),
                fetch(jsUrl)
            ]);

            const cssContent = await cssRes.text();
            const jsContent = await jsRes.text();

            return { css: cssContent, js: jsContent };
        } catch (e) {
            console.error('[Outiiil Loader] Impossible de charger le bundle local de secours :', e);
            return null;
        }
    }

    /**
     * Compare deux numéros de version sémantique (ex: "3.23" vs "3.24").
     * Retourne > 0 si v1 > v2, < 0 si v1 < v2, 0 si égales.
     */
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

    /**
     * Vérification asynchrone et téléchargement en arrière-plan d'une nouvelle version.
     */
    async function verifierEtMettreAJourEnArrierePlan(versionActuelle) {
        try {
            const response = await fetch(VERSION_URL, { cache: 'no-store' });
            if (!response.ok) {
                console.log('[Outiiil Loader] Serveur distant non joignable (code ' + response.status + ').');
                return;
            }

            const remoteInfo = await response.json();
            const remoteVersion = remoteInfo.version;

            if (comparerVersions(remoteVersion, versionActuelle) > 0) {
                console.log(`[Outiiil Loader] Nouvelle version détectée : ${remoteVersion} (Actuelle: ${versionActuelle}). Téléchargement...`);

                const [jsRes, cssRes] = await Promise.all([
                    fetch(BASE_UPDATE_URL + remoteInfo.js + '?_t=' + Date.now()),
                    fetch(BASE_UPDATE_URL + remoteInfo.css + '?_t=' + Date.now())
                ]);

                if (jsRes.ok && cssRes.ok) {
                    const newJs = await jsRes.text();
                    const newCss = await cssRes.text();

                    const dataToSave = {};
                    dataToSave[STORAGE_KEY_JS] = newJs;
                    dataToSave[STORAGE_KEY_CSS] = newCss;
                    dataToSave[STORAGE_KEY_VERSION] = remoteVersion;

                    // Rapatriement des images du serveur (liste fournie par version.json)
                    if (Array.isArray(remoteInfo.images)) {
                        await mettreAJourImagesEnCache(remoteInfo.images);
                    }

                    chrome.storage.local.set(dataToSave, () => {
                        console.log(`[Outiiil Loader] Mise à jour vers ${remoteVersion} enregistrée dans le cache.`);
                        if (window.$ && window.$.toast) {
                            window.$.toast({
                                heading: 'Mise à jour Outiiil prête',
                                text: `La version ${remoteVersion} est téléchargée et sera active au prochain changement de page.`,
                                icon: 'info',
                                position: 'top-right',
                                hideAfter: 6000
                            });
                        }
                    });
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
            // Lecture de bundle_sources.json pour obtenir la liste ordonnée des fichiers sources
            const sourcesUrl = chrome.runtime.getURL('scripts/bundle_sources.json');
            const sourcesRes = await fetch(sourcesUrl);
            if (sourcesRes.ok) {
                const sources = await sourcesRes.json();

                // 1. Injection des feuilles de style CSS locales
                for (const cssFile of sources.css || []) {
                    injecterLienCSS(chrome.runtime.getURL(cssFile));
                }

                // 2. Injection séquentielle des scripts JS locaux
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
        // 1. Récupération des données depuis le stockage local (très rapide, < 10ms)
        chrome.storage.local.get([STORAGE_KEY_JS, STORAGE_KEY_CSS, STORAGE_KEY_VERSION], async (cache) => {
            let jsToRun = cache[STORAGE_KEY_JS];
            let cssToApply = cache[STORAGE_KEY_CSS];
            let versionActive = cache[STORAGE_KEY_VERSION];

            // Si le cache est vide (premier lancement), charger le fallback distribué avec l'extension
            if (!jsToRun || !cssToApply) {
                console.log('[Outiiil Loader] Initialisation du cache local depuis le bundle local...');
                const localBundle = await chargerBundleLocalFallback();
                if (localBundle) {
                    jsToRun = localBundle.js;
                    cssToApply = localBundle.css;
                    // En production, la version initiale provient de version.json (avec repli sur manifest si absent)
                    try {
                        const verRes = await fetch(chrome.runtime.getURL('dist/version.json'));
                        if (verRes.ok) {
                            const verData = await verRes.json();
                            versionActive = verData.version;
                        }
                    } catch (e) { }

                    const initialData = {};
                    initialData[STORAGE_KEY_JS] = jsToRun;
                    initialData[STORAGE_KEY_CSS] = cssToApply;
                    initialData[STORAGE_KEY_VERSION] = versionActive;
                    chrome.storage.local.set(initialData);
                }
            }

            // 2. Exposition des images mises à jour (avant injection : les IMG_* du bundle y font référence)
            await appliquerImagesDepuisCache();

            // 3. Injection immédiate du CSS et du JS
            if (cssToApply) {
                injecterCSS(cssToApply);
            }
            if (jsToRun) {
                await injecterJS(jsToRun);
            }

            // 4. Lancer la vérification de mise à jour en tâche de fond (non bloquante)

            // 3. Lancer la vérification de mise à jour en tâche de fond (non bloquante)
            setTimeout(() => {
                verifierEtMettreAJourEnArrierePlan(versionActive || '0.0.0');
            }, 1000);
        });
    } catch (err) {
        console.error('[Outiiil Loader] Erreur critique lors de l\'amorce :', err);
    }
})();
