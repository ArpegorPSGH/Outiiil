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
            let observer = new MutationObserver(async (mutationsList) => { // Rendre la callback asynchrone
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
    async traitementMembre() // Rendre la fonction asynchrone
    {
        // S'assurer que les coordonnées du joueur courant sont chargées
        // S'assurer que les coordonnées du joueur courant sont chargées
        // On force le rechargement du profil pour s'assurer que monProfilJoueur.x et monProfilJoueur.y sont à jour
        try {
            const htmlProfil = await monProfilJoueur.getProfil(); // Utiliser getProfil() pour forcer le rechargement
            if (htmlProfil) {
                monProfilJoueur.chargerProfil(htmlProfil);
            }
        } catch (error) {
            console.error("[PageAlliance] Erreur lors du chargement du profil courant:", error);
            // Continuer même en cas d'erreur, mais les temps de trajet seront N/C
        }

        $("#tabMembresAlliance td:eq(5)").css("white-space", "nowrap");
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

        // Recupération des données de l'utilitaire sinon on met en forme le tableau directement
        $("#tabMembresAlliance tr:first").remove();
		$("#tabMembresAlliance").prepend(`<thead><tr class='alt'><th></th><th></th><th>Rang</th><th>Pseudo</th><th></th><th>Terrain</th><th></th><th><span style='padding-right:10px'>Technologie</span></th><th><span style='padding-right:10px'>Fourmiliere</span></th><th colspan='2'>État</th><th></th></tr></thead>`);

        // Si on dispose d'un utilitaire pour la gestion des membres ET que le joueur a un sujet dans la section membres
        const idSectionMembre = monProfilUtilisateur.parametre["Membres Outiiil"].valeur;
        const pseudoJoueur = monProfilJoueur.pseudo;

        if (idSectionMembre) {
            try {
                const sujetExiste = this._utilitaire.verifierSujetMembre(idSectionMembre, pseudoJoueur);
                if (sujetExiste) {
                    // recuperation des données sur l'utilitaire
                    const data = await this._utilitaire.consulterSection(idSectionMembre);
                    if(this._utilitaire.chargerJoueur(data)) {
                        await this._fusionnerJoueursUtilitaire(); // Appel de la nouvelle méthode

                        // Ajout des totaux de l'alliance après la fusion des joueurs extérieurs
                        const totalTerrain = this._alliance.calculTerrain();
                        const totalFourmiliere = this._alliance.calculFourmiliere();
                        const totalTechnologie = this._alliance.calculTechnologie();
                        const nbJoueurs = Object.keys(this._alliance.joueurs).length;

                        const moyenneTerrain = nbJoueurs > 0 ? totalTerrain / nbJoueurs : 0;
                        const moyenneFourmiliere = nbJoueurs > 0 ? totalFourmiliere / nbJoueurs : 0;
                        const moyenneTechnologie = nbJoueurs > 0 ? totalTechnologie / nbJoueurs : 0;
                        const colspanValue = 15; // Le colspan sera toujours 15 si cette section est exécutée

                        $("#tabMembresAlliance").append(`
                            <tfoot class='${nbJoueurs % 2 ? "ligne_paire" : ""}'>
                                <tr class='gras centre'>
                                    <td colspan='${colspanValue}'>Terrain : <span id='totalTerrain'>${numeral(totalTerrain).format()}</span> cm² | Fourmilière : ${numeral(totalFourmiliere).format()} | Technologie : ${numeral(totalTechnologie).format()}.</td>
                                </tr>
                                <tr class='gras centre'>
                                    <td colspan='${colspanValue}'>Moyenne par joueur : Terrain : ${numeral(moyenneTerrain).format()} cm² | Fourmilière : ${numeral(moyenneFourmiliere).format()} | Technologie : ${numeral(moyenneTechnologie).format()}.</td>
                                </tr>
                            </tfoot>
                        `);

                        this.traitementUtilitaire();
                        // --- START: Ajout bouton et logique Recensement ---
                        const dtButtonsContainer = $("#tabMembresAlliance_wrapper .dt-buttons");
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
                                    const htmlArmee = await $.ajax({ url: "/Armee.php" });
                                    const unites = Armee.parseHtml(htmlArmee); // Utilise la méthode statique

                                    // --- Étape 2: Collecter & Formater ---
                                    let messageLines = [];
                                    messageLines.push(`Nourriture: ${numeral(Utils.nourriture).format()}`);
                                    messageLines.push(`Matériaux: ${numeral(Utils.materiaux).format()}`);
                                    messageLines.push(`Terrain de Chasse: ${numeral(Utils.terrain).format()} cm²`);

                                    messageLines.push("\n--- Constructions ---");
                                    CONSTRUCTION.forEach((nom, index) => {
                                        if (monProfilJoueur.niveauConstruction[index] > -1) {
                                            messageLines.push(`${nom}: ${monProfilJoueur.niveauConstruction[index]}`);
                                        }
                                    });

                                    messageLines.push("\n--- Recherches ---");
                                    RECHERCHE.forEach((nom, index) => {
                                        if (monProfilJoueur.niveauRecherche[index] > -1) {
                                            messageLines.push(`${nom}: ${monProfilJoueur.niveauRecherche[index]}`);
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

                                    // --- Étape 3: Envoyer au Forum ---
                                    let idSujet = monProfilJoueur.sujetForum;
                                    const forumManager = new PageForum(); // Assumes PageForum is available globally or imported

                                    if (!idSujet) {
                                        const idSection = monProfilUtilisateur.parametre["Membres Outiiil"]?.valeur;
                                        if (!idSection) {
                                            throw new Error("ID de la section forum 'Membres Outiiil' non trouvé dans les paramètres.");
                                        }

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
                                            if (titreSujet.startsWith(monProfilJoueur.pseudo + " /")) {
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
                                            throw new Error(`Sujet forum pour '${monProfilJoueur.pseudo}' non trouvé dans la section Membres Outiiil.`);
                                        }
                                        idSujet = foundId;
                                    }

                                    await forumManager.envoyerMessage(idSujet, encodeURIComponent(messageFormatte));
                                    $.toast({...TOAST_SUCCESS, text: "Statistiques postées sur le forum."});

                                } catch (error) {
                                    console.error("Erreur lors du post des stats:", error);
                                    $.toast({...TOAST_ERROR, heading: "Erreur Recensement", text: `${error.message || 'Une erreur est survenue.'}`});
                                } finally {
                                    // --- Étape Finale ---
                                    $button.removeClass('processing').css('pointer-events', 'auto'); // Réactiver
                                    // $("#o_recensementLoading").hide(); // Cacher l'indicateur si utilisé
                                }
                            }

                             $("#o_recensementButton").click(handleRecensementClick);
                             // --- END: Ajout bouton et logique Recensement ---
                        }
                        this.optionAdmin(); // Appeler optionAdmin si traitementUtilitaire est réussi
                    } else {
                        this.tableau();
                        this.optionAdmin(); // Appeler optionAdmin si chargerJoueur échoue mais section existe
                    }
                } else {
                    this.tableau(); // Afficher le tableau sans les colonnes supplémentaires
                    this.optionAdmin(); // Appeler optionAdmin si sujet membre n'existe pas mais section existe
                }
            } catch (error) {
                console.error("Erreur lors de la vérification ou de la consultation du sujet membre:", error);
                $.toast({...TOAST_ERROR, text : "Erreur lors de la récupération des membres."});
                this.tableau(); // Fallback to basic table if verification fails
                this.optionAdmin(); // Appeler optionAdmin en cas d'erreur de vérification si section existe
            }
        } else {
            this.tableau(); // Afficher le tableau sans les colonnes supplémentaires

            // Ajout des totaux de l'alliance sans les colonnes supplémentaires
            const totalTerrain = this._alliance.calculTerrain();
            const totalFourmiliere = this._alliance.calculFourmiliere();
            const totalTechnologie = this._alliance.calculTechnologie();
            const nbJoueurs = Object.keys(this._alliance.joueurs).length;

            const moyenneTerrain = nbJoueurs > 0 ? totalTerrain / nbJoueurs : 0;
            const moyenneFourmiliere = nbJoueurs > 0 ? totalFourmiliere / nbJoueurs : 0;
            const moyenneTechnologie = nbJoueurs > 0 ? totalTechnologie / nbJoueurs : 0;
            const colspanValue = 12; // Le colspan sera 12 si l'utilitaire n'est pas configuré

            $("#tabMembresAlliance").append(`
                <tfoot class='${nbJoueurs % 2 ? "ligne_paire" : ""}'>
                    <tr class='gras centre'>
                        <td colspan='${colspanValue}'>Terrain : <span id='totalTerrain'>${numeral(totalTerrain).format()}</span> cm² | Fourmilière : ${numeral(totalFourmiliere).format()} | Technologie : ${numeral(totalTechnologie).format()}.</td>
                    </tr>
                    <tr class='gras centre'>
                        <td colspan='${colspanValue}'>Moyenne par joueur : Terrain : ${numeral(moyenneTerrain).format()} cm² | Fourmilière : ${numeral(moyenneFourmiliere).format()} | Technologie : ${numeral(moyenneTechnologie).format()}.</td>
                    </tr>
                </tfoot>
            `);
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
            order : [[5, "desc"]], // Tri par défaut par la colonne "Terrain" (index 5) en ordre décroissant
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
                {className: "dt-body-center", targets: "_all"}, // Centrer toutes les cellules du corps du tableau
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
        // On retraicie les colonnes des niveaux
        $("#tabMembresAlliance th:eq(1)").after(`<th class="dt-head-center">Grade</th>`);
        $("#tabMembresAlliance th:eq(9)").after(`<th class="dt-head-center">Tdt</th><th class="dt-head-center">Retour</th>`);
        // On compléte les données
        $("#tabMembresAlliance tr:gt(0):lt(-1)").each((i, elt) => {
            let pseudo = $(elt).find("td:eq(3)").text();
            const joueur = this._alliance.joueurs[pseudo]; // Récupérer le joueur une seule fois

            // Vérifier si le joueur existe et a les propriétés x et y définies
            if (joueur && typeof joueur.x === 'number' && typeof joueur.y === 'number' && joueur.x !== -1 && joueur.y !== -1) {
                // si nous avons les coordonnées on affiche les temps de trajet
                $(elt).find("td:eq(1)").after(`<td align="center">${joueur.rang !== undefined ? joueur.rang : Utils.alliance}</td>`);
                
                const tempsParcours = monProfilJoueur.getTempsParcours2(joueur);
                
                const tdtDisplay = Utils.intToTime(tempsParcours);
                const retourDisplay = Utils.roundMinute(tempsParcours).format("D MMM à HH[h]mm");

                $(elt).find("td:eq(9)").after(`<td align="center">${tdtDisplay}</td><td align="center">${retourDisplay}</td>`);
                // si on est chef de l'alliance on peut modifier les rangs et que le joueur est dans l'utilitaire
                if($("img[src='images/crayon.gif']").length && this._utilitaire.alliance.joueurs.hasOwnProperty(pseudo)){
                    $(elt).find("td:eq(0)").append(`<a id="o_rang${joueur.id}" href=""><img src="${IMG_UTILITY}" alt="rang"/></a>`);
                    $("#o_rang" + joueur.id).click((e) => {
                        let boiteForm = new BoiteRang(joueur, this._utilitaire, this);
                        boiteForm.afficher();
                        return false;
                    });
                }
            } else {
                // Si le joueur n'existe pas ou n'a pas de coordonnées valides, afficher N/C pour les temps de trajet
                $(elt).find("td:eq(1)").after(`<td align="center">${joueur && joueur.rang !== undefined ? joueur.rang : Utils.alliance}</td>`);
                $(elt).find("td:eq(9)").after(`<td align="center">N/C</td><td align="center">N/C</td>`);
                // Gérer le bouton de rang même si les coordonnées sont N/C, si le joueur existe dans l'utilitaire
                if($("img[src='images/crayon.gif']").length && this._utilitaire.alliance.joueurs.hasOwnProperty(pseudo)){
                    $(elt).find("td:eq(0)").append(`<a id="o_rang${joueur.id}" href=""><img src="${IMG_UTILITY}" alt="rang"/></a>`);
                    $("#o_rang" + joueur.id).click((e) => {
                        let boiteForm = new BoiteRang(joueur, this._utilitaire, this);
                        boiteForm.afficher();
                        return false;
                    });
                }
            }
        });

        // Ajouter les joueurs extérieurs au tableau
        for (const pseudo in this._alliance.joueurs) {
            const joueur = this._alliance.joueurs[pseudo];
            if (joueur.estExterieur) {
                const ligneHtml = this._creerLigneJoueurExterieur(joueur);
                $("#tabMembresAlliance tbody").append(ligneHtml); // Ajouter au tbody
            }
        }
        this._attacherEvenementsRang(); // Appeler la nouvelle méthode pour attacher les événements

        this.tableauUtilitaire();

        // Ajout des totaux d'images après que tous les joueurs (y compris extérieurs) soient dans le DOM
        $(".simulateur table[class='ligne_paire'] tr:eq(0) td:eq(1)").append(` (${$("img[alt='Actif']").length})`);
        $(".simulateur table[class='ligne_paire'] tr:eq(0) td:eq(3)").append(` (${$("img[alt='Vacances']").length})`);
        $(".simulateur table[class='ligne_paire'] tr:eq(1) td:eq(1)").append(` (${$("img[alt='Inactif depuis 3 jours']").length})`);
        $(".simulateur table[class='ligne_paire'] tr:eq(1) td:eq(3)").append(` (${$("img[alt='Bannie']").length})`);
        $(".simulateur table[class='ligne_paire'] tr:eq(2) td:eq(1)").append(` (${$("img[alt='Inactif depuis 10 jours']").length})`);
        $(".simulateur table[class='ligne_paire'] tr:eq(2) td:eq(3)").append(` (${$("img[alt='Colonisé']").length})`);

        return this;
    }
    /**
    * Attache les événements de clic pour les boutons de modification de rang.
    *
    * @private
    * @method _attacherEvenementsRang
    */
    _attacherEvenementsRang() {
        // Détacher les événements existants pour éviter les duplications
        $("a[id^='o_rang']").off('click');

        // Attacher les événements pour tous les boutons de rang présents dans le tableau
        $("a[id^='o_rang']").each((i, elt) => {
            const id = $(elt).attr('id').replace('o_rang', '');
            // Trouver le joueur correspondant dans this._alliance.joueurs
            // On doit itérer pour trouver le joueur par son ID, car le pseudo n'est pas directement dans l'ID du bouton.
            let joueurCible = null;
            for (const pseudo in this._alliance.joueurs) {
                if (this._alliance.joueurs[pseudo].id == id) {
                    joueurCible = this._alliance.joueurs[pseudo];
                    break;
                }
            }

            if (joueurCible) {
                $(elt).click((e) => {
                    e.preventDefault();
                    let boiteForm = new BoiteRang(joueurCible, this._utilitaire, this);
                    boiteForm.afficher();
                    return false;
                });
            }
        });
    }
    /**
    * Crée la ligne HTML pour un joueur hébergé à l'extérieur.
    *
    * @private
    * @method _creerLigneJoueurExterieur
    * @param {Joueur} joueur L'objet Joueur à afficher.
    * @return {string} La chaîne HTML de la ligne du tableau.
    */
    _creerLigneJoueurExterieur(joueur) {
        const pseudoDisplay = joueur.allianceTag
            ? `${joueur.pseudo} (${joueur.allianceTag})`
            : joueur.pseudo;

        const rangDisplay = joueur.rang !== undefined && joueur.rang !== "" ? joueur.rang : "N/C";
        const terrainDisplay = joueur.terrain !== -1 ? numeral(joueur.terrain).format() : "N/C";
        const technologieDisplay = joueur.technologie !== -1 ? numeral(joueur.technologie).format() : "N/C";
        const fourmiliereDisplay = joueur.fourmiliere !== -1 ? numeral(joueur.fourmiliere).format() : "N/C";

        const tempsParcoursExterieur = (joueur.x !== -1 && joueur.y !== -1) ? monProfilJoueur.getTempsParcours2(joueur) : null;

        const tdtDisplay = tempsParcoursExterieur !== null ? Utils.intToTime(tempsParcoursExterieur) : "N/C";
        const retourDisplay = tempsParcoursExterieur !== null ? Utils.roundMinute(tempsParcoursExterieur).format("D MMM à HH[h]mm") : "N/C";

        let editButtonHtml = "";
        // Si l'utilisateur a les droits d'administration et que le joueur est connu de l'utilitaire
        if ($("img[src='images/crayon.gif']").length && this._utilitaire.alliance.joueurs.hasOwnProperty(joueur.pseudo)) {
            editButtonHtml = `<a id="o_rang${joueur.id}" href=""><img src="${IMG_UTILITY}" alt="rang"/></a>`;
        }

        let imgDefHtml = "";
        let imgAttHtml = "";
        if (!joueur.estJoueurCourant()) {
            if (joueur.estAttaquant()) {
                imgDefHtml = IMG_DEF;
            }
            if (joueur.estAttaquable()) {
                imgAttHtml = IMG_ATT;
            }
        }

        // La structure des colonnes doit correspondre à celle du tableau après traitementUtilitaire
        // <th></th><th>Grade</th><th>Rang</th><th>Pseudo</th><th></th><th>Terrain</th><th></th><th><span style='padding-right:10px'>Technologie</span></th><th><span style='padding-right:10px'>Fourmiliere</span></th><th>Tdt</th><th>Retour</th><th>État</th><th></th>
        // Total de 15 colonnes (12 + 3 ajoutées)
        return `
            <tr class="ligne_paire o_joueurExterieur" data-pseudo="${joueur.pseudo}">
                <td align="center">${editButtonHtml}</td>
                <td align="center"></td>
                <td align="center">${rangDisplay}</td>
                <td align="center"></td>
                <td align="center">${pseudoDisplay}</td>
                <td align="center">${imgDefHtml}</td>
                <td align="center">${terrainDisplay}</td>
                <td align="center">${imgAttHtml}</td>
                <td align="center">${technologieDisplay}</td>
                <td align="center">${fourmiliereDisplay}</td>
                <td align="center">${tdtDisplay}</td>
                <td align="center">${retourDisplay}</td>
                <td align="center">${joueur.mv ? IMG_VACANCES : ''}</td>
                <td align="center">${joueur.colonise ? IMG_COLONISE : ''}</td>
                <td align="center"></td>
            </tr>
        `;
    }
    /**
    * Fusionne les joueurs de l'utilitaire avec les joueurs de l'alliance actuelle.
    * Ajoute les joueurs hébergés à l'extérieur qui ne sont pas sur la page Fourmizzz.
    *
    * @private
    * @method _fusionnerJoueursUtilitaire
    */
    async _fusionnerJoueursUtilitaire() { // Rendre la méthode async
        const promises = [];
        for (const pseudo in this._utilitaire.alliance.joueurs) {
            const joueurUtilitaire = this._utilitaire.alliance.joueurs[pseudo];
            // Si le joueur de l'utilitaire n'est pas déjà dans la liste des joueurs de l'alliance (ceux de la page Fourmizzz)
            if (!this._alliance.joueurs.hasOwnProperty(pseudo)) {
                const nouveauJoueur = new Joueur({
                    id: joueurUtilitaire.id,
                    pseudo: joueurUtilitaire.pseudo,
                    x: parseInt(joueurUtilitaire.x), // Convertir en nombre
                    y: parseInt(joueurUtilitaire.y), // Convertir en nombre
                    // terrain, fourmiliere, technologie seront chargés par getProfil()
                    mv: joueurUtilitaire.mv,
                    ordreRadar: joueurUtilitaire.ordreRadar,
                    sujetForum: joueurUtilitaire.sujetForum,
                    rang: joueurUtilitaire.rang,
                    ordreRang: joueurUtilitaire.ordreRang,
                    estExterieur: true,
                    allianceTag: joueurUtilitaire.allianceTag,
                    colonise: joueurUtilitaire.colonise // Assurez-vous que cette propriété est passée
                });
                this._alliance.joueurs[pseudo] = nouveauJoueur;

                // Déclencher le chargement du profil pour obtenir terrain, fourmiliere, technologie, et colonise
                const profilPromise = nouveauJoueur.getProfil();
                if (profilPromise) {
                    promises.push(profilPromise.then(html => {
                        nouveauJoueur.chargerProfil(html);
                    }).catch(error => {
                        console.error(`[PageAlliance] Erreur lors du chargement du profil de ${nouveauJoueur.pseudo}:`, error);
                        // Assigner des valeurs par défaut en cas d'échec de chargement
                        nouveauJoueur.terrain = -1;
                        nouveauJoueur.fourmiliere = -1;
                        nouveauJoueur.technologie = -1;
                        nouveauJoueur.colonise = false; // Assigner une valeur par défaut en cas d'erreur
                    }));
                }
                // getConstruction() et getLaboratoire() ne sont pas appelés ici pour les joueurs extérieurs.
            } else {
                // Si le joueur est déjà présent, mettre à jour ses informations avec celles de l'utilitaire
                // et s'assurer qu'il n'est PAS marqué comme extérieur.
                const joueurExistant = this._alliance.joueurs[pseudo];
                joueurExistant.x = parseInt(joueurUtilitaire.x); // Convertir en nombre
                joueurExistant.y = parseInt(joueurUtilitaire.y); // Convertir en nombre
                joueurExistant.id = joueurUtilitaire.id;
                joueurExistant.sujetForum = joueurUtilitaire.sujetForum;
                joueurExistant.rang = joueurUtilitaire.rang;
                joueurExistant.ordreRang = joueurUtilitaire.ordreRang;
                joueurExistant.estExterieur = false; // S'assurer qu'il n'est pas marqué comme extérieur s'il est sur la page
                joueurExistant.allianceTag = joueurUtilitaire.allianceTag;
                joueurExistant.colonise = joueurUtilitaire.colonise; // Mettre à jour la propriété colonise
            }
        }
        await Promise.all(promises);
    }
    /**
    *
    */
    optionAdmin()
    {
        // si on est chef de l'alliance on peut mettre à jour les membres
        const crayonIcon = $("img[src='images/crayon.gif']");
        if(crayonIcon.length){
            const dtButtonsContainer = $("#tabMembresAlliance_wrapper .dt-buttons");
            if (dtButtonsContainer.length > 0) {
                dtButtonsContainer.prepend(`<a id="o_actualiserAlliance" class="dt-button" href="#"><span>Actualiser l'alliance</span></a>`);
                // Retrait de la marge droite forcée sur le premier bouton
                // $("#o_actualiserAlliance").css("margin-right", "0.333em"); // Ligne retirée
                $("#o_actualiserAlliance").click(async (e) => { // Utilisation de async
                    e.preventDefault(); // Empêcher l'action par défaut du lien

                    const idSectionMembre = monProfilUtilisateur.parametre["Membres Outiiil"]?.valeur;

                    if (!idSectionMembre) {
                         $.toast({...TOAST_ERROR, text : "Le paramètre Membres Outiiil n'est pas configuré."});
                         return false;
                    }

                    try {
                        // Vérifier si les données de l'utilitaire sont déjà chargées
                        if (!this._utilitaire.alliance || !this._utilitaire.alliance.joueurs) {
                            const data = await this._utilitaire.consulterSection(idSectionMembre);
                            if (!this._utilitaire.chargerJoueur(data)) {
                                throw new Error("Impossible de charger les données des joueurs depuis le forum.");
                            }
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
                        // pour s'assurer que monProfilJoueur.sujetForum est mis à jour si un sujet a été créé pour le joueur courant.
                        await this._utilitaire.verifierSujetMembre(idSectionMembre, pseudoJoueur);

                        $.toast({...TOAST_SUCCESS, text : "la mise à jour c'est correctement effectuée."});
                        this.actualiserMembre();

                    } catch (error) {
                        console.error("Erreur lors de l'actualisation de l'alliance:", error);
                        $.toast({...TOAST_ERROR, heading: "Erreur Actualisation", text: `${error.message || 'Une erreur est survenue.'}`});
                    }

                    return false;
                });

            }
        }
        return this;
    }
    /**
    *
    */
    actualiserMembre()
    {
        const dataTable = $("#tabMembresAlliance").DataTable();
        if (dataTable) {
            dataTable.destroy();
        }

        // Vider le tbody pour reconstruire le tableau
        $("#tabMembresAlliance tbody").empty();

        // Fusionner les données de l'utilitaire avec les joueurs de la page actuelle
        // Cela met à jour this._alliance.joueurs avec les dernières données et ajoute les joueurs extérieurs
        this._fusionnerJoueursUtilitaire();

        // Reconstruire les lignes du tableau pour tous les joueurs (internes et externes)
        for (const pseudo in this._alliance.joueurs) {
            const joueur = this._alliance.joueurs[pseudo];
            let ligneHtml = "";

            if (joueur.estExterieur) {
                ligneHtml = this._creerLigneJoueurExterieur(joueur);
            } else {
                // Recréer la ligne pour les joueurs internes en utilisant la logique de traitementMembre
                // On doit recréer la structure de base de la ligne pour qu'elle puisse être enrichie par traitementUtilitaire.
                ligneHtml = `
                    <tr class="${Object.keys(this._alliance.joueurs).indexOf(pseudo) % 2 ? "ligne_paire" : ""}">
                        <td align="center"></td>
                        <td align="center"></td>
                        <td align="center">${joueur.rang}</td>
                        <td align="center">${joueur.pseudo}</td>
                        <td align="center"></td>
                        <td align="center">${numeral(joueur.terrain).format()}</td>
                        <td align="center"></td>
                        <td align="center">${numeral(joueur.technologie).format()}</td>
                        <td align="center">${numeral(joueur.fourmiliere).format()}</td>
                        <td align="center"></td>
                        <td align="center"></td>
                        <td align="center"></td>
                    </tr>
                `;
            }
            $("#tabMembresAlliance tbody").append(ligneHtml);
        }

        // Réinitialiser DataTables.
        if (monProfilUtilisateur.parametre["Membres Outiiil"].valeur) { // Si l'utilitaire est configuré
            this.tableauUtilitaire(); // Cela réinitialisera DataTables et ajoutera les colonnes SDC
        } else {
            this.tableau(); // Sinon, réinitialiser le tableau simple
        }

        this._attacherEvenementsRang(); // Réattacher les événements après l'actualisation
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
            order : [[6, "desc"]], // Tri par défaut par la colonne "Terrain" (index 6) en ordre décroissant
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
                {className: "dt-body-center", targets: "_all"},
                {type : "quantite-grade", targets : 6},
                {visible : false, targets : [3, 8, 9]},
                {sortable : false, targets : [0, 1, 5, 7, 12, 13, 14]}
            ]
        });
        return this;
	}
}
