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
        const idSectionCommande = monProfil.parametre["forumCommande"].valeur;
        if (!idSectionCommande) {
            console.warn("[PageForum] ID de la section commande non défini.");
            return [];
        }

        try {
            const dataSection = await this.consulterSection(idSectionCommande);
            const responseSection = $(dataSection).find("cmd:eq(1)").text();

            if (responseSection.includes("Vous n'avez pas accès à ce forum.")) {
                console.warn("[PageForum] Accès refusé à la section forum des commandes.");
                return [];
            }

            const sujetElements = $("<div/>").append(responseSection).find("#form_cat tr:gt(0)");
            const sujetsAConsulter = [];
            const maintenant = moment();

            sujetElements.each((i, elt) => {
                const titreSujet = $(elt).find("td:eq(1)").text().trim();
                // Filtrer les sujets dont la dernière activité remonte à moins de 24h (approximatif)
                // On pourrait affiner en parsant la date de dernière activité si nécessaire
                const dateDerniereActiviteText = $(elt).find("td:eq(2)").text().trim(); // Supposons que la 3ème colonne contient la date

                // Extraire la partie date et heure de la chaîne, en ignorant le début et en utilisant une regex flexible pour les espaces
                const dateMatch = dateDerniereActiviteText.match(/(\d+\s+\w+\s+à\s*\d+h\d+)/); // Regex ajustée avec groupe de capture
                const datePartToParse = dateMatch ? dateMatch[1] : ''; // dateMatch[1] contient la partie capturée

                const dateDerniereActivite = Utils.parseForumDate(datePartToParse); // Utiliser la partie extraite

                if (dateDerniereActivite && maintenant.diff(dateDerniereActivite, 'hours') < 24) {
                     const id = $(elt).find("a.topic_forum").attr("onclick").match(/\d+/)[0];
                     sujetsAConsulter.push({ id: id, element: elt, titreSujet: titreSujet });
                }
            });

            if (sujetsAConsulter.length === 0) {
                console.log("[PageForum] Aucun sujet récent à consulter pour les convois.");
                return [];
            }

            const convois = [];
            for (const sujetInfo of sujetsAConsulter) {
                try {
                    const dataSujet = await this.consulterSujet(sujetInfo.id);
                    const responseSujet = $(dataSujet).find("cmd:eq(1)").text();
                    const messages = $("<div/>").append(responseSujet).find(".messageForum");

                    const destinatairePseudo = commandes[sujetInfo.id] ? commandes[sujetInfo.id].demandeur.pseudo : "Inconnu"; // Récupérer le destinataire depuis les commandes chargées

                    messages.each((i, messageElt) => {
                        const messageText = $(messageElt).text();
                        const auteurElement = $(messageElt).prevAll(".auteurForum");
                        const auteurHtml = auteurElement.html();
                        let auteurMessage = "Inconnu";
                        // Regex pour extraire le texte entre les balises <a>
                        const pseudoMatch = auteurHtml ? auteurHtml.match(/<a[^>]*>([^<]*)<\/a>/) : null;
                        if (pseudoMatch && pseudoMatch[1] !== undefined) {
                            auteurMessage = pseudoMatch[1].trim();
                        }
                        const dateMessageText = auteurElement.find("span").text().trim();
                        const dateMessage = Utils.parseForumDate(dateMessageText);

                        // Déterminer le pattern exact pour identifier un message de convoi
                        // Basé sur la méthode toUtilitaire de la classe Convoi si elle existe et est pertinente
                        // Déterminer le pattern exact pour identifier un message de convoi
                        // Modification pour accepter les quantités négatives
                        const convoiMatch = messageText.match(/\s*- Vous allez livrer (-?\d+) nourritures et (-?\d+) materiaux à (.+?) dans (.+?) - Retour le (.+)$/);

                        if (convoiMatch) {
                            const nourriture = parseInt(convoiMatch[1], 10);
                            const materiaux = parseInt(convoiMatch[2], 10);
                            const destinataire = convoiMatch[3];
                            const dateRetourText = convoiMatch[5]; // Capture group 5 is the return date string

                            // Parse the return date directly
                            const dateArrivee = moment(dateRetourText, "D MMM YYYY à HH[h]mm");

                            // Vérifier si la date d'arrivée est dans le futur ou dans la minute actuelle
                            // Utiliser une tolérance pour les dates passées très récentes
                            if (dateArrivee.diff(maintenant) >= -60000) { // -60000 ms = -1 minute
                                // Créer un objet Convoi en utilisant la classe Convoi
                                const convoi = new Convoi({
                                    expediteur: auteurMessage,
                                    destinataire: destinataire,
                                    nourriture: nourriture,
                                    materiaux: materiaux,
                                    dateArrivee: dateArrivee.toDate(), // Stocker comme objet Date
                                    idCommande: sujetInfo.id // Lier au sujet de commande
                                });

                                convois.push(convoi);
                            }
                        }
                    });
                } catch (error) {
                    console.error(`[chargerConvois] Erreur lors de la consultation du sujet ${sujetInfo.id}:`, error);
                    // Continuer avec le sujet suivant même en cas d'erreur sur un sujet
                }
            }
            return convois;

        } catch (error) {
            console.error("[PageForum] Erreur lors du chargement des convois:", error);
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
        return $.ajax({
            type : "post",
            url : "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
            data : {
                "xajax" : "callGetForum",
                "xajaxargs[]" : id,
                "xajaxr" : moment().valueOf()
            }
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
        });
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
        });
    }
    /**
    *
    */
    consulterSujet(id)
    {
        return $.ajax({
            type : "post",
            url : "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
            data : {
                "xajax" : "callGetTopic",
                "xajaxargs[]" : id,
                "xajaxr" : moment().valueOf()
            }
        });
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

        // Vérification et mise à jour de l'ID de la section Outiiil_Commande
        const commandeSection = $(element).find("span[class^='forum']:contains('Outiiil_Commande')");
        if (commandeSection.length) {
            const pageId = commandeSection.attr("class").match(/\d+/)[0];
            const storedId = monProfil.parametre["forumCommande"].valeur;
            if (storedId === undefined || storedId === null || storedId === '' || storedId != pageId) {
                monProfil.parametre["forumCommande"].valeur = pageId;
                monProfil.parametre["forumCommande"].sauvegarde();
                idsUpdated = true;
                console.log(`ID section Outiiil_Commande mis à jour vers ${pageId}.`);
            }
        }

        // Vérification et mise à jour de l'ID de la section Outiiil_Membre
        const membreSection = $(element).find("span[class^='forum']:contains('Outiiil_Membre')");
        if (membreSection.length) {
            const pageId = membreSection.attr("class").match(/\d+/)[0];
            const storedId = monProfil.parametre["forumMembre"].valeur;
            if (storedId === undefined || storedId === null || storedId === '' || storedId != pageId) {
                monProfil.parametre["forumMembre"].valeur = pageId;
                monProfil.parametre["forumMembre"].sauvegarde();
                idsUpdated = true;
                console.log(`ID section Outiiil_Membre mis à jour vers ${pageId}.`);
            }
        }

        // Afficher une notification si des IDs ont été mis à jour
        if (idsUpdated) {
            $.toast({...TOAST_SUCCESS, text : "IDs des sections forum Outiiil mis à jour."});
        }
        // selon la section ACTIVE on ajoute les outils necessaires
        switch($(element).find("span[class^='forum'][class$='ligne_paire']").html()){
            case "Outiiil_Commande" :
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
                    let etat = titreSujet.split("] ")[0].split("[")[1];
                    // Filtrer les sujets selon les états souhaités
                    // Inclure les commandes "Nouvelle", "En cours", "En attente" et "Terminée" (si récente)
                    if (etat === "Nouvelle" || etat === "En cours" || etat === "En attente" || etat === "Terminée") {
                        let id = $(elt).find("a.topic_forum").attr("onclick").match(/\d+/)[0];
                        // Pour les commandes terminées, vérifier si elles sont récentes
                        if (etat === "Terminée") {
                            // Créer une instance temporaire de Commande pour utiliser estTermineRecent
                            // On ne peut pas encore parser complètement la commande ici car on n'a pas toutes les infos
                            // On va donc charger toutes les commandes terminées et filtrer après le parse complet
                            // Ou, mieux, on va s'assurer que la logique de PageCommerce gère les cas où la commande n'est pas trouvée
                            // et que chargerCommande charge toutes les commandes nécessaires pour la gestion des convois.
                            // Pour l'instant, chargeons toutes les commandes terminées et laissons PageCommerce gérer le filtrage par date de dernière mise à jour.
                            sujetsAConsulter.push({ id: id, element: elt, titreSujet: titreSujet, etat: etat });
                        } else {
                            sujetsAConsulter.push({ id: id, element: elt, titreSujet: titreSujet, etat: etat });
                        }
                    }
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
                    let infos = sujetInfo.titreSujet.split("] ")[1].split(" / ");
                    let etat = sujetInfo.titreSujet.split("] ")[0].split("[")[1];

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
        if(response.includes("Vous n'avez pas accès à ce forum."))
            $.toast({...TOAST_ERROR, text : "L'identifiant du sujet pour les membres est érroné."});
        else{
            let joueurs = {};
            $("<div/>").append(response).find("#form_cat tr:gt(0)").each((i, elt) => {
                let titreSujet = $(elt).find("td:eq(1)").text().trim(), id = $(elt).find("input[name='topic[]']").val();
                // les lignes des commandes ont 3 td et du contenu
                if(titreSujet){
                    let infos = titreSujet.split(" / ");
                    joueurs[infos[0]] = {id : infos[1], pseudo : infos[0], x : infos[2], y : infos[3], sujetForum : id};
                    if(infos.length > 4){
                        joueurs[infos[0]].rang = infos[4];
                        joueurs[infos[0]].ordreRang = infos[5];
                    }
                }
            });
            this._monAlliance = new Alliance({tag : Utils.alliance, joueurs : joueurs});
            return true;
        }
        return false;
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
            $("#o_creerUtilitaire").click((e) => {
                // Creation du sujet "Outiiil_Commande"
                if(!$(`#cat_forum span:contains(Outiiil_Commande)`).length){
                    this.creerSection("Outiiil_Commande").then((data) => {
                        let response = $("<div/>").append($(data).find("cmd:eq(1)").html());
                        let idCat = $(response).find(`input[value='Outiiil_Commande']`).parent().attr("id").match(/\d+/)[0];
                        // Sauvegarde automatique de l'ID dans les paramètres
                        monProfil.parametre["forumCommande"].valeur = idCat;
                        monProfil.parametre["forumCommande"].sauvegarde();
                        console.log(`ID section Outiiil_Commande (${idCat}) sauvegardé automatiquement.`);
                        // on ne peut pas creer directement une section caché donc on cache aprés
                        this.modifierSection("Outiiil_Commande", idCat, "cache").then((data) => {
                            $.toast({...TOAST_SUCCESS, text : "La section commande a été correctement créée et son ID sauvegardé."}); // Message mis à jour
                        }, (jqXHR, textStatus, errorThrown) => {
                            $.toast({...TOAST_ERROR, text : "Une erreur réseau a été rencontrée lors de la protection de la section commande."});
                        });
                    }, (jqXHR, textStatus, errorThrown) => {
                        $.toast({...TOAST_ERROR, text : "Une erreur réseau a été rencontrée lors de la création de la section commande."});
                    });
                }else
                    $.toast({...TOAST_WARNING, text : "Section commande est déjà créée !"});
                // creation de la section membre pour les membres de l'alliance
                if(!$(`#cat_forum span:contains(Outiiil_Membre)`).length){
                    this.creerSection("Outiiil_Membre").then((data) => {
                        let response = $("<div/>").append($(data).find("cmd:eq(1)").html());
                        let idCat = $(response).find(`input[value='Outiiil_Membre']`).parent().attr("id").match(/\d+/)[0];
                        // Sauvegarde automatique de l'ID dans les paramètres
                        monProfil.parametre["forumMembre"].valeur = idCat;
                        monProfil.parametre["forumMembre"].sauvegarde();
                        console.log(`ID section Outiiil_Membre (${idCat}) sauvegardé automatiquement.`);
                        // on ne peut pas creer directement une section caché donc on cache aprés
                        this.modifierSection("Outiiil_Membre", idCat, "cache").then((data) => {
                            $.toast({...TOAST_SUCCESS, text : "La section membre a été correctement créée et son ID sauvegardé."}); // Message mis à jour
                        }, (jqXHR, textStatus, errorThrown) => {
                            $.toast({...TOAST_ERROR, text : "Une erreur réseau a été rencontrée lors de la protection de la section membre."});
                        });
                    }, (jqXHR, textStatus, errorThrown) => {
                        $.toast({...TOAST_ERROR, text : "Une erreur réseau a été rencontrée lors de la création de la section membre."});
                    });
                }else
                    $.toast({...TOAST_WARNING, text : "Section membre est déjà créée !"});
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
                            commande.parseUtilitaire(id, $(elt).next().find("a").text(), titreSujet.split("] ")[0].split("[")[1], titreSujet.split("] ")[1].split(" / "));
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
}
