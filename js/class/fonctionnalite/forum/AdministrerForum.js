/*
 * AdministrerForum.js
 * Hraesvelg
 **********************************************************************/

/**
 * Fonctionnalité d'alliance : Ajout des boutons de préparation rapides pour un SDC ou une Guerre.
 *
 * @class AdministrerForum
 * @extends {FonctionnaliteAlliance}
 */
Utils.register(class AdministrerForum extends FonctionnaliteAlliance {

    static ABREVIATIONS_HISTORY = ['AF'];

    static NIVEAU_DROIT_REQUIS = 'A';

    /**
     * @returns {Promise<void>}
     */
    async run() {
        if ($("img[src='images/icone/outil.gif']").length && !$("#o_afficheMenuUtilitaire").length) {
            $("#cat_forum").prepend(`<span id="o_afficheMenuUtilitaire" class="o_forumOption categorie_forum"><img src="${IMG_OUTIIIL}" alt="outiiil"/></span>
                <span id="o_menuUtilitaire" class="ligne_paire o_prepareUtilitaire">
                    <a href="#" id="o_creerUtilitaire">» Préparer le forum pour un SDC</a><br/>
                    <a href="#" id="o_preparerGuerre">» Préparer une section pour une guerre</a>
            </span>`);
            $("#o_afficheMenuUtilitaire").click((e) => { $("#o_menuUtilitaire").toggle(); return false; });
            // ajout de l'input pour la selection du tag alliance
            $("#alliance .simulateur").append(`<div id="o_formGuerre" style="display:none;"><input id="o_tagGuerre" type="text"/> <button id="o_creerSectionGuerre">Créer section</button></div>`);
            // Creation de l'utilitaire
            $("#o_creerUtilitaire").onActionSecurisee('click', this, async (e) => {
                if (nomsSectionsRequis) {
                    for (const nomSection of nomsSectionsRequis) {
                        if (!$(`#cat_forum span:contains('${nomSection}')`).length) {
                            try {
                                const idCat = await Utils.creerSectionEtRetournerId(nomSection);
                                if (idCat) {
                                    if (monProfilUtilisateur.parametre[nomSection]) {
                                        monProfilUtilisateur.parametre[nomSection].valeur = idCat;
                                        monProfilUtilisateur.parametre[nomSection].sauvegarde();
                                    }

                                    Utils.modifierSection(nomSection, idCat, "cache").then((data) => {
                                        $.toast({ ...TOAST_SUCCESS, text: `La section ${nomSection} a été correctement créée et son ID sauvegardé.` });
                                    }, (jqXHR, textStatus, errorThrown) => {
                                        console.error(`[AdministrerForum][o_creerUtilitaire] Erreur lors de la modification de la section ${nomSection} (ID: ${idCat}):`, textStatus, errorThrown);
                                        $.toast({ ...TOAST_ERROR, text: `Une erreur réseau a été rencontrée lors de la protection de la section ${nomSection}.` });
                                    });
                                } else {
                                    console.warn(`[AdministrerForum][o_creerUtilitaire] ID de section non retourné pour "${nomSection}".`);
                                }
                            } catch (error) {
                                console.error(`[AdministrerForum][o_creerUtilitaire] Erreur lors de la création de la section ${nomSection}:`, error);
                                $.toast({ ...TOAST_ERROR, text: `Une erreur réseau a été rencontrée lors de la création de la section ${nomSection}.` });
                            }
                        } else {
                            $.toast({ ...TOAST_WARNING, text: `Section ${nomSection} est déjà créée !` });
                        }
                    }
                } else {
                    console.warn("[AdministrerForum][o_creerUtilitaire] nomsSectionsRequis n'est pas défini. Aucune section à créer.");
                }
                return false;
            });
            // Preparation d'une guerre
            $("#o_preparerGuerre").click((e) => { $("#o_formGuerre").toggle(); });
            $("#o_tagGuerre").autocomplete({
                source: (request, response) => { Alliance.rechercher(request.term).then((data) => { response(Utils.extraitRecherche(data, false, true)); }); },
                position: { my: "left top-6", at: "left bottom" },
                delay: 0,
                minLength: 1,
                select: (e, ui) => { $("#o_tagGuerre").val(ui.item.tag); return false; }
            }).data("ui-autocomplete")._renderItem = (ul, item) => {
                let style = '';
                return $("<li>").append(`<a style="${style}">${item.value_avec_html}</a>`).appendTo(ul);
            };
            // event sur le bouton guerre
            $("#o_creerSectionGuerre").onActionSecurisee('click', this, (e) => {
                let alliance = new Alliance({ tag: $("#o_tagGuerre").val() }), titreSection = "Guerre " + alliance.tag;
                if (!$("#cat_forum span[class^='forum']").text().toUpperCase().includes(titreSection.toUpperCase())) {
                    // on créer la section "Guerre " + tag
                    Utils.creerSection(titreSection).then((data) => {
                        // on recup la section pour ajouter les sujets des joueurs
                        let response = $("<div/>").append($(data).find("cmd:eq(1)").html());
                        let idCat = $(response).find(`input[value='${titreSection}']`).parent().attr("id").match(/\d+/)[0];
                        alliance.getDescription().then((data) => {
                            // on construit les appels de creation des sujets
                            let promiseJoueur = new Array();
                            $(data).find("#tabMembresAlliance tr:gt(0)").each((i, elt) => {
                                let pseudo = $(elt).find("td:eq(2)").text();
                                promiseJoueur.push(Utils.creerSujet(pseudo, `[player]${pseudo}[/player]`, idCat));
                            });
                            // on creer les sujets
                            Promise.all(promiseJoueur).then((values) => { location.reload(); });
                        }, (jqXHR, textStatus, errorThrown) => {
                            $.toast({ ...TOAST_ERROR, text: "Une erreur réseau a été rencontrée lors de la récupération de la description." });
                        });
                    }, (jqXHR, textStatus, errorThrown) => {
                        $.toast({ ...TOAST_ERROR, text: "Une erreur réseau a été rencontrée lors de la création de la section guerre." });
                    });
                } else
                    $.toast({ ...TOAST_WARNING, text: `La section "Guerre ${alliance.tag}" existe déjà !` });
            });
        }
    }
});
