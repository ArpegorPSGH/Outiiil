Utils.register(class Commande extends ObjetForum {
    static VERSION_LOGIQUE = '1.0';

    static COLONNES_DEFAUT = ['Demandeur', 'Date Commande', 'Évolution', 'Nourriture Demandée', 'Matériaux Demandés', 'Nourriture Restante', 'Matériaux Restants', 'Date Souhaitée', 'Statut', 'État', 'Temps de trajet', 'Livrer', 'Options'];

    static CLASSES_PARAMETRES = [[
        ParametreCommandeEtat,
        ParametreCommandeDemandeur,
        ParametreCommandeEvolution,
        ParametreCommandeMateriauxDemandes,
        ParametreCommandeMateriauxLivres,
        ParametreCommandeNourritureDemandee,
        ParametreCommandeNourritureLivree,
        ParametreCommandeDateSouhaite,
        ParametreCommandeDateApres,
        ParametreCommandeDateCommande
    ]];

    static LOCATION_HISTORY = [{ section: 'Commandes Outiiil', lieu: 'titre' }];

    static classeObjetsForumContenus = Convoi;

    static ATTRIBUTS_OBJET = [
        AttributCommandeNourritureRestante,
        AttributCommandeMateriauxRestants,
        AttributCommandeStatut,
        AttributCommandeTempsParcours,
        AttributCommandeBoutonLivrer,
        AttributCommandeOptions
    ];
    /**
   *
   */
    get id() {
        return this.idSujet;
    }
    /**
    *
    */
    get dateCommande() {
        return this.lireParametre('Date Commande');
    }
    /**
    *
    */
    set dateCommande(newDate) {
        this.ecrireParametre('Date Commande', newDate);
    }
    /**
    *
    */
    get dateSouhaite() {
        return this.lireParametre('Date Souhaitée');
    }
    /**
    *
    */
    set dateSouhaite(newDate) {
        this.ecrireParametre('Date Souhaitée', newDate);
    }
    /**
    *
    */
    get dateApres() {
        return this.lireParametre('Date Après');
    }
    /**
    *
    */
    set dateApres(newDate) {
        this.ecrireParametre('Date Après', newDate);
    }
    /**
    *
    */
    get demandeur() {
        return this.lireParametre('Demandeur');
    }
    /**
    *
    */
    set demandeur(newJoueur) {
        this.ecrireParametre('Demandeur', newJoueur);
    }
    /**
    *
    */
    get evolution() {
        return this.lireParametre('Évolution');
    }
    /**
    *
    */
    set evolution(newEvo) {
        this.ecrireParametre('Évolution', newEvo);
    }
    /**
     * Quantité totale de nourriture demandée
     */
    get nourritureDemandee() {
        return this.lireParametre('Nourriture Demandée');
    }
    /**
     *
     */
    set nourritureDemandee(newTotal) {
        this.ecrireParametre('Nourriture Demandée', newTotal);
    }
    /**
     * Quantité totale de materiaux demandés
     */
    get materiauxDemandes() {
        return this.lireParametre('Matériaux Demandés');
    }
    /**
     *
     */
    set materiauxDemandes(newTotal) {
        this.ecrireParametre('Matériaux Demandés', newTotal);
    }
    /**
     * Quantité de nourriture déjà livrée
     */
    get nourritureLivree() {
        return this.lireParametre('Nourriture Livrée');
    }
    /**
     *
     */
    set nourritureLivree(newLivree) {
        this.ecrireParametre('Nourriture Livrée', newLivree);
    }
    /**
     * Quantité de materiaux déjà livrée
     */
    get materiauxLivres() {
        return this.lireParametre('Matériaux Livrés');
    }
    /**
     *
     */
    set materiauxLivres(newLivres) {
        this.ecrireParametre('Matériaux Livrés', newLivres);
    }
    /**
     *
     */
    get nourritureRestante() {
        return this.lireAttribut('Nourriture Restante');
    }
    /**
     *
     */
    set nourritureRestante(newRestante) {
        this.ecrireAttribut('Nourriture Restante', newRestante);
    }
    /**
     *
     */
    get materiauxRestants() {
        return this.lireAttribut('Matériaux Restants');
    }
    /**
     *
     */
    set materiauxRestants(newRestants) {
        this.ecrireAttribut('Matériaux Restants', newRestants);
    }
    /**
     *
     */
    get etat() {
        return this.lireParametre('État');
    }
    /**
    *
    */
    set etat(newEtat) {
        this.ecrireParametre('État', newEtat);
    }
    /**
    *
    */
    get dernierMiseAJour() {
        return this._dernierMiseAJour;
    }
    /**
    *
    */
    set dernierMiseAJour(newDernier) {
        this._dernierMiseAJour = newDernier;
    }

    /**
     *
     */
    async estEnRetard() {
        return moment().diff(moment(await this.lireParametre('Date Souhaitée')), "days") > 0;
    }
    /**
    *
    */
    async getAttente() {
        return moment().diff(moment(await this.lireParametre('Date Souhaitée')), "days");
    }
    /**
    *
    */
    async estTermine() {
        const params = await this.lireChaqueParametre(['Nourriture', 'Matériaux']);
        return !params['Nourriture'] && !params['Matériaux'];
    }
    /**
    *
    */
    estTermineRecent() {
        return this._derniereMiseAJour.isAfter(moment().subtract(1, 'days'));
    }
    /**
    *
    */
    async estAFaire() {
        const params = await this.lireChaqueParametre(['État', 'Demandeur']);
        return !(params['État'] == ETAT_COMMANDE["Supprimée"] || params['État'] == ETAT_COMMANDE["Annulée"] || params['État'] == ETAT_COMMANDE["Terminée"] || (params['État'] == ETAT_COMMANDE["Nouvelle"] && params['Demandeur'] != await monProfilJoueur.lireParametre('Pseudo')));
    }
    /**
    *
    */
    async estValide() {
        const params = await this.lireChaqueParametre(['Nourriture Demandée', 'Matériaux Demandés', 'Nourriture Livrée', 'Matériaux Livrés', 'Date Souhaitée', 'Date Après']);
        console.log('NourritureDemandee:', params['Nourriture Demandée'], 'DateSouhaite:', params['Date Souhaitée'], 'DateApres:', params['Date Après'])
        if (params['Nourriture Demandée'] <= 0 && params['Matériaux Demandés'] <= 0)
            return "La quantité totale de nourriture ou de matériaux demandée doit être supérieure à zéro.";
        if (params['Nourriture Demandée'] < 0)
            return "Quantité totale de nourriture demandée incorrecte.";
        if (params['Matériaux Demandés'] < 0)
            return "Quantité totale de materiaux demandés incorrecte.";
        if (params['Nourriture Livrée'] < 0 || params['Nourriture Livrée'] > params['Nourriture Demandée'])
            return "Quantité de nourriture livrée incorrecte.";
        if (params['Matériaux Livrés'] < 0 || params['Matériaux Livrés'] > params['Matériaux Demandés'])
            return "Quantité de materiaux livrés incorrecte.";
        if (!params['Date Souhaitée'].isValid())
            return "Date de la demande invalide.";
        if (params['Date Après'] && !moment(params['Date Après'], "YYYY-MM-DD").isValid())
            return "Date de commencement livraison invalide.";
        return "";
    }
    /**
    *
    */
    async ajouteConvoi(convoi) {
        const params = await this.lireChaqueParametre(['Nourriture Livrée', 'Nourriture Demandée', 'Matériaux Livrés', 'Matériaux Demandés', 'État']);
        const convoiParams = await convoi.lireChaqueParametre(['Nourriture', 'Matériaux']);
        console.log(`[Commande][ajouteConvoi] Début de l'ajout du convoi à la commande ${this.idSujet}.`);
        console.log(`[Commande][ajouteConvoi] Convoi à ajouter: Nourriture=${convoiParams['Nourriture']}, Matériaux=${convoiParams['Matériaux']}`);

        console.log(`[Commande][ajouteConvoi] Début de l'ajout du convoi à la commande ${this.idSujet}.`);
        console.log(`[Commande][ajouteConvoi] Convoi à ajouter: Nourriture=${convoiParams['Nourriture']}, Matériaux=${convoiParams['Matériaux']}`);
        console.log(`[Commande][ajouteConvoi] État actuel de la commande: Nourriture livrée=${params['Nourriture Livrée']}, Matériaux livrés = ${params['Matériaux Livrés']} `);
        console.log(`[Commande][ajouteConvoi] Quantités demandées: Nourriture = ${params['Nourriture Demandée']}, Matériaux = ${params['Matériaux Demandés']} `);

        // on ajoute la nourriture livrée
        params['Nourriture Livrée'] += convoiParams['Nourriture'];
        console.log(`[Commande][ajouteConvoi] Nourriture livrée après ajout: ${params['Nourriture Livrée']} `);
        if (params['Nourriture Livrée'] > params['Nourriture Demandée']) {
            console.log(`[Commande][ajouteConvoi] Nourriture livrée(${params['Nourriture Livrée']}) dépasse la demande(${params['Nourriture Demandée']}).Ajustement.`);
            params['Nourriture Livrée'] = params['Nourriture Demandée'];
        }
        // on ajoute les materiaux livrés
        params['Matériaux Livrés'] += convoiParams['Matériaux'];
        console.log(`[Commande][ajouteConvoi] Matériaux livrés après ajout: ${params['Matériaux Livrés']} `);
        if (params['Matériaux Livrés'] > params['Matériaux Demandés']) {
            console.log(`[Commande][ajouteConvoi] Matériaux livrés(${params['Matériaux Livrés']}) dépasse la demande(${params['Matériaux Demandés']}).Ajustement.`);
            params['Matériaux Livrés'] = params['Matériaux Demandés'];
        }

        const nouveauxParametres = {
            'Nourriture Livrée': params['Nourriture Livrée'],
            'Matériaux Livrés': params['Matériaux Livrés']
        };

        // on met a jour le statut si tout est livré
        if (params['Nourriture Livrée'] === params['Nourriture Demandée'] && params['Matériaux Livrés'] === params['Matériaux Demandés']) {
            console.log(`[Commande][ajouteConvoi] Toutes les ressources ont été livrées. Changement de l'état de la commande à "Terminée".`);
            params['État'] = ETAT_COMMANDE.Terminée;
            nouveauxParametres['État'] = params['État'];
        } else {
            console.log(`[Commande][ajouteConvoi] Ressources restantes: Nourriture=${params['Nourriture Demandée'] - params['Nourriture Livrée']}, Matériaux = ${params['Matériaux Demandés'] - params['Matériaux Livrés']}. L'état de la commande reste inchangé.`);
        }

        await this.ecrireChaqueParametre(nouveauxParametres);

        // Ajout du convoi aux objets contenus
        convoi.objetParent = this;
        this.objetsForumContenus.push(convoi);

        console.log(`[Commande][ajouteConvoi] Fin de l'ajout du convoi. Nouvel état de la commande: Nourriture livrée=${params['Nourriture Livrée']}, Matériaux livrés = ${params['Matériaux Livrés']}, État = ${params['État']}`);
        return this;
    }

    /**
     * Annule un convoi en créant un convoi négatif.
     * @param {string} idAnnulation - L'ID d'annulation du convoi à annuler
     * @returns {Promise<{success: boolean, message: string}>} Résultat de l'opération
     */
    async annulerConvoi(idAnnulation) {
        console.log(`[Commande][annulerConvoi] Recherche du convoi avec ID d'annulation: ${idAnnulation}`);

        // Rechercher le convoi avec cet ID d'annulation dans les convois de cette commande
        let convoiTrouve = null;
        for (const convoi of this.objetsForumContenus) {
            const idAnnulationConvoi = await convoi.lireParametre('Id Annulation');
            console.log(`[Commande][annulerConvoi] ID annulation trouvé: ${idAnnulationConvoi} ${idAnnulationConvoi === idAnnulation}`);
            console.log('types', typeof idAnnulationConvoi, typeof idAnnulation);
            if (idAnnulationConvoi === idAnnulation) {
                convoiTrouve = convoi;
                break;
            }
        }

        if (!convoiTrouve) {
            console.log(`[Commande][annulerConvoi] Aucun convoi trouvé avec l'ID d'annulation ${idAnnulation}`);
            return {
                success: false,
                message: "Convoi non trouvé dans cette commande."
            };
        }

        console.log(`[Commande][annulerConvoi] Convoi trouvé, création du convoi négatif`);

        // Récupérer les paramètres du convoi à annuler
        const convoiParams = await convoiTrouve.lireChaqueParametre([
            'Expéditeur',
            'Destinataire',
            'Nourriture',
            'Matériaux',
            'Date Arrivée',
            'Id Commande',
            'Ouvrières'
        ]);

        // Créer un convoi négatif
        const convoiNegatif = new Convoi(this.fonctionnaliteCreatrice, {
            donneesInitiales: {
                'Expéditeur': convoiParams['Expéditeur'],
                'Destinataire': convoiParams['Destinataire'],
                'Nourriture': - convoiParams['Nourriture'],
                'Matériaux': - convoiParams['Matériaux'],
                'Date Arrivée': convoiParams['Date Arrivée'],
                'Id Commande': convoiParams['Id Commande'],
                'Id Annulation': idAnnulation,
                'Ouvrières': convoiParams['Ouvrières']
            }
        });

        // Ajouter le convoi négatif à la commande
        await this.ajouteConvoi(convoiNegatif);

        // Vérifier si l'état doit être modifié
        const params = await this.lireChaqueParametre(['État', 'Nourriture Livrée', 'Matériaux Livrés', 'Nourriture Demandée', 'Matériaux Demandés']);

        if (params['État'] === ETAT_COMMANDE.Terminée) {
            if (params['Nourriture Livrée'] < params['Nourriture Demandée'] || params['Matériaux Livrés'] < params['Matériaux Demandés']) {
                console.log(`[Commande][annulerConvoi] La commande n'est plus terminée, passage à "En cours"`);
                await this.ecrireParametre('État', ETAT_COMMANDE["En cours"]);
            }
        }

        console.log(`[Commande][annulerConvoi] Annulation du convoi terminée avec succès`);
        return {
            success: true,
            message: "Convoi annulé avec succès."
        };
    }
})