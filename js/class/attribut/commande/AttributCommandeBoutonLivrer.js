class AttributCommandeBoutonLivrer extends AttributObjet {
    static SORTABLE_PAR_DEFAUT = false;
    static NOM_AFFICHAGE = ['Livrer'];

    /**
     * Génère le bouton de livraison selon les conditions
     * @param {boolean} peutVoirDonneesRestreintes - Si l'utilisateur peut voir les données restreintes
     * @returns {Promise<string>} HTML du bouton ou chaîne vide
     */
    async calculerValeur(peutVoirDonneesRestreintes) {
        const dateApres = await this.objetParent.lire('Date Après', peutVoirDonneesRestreintes);
        const etat = await this.objetParent.lire('État', peutVoirDonneesRestreintes);
        const apres = !dateApres || moment().isSameOrAfter(moment(dateApres));

        console.log("dateApres", dateApres, "etat", etat, "apres", apres, "en cours", ETAT_COMMANDE["En cours"]);

        const livrerHtml = (apres && etat == ETAT_COMMANDE["En cours"])
            ? `<a id='o_commande${this.objetParent.idSujet}' href=''><img src='${IMG_LIVRAISON}' alt='livrer'/></a>`
            : "";
        return livrerHtml;
    }
}
