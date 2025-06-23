/*
 * Commerce.js
 * Hraesvelg
 **********************************************************************/

/**
* Classe de fonction pour la page /commerce.php.
*
* @class PageCommerce
* @constructor
*/
class PageCommerce
{
    constructor(boiteComptePlus)
    {
        /**
        * Accés à la boite compte+
        */
        this._boiteComptePlus = boiteComptePlus;
        /**
        * Connexion à l'utilitaire.
        */
        this._utilitaire = new PageForum();
    }
    /**
    *
    */
    executer()
    {
        // ajout d'information
        $("form table").append(`<tr class='centre'><td colspan=6>Info : Niveau d'étable <strong>${monProfil.niveauConstruction[11]}</strong>, 1 ouvrière peut transporter : <strong>${(10 + (monProfil.niveauConstruction[11] / 2))}</strong> ressources.</td></tr>`);
        // ajout des boutons pour arrondir les quantités
        $("#bouton_nourriture_max").html(`Nourriture donnée <span id="o_arrondirNou" class="gras small">arrondir...</span>`);
        $("#o_arrondirNou").click((e) => {
            e.preventDefault();
            let value = Math.floor($("#nbNourriture").val()), nbMat = Math.floor($("#nbMateriaux").val()), newValue = Utils.arrondiQuantite(value);
            $("#input_nbNourriture").val(numeral(newValue).format());
            $("#nbNourriture").val(newValue);
            // mise à jour des ouvrieres
            $("#input_nbOuvriere").val(numeral(Math.floor((newValue + nbMat) / (10 + (monProfil.niveauConstruction[11] / 2)))).format());
            $("#nbOuvriere").val(Math.floor((newValue + nbMat) / (10 + (monProfil.niveauConstruction[11] / 2))));
            return false;
        });
        // materiaux
        $("#bouton_materiaux_max").html(`Matériaux donnés <span id="o_arrondirMat" class="gras small">arrondir...</span>`);
        $("#o_arrondirMat").click((e) => {
            e.preventDefault();
            let value = Math.floor($("#nbMateriaux").val()), nbNou = Math.floor($("#nbNourriture").val()), newValue = Utils.arrondiQuantite(value);
            $("#input_nbMateriaux").val(numeral(newValue).format());
            $("#nbMateriaux").val(newValue);
            // mise à jour des ouvrieres
            $("#input_nbOuvriere").val(numeral(Math.floor((newValue + nbNou) / (10 + (monProfil.niveauConstruction[11] / 2)))).format());
            $("#nbOuvriere").val(Math.floor((newValue + nbNou) / (10 + (monProfil.niveauConstruction[11] / 2))));
            return false;
        });
        // option c+
        if(!Utils.comptePlus) this.plus();

        // Si on dispose d'un utilitaire pour le commerce ET que le joueur a un sujet dans la section membres
        const idSectionCommande = monProfil.parametre["forumCommande"].valeur;
        const idSectionMembre = monProfil.parametre["forumMembre"].valeur;
        const pseudoJoueur = monProfil.pseudo;

        if (idSectionCommande && idSectionMembre) {
            this._utilitaire.verifierSujetMembre(idSectionMembre, pseudoJoueur).then(sujetExiste => {
                if (sujetExiste) {
                    // recuperation des commandes sur l'utilitaire
                    this._utilitaire.consulterSection(idSectionCommande).then((data) => {
                        // chargerCommande retourne maintenant une Promise
                        this._utilitaire.chargerCommande(data).then(() => {
                            this.afficherCommande();
                            // Charger les convois du forum après les commandes
                            return this._utilitaire.chargerConvois(this._utilitaire.commande);
                        }).then((convoisForum) => {
                            // Actualiser le tableau des convois après le chargement initial
                            this.actualiserConvois(); // Cette fonction utilise toujours this._utilitaire.chargerConvois() en interne, ce qui est correct pour afficher les convois du forum.
                            // Attacher les listeners pour les liens d'annulation de convoi
                            this._attacherListenersAnnulationConvoi();
                            // Traiter le convoi après l'envoi dans le jeu (au rechargement de la page)
                            this._traiterConvoiApresEnvoiJeu();
                            // Traiter l'annulation de convoi après le rechargement de la page
                            this._traiterAnnulationConvoiApresRechargement();
                        }).catch((error) => {
                            // Gérer les erreurs de chargement des commandes ou des convois
                        });
                    }, (jqXHR, textStatus, errorThrown) => {
                        $.toast({...TOAST_ERROR, text : "Une erreur réseau a été rencontrée lors de la récupération des commandes."});
                    });
                    this.formulaireConvoi();
                } else {
                    // Optionnel: Afficher un message à l'utilisateur
                    // $.toast({...TOAST_INFO, text : "Votre sujet membre n'a pas été trouvé. Le tableau des commandes n'est pas disponible."});
                }
            }).catch(error => {
                // Optionnel: Afficher un message d'erreur
                // $.toast({...TOAST_ERROR, text : "Erreur lors de la vérification de votre sujet membre."});
            });
        } else {
             // Optionnel: Afficher un message à l'utilisateur
             // $.toast({...TOAST_INFO, text : "Les paramètres du forum ne sont pas configurés. Le tableau des commandes n'est pas disponible."});
        }

        return this;
    }

    /**
     * Gère le traitement d'un convoi après qu'il ait été envoyé dans le jeu,
     * en le postant sur le forum et en mettant à jour les commandes.
     * Cette méthode est appelée au rechargement de la page si des données de convoi
     * sont présentes dans le localStorage.
     *
     * @private
     * @method _traiterConvoiApresEnvoiJeu
     */
    async _traiterConvoiApresEnvoiJeu() {
        console.log("[PageCommerce][_traiterConvoiApresEnvoiJeu] Début de _traiterConvoiApresEnvoiJeu.");
        const convoiAPosterString = localStorage.getItem('outiiil_convoi_a_poster');
        const idsAnnulationApresRechargementInitialString = localStorage.getItem('outiiil_ids_annulation_apres_rechargement_initial');

        if (convoiAPosterString && !idsAnnulationApresRechargementInitialString) {
            // Premier rechargement après l'interception du clic
            const convoiData = JSON.parse(convoiAPosterString);
            
            // Compléter les champs du formulaire de convoi
            $("#pseudo_convoi").val(convoiData.destinataire);
            $("#input_nbNourriture").val(numeral(convoiData.nourriture).format());
            $("#nbNourriture").val(convoiData.nourriture);
            $("#input_nbMateriaux").val(numeral(convoiData.materiaux).format());
            $("#nbMateriaux").val(convoiData.materiaux);
            $("#input_nbOuvriere").val(numeral(convoiData.ouvrieres).format());
            $("#nbOuvriere").val(convoiData.ouvrieres);
            $("#o_idCommande").val(convoiData.idCommande);

            // Récupérer les IDs d'annulation des convois actuellement affichés sur la page
            const idsActuelsPage = this.getConvoiAnnulationIds();
            localStorage.setItem('outiiil_ids_annulation_apres_rechargement_initial', JSON.stringify(idsActuelsPage));

            // Simuler le clic sur le bouton de soumission original pour inclure le paramètre 'name=convoi'
            $("input[name='convoi']").click();
            // Ne pas effacer les clés localStorage ici, elles seront utilisées après le second rechargement
            return; // Arrêter l'exécution ici, la page va se recharger
        } else if (convoiAPosterString && idsAnnulationApresRechargementInitialString) {
            // Second rechargement après le forward du clic
            console.log("[PageCommerce][_traiterConvoiApresEnvoiJeu] Second rechargement détecté.");
            const convoiData = JSON.parse(convoiAPosterString);
            const idsAvantEnvoi = JSON.parse(idsAnnulationApresRechargementInitialString);
            const monConvoi = new Convoi(convoiData);

            const idsApresEnvoi = this.getConvoiAnnulationIds();
            console.log(`[PageCommerce][_traiterConvoiApresEnvoiJeu] IDs d'annulation avant second envoi: ${idsAvantEnvoi.join(', ')}`);
            console.log(`[PageCommerce][_traiterConvoiApresEnvoiJeu] IDs d'annulation après second envoi: ${idsApresEnvoi.join(', ')}`);

            const nouvelIdAnnulation = idsApresEnvoi.find(id => !idsAvantEnvoi.includes(id));
            console.log(`[PageCommerce][_traiterConvoiApresEnvoiJeu] Nouvel ID d'annulation trouvé: ${nouvelIdAnnulation}`);

            try {
                if (nouvelIdAnnulation) {
                    monConvoi.idAnnulation = nouvelIdAnnulation;
                    console.log(`[PageCommerce][_traiterConvoiApresEnvoiJeu] Convoi mis à jour avec idAnnulation: ${monConvoi.idAnnulation}`);

                    let idCommande = monConvoi.idCommande;
                    idCommande = parseInt(idCommande);

                    await this._utilitaire.envoyerMessage(idCommande, monConvoi.toUtilitaire());
                    console.log("[PageCommerce][_traiterConvoiApresEnvoiJeu] Convoi envoyé sur le forum.");

                    this._utilitaire.commande[idCommande].ajouteConvoi(monConvoi);
                    console.log(`[PageCommerce][_traiterConvoiApresEnvoiJeu] Commande ${idCommande} mise à jour en mémoire. Tentative de modification du sujet sur le forum.`);
                    await this._utilitaire.modifierSujet(this._utilitaire.commande[idCommande].toUtilitaire(), " ", idCommande);
                    $.toast({...TOAST_SUCCESS, text : "Commande mise à jour sur le forum."});

                    let cmdSuivante = 99999999999999999;
                    let foundActiveCommand = false;
                    for(let id in this._utilitaire.commande){
                        if(this._utilitaire.commande[id].etat === ETAT_COMMANDE["En cours"]){
                            foundActiveCommand = true;
                            break;
                        }
                        if(this._utilitaire.commande[id].etat === ETAT_COMMANDE["En attente"] && id < cmdSuivante)
                            cmdSuivante = id;
                    }
                    if(!foundActiveCommand && cmdSuivante !== 99999999999999999){
                        this._utilitaire.commande[cmdSuivante].etat = ETAT_COMMANDE["En cours"];
                        await this._utilitaire.modifierSujet(this._utilitaire.commande[cmdSuivante].toUtilitaire(), " ", cmdSuivante);
                        $.toast({...TOAST_SUCCESS, text : "Nouvelle commande en cours à jour."});
                    }

                    this.actualiserConvois();
                    this.actualiserCommande();

                } else {
                    console.log("[PageCommerce][_traiterConvoiApresEnvoiJeu] Aucun nouvel ID d'annulation détecté. Le convoi ne sera pas posté par Outiiil.");
                    $.toast({...TOAST_INFO, text : "Aucun nouvel ID d'annulation détecté après l'envoi du convoi. Le convoi n'a pas été posté sur le forum par Outiiil."});
                }
            } catch (error) {
                console.error(`[PageCommerce][_traiterConvoiApresEnvoiJeu] Erreur lors du traitement du convoi après envoi:`, error);
                $.toast({...TOAST_ERROR, text : `Erreur lors du traitement du convoi après envoi: ${error.message || error}`});
            } finally {
                console.log("[PageCommerce][_traiterConvoiApresEnvoiJeu] Nettoyage du localStorage.");
                localStorage.removeItem('outiiil_convoi_a_poster');
                localStorage.removeItem('outiiil_ids_annulation_apres_rechargement_initial');
                console.log("[PageCommerce][_traiterConvoiApresEnvoiJeu] localStorage nettoyé.");
            }
        } else {
            console.log("[PageCommerce][_traiterConvoiApresEnvoiJeu] Pas de données de convoi ou d'IDs d'annulation dans le localStorage. Fin de la fonction.");
        }
    }

    /**
     * Gère le traitement d'une annulation de convoi après le rechargement de la page.
     * Cette méthode est appelée au rechargement de la page si un ID d'annulation
     * est présent dans le localStorage.
     *
     * @private
     * @method _traiterAnnulationConvoiApresRechargement
     */
    async _traiterAnnulationConvoiApresRechargement() {
        const idAnnulationPending = localStorage.getItem('outiiil_convoi_annulation_pending_id');

        if (idAnnulationPending) {
            
            // Récupérer les IDs d'annulation de tous les convois actuellement affichés sur la page
            const idsActuelsPage = this.getConvoiAnnulationIds();

            // Si l'ID d'annulation stocké est toujours présent dans la liste actuelle, cela signifie que le jeu n'a pas encore traité l'annulation.
            if (idsActuelsPage.includes(idAnnulationPending)) {
                localStorage.setItem('outiiil_convoi_annulation_forwarded_id', idAnnulationPending);
                // Trouver le lien d'annulation correspondant et simuler un clic
                $("a[href*='commerce.php?annuler=" + idAnnulationPending + "']").get(0).click();
                // Ne pas effacer outiiil_convoi_annulation_pending_id ici, il sera effacé après le second rechargement
                return; // Arrêter l'exécution ici, la page va se recharger
            } else {
                // Si l'ID d'annulation stocké n'est PAS présent dans la liste actuelle, cela signifie que le convoi a été annulé côté jeu.
                const idAnnulationForwarded = localStorage.getItem('outiiil_convoi_annulation_forwarded_id');

                if (idAnnulationForwarded === idAnnulationPending) {
                    // C'est le second rechargement après un forward du clic
                    try {
                        // Charger tous les convois en cours depuis le forum
                        const tousLesConvoisForum = await this._utilitaire.chargerConvois(this._utilitaire.commande);

                        // Rechercher le convoi annulé parmi les convois chargés en utilisant uniquement l'ID d'annulation
                        const convoiAnnuleForum = tousLesConvoisForum.find(convoi => convoi.idAnnulation === idAnnulationPending);

                        if (convoiAnnuleForum) {
                            
                            // Créer un nouvel objet Convoi avec des quantités négatives pour les ressources "nourriture" et "matériaux"
                            const convoiNegatif = new Convoi({
                                expediteur: convoiAnnuleForum.expediteur,
                                destinataire: convoiAnnuleForum.destinataire,
                                nourriture: -convoiAnnuleForum.nourriture,
                                materiaux: -convoiAnnuleForum.materiaux,
                                dateArrivee: convoiAnnuleForum.dateArrivee,
                                idCommande: convoiAnnuleForum.idCommande,
                                idAnnulation: convoiAnnuleForum.idAnnulation, // Conserver l'ID d'annulation
                                ouvrieres: convoiAnnuleForum.ouvrieres // Ajouter les ouvrières négatives
                            });

                            // Récupérer la commande associée
                            const commandeAssociee = this._utilitaire.commande[convoiAnnuleForum.idCommande];

                            if (commandeAssociee) {
                                
                                // Poster le convoi négatif sur le forum
                                await this._utilitaire.envoyerMessage(commandeAssociee.id, convoiNegatif.toUtilitaire());
                                $.toast({...TOAST_SUCCESS, text : "Annulation de convoi enregistrée sur le forum."});

                                // Mettre à jour la quantité livrée de la commande associée en mémoire
                                commandeAssociee.nourritureLivree += convoiNegatif.nourriture; // Ajoute une valeur négative
                                commandeAssociee.materiauxLivres += convoiNegatif.materiaux; // Ajoute une valeur négative

                                // S'assurer que les quantités livrées ne deviennent pas négatives
                                commandeAssociee.nourritureLivree = Math.max(0, commandeAssociee.nourritureLivree);
                                commandeAssociee.materiauxLivres = Math.max(0, commandeAssociee.materiauxLivres);

                                // Si la commande était "Terminée" et que la quantité livrée redevient inférieure à la quantité demandée, repasser son statut en "En cours".
                                if (commandeAssociee.etat === ETAT_COMMANDE.Terminée && 
                                    (commandeAssociee.nourritureLivree < commandeAssociee.totalNourritureDemandee || 
                                     commandeAssociee.materiauxLivres < commandeAssociee.totalMateriauxDemandes)) {
                                    commandeAssociee.etat = ETAT_COMMANDE["En cours"];
                                }

                                // Sauvegarder l'état mis à jour de la commande sur le forum
                                await this._utilitaire.modifierSujet(commandeAssociee.toUtilitaire(), " ", commandeAssociee.id);

                                // Actualiser les affichages
                                this.actualiserConvois();
                                this.actualiserCommande();

                            } else {
                                $.toast({...TOAST_WARNING, text : "Commande associée introuvable pour le convoi annulé sur le forum."});
                            }
                        } else {
                            $.toast({...TOAST_WARNING, text : "Convoi annulé introuvable sur le forum."});
                        }
                    } catch (error) {
                        console.error(`[PageCommerce][_traiterAnnulationConvoiApresRechargement] Erreur lors du traitement de l'annulation:`, error);
                        $.toast({...TOAST_ERROR, text : `Erreur lors du traitement de l'annulation du convoi: ${error.message || error}`});
                    }
                } else {
                    $.toast({...TOAST_INFO, text : "Le convoi a déjà été annulé ou n'est plus annulable. Aucune action Outiiil nécessaire."});
                }
            }
            // Dans tous les cas, effacer les clés du localStorage
            localStorage.removeItem('outiiil_convoi_annulation_pending_id');
            localStorage.removeItem('outiiil_convoi_annulation_forwarded_id');
        } 
    } // Fin de _traiterAnnulationConvoiApresRechargement();

	/**
	* Affiche les retours, et sauvegarde les convois en cours pour la boite compte plus.
    *
	* @private
	* @method plus
	*/
	plus()
	{
        // autocomplete sur le champs pseudo
        $("#pseudo_convoi").autocomplete({
            source : (request, response) => {
                // requete pour autocomplete
                Joueur.rechercher(request.term).then((data) => {response(Utils.extraitRecherche(data, true, false));});
            },
            position : {my : "left top-5", at : "left bottom"},
            delay : 0,
            minLength : 3
        });
        // sauvegarde des convois
		let listeConvoi = new Array(), nombres = new Array();
		$("#centre > strong").each((i, elt) => {
            // Affichage du retour des convois
            if($(elt).next().text().indexOf("Retour") == -1)
                $(elt).after(`<span class='small'>- Retour le ${Utils.roundMinute(Utils.timeToInt($(elt).text().split("dans")[1].trim())).format("D MMM YYYY à HH[h]mm")}</span>`);
            nombres = $(elt).text().replace(/ /g, '').split("dans")[0].match(/^\d+|\d+\b|\d+(?=\w)/g);
            listeConvoi.push({"cible" : $(elt).find("a").text(), "sens" : $(elt).text().includes("livrer"), "nou" : nombres[0], "mat" : nombres[1], "exp" : moment().add(Utils.timeToInt($(elt).text().split("dans")[1].trim()), 's')});
        });
        // tri les convois par ordre d'arrivée
        listeConvoi.sort((a, b) => {return moment(a.exp).diff(moment(b.exp));});
        // Verification si les données sont deja enregistrées
        if(listeConvoi.length) this.saveConvoi(listeConvoi);
        return this;
	} // Fin de plus();
    
    /**
    * Attache des listeners aux liens d'annulation de convoi.
    *
    * @private
    * @method _attacherListenersAnnulationConvoi
    */
    _attacherListenersAnnulationConvoi() {

        $("a[href*='commerce.php?annuler=']").on('click', async (e) => {
            // Si un ID d'annulation est déjà en attente, cela signifie que nous sommes dans un cycle de rechargement.
            // Ne rien faire pour éviter une boucle infinie.
            if (localStorage.getItem('outiiil_convoi_annulation_pending_id')) {
                return;
            }

            e.preventDefault(); // Empêcher le comportement par défaut du lien

            const originalHref = $(e.currentTarget).attr('href');
            const convoiIdMatch = originalHref.match(/annuler=(\d+)/);
            if (!convoiIdMatch) {
                $.toast({...TOAST_ERROR, text : "Erreur: Impossible d'identifier le convoi à annuler."});
                return;
            }
            const convoiId = convoiIdMatch[1];
            // Stocker l'ID d'annulation dans le localStorage avant de recharger la page
            localStorage.setItem('outiiil_convoi_annulation_pending_id', convoiId);
            // Le rechargement de la page doit toujours se produire, même en cas d'erreur
            window.location.href = "commerce.php";
        });
    } // Fin de _attacherListenersAnnulationConvoi();
    /**
    * Récupère les IDs d'annulation de tous les convois affichés sur la page.
    *
    * @private
    * @method getConvoiAnnulationIds
    * @returns {Array<string>} Un tableau de chaînes de caractères représentant les IDs d'annulation.
    */
    getConvoiAnnulationIds() {
        const annulationIds = [];
        $("a[href*='commerce.php?annuler=']").each((i, elt) => {
            const href = $(elt).attr('href');
            const convoiIdMatch = href.match(/annuler=(\d+)/);
            if (convoiIdMatch && convoiIdMatch[1]) {
                annulationIds.push(convoiIdMatch[1]);
            }
        });
        return annulationIds;
    } // Fin de getConvoiAnnulationIds();
    /**
	* Sauvegarde les convois en cours.
    *
	* @private
	* @method saveConvoi
	*/
	saveConvoi(liste)
	{
        if(!this._boiteComptePlus.hasOwnProperty("convoi") || this._boiteComptePlus.convoi.length != liste.length || this._boiteComptePlus.convoi[0]["cible"] != liste[0]["cible"] || liste[0]["exp"].diff(this._boiteComptePlus.convoi[0]["exp"], 's') > 1 && !Utils.comptePlus && $("#boiteComptePlus").length){
            this._boiteComptePlus.convoi = liste;
            this._boiteComptePlus.startConvoi = moment();
            this._boiteComptePlus.sauvegarder().majConvoi();
        }
        return this;
	} // Fin de saveConvoi();
    /**
	* Affiche les commandes en cours issu de l'utilitaire.
    *
	* @private
	* @method afficherCommande
    * @param {Object} liste des lignes de commandes.
	*/
	afficherCommande()
	{
        // Vérifier si le tableau des commandes existe déjà
        if ($("#o_tableListeCommande").length === 0) {
            // Créer la structure HTML du tableau (sans les lignes de données)
            let contenu = `<div id="o_listeCommande" class="simulateur centre o_marginT15"><h2>Commandes</h2><table id='o_tableListeCommande' class="o_maxWidth" cellspacing=0>
                <thead><tr class="ligne_paire"><th>Pseudo</th><th>Date commande</th><th>Évolution</th><th>Qté demandée ${IMG_POMME}</th><th>Qté demandée ${IMG_MAT}</th><th>Qté à livrer ${IMG_POMME}</th><th>Qté à livrer ${IMG_MAT}</th><th>Échéance</th><th>Statut</th><th>État</th><th>Temps de trajet</th><th>Livrer</th><th>Options</th></tr></thead>
                <tfoot><tr class='gras'><td colspan='13' id='o_footerCommande'></td></tr></tfoot></table></div><br/>`;

            $("#centre .Bas").before(contenu);

            // Initialiser DataTables pour le tableau des commandes
            $("#o_tableListeCommande").DataTable({
                data: [], // Les données seront ajoutées par actualiserCommande
                bInfo : false,
                bPaginate : false,
                bAutoWidth : false,
                dom : "Bfrti",
                buttons : ["colvis", "copyHtml5", "csvHtml5", "excelHtml5"],
                order : [[7, "desc"]], // Index de colonne ajusté pour l'échéance
                stripeClasses : ["", "ligne_paire"],
                responsive : true,
                language : {
                    zeroRecords : "Aucune commande trouvée",
                    infoEmpty : "Aucun enregistrement",
                    infoFiltered : "(Filtré par _MAX_ enregistrements)",
                    search : "Rechercher : ",
                    buttons : {colvis : "Colonne"}
                },
                columnDefs : [
                    {targets: 1, title: "Date commande", visible: false}, // Nouvelle colonne Date commande
                    {targets: 2, title: "Évolution", visible: false}, // Nouvelle colonne Évolution
                    {type : "quantite-grade", targets : [5, 6]}, // Indices ajustés
                    {type : "moment-D MMM YYYY", targets : 7}, // Indice ajusté
                    {type : "time-unformat", targets : 10}, // Indice ajusté
                    {sortable : false, targets : [11, 12]}, // Indices ajustés
                    {visible: false, targets: [3, 4]} // Indices ajustés pour les quantités demandées
                ]
            });

            $("#o_tableListeCommande_wrapper .dt-buttons").prepend(`<a id="o_ajouterCommande" class="dt-button" href="#"><span>Commander</span></a>`);
            $("#o_ajouterCommande").click((e) => {
                let boiteCommande = new BoiteCommande(new Commande(), this._utilitaire, this);
                boiteCommande.afficher();
            });

            // Attacher les événements aux boutons "Livrer", "Modifier", "Supprimer" via la délégation d'événements
            $("#o_tableListeCommande").on('click', "a[id^='o_commande']", (e) => {
                e.preventDefault();
                const commandeId = $(e.currentTarget).attr('id').replace('o_commande', '');
                const commande = this._utilitaire.commande[commandeId];

                let transportCapacity = Math.floor((Utils.ouvrieres - Utils.terrain) * (10 + (monProfil.niveauConstruction[11] / 2)));
                let materialsToPrefill = Math.min(commande.materiaux, transportCapacity);
                let nourishmentToPrefill = Math.min(commande.nourriture, transportCapacity - materialsToPrefill);

                $("#input_nbMateriaux").val(numeral(materialsToPrefill).format());
                $("#nbMateriaux").val(materialsToPrefill);

                $("#input_nbNourriture").val(numeral(nourishmentToPrefill).format());
                $("#nbNourriture").val(nourishmentToPrefill);
                $("#pseudo_convoi").val(commande.demandeur.pseudo);
                $("#o_idCommande").val(commande.id);
                $("html").animate({scrollTop : 0}, 600);
                return false;
            });

            $("#o_tableListeCommande").on('click', "a[id^='o_modifierCommande']", (e) => {
                e.preventDefault();
                const commandeId = $(e.currentTarget).attr('id').replace('o_modifierCommande', '');
                const commande = this._utilitaire.commande[commandeId];
                let boiteCommande = new BoiteCommande(commande, this._utilitaire, this);
                boiteCommande.afficher();
                return false;
            });

            $("#o_tableListeCommande").on('click', "a[id^='o_supprimerCommande']", (e) => {
                const commandeId = $(e.currentTarget).attr('id').replace('o_supprimerCommande', '');
                const commande = this._utilitaire.commande[commandeId];
                if(confirm("Supprimer cette commande ?")){
                    commande.etat = ETAT_COMMANDE.Supprimée;
                    this._utilitaire.modifierSujet(commande.toUtilitaire(), " ", commande.id).then((data) => {
                        $.toast({...TOAST_INFO, text : "Commande supprimée avec succès."});
                        this.actualiserCommande();
                    }, (jqXHR, textStatus, errorThrown) => {
                        $.toast({...TOAST_ERROR, text : "Une erreur réseau a été rencontrée lors de la mise à jour des commandes."});
                    });
                }
                return false;
            });

            // Créer la structure HTML du tableau des convois
            let contenuConvois = `<div id="o_listeConvoi" class="simulateur centre o_marginT15"><h2>Convois en cours</h2><table id='o_tableListeConvoi' class="o_maxWidth" cellspacing=0>
                <thead><tr class="ligne_paire"><th>Expéditeur</th><th>Destinataire</th><th>${IMG_POMME}</th><th>${IMG_MAT}</th><th>Arrivée</th></tr></thead>
                <tbody></tbody></table></div><br/>`;

            $("#o_listeCommande").after(contenuConvois); // Ajouter après le tableau des commandes

            // Initialiser DataTables pour le tableau des convois
            $("#o_tableListeConvoi").DataTable({
                data: [], // Les données seront ajoutées par actualiserConvois
                bInfo : false,
                bPaginate : false,
                bAutoWidth : false,
                dom : "Bfrti",
                buttons : ["colvis", "copyHtml5", "csvHtml5", "excelHtml5"],
                order : [[4, "asc"]], // Trier par date d'arrivée
                stripeClasses : ["", "ligne_paire"],
                responsive : true,
                language : {
                    zeroRecords : "Aucun convoi en cours",
                    infoEmpty : "Aucun enregistrement",
                    infoFiltered : "(Filtré par _MAX_ enregistrements)",
                    search : "Rechercher : ",
                    buttons : {colvis : "Colonne"}
                },
                columnDefs : [
                    {type : "quantite-grade", targets : [2, 3]},
                    {type : "moment-D MMM YYYY à HH[h]mm", targets : 4}
                ]
            });
        }
        // Appeler actualiserCommande pour remplir le tableau
        this.actualiserCommande();
    } // Fin de afficherCommande();

    /**
    * Actualise le tableau des commandes en cours.
    *
    * @private
	* @method actualiserCommande
    */
    actualiserCommande() {
        let total = 0, totalRouge = 0, tabCommandeAff = new Array();
        let tableData = []; // Tableau pour les données de DataTables

        for(let id in this._utilitaire.commande){
            if(this._utilitaire.commande[id].estAFaire()){
                const commande = this._utilitaire.commande[id];
                // Construire un tableau de données pour chaque ligne
                const rowData = [
                    commande.demandeur.getLienFourmizzz(), // Pseudo
                    moment(commande.dateCommande).format("D MMM YYYY"), // Date commande
                    EVOLUTION[commande.evolution], // Évolution
                    numeral(commande.totalNourritureDemandee).format(), // Qté demandée Nourriture
                    numeral(commande.totalMateriauxDemandes).format(), // Qté demandée Matériaux
                    numeral(commande.nourriture).format(), // Qté à livrer Nourriture
                    numeral(commande.materiaux).format(), // Qté à livrer Matériaux
                    moment(commande.dateSouhaite).format("D MMM YYYY"), // Echéance
                    // Status (image ou croix)
                    (() => {
                        let apres = !commande.dateApres || moment().isSameOrAfter(moment(commande.dateApres));
                        if(apres){
                            let attente = commande.getAttente();
                            switch(true){
                                case attente > 0 : return `<img src='images/icone/3rondrouge.gif'/>`;
                                case attente > -3 : return `<img src='images/icone/2rondorange.gif'/>`;
                                default : return `<img src='images/icone/1rondvert.gif'/>`;
                            }
                        } else {
                            return `<img src="${IMG_CROIX}" alt='supprimer' title='Ne pas livrer avant le ${moment(commande.dateApres).format("DD-MM-YYYY")}'/>`;
                        }
                    })(),
                    // État
                    `<span ${commande.etat == ETAT_COMMANDE.Nouvelle ? "title='Un chef doit valider cette commande.'" : ""}>${Object.keys(ETAT_COMMANDE).find(key => ETAT_COMMANDE[key] === commande.etat)}</span>`,
                    // Temps de trajet
                    Utils.intToTime(monProfil.getTempsParcours2(commande.demandeur)),
                    // Livrer (bouton ou vide)
                    (() => {
                        let apres = !commande.dateApres || moment().isSameOrAfter(moment(commande.dateApres));
                        return apres && commande.etat == ETAT_COMMANDE["En cours"] ? `<a id='o_commande${commande.id}' href=''><img src='${IMG_LIVRAISON}' alt='livrer'/></a>` : "";
                    })(),
                    // Options (boutons ou vide)
                    (() => {
                        return (commande.demandeur.pseudo == monProfil.pseudo) ? `<a id='o_modifierCommande${commande.id}' href=''><img src='${IMG_CRAYON}' alt='modifier'/></a> <a id='o_supprimerCommande${commande.id}' href=''><img src='${IMG_CROIX}' alt='supprimer'/></a>` : "";
                    })()
                ];
                tableData.push(rowData);

                total += parseInt(commande.materiaux);
                if(commande.estHorsTard()) totalRouge += parseInt(commande.materiaux);
                tabCommandeAff.push(id);
            }
        }

        // Mettre à jour le tableau DataTables existant
        const table = $("#o_tableListeCommande").DataTable();
        table.clear().rows.add(tableData).draw();

        // Mettre à jour le footer
        $("#o_footerCommande").html(`${tabCommandeAff.length} commande(s) : ${numeral(total).format("0.00 a")} ~ <span class='red'>${numeral(totalRouge).format("0.00 a")}</span> en retard !`);
        $("#o_footerCommande").parent().toggleClass("ligne_paire", tabCommandeAff.length % 2 !== 0);
    } // Fin de actualiserCommande();

    /**
    * Actualise le tableau des convois en cours.
    *
    * @private
	* @method actualiserConvois
    */
    actualiserConvois() {
        // Recharger les convois
        this._utilitaire.chargerConvois(this._utilitaire.commande).then((convois) => {
            // Préparer les données pour DataTables
            const tableDataConvois = convois.map(convoi => [
                convoi.expediteur,
                convoi.destinataire,
                numeral(convoi.nourriture).format(),
                numeral(convoi.materiaux).format(),
                moment(convoi.dateArrivee).format("D MMM YYYY à HH[h]mm") // Formatage de la date
            ]);

            // Mettre à jour le tableau DataTables existant
            $("#o_tableListeConvoi").DataTable().clear().rows.add(tableDataConvois).draw();
        }).catch((error) => {
            // Gérer l'erreur si nécessaire
        });
    } // Fin de actualiserConvois();
    /**
	* Modifie le bouton d'envoie des convois pour prendre ne compte l'utilitaire.
    *
	* @private
	* @method formulaireConvoi
	*/
	formulaireConvoi()
	{
        $("input[name='convoi']").before("<input id='o_idCommande' type='hidden' value='-1' name='o_idCommande'/>").after(` <button id='o_resetConvoi'>Effacer</button>`).click((e) => {
            let idCommande = $("#o_idCommande").val();
            let convoiAPosterString = localStorage.getItem('outiiil_convoi_a_poster');

            if (idCommande != -1 && convoiAPosterString) {
                // Si un idCommande est défini (convoi Outiiil) ET que des données de convoi sont déjà dans le localStorage,
                // cela signifie que nous sommes dans le second rechargement après le clic simulé par _traiterConvoiApresEnvoiJeu.
                // Dans ce cas, nous voulons que le formulaire soit soumis normalement au jeu, sans interception.
                console.log("[PageCommerce][formulaireConvoi] Détection du second rechargement, laisser le formulaire se soumettre au jeu.");
                return true; // Laisser l'événement se propager et le formulaire se soumettre
            }

            let materiaux = numeral($("#nbMateriaux").val()).value();
            let nourriture = numeral($("#nbNourriture").val()).value();

            if (materiaux === 0 && nourriture === 0) {
                $.toast({...TOAST_ERROR, text : "Impossible de lancer un convoi vide."});
                e.preventDefault();
                return false;
            }

            if(idCommande != -1){ // Enregistrement du convoi
                e.preventDefault(); // Empêcher la soumission immédiate du formulaire par le jeu.
                
                let destinatairePseudo = $("#pseudo_convoi").val();
                let dateArriveeCalculee = moment().add(monProfil.getTempsParcours2(this._utilitaire.commande[idCommande].demandeur), 's');

                let monConvoi = new Convoi({
                    expediteur  : monProfil.pseudo,
                    destinataire : destinatairePseudo,
                    materiaux   : materiaux,
                    nourriture  : nourriture,
                    idCommande  : numeral(idCommande).value(),
                    dateArrivee : dateArriveeCalculee,
                    ouvrieres   : numeral($("#nbOuvriere").val()).value() // Ajout du nombre d'ouvrières
                });
                
                // Enregistrer les données du convoi dans le localStorage
                localStorage.setItem('outiiil_convoi_a_poster', JSON.stringify(monConvoi.toObject()));
                
                // Recharger la page
                window.location.href = "commerce.php";
                return false; // Empêcher toute autre action après le rechargement
            }
        });
        $("#o_resetConvoi").click((e) => {
            e.preventDefault();
            $("#pseudo_convoi, #input_nbNourriture, #input_nbMateriaux, #input_nbOuvriere, #o_idCommande").val("");
            return false;
        });
        return this;
	} // Fin de formulaireConvoi();
} // Fin de la classe PageCommerce
