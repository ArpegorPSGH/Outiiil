class AttributCommandeMateriauxRestants extends AttributObjet {
    static NOM_APPEL = ['Matériaux Restants'];
    static TYPE_AFFICHAGE = 'quantite-grade';
    static NOM_AFFICHAGE = [`Qté à livrer ${IMG_MAT}`];

    /**
     * Calcule la quantité de matériaux restants à livrer
     * @param {boolean} peutVoirDonneesRestreintes - Si l'utilisateur peut voir les données restreintes
     * @returns {Promise<number>} Quantité restante
     */
    async calculerValeur(peutVoirDonneesRestreintes) {
        const params = await this.objetParent.lire(['Matériaux Demandés', 'Matériaux Livrés'], peutVoirDonneesRestreintes);
        return params['Matériaux Demandés'] - params['Matériaux Livrés'];
    }
}
