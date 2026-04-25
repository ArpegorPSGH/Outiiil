/**
 * GererCommandes.js
 * Fonctionnalité d'alliance pour la gestion des commandes de ressources.
 */
Utils.register(class GererCommandes extends FonctionnaliteAlliance {
    static ABREVIATIONS_HISTORY = ['GC'];

    /** @type {Array<Commande>} */
    commandes = [];

    /**
     * Point d'entrée principal de la fonctionnalité.
     */
    async run() {
        // Charger toutes les commandes via le framework
        console.log('Chargement des commandes')
        this.commandes = await this.chargerObjetsForum(Commande, true);
        console.log('commandes', this.commandes)

        // Activer la prochaine commande si besoin
        await this._activerProchaineCommandeSiBesoin();

        // Afficher le tableau des commandes
        await this.afficherTableauCommandes();
        console.log('tableau commandes affiché')

        // Gérer le traitement des convois après rechargement
        await this._traiterConvoiApresEnvoiJeu();
        await this._traiterAnnulationConvoiApresRechargement();

        // Attacher les listeners pour l'annulation de convoi
        this._attacherListenersAnnulationConvoi();

        // Configurer le formulaire de convoi
        this.formulaireConvoi();
    }

    /**
     * Affiche le tableau des commandes.
     */
    async afficherTableauCommandes() {
        if ($("#o_tableListeCommande").length === 0) {
            const en_tete_html = await Commande.afficherEntete();
            const nbColonnes = Commande.COLONNES_DEFAUT.length;

            let contenu = `<div id="o_listeCommande" class="simulateur centre o_marginT15"><h2>Commandes</h2><table id='o_tableListeCommande' class="o_maxWidth" cellspacing=0>
                <thead class="ligne_paire">${en_tete_html}</thead>
                <tfoot><tr class='gras'><td colspan='${nbColonnes}' id='o_footerCommande'></td></tr></tfoot></table></div><br/>`;

            $("#centre .Bas").before(contenu);

            // Générer la configuration DataTables à partir des propriétés de l'objet Commande
            const proprietes = Commande.recupererProprietesAffichage();
            const columnDefs = Object.values(proprietes).map((prop, index) => {
                const def = { targets: index };
                def.visible = prop.visible;
                def.sortable = prop.sortable;
                def.type = prop.type;
                return def;
            });

            // Trouver l'index de la colonne d'échéance pour le tri par défaut
            const indexEcheance = Object.keys(proprietes).indexOf('Date Souhaitée');

            $("#o_tableListeCommande").DataTable({
                bPaginate: false,
                dom: "Bfrti",
                buttons: ["colvis", "copyHtml5", "csvHtml5", "excelHtml5"],
                order: [[indexEcheance, "desc"]],
                stripeClasses: ["", "ligne_paire"],
                language: {
                    zeroRecords: "Aucune commande trouvée"
                },
                columnDefs: columnDefs
            });

            $("#o_tableListeCommande_wrapper .dt-buttons").prepend(`<a id="o_ajouterCommande" class="dt-button" href="#"><span>Commander</span></a>`);
            $("#o_ajouterCommande").click(async (e) => {
                let boiteCommande = new BoiteCommande(new Commande(this), this.page);
                await boiteCommande.afficher();
            });

            // Délégation d'événements pour les boutons
            this._attacherEvenementsTableau();
        }

        await this.actualiserCommandes();
    }

    /**
     * Attache les événements aux boutons du tableau.
     */
    _attacherEvenementsTableau() {
        // Bouton Livrer
        $("#o_tableListeCommande").on('click', "a[id^='o_commande']", async (e) => {
            e.preventDefault();
            const commandeId = $(e.currentTarget).attr('id').replace('o_commande', '');
            const commande = this.commandes.find(c => c.idSujet == commandeId);
            if (!commande) return false;

            const constructions = await monProfilJoueur.lire('Niveaux Constructions');
            const transportCapacity = Math.floor((Utils.ouvrieres - Utils.terrain) * (10 + (constructions[11] / 2)));
            const materiauxRestants = await commande.lire('Matériaux Restants');
            const nourritureRestante = await commande.lire('Nourriture Restante');

            let materialsToPrefill = Math.min(materiauxRestants, transportCapacity);
            let nourishmentToPrefill = Math.min(nourritureRestante, transportCapacity - materialsToPrefill);

            $("#input_nbMateriaux").val(numeral(materialsToPrefill).format());
            $("#nbMateriaux").val(materialsToPrefill);
            $("#input_nbNourriture").val(numeral(nourishmentToPrefill).format());
            $("#nbNourriture").val(nourishmentToPrefill);
            $("#pseudo_convoi").val(await commande.lire('Demandeur'));
            $("#o_idCommande").val(commande.idSujet);
            $("html").animate({ scrollTop: 0 }, 600);
            return false;
        });

        // Bouton Modifier
        $("#o_tableListeCommande").on('click', "a[id^='o_modifierCommande']", async (e) => {
            e.preventDefault();
            const commandeId = $(e.currentTarget).attr('id').replace('o_modifierCommande', '');
            const commande = this.commandes.find(c => c.idSujet == commandeId);
            if (!commande) return false;
            let boiteCommande = new BoiteCommande(commande, this.page);
            await boiteCommande.afficher();
            return false;
        });

        // Bouton Supprimer
        $("#o_tableListeCommande").on('click', "a[id^='o_supprimerCommande']", async (e) => {
            e.preventDefault();
            const commandeId = $(e.currentTarget).attr('id').replace('o_supprimerCommande', '');
            const commande = this.commandes.find(c => c.idSujet == commandeId);
            if (!commande) return false;

            if (confirm("Supprimer cette commande ?")) {
                await commande.ecrire('État', ETAT_COMMANDE.Supprimée);
                await commande.enregistrerSurForum();
                $.toast({ ...TOAST_INFO, text: "Commande supprimée avec succès." });
                await this.actualiserCommandes();
            }
            return false;
        });
    }

    /**
     * Actualise le tableau des commandes.
     */
    async actualiserCommandes() {
        let total = 0, totalRouge = 0;
        const tableRows = [];
        console.log("this.commandes", this.commandes);
        for (const commande of this.commandes) {
            if (!await commande.estAFaire()) continue;
            // Utiliser la fonction afficher de l'objet pour générer la ligne
            const corps_html = await commande.afficherCorps();
            console.log("corps_html", corps_html);
            tableRows.push(corps_html);

            const materiauxRestants = await commande.lire('Matériaux Restants');
            total += materiauxRestants;
            if (await commande.estEnRetard()) totalRouge += materiauxRestants;
        }

        // Optimisation : Utiliser l'API DataTables sans détruire/recréer la table
        if ($.fn.DataTable.isDataTable('#o_tableListeCommande')) {
            const table = $("#o_tableListeCommande").DataTable();

            // Effacer les données actuelles sans redessiner
            table.clear();

            if (tableRows.length > 0) {
                // Ajouter les nouvelles lignes via l'API pour qu'elles soient indexées et affichées
                table.rows.add($(tableRows.join('')));
            }

            // Redessiner la table avec les nouvelles données
            table.draw();
        } else {
            // Si la DataTable n'existe pas encore, juste mettre à jour le HTML
            const tbody = tableRows.join('');
            $("#o_tableListeCommande tbody").html(tbody);
        }
        console.log("tableRows", tableRows);
        $("#o_footerCommande").html(`${tableRows.length} commande(s) : ${numeral(total).format("0.00 a")} ~ <span class='red'>${numeral(totalRouge).format("0.00 a")}</span> en retard !`);
        $("#o_footerCommande").parent().toggleClass("ligne_paire", tableRows.length % 2 !== 0);
    }

    /**
     * Configure le formulaire de convoi.
     */
    formulaireConvoi() {
        $("input[name='convoi']").before("<input id='o_idCommande' type='hidden' value='-1' name='o_idCommande'/>")
            .after(` <button id='o_resetConvoi'>Effacer</button>`)
            .click(async (e) => {
                const idCommande = $("#o_idCommande").val();
                const convoiAPoster = new Convoi(this);
                const chargeOk = await convoiAPoster.chargerDepuisLocalStorage('outiiil_convoi_a_poster');

                if (idCommande != -1 && chargeOk) {
                    return true; // Second rechargement
                }

                const materiaux = numeral($("#nbMateriaux").val()).value();
                const nourriture = numeral($("#nbNourriture").val()).value();

                if (materiaux === 0 && nourriture === 0) {
                    $.toast({ ...TOAST_ERROR, text: "Impossible de lancer un convoi vide." });
                    e.preventDefault();
                    return false;
                }

                if (idCommande != -1) {
                    e.preventDefault();

                    const commande = this.commandes.find(c => c.idSujet == idCommande);
                    const destinataireConvoi = $("#pseudo_convoi").val();
                    const demandeur = await commande.lire('Demandeur');

                    if (commande && demandeur !== destinataireConvoi) {
                        $.toast({ ...TOAST_ERROR, text: `Le destinataire du convoi (${destinataireConvoi}) ne correspond pas au demandeur de la commande (${demandeur}).` });
                        return false;
                    }

                    const joueurs = await this.chargerObjetsForum(Joueur, false);
                    let joueurDemandeur = null;
                    for (const j of joueurs) {
                        const pseudo = await j.lire('Pseudo');
                        if (pseudo === demandeur) {
                            joueurDemandeur = j;
                            break;
                        }
                    }

                    // Calcul de la date d'arrivée prévue
                    let dateArriveeCalculee = moment();
                    if (joueurDemandeur) {
                        const tempsParcours = await monProfilJoueur.getTempsParcours2(joueurDemandeur);
                        console.warn('date actuelle', moment().format("D MMM YYYY à HH[h]mm"))
                        console.warn('tempsParcours', tempsParcours)
                        if (tempsParcours !== Infinity) {
                            dateArriveeCalculee = moment().add(tempsParcours, 's');
                        }
                    }
                    console.warn('dateArriveeCalculee', dateArriveeCalculee.format("D MMM YYYY à HH[h]mm"))
                    const monConvoi = new Convoi(this, {
                        donneesInitiales: {
                            'Expéditeur': await monProfilJoueur.lire('Pseudo'),
                            'Destinataire': destinataireConvoi,
                            'Matériaux': materiaux,
                            'Nourriture': nourriture,
                            'Id Commande': numeral(idCommande).value(),
                            'Date Départ': moment().toISOString(),
                            'Date Arrivée': dateArriveeCalculee.toISOString(),
                            'Ouvrières': numeral($("#nbOuvriere").val()).value()
                        }
                    });

                    await monConvoi.enregistrerLocalStorage('outiiil_convoi_a_poster');

                    window.location.href = "commerce.php";
                    return false;
                }
            });

        $("#o_resetConvoi").click((e) => {
            e.preventDefault();
            $("#pseudo_convoi, #input_nbNourriture, #input_nbMateriaux, #input_nbOuvriere, #o_idCommande").val("");
            return false;
        });
    }

    /**
     * Récupère les IDs d'annulation des convois affichés.
     */
    getConvoiAnnulationIds() {
        const ids = [];
        $("a[href*='commerce.php?annuler=']").each((i, elt) => {
            const match = $(elt).attr('href').match(/annuler=(\d+)/);
            if (match && match[1]) ids.push(match[1]);
        });
        return ids;
    }

    /**
     * Attache les listeners pour l'annulation de convoi.
     */
    _attacherListenersAnnulationConvoi() {
        $("a[href*='commerce.php?annuler=']").on('click', async (e) => {
            if (localStorage.getItem('outiiil_convoi_annulation_pending_id')) return;

            e.preventDefault();
            const match = $(e.currentTarget).attr('href').match(/annuler=(\d+)/);
            if (!match) {
                $.toast({ ...TOAST_ERROR, text: "Erreur: Impossible d'identifier le convoi à annuler." });
                return;
            }
            localStorage.setItem('outiiil_convoi_annulation_pending_id', match[1]);
            window.location.href = "commerce.php";
        });
    }

    /**
     * Traite le convoi après envoi au jeu.
     */
    async _traiterConvoiApresEnvoiJeu() {
        const convoiDataObj = new Convoi(this);
        const convoiCharge = await convoiDataObj.chargerDepuisLocalStorage('outiiil_convoi_a_poster');
        const idsAnnulationInitString = localStorage.getItem('outiiil_ids_annulation_apres_rechargement_initial');

        console.log('convoiDataObj', convoiDataObj)
        console.log('idsAnnulationInitString', idsAnnulationInitString)
        if (convoiCharge && !idsAnnulationInitString) {
            const donneesConvoi = await convoiDataObj.lire();
            console.log('donneesConvoi', donneesConvoi)

            $("#pseudo_convoi").val(donneesConvoi['Destinataire']);
            $("#input_nbNourriture").val(numeral(donneesConvoi['Nourriture']).format());
            $("#nbNourriture").val(donneesConvoi['Nourriture']);
            $("#input_nbMateriaux").val(numeral(donneesConvoi['Matériaux']).format());
            $("#nbMateriaux").val(donneesConvoi['Matériaux']);
            $("#input_nbOuvriere").val(numeral(donneesConvoi['Ouvrières']).format());
            $("#nbOuvriere").val(donneesConvoi['Ouvrières']);
            $("#o_idCommande").val(donneesConvoi['Id Commande']);

            localStorage.setItem('outiiil_ids_annulation_apres_rechargement_initial', JSON.stringify(this.getConvoiAnnulationIds()));
            $("input[name='convoi']").click();
            return;
        } else if (convoiCharge && idsAnnulationInitString) {

            const idsAvant = JSON.parse(idsAnnulationInitString);
            const idsApres = this.getConvoiAnnulationIds();
            const nouvelId = idsApres.find(id => !idsAvant.includes(id));

            try {
                if (nouvelId) {
                    const idCommande = await convoiDataObj.lire('Id Commande');
                    const commande = this.commandes.find(c => c.idSujet == idCommande);
                    if (commande) {
                        await convoiDataObj.ecrire('Id Annulation', nouvelId);
                        await commande.ajouterConvoi(convoiDataObj);
                        console.log('commande', commande)
                        await commande.enregistrerSurForum();
                        $.toast({ ...TOAST_SUCCESS, text: "Commande mise à jour sur le forum." });

                        // Passer la prochaine commande en cours si nécessaire
                        await this._activerProchaineCommandeSiBesoin();

                        await this.actualiserCommandes();
                    }
                } else {
                    $.toast({ ...TOAST_INFO, text: "Aucun nouvel ID d'annulation détecté." });
                }
            } catch (error) {
                $.toast({ ...TOAST_ERROR, text: `Erreur: ${error.message || error}` });
                console.error(error);
            } finally {
                localStorage.removeItem('outiiil_convoi_a_poster');
                localStorage.removeItem('outiiil_ids_annulation_apres_rechargement_initial');
            }
        }
    }

    /**
     * Traite l'annulation de convoi après rechargement.
     */
    async _traiterAnnulationConvoiApresRechargement() {
        const idPending = localStorage.getItem('outiiil_convoi_annulation_pending_id');
        if (!idPending) return;

        const idsActuels = this.getConvoiAnnulationIds();

        if (idsActuels.includes(idPending)) {
            localStorage.setItem('outiiil_convoi_annulation_forwarded_id', idPending);
            $("a[href*='commerce.php?annuler=" + idPending + "']").get(0).click();
            return;
        }

        const idForwarded = localStorage.getItem('outiiil_convoi_annulation_forwarded_id');
        if (idForwarded === idPending) {
            try {
                // Essayer d'annuler le convoi dans chaque commande jusqu'à trouver la bonne
                let convoiAnnule = false;
                for (const commande of this.commandes) {
                    const resultat = await commande.annulerConvoi(numeral(idPending).value());

                    if (resultat.success) {
                        await commande.enregistrerSurForum();
                        $.toast({ ...TOAST_SUCCESS, text: "Annulation de convoi enregistrée sur le forum." });
                        await this.actualiserCommandes();
                        convoiAnnule = true;
                        break;
                    }
                }

                if (!convoiAnnule) {
                    $.toast({ ...TOAST_INFO, text: "Convoi non trouvé dans les commandes." });
                }
            } catch (error) {
                $.toast({ ...TOAST_ERROR, text: `Erreur: ${error.message || error}` });
            }
        } else {
            $.toast({ ...TOAST_INFO, text: "Le convoi a déjà été annulé ou n'est plus annulable." });
        }

        localStorage.removeItem('outiiil_convoi_annulation_pending_id');
        localStorage.removeItem('outiiil_convoi_annulation_forwarded_id');
    }

    /**
     * Active la prochaine commande "En attente" si aucune commande n'est actuellement "En cours".
     */
    async _activerProchaineCommandeSiBesoin() {
        let cmdSuivante = null;
        let foundActive = false;
        for (const cmd of this.commandes) {
            const etat = await cmd.lire('État');
            if (etat === ETAT_COMMANDE["En cours"]) {
                foundActive = true;
                break;
            }
            if (etat === ETAT_COMMANDE["En attente"] && (!cmdSuivante || cmd.idSujet < cmdSuivante.idSujet)) {
                cmdSuivante = cmd;
            }
        }

        if (!foundActive && cmdSuivante) {
            await cmdSuivante.ecrire('État', ETAT_COMMANDE["En cours"]);
            await cmdSuivante.enregistrerSurForum();
            $.toast({ ...TOAST_SUCCESS, text: "Nouvelle commande en cours." });
        }
    }
})
