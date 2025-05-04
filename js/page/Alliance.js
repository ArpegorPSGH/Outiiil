/*
 * Alliance.js
 * Hraesvelg
 **********************************************************************/

/**
* Classe de fonction pour la page /alliance.php.
*
* @class PageAlliance
* @constructor
*/
class PageAlliance
{
    constructor()
    {
        /**
        * Creation du modele Alliance
        */
        this._alliance = new Alliance({tag : Utils.alliance});
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
        // si les membres sont deja chargé on peux executé la fonction sinon on observe
        if($("#tabMembresAlliance").length)
            this.traitementMembre();
        else{
            // Ajout des infos sur le tableau des membres
            let observer = new MutationObserver((mutationsList) => {
                this.traitementMembre();
                observer.disconnect();
            });
            observer.observe($("#alliance")[0], {childList : true});
        }
        return this;
    }
    /**
	* Affiche les modifications du tableau des membres.
    *
	* @private
	* @method traitementMembre
    */
    traitementMembre()
    {
        $("#tabMembresAlliance td:eq(5)").css("white-space", "nowrap");
        $(".simulateur table[class='ligne_paire'] tr:eq(0) td:eq(1)").append(` (${$("img[alt='Actif']").length})`);
        $(".simulateur table[class='ligne_paire'] tr:eq(0) td:eq(3)").append(` (${$("img[alt='Vacances']").length})`);
        $(".simulateur table[class='ligne_paire'] tr:eq(1) td:eq(1)").append(` (${$("img[alt='Inactif depuis 3 jours']").length})`);
        $(".simulateur table[class='ligne_paire'] tr:eq(1) td:eq(3)").append(` (${$("img[alt='Bannie']").length})`);
        $(".simulateur table[class='ligne_paire'] tr:eq(2) td:eq(1)").append(` (${$("img[alt='Inactif depuis 10 jours']").length})`);
        $(".simulateur table[class='ligne_paire'] tr:eq(2) td:eq(3)").append(` (${$("img[alt='Colonisé']").length})`);
        // ajout des totaux de l'alliance
        let tmpJoueurs = {};
        $("#tabMembresAlliance tr:gt(0)").each((i, elt) => {
            let pseudo = $(elt).find("td:eq(3)").text(), terrain = numeral($(elt).find("td:eq(5)").text()).value();
            tmpJoueurs[pseudo] = new Joueur({
                pseudo : pseudo,
                terrain : terrain,
                fourmiliere : ~~($(elt).find("td:eq(8)").text()),
                technologie : ~~($(elt).find("td:eq(7)").text())
            });
            if(!Utils.comptePlus && !tmpJoueurs[pseudo].estJoueurCourant()){
                if(tmpJoueurs[pseudo].estAttaquable())
                    $(elt).find("td:eq(6)").html(IMG_ATT);
                if(tmpJoueurs[pseudo].estAttaquant())
                    $(elt).find("td:eq(4)").html(IMG_DEF);
            }
        });
        this._alliance.joueurs = tmpJoueurs;

        $("#tabMembresAlliance").append(`<tfoot class='${Object.keys(this._alliance.joueurs).length % 2 ? "ligne_paire" : ""}'><tr class='gras centre'><td colspan='12'>Terrain : <span id='totalTerrain'>${numeral(this._alliance.calculTerrain()).format()}</span> cm² | Fourmilière : ${numeral(this._alliance.calculFourmiliere()).format()} | Technologie : ${numeral(this._alliance.calculTechnologie()).format()}.</td></tr></tfoot>`);
        // Recupération des données de l'utilitaire sinon on met en forme le tableau directement
        $("#tabMembresAlliance tr:first").remove();
		$("#tabMembresAlliance").prepend(`<thead><tr class='alt'><th></th><th></th><th>Rang</th><th>Pseudo</th><th></th><th>Terrain</th><th></th><th><span style='padding-right:10px'>Technologie</span></th><th><span style='padding-right:10px'>Fourmiliere</span></th><th colspan='2'>État</th><th></th></tr></thead>`);

        // Si on dispose d'un utilitaire pour la gestion des membres ET que le joueur a un sujet dans la section membres
        const idSectionMembre = monProfil.parametre["forumMembre"].valeur;
        const pseudoJoueur = monProfil.pseudo;

        if (idSectionMembre) {
            this._utilitaire.verifierSujetMembre(idSectionMembre, pseudoJoueur).then(sujetExiste => {
                if (sujetExiste) {
                    // recuperation des données sur l'utilitaire
                    this._utilitaire.consulterSection(idSectionMembre).then((data) => {
                        if(this._utilitaire.chargerJoueur(data)) {
                            this.traitementUtilitaire();
                            // --- START: Ajout bouton et logique Recensement ---
                            const dtButtonsContainer = $("#tabMembresAlliance_wrapper .dt-buttons");
                            console.log("Résultat du sélecteur .dt-buttons:", dtButtonsContainer.length > 0, "Nombre d'éléments trouvés:", dtButtonsContainer.length);
                            if (dtButtonsContainer.length > 0) {
                                // Insérer le bouton Recensement APRÈS le bouton Actualiser (qui est ajouté dans optionAdmin si l'utilisateur a les droits)
                                // On suppose que optionAdmin() a déjà été appelée si l'utilisateur a les droits.
                                // Si l'utilisateur n'a pas les droits, le bouton Actualiser ne sera pas là,
                                // mais le bouton Recensement ne sera ajouté que si sujetExiste est vrai.
                                // On ajoute le bouton Recensement après le bouton Actualiser s'il existe, sinon au début du conteneur.
                                const $actualiserButton = $("#o_actualiserAlliance");
                                if ($actualiserButton.length > 0) {
                                     $(`<a id="o_recensementButton" class="dt-button" href="#"><span>Recensement</span></a>`).insertAfter($actualiserButton);
                                } else {
                                     dtButtonsContainer.prepend(`<a id="o_recensementButton" class="dt-button" href="#"><span>Recensement</span></a>`);
                                }

                                // Ajouter ici un span pour le loading si souhaité (il faudrait l'insérer aussi après le bouton Recensement)
                                // Ex: $(`<span id="o_recensementLoading" style="display:none;">...</span>`).insertAfter("#o_recensementButton");

                                // Fonction pour gérer le clic sur le bouton Recensement
                                async function handleRecensementClick(e) {
                                    e.preventDefault(); // Prevent default link action
                                    const $button = $(e.currentTarget);
                                    // Utiliser le style de traitement de datatables ou simplement désactiver
                                    $button.addClass('processing').css('pointer-events', 'none'); // Désactiver clics + style visuel

                                    // Afficher un indicateur de chargement à côté (optionnel, nécessite un span HTML)
                                    // $("#o_recensementLoading").show(); // Supposons qu'un span avec cet ID existe

                                    try {
                                        // --- Étape 1: Récupérer Armée ---
                                        console.log("Récupération des données d'armée...");
                                        const htmlArmee = await $.ajax({ url: "/Armee.php" });
                                        const unites = Armee.parseHtml(htmlArmee); // Utilise la méthode statique
                                        console.log("Données d'armée récupérées:", unites);

                                        // --- Étape 2: Collecter & Formater ---
                                        console.log("Collecte et formatage des données...");
                                        let messageLines = [];
                                        messageLines.push(`Nourriture: ${numeral(Utils.nourriture).format()}`);
                                        messageLines.push(`Matériaux: ${numeral(Utils.materiaux).format()}`);
                                        messageLines.push(`Terrain de Chasse: ${numeral(Utils.terrain).format()} cm²`);

                                        messageLines.push("\n--- Constructions ---");
                                        CONSTRUCTION.forEach((nom, index) => {
                                            if (monProfil.niveauConstruction[index] > -1) {
                                                messageLines.push(`${nom}: ${monProfil.niveauConstruction[index]}`);
                                            }
                                        });

                                        messageLines.push("\n--- Recherches ---");
                                        RECHERCHE.forEach((nom, index) => {
                                            if (monProfil.niveauRecherche[index] > -1) {
                                                messageLines.push(`${nom}: ${monProfil.niveauRecherche[index]}`);
                                            }
                                        });

                                        messageLines.push("\n--- Unités ---");
                                        const nbOuvrieres = Utils.ouvrieres;
                                        messageLines.push(`Ouvrière: ${numeral(nbOuvrieres).format()}`);

                                        if (Object.keys(unites).length > 0) {
                                            // Trier les unités par leur ordre dans NOM_UNITE pour la cohérence
                                            const unitesOrdonnees = {};
                                            NOM_UNITE.forEach(nom => {
                                                if (unites[nom] !== undefined && nom !== "Ouvrière") { // Exclure Ouvrière déjà ajoutée
                                                    unitesOrdonnees[nom] = unites[nom];
                                                }
                                            });
                                            for (const [nom, qte] of Object.entries(unitesOrdonnees)) {
                                                 messageLines.push(`${nom}: ${numeral(qte).format()}`);
                                            }
                                        } else {
                                            messageLines.push("Aucune unité militaire trouvée (ou erreur lors de la récupération).");
                                        }

                                        const messageFormatte = messageLines.join("\n");
                                        console.log("Message formaté:\n", messageFormatte);

                                        // --- Étape 3: Envoyer au Forum ---
                                        let idSujet = monProfil.sujetForum;
                                        const forumManager = new PageForum(); // Assumes PageForum is available globally or imported

                                        if (!idSujet) {
                                            console.log("ID Sujet non trouvé dans monProfil, recherche dans la section...");
                                            const idSection = monProfil.parametre["forumMembre"]?.valeur;
                                            if (!idSection) {
                                                throw new Error("ID de la section forum 'Outiiil_Membre' non trouvé dans les paramètres.");
                                            }

                                            console.log(`Consultation de la section ${idSection} pour trouver le sujet de ${monProfil.pseudo}`);
                                            const htmlSectionData = await forumManager.consulterSection(idSection);

                                            const responseHtml = $(htmlSectionData).find("cmd:eq(1)").text();
                                            if (!responseHtml) {
                                                 throw new Error("Réponse invalide lors de la consultation de la section forum.");
                                            }
                                            const $sectionContent = $("<div/>").append(responseHtml);
                                            let foundId = null;

                                            $sectionContent.find("#form_cat tr:gt(0)").each((i, elt) => {
                                                const $row = $(elt);
                                                const titreSujet = $row.find("td:eq(1)").text().trim();
                                                if (titreSujet.startsWith(monProfil.pseudo + " /")) {
                                                    const onclickAttr = $row.find("a.topic_forum").attr("onclick");
                                                    if (onclickAttr) {
                                                        const match = onclickAttr.match(/callGetTopic\((\d+)\)/);
                                                        if (match && match[1]) {
                                                            foundId = match[1];
                                                            return false;
                                                        }
                                                    }
                                                    const inputVal = $row.find("input[name='topic[]']").val();
                                                    if (inputVal) {
                                                         foundId = inputVal;
                                                         return false;
                                                    }
                                                }
                                            });

                                            if (!foundId) {
                                                throw new Error(`Sujet forum pour '${monProfil.pseudo}' non trouvé dans la section Outiiil_Membre.`);
                                            }
                                            idSujet = foundId;
                                            console.log(`ID Sujet trouvé: ${idSujet}`);
                                        } else {
                                             console.log(`Utilisation de l'ID sujet pré-enregistré: ${idSujet}`);
                                        }

                                        console.log(`Envoi du message au sujet ${idSujet}...`);
                                        await forumManager.envoyerMessage(idSujet, encodeURIComponent(messageFormatte));
                                        $.toast({...TOAST_SUCCESS, text: "Statistiques postées sur le forum."});
                                        console.log("Message envoyé avec succès.");

                                    } catch (error) {
                                        console.error("Erreur lors du post des stats:", error);
                                        $.toast({...TOAST_ERROR, heading: "Erreur Recensement", text: `${error.message || 'Une erreur est survenue.'}`});
                                    } finally {
                                        // --- Étape Finale ---
                                        console.log("Fin de l'opération Recensement.");
                                        $button.removeClass('processing').css('pointer-events', 'auto'); // Réactiver
                                        // $("#o_recensementLoading").hide(); // Cacher l'indicateur si utilisé
                                    }
                                }

                                 $("#o_recensementButton").click(handleRecensementClick);
                                 // --- END: Ajout bouton et logique Recensement ---
                            } else {
                                console.log("Conteneur .dt-buttons non trouvé.");
                            }
                            this.optionAdmin(); // Appeler optionAdmin si traitementUtilitaire est réussi
                        } else {
                            this.tableau();
                            this.optionAdmin(); // Appeler optionAdmin si chargerJoueur échoue mais section existe
                        }
                    }, (jqXHR, textStatus, errorThrown) => {
                        $.toast({...TOAST_ERROR, text : "Une erreur réseau a été rencontrée lors de la récupération des membres."});
                        this.tableau(); // Fallback to basic table if API call fails
                        this.optionAdmin(); // Appeler optionAdmin en cas d'erreur réseau si section existe
                    });
                } else {
                    console.log("Sujet membre non trouvé. Les colonnes supplémentaires ne seront pas affichées.");
                    this.tableau(); // Afficher le tableau sans les colonnes supplémentaires
                    this.optionAdmin(); // Appeler optionAdmin si sujet membre n'existe pas mais section existe
                    // Optionnel: Afficher un message à l'utilisateur
                    // $.toast({...TOAST_INFO, text : "Votre sujet membre n'a pas été trouvé. Les colonnes supplémentaires ne sont pas disponibles."});
                }
            }).catch(error => {
                console.error("Erreur lors de la vérification du sujet membre:", error);
                this.tableau(); // Fallback to basic table if verification fails
                this.optionAdmin(); // Appeler optionAdmin en cas d'erreur de vérification si section existe
                // Optionnel: Afficher un message d'erreur
                // $.toast({...TOAST_ERROR, text : "Erreur lors de la vérification de votre sujet membre."});
            });
        } else {
            console.log("Paramètre forumMembre non configuré. Les colonnes supplémentaires ne seront pas affichées.");
            this.tableau(); // Afficher le tableau sans les colonnes supplémentaires
            // Dans ce cas, optionAdmin ne doit PAS être appelée selon la clarification de l'utilisateur.
            // Optionnel: Afficher un message à l'utilisateur
            // $.toast({...TOAST_INFO, text : "Le paramètre forumMembre n'est pas configuré. Les colonnes supplémentaires ne sont pas disponibles."});
        }

        return this;
    }
    /**
	* Ajoute le tri.
    *
	* @private
	* @method tableau
	*/
	tableau()
	{
        $("#tabMembresAlliance th:eq(7), #tabMembresAlliance th:eq(8)").css({maxWidth:"50px",textOverflow:"ellipsis",overflow:"hidden"});
        $("#tabMembresAlliance").DataTable({
            bInfo : false,
            bPaginate : false,
            bAutoWidth : false,
            dom : "Bfrti",
            buttons : ["colvis", "copyHtml5", "csvHtml5", "excelHtml5"],
            order : [],
            stripeClasses : ["", "alt"],
            responsive : true,
            language : {
                zeroRecords : "Aucun joueur trouvé",
                infoEmpty : "Aucun enregistrement",
                infoFiltered : "(Filtré par _MAX_ enregistrements)",
                search : "Rechercher : ",
                buttons : {colvis : "Colonne"}
            },
            columnDefs : [
                {type : "quantite-grade", targets : 5},
                {sortable : false, targets : [0, 1, 4, 6, 10, 11]}
            ]
        });
        return this;
	}
    /**
	* Ajout des infos du SDC.
    *
	* @private
	* @method traitementUtilitaire
	*/
    traitementUtilitaire()
    {
        for(let pseudo in this._utilitaire.alliance.joueurs){
            // si la clé est une clé du tableau des memres
            if(this._alliance.joueurs.hasOwnProperty(pseudo)){
                this._alliance.joueurs[pseudo].x = this._utilitaire.alliance.joueurs[pseudo].x;
                this._alliance.joueurs[pseudo].y = this._utilitaire.alliance.joueurs[pseudo].y;
                this._alliance.joueurs[pseudo].id = this._utilitaire.alliance.joueurs[pseudo].id;
                this._alliance.joueurs[pseudo].sujetForum = this._utilitaire.alliance.joueurs[pseudo].sujetForum;
                this._alliance.joueurs[pseudo].rang = this._utilitaire.alliance.joueurs[pseudo].rang;
                this._alliance.joueurs[pseudo].ordreRang = this._utilitaire.alliance.joueurs[pseudo].ordreRang;
            }
        }
        // On retraicie les colonnes des niveaux
        $("#tabMembresAlliance th:eq(1)").after(`<th>Grade</th>`);
        $("#tabMembresAlliance th:eq(9)").after(`<th>Tdt</th><th>Retour</th>`);
        $("#tabMembresAlliance tfoot td:eq(0)").attr("colspan", 15);
        // On compléte les données
        $("#tabMembresAlliance tr:gt(0):lt(-1)").each((i, elt) => {
            let pseudo = $(elt).find("td:eq(3)").text();
            // si nous avons les coordonnées on affiche les tempts de trajet
            $(elt).find("td:eq(1)").after(`<td align="center">${this._alliance.joueurs.hasOwnProperty(pseudo) ? this._alliance.joueurs[pseudo].rang : Utils.alliance}</td>`);
            $(elt).find("td:eq(9)").after(this._alliance.joueurs[pseudo].x != -1 && this._alliance.joueurs[pseudo].y != -1 ? `<td>${Utils.intToTime(monProfil.getTempsParcours2(this._alliance.joueurs[pseudo]))}</td><td>${Utils.roundMinute(monProfil.getTempsParcours2(this._alliance.joueurs[pseudo])).format("D MMM à HH[h]mm")}</td>` : `<td>N/C</td><td>N/C</td>`);
            // si on est chef de l'alliance on peut modifier les rangs et que le joueur est dans l'utilitaire
            if($("img[src='images/crayon.gif']").length && this._alliance.joueurs.hasOwnProperty(pseudo)){
                $(elt).find("td:eq(0)").append(`<a id="o_rang${this._alliance.joueurs[pseudo].id}" href=""><img src="${IMG_UTILITY}" alt="rang"/></a>`);
                $("#o_rang" + this._alliance.joueurs[pseudo].id).click((e) => {
                    let boiteForm = new BoiteRang(this._alliance.joueurs[pseudo], this._utilitaire, this);
                    boiteForm.afficher();
                    return false;
                });
            }
        });
        this.tableauUtilitaire();
        return this;
    }
    /**
    *
    */
    optionAdmin()
    {
        console.log("PageAlliance.optionAdmin() appelée.");
        // si on est chef de l'alliance on peut mettre à jour les membres
        const crayonIcon = $("img[src='images/crayon.gif']");
        console.log("Résultat du sélecteur crayon.gif:", crayonIcon.length > 0, "Nombre d'éléments trouvés:", crayonIcon.length);
        if(crayonIcon.length){
            console.log("Condition crayon.gif est vraie. Tentative d'ajout des boutons.");
            const dtButtonsContainer = $("#tabMembresAlliance_wrapper .dt-buttons");
            console.log("Résultat du sélecteur .dt-buttons:", dtButtonsContainer.length > 0, "Nombre d'éléments trouvés:", dtButtonsContainer.length);
            if (dtButtonsContainer.length > 0) {
                dtButtonsContainer.prepend(`<a id="o_actualiserAlliance" class="dt-button" href="#"><span>Actualiser l'alliance</span></a>`);
                // Retrait de la marge droite forcée sur le premier bouton
                // $("#o_actualiserAlliance").css("margin-right", "0.333em"); // Ligne retirée
                $("#o_actualiserAlliance").click(async (e) => { // Utilisation de async
                    e.preventDefault(); // Empêcher l'action par défaut du lien

                    const idSectionMembre = monProfil.parametre["forumMembre"]?.valeur;

                    if (!idSectionMembre) {
                         $.toast({...TOAST_ERROR, text : "Le paramètre forumMembre n'est pas configuré."});
                         return false;
                    }

                    try {
                        // Vérifier si les données de l'utilitaire sont déjà chargées
                        if (!this._utilitaire.alliance || !this._utilitaire.alliance.joueurs) {
                            console.log("Données utilitaire non chargées, consultation de la section membre...");
                            const data = await this._utilitaire.consulterSection(idSectionMembre);
                            if (!this._utilitaire.chargerJoueur(data)) {
                                throw new Error("Impossible de charger les données des joueurs depuis le forum.");
                            }
                            console.log("Données utilitaire chargées.");
                        } else {
                            console.log("Données utilitaire déjà chargées.");
                        }

                        let promiseJoueur = new Array(), pseudoJoueur = new Array();
                        // si coordonnée inconnu on va les chercher
                        for(let pseudo in this._alliance.joueurs){ // Utiliser pseudo pour itérer sur les clés
                            const joueur = this._alliance.joueurs[pseudo];
                            // si le joueur n'est pas connu dans l'utilitaire
                            if(!this._utilitaire.alliance.joueurs.hasOwnProperty(pseudo)) // Utiliser pseudo ici aussi
                                this._utilitaire.alliance.joueurs[pseudo] = joueur; // Utiliser pseudo ici aussi
                            // si ses coordonnées ne sont pas connu
                            if(this._utilitaire.alliance.joueurs[pseudo].x == -1 && this._utilitaire.alliance.joueurs[pseudo].y == -1){ // Utiliser pseudo ici aussi
                                promiseJoueur.push(this._utilitaire.alliance.joueurs[pseudo].getProfil()); // Utiliser pseudo ici aussi
                                pseudoJoueur.push(pseudo); // Utiliser pseudo ici aussi
                            }
                        }
                        // on recup les profils de tout les joueurs
                        const valuesProfil = await Promise.all(promiseJoueur); // Utilisation de await

                        let promiseForum = new Array();
                        for(let i = 0 ; i < valuesProfil.length ; i++){
                            const pseudo = pseudoJoueur[i]; // Récupérer le pseudo correspondant
                            const joueurUtilitaire = this._utilitaire.alliance.joueurs[pseudo];
                            joueurUtilitaire.chargerProfil(valuesProfil[i]);
                            // on enregistre
                            if(!joueurUtilitaire.sujetForum)
                                promiseForum.push(this._utilitaire.creerSujet(joueurUtilitaire.toUtilitaire(), " ", idSectionMembre)); // Utiliser idSectionMembre
                        }
                        // on creer les sujets pour les membres qui n'en disposent pas
                        await Promise.all(promiseForum); // Utilisation de await

                        // Après la création potentielle des sujets, vérifier à nouveau le sujet membre
                        // pour s'assurer que monProfil.sujetForum est mis à jour si un sujet a été créé pour le joueur courant.
                        console.log("Vérification du sujet membre après création potentielle...");
                        await this._utilitaire.verifierSujetMembre(idSectionMembre, pseudoJoueur);
                        console.log("Vérification terminée. monProfil.sujetForum est maintenant:", monProfil.sujetForum);

                        $.toast({...TOAST_SUCCESS, text : "la mise à jour c'est correctement effectuée."});
                        this.actualiserMembre();

                    } catch (error) {
                        console.error("Erreur lors de l'actualisation de l'alliance:", error);
                        $.toast({...TOAST_ERROR, heading: "Erreur Actualisation", text: `${error.message || 'Une erreur est survenue.'}`});
                    }

                    return false;
                });

            } else {
                console.log("Conteneur .dt-buttons non trouvé.");
            }
        } else {
            console.log("Condition crayon.gif est fausse. Les boutons ne seront pas ajoutés.");
        }
        return this;
    }
    /**
    *
    */
    actualiserMembre()
    {
        $("#tabMembresAlliance").DataTable().destroy();

        // mise à jour de l'alliance
        for(let pseudo in this._utilitaire.alliance.joueurs){
            // si la clé est une clé du tableau des membres
            if(this._alliance.joueurs.hasOwnProperty(pseudo)){
                this._alliance.joueurs[pseudo].x = this._utilitaire.alliance.joueurs[pseudo].x;
                this._alliance.joueurs[pseudo].y = this._utilitaire.alliance.joueurs[pseudo].y;
                this._alliance.joueurs[pseudo].id = this._utilitaire.alliance.joueurs[pseudo].id;
                this._alliance.joueurs[pseudo].rang = this._utilitaire.alliance.joueurs[pseudo].rang;
                this._alliance.joueurs[pseudo].ordreRang = this._utilitaire.alliance.joueurs[pseudo].ordreRang;
            }
        }

        // On compléte les données
        $("#tabMembresAlliance tr:gt(0):lt(-1)").each((i, elt) => {
            let pseudo = $(elt).find("td:eq(4)").text();
            const joueurData = this._alliance.joueurs.hasOwnProperty(pseudo) ? this._alliance.joueurs[pseudo] : undefined; // Récupérer les données du joueur si elles existent

            // Vérifier si joueurData existe avant d'accéder à .rang
            $(elt).find("td:eq(2)").text(joueurData && joueurData.rang !== undefined ? joueurData.rang : Utils.alliance); // Utiliser joueurData pour le rang

            // Vérifier si les données du joueur existent et si les coordonnées sont connues avant de calculer le temps de trajet
            if (joueurData && joueurData.x !== undefined && joueurData.x !== -1 && joueurData.y !== undefined && joueurData.y !== -1) {
                $(elt).find("td:eq(10)").text(Utils.intToTime(monProfil.getTempsParcours2(joueurData)));
                $(elt).find("td:eq(11)").text(Utils.roundMinute(monProfil.getTempsParcours2(joueurData)).format("D MMM à HH[h]mm"));
            } else {
                $(elt).find("td:eq(10)").text("N/C");
                $(elt).find("td:eq(11)").text("N/C");
            }
        });

        // Vérifier si le joueur a un sujet membre après l'actualisation
        if (monProfil.sujetForum) {
            this.tableauUtilitaire();
        } else {
            this.tableau();
        }

        this.optionAdmin();
        return this;
    }
    /**
	* Ajoute le tri.
    *
	* @private
	* @method tableauUtilitaire
	*/
	tableauUtilitaire()
	{
        $("#tabMembresAlliance th:eq(8), #tabMembresAlliance th:eq(9)").css({maxWidth:"50px",textOverflow:"ellipsis",overflow:"hidden"});
        $("#tabMembresAlliance").DataTable({
            bInfo : false,
            bPaginate : false,
            bAutoWidth : false,
            dom : "Bfrti",
            order : [],
            stripeClasses: ["", "alt"],
            buttons : ["colvis", "copyHtml5", "csvHtml5", "excelHtml5"],
            responsive : true,
            language : {
                zeroRecords : "Aucun joueur trouvé",
                info : "Page _PAGE_ de _PAGES_",
                infoEmpty : "Aucun enregistrement",
                infoFiltered : "(Filtré par _MAX_ enregistrements)",
                search : "Rechercher : ",
                buttons : {colvis : "Colonne"}
            },
            columnDefs : [
                {type : "quantite-grade", targets : 6},
                {visible : false, targets : [3, 8, 9]},
                {sortable : false, targets : [0, 1, 5, 7, 12, 13, 14]}
            ]
        });
        return this;
	}
}
