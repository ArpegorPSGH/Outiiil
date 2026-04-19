Utils.register(class Convoi extends ObjetForum {
    static VERSION_LOGIQUE = '1.0';

    static COLONNES_DEFAUT = ['Expéditeur', 'Destinataire', 'Nourriture', 'Matériaux', 'Date Arrivée'];

    static PARAMETRES_OBJET = [[
        NourritureEnvoyee,
        MateriauxEnvoyes,
        Ouvrieres,
        Destinataire,
        DateArrivee,
        Expediteur,
        IdCommande,
        IdAnnulation
    ]];

    static LOCATION_HISTORY = [{ section: 'Commandes Outiiil', lieu: 'message' }];

    // /**
    // *
    // */
    // get id() {
    //     return this.lire('Id');
    // }
    // /**
    // *
    // */
    // set id(newId) {
    //     this.ecrire('Id', newId);
    // }
    // /**
    // *
    // */
    // get expediteur() {
    //     return this.lire('Expéditeur');
    // }
    // /**
    // *
    // */
    // set expediteur(newExpediteur) {
    //     this.ecrire('Expéditeur', newExpediteur);
    // }
    // /**
    // *
    // */
    // get destinataire() {
    //     return this.lire('Destinataire');
    // }
    // /**
    // *
    // */
    // set destinataire(newDestinataire) {
    //     this.ecrire('Destinataire', newDestinataire);
    // }
    // /**
    // *
    // */
    // get nourriture() {
    //     return this.lire('Nourriture');
    // }
    // /**
    // *
    // */
    // set nourriture(newNourriture) {
    //     this.ecrire('Nourriture', newNourriture);
    // }
    // /**
    // *
    // */
    // get materiaux() {
    //     return this.lire('Matériaux');
    // }
    // /**
    // *
    // */
    // set materiaux(newMateriaux) {
    //     this.ecrire('Matériaux', newMateriaux);
    // }
    // /**
    // *
    // */
    // get idCommande() {
    //     return this.lire('Id Commande');
    // }
    // /**
    // *
    // */
    // set idCommande(newIdCommande) {
    //     this.ecrire('Id Commande', newIdCommande);
    // }
    // /**
    // *
    // */
    // get dateArrivee() {
    //     return this.lire('Date Arrivée');
    // }
    // /**
    // *
    // */
    // set dateArrivee(newArrivee) {
    //     this.ecrire('Date Arrivée', newArrivee);
    // }
    // /**
    // *
    // */
    // get datePost() {
    //     return this._datePost;
    // }
    // /**
    // *
    // */
    // set datePost(newDatePost) {
    //     this._datePost = newDatePost;
    // }
    // /**
    // *
    // */
    // get idAnnulation() {
    //     return this.lire('Id Annulation');
    // }
    // /**
    // *
    // */
    // set idAnnulation(newIdAnnulation) {
    //     this.ecrire('Id Annulation', newIdAnnulation);
    // }
    // /**
    // *
    // */
    // get ouvrieres() {
    //     return this.lire('Ouvrières');
    // }
    // /**
    // *
    // */
    // set ouvrieres(newOuvrieres) {
    //     this.ecrire('Ouvrières', newOuvrieres);
    // }

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
    *
    */
    // async toHTML(id) {
    //     // Si le convoi m'est destiné et que le datetime d'arrivée n'est pas dépassé
    //     let tempsRestant = moment(await this.lire('Date Arrivée')).diff(moment()) / 1000;
    //     $(id).after(`<strong>- Vous allez recevoir ${numeral(await this.lire('Nourriture')).format()} ${IMG_POMME} et ${numeral(await this.lire('Matériaux')).format()} ${IMG_MAT} de <a href="Membre.php?Pseudo=${await this.lire('Expéditeur')}">${await this.lire('Expéditeur')}</a> dans <span id='convoi_${this._id}'>${Utils.intToTime(tempsRestant)}</span></strong> - <small>Retour le ${Utils.roundMinute(await this.lire('Date Arrivée')).format("D MMM YYYY à HH[h]mm")}</small><br/>`);
    //     Utils.decreaseTime(moment(await this.lire('Date Arrivée')).diff(moment()) / 1000, "convoi_" + await this.lire('Id Annulation'));
    //     return this;
    // }

})