/**
 * Classe de gestion de la sécurisation des actions utilisateur.
 * Vérifie que les données ne sont pas périmées avant d'exécuter l'action.
 *
 * @class ActionSecurisee
 */
Utils.register(class ActionSecurisee {
    static actionEnCours = false;

    /**
     * Traite de façon sécurisée une action utilisateur.
     *
     * @static
     * @async
     * @param {HTMLElement|jQuery} element - L'élément déclencheur.
     * @param {String} evenement - Le nom de l'événement (ex: 'click').
     * @param {FonctionnaliteAlliance} fonctionnalite - L'instance de la fonctionnalité parente.
     * @param {Function} callback - La fonction callback à exécuter.
     * @param {Event} e - L'événement d'origine.
     * @param {Object} [data] - Les données optionnelles associées à l'événement.
     * @returns {Promise<*>}
     */
    static async traiter(element, evenement, fonctionnalite, callback, e, data) {
        // 1. Validation du flag de sécurité
        if (data && data.isSecured) {
            // Bloque l'action par défaut du navigateur (soumission, clic de lien, etc.) de manière synchrone pendant que la transaction s'exécute
            e.preventDefault();
            e.stopImmediatePropagation();

            try {
                let resultatAction = await fonctionnalite.executerTransaction(async () => {
                    return await callback.call(element, e);
                });

                // Si la transaction s'est déroulée avec succès
                // Cas 1 : Si c'est un bouton de soumission ou un élément d'un formulaire qui doit soumettre le formulaire parent
                const $form = $(element).closest('form');
                if ($form.length > 0 && ($(element).is(':submit') || $(element).attr('type') === 'submit' || $(element).is('button:not([type])') || $(element).is("input[name='convoi']"))) {
                    console.log("[ActionSecurisee] Soumission du formulaire après la fin de la transaction.");

                    // Si le bouton de soumission cliqué a un name et une valeur, on les ajoute sous forme d'input caché pour que le serveur les reçoive !
                    const name = $(element).attr('name');
                    const value = $(element).attr('value') || $(element).text() || '';
                    if (name) {
                        $form.find(`input[type='hidden'][name='${name}']`).remove();
                        $form.append($(`<input type="hidden" name="${name}" />`).val(value));
                    }

                    $form.get(0).submit();
                }
                // Cas 2 : Si c'est un lien <a> qui doit naviguer vers son href
                else if (evenement === 'click' && $(element).is('a')) {
                    const href = $(element).attr('href');
                    if (href && href !== '#' && !href.startsWith('javascript:')) {
                        console.log("[ActionSecurisee] Navigation vers le lien après la transaction :", href);
                        await logger.attendreFinPosteLogs();
                        location.href = href;
                    }
                }

                return resultatAction;
            } finally {
                ActionSecurisee.actionEnCours = false;
            }
        }

        // Blocage si une autre action sécurisée est déjà en cours
        const stack = new Error().stack || "";
        const isNested = (stack.match(/onActionSecuriseeHandler/g) || []).length >= 2;
        if (ActionSecurisee.actionEnCours && !isNested) {
            $.toast({
                ...TOAST_INFO,
                heading: "Action en cours",
                text: "Une action sécurisée est déjà en cours. Veuillez patienter.",
                hideAfter: 3000
            });
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
        }

        // Verrouillage
        ActionSecurisee.actionEnCours = true;

        // Vidage de l'historique des logs au tout début d'une action sécurisée
        await logger.viderHistorique();

        // 2. Blocage de l'événement original
        e.preventDefault();
        e.stopImmediatePropagation();

        try {
            // 3. Identification des signatures d'appels de chargement
            const signatures = fonctionnalite.determinerAppelsChargement();

            // 4. Prise de l'empreinte globale initiale (sur les objets en cache)
            const empreinteInitiale = await fonctionnalite._prendreEmpreinteGlobale(signatures);

            // 5. Vérifications initiales (Droits, Versions, Membre) avec rafraîchissement forcé
            const conditionsOk = await fonctionnalite.verifierConditionsInitiales(true);
            if (!conditionsOk) {
                const debutGestionErreur = moment();
                $.toast({
                    ...TOAST_INFO,
                    heading: "Action bloquée",
                    text: "Vos droits, votre appartenance à l'alliance ou la configuration du forum ont été modifiés. La page va être rechargée.",
                    hideAfter: 5000
                });
                await logger.attendreFinPosteLogs();
                const dureeGestionErreur = moment().diff(debutGestionErreur);
                const tempsRestant = Math.max(0, 5000 - dureeGestionErreur);
                setTimeout(() => location.href = location.href, tempsRestant);
                return;
            }

            // 6. Rafraîchissement global (vide le cache)
            await fonctionnalite.rafraichirDonneesFonctionnalite();

            // 7. Prise de la nouvelle empreinte (provoque le rechargement effectif)
            const empreinteFinale = await fonctionnalite._prendreEmpreinteGlobale(signatures);
            if (empreinteInitiale !== empreinteFinale) {
                const debutGestionErreur = moment();
                $.toast({
                    ...TOAST_INFO,
                    heading: "Données obsolètes",
                    text: "Les données ont été modifiées par un autre utilisateur. L'affichage va être actualisé.",
                    hideAfter: 3000
                });
                await logger.attendreFinPosteLogs();
                const dureeGestionErreur = moment().diff(debutGestionErreur);
                const tempsRestant = Math.max(0, 3000 - dureeGestionErreur);
                setTimeout(() => location.href = location.href, tempsRestant);
                return;
            }

            // 8. Tout est OK, on redéclenche l'événement avec le flag isSecured
            $(element).trigger(evenement, [{ isSecured: true }]);

        } catch (error) {
            console.error("[onActionSecurisee] Erreur lors de la sécurisation de l'action:", error);
            const debutGestionErreur = moment();
            $.toast({
                ...TOAST_ERROR,
                heading: "Erreur de synchronisation",
                text: "Une erreur est survenue lors de la vérification des données. La page va être rechargée par sécurité.",
                hideAfter: 3000
            });
            await logger.attendreFinPosteLogs();
            const dureeGestionErreur = moment().diff(debutGestionErreur);
            const tempsRestant = Math.max(0, 3000 - dureeGestionErreur);
            setTimeout(() => location.href = location.href, tempsRestant);
        }
    }
})

/**
 * Plugin jQuery pour sécuriser une action utilisateur (clic).
 * @param {String} evenement - Le nom de l'événement (ex: 'click').
 * @param {FonctionnaliteAlliance} fonctionnalite - L'instance de la fonctionnalité parente.
 * @param {Function} callback - La fonction à exécuter si les données sont à jour.
 */
$.fn.onActionSecurisee = function (evenement, fonctionnalite, callback) {
    return this.on(evenement, function onActionSecuriseeHandler(e, data) {
        return ActionSecurisee.traiter(this, evenement, fonctionnalite, callback, e, data);
    });
};