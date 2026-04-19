class Options extends AttributObjet {
    static SORTABLE_PAR_DEFAUT = false;
    static NOM_AFFICHAGE = ['Options'];

    /**
     * Génère les boutons modifier/supprimer selon droits
     * @param {boolean} peutVoirDonneesRestreintes - Si l'utilisateur peut voir les données restreintes
     * @returns {Promise<string>} HTML des boutons ou chaîne vide
     */
    async calculerValeur(peutVoirDonneesRestreintes) {
        const demandeur = await this.objetParent.lire('Demandeur', peutVoirDonneesRestreintes);
        const pseudoActuel = await monProfilJoueur.lire('Pseudo');

        const optionsHtml = (demandeur == pseudoActuel)
            ? `<a id='o_modifierCommande${this.objetParent.idSujet}' href=''><img src='${IMG_CRAYON}' alt='modifier'/></a> <a id='o_supprimerCommande${this.objetParent.idSujet}' href=''><img src='${IMG_CROIX}' alt='supprimer'/></a>`
            : "";
        return optionsHtml;
    }
}
