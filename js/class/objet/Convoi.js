Utils.register(class Convoi extends ObjetForum {
    static VERSION_LOGIQUE = '1.0';

    static COLONNES_DEFAUT = ['Expéditeur', 'Destinataire', 'Nourriture', 'Matériaux', 'Date Arrivée'];

    static PARAMETRES_OBJET = [
        [
            NourritureEnvoyee,
            MateriauxEnvoyes,
            Ouvrieres,
            Destinataire,
            DateArrivee,
            DateDepart,
            Expediteur,
            IdCommande,
            IdConvoi
        ]
    ];

    static LOCATION_HISTORY = [{ section: 'Commandes Outiiil', lieu: 'message', visibilite: 'caché' }];

    async estDestinataire() {
        return await this.lire('Destinataire') == await monProfilJoueur.lire('Pseudo')
    }
    /**
    *
    */
    async estTermine() {
        return moment(await this.lire('Date Arrivée')).diff(moment()) < 0;
    }

    /**
     * Vérifie si le convoi est encore annulable (moins de 2 minutes depuis le départ).
     * @param {string|Moment} momentReferent - Le moment du clic d'annulation
     * @returns {Promise<boolean>}
     */
    async estAnnulable(momentReferent) {
        const dateDepart = await this.lire('Date Départ');
        const diffSeconds = moment(momentReferent).diff(moment(dateDepart), 'seconds');
        return diffSeconds <= 120;
    }

})