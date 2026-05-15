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
            $("#o_ajouterCommande").onActionSecurisee('click', this, async (e) => {
                // On essaie de réutiliser une commande non encore enregistrée si elle existe
                let nouvelleCommande = this.commandes.find(c => !c.idSujet);
                if (!nouvelleCommande) {
                    nouvelleCommande = new Commande(this);
                    this.commandes.push(nouvelleCommande);
                }
                let boiteCommande = new BoiteCommande(nouvelleCommande, this.page);
                await boiteCommande.afficher();
            });

        }

        await this.actualiserCommandes();
    }



    /**
     * Actualise le tableau des commandes.
     */
    async actualiserCommandes() {
        let total = 0, totalRouge = 0;
        const tableRows = [];
        const estRestreint = !await this.verifierDroit('N');
        const monPseudo = await monProfilJoueur.lire('Pseudo');
        let auMoinsUneCommandeEtrangere = false;

        console.log("this.commandes", this.commandes);
        for (const commande of this.commandes) {
            if (!await commande.estAFaire()) continue;

            if (await commande.lire('Demandeur') !== monPseudo) {
                auMoinsUneCommandeEtrangere = true;
            }

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
                // On regroupe les éléments DOM dans un seul objet jQuery pour DataTables
                table.rows.add($(tableRows.map($tr => $tr[0])));
            }

            // Redessiner la table avec les nouvelles données
            table.draw();
        } else {
            // Si la DataTable n'existe pas encore, juste mettre à jour le HTML
            $("#o_tableListeCommande tbody").empty().append(tableRows);
        }
        let texteFooter = `${tableRows.length} commande(s)`;
        if (!(estRestreint && auMoinsUneCommandeEtrangere)) {
            texteFooter += ` : ${numeral(total).format("0.00 a")} ~ <span class='red'>${numeral(totalRouge).format("0.00 a")}</span> en retard !`;
        }

        $("#o_footerCommande").html(texteFooter);
        $("#o_footerCommande").parent().toggleClass("ligne_paire", tableRows.length % 2 !== 0);
    }

    /**
     * Configure le formulaire de convoi.
     */
    formulaireConvoi() {
        $("input[name='convoi']").before("<input id='o_idCommande' type='hidden' value='-1' name='o_idCommande'/>")
            .after(` <button id='o_resetConvoi'>Effacer</button>`)
            .onActionSecurisee('click', this, async (e) => {
                const idCommande = $("#o_idCommande").val();
                if (idCommande == -1) return true;

                const materiaux = numeral($("#nbMateriaux").val()).value();
                const nourriture = numeral($("#nbNourriture").val()).value();

                if (materiaux === 0 && nourriture === 0) {
                    $.toast({ ...TOAST_ERROR, text: "Impossible de lancer un convoi vide." });
                    e.preventDefault();
                    return false;
                }

                const commande = this.commandes.find(c => c.idSujet == idCommande);
                const destinataireConvoi = $("#pseudo_convoi").val();
                const demandeur = await commande.lire('Demandeur');

                if (commande && demandeur !== destinataireConvoi) {
                    $.toast({ ...TOAST_ERROR, text: `Le destinataire du convoi (${destinataireConvoi}) ne correspond pas au demandeur de la commande (${demandeur}).` });
                    e.preventDefault();
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
                    if (tempsParcours !== Infinity) {
                        dateArriveeCalculee = moment().add(tempsParcours, 's');
                    }
                }

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

                return false;
            });

        $("#o_resetConvoi").click((e) => {
            e.preventDefault();
            $("#pseudo_convoi, #input_nbNourriture, #input_nbMateriaux, #input_nbOuvriere, #o_idCommande").val("");
            return false;
        });
    }

    /**
     * Récupère les données des convois en cours affichés sur la page.
     * @returns {Array<Object>} Liste des convois avec leurs propriétés
     */
    getConvoisEnCoursDePage() {
        const convois = [];
        $("#centre > strong").each((i, elt) => {
            const texte = $(elt).text();
            // Nettoyage pour extraire les nombres
            const matches = texte.replace(/\s/g, '').split("dans")[0].match(/\d+/g);

            if (matches && matches.length >= 2) {
                const urlAnnuler = $(elt).nextAll("a[href*='commerce.php?annuler=']").first().attr('href');
                const matchId = urlAnnuler ? urlAnnuler.match(/annuler=(\d+)/) : null;
                const idAnnulation = matchId ? numeral(matchId[1]).value() : null;
                const pseudo = $(elt).find("a").first().text();
                const tempsRestantText = texte.split("dans")?.[1]?.trim();
                const tempsRestant = Utils.timeToInt(tempsRestantText);

                convois.push({
                    idAnnulation: idAnnulation,
                    nourriture: numeral(matches[0]).value(),
                    materiaux: numeral(matches[1]).value(),
                    destinataire: pseudo,
                    tempsRestant: tempsRestant
                });
            }
        });
        return convois;
    }

    /**
     * Attache les listeners pour l'annulation de convoi.
     */
    _attacherListenersAnnulationConvoi() {
        $("a[href*='commerce.php?annuler=']").onActionSecurisee('click', this, (e) => {
            const match = $(e.currentTarget).attr('href').match(/annuler=(\d+)/);
            if (match) {
                localStorage.setItem('outiiil_convoi_annulation_pending_id', match[1]);
                localStorage.setItem('outiiil_convoi_annulation_pending_timestamp', moment().toISOString());
            }
        });
    }

    /**
     * Traite le convoi après envoi au jeu.
     */
    async _traiterConvoiApresEnvoiJeu() {
        const convoiDataObj = new Convoi(this);
        const convoiCharge = await convoiDataObj.chargerDepuisLocalStorage('outiiil_convoi_a_poster');
        if (!convoiCharge) return;

        const idCommande = await convoiDataObj.lire('Id Commande');
        const commande = this.commandes.find(c => c.idSujet == idCommande);
        if (!commande) {
            localStorage.removeItem('outiiil_convoi_a_poster');
            return;
        }

        const convoisPage = this.getConvoisEnCoursDePage();

        // 1. Collecter tous les IDs de convois déjà rattachés à des commandes (pour éviter les doublons)
        const idsDejaRattaches = new Set();
        for (const cmd of this.commandes) {
            for (const convContenu of cmd.objetsForumContenus) {
                const idAnnul = await convContenu.lire('Id Annulation');
                if (idAnnul) idsDejaRattaches.add(idAnnul);
            }
        }

        // 2. Extraire les critères attendus en une seule fois
        const convoiParams = await convoiDataObj.lire(['Nourriture', 'Matériaux', 'Destinataire', 'Date Arrivée', 'Date Départ']);

        // 3. Filtrer les convois de la page qui correspondent
        const correspondances = convoisPage.filter(cp => {
            const estLibre = !idsDejaRattaches.has(cp.idAnnulation);
            const ressourcesMatch = cp.nourriture === convoiParams['Nourriture'] && cp.materiaux === convoiParams['Matériaux'];
            const destMatch = cp.destinataire === convoiParams['Destinataire'];

            // On utilise la date de départ (moment du clic) comme référence au lieu du moment présent
            // pour être plus proche de l'heure serveur au moment de la génération de la page.
            const dateArriveePage = convoiParams['Date Départ'].clone().add(cp.tempsRestant, 's');
            const dateMatch = Math.abs(dateArriveePage.diff(convoiParams['Date Arrivée'], 'seconds')) <= 1;

            return estLibre && ressourcesMatch && destMatch && dateMatch;
        });

        // 4. Trier par proximité de date
        correspondances.sort((a, b) => {
            const aArrival = convoiParams['Date Départ'].clone().add(a.tempsRestant, 's');
            const bArrival = convoiParams['Date Départ'].clone().add(b.tempsRestant, 's');
            return Math.abs(aArrival.diff(convoiParams['Date Arrivée'])) - Math.abs(bArrival.diff(convoiParams['Date Arrivée']));
        });

        try {
            console.log("Correspondances: ", correspondances);
            if (correspondances.length > 0) {
                const leBonConvoi = correspondances[0];
                await convoiDataObj.ecrire('Id Annulation', leBonConvoi.idAnnulation);

                await commande.ajouterConvoi(convoiDataObj);
                $.toast({ ...TOAST_SUCCESS, text: "Convoi posté." });

                // Passer la prochaine commande en cours si nécessaire
                await this._activerProchaineCommandeSiBesoin();
                await this.actualiserCommandes();
            } else {
                $.toast({ ...TOAST_ERROR, text: "Impossible de trouver le convoi envoyé. L'envoi a probablement échoué." });
            }
        } catch (error) {
            $.toast({ ...TOAST_ERROR, text: `Erreur lors de l'association du convoi: ${error.message || error}` });
            console.error(error);
        } finally {
            localStorage.removeItem('outiiil_convoi_a_poster');
        }
    }

    /**
     * Traite l'annulation de convoi après rechargement.
     */
    async _traiterAnnulationConvoiApresRechargement() {
        const idPending = localStorage.getItem('outiiil_convoi_annulation_pending_id');
        if (!idPending) return;

        let convoiTraite = false;
        const idPendingNum = numeral(idPending).value();
        const timestampClic = localStorage.getItem('outiiil_convoi_annulation_pending_timestamp');

        for (const commande of this.commandes) {
            const resultat = await commande.annulerConvoi(idPendingNum, timestampClic);
            if (resultat.trouve) {
                convoiTraite = true;
                if (resultat.modifie) {
                    if (resultat.resurrection) {
                        await this._repasserEnAttenteProchaineCommande(commande.idSujet);
                    }
                    await this.actualiserCommandes();
                }
                break;
            }
        }

        if (!convoiTraite) {
            $.toast({ ...TOAST_INFO, text: "Convoi hors système ou déjà annulé." });
        }
        localStorage.removeItem('outiiil_convoi_annulation_pending_id');
        localStorage.removeItem('outiiil_convoi_annulation_pending_timestamp');
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

    /**
     * Repasse les commandes indûment activées en attente si une commande précédente a été ressuscitée.
     * @param {number} idSujetRessuscite - L'ID du sujet de la commande qui vient d'être remise en cours.
     */
    async _repasserEnAttenteProchaineCommande(idSujetRessuscite) {
        for (const cmd of this.commandes) {
            if (cmd.idSujet != idSujetRessuscite && await cmd.lire('État') === ETAT_COMMANDE["En cours"]) {
                await cmd.ecrire('État', ETAT_COMMANDE["En attente"]);
                await cmd.enregistrerSurForum();
                console.log(`[GererCommandes] Commande ${cmd.idSujet} repassée en attente (résurrection de ${idSujetRessuscite}).`);
            }
        }
    }
})
