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
                            console.log("[PageCommerce] Appel de chargerConvois après chargement des commandes.");
                            // Charger les convois du forum après les commandes
                            return this._utilitaire.chargerConvois(this._utilitaire.commande);
                        }).then((convoisForum) => {
                            console.log("[PageCommerce] chargerConvois terminé. Convois du forum reçus:", convoisForum);

                            // Extraire les convois actifs de la page commerce
                            const convoisActifsPage = this.getConvoisActifsPage();
                            console.log("[PageCommerce] Convois actifs de la page extraits:", convoisActifsPage);

                            // Appeler la nouvelle méthode pour gérer les annulations (étapes 2 à 7)
                            this.gererAnnulationsConvois(convoisForum, convoisActifsPage);

                            // Actualiser le tableau des convois après le chargement initial
                            this.actualiserConvois(); // Cette fonction utilise toujours this._utilitaire.chargerConvois() en interne, ce qui est correct pour afficher les convois du forum.

                        }).catch((error) => {
                            // Gérer les erreurs de chargement des commandes ou des convois
                            console.error("[PageCommerce] Erreur lors du chargement des commandes ou des convois:", error);
                        });
                    }, (jqXHR, textStatus, errorThrown) => {
                        $.toast({...TOAST_ERROR, text : "Une erreur réseau a été rencontrée lors de la récupération des commandes."});
                    });
                    this.formulaireConvoi();
                } else {
                    console.log("[PageCommerce] Sujet membre non trouvé. Le tableau des commandes et des convois ne sera pas affiché.");
                    // Optionnel: Afficher un message à l'utilisateur
                    // $.toast({...TOAST_INFO, text : "Votre sujet membre n'a pas été trouvé. Le tableau des commandes n'est pas disponible."});
                }
            }).catch(error => {
                console.error("[PageCommerce] Erreur lors de la vérification du sujet membre:", error);
                // Optionnel: Afficher un message d'erreur
                // $.toast({...TOAST_ERROR, text : "Erreur lors de la vérification de votre sujet membre."});
            });
        } else {
             console.log("[PageCommerce] Paramètres forumCommande ou forumMembre non configurés. Le tableau des commandes ne sera pas affiché.");
             // Optionnel: Afficher un message à l'utilisateur
             // $.toast({...TOAST_INFO, text : "Les paramètres du forum ne sont pas configurés. Le tableau des commandes n'est pas disponible."});
        }

        return this;
    }
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
	}
    /**
    * Gère l'identification et le traitement des annulations de convois.
    * Correspond aux étapes 2 à 7 du plan d'implémentation.
    *
    * @private
    * @method gererAnnulationsConvois
    * @param {Array} convoisForum - Liste de tous les convois en cours extraits du forum.
    * @param {Array} convoisActifsPage - Liste des convois actuellement actifs affichés sur la page commerce du joueur.
    */
    gererAnnulationsConvois(convoisForum, convoisActifsPage) {
        console.log("[PageCommerce] Début de gererAnnulationsConvois");
        console.log("Convois du forum:", convoisForum);
        console.log("Convois actifs de la page:", convoisActifsPage);

        // Étape 2: Filtrage et Groupement des Convois du Forum
        const convoisForumJoueur = convoisForum.filter(convoi => convoi.expediteur === monProfil.pseudo);
        console.log("Convois du forum du joueur actuel:", convoisForumJoueur);

        const groupesForum = new Map();
        convoisForumJoueur.forEach(convoi => {
            const absNourriture = Math.abs(convoi.nourriture);
            const absMateriaux = Math.abs(convoi.materiaux);
            const key = `${convoi.destinataire}-${absNourriture}-${absMateriaux}-${moment(convoi.dateArrivee).format("YYYYMMDDHHmm")}`;

            if (!groupesForum.has(key)) {
                groupesForum.set(key, { count_forum: 0, absNourriture: absNourriture, absMateriaux: absMateriaux, destinataire: convoi.destinataire, dateArrivee: convoi.dateArrivee, idCommande: convoi.idCommande });
            }

            // Un convoi est considéré comme négatif si au moins une de ses quantités est négative.
            if (convoi.nourriture < 0 || convoi.materiaux < 0) {
                groupesForum.get(key).count_forum--;
                console.log(`[gererAnnulationsConvois] Convoi négatif soustrait du groupe ${key}. count_forum: ${groupesForum.get(key).count_forum}`);
            } else { // Sinon, c'est un convoi positif ou nul.
                groupesForum.get(key).count_forum++;
                console.log(`[gererAnnulationsConvois] Convoi positif ajouté au groupe ${key}. count_forum: ${groupesForum.get(key).count_forum}`);
            }
        });
        console.log("[gererAnnulationsConvois] Groupes de convois attendus (forum) après traitement:", groupesForum);

        // Étape 3: Groupement et Comptage des Convois Actifs
        const groupesPage = new Map();
        convoisActifsPage.forEach(convoi => {
             // Utiliser la même clé unique pour le groupement
            const key = `${convoi.cible}-${convoi.nou}-${convoi.mat}-${moment(convoi.exp).format("YYYYMMDDHHmm")}`;
             if (!groupesPage.has(key)) {
                groupesPage.set(key, { count_page: 0, convoi: convoi }); // Stocker une référence au convoi
            }
            groupesPage.get(key).count_page++;
            console.log(`[gererAnnulationsConvois] Convoi actif ajouté au groupe de page ${key}. count_page: ${groupesPage.get(key).count_page}`);
        });
        console.log("[gererAnnulationsConvois] Groupes de convois réels (page) après traitement:", groupesPage);

        // Étape 4: Comparaison des Groupes et Identification des Annulations
        const annulationsIdentifiees = [];
        groupesForum.forEach((forumGroup, key) => {
            const pageGroup = groupesPage.get(key);
            const countForum = forumGroup.count_forum;
            const countPage = pageGroup ? pageGroup.count_page : 0;

            console.log(`[gererAnnulationsConvois] Comparaison pour la clé ${key}: countForum=${countForum}, countPage=${countPage}`);

            if (countForum > countPage) {
                const nombreAnnulations = countForum - countPage;
                console.log(`[gererAnnulationsConvois] Annulation identifiée pour ${key}. Nombre d'annulations: ${nombreAnnulations}`);

                annulationsIdentifiees.push({
                    destinataire: forumGroup.destinataire,
                    nourriture: forumGroup.absNourriture, // Quantité d'un seul convoi (positive)
                    materiaux: forumGroup.absMateriaux,   // Quantité d'un seul convoi (positive)
                    dateArrivee: forumGroup.dateArrivee,
                    idCommande: forumGroup.idCommande,
                    nombreAnnulations: nombreAnnulations
                });
            }
        });
        console.log("[gererAnnulationsConvois] Annulations identifiées après comparaison:", annulationsIdentifiees);

        // Étape 5: Traitement des Annulations (Mise à jour en mémoire et post sur le forum)
        annulationsIdentifiees.forEach(annulation => {
            const commande = this._utilitaire.commande[annulation.idCommande];
            if (commande) {
                console.log(`Traitement annulation pour commande ${commande.id}:`, annulation);

                // Soustraire la quantité annulée de la quantité déjà livrée pour chaque convoi annulé
                commande.nourritureLivree -= (annulation.nourriture * annulation.nombreAnnulations);
                commande.materiauxLivres -= (annulation.materiaux * annulation.nombreAnnulations);

                // S'assurer que les quantités livrées ne deviennent pas négatives
                commande.nourritureLivree = Math.max(0, commande.nourritureLivree);
                commande.materiauxLivres = Math.max(0, commande.materiauxLivres);

                // Si la commande était terminée et que la quantité livrée est maintenant inférieure à la quantité commandée, la remettre en "en cours"
                if (commande.etat === ETAT_COMMANDE.Terminée && (commande.nourritureLivree < commande.totalNourritureDemandee || commande.materiauxLivres < commande.totalMateriauxDemandes)) {
                    commande.etat = ETAT_COMMANDE["En cours"];
                    console.log(`Commande ${commande.id} repassée en statut "En cours" suite à annulation.`);
                }

                // Pour chaque convoi annulé, préparer et poster un message de "livraison négative"
                for (let i = 0; i < annulation.nombreAnnulations; i++) {
                    const convoiAnnulation = new Convoi({
                        expediteur: monProfil.pseudo,
                        destinataire: annulation.destinataire,
                        nourriture: -annulation.nourriture, // Quantité négative d'un seul convoi
                        materiaux: -annulation.materiaux,   // Quantité négative d'un seul convoi
                        dateArrivee: annulation.dateArrivee,
                        idCommande: annulation.idCommande
                    });

                    const messageForum = convoiAnnulation.toUtilitaire();
                    console.log(`Message forum à envoyer pour convoi annulé ${i + 1}:`, messageForum);

                    this._utilitaire.envoyerMessage(annulation.idCommande, messageForum).then(() => {
                        console.log(`Message d'annulation posté pour commande ${annulation.idCommande} (convoi ${i + 1}/${annulation.nombreAnnulations}).`);
                        // Optionnel: Afficher une notification à l'utilisateur après le dernier message
                        if (i === annulation.nombreAnnulations - 1) {
                            $.toast({...TOAST_INFO, text : `Annulation(s) de convoi(s) enregistrée(s) pour la commande ${annulation.idCommande}.`});
                        }
                    }).catch(error => {
                        console.error(`Erreur lors du post du message d'annulation pour commande ${annulation.idCommande} (convoi ${i + 1}/${annulation.nombreAnnulations}):`, error);
                        $.toast({...TOAST_ERROR, text : `Erreur lors de l'enregistrement de l'annulation pour la commande ${annulation.idCommande}.`});
                    });
                }

                // Sauvegarder l'état mis à jour de la commande sur le forum
                this._utilitaire.modifierSujet(commande.toUtilitaire(), " ", commande.id).then(() => {
                    console.log(`Commande ${commande.id} mise à jour sur le forum après annulation.`);
                }).catch(error => {
                    console.error(`Erreur lors de la mise à jour de la commande ${commande.id} sur le forum après annulation:`, error);
                    $.toast({...TOAST_ERROR, text : `Erreur lors de la mise à jour de la commande ${commande.id} sur le forum.`});
                });

            } else {
                console.warn(`Commande avec ID ${annulation.idCommande} non trouvée pour traiter l'annulation.`, annulation);
            }
        });

        // Étape 7: Mise à jour locale des données
        // Les données des commandes (this._utilitaire.commande) ont été mises à jour en mémoire à l'étape 5.
        // Elles seront conservées pour la session actuelle.

        console.log("[PageCommerce] Fin de gererAnnulationsConvois");
    }
    /**
    * Extrait les convois actuellement actifs affichés sur la page commerce.
    *
    * @private
    * @method getConvoisActifsPage
    * @return {Array} Liste des convois actifs extraits.
    */
    getConvoisActifsPage() {
        let listeConvoi = new Array(), nombres = new Array();
		$("#centre > strong").each((i, elt) => {
            // Affichage du retour des convois (cette partie n'est pas nécessaire pour l'extraction, mais je la laisse pour l'instant)
            if($(elt).next().text().indexOf("Retour") == -1)
                $(elt).after(`<span class='small'>- Retour le ${Utils.roundMinute(Utils.timeToInt($(elt).text().split("dans")[1].trim())).format("D MMM YYYY à HH[h]mm")}</span>`);
            nombres = $(elt).text().replace(/ /g, '').split("dans")[0].match(/^\d+|\d+\b|\d+(?=\w)/g);
            listeConvoi.push({
                "cible" : $(elt).find("a").text(),
                "sens" : $(elt).text().includes("livrer"),
                "nou" : parseInt(nombres[0]), // Convertir en nombre
                "mat" : parseInt(nombres[1]), // Convertir en nombre
                "exp" : Utils.roundMinute(Utils.timeToInt($(elt).text().split("dans")[1].trim()))
            });
        });
        // tri les convois par ordre d'arrivée (pas strictement nécessaire pour l'étape 1, mais peut être utile plus tard)
        listeConvoi.sort((a, b) => {return moment(a.exp).diff(moment(b.exp));});

        return listeConvoi;
    }
	/**
	* Sauvegarde les convois en cours.
    *
	* @private
	* @method saveConvoi
	* @param {Array} liste des convois en cours.
	*/
	saveConvoi(liste)
	{
        if(!this._boiteComptePlus.hasOwnProperty("convoi") || this._boiteComptePlus.convoi.length != liste.length || this._boiteComptePlus.convoi[0]["cible"] != liste[0]["cible"] || liste[0]["exp"].diff(this._boiteComptePlus.convoi[0]["exp"], 's') > 1 && !Utils.comptePlus && $("#boiteComptePlus").length){
            this._boiteComptePlus.convoi = liste;
            this._boiteComptePlus.startConvoi = moment();
            this._boiteComptePlus.sauvegarder().majConvoi();
        }
        return this;
	}
    /**
	* Affiche les commandes en cours issu de l'utilitaire.
    *
	* @private
	* @method afficherCommande
    * @param {Object} liste des lignes de commandes.
	*/
	afficherCommande()
	{
        let total = 0, totalRouge = 0, tabCommandeAff = new Array(), tabCommandePersoEnCours = new Array();
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
            // ajout des commandes à verifier pour vois les convois
            // on affiche les convois pour nos commandes en cours
            // on affiche les conboi pour les commandes terminés de moins de 1 jour
            if(this._utilitaire.commande[id].demandeur.pseudo == monProfil.pseudo)
                if(this._utilitaire.commande[id].etat == ETAT_COMMANDE["En cours"] || (this._utilitaire.commande[id].etat == ETAT_COMMANDE["Terminée"] && this._utilitaire.commande[id].estTermineRecent()))
                    tabCommandePersoEnCours.push(id);
        }

        // Créer la structure HTML du tableau (sans les lignes de données)
        let contenu = `<div id="o_listeCommande" class="simulateur centre o_marginT15"><h2>Commandes</h2><table id='o_tableListeCommande' class="o_maxWidth" cellspacing=0>
            <thead><tr class="ligne_paire"><th>Pseudo</th><th>Date commande</th><th>Évolution</th><th>Qté demandée ${IMG_POMME}</th><th>Qté demandée ${IMG_MAT}</th><th>Qté à livrer ${IMG_POMME}</th><th>Qté à livrer ${IMG_MAT}</th><th>Échéance</th><th>Statut</th><th>État</th><th>Temps de trajet</th><th>Livrer</th><th>Options</th></tr></thead>
            <tfoot><tr class='gras ${tabCommandeAff.length % 2 ? "ligne_paire" : ""}'><td colspan='13'>${tabCommandeAff.length} commande(s) : ${numeral(total).format("0.00 a")} ~ <span class='red'>${numeral(totalRouge).format("0.00 a")}</span> en retard !</td></tr></tfoot></table></div><br/>`;

        $("#centre .Bas").before(contenu);

        // Initialiser DataTables avec les données
        $("#o_tableListeCommande").DataTable({
            data: tableData, // Passer les données ici
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
            ],
            // Ajouter des render functions pour attacher les événements si nécessaire
            // ou utiliser la délégation d'événements après l'initialisation du tableau
            createdRow: (row, data, dataIndex) => {
                // Attacher les événements aux boutons "Livrer", "Modifier", "Supprimer"
                const commandeId = tabCommandeAff[dataIndex]; // Récupérer l'ID de la commande correspondant à la ligne
                const commande = this._utilitaire.commande[commandeId];

                $(row).find(`#o_commande${commandeId}`).on('click', (e) => {
                    e.preventDefault();
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

                $(row).find(`#o_modifierCommande${commandeId}`).on('click', (e) => {
                    e.preventDefault();
                    let boiteCommande = new BoiteCommande(commande, this._utilitaire, this);
                    boiteCommande.afficher();
                    return false;
                });

                $(row).find(`#o_supprimerCommande${commandeId}`).on('click', (e) => {
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
            }
        });

        // Supprimer la boucle d'ajout d'événements après l'initialisation de DataTables
        // for(let id of tabCommandeAff)
        //      this._utilitaire.commande[id].ajouterEvent(this, this._utilitaire);

        $("#o_tableListeCommande_wrapper .dt-buttons").prepend(`<a id="o_ajouterCommande" class="dt-button" href="#"><span>Commander</span></a>`);
        $("#o_ajouterCommande").click((e) => {
            let boiteCommande = new BoiteCommande(new Commande(), this._utilitaire, this);
            boiteCommande.afficher();
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
            console.error("Erreur lors de l'actualisation des convois:", error);
            // Gérer l'erreur si nécessaire
        });
    }
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
            let materiaux = numeral($("#nbMateriaux").val()).value();
            let nourriture = numeral($("#nbNourriture").val()).value();

            if (materiaux === 0 && nourriture === 0) {
                $.toast({...TOAST_ERROR, text : "Impossible de lancer un convoi vide."});
                e.preventDefault();
                return false;
            }

            if(idCommande != -1){ // Enrengistrement du convoi
                e.preventDefault();
                let monConvoi = new Convoi({
                    expediteur  : monProfil.pseudo,
                    destinataire : $("#pseudo_convoi").val(),
                    materiaux   : numeral($("#nbMateriaux").val()).value(),
                    nourriture  : numeral($("#nbNourriture").val()).value(),
                    idCommande  : numeral(idCommande).value(),
                    dateArrivee : moment().add(monProfil.getTempsParcours2(this._utilitaire.commande[idCommande].demandeur), 's')
                });
                // enregistrement
                this._utilitaire.envoyerMessage(idCommande, monConvoi.toUtilitaire()).then((data) => {
                    // Mise a jour des commandes
                    this._utilitaire.commande[idCommande].ajouteConvoi(monConvoi);
                    this._utilitaire.modifierSujet(this._utilitaire.commande[idCommande].toUtilitaire(), " ", idCommande).then((data) => {
                        // si la commande est terminé on passe la suivante en attente en cours si il n'y a pas d'autres en cours
                        let cmdSuivante = 99999999999999999;
                        for(let id in this._utilitaire.commande){
                            if(this._utilitaire.commande[id].etat == ETAT_COMMANDE["En cours"]){
                                cmdSuivante = 99999999999999999
                                break;
                            }
                            if(this._utilitaire.commande[id].etat == ETAT_COMMANDE["En attente"] && id < cmdSuivante)
                                cmdSuivante = id;
                        }
                        if(cmdSuivante != 99999999999999999){
                            this._utilitaire.commande[cmdSuivante].etat = ETAT_COMMANDE["En cours"];
                            this._utilitaire.modifierSujet(this._utilitaire.commande[cmdSuivante].toUtilitaire(), " ", cmdSuivante).then((data) => {
                                $.toast({...TOAST_SUCCESS, text : "Nouvelle commande en cours à jour."});
                            }, (jqXHR, textStatus, errorThrown) => {
                                $.toast({...TOAST_ERROR, text : "Une erreur réseau a été rencontrée lors de la mise à jour des commandes."});
                            });
                        }
                        // Lancement du convoi dans fourmizzz
                        $("input[name='convoi']").trigger("click");
                        // Actualiser le tableau des convois après l'envoi
                        this.actualiserConvois();
                    }, (jqXHR, textStatus, errorThrown) => {
                         $.toast({...TOAST_ERROR, text : "Une erreur réseau a été rencontrée lors de la mise à jour des commandes."});
                    });
                }, (jqXHR, textStatus, errorThrown) => {
                    $.toast({...TOAST_ERROR, text : "Une erreur réseau a été rencontrée lors de l'enregistrement de votre convoi."});
                });
                $("#o_idCommande").val("-1");
            }
        });
        $("#o_resetConvoi").click((e) => {
            e.preventDefault();
            $("#pseudo_convoi, #input_nbNourriture, #input_nbMateriaux, #input_nbOuvriere, #o_idCommande").val("");
            return false;
        });
        return this;
	}
}
