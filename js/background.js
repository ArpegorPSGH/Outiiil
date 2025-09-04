// background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "requestUpdateCheck") {
        console.log("Background Script: Reçu une demande de vérification de mise à jour.");
        if (typeof chrome.runtime.requestUpdateCheck === 'function') {
            chrome.runtime.requestUpdateCheck((status, details) => {
                console.log("Background Script: Statut de la vérification de mise à jour :", status, "Détails :", details);
                if (status === 'update_available') {
                    console.log("Background Script: Mise à jour disponible. Rechargement de l'extension...");
                    chrome.runtime.reload();
                    // Ne pas appeler sendResponse ici car l'extension va recharger, fermant le canal.
                } else if (status === 'throttled') {
                    console.log("Background Script: Vérification de mise à jour limitée (throttled). Réessayez plus tard.");
                    sendResponse({ status: status, details: details });
                }
                else {
                    sendResponse({ status: status, details: details });
                }
            });
            return true; // Indique que sendResponse sera appelé de manière asynchrone (sauf si reload)
        } else {
            console.warn("Background Script: chrome.runtime.requestUpdateCheck n'est pas disponible.");
            sendResponse({ status: 'not_available' });
        }
    }
});

console.log("Background Script: Démarré et écoute les messages.");
