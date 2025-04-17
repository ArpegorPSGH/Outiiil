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
                // On s'assure de traiter seulement si #cat_forum est présent dans les noeuds ajoutés ou dans la cible
                if ($(mutation.target).find('#cat_forum').length || $(mutation.addedNodes).closest('#cat_forum').length || $(mutation.addedNodes).is('#cat_forum')) {
                   this.traitementSection(mutation.target);
                }
            });
        });
        observer.observe($("#alliance")[0], {childList : true, subtree: true}); // subtree: true pour observer les changements profonds
        return this;
    }
    /**
    *
    */
    traitementSection(element) // element n'est plus utilisé directement pour la recherche des sections
    {
        // ajoute les options pour outiiil seulement si #cat_forum est visible
        if($("#cat_forum").length && $("#cat_forum").find("div.simulateur").length) this.optionAdmin();

        // --- START: Vérification et auto-correction des IDs Forum ---
        const checkAndCorrectForumId = (paramKey, sectionName) => { // element retiré des params car on cible #cat_forum
            const savedId = monProfil.parametre[paramKey].valeur;
            let sectionExistsById = false;
            const $catForum = $("#cat_forum"); // Cible le conteneur principal

            // Ne rien faire si #cat_forum n'est pas encore chargé
            if (!$catForum.length) {
                console.log(`[Outiiil Debug] #cat_forum not found yet for checking ${sectionName}.`);
                return;
            }

            console.log(`[Outiiil Debug] Checking ${sectionName}: Saved ID = ${savedId}`);

            if (savedId) {
                // Vérifie si la section avec l'ID sauvegardé existe dans #cat_forum
                sectionExistsById = $catForum.find(`span.forum_${savedId}`).length > 0;
                console.log(`[Outiiil Debug] ${sectionName}: Section found by ID (${savedId}) = ${sectionExistsById}`);
            }

            // Si l'ID est vide OU si la section n'existe plus/pas avec cet ID
            if (!savedId || !sectionExistsById) {
                console.log(`[Outiiil Debug] ${sectionName}: Saved ID invalid or empty, or section not found by ID. Searching by name in #cat_forum...`);
                let foundByName = false;
                let newId = null;
                let classAttrFound = '';

                $catForum.find("span[class^='forum']").each(function() {
                    const $span = $(this);
                    // Utilise .contents() pour obtenir les nœuds texte, puis filtre et trim pour obtenir le texte direct du span
                    const spanTextNodes = $span.contents().filter(function() { return this.nodeType === 3; });
                    const spanText = spanTextNodes.text().trim().toLowerCase();
                    const targetText = sectionName.toLowerCase();

                    if (spanText === targetText) {
                        console.log(`[Outiiil Debug] ${sectionName}: Found span by name match:`, $span.text().trim());
                            foundByName = true;
                            classAttrFound = $span.attr("class");
                            // Correction Regex: supprimer l'underscore
                            const match = classAttrFound ? classAttrFound.match(/forum(\d+)/) : null;
                            newId = match ? match[1] : null;
                            console.log(`[Outiiil Debug] ${sectionName}: Extracted new ID = ${newId} from class '${classAttrFound}'`);
                        return false; // Sortir de la boucle each
                    }
                });

                if (foundByName && newId && newId !== savedId) {
                    monProfil.parametre[paramKey].valeur = newId;
                    monProfil.parametre[paramKey].sauvegarde();
                    // Log final pour l'utilisateur
                    console.log(`[Outiiil] ID Forum ${sectionName} ${savedId ? 'corrigé' : 'trouvé'} : ${newId}`);
                } else if (foundByName && !newId) {
                     console.warn(`[Outiiil] Section ${sectionName} trouvée par nom mais impossible d'extraire l'ID de sa classe '${classAttrFound}'. Vérifiez la structure HTML.`);
                } else if (!foundByName) {
                     console.log(`[Outiiil Debug] ${sectionName}: Section not found by name in #cat_forum.`);
                     // Si l'ID était sauvegardé mais qu'on ne trouve plus la section ni par ID ni par nom
                     if (savedId && !sectionExistsById) {
                         console.warn(`[Outiiil] Section ${sectionName} (ID sauvegardé: ${savedId}) non trouvée. Elle a peut-être été supprimée ou renommée.`);
                     }
                }
            }
        };

        // Appeler la fonction de vérification seulement si #cat_forum est présent
        if ($("#cat_forum").length) {
            checkAndCorrectForumId("forumCommande", "Outiiil_Commande");
            checkAndCorrectForumId("forumMembre", "Outiiil_Membre");
        }
        // --- END: Vérification et auto-correction des IDs Forum ---

        // selon la section ACTIVE on ajoute les outils necessaires
        // Utilise l'ID potentiellement corrigé pour vérifier la section active
        // Recherche la section active DANS #cat_forum pour être sûr
        const $activeSectionSpan = $("#cat_forum").find("span[class^='forum'][class$='ligne_paire']");
        const activeSectionId = $activeSectionSpan.attr("class")?.match(/forum_(\d+)/)?.[1];

        // Vérifie si on est dans la section commande ET si le tableau des sujets est visible
        if (activeSectionId && activeSectionId === monProfil.parametre["forumCommande"].valeur && $("#form_cat").length && !$("#o_afficherEtat").length) {
            this.optionAdminCommande();
        }

        return this;
    }
    /**
    *
    */
    chargerCommande(data)
    {
        let response = $(data).find("cmd:eq(1)").text();
        if(response.includes("Vous n'avez pas accès à ce forum."))
            $.toast({...TOAST_ERROR, text : "L'identifiant du sujet pour les commandes est érroné."});
        else{
            let commande = null;
            $("<div/>").append(response).find("#form_cat tr:gt(0)").each((i, elt) => {
                let titreSujet = $(elt).find("td:eq(1)").text().trim(), id = -1;
                // les lignes des commandes ont 3 td et du contenu
                if(titreSujet){
                    // Essayer d'abord l'attribut onclick, puis l'input si le premier échoue
                    let onclickAttr = $(elt).find("a.topic_forum").attr("onclick");
                    let match = onclickAttr ? onclickAttr.match(/callGetTopic\((\d+)\)/) : null;
                    if (match && match[1]) {
                        id = match[1];
                    } else {
                        let inputVal = $(elt).find("input[name='topic[]']").val();
                        if (inputVal) id = inputVal;
                    }

                    if (id !== -1) {
                        commande = new Commande();
                        this._commande[id] = commande.parseUtilitaire(id, $(elt).next().find("a").text(), titreSujet.split("] ")[0].split("[")[1], titreSujet.split("] ")[1].split(" / "), $(elt).find("td:last :not(a)").contents().filter(function(){return (this.nodeType === 3);}).text());
                    } else {
                         console.warn("[Outiiil] Impossible d'extraire l'ID du sujet pour la commande:", titreSujet);
                    }
                }
            });
            return true;
        }
        return false;
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
                let titreSujet = $(elt).find("td:eq(1)").text().trim(), id = -1;
                 // Essayer d'abord l'attribut onclick, puis l'input si le premier échoue
                 let onclickAttr = $(elt).find("a.topic_forum").attr("onclick");
                 let match = onclickAttr ? onclickAttr.match(/callGetTopic\((\d+)\)/) : null;
                 if (match && match[1]) {
                     id = match[1];
                 } else {
                     let inputVal = $(elt).find("input[name='topic[]']").val();
                     if (inputVal) id = inputVal;
                 }

                // les lignes des commandes ont 3 td et du contenu
                if(titreSujet && id !== -1){
                    let infos = titreSujet.split(" / ");
                    // Vérifier qu'on a au moins pseudo, id_joueur, x, y
                    if (infos.length >= 4) {
                        joueurs[infos[0]] = {id : infos[1], pseudo : infos[0], x : infos[2], y : infos[3], sujetForum : id};
                        if(infos.length > 4){ // Rang et ordre sont optionnels
                            joueurs[infos[0]].rang = infos[4];
                            joueurs[infos[0]].ordreRang = infos[5];
                        }
                    } else {
                        console.warn("[Outiiil] Format de titre de sujet membre invalide:", titreSujet);
                    }
                } else if (titreSujet) {
                     console.warn("[Outiiil] Impossible d'extraire l'ID du sujet pour le membre:", titreSujet);
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
            // Cible plus spécifique pour éviter d'ajouter plusieurs fois si le DOM est modifié
            if (!$("#alliance .simulateur #o_formGuerre").length) {
                $("#alliance .simulateur").append(`<div id="o_formGuerre" style="display:none;"><input id="o_tagGuerre" type="text"/> <button id="o_creerSectionGuerre">Créer section</button></div>`);
            }
            // Creation de l'utilitaire
            $("#o_creerUtilitaire").click((e) => {
                e.preventDefault(); // Empêcher le comportement par défaut du lien
                // Creation du sujet "Outiiil_Commande"
                if(!$(`#cat_forum span:contains(Outiiil_Commande)`).length){
                    this.creerSection("Outiiil_Commande").then((data) => {
                        let response = $("<div/>").append($(data).find("cmd:eq(1)").html());
                        // Recherche plus fiable de l'ID
                        let idCat = response.find("span.categorie_forum:contains('Outiiil_Commande')").attr("class")?.match(/forum_(\d+)/)?.[1];
                        if (idCat) {
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
                        } else {
                             $.toast({...TOAST_ERROR, text : "Impossible de trouver l'ID de la section commande après création."});
                        }
                    }, (jqXHR, textStatus, errorThrown) => {
                        $.toast({...TOAST_ERROR, text : "Une erreur réseau a été rencontrée lors de la création de la section commande."});
                    });
                }else
                    $.toast({...TOAST_WARNING, text : "Section commande est déjà créée !"});
                // creation de la section membre pour les membres de l'alliance
                if(!$(`#cat_forum span:contains(Outiiil_Membre)`).length){
                    this.creerSection("Outiiil_Membre").then((data) => {
                         let response = $("<div/>").append($(data).find("cmd:eq(1)").html());
                         let idCat = response.find("span.categorie_forum:contains('Outiiil_Membre')").attr("class")?.match(/forum_(\d+)/)?.[1];
                         if (idCat) {
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
                        } else {
                             $.toast({...TOAST_ERROR, text : "Impossible de trouver l'ID de la section membre après création."});
                        }
                    }, (jqXHR, textStatus, errorThrown) => {
                        $.toast({...TOAST_ERROR, text : "Une erreur réseau a été rencontrée lors de la création de la section membre."});
                    });
                }else
                    $.toast({...TOAST_WARNING, text : "Section membre est déjà créée !"});
                return false;
            });
            // Preparation d'une guerre
            $("#o_preparerGuerre").click((e) => { e.preventDefault(); $("#o_formGuerre").toggle(); });
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
                e.preventDefault();
                let allianceTag = $("#o_tagGuerre").val();
                if (!allianceTag) {
                    $.toast({...TOAST_WARNING, text: "Veuillez entrer un tag d'alliance."});
                    return;
                }
                let alliance = new Alliance({tag : allianceTag}), titreSection = "Guerre " + alliance.tag;
                // Vérification plus robuste de l'existence de la section
                let sectionExists = false;
                $("#cat_forum span[class^='forum']").each(function() {
                    if ($(this).text().trim().toUpperCase() === titreSection.toUpperCase()) {
                        sectionExists = true;
                        return false;
                    }
                });

                if(!sectionExists){
                    // on créer la section "Guerre " + tag
                    this.creerSection(titreSection).then((data) => {
                        // on recup la section pour ajouter les sujets des joueurs
                        let response = $("<div/>").append($(data).find("cmd:eq(1)").html());
                        let idCat = response.find(`span.categorie_forum:contains('${titreSection}')`).attr("class")?.match(/forum_(\d+)/)?.[1];

                        if (!idCat) {
                             $.toast({...TOAST_ERROR, text : `Impossible de trouver l'ID de la section guerre ${titreSection} après création.`});
                             return;
                        }

                        alliance.getDescription().then((descData) => {
                            // on construit les appels de creation des sujets
                            let promiseJoueur = new Array();
                            // Utiliser descData qui contient le HTML de la page alliance
                            $(descData).find("#tabMembresAlliance tr:gt(0)").each((i, elt) => {
                                let pseudo = $(elt).find("td:eq(3)").text().trim(); // Index 3 pour pseudo sur page alliance
                                if (pseudo) {
                                    promiseJoueur.push(this.creerSujet(pseudo, `[player]${pseudo}[/player]`, idCat));
                                }
                            });
                            // on creer les sujets
                            Promise.all(promiseJoueur).then((values) => {
                                $.toast({...TOAST_SUCCESS, text: `Section ${titreSection} et sujets créés.`});
                                // Recharger pour voir la nouvelle section
                                // Peut-être ajouter un délai ou une confirmation avant de recharger
                                setTimeout(() => location.reload(), 1000);
                            }).catch(err => {
                                 $.toast({...TOAST_ERROR, text : "Erreur lors de la création des sujets joueurs."});
                                 console.error("Erreur création sujets guerre:", err);
                            });
                        },(jqXHR, textStatus, errorThrown) => {
                             $.toast({...TOAST_ERROR, text : "Une erreur réseau a été rencontrée lors de la récupération de la description de l'alliance."});
                        });
                    }, (jqXHR, textStatus, errorThrown) => {
                         $.toast({...TOAST_ERROR, text : "Une erreur réseau a été rencontrée lors de la création de la section guerre."});
                    });
                }else
                    $.toast({...TOAST_WARNING, text : `La section "${titreSection}" existe déjà !`});
            });
        }
        return this;
    }
    /**
    *
    */
    optionAdminCommande()
    {
        // S'assurer que les éléments ne sont pas ajoutés plusieurs fois
        if($("img[src='images/icone/outil.gif']").length && !$("#o_afficherEtat").length){
            let options = "";
            for(let etat in ETAT_COMMANDE) options += `<option value="${ETAT_COMMANDE[etat]}">${etat}</option>`;
            // Cible plus précise pour l'ajout des contrôles
            const $lastCellHeader = $("#form_cat th:last");
            if ($lastCellHeader.length) {
                 $lastCellHeader.prepend(`<img class="cursor" id="o_afficherEtat" src="${IMG_CHANGE}" height="16" alt="changer" title="Changer l'etat des commandes selectionnées"/>`)
                               .append(`<select id="o_selectEtatCommande" style="display:none;">${options}</select> <button id="o_changerEtat" style="display:none;">Modifier l'état</button>`);

                $("#o_afficherEtat").click((e) => { e.preventDefault(); $("#o_changerEtat, #o_selectEtatCommande").toggle(); });
                $("#o_changerEtat").click((e) => {
                    e.preventDefault();
                    let promiseCmdModif = new Array();
                    let selectedCount = 0;
                    $("#form_cat tr:gt(0)").each((i, elt) => {
                        // si la commande est selectionné
                        if($(elt).find("input[name='topic[]']:checked").length){
                            selectedCount++;
                            let titreSujet = $(elt).find("td:eq(1)").text().trim();
                            let id = $(elt).find("input[name='topic[]']").val(); // ID du sujet

                            if(titreSujet && id){
                                let commande = new Commande();
                                // Essayer de parser, même si le format peut varier
                                try {
                                    commande.parseUtilitaire(id, $(elt).next().find("a").text(), titreSujet.split("] ")[0].split("[")[1], titreSujet.split("] ")[1].split(" / "));
                                } catch(parseError) {
                                    console.warn("Erreur parsing titre commande pour modification état:", titreSujet, parseError);
                                    // On continue quand même, on a l'ID et le nouvel état
                                }
                                commande.etat = $("#o_selectEtatCommande").val();
                                // On reconstruit juste le titre avec le nouvel état
                                let nouveauTitre = `[${commande.etat}] ${commande.joueur ? commande.joueur : titreSujet.split("] ")[1].split(" / ")[0]} / ${commande.type ? commande.type : titreSujet.split("] ")[1].split(" / ")[1]}`;

                                promiseCmdModif.push(this.modifierSujet(nouveauTitre, " ", id));
                            }
                        }
                    });

                    if (selectedCount === 0) {
                         $.toast({...TOAST_INFO, text : "Aucune commande sélectionnée."});
                         return;
                    }

                    Promise.all(promiseCmdModif).then((values) => {
                        $.toast({...TOAST_SUCCESS, text : promiseCmdModif.length > 1 ? "Commandes mises à jour avec succès." : "Commande mise à jour avec succès."});
                        // Recharger pour voir les changements
                        setTimeout(() => location.reload(), 1000);
                    }).catch(err => {
                         $.toast({...TOAST_ERROR, text : "Erreur lors de la mise à jour des commandes."});
                         console.error("Erreur maj commandes:", err);
                    });
                    return false;
                });
            }
        }
        return this;
    }
}
