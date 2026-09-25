/**
 * Script background dynamique exemple.
 *
 * Ce script est injecte dans le contexte de la page via chrome.scripting.executeScript
 * (en traverse du background service worker), ce qui contourne le CSP de la page.
 *
 * Il peut acceder aux variables globales de la page (window.$, window.monProfilJoueur, etc.)
 * et interagir avec le DOM comme un script normal.
 */

(function() {
    'use strict';

    window.OUTIIIL_DYNAMIC_BG_LOADED = true;

    console.log('[Outiiil Dynamic BG] Script background dynamique injecte avec succes');

    // Exemple : écouter les messages depuis le bundle principal
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'OUTIIIL_DYNAMIC_BG_REQUEST') {
            event.source.postMessage({
                type: 'OUTIIIL_DYNAMIC_BG_RESPONSE',
                payload: {
                    loaded: true,
                    timestamp: Date.now()
                }
            }, '*');
        }
    });
})();
