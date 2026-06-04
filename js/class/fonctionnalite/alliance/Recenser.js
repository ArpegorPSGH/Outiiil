Utils.register(class Recenser extends FonctionnaliteAlliance {
    /**
     * @property {string} #nom - Nom pour l'affichage dans les logs
     */
    #nom = 'Recensement';

    /**
     * @property {string[]} ABREVIATIONS_HISTORY - Historique des abréviations
     */
    static ABREVIATIONS_HISTORY = ['REC'];

    /**
     * Exécute la fonctionnalité.
     * @async
     * @returns {Promise<void>}
     */
    async run() {
        console.log(`[${this.#nom}] Exécution`);
        const dtButtonsContainer = $("#tabMembresAlliance_wrapper .dt-buttons");
        if (dtButtonsContainer.length > 0) {
            const bouton = $(`<a id="o_recensementButton" class="dt-button" href="#"><span>Recensement</span></a>`);
            bouton.onActionSecurisee('click', this, this.effectuerRecensement.bind(this));
            dtButtonsContainer.append(bouton);
        }
    }

    /**
     * Gère le clic sur le bouton de recensement.
     * @async
     * @param {Event} e - L'événement de clic.
     */
    async effectuerRecensement(e) {
        e.preventDefault();
        const bouton = $(e.currentTarget);
        bouton.addClass('processing').css('pointer-events', 'none');

        try {
            console.log('monProfilJoueur recensement: ', monProfilJoueur)
            let recensementReussi;
            await FonctionnaliteAlliance.executerTransaction(async () => {
                recensementReussi = await monProfilJoueur.effectuerRecensement();
            });
            if (recensementReussi) {
                $.toast({ ...TOAST_SUCCESS, text: "Recensement effectué et posté sur le forum." });
            } else {
                throw new Error("Échec de l'opération de recensement.");
            }
        } catch (error) {
            console.error("Erreur lors du recensement:", error);
            $.toast({ ...TOAST_ERROR, heading: "Erreur Recensement", text: `${error.message || 'Une erreur est survenue.'}` });
        } finally {
            bouton.removeClass('processing').css('pointer-events', 'auto');
        }
    }
});
