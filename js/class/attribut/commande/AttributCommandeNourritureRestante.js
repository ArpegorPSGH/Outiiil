class AttributCommandeNourritureRestante extends AttributObjet {
    static NOM_APPEL = ['Nourriture Restante'];
    static TYPE_AFFICHAGE = 'quantite-grade';
    static NOM_AFFICHAGE = [`Qté à livrer ${IMG_POMME}`];

    /**
     * Calcule la quantité de nourriture restante à livrer
     * @param {boolean} peutVoirDonneesRestreintes - Si l'utilisateur peut voir les données restreintes
     * @returns {Promise<number>} Quantité restante
     */
    async calculerValeur(peutVoirDonneesRestreintes) {
        const params = await this.objetParent.lire(['Nourriture Demandée', 'Nourriture Livrée'], peutVoirDonneesRestreintes);
        return params['Nourriture Demandée'] - params['Nourriture Livrée'];
    }
}
