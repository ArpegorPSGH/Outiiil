Utils.register(class FonctionnaliteJoueursExterieurs extends FonctionnaliteAlliance {
    /**
     * @property {string} #nom - Nom pour l'affichage dans les logs
     */
    #nom = 'Joueurs Extérieurs';

    /**
     * @property {string[]} ABREVIATIONS_HISTORY - Historique des abréviations
     */
    static ABREVIATIONS_HISTORY = ['JEX'];

    /**
     * Exécute la fonctionnalité.
     * @async
     * @returns {Promise<void>}
     */
    async run() {
        console.log(`[${this.#nom}] Exécution`);
        await this.page.synchroniserJoueursDepuisDOM();
        const joueursDejaDansTableau = Object.keys(this.page._alliance.joueurs);

        const tousLesMembres = await this.chargerObjetForumsMultiples(Joueur);
        const membresAPotentiellementAjouter = [];
        for(const membre of tousLesMembres) {
            if(!joueursDejaDansTableau.includes(await membre.lireParametre('pseudo'))) {
                membresAPotentiellementAjouter.push(membre);
            }
        }
        console.log('membresAPotentiellementAjouter: ', membresAPotentiellementAjouter)
        if (membresAPotentiellementAjouter.length > 0) {
            console.log(`[${this.#nom}] ${membresAPotentiellementAjouter.length} joueur(s) à ajouter au tableau.`);
            
            const headers = [];
            $("#tabMembresAlliance thead tr th").each(function() {
                let headerText = $(this).text().toLowerCase().trim();
                headers.push(headerText);
            });
            console.log('headers: ', headers)
            for (const membre of membresAPotentiellementAjouter) {
                const { corps_html } = await membre.afficher(headers);
                $("#tabMembresAlliance tbody").append(corps_html);
                const pseudo = await membre.lireParametre('pseudo');
                console.log(`[${this.#nom}] Ligne ajoutée pour le joueur ${pseudo}.`);
            }
        } else {
            console.log(`[${this.#nom}] Aucun joueur extérieur à ajouter.`);
        }
    }
});
