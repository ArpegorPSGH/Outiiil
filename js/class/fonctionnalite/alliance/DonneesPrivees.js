Utils.register(class DonneesPrivees extends FonctionnaliteAlliance {
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

        const membresForum = await this.chargerObjetsForum(Joueur, false);
        console.log('membresForum: ', membresForum);
        const membresForumMap = new Map();
        for (const j of membresForum) {
            membresForumMap.set(await j.lire('Pseudo'), j);
        }

        const initialPseudoColIndex = this.page.getColonneIndex('Pseudo');
        const initialRangColIndex = this.page.getColonneIndex('Rang');
        let gradeColIndex = this.page.getColonneIndex('Grade');

        if (gradeColIndex === -1) {
            // La colonne 'Grade' n'existe pas, on la crée
            console.log(`[${this.#nom}] Création de la colonne 'Grade'.`);
            $('<th class="dt-head-center">Grade</th>').insertBefore($(`#tabMembresAlliance thead tr th:eq(${initialRangColIndex})`));

            const promises = $("#tabMembresAlliance tbody tr").map(async (i, elt) => {
                const row = $(elt);
                const pseudo = row.find(`td:eq(${initialPseudoColIndex})`).text().split(' ')[0];
                const joueur = membresForumMap.get(pseudo);

                let grade = '';
                if (joueur) {
                    grade = await joueur.lire('Grade') || '';
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
                const joueur = membresForumMap.get(pseudo);

                let grade = '';
                if (joueur) {
                    grade = await joueur.lire('Grade') || '';
                }
                row.find(`td:eq(${gradeColIndex})`).text(grade);
            }).get();

            await Promise.all(promises);
            console.log(`[${this.#nom}] Colonne 'Grade' mise à jour.`);
        }
    }
});
