Utils.register(class JoueursExterieurs extends FonctionnaliteAlliance {
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

        const tousLesMembres = await this.chargerObjetsForum(Joueur, false);
        const tousLesMembresMap = new Map();
        for (const m of tousLesMembres) {
            tousLesMembresMap.set(await m.lire('Pseudo'), m);
        }

        const membresExterieurs = [];
        for (const membre of tousLesMembres) {
            if (!joueursDejaDansTableau.includes(await membre.lire('Pseudo'))) {
                membresExterieurs.push(membre);
            }
        }
        console.log('membresExterieurs: ', membresExterieurs);

        if (membresExterieurs.length > 0) {
            console.log(`[${this.#nom}] ${membresExterieurs.length} joueur(s) extérieur(s) trouvé(s).`);

            const pseudoColIndex = this.page.getColonneIndex('Pseudo');
            let tagAllianceColIndex = this.page.getColonneIndex('Tag Alliance');

            if (tagAllianceColIndex === -1) {
                // Créer la colonne "Tag Alliance" juste après "Pseudo"
                $('<th>Tag Alliance</th>').insertAfter($(`#tabMembresAlliance thead tr th:eq(${pseudoColIndex})`));
                tagAllianceColIndex = pseudoColIndex + 1;
                console.log(`[${this.#nom}] Colonne 'Tag Alliance' créée.`);
            }

            // Peupler la colonne pour tous les joueurs déjà dans le tableau
            const promises = $("#tabMembresAlliance tbody tr").map(async (i, elt) => {
                const row = $(elt);
                const pseudo = row.find(`td:eq(${pseudoColIndex})`).text().split(' ')[0];
                const joueur = tousLesMembresMap.get(pseudo);

                let tag = '';
                if (joueur) {
                    const tagBrut = await joueur.lire('Tag Alliance');
                    if (tagBrut) {
                        tag = `<a href="classementAlliance.php?alliance=${encodeURIComponent(tagBrut)}" target="_blank">${tagBrut}</a>`;
                    }
                }
                const tagCell = `<td align="center">${tag}</td>`;
                $(tagCell).insertAfter(row.find(`td:eq(${pseudoColIndex})`));
            }).get();
            await Promise.all(promises);

            // Ajouter les lignes des joueurs extérieurs
            const headers = [];
            $("#tabMembresAlliance thead tr th").each(function () {
                headers.push($(this).text().trim());
            });

            for (const membre of membresExterieurs) {
                const $corps = await membre.afficherCorps(headers);
                $("#tabMembresAlliance tbody").append($corps);
                const pseudo = await membre.lire('Pseudo');
                console.log(`[${this.#nom}] Ligne ajoutée pour le joueur ${pseudo}.`);
            }
        } else {
            console.log(`[${this.#nom}] Aucun joueur extérieur à ajouter.`);
        }
    }
});
