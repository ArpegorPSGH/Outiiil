Utils.register(class FonctionnaliteModificationGrade extends FonctionnaliteAlliance {
    /**
     * @property {string} #nom - Nom pour l'affichage dans les logs
     */
    #nom = 'Modification de Grade';

    /**
     * @property {string[]} ABREVIATIONS_HISTORY - Historique des abréviations
     */
    static ABREVIATIONS_HISTORY = ['MRG'];

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
        const membresForum = await this.chargerObjetForumsMultiples(Joueur, false);
        const pseudoColIndex = this.page.getColonneIndex('Pseudo');
        
        // Parcourir toutes les lignes pour ajouter l'icône de modification
        await $("#tabMembresAlliance tbody tr").each(async (i, elt) => {
            const pseudo = $(elt).find(`td:eq(${pseudoColIndex})`).text().split(' ')[0];
            const joueur = membresForum.find(j => j.mapParametres.get('pseudo').valeur === pseudo);

            if (joueur) {
                const bouton = $(`<a href="#"><img src="${IMG_UTILITY}" alt="grade"/></a>`);
                bouton.on('click', (e) => {
                    e.preventDefault();
                    const boite = new BoiteGrade(joueur, this.page);
                    boite.afficher();
                });
                $(elt).find('td:eq(0)').append(bouton);
            }
        });
    }

});
