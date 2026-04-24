Utils.register(class Actualiser extends FonctionnaliteAlliance {
    /**
     * @property {string} #nom - Nom pour l'affichage dans les logs
     */
    #nom = 'Actualiser Alliance';

    /**
     * @property {string[]} ABREVIATIONS_HISTORY - Historique des abréviations
     */
    static ABREVIATIONS_HISTORY = ['ACT'];

    /**
     * @property {string} NIVEAU_DROIT_REQUIS - Niveau de droit requis pour cette fonctionnalité
     */
    static NIVEAU_DROIT_REQUIS = 'A';

    /**
     * @property {boolean} VERIFICATION_MEMBRE_REQUIS - Vérification de l'état de membre requis pour cette fonctionnalité
     */
    static VERIFICATION_MEMBRE_REQUIS = false;

    /**
     * Exécute la fonctionnalité.
     * @async
     * @returns {Promise<void>}
     */
    async run() {
        console.log(`[${this.#nom}] Exécution`);
        const dtButtonsContainer = $("#tabMembresAlliance_wrapper .dt-buttons");
        if (dtButtonsContainer.length > 0) {
            const bouton = $(`<a id="o_actualiserAlliance" class="dt-button" href="#"><span>Actualiser l'alliance</span></a>`);
            bouton.on('click', this.actualiserAlliance.bind(this));
            dtButtonsContainer.prepend(bouton);
        }
    }

    /**
     * Gère le clic sur le bouton d'actualisation.
     * @async
     * @param {Event} e - L'événement de clic.
     */
    async actualiserAlliance(e) {
        e.preventDefault();

        try {
            await this.page.synchroniserJoueursDepuisDOM();
            const membresForum = await this.chargerObjetsForum(Joueur, false);
            const membresForumMap = new Map();
            for (const m of membresForum) {
                membresForumMap.set(await m.lire('Pseudo'), m);
            }

            const promessesProfil = [];
            const nouveauxJoueurs = [];
            for (const pseudo in this.page._alliance.joueurs) {
                let joueurForum = membresForumMap.get(pseudo);

                if (!joueurForum) {
                    joueurForum = new Joueur(this, { donneesInitiales: { 'Pseudo': pseudo, 'Alliance Rattachement': this.page._alliance.tag } });
                    if (await joueurForum.estJoueurCourant()) {
                        joueurForum.ecrire('Version Extension', VERSION);
                    }
                    promessesProfil.push(joueurForum.enregistrerSurForum());
                    nouveauxJoueurs.push(joueurForum);
                }

            }
            await Promise.all(promessesProfil);
            cacheObjetForums.get(Joueur.name).push(...nouveauxJoueurs);

            $.toast({ ...TOAST_SUCCESS, text: "L'alliance a été mise à jour avec succès." });
        } catch (error) {
            console.error("Erreur lors de l'actualisation de l'alliance:", error);
            $.toast({ ...TOAST_ERROR, heading: "Erreur Actualisation", text: `${error.message || 'Une erreur est survenue.'}` });
        }
    }
});
