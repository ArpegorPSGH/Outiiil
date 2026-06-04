Utils.register(class Commande extends ObjetForum {
    static VERSION_LOGIQUE = '1.0';

    static COLONNES_DEFAUT = ['Demandeur', 'Date Commande', 'Évolution', 'Nourriture Demandée', 'Matériaux Demandés', 'Nourriture Restante', 'Matériaux Restants', 'Date Souhaitée', 'Statut', 'État', 'Temps de trajet', 'Livrer', 'Options'];

    static PARAMETRES_OBJET = [[
        EtatCommande,
        Demandeur,
        Evolution,
        MateriauxDemandes,
        MateriauxLivres,
        NourritureDemandee,
        NourritureLivree,
        DateSouhaite,
        DateApres,
        DateCommande
    ]];

    static LOCATION_HISTORY = [{ section: 'Commandes Outiiil', lieu: 'titre' }];

    static classeObjetsForumContenus = Convoi;

    static ATTRIBUTS_OBJET = [
        NourritureRestante,
        MateriauxRestants,
        Statut,
        TempsParcours,
        BoutonLivrer,
        Options
    ];
    //     /**
    //    *
    //    */
    //     get id() {
    //         return this.idSujet;
    //     }
    //     /**
    //     *
    //     */
    //     get dateCommande() {
    //         return this.lire('Date Commande');
    //     }
    //     /**
    //     *
    //     */
    //     set dateCommande(newDate) {
    //         this.ecrire('Date Commande', newDate);
    //     }
    //     /**
    //     *
    //     */
    //     get dateSouhaite() {
    //         return this.lire('Date Souhaitée');
    //     }
    //     /**
    //     *
    //     */
    //     set dateSouhaite(newDate) {
    //         this.ecrire('Date Souhaitée', newDate);
    //     }
    //     /**
    //     *
    //     */
    //     get dateApres() {
    //         return this.lire('Date Après');
    //     }
    //     /**
    //     *
    //     */
    //     set dateApres(newDate) {
    //         this.ecrire('Date Après', newDate);
    //     }
    //     /**
    //     *
    //     */
    //     get demandeur() {
    //         return this.lire('Demandeur');
    //     }
    //     /**
    //     *
    //     */
    //     set demandeur(newJoueur) {
    //         this.ecrire('Demandeur', newJoueur);
    //     }
    //     /**
    //     *
    //     */
    //     get evolution() {
    //         return this.lire('Évolution');
    //     }
    //     /**
    //     *
    //     */
    //     set evolution(newEvo) {
    //         this.ecrire('Évolution', newEvo);
    //     }
    //     /**
    //      * Quantité totale de nourriture demandée
    //      */
    //     get nourritureDemandee() {
    //         return this.lire('Nourriture Demandée');
    //     }
    //     /**
    //      *
    //      */
    //     set nourritureDemandee(newTotal) {
    //         this.ecrire('Nourriture Demandée', newTotal);
    //     }
    //     /**
    //      * Quantité totale de materiaux demandés
    //      */
    //     get materiauxDemandes() {
    //         return this.lire('Matériaux Demandés');
    //     }
    //     /**
    //      *
    //      */
    //     set materiauxDemandes(newTotal) {
    //         this.ecrire('Matériaux Demandés', newTotal);
    //     }
    //     /**
    //      * Quantité de nourriture déjà livrée
    //      */
    //     get nourritureLivree() {
    //         return this.lire('Nourriture Livrée');
    //     }
    //     /**
    //      *
    //      */
    //     set nourritureLivree(newLivree) {
    //         this.ecrire('Nourriture Livrée', newLivree);
    //     }
    //     /**
    //      * Quantité de materiaux déjà livrée
    //      */
    //     get materiauxLivres() {
    //         return this.lire('Matériaux Livrés');
    //     }
    //     /**
    //      *
    //      */
    //     set materiauxLivres(newLivres) {
    //         this.ecrire('Matériaux Livrés', newLivres);
    //     }
    //     /**
    //      *
    //      */
    //     get nourritureRestante() {
    //         return this.lire('Nourriture Restante');
    //     }
    //     /**
    //      *
    //      */
    //     set nourritureRestante(newRestante) {
    //         this.ecrire('Nourriture Restante', newRestante);
    //     }
    //     /**
    //      *
    //      */
    //     get materiauxRestants() {
    //         return this.lire('Matériaux Restants');
    //     }
    //     /**
    //      *
    //      */
    //     set materiauxRestants(newRestants) {
    //         this.ecrire('Matériaux Restants', newRestants);
    //     }
    //     /**
    //      *
    //      */
    //     get etat() {
    //         return this.lire('État');
    //     }
    //     /**
    //     *
    //     */
    //     set etat(newEtat) {
    //         this.ecrire('État', newEtat);
    //     }
    //     /**
    //     *
    //     */
    //     get dernierMiseAJour() {
    //         return this._dernierMiseAJour;
    //     }
    //     /**
    //     *
    //     */
    //     set dernierMiseAJour(newDernier) {
    //         this._dernierMiseAJour = newDernier;
    //     }

    /**
     *
     */
    async estEnRetard() {
        return moment().diff(moment(await this.lire('Date Souhaitée')), "days") > 0;
    }
    /**
    *
    */
    async getAttente() {
        return moment().diff(moment(await this.lire('Date Souhaitée')), "days");
    }
    /**
    *
    */
    async estTermine() {
        const params = await this.lire(['Nourriture', 'Matériaux']);
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
        const params = await this.lire(['État', 'Demandeur']);
        return !(params['État'] == ETAT_COMMANDE["Supprimée"] || params['État'] == ETAT_COMMANDE["Annulée"] || params['État'] == ETAT_COMMANDE["Terminée"] || (params['État'] == ETAT_COMMANDE["Nouvelle"] && params['Demandeur'] != await monProfilJoueur.lire('Pseudo')));
    }
    /**
    *
    */
    async estValide() {
        const params = await this.lire(['Nourriture Demandée', 'Matériaux Demandés', 'Nourriture Livrée', 'Matériaux Livrés', 'Date Souhaitée', 'Date Après']);
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
    async ajouterConvoi(convoi) {
        const params = await this.lire(['Nourriture Livrée', 'Nourriture Demandée', 'Matériaux Livrés', 'Matériaux Demandés', 'État']);
        const convoiParams = await convoi.lire(['Nourriture', 'Matériaux']);
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

        await this.ecrire(nouveauxParametres);

        // Ajout du convoi aux objets contenus
        convoi.objetParent = this;
        this.objetsForumContenus.push(convoi);

        await this.enregistrerSurForum();

        console.log(`[Commande][ajouteConvoi] Fin de l'ajout du convoi. Nouvel état de la commande: Nourriture livrée=${params['Nourriture Livrée']}, Matériaux livrés = ${params['Matériaux Livrés']}, État = ${params['État']}`);
        return this;
    }

    /**
     * Annule un convoi en créant un convoi négatif si possible.
     * @param {number} idAnnulation - L'ID d'annulation du convoi à annuler
     * @returns {Promise<{trouve: boolean, modifie: boolean}>} Résultat du traitement
     */
    async annulerConvoi(idAnnulation, timestampClic) {
        // Rechercher le convoi avec cet ID d'annulation dans les convois de cette commande
        let convoiTrouve = null;
        for (const convoi of this.objetsForumContenus) {
            const idAnnulationConvoi = await convoi.lire('Id Annulation');
            if (idAnnulationConvoi === idAnnulation) {
                convoiTrouve = convoi;
                break;
            }
        }

        if (!convoiTrouve) {
            return { trouve: false };
        }

        if (await convoiTrouve.estTermine()) {
            $.toast({ ...TOAST_INFO, text: "Convoi déjà arrivé : annulation ignorée sur le forum." });
            return { trouve: true, modifie: false };
        }

        if (!(await convoiTrouve.estAnnulable(timestampClic))) {
            $.toast({ ...TOAST_INFO, text: "Délai d'annulation de 2 minutes dépassé : annulation ignorée sur le forum." });
            return { trouve: true, modifie: false };
        }

        console.log(`[Commande][annulerConvoi] Convoi trouvé et annulable, suppression du message et mise à jour des totaux.`);

        // Récupérer les paramètres du convoi et de la commande pour la déduction
        const convoiParams = await convoiTrouve.lire(['Nourriture', 'Matériaux']);
        const commandParams = await this.lire(['Nourriture Livrée', 'Matériaux Livrés', 'État']);

        // Mettre à jour les totaux (déduction des ressources du convoi annulé)
        const nouveauxParams = {
            'Nourriture Livrée': Math.max(0, commandParams['Nourriture Livrée'] - convoiParams['Nourriture']),
            'Matériaux Livrés': Math.max(0, commandParams['Matériaux Livrés'] - convoiParams['Matériaux'])
        };

        let resurrection = false;
        // Si la commande était terminée, elle repasse en cours puisque des ressources ont été "retirées"
        if (commandParams['État'] === ETAT_COMMANDE.Terminée) {
            nouveauxParams['État'] = ETAT_COMMANDE["En cours"];
            resurrection = true;
        }

        await this.ecrire(nouveauxParams);

        await convoiTrouve.supprimer();

        // Sauvegarde de la commande sur le forum (mise à jour des totaux dans le titre/sujet)
        await this.enregistrerSurForum();

        $.toast({ ...TOAST_SUCCESS, text: "Annulation de convoi enregistrée sur le forum (message supprimé)." });
        return { trouve: true, modifie: true, resurrection: resurrection };
    }
})