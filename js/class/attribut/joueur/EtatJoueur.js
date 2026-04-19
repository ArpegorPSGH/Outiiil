class EtatJoueur extends AttributObjet {
    static SORTABLE_PAR_DEFAUT = false;
    static NOM_AFFICHAGE = ['État'];

    /**
     * Calcule les images d'état (actif/inactif/banni/vacances + colonisé)
     * Retourne un tableau de 2 éléments pour correspondre aux 2 colonnes
     * séparées dans le HTML original de Fourmizzz (statut + colonisé).
     * @param {boolean} peutVoirDonneesRestreintes - Si l'utilisateur peut voir les données restreintes
     * @returns {Promise<Array<string>>} Tableau de 2 chaînes HTML [imageStatut, imageColonise]
     */
    async calculerValeur(peutVoirDonneesRestreintes) {
        const attributs = await this.objetParent.lire(['Activité', 'Colonisé'], peutVoirDonneesRestreintes);

        let etatImage = '';

        switch (attributs['Activité']) {
            case 'actif':
                etatImage = IMG_ACTIF;
                break;
            case 'inactif_3_jours':
                etatImage = IMG_INACTIF_3;
                break;
            case 'inactif_10_jours':
                etatImage = IMG_INACTIF_10;
                break;
            case 'vacances':
                etatImage = IMG_VACANCES;
                break;
            case 'banni':
                etatImage = IMG_BANNI;
                break;
            default:
                etatImage = '';
        }

        // Retourne 2 éléments séparés pour correspondre aux 2 colonnes du thead Fourmizzz :
        // colonne "État" (statut d'activité) + colonne "" (icône colonisé)
        return [etatImage, attributs['Colonisé'] ? IMG_COLONISE : ''];
    }
}
