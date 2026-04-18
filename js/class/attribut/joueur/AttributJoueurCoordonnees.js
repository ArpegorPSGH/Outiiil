class AttributJoueurCoordonnees extends AttributObjet {
    static NOM_AFFICHAGE = ['Coordonnées'];

    /**
     * Calcule les coordonnées au format (x, y)
     * @param {boolean} peutVoirDonneesRestreintes - Si l'utilisateur peut voir les données restreintes
     * @returns {Promise<string>} Les coordonnées formatées
     */
    async calculerValeur(peutVoirDonneesRestreintes) {
        const { x, y } = await this.objetParent.lire(['X', 'Y'], peutVoirDonneesRestreintes);
        return `(${x}, ${y})`;
    }
}
