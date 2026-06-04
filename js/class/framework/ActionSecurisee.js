/**
 * Plugin jQuery pour sécuriser une action utilisateur (clic).
 * Vérifie que les données ne sont pas périmées avant d'exécuter l'action.
 * @param {String} evenement - Le nom de l'événement (ex: 'click').
 * @param {FonctionnaliteAlliance} fonctionnalite - L'instance de la fonctionnalité parente.
 * @param {Function} callback - La fonction à exécuter si les données sont à jour.
 */
$.fn.onActionSecurisee = function (evenement, fonctionnalite, callback) {
    return this.on(evenement, async function (e, data) {
        // 1. Validation du flag de sécurité
        if (data && data.isSecured) {
            return await callback.call(this, e);
        }

        // 2. Blocage de l'événement original
        e.preventDefault();
        e.stopImmediatePropagation();

        try {
            // 3. Identification des signatures d'appels de chargement
            const signatures = fonctionnalite._determinerAppelsChargement();

            // 4. Prise de l'empreinte globale initiale (sur les objets en cache)
            const empreinteInitiale = await fonctionnalite._prendreEmpreinteGlobale(signatures);

            // 5. Vérifications initiales (Droits, Versions, Membre) avec rafraîchissement forcé
            const conditionsOk = await fonctionnalite.verifierConditionsInitiales(true);
            if (!conditionsOk) {
                $.toast({
                    ...TOAST_INFO,
                    heading: "Action bloquée",
                    text: "Vos droits, votre appartenance à l'alliance ou la configuration du forum ont été modifiés. La page va être rechargée.",
                    hideAfter: 5000
                });
                setTimeout(() => location.reload(), 5000);
                return;
            }

            // 6. Rafraîchissement global (vide le cache)
            await fonctionnalite.rafraichirDonneesFonctionnalite();

            // 7. Prise de la nouvelle empreinte (provoque le rechargement effectif)
            const empreinteFinale = await fonctionnalite._prendreEmpreinteGlobale(signatures);
            // console.warn("[Utils][onActionSecurisee] Empreinte initiale: " + empreinteInitiale + ", Empreinte finale: " + empreinteFinale);
            if (empreinteInitiale !== empreinteFinale) {
                $.toast({
                    ...TOAST_INFO,
                    heading: "Données obsolètes",
                    text: "Les données ont été modifiées par un autre utilisateur. L'affichage va être actualisé.",
                    hideAfter: 3000
                });
                setTimeout(() => location.reload(), 3000);
                return;
            }

            // 8. Tout est OK, on redéclenche l'événement avec le flag isSecured
            $(this).trigger(evenement, [{ isSecured: true }]);

            // Cas particulier des liens <a> : trigger('click') ne déclenche pas la navigation native
            if (evenement === 'click' && $(this).is('a')) {
                const href = $(this).attr('href');
                if (href && href !== '#' && !href.startsWith('javascript:')) {
                    window.location.href = href;
                }
            }

        } catch (error) {
            console.error("[onActionSecurisee] Erreur lors de la sécurisation de l'action:", error);
            $.toast({
                ...TOAST_ERROR,
                heading: "Erreur de synchronisation",
                text: "Une erreur est survenue lors de la vérification des données. La page va être rechargée par sécurité.",
                hideAfter: 3000
            });
            setTimeout(() => location.reload(), 3000);
        }
    });
};