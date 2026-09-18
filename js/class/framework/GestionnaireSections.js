Utils.register(class GestionnaireSections {

    /**
     * Dictionnaire contenant le nom et l'id de chaque section
     * @type {Object}
     */
    idsSections = {};

    /**
     * Indique si le verrou est actuellement acquis.
     * @type {Boolean}
     * @private
     */
    #lockAcquired = false;

    /**
     * File d'attente pour les fonctions en attente d'acquérir le verrou.
     * @type {Array<Function>}
     * @private
     */
    #lockQueue = [];

    /**
     * Acquiert un verrou unique sur l'instance du gestionnaire.
     * Bloque toutes les autres tentatives d'acquisition jusqu'à ce qu'il soit libéré.
     * @returns {Promise<void>}
     * @private
     */
    async #acquireLock() {
        return new Promise(resolve => {
            const tryAcquire = () => {
                if (this.#lockAcquired) {
                    this.#lockQueue.push(tryAcquire);
                } else {
                    this.#lockAcquired = true;
                    resolve();
                }
            };
            tryAcquire();
        });
    }

    /**
     * Libère le verrou unique.
     * Notifie la prochaine fonction en attente dans la file.
     * @private
     */
    #releaseLock() {
        this.#lockAcquired = false;
        if (this.#lockQueue.length > 0) {
            const nextInQueue = this.#lockQueue.shift();
            nextInQueue();
        }
    }

    constructor() {
        sectionsRequises.add({
            nom: 'Sections Outiiil',
            visibilite: 'restreint',
            estDerniere: true
        });
    }

    static getPlusRestrictif(v1, v2) {
        const priority = { 'caché': 3, 'restreint': 2, 'visible': 1 };
        const p1 = priority[v1] || 3;
        const p2 = priority[v2] || 3;
        return p1 >= p2 ? v1 : v2;
    }

    /**
     * Vérifie si le joueur a le droit de voir la catégorie.
     * @param {String} visibilite - La visibilité de la catégorie ('caché', 'restreint', 'visible').
     * @returns {Boolean} - True si le joueur a le droit, false sinon.
     * @private
     */
    async #hasRightsFor(visibilite) {
        const droitsFourmizzz = await monProfilJoueur.lire('Droits Fourmizzz');
        if (!droitsFourmizzz) return false;
        if (visibilite === 'caché') return droitsFourmizzz['Voir les forums cachés'];
        if (visibilite === 'restreint') return droitsFourmizzz['Voir les forums restreints'];
        return true;
    }

    async chargerSections() {
        await this.#acquireLock();
        try {
            let html;
            try {
                const data = await $.ajax({
                    type: "post",
                    url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
                    dataType: "text",
                    data: {
                        "xajax": "callGetForum",
                        "xajaxargs[]": "",
                        "xajaxr": moment().valueOf()
                    }
                });

                // Analyse propre et standard du document XML avec DOMParser.
                // Cela extrait automatiquement le texte du CDATA proprement sans ses balises d'enveloppe.
                const xmlDoc = new DOMParser().parseFromString(data, "text/xml");
                const allianceCmd = xmlDoc.querySelector("cmd[t='alliance']");
                html = allianceCmd.textContent;

            } catch (e) {
                console.error("[GestionnaireSections] Erreur lors de la récupération du menu forum :", e);
                return false;
            }

            const element = $("<div/>").html(html);
            const allForumSpans = element.find("span[class^='forum']");

            // Récupérer les visibilités réelles via la zone admin (options du forum)
            let optionsHtml = "";
            const droitsFourmizzz = await monProfilJoueur.lire('Droits Fourmizzz');
            if (droitsFourmizzz['Administrer le forum']) {
                try {
                    const data = await $.ajax({
                        type: "post",
                        url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
                        data: {
                            "xajax": "callZoneAdmin",
                            "xajaxargs[]": "",
                            "xajaxr": moment().valueOf()
                        }
                    });
                    $(data).find("cmd").each(function () {
                        const txt = $(this).text();
                        if (txt.includes("Sections du Forum") || txt.includes("id=\"cat_forum\"")) {
                            optionsHtml = txt;
                        }
                    });
                } catch (err) {
                    console.error("[GestionnaireSections] Erreur lors de la récupération de la zone d'administration forum :", err);
                }
            }

            const categoriesOptions = {};
            if (optionsHtml) {
                const $options = $("<div/>").html(optionsHtml);
                $options.find("form[id^='cat']").each(function () {
                    const $form = $(this);
                    const idCat = $form.attr("id").replace("cat", "");
                    const nomSection = $form.find("input[name='nom']").val();
                    const actualVisibility = $form.find("select[name='type']").val();

                    if (nomSection && idCat && actualVisibility) {
                        categoriesOptions[idCat] = {
                            nom: nomSection.trim(),
                            visibilite: actualVisibility // "visible", "restreint" ou "cache"
                        };
                    }
                });
            }

            const sectionsList = Array.from(sectionsRequises);

            for (const sec of sectionsList) {
                const nomSection = sec.nom;
                const visibiliteTheorique = sec.visibilite;

                let storedId = monProfilUtilisateur.parametre[nomSection].valeur;
                let sectionActuelleValide = false;

                if (storedId) {
                    const currentSectionElement = allForumSpans.filter(function () {
                        const classMatch = $(this).attr("class").match(/\d+/);
                        return classMatch && classMatch[0] == storedId;
                    });

                    if (currentSectionElement.length) {
                        const currentName = currentSectionElement.text().trim();
                        if (currentName.includes(nomSection)) {
                            sectionActuelleValide = true;
                            this.idsSections[nomSection] = storedId;

                            if (droitsFourmizzz['Administrer le forum'] && categoriesOptions[storedId]) {
                                let actualVisibility = categoriesOptions[storedId].visibilite;
                                const typeCategorie = Utils.normaliser(visibiliteTheorique);
                                if (Utils.normaliser(actualVisibility) !== typeCategorie) {
                                    try {
                                        await AccesForum.modifierSection(storedId, nomSection, typeCategorie);
                                    } catch (err) {
                                        console.error(`[GestionnaireSections] Erreur visibilite section ${nomSection} :`, err);
                                    }
                                }
                            }
                        }
                    }
                }

                if (!sectionActuelleValide) {
                    const exactMatchElement = allForumSpans.filter(function () {
                        return $(this).text().trim() === nomSection;
                    });

                    if (exactMatchElement.length) {
                        const newPageId = exactMatchElement.attr("class").match(/\d+/)[0];
                        this.idsSections[nomSection] = newPageId;
                        sectionActuelleValide = true;

                        if (droitsFourmizzz['Administrer le forum'] && categoriesOptions[newPageId]) {
                            let actualVisibility = categoriesOptions[newPageId].visibilite;
                            const typeCategorie = Utils.normaliser(visibiliteTheorique);
                            if (Utils.normaliser(actualVisibility) !== typeCategorie) {
                                try {
                                    await AccesForum.modifierSection(newPageId, nomSection, typeCategorie);
                                } catch (err) {
                                    console.error(`[GestionnaireSections] Erreur visibilite section ${nomSection} :`, err);
                                }
                            }
                        }
                    }
                }

                if (!sectionActuelleValide) {
                    const hasRights = await this.#hasRightsFor(visibiliteTheorique);
                    console.log(`[GestionnaireSections] hasRights pour ${nomSection}: ${hasRights}`);
                    if (hasRights) {
                        this.idsSections[nomSection] = 'inexistant';
                    } else {
                        this.idsSections[nomSection] = '';
                    }
                }
            }

            await this.#synchroniser();

            let idsUpdated = false;
            for (const nomSection of Object.keys(this.idsSections)) {
                const oldId = monProfilUtilisateur.parametre[nomSection].valeur;
                const currentId = this.idsSections[nomSection];
                let newId = "";
                if (currentId !== 'inexistant' && currentId !== '') {
                    newId = currentId;
                }
                if (oldId !== newId) {
                    monProfilUtilisateur.parametre[nomSection].valeur = newId;
                    monProfilUtilisateur.parametre[nomSection].sauvegarde();
                    idsUpdated = true;
                }
            }

            if (idsUpdated) {
                $.toast({ ...TOAST_SUCCESS, text: "IDs des sections forum Outiiil mis à jour." });
            }
            return true;
        } finally {
            this.#releaseLock();
        }
    }

    /**
     * Synchronise les IDs des sections avec le forum.
     * @returns {Boolean} - True si la synchronisation a réussi, false sinon.
     * @private
     */

    async #synchroniser() {
        const idSectionGestionnaire = this.idsSections['Sections Outiiil'];
        if (idSectionGestionnaire === '' || idSectionGestionnaire === 'inexistant') {
            return false;
        }

        let sujets;
        try {
            const res = await AccesForum.recupererSujetsSection(idSectionGestionnaire);
            sujets = res.sujets;
        } catch (e) {
            console.error("[GestionnaireSections] Impossible de charger les sujets du gestionnaire :", e);
            return false;
        }

        const subjectsMap = {};
        for (const s of sujets) {
            const parsed = JSON.parse(s.titre);
            subjectsMap[parsed.nom] = { idSujet: s.id, idForum: parsed.id };
        }

        for (const nomSection of Object.keys(this.idsSections)) {
            if (nomSection === 'Sections Outiiil') continue;

            const internalId = this.idsSections[nomSection];
            const forumData = subjectsMap[nomSection];

            if (forumData) {
                const forumId = forumData.idForum;
                const idSujet = forumData.idSujet;

                if (internalId === 'inexistant') {
                    if (forumId !== "") {
                        try {
                            const newContent = JSON.stringify({ nom: nomSection, id: "" });
                            await AccesForum.modifierSujet(idSujet, newContent);
                        } catch (err) {
                            console.error(`[GestionnaireSections] Erreur de vidage forum pour ${nomSection} :`, err);
                        }
                    }
                } else if (internalId === "") {
                    this.idsSections[nomSection] = forumId;
                } else {
                    if (internalId !== forumId) {
                        try {
                            const newContent = JSON.stringify({ nom: nomSection, id: internalId });
                            await AccesForum.modifierSujet(idSujet, newContent);
                        } catch (err) {
                            console.error(`[GestionnaireSections] Erreur de mise à jour forum pour ${nomSection} :`, err);
                        }
                    }
                }
            } else {
                try {
                    const newContent = JSON.stringify({ nom: nomSection, id: (internalId === "inexistant" ? "" : internalId) });
                    await AccesForum.creerSujet(idSectionGestionnaire, newContent, " ");
                } catch (err) {
                    console.error(`[GestionnaireSections] Erreur de création de sujet pour ${nomSection} :`, err);
                }
            }
        }
        return true;
    }
});
