class AttributCommandeTempsParcours extends AttributObjet {
    static TYPE_AFFICHAGE = 'time-unformat';
    static NOM_AFFICHAGE = ['Temps de trajet'];

    /**
     * Calcule le temps de parcours jusqu'au demandeur
     * @param {boolean} peutVoirDonneesRestreintes - Si l'utilisateur peut voir les données restreintes
     * @returns {Promise<string>} Temps formaté
     */
    async calculerValeur(peutVoirDonneesRestreintes) {
        const demandeur = await this.objetParent.lire('Demandeur', peutVoirDonneesRestreintes);

        // Rechercher le joueur demandeur dans le cache
        const joueurs = await this.objetParent.fonctionnaliteCreatrice.chargerObjetsForum(Joueur, false);
        let joueurDemandeur = null;
        for (const j of joueurs) {
            const pseudo = await j.lire('Pseudo');
            if (pseudo === demandeur) {
                joueurDemandeur = j;
                break;
            }
        }

        const tempsParcours = await monProfilJoueur.getTempsParcours2(joueurDemandeur);
        return Utils.intToTime(tempsParcours);
    }
}
