/*
 * Forum.js
 * Hraesvelg
 **********************************************************************/

/**
* Classe de fonction pour la page /alliance.php?forum_menu.
*
* @class PageForum
* @constructor
*/
class PageForum
{
    constructor()
    {
        /**
        * liste des commandes.
        */
        this._commande = {};
        /**
        * liste des joueurs.
        */
        this._monAlliance = null;
        /**
         * Versions minimales du forum extraites des sujets de la section Versions Outiiil.
         */
        this.versionsForum = {};
    }
    /**
    *
    */
    get commande()
    {
        return this._commande;
    }
    /*
    *
    */
    set commande(newCommande)
    {
        this._commande = newCommande;
    }
    /*
    *
    */
    get alliance()
    {
        return this._monAlliance;
    }
    /*
    *
    */
    set alliance(newAlliance)
    {
        this._monAlliance = newAlliance;
    }
    /**
    * Charge les convois en cours depuis la section commande du forum.
    *
    * @async
    * @method chargerConvois
    * @param {object} commandes La liste des commandes chargées, indexée par ID de sujet.
    * @returns {Promise<Array<Convoi>>} Une promesse qui résout avec une liste d'objets Convoi.
    */
    async chargerConvois(commandes) {
        const idSectionCommande = monProfilUtilisateur.parametre["Commandes Outiiil"].valeur;
        if (!idSectionCommande) {
            console.warn("[PageForum][chargerConvois] ID de la section commande non défini. Retourne une liste vide.");
            return [];
        }

        try {
            const dataSection = await this.consulterSection(idSectionCommande);
            const responseSection = $(dataSection).find("cmd:eq(1)").text();

            if (responseSection.includes("Vous n'avez pas accès à ce forum.")) {
                console.warn("[PageForum][chargerConvois] Accès refusé à la section forum des commandes. Retourne une liste vide.");
                return [];
            }

            const sujetElements = $("<div/>").append(responseSection).find("#form_cat tr:gt(0)");
            const sujetsAConsulter = [];
            const maintenant = moment();

            sujetElements.each((i, elt) => {
                const titreSujet = $(elt).find("td:eq(1)").text().trim();
                const dateDerniereActiviteText = $(elt).find("td:eq(2)").text().trim();
                const dateMatch = dateDerniereActiviteText.match(/.*(\d+\s+\w+\.?\s+à[\s\u00A0]*\d+h\d+)/);
                const datePartToParse = dateMatch ? dateMatch[1] : '';
                const dateDerniereActivite = Utils.parseForumDate(datePartToParse);

                if (dateDerniereActivite.isValid() && maintenant.diff(dateDerniereActivite, 'hours') < 24) {
                     const id = $(elt).find("a.topic_forum").attr("onclick").match(/\d+/)[0];
                     sujetsAConsulter.push({ id: id, element: elt, titreSujet: titreSujet });
                }
            });

            if (sujetsAConsulter.length === 0) {
                return [];
            }

            const convois = [];
            for (const sujetInfo of sujetsAConsulter) {
                try {
                    const dataSujet = await this.consulterSujet(sujetInfo.id);
                    const responseSujet = $(dataSujet).find("cmd:eq(1)").text();
                    const messages = $("<div/>").append(responseSujet).find(".messageForum");

                    messages.each((i, messageElt) => {
                        const messageText = $(messageElt).text();
                        const auteurElement = $(messageElt).prev(".auteurForum");
                        const auteurHtml = auteurElement.html();
                        let auteurMessage = "Inconnu";
                        const pseudoMatch = auteurHtml ? auteurHtml.match(/<a[^>]*>([^<]*)<\/a>/) : null;
                        if (pseudoMatch && pseudoMatch[1] !== undefined) {
                            auteurMessage = pseudoMatch[1].trim();
                        }
                        const dateMessageText = auteurElement.find("span").text().trim();
                        const dateMessage = Utils.parseForumDate(dateMessageText);

                        const convoi = Convoi.fromUtilitaireString(messageText, auteurMessage, sujetInfo.id, dateMessage.toDate());

                        if (convoi) {
                            if (moment(convoi.dateArrivee).diff(maintenant) >= -60000) {
                                convois.push(convoi);
                            }
                        }
                    });
                } catch (error) {
                    console.error(`[PageForum][chargerConvois] Erreur lors de la consultation du sujet ${sujetInfo.id}:`, error);
                }
            }
            return convois;

        } catch (error) {
            console.error("[PageForum][chargerConvois] Erreur critique lors du chargement des convois:", error);
            return [];
        }
    }
    /**
    *
    */
    creerSection(nomSection)
    {
        return $.ajax({
            type : "post",
            url : "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
            data : {
                "xajax" : "ajoutCategorie",
                "xajaxargs[]" : `<xjxquery><q>nom=${nomSection}</q></xjxquery>`,
                "xajaxr" : moment().valueOf()
            }
        });
    }
    /**
     * Crée une section et retourne son ID.
     * @async
     * @param {string} nomSection Le nom de la section à créer.
     * @returns {Promise<number|null>} Une promesse qui résout avec l'ID de la section créée (null si non trouvé).
     */
    async creerSectionEtRetournerId(nomSection) {
        try {
            const data = await this.creerSection(nomSection);
            const response = $("<div/>").append($(data).find("cmd:eq(1)").html());
            const elementSection = response.find(`input[value='${nomSection}']`);
            
            if (elementSection.length) {
                const idCat = elementSection.parent().attr("id").match(/\d+/)[0];
                return parseInt(idCat, 10);
            } else {
                console.error(`[PageForum][creerSectionEtRetournerId] Impossible de trouver l'ID de la section nouvellement créée "${nomSection}".`);
                return null;
            }
        } catch (error) {
            console.error(`[PageForum][creerSectionEtRetournerId] Erreur lors de la création de la section "${nomSection}":`, error);
            throw error;
        }
    }
    /**
    *
    */
    modifierSection(nomSection, id, categorie)
    {
        return $.ajax({
            type : "post",
            url : "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
            data : {
                "xajax" : "renommerCategorie",
                "xajaxargs[]" : `<xjxquery><q>nom=${nomSection}&type=${categorie}&ID_cat=${id}&del=Supprimer</q></xjxquery>`,
                "xajaxr" : moment().valueOf()
            }
        });
    }
    /**
    *
    */
    consulterSection(id)
    {
        const timerName = `consulterSection-${id}`;
        console.time(timerName);
        console.log(`[PageForum] Début de consulterSection pour ID: ${id}`);
        return $.ajax({
            type : "post",
            url : "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
            data : {
                "xajax" : "callGetForum",
                "xajaxargs[]" : id,
                "xajaxr" : moment().valueOf()
            },
            timeout: 10000 // Ajout d'un timeout de 10 secondes
        }).then(data => {
            console.log(`[PageForum] consulterSection succès pour ID: ${id}.`);
            console.timeEnd(timerName);
            return data;
        }).catch(error => {
            if (error.statusText === "timeout") {
                console.error(`[PageForum] consulterSection échec pour ID: ${id}. Erreur: Timeout de la requête.`);
            } else {
                console.error(`[PageForum] consulterSection échec pour ID: ${id}. Erreur:`, error);
            }
            console.timeEnd(timerName);
            throw error; // Rejeter l'erreur pour qu'elle soit gérée par l'appelant
        });
    }
    /**
    *
    */
    creerSujet(nomSujet, contenu, id, type = "normal")
    {
        return $.ajax({
            type : "post",
            url : "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
            data : {
                "xajax" : "envoiNouveauSujet",
                "xajaxargs[]" : `<xjxquery><q>cat=${id}&sujet=${nomSujet}&message=${encodeURIComponent(contenu)}&type=${type}&modifiable=envoyer&send=Envoyer&question=&reponse[]=&reponse[]=&reponse[]=</q></xjxquery>`,
                "xajaxr" : moment().valueOf()
            }
        }).catch(error => {
            console.error(`[PageForum] Erreur lors de la création du sujet "${nomSujet}" (ID: ${id}):`, error);
            throw error;
        });
    }
    /**
     * Crée un sujet et retourne son ID.
     * @async
     * @param {string} nomSujet Le nom du sujet.
     * @param {string} contenu Le contenu du premier message.
     * @param {number|string} id L'ID de la section.
     * @param {string} [type="normal"] Le type de sujet.
     * @returns {Promise<number|null>} Une promesse qui résout avec l'ID du sujet créé (null si non trouvé).
     */
    async creerSujetEtRetournerId(nomSujet, contenu, id, type = "normal") {
        try {
            const data = await this.creerSujet(nomSujet, contenu, id, type);
            const response = $(data).find("cmd:eq(1)").text();

            if (!response || response.includes("Vous n'avez pas accès à ce forum.")) {
                console.error("[PageForum][creerSujetEtRetournerId] Impossible de récupérer le contenu de la section après la création du sujet.");
                return null;
            }

            const sujetElements = $("<div/>").append(response).find("#form_cat tr:gt(0)");
            let idSujet = null;

            sujetElements.each((i, elt) => {
                const titreSujet = $(elt).find("td:eq(1)").text();
                // Use startsWith for a more robust comparison, as the forum might add extra characters or formatting.
                if (titreSujet.startsWith(nomSujet)) {
                    const onclickAttr = $(elt).find("a.topic_forum").attr("onclick");
                    if (onclickAttr) {
                        const match = onclickAttr.match(/\d+/);
                        if (match) {
                            idSujet = parseInt(match[0], 10);
                            return false; // break loop
                        }
                    }
                }
            });

            if (idSujet === null) {
                console.error(`[PageForum][creerSujetEtRetournerId] Impossible de trouver l'ID du sujet nouvellement créé "${nomSujet}" dans la liste des sujets de la section.`);
            }

            return idSujet;
        } catch (error) {
            console.error(`[PageForum][creerSujetEtRetournerId] Erreur lors de la création du sujet "${nomSujet}":`, error);
            throw error;
        }
    }
    /**
    *
    */
    modifierSujet(nomSujet, contenu, id)
    {
        return $.ajax({
            type : "post",
            url : "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
            data : {
                "xajax" : "envoiEditTopic",
                "xajaxargs[]" : `<xjxquery><q>IDTopic=${id}&sujet=${nomSujet}&message=${encodeURIComponent(contenu)}&modifiable=envoyer&send=Envoyer</q></xjxquery>`,
                "xajaxr" : moment().valueOf()
            }
        }).catch(error => {
            console.error(`[PageForum] Erreur lors de la modification du sujet "${nomSujet}" (ID: ${id}):`, error);
            throw error;
        });
    }
    /**
    *
    */
    /**
     * Consulte un sujet et retourne le contenu HTML brut.
     * @param {Number} id L'ID du sujet.
     * @returns {Promise<String>} Une promesse qui résout avec le contenu HTML brut du sujet.
     */
    consulterSujet(id) {
        const timerName = `consulterSujet-${id}`;
        console.time(timerName);
        return $.ajax({
            type: "post",
            url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
            data: {
                "xajax": "callGetTopic",
                "xajaxargs[]": id,
                "xajaxr": moment().valueOf()
            }
        }).always(() => {
            console.timeEnd(timerName);
        });
    }

    /**
     * Consulte un sujet et retourne une liste d'objets message, incluant le contenu et l'ID de chaque message.
     * @async
     * @param {Number} idSujet L'ID du sujet à consulter.
     * @returns {Promise<{titre: String, messages: Array<{id: Number, contenu: String}>}>} Une promesse qui résout avec un objet contenant le titre du sujet et un tableau d'objets message.
     */
    async consulterSujetAvecMessagesEtIds(idSujet) {
        try {
            const dataSujet = await this.consulterSujet(idSujet);
            const response = $(dataSujet).find("cmd:eq(1)").text();
            const sujetHtml = $("<div/>").append(response);
            const titre = sujetHtml.find("h2").text(); // Extraire le titre du sujet
            const messageElements = sujetHtml.find(".messageForum");
            const messages = [];

            messageElements.each((i, elt) => {
                const messageContent = $(elt).text();
                // Filtrer les messages qui ne contiennent que des espaces ou caractères invisibles
                if (messageContent.trim().length === 0) {
                    return true; // Continue à l'itération suivante dans .each()
                }

                const editLink = $(elt).find("a[onclick*='xajax_editMessage']");
                let messageId = null;

                if (editLink.length > 0) {
                    const onclickAttr = editLink.attr('onclick');
                    const match = onclickAttr.match(/xajax_editMessage\((\d+)\)/);
                    if (match && match[1]) {
                        messageId = parseInt(match[1], 10);
                    }
                }
                messages.push({ id: messageId, contenu: messageContent });
            });
            return { titre: titre, messages: messages };
        } catch (error) {
            console.error(`[PageForum][consulterSujetAvecMessagesEtIds] Erreur lors de la consultation du sujet ${idSujet}:`, error);
            throw error;
        }
    }
    /**
    *
    */
    envoyerMessage(id, message)
    {
        return $.ajax({
            type : "post",
            url : "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
            data : {
                "xajax" : "envoiNouveauMessage",
                "xajaxargs[]" : `<xjxquery><q>topic=${id}&message=${message}&send=Envoyer</q></xjxquery>`,
                "xajaxr" : moment().valueOf()
            }
        });
    }
    /**
     * Envoie un message dans un sujet et retourne l'ID du nouveau message.
     * @async
     * @param {number|string} idSujet L'ID du sujet.
     * @param {string} message Le message à envoyer.
     * @returns {Promise<number|null>} Une promesse qui résout avec l'ID du message envoyé (null si non trouvé).
     */
    async envoyerMessageEtRetournerId(idSujet, message) {
        try {
            const data = await this.envoyerMessage(idSujet, message);
            const response = $(data).find("cmd:eq(1)").text();
            
            if (!response || response.includes("Vous n'avez pas accès à ce forum.")) {
                console.error("[PageForum][envoyerMessageEtRetournerId] Impossible de récupérer le contenu du sujet après l'envoi du message.");
                return null;
            }

            const messageElements = $("<div/>").append(response).find(".messageForum");
            
            // Le nouvel ID de message est celui du dernier message de la liste.
            if (messageElements.length > 0) {
                const lastMessageElement = messageElements.last();
                const editLink = $(lastMessageElement).find("a[onclick*='xajax_editMessage']");
                if (editLink.length > 0) {
                    const onclickAttr = editLink.attr('onclick');
                    const match = onclickAttr.match(/xajax_editMessage\((\d+)\)/);
                    if (match && match[1]) {
                        return parseInt(match[1], 10);
                    }
                }
            }
            return null; // Aucun ID de message trouvé
        } catch (error) {
            console.error(`[PageForum][envoyerMessageEtRetournerId] Erreur lors de l'envoi du message ou de la récupération de l'ID pour le sujet ${idSujet}:`, error);
            throw error;
        }
    }
    /**
    *
    */
    executer()
    {
        // si le forum est deja chargé lance le traitement
        if($("#cat_forum").length) this.traitementSection("#alliance");
        // Récupération des données du forum pour communiquer.
        let observer = new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                this.traitementSection(mutation.target);
            });
        });
        observer.observe($("#alliance")[0], {childList : true});
        return this;
    }
    /**
    *
    */
    traitementSection(element)
    {
        // ajoute les options pour outiiil
        if($(element).find("div.simulateur").length) this.optionAdmin();
        // Vérification et mise à jour des IDs des sections Outiiil
        let idsUpdated = false;

        if (nomsSectionsRequis) {
            for (const nomSection of nomsSectionsRequis) {
                const sectionElement = $(element).find("span[class^='forum']").filter(function() { return $(this).text().trim() === nomSection; });
                if (sectionElement.length) {
                    const pageId = sectionElement.attr("class").match(/\d+/)[0];
                    if (monProfilUtilisateur.parametre[nomSection]) {
                        const storedId = monProfilUtilisateur.parametre[nomSection].valeur;
                        if (storedId === undefined || storedId === null || storedId === '' || storedId != pageId) {
                            monProfilUtilisateur.parametre[nomSection].valeur = pageId;
                            monProfilUtilisateur.parametre[nomSection].sauvegarde();
                            idsUpdated = true;
                            console.log(`ID section ${nomSection} mis à jour vers ${pageId}.`);
                        }
                    }
                }
            }
        }

        // Afficher une notification si des IDs ont été mis à jour
        if (idsUpdated) {
            $.toast({...TOAST_SUCCESS, text : "IDs des sections forum Outiiil mis à jour."});
        }
        // selon la section ACTIVE on ajoute les outils necessaires
        switch($(element).find("span[class^='forum'][class$='ligne_paire']").html()){
            case "Commandes Outiiil" :
                // on verifie si on n'est dans un sujet mais bien sur la liste des topics
                if($("#form_cat").length && !$("#o_afficherEtat").length)
                    this.optionAdminCommande();
                break;
            default :
                break;
        }
        return this;
    }
    /**
    *
    */
    chargerCommande(data)
    {
        let response = $(data).find("cmd:eq(1)").text();
        if(response.includes("Vous n'avez pas accès à ce forum.")) {
            $.toast({...TOAST_ERROR, text : "L'identifiant du sujet pour les commandes est érroné."});
            return false;
        } else {
            let sujetElements = $("<div/>").append(response).find("#form_cat tr:gt(0)");
            let sujetsAConsulter = [];

            sujetElements.each((i, elt) => {
                let titreSujet = $(elt).find("td:eq(1)").text().trim();
                if (titreSujet) {
                    const match = titreSujet.match(/^\[([^\]]+)\]\s*(.*)$/);
                    let etat = match ? match[1] : ""; // Extrait l'état ou vide si non trouvé
                    let infosPart = match ? match[2] : ""; // Extrait la partie infos ou vide
                    let id = $(elt).find("a.topic_forum").attr("onclick").match(/\d+/)[0]; // L'ID est considéré comme toujours valide

                    sujetsAConsulter.push({ id: id, element: elt, titreSujet: titreSujet, etat: etat, infosPart: infosPart });
                }
            });
            if (sujetsAConsulter.length === 0) {
                // Aucune commande à afficher
                return true;
            }

            let promises = sujetsAConsulter.map(sujet => this.consulterSujet(sujet.id));

            Promise.all(promises).then(results => {
                results.forEach((sujetData, index) => {
                    let sujetInfo = sujetsAConsulter[index];
                    let commande = new Commande();
                    let infos = sujetInfo.infosPart.split(" / "); // Utilise la partie infos déjà extraite
                    let etat = sujetInfo.etat; // Utilise l'état déjà extrait

                    // Extraire la date du premier message
                    let sujetHtml = $("<div/>").append($(sujetData).find("cmd:eq(1)").text());
                    let dateCreationText = sujetHtml.find(".auteurForum:first span").text().trim();
                    let dateCreation = Utils.parseForumDate(dateCreationText);

                    this._commande[sujetInfo.id] = commande.parseUtilitaire(sujetInfo.id, $(sujetInfo.element).next().find("a").text(), etat, infos, $(sujetInfo.element).find("td:last :not(a)").contents().filter(function(){return (this.nodeType === 3);}).text());
                    this._commande[sujetInfo.id].dateCommande = dateCreation; // Assigner la date de création
                });

                // Appeler la fonction de rappel pour indiquer que le chargement est terminé
                // Je dois trouver comment déclencher l'affichage du tableau dans PageCommerce.js
                // Je vais relire PageCommerce.js pour voir comment chargerCommande est utilisé.
                // En attendant, je ne retourne rien ici car le processus est asynchrone.
                // La fonction appelante dans PageCommerce.js attend une Promise.
                // Je vais ajuster le code appelant dans PageCommerce.js ensuite.
            });

            // Retourne la Promise pour que l'appelant puisse attendre la fin du chargement
            return Promise.all(promises);
        }
    }
    /**
    *
    */
    chargerJoueur(data)
    {
        let response = $(data).find("cmd:eq(1)").text();
        if(response.includes("Vous n'avez pas accès à ce forum.")) {
            $.toast({...TOAST_ERROR, text : "L'identifiant du sujet pour les membres est érroné."});
            return false;
        } else {
            let joueurs = {};
            $("<div/>").append(response).find("#form_cat tr:gt(0)").each((i, elt) => {
                let titreSujet = $(elt).find("td:eq(1)").text().trim(), id = $(elt).find("input[name='topic[]']").val();
                // les lignes des commandes ont 3 td et du contenu
                if(titreSujet){
                    // Regex pour extraire pseudo, id, x, y, et optionnellement grade, ordreGrade
                    const match = titreSujet.match(/^(.+?)\s*\/\s*(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)(?:\s*\/\s*(.+?)\s*\/\s*(\d+))?$/);
                    if (match) {
                        const pseudo = match[1];
                        const joueurId = match[2];
                        const x = match[3];
                        const y = match[4];
                        const grade = match[5] || null;
                        const ordreGrade = match[6] || null;

                        joueurs[pseudo] = {id : joueurId, pseudo : pseudo, x : x, y : y, sujetForum : id};
                        if(grade !== null){
                            joueurs[pseudo].ecrireParametre('grade', grade);
                            joueurs[pseudo].ecrireParametre('ordre_grade', ordreGrade);
                        }
                    } else {
                        console.warn(`[PageForum] chargerJoueur() - Format de titre de sujet inattendu pour le joueur: ${titreSujet}`);
                    }
                }
            });
            this._monAlliance = new Alliance({tag : Utils.alliance, joueurs : joueurs});
            return true;
        }
    }
    /**
    *
    */
    optionAdmin()
    {
        // il faut etre chef pour preparer le fofo
        if($("img[src='images/icone/outil.gif']").length && !$("#o_afficheMenuUtilitaire").length){
            $("#cat_forum").prepend(`<span id="o_afficheMenuUtilitaire" class="o_forumOption categorie_forum"><img src="${IMG_OUTIIIL}" alt="outiiil"/></span>
                <span id="o_menuUtilitaire" class="ligne_paire o_prepareUtilitaire">
                    <a href="#" id="o_creerUtilitaire">» Préparer le forum pour un SDC</a><br/>
                    <a href="#" id="o_preparerGuerre">» Préparer une section pour une guerre</a>
            </span>`);
            $("#o_afficheMenuUtilitaire").click((e) => {$("#o_menuUtilitaire").toggle();return false;});
            // ajout de l'input pour la selection du tag alliance
            $("#alliance .simulateur").append(`<div id="o_formGuerre" style="display:none;"><input id="o_tagGuerre" type="text"/> <button id="o_creerSectionGuerre">Créer section</button></div>`);
            // Creation de l'utilitaire
            $("#o_creerUtilitaire").click(async (e) => {
                if (nomsSectionsRequis) {
                    for (const nomSection of nomsSectionsRequis) {
                        if (!$(`#cat_forum span:contains('${nomSection}')`).length) {
                            try {
                                const idCat = await this.creerSectionEtRetournerId(nomSection);
                                if (idCat) {
                                    if (monProfilUtilisateur.parametre[nomSection]) {
                                        monProfilUtilisateur.parametre[nomSection].valeur = idCat;
                                        monProfilUtilisateur.parametre[nomSection].sauvegarde();
                                    }
                                    
                                    this.modifierSection(nomSection, idCat, "cache").then((data) => {
                                        $.toast({...TOAST_SUCCESS, text : `La section ${nomSection} a été correctement créée et son ID sauvegardé.`});
                                        // if (nomSection === 'Versions Outiiil') {
                                        //     this.getVersionsFromForum();
                                        // }
                                    }, (jqXHR, textStatus, errorThrown) => {
                                        console.error(`[PageForum][o_creerUtilitaire] Erreur lors de la modification de la section ${nomSection} (ID: ${idCat}):`, textStatus, errorThrown);
                                        $.toast({...TOAST_ERROR, text : `Une erreur réseau a été rencontrée lors de la protection de la section ${nomSection}.`});
                                    });
                                } else {
                                    console.warn(`[PageForum][o_creerUtilitaire] ID de section non retourné pour "${nomSection}".`);
                                }
                            } catch (error) {
                                console.error(`[PageForum][o_creerUtilitaire] Erreur lors de la création de la section ${nomSection}:`, error);
                                $.toast({...TOAST_ERROR, text : `Une erreur réseau a été rencontrée lors de la création de la section ${nomSection}.`});
                            }
                        } else {
                            $.toast({...TOAST_WARNING, text : `Section ${nomSection} est déjà créée !`});
                        }
                    }
                } else {
                    console.warn("[PageForum][o_creerUtilitaire] nomsSectionsRequis n'est pas défini. Aucune section à créer.");
                }
                // if ($(`#cat_forum span:contains('Versions Outiiil')`).length) {
                //     this.getVersionsFromForum();
                // }
                return false;
            });
            // Preparation d'une guerre
            $("#o_preparerGuerre").click((e) => {$("#o_formGuerre").toggle();});
            $("#o_tagGuerre").autocomplete({
                source : (request, response) => {Alliance.rechercher(request.term).then((data) => {response(Utils.extraitRecherche(data, false, true));});},
                position : {my : "left top-6", at : "left bottom"},
                delay : 0,
                minLength : 1,
                select : (e, ui) => {$("#o_tagGuerre").val(ui.item.tag);return false;}
            }).data("ui-autocomplete")._renderItem = (ul, item) => {
                let style = '';
                return $("<li>").append(`<a style="${style}">${item.value_avec_html}</a>`).appendTo(ul);
            };
            // event sur le bouton guerre
            $("#o_creerSectionGuerre").click((e) => {
                let alliance = new Alliance({tag : $("#o_tagGuerre").val()}), titreSection = "Guerre " + alliance.tag;
                if(!$("#cat_forum span[class^='forum']").text().toUpperCase().includes(titreSection.toUpperCase())){
                    // on créer la section "Guerre " + tag
                    this.creerSection(titreSection).then((data) => {
                        // on recup la section pour ajouter les sujets des joueurs
                        let response = $("<div/>").append($(data).find("cmd:eq(1)").html());
                        let idCat = $(response).find(`input[value='${titreSection}']`).parent().attr("id").match(/\d+/)[0];
                        alliance.getDescription().then((data) => {
                            // on construit les appels de creation des sujets
                            let promiseJoueur = new Array();
                            $(data).find("#tabMembresAlliance tr:gt(0)").each((i, elt) => {
                                let pseudo = $(elt).find("td:eq(2)").text();
                                promiseJoueur.push(this.creerSujet(pseudo, `[player]${pseudo}[/player]`, idCat));
                            });
                            // on creer les sujets
                            Promise.all(promiseJoueur).then((values) => {location.reload();});
                        },(jqXHR, textStatus, errorThrown) => {
                             $.toast({...TOAST_ERROR, text : "Une erreur réseau a été rencontrée lors de la récupération de la desciption."});
                        });
                    }, (jqXHR, textStatus, errorThrown) => {
                         $.toast({...TOAST_ERROR, text : "Une erreur réseau a été rencontrée lors de la création de la section guerre."});
                    });
                }else
                    $.toast({...TOAST_WARNING, text : `La section "Guerre ${alliance.tag}" existe déjà !`});
            });
        }
        return this;
    }
    /**
    *
    */
    optionAdminCommande()
    {
        if($("img[src='images/icone/outil.gif']").length){
            let options = "";
            for(let etat in ETAT_COMMANDE) options += `<option value="${ETAT_COMMANDE[etat]}">${etat}</option>`;
            $("#form_cat td:last")
                .prepend(`<img class="cursor" id="o_afficherEtat" src="${IMG_CHANGE}" height="16" alt="changer" title="Changer l'etat des commandes selectionnées"/>`)
                .append(`<select id="o_selectEtatCommande" style="display:none;">${options}</select> <button id="o_changerEtat" style="display:none;">Modifier l'état</button>`);
            $("#o_afficherEtat").click((e) => {$("#o_changerEtat, #o_selectEtatCommande").toggle();});
            $("#o_changerEtat").click((e) => {
                let promiseCmdModif = new Array();
                $("#form_cat tr:gt(0)").each((i, elt) => {
                    // si la commande est selectionné
                    if($(elt).find("input[name='topic[]']:checked").length){
                        let titreSujet = $(elt).find("td:eq(1)").text().trim(), id = $(elt).find("input[name='topic[]']").val();
                        if(titreSujet){
                            let commande = new Commande();
                            const match = titreSujet.match(/^\[([^\]]+)\]\s*(.*)$/);
                            let etat = match ? match[1] : "";
                            let infos = (match ? match[2] : "").split(" / ");
                            commande.parseUtilitaire(id, $(elt).next().find("a").text(), etat, infos, $(elt).find("td:last :not(a)").contents().filter(function(){return (this.nodeType === 3);}).text());
                            commande.etat = $("#o_selectEtatCommande").val();
                            promiseCmdModif.push(this.modifierSujet(commande.toUtilitaire(), " ", id));
                        }
                    }
                });
                Promise.all(promiseCmdModif).then((values) => {
                    $.toast({...TOAST_SUCCESS, text : promiseCmdModif.length > 1 ? "Commandes mises à jour avec succès." : "Commande mise à jour avec succès."});
                    location.reload();
                });
                return false;
            });
        }
        return this;
    }
    /**
     * Vérifie si un sujet existe pour le joueur dans la section membres.
     *
     * @private
     * @method verifierSujetMembre
     * @param {string} idSectionMembres L'identifiant de la section membres du forum.
     * @param {string} pseudoJoueur Le pseudo du joueur à vérifier.
     * @returns {Promise<boolean>} Une promesse qui résout avec true si le sujet existe, false sinon.
     */
    async verifierSujetMembre(idSectionMembres, pseudoJoueur) {
        try {
            const data = await this.consulterSection(idSectionMembres);
            const response = $(data).find("cmd:eq(1)").text();

            if (response.includes("Vous n'avez pas accès à ce forum.")) {
                console.warn("Accès refusé à la section forum des membres.");
                return false;
            }

            const sujetElements = $("<div/>").append(response).find("#form_cat tr:gt(0)");
            let sujetTrouve = false;

            sujetElements.each((i, elt) => {
                const titreSujet = $(elt).find("td:eq(1)").text().trim();
                if (titreSujet.startsWith(pseudoJoueur + " /")) {
                    sujetTrouve = true;
                    return false; // Sortir de la boucle .each()
                }
            });

            return sujetTrouve;
        } catch (error) {
            console.error("Erreur lors de la vérification du sujet membre:", error);
            // En cas d'erreur, on considère que le sujet n'a pas pu être vérifié, donc on retourne false
            return false;
        }
    }

    /**
     * Transfère un sujet existant vers une nouvelle section du forum.
     * @async
     * @param {Number} idSujet L'ID du sujet à transférer.
     * @param {Number} idSectionDestination L'ID de la section de destination.
     * @returns {Promise<Boolean>} Une promesse qui résout avec true en cas de succès, false en cas d'échec.
     */
    async transfererSujet(idSujet, idSectionDestination) {
        try {
            const data = await $.ajax({
                type: "post",
                url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
                data: {
                    "xajax": "deplacer", 
                    "xajaxargs[]": `<xjxquery><q>topic[]=${idSujet}&cat_cible=${idSectionDestination}</q></xjxquery>`,
                    "xajaxr": moment().valueOf()
                }
            });

            return true
            
        } catch (error) {
            console.error(`[PageForum] Erreur lors du transfert du sujet ID: ${idSujet} vers la section ID: ${idSectionDestination}:`, error);
            return false;
        }
    }

    /**
     * Modifie le contenu d'un message existant dans un sujet de forum.
     * @async
     * @param {Number} idMessage L'ID du message à modifier.
     * @param {String} nouveauContenu Le nouveau contenu du message.
     * @returns {Promise<Boolean>} Une promesse qui résout avec true en cas de succès, false en cas d'échec.
     */
    async modifierMessage(idMessage, nouveauContenu) {
        try {
            const data = await $.ajax({
                type: "post",
                url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
                data: {
                    "xajax": "envoiEditMessage",
                    "xajaxargs[]": `<xjxquery><q>IDMessage=${idMessage}&message=${encodeURIComponent(nouveauContenu)}&send=Envoyer</q></xjxquery>`,
                    "xajaxr": moment().valueOf()
                }
            });

            return true

        } catch (error) {
            console.error(`[PageForum] Erreur lors de la modification du message ID: ${idMessage}:`, error);
            return false;
        }
    }

    /**
     * Récupère tous les sujets d'une section et les place dans une liste de dictionnaires.
     * @async
     * @param {Number} idSection L'ID de la section à consulter.
     * @returns {Promise<Array<{id: Number, derniere_activite: Date, contenu: String}>>} Une promesse qui résout avec une liste de sujets.
     */
    async recupererSujetsSection(idSection) {
        try {
            const dataSection = await this.consulterSection(idSection);
            const responseSection = $(dataSection).find("cmd:eq(1)").text();

            if (responseSection.includes("Vous n'avez pas accès à ce forum.")) {
                console.warn(`[PageForum][recupererSujetsSection] Accès refusé à la section forum ID: ${idSection}. Retourne une liste vide.`);
                return [];
            }

            const sujetElements = $("<div/>").append(responseSection).find("#form_cat tr:gt(0)");
            const sujets = [];

            sujetElements.each((i, elt) => {
                const titreSujet = $(elt).find("td:eq(1)").text();
                const dateDerniereActiviteText = $(elt).find("td:eq(2)").text().trim();
                // Updated regex to capture the date pattern, making the initial match non-greedy, explicitly handling spaces, and supporting accented characters in month names
                const dateMatch = dateDerniereActiviteText.match(/.*?(\d+[ \u00A0]+[a-zA-Z\u00C0-\u017F]+\.?[ \u00A0]+à[ \u00A0]*\d+h\d+)/);
                const datePartToParse = dateMatch ? dateMatch[1] : '';
                const dateDerniereActivite = Utils.parseForumDate(datePartToParse);
                let id = null;
                const onclickAttr = $(elt).find("a.topic_forum").attr("onclick");
                if (onclickAttr) {
                    const match = onclickAttr.match(/\d+/);
                    if (match) {
                        id = parseInt(match[0], 10);
                    }
                }

                if (id && titreSujet && dateDerniereActivite.isValid()) {
                    sujets.push({
                        id: id,
                        derniere_activite: dateDerniereActivite.toDate(),
                        contenu: titreSujet
                    });
                } else {
                    console.warn(`[PageForum][recupererSujetsSection] Sujet ignoré en raison de données manquantes ou invalides. ID: ${id}, Titre: "${titreSujet}", Date: "${dateDerniereActiviteText}".`);
                }
            });
            return sujets;

        } catch (error) {
            console.error(`[PageForum][recupererSujetsSection] Erreur lors de la récupération des sujets de la section ${idSection}:`, error);
            return [];
        }
    }
}
