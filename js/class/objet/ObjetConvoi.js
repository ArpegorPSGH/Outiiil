Utils.register(class Convoi extends ObjetForum {
    static VERSION_LOGIQUE = '1.0';

    static COLONNES_DEFAUT = ['Expéditeur', 'Destinataire', 'Nourriture', 'Matériaux', 'Date Arrivée'];

    static CLASSES_PARAMETRES = [[
        ParametreConvoiNourriture,
        ParametreConvoiMateriaux,
        ParametreConvoiOuvrieres,
        ParametreConvoiDestinataire,
        ParametreConvoiDateArrivee,
        ParametreConvoiExpediteur,
        ParametreConvoiIdCommande,
        ParametreConvoiIdAnnulation
    ]];

    static LOCATION_HISTORY = [{ section: 'Commandes Outiiil', lieu: 'message' }];

    /**
    *
    */
    get id() {
        return this.lireParametre('Id');
    }
    /**
    *
    */
    set id(newId) {
        this.ecrireParametre('Id', newId);
    }
    /**
    *
    */
    get expediteur() {
        return this.lireParametre('Expéditeur');
    }
    /**
    *
    */
    set expediteur(newExpediteur) {
        this.ecrireParametre('Expéditeur', newExpediteur);
    }
    /**
    *
    */
    get destinataire() {
        return this.lireParametre('Destinataire');
    }
    /**
    *
    */
    set destinataire(newDestinataire) {
        this.ecrireParametre('Destinataire', newDestinataire);
    }
    /**
    *
    */
    get nourriture() {
        return this.lireParametre('Nourriture');
    }
    /**
    *
    */
    set nourriture(newNourriture) {
        this.ecrireParametre('Nourriture', newNourriture);
    }
    /**
    *
    */
    get materiaux() {
        return this.lireParametre('Matériaux');
    }
    /**
    *
    */
    set materiaux(newMateriaux) {
        this.ecrireParametre('Matériaux', newMateriaux);
    }
    /**
    *
    */
    get idCommande() {
        return this.lireParametre('Id Commande');
    }
    /**
    *
    */
    set idCommande(newIdCommande) {
        this.ecrireParametre('Id Commande', newIdCommande);
    }
    /**
    *
    */
    get dateArrivee() {
        return this.lireParametre('Date Arrivée');
    }
    /**
    *
    */
    set dateArrivee(newArrivee) {
        this.ecrireParametre('Date Arrivée', newArrivee);
    }
    /**
    *
    */
    get datePost() {
        return this._datePost;
    }
    /**
    *
    */
    set datePost(newDatePost) {
        this._datePost = newDatePost;
    }
    /**
    *
    */
    get idAnnulation() {
        return this.lireParametre('Id Annulation');
    }
    /**
    *
    */
    set idAnnulation(newIdAnnulation) {
        this.ecrireParametre('Id Annulation', newIdAnnulation);
    }
    /**
    *
    */
    get ouvrieres() {
        return this.lireParametre('Ouvrières');
    }
    /**
    *
    */
    set ouvrieres(newOuvrieres) {
        this.ecrireParametre('Ouvrières', newOuvrieres);
    }

    async estDestinataire() {
        return await this.lireParametre('Destinataire') == await monProfilJoueur.lireParametre('Pseudo')
    }
    /**
    *
    */
    async estTermine() {
        return moment(await this.lireParametre('Date Arrivée')).diff(moment()) < 0;
    }
    /**
    *
    */
    async toHTML(id) {
        // Si le convoi m'est destiné et que le datetime d'arrivée n'est pas dépassé
        let tempsRestant = moment(await this.lireParametre('Date Arrivée')).diff(moment()) / 1000;
        $(id).after(`<strong>- Vous allez recevoir ${numeral(await this.lireParametre('Nourriture')).format()} ${IMG_POMME} et ${numeral(await this.lireParametre('Matériaux')).format()} ${IMG_MAT} de <a href="Membre.php?Pseudo=${await this.lireParametre('Expéditeur')}">${await this.lireParametre('Expéditeur')}</a> dans <span id='convoi_${this._id}'>${Utils.intToTime(tempsRestant)}</span></strong> - <small>Retour le ${Utils.roundMinute(await this.lireParametre('Date Arrivée')).format("D MMM YYYY à HH[h]mm")}</small><br/>`);
        Utils.decreaseTime(moment(await this.lireParametre('Date Arrivée')).diff(moment()) / 1000, "convoi_" + await this.lireParametre('Id Annulation'));
        return this;
    }

})