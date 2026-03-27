class AttributCommandeStatut extends AttributObjet {
    static SORTABLE_PAR_DEFAUT = false;
    static NOM_AFFICHAGE = ['Statut'];

    /**
     * Calcule l'icône de statut selon retard et état
     * @param {boolean} peutVoirDonneesRestreintes - Si l'utilisateur peut voir les données restreintes
     * @returns {Promise<string>} HTML de l'icône
     */
    async calculerValeur(peutVoirDonneesRestreintes) {
        const dateApres = await this.objetParent.lireParametre('Date Après', peutVoirDonneesRestreintes);
        const attente = await this.objetParent.getAttente();
        const apres = !dateApres || moment().isSameOrAfter(moment(dateApres));

        let statutHtml;
        if (apres) {
            if (attente > 0) statutHtml = `<img src='images/icone/3rondrouge.gif'/>`;
            else if (attente > -3) statutHtml = `<img src='images/icone/2rondorange.gif'/>`;
            else statutHtml = `<img src='images/icone/1rondvert.gif'/>`;
        } else {
            statutHtml = `<img src="${IMG_CROIX}" alt='supprimer' title='Ne pas livrer avant le ${moment(dateApres).format("DD-MM-YYYY")}'/>`;
        }
        return statutHtml;
    }
}
