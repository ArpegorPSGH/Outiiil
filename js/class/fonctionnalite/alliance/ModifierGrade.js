Utils.register(class ModifierGrade extends FonctionnaliteAlliance {
    /**
     * @property {string} #nom - Nom pour l'affichage dans les logs
     */
    #nom = 'Modification de Grade';

    /**
     * @property {string[]} ABREVIATIONS_HISTORY - Historique des abréviations
     */
    static ABREVIATIONS_HISTORY = ['MGR'];

    /**
     * @property {string} NIVEAU_DROIT_REQUIS - Niveau de droit requis pour cette fonctionnalité
     */
    static NIVEAU_DROIT_REQUIS = 'A';

    /**
     * Exécute la fonctionnalité.
     * @async
     * @returns {Promise<void>}
     */
    async run() {
        console.log(`[${this.#nom}] Exécution`);
        let membresForum;
        await FonctionnaliteAlliance.executerTransaction(async () => {
            membresForum = await this.chargerObjetsForum(Joueur, false);
        });
        const membresForumMap = new Map();
        for (const j of membresForum) {
            const pseudo = await j.lire('Pseudo');
            const id = await j.lire('Id');
            membresForumMap.set(pseudo, { joueur: j, id });
        }

        const pseudoColIndex = this.page.getColonneIndex('Pseudo');

        // Parcourir toutes les lignes pour ajouter l'icône de modification
        $("#tabMembresAlliance tbody tr").each((i, elt) => {
            const pseudo = $(elt).find(`td:eq(${pseudoColIndex})`).text().split(' ')[0];
            const data = membresForumMap.get(pseudo);

            if (data) {
                const premierTd = $(elt).find('td:eq(0)');
                if (premierTd.find('img[alt="grade"]').length > 0) {
                    return;
                }
                const { joueur, id } = data;
                const bouton = $(`<a href="#"><img src="${IMG_UTILITY}" alt="grade"/></a>`);
                bouton.onActionSecurisee('click', this, (e) => {
                    const boite = new BoiteGrade(joueur, this.page, id);
                    boite.afficher();
                });
                premierTd.append(bouton);
            }
        });
    }

});
