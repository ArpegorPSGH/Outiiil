Utils.register(class FonctionnaliteDonneesPrivees extends FonctionnaliteAlliance {
    /**
     * @property {string} #nom - Nom pour l'affichage dans les logs
     */
    #nom = 'Données Privées';

    /**
     * @property {string[]} ABREVIATIONS_HISTORY - Historique des abréviations
     */
    static ABREVIATIONS_HISTORY = ['DPR'];

    /**
     * Exécute la fonctionnalité.
     * @async
     * @returns {Promise<void>}
     */
    async run() {
        console.log(`[${this.#nom}] Exécution`);
        
        const membresForum = await this.chargerObjetForumsMultiples(Joueur, false);
        console.log('membresForum: ', membresForum);

        const initialPseudoColIndex = this.page.getColonneIndex('Pseudo');
        const initialRangColIndex = this.page.getColonneIndex('Rang');
        let gradeColIndex = this.page.getColonneIndex('Grade');

        if (gradeColIndex === -1) {
            // La colonne 'Grade' n'existe pas, on la crée
            console.log(`[${this.#nom}] Création de la colonne 'Grade'.`);
            $('<th class="dt-head-center">Grade</th>').insertBefore($(`#tabMembresAlliance thead tr th:eq(${initialRangColIndex})`));
            
            this.page._columnSettings.Grade = {sortable: false, visible: true};
            let rangSetting = this.page._columnSettings.Rang;
            rangSetting.visible = false;
            this.page._columnSettings.Rang = rangSetting;

            const promises = $("#tabMembresAlliance tbody tr").map(async (i, elt) => {
                const row = $(elt);
                const pseudo = row.find(`td:eq(${initialPseudoColIndex})`).text().split(' ')[0];
                const joueur = membresForum.find(j => j.mapParametres.get('pseudo').valeur === pseudo);
                
                let grade = '';
                if (joueur) {
                    grade = await joueur.lireParametre('grade') || '';
                }
                const gradeCell = `<td align="center">${grade}</td>`;
                $(gradeCell).insertBefore(row.find(`td:eq(${initialRangColIndex})`));
            }).get();

            await Promise.all(promises);
            console.log(`[${this.#nom}] Colonne 'Grade' ajoutée.`);
        } else {
            // La colonne 'Grade' existe, on la met à jour
            console.log(`[${this.#nom}] Mise à jour de la colonne 'Grade'.`);
            const promises = $("#tabMembresAlliance tbody tr").map(async (i, elt) => {
                const row = $(elt);
                const pseudo = row.find(`td:eq(${initialPseudoColIndex})`).text().split(' ')[0];
                const joueur = membresForum.find(j => j.mapParametres.get('pseudo').valeur === pseudo);

                let grade = '';
                if (joueur) {
                    grade = await joueur.lireParametre('grade') || '';
                }
                row.find(`td:eq(${gradeColIndex})`).text(grade);
            }).get();

            await Promise.all(promises);
            console.log(`[${this.#nom}] Colonne 'Grade' mise à jour.`);
        }
    }
});
