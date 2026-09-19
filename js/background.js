// background.js

let derniereVerificationMaj = 0;
const DELAI_MIN_VERIFICATION_MS = 60 * 1000; // 1 minute d'intervalle minimum entre deux vérifications

function verifierMiseAJour(sendResponse, ignorerThrottle = false) {
    const maintenant = Date.now();
    if (!ignorerThrottle && (maintenant - derniereVerificationMaj < DELAI_MIN_VERIFICATION_MS)) {
        console.log("Background Script: Vérification ignorée (trop récente).");
        if (sendResponse) sendResponse({ status: 'throttled_locally' });
        return;
    }
    derniereVerificationMaj = maintenant;

    if (typeof chrome.runtime.requestUpdateCheck === 'function') {
        chrome.runtime.requestUpdateCheck((status, details) => {
            console.log("Background Script: Statut de la vérification de mise à jour :", status, "Détails :", details);
            if (status === 'update_available') {
                console.log("Background Script: Mise à jour disponible. Rechargement de l'extension...");
                chrome.runtime.reload();
            } else {
                if (sendResponse) sendResponse({ status: status, details: details });
            }
        });
    } else {
        console.warn("Background Script: chrome.runtime.requestUpdateCheck n'est pas disponible.");
        if (sendResponse) sendResponse({ status: 'not_available' });
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "requestUpdateCheck") {
        console.log("Background Script: Reçu une demande de vérification de mise à jour.");
        verifierMiseAJour(sendResponse, request.force === true);
        return true; // Asynchrone
    } else if (request.action === "executerScriptAutorisation") {
        const scriptPath = request.scriptPath;
        const scriptUrl = chrome.runtime.getURL(scriptPath);
        const filename = scriptPath.split('/').pop();

        if (chrome.downloads && typeof chrome.downloads.download === 'function') {
            chrome.downloads.download({
                url: scriptUrl,
                filename: filename,
                saveAs: false,
                conflictAction: 'overwrite'
            }, (downloadId) => {
                if (chrome.runtime.lastError || !downloadId) {
                    console.error("Background Script: Erreur lors du téléchargement du script :", chrome.runtime.lastError);
                    if (sendResponse) sendResponse({ success: false, error: chrome.runtime.lastError ? chrome.runtime.lastError.message : "Erreur de téléchargement" });
                    return;
                }

                console.log("Background Script: Script téléchargé avec ID :", downloadId);

                // Écouter la fin complète du téléchargement avant d'ouvrir le fichier
                const onChangedHandler = (delta) => {
                    if (delta.id === downloadId && delta.state && delta.state.current === 'complete') {
                        chrome.downloads.onChanged.removeListener(onChangedHandler);
                        try {
                            chrome.downloads.open(downloadId);
                            console.log("Background Script: chrome.downloads.open appelé avec succès.");
                            if (sendResponse) sendResponse({ success: true });
                        } catch (e) {
                            console.error("Background Script: Erreur lors de l'ouverture du script :", e);
                            if (sendResponse) sendResponse({ success: false, error: e.message });
                        }
                    } else if (delta.id === downloadId && delta.error) {
                        chrome.downloads.onChanged.removeListener(onChangedHandler);
                        console.error("Background Script: Échec du téléchargement du script :", delta.error.current);
                        if (sendResponse) sendResponse({ success: false, error: delta.error.current });
                    }
                };

                chrome.downloads.onChanged.addListener(onChangedHandler);
            });
        } else {
            console.error("Background Script: API chrome.downloads non disponible.");
            if (sendResponse) sendResponse({ success: false, error: "API chrome.downloads indisponible" });
        }
        return true; // Asynchrone
    }
});

// Écouteur pour appliquer les mises à jour téléchargées dès que disponibles
if (chrome.runtime.onUpdateAvailable) {
    chrome.runtime.onUpdateAvailable.addListener((details) => {
        console.log("Background Script: onUpdateAvailable détecté pour la version", details.version);
        chrome.runtime.reload();
    });
}

console.log("Background Script: Démarré et écoute les messages.");
