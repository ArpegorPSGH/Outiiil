/**
 * Plugin jQuery pour sécuriser une action utilisateur (clic).
 * Vérifie que les données ne sont pas périmées avant d'exécuter l'action.
 * @param {String} evenement - Le nom de l'événement (ex: 'click').
 * @param {FonctionnaliteAlliance} fonctionnalite - L'instance de la fonctionnalité parente.
 * @param {Function} callback - La fonction à exécuter si les données sont à jour.
 */
$.fn.onActionSecurisee = function (evenement, fonctionnalite, callback) {
    return this.on(evenement, async function onActionSecuriseeHandler(e, data) {
        // 1. Validation du flag de sécurité
        if (data && data.isSecured) {
            // Bloque l'action par défaut du navigateur (soumission, clic de lien, etc.) de manière synchrone pendant que la transaction s'exécute
            e.preventDefault();
            e.stopImmediatePropagation();

            let resultatAction = await fonctionnalite.executerTransaction(async () => {
                return await callback.call(this, e);
            });
            $.fn.onActionSecurisee.actionEnCours = false;

            // Si la transaction s'est déroulée avec succès
            // Cas 1 : Si c'est un bouton de soumission ou un élément d'un formulaire qui doit soumettre le formulaire parent
            const $form = $(this).closest('form');
            if ($form.length > 0 && ($(this).is(':submit') || $(this).attr('type') === 'submit' || $(this).is('button:not([type])') || $(this).is("input[name='convoi']"))) {
                console.log("[ActionSecurisee] Soumission du formulaire après la fin de la transaction.");

                // Si le bouton de soumission cliqué a un name et une valeur, on les ajoute sous forme d'input caché pour que le serveur les reçoive !
                // (les soumissions via form.submit() de l'API DOM n'incluent pas les données du bouton ayant déclenché l'événement à l'origine)
                const name = $(this).attr('name');
                const value = $(this).attr('value') || $(this).text() || '';
                if (name) {
                    $form.find(`input[type='hidden'][name='${name}']`).remove();
                    $form.append($(`<input type="hidden" name="${name}" />`).val(value));
                }

                $form.get(0).submit();
            }
            // Cas 2 : Si c'est un lien <a> qui doit naviguer vers son href
            else if (evenement === 'click' && $(this).is('a')) {
                const href = $(this).attr('href');
                if (href && href !== '#' && !href.startsWith('javascript:')) {
                    console.log("[ActionSecurisee] Navigation vers le lien après la transaction :", href);
                    location.href = href;
                }
            }

            return resultatAction;
        }

        // Blocage si une autre action sécurisée est déjà en cours
        const stack = new Error().stack || "";
        const isNested = (stack.match(/onActionSecuriseeHandler/g) || []).length >= 2;
        if ($.fn.onActionSecurisee.actionEnCours && !isNested) {
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
        $.fn.onActionSecurisee.actionEnCours = true;

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
                setTimeout(() => location.href = location.href, 5000);
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
                setTimeout(() => location.href = location.href, 3000);
                return;
            }

            // 8. Tout est OK, on redéclenche l'événement avec le flag isSecured
            $(this).trigger(evenement, [{ isSecured: true }]);

        } catch (error) {
            console.error("[onActionSecurisee] Erreur lors de la sécurisation de l'action:", error);
            $.toast({
                ...TOAST_ERROR,
                heading: "Erreur de synchronisation",
                text: "Une erreur est survenue lors de la vérification des données. La page va être rechargée par sécurité.",
                hideAfter: 3000
            });
            setTimeout(() => location.href = location.href, 3000);
        }
    });
};