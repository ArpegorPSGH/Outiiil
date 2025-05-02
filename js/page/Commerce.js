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
        // Si on dispose d'un utilitaire pour le commerce on affiche les outils
        if(monProfil.parametre["forumCommande"].valeur){
            // recuperation des commandes sur l'utilitaire
            this._utilitaire.consulterSection(monProfil.parametre["forumCommande"].valeur).then((data) => {
                // chargerCommande retourne maintenant une Promise
                this._utilitaire.chargerCommande(data).then(() => {
                    this.afficherCommande();
                }).catch((error) => {
                    // Gérer les erreurs de chargerCommande si nécessaire
                    console.error("Erreur lors du chargement des commandes:", error);
                });
            }, (jqXHR, textStatus, errorThrown) => {
                $.toast({...TOAST_ERROR, text : "Une erreur réseau a été rencontrée lors de la récupération des commandes."});
            });
            this.formulaireConvoi();
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
            <thead><tr class="ligne_paire"><th>Pseudo</th><th>Date commande</th><th>Qté demandée ${IMG_POMME}</th><th>Qté demandée ${IMG_MAT}</th><th>Qté à livrer ${IMG_POMME}</th><th>Qté à livrer ${IMG_MAT}</th><th>Echéance</th><th>Status</th><th>État</th><th>Temps de trajet</th><th>Livrer</th><th>Options</th></tr></thead>
            <tfoot><tr class='gras ${tabCommandeAff.length % 2 ? "ligne_paire" : ""}'><td colspan='12'>${tabCommandeAff.length} commande(s) : ${numeral(total).format("0.00 a")} ~ <span class='red'>${numeral(totalRouge).format("0.00 a")}</span> en retard !</td></tr></tfoot></table></div><br/>`;

        $("#centre .Bas").before(contenu);

        // Initialiser DataTables avec les données
        $("#o_tableListeCommande").DataTable({
            data: tableData, // Passer les données ici
            bInfo : false,
            bPaginate : false,
            bAutoWidth : false,
            dom : "Bfrti",
            buttons : ["colvis", "copyHtml5", "csvHtml5", "excelHtml5"],
            order : [[6, "desc"]], // Index de colonne ajusté pour l'échéance
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
                {type : "quantite-grade", targets : [4, 5]}, // Indices ajustés
                {type : "moment-D MMM YYYY", targets : 6}, // Indice ajusté
                {type : "time-unformat", targets : 9}, // Indice ajusté
                {sortable : false, targets : [10, 11]}, // Indices ajustés
                {visible: false, targets: [2, 3]} // Indices ajustés pour les quantités demandées
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
        // récuperation des convois sur l'utilitaire
        this.afficherConvoi(tabCommandePersoEnCours);
        return this;
	}
    /**
    *
    */
    actualiserCommande()
    {
        let total = 0, totalRouge = 0, tabCommandeAff = new Array();
        let tableData = []; // Tableau pour les données de DataTables

        for(let id in this._utilitaire.commande){
            if(this._utilitaire.commande[id].estAFaire()){
                const commande = this._utilitaire.commande[id];
                 // Construire un tableau de données pour chaque ligne
                const rowData = [
                    commande.demandeur.getLienFourmizzz(), // Pseudo
                    moment(commande.dateCommande).format("D MMM YYYY"), // Date commande
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
        $("#o_tableListeCommande").DataTable().clear().rows.add(tableData).draw(); // Utiliser les données structurées
        // Les événements sont attachés via createdRow dans afficherCommande, pas besoin ici
        // for(let id of tabCommandeAff)
        //     this._utilitaire.commande[id].ajouterEvent(this, this._utilitaire);
        // mise à jour du tfoot
        $("#o_tableListeCommande tfoot").html(`<tr class='gras ${tabCommandeAff.length % 2 ? "ligne_paire" : ""}'><td colspan='12'>${tabCommandeAff.length} commande(s) : ${numeral(total).format("0.00 a")} ~ <span class='red'>${numeral(totalRouge).format("0.00 a")}</span> en retard !</td></tr>`); // colspan ajusté
        return this;
    }
    /**
    * Afficher les convois en cours.
    *
    * @private
	* @method afficherConvoi
    */
    afficherConvoi(tabCommande)
    {
        if(!Utils.comptePlus){
            for(let id of tabCommande){
                this._utilitaire.consulterSujet(id).then((data) => {
                    let response = $(data).find("cmd:eq(1)").text();
                    if(response.includes("Vous n'avez pas accès à ce forum."))
                        $.toast({...TOAST_ERROR, text : "L'identifiant du sujet pour les convois est érroné."});
                    else{
                        let convoi = null, message = "", nombres = new Array();
                        $("<div/>").append(response).find(".messageForum").each((i, elt) => {
                            message = $(elt).text();
                            if(message.trim()){
                                nombres = message.replace(/ /g, '').split("dans")[0].match(/^\d+|\d+\b|\d+(?=\w)/g);
                                convoi = new Convoi({expediteur : $(elt).prev().find("a").text(), destinataire : monProfil.pseudo, nourriture : nombres[0], materiaux : nombres[1], idCommande : id, dateArrivee : moment(message.split("Retour le ")[1], "D MMM YYYY à HH[h]mm")});
                                // si la commande est toujours en cours et que je suis le destinaitaire et que le convoi est n'est pas encore arrivée
                                if(!convoi.estTermine())
                                    convoi.toHTML($("h3:contains('Convois en cours:')").length ? "h3" : ".simulateur:first", convoi.type);
                            }
                        });
                    }
                }, (jqXHR, textStatus, errorThrown) => {
                     $.toast({...TOAST_ERROR, text : "Une erreur réseau a été rencontrée lors de la récupération des convois."});
                });
            }
            this.plus();
        }
        return this;
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
