class AccesForum {

    /**
    * Crée une section forum.
    * @private
    */
    static creerSection(nomSection) {
        return $.ajax({
            type: "post",
            url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
            data: {
                "xajax": "ajoutCategorie",
                "xajaxargs[]": `<xjxquery><q>nom=${nomSection}</q></xjxquery>`,
                "xajaxr": moment().valueOf()
            }
        });
    }

    /**
     * Crée une section et retourne son ID.
     * @async
     * @param {string} nomSection Le nom de la section à créer.
     * @returns {Promise<number|null>} Une promesse qui résout avec l'ID de la section créée (null si non trouvé).
     */
    static async creerSectionEtRetournerId(nomSection) {
        try {
            const data = await AccesForum.creerSection(nomSection);
            const response = $("<div/>").append($(data).find("cmd:eq(1)").html());
            const elementSection = response.find(`input[value='${nomSection}']`);

            if (elementSection.length) {
                const idCat = elementSection.parent().attr("id").match(/\d+/)[0];
                return parseInt(idCat, 10);
            } else {
                console.error(`[Utils][creerSectionEtRetournerId] Impossible de trouver l'ID de la section nouvellement créée "${nomSection}".`);
                return null;
            }
        } catch (error) {
            console.error(`[Utils][creerSectionEtRetournerId] Erreur lors de la création de la section "${nomSection}":`, error);
            throw error;
        }
    }

    /**
    * Modifie une section forum.
    */
    static modifierSection(id, nomSection, categorie = "cache") {
        return $.ajax({
            type: "post",
            url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
            data: {
                "xajax": "renommerCategorie",
                "xajaxargs[]": `<xjxquery><q>nom=${nomSection}&type=${categorie}&ID_cat=${id}&del=Supprimer</q></xjxquery>`,
                "xajaxr": moment().valueOf()
            }
        }).catch(error => {
            console.error(`[Utils] Erreur lors de la modification de la section "${nomSection}" (ID: ${id}):`, error);
            throw error;
        });
    }

    /**
    * Consulte une section du forum.
    */
    static consulterSection(id) {
        const timerName = `consulterSection-${id}`;
        console.time(timerName);
        console.log(`[Utils] Début de consulterSection pour ID: ${id}`);
        return $.ajax({
            type: "post",
            url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
            data: {
                "xajax": "callGetForum",
                "xajaxargs[]": id,
                "xajaxr": moment().valueOf()
            },
            timeout: 10000 // Ajout d'un timeout de 10 secondes
        }).then(data => {
            console.log(`[Utils] consulterSection succès pour ID: ${id}.`);
            console.timeEnd(timerName);
            return data;
        }).catch(error => {
            if (error.statusText === "timeout") {
                console.error(`[Utils] consulterSection échec pour ID: ${id}. Erreur: Timeout de la requête.`);
            } else {
                console.error(`[Utils] consulterSection échec pour ID: ${id}. Erreur:`, error);
            }
            console.timeEnd(timerName);
            throw error; // Rejeter l'erreur pour qu'elle soit gérée par l'appelant
        });
    }

    /**
    * Récupère tous les sujets d'une section et les place dans une liste de dictionnaires.
    * @async
    * @param {Number} idSection L'ID de la section à consulter.
    * @returns {Promise<Array<{id: Number, contenu: String}>>} Une promesse qui résout avec une liste de sujets.
    */
    static async recupererSujetsSection(idSection) {
        try {
            const dataSection = await AccesForum.consulterSection(idSection);
            const responseSection = $(dataSection).find("cmd:eq(1)").text();

            if (responseSection.includes("Vous n'avez pas accès à ce forum.")) {
                console.warn(`[Utils][recupererSujetsSection] Accès refusé à la section forum ID: ${idSection}. Retourne une liste vide.`);
                return [];
            }

            const sujetElements = $("<div/>").append(responseSection).find("#form_cat tr:gt(0)");
            const sujets = [];

            sujetElements.each((i, elt) => {
                const titreSujet = $(elt).find("td:eq(1)").text();
                const dateDerniereActiviteText = $(elt).find("td:eq(2)").text().trim();
                const dateMatch = dateDerniereActiviteText.match(/.*?(\d+[ \u00A0]+[a-zA-Z\u00C0-\u017F]+\.?[ \u00A0]+à[ \u00A0]*\d+h\d+)/);
                const datePartToParse = dateMatch ? dateMatch[1] : '';
                let id = null;
                const onclickAttr = $(elt).find("a.topic_forum").attr("onclick");
                if (onclickAttr) {
                    const match = onclickAttr.match(/\d+/);
                    if (match) {
                        id = parseInt(match[0], 10);
                    }
                }

                if (id && titreSujet) {
                    sujets.push({
                        id: id,
                        contenu: titreSujet
                    });
                } else {
                    console.warn(`[Utils][recupererSujetsSection] Sujet ignoré en raison de données manquantes ou invalides. ID: ${id}, Titre: "${titreSujet}".`);
                }
            });
            return sujets;

        } catch (error) {
            console.error(`[Utils][recupererSujetsSection] Erreur lors de la récupération des sujets de la section ${idSection}:`, error);
            throw error;
        }
    }

    /**
    * Crée un sujet.
    * @private
    */
    static creerSujet(id, nomSujet, contenu = " ", type = "normal") {
        return $.ajax({
            type: "post",
            url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
            data: {
                "xajax": "envoiNouveauSujet",
                "xajaxargs[]": `<xjxquery><q>cat=${id}&sujet=${nomSujet}&message=${encodeURIComponent(contenu)}&type=${type}&modifiable=envoyer&send=Envoyer&question=&reponse[]=&reponse[]=&reponse[]=</q></xjxquery>`,
                "xajaxr": moment().valueOf()
            }
        });
    }

    /**
     * Crée un sujet et retourne son ID.
     * @async
     * @param {string} nomSujet - Nom du sujet.
     * @param {string} contenu - Contenu du premier message.
     * @param {number|string} id - L'ID de la section.
     * @param {string} [type="normal"] Le type de sujet.
     * @returns {Promise<number|null>} Une promesse qui résout avec l'ID du sujet créé (null si non trouvé).
     */
    static async creerSujetEtRetournerId(id, nomSujet, contenu = " ", type = "normal") {
        try {
            const data = await AccesForum.creerSujet(id, nomSujet, contenu, type);
            const response = $(data).find("cmd:eq(1)").text();

            if (!response || response.includes("Vous n'avez pas accès à ce forum.")) {
                console.error("[Utils][creerSujetEtRetournerId] Impossible de récupérer le contenu de la section après la création du sujet.");
                return null;
            }

            const sujetElements = $("<div/>").append(response).find("#form_cat tr:gt(0)");
            let idSujet = null;

            sujetElements.each((i, elt) => {
                const titreSujet = $(elt).find("td:eq(1)").text();
                // Use startsWith for a more robust comparison
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
                console.error(`[Utils][creerSujetEtRetournerId] Impossible de trouver l'ID du sujet nouvellement créé "${nomSujet}".`);
            }

            return idSujet;
        } catch (error) {
            console.error(`[Utils][creerSujetEtRetournerId] Erreur lors de la création du sujet "${nomSujet}":`, error);
            throw error;
        }
    }

    /**
     * Modifie un sujet.
     * @param {string} nomSujet - Nom du sujet.
     * @param {string} contenu - Contenu.
     * @param {number} idSujet - ID du sujet.
     */
    static async modifierSujet(idSujet, nomSujet, contenu = " ") {
        return $.ajax({
            type: "post",
            url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
            data: {
                "xajax": "envoiEditTopic",
                "xajaxargs[]": `<xjxquery><q>IDTopic=${idSujet}&sujet=${nomSujet}&message=${encodeURIComponent(contenu)}&modifiable=envoyer&send=Envoyer</q></xjxquery>`,
                "xajaxr": moment().valueOf()
            }
        }).catch(error => {
            console.error(`[Utils] Erreur lors de la modification du sujet "${nomSujet}" (ID: ${idSujet}):`, error);
            throw error;
        });
    }

    /**
     * Consulte un sujet et retourne le contenu HTML brut.
     * @private
     * @param {Number} id L'ID du sujet.
     * @returns {Promise<String>} Une promesse qui résout avec le contenu HTML brut du sujet.
     */
    static consulterSujet(id) {
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
     * Consulte un sujet et retourne une liste d'objets message, incluant le contenu et l'ID de chaque message, ainsi que l'ID de la section courante.
     * @async
     * @param {Number} idSujet L'ID du sujet à consulter.
     * @returns {Promise<{idSection: Number, titre: String, messages: Array<{id: Number, contenu: String}>}>} Une promesse qui résout avec un objet contenant l'ID de la section, le titre du sujet et un tableau d'objets message.
     */
    static async consulterSujetAvecMessagesEtIds(idSujet) {
        try {
            const dataSujet = await AccesForum.consulterSujet(idSujet);
            const response = $(dataSujet).find("cmd:eq(1)").text();

            if (!response || response.includes("Vous n'avez pas accès à ce forum.")) {
                console.error("[Utils][consulterSujetAvecMessagesEtIds] Impossible de récupérer le contenu du sujet.");
                return { titre: null, messages: null };
            }

            const sujetHtml = $("<div/>").append(response);
            const titre = sujetHtml.find("h2").text();
            const messageElements = sujetHtml.find(".messageForum");
            const messages = [];

            messageElements.each((i, elt) => {
                const messageContent = $(elt).text();
                // Filtrer les messages qui ne contiennent que des espaces ou caractères invisibles
                if (messageContent.trim().length === 0) {
                    return true;
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
            console.error(`[Utils][consulterSujetAvecMessagesEtIds] Erreur lors de la consultation du sujet ${idSujet}:`, error);
            throw error;
        }
    }

    /**
     * Transfère un sujet existant vers une nouvelle section du forum.
     * @async
     * @param {Number} idSujet - ID du sujet.
     * @param {Number} idSectionDestination - ID de la section de destination.
     * @param {Number} idSectionSource - ID de la section de source.
     * @returns {Promise<Boolean>} Une promesse qui résout avec true en cas de succès, false en cas d'échec.
     */
    static async transfererSujet(idSujet, idSectionDestination, idSectionSource) {
        try {
            await $.ajax({
                type: "post",
                url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
                data: {
                    "xajax": "deplacer",
                    "xajaxargs[]": [
                        `<xjxquery><q>topic[]=${idSujet}&cat_cible=${idSectionDestination}</q></xjxquery>`,
                        idSectionSource
                    ],
                    "xajaxr": moment().valueOf()
                }
            });
            return true;
        } catch (error) {
            console.error(`[Utils] Erreur lors du transfert du sujet ID: ${idSujet} vers la section ID: ${idSectionDestination}:`, error);
            throw error;
        }
    }

    /**
     * Supprime un sujet du forum.
     * @static
     * @param {number} idSujet - L'ID du sujet à supprimer.
     * @param {number} idSection - L'ID de la section.
     * @returns {Promise<any>}
     */
    static async supprimerSujet(idSujet, idSection) {
        try {
            const data = await $.ajax({
                type: "post",
                url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
                data: {
                    "xajax": "callSupprimer",
                    "xajaxargs[]": [
                        `<xjxquery><q>topic[]=${idSujet}</q></xjxquery>`,
                        idSection
                    ],
                    "xajaxr": moment().valueOf()
                }
            });

            let responseText = "";
            if (data) {
                if (typeof data === "string") {
                    responseText = data;
                } else {
                    responseText = $(data).find("cmd").text() || $(data).text() || "";
                }
            }

            if (responseText.includes(`xajax_callGetTopic(${idSujet})`) || responseText.includes(`xajax_callGetTopic('${idSujet}')`)) {
                throw new Error(`Le sujet ID ${idSujet} est toujours présent dans la réponse du forum après suppression.`);
            }

            return data;
        } catch (error) {
            console.error(`[Utils] Erreur lors de la suppression du sujet : ${idSujet}):`, error);
            throw error;
        }
    }

    /**
    @private
    * Envoie un message.
    */
    static envoyerMessage(idSujet, message) {
        return $.ajax({
            type: "post",
            url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
            data: {
                "xajax": "envoiNouveauMessage",
                "xajaxargs[]": `<xjxquery><q>topic=${idSujet}&message=${message}&send=Envoyer</q></xjxquery>`,
                "xajaxr": moment().valueOf()
            }
        });
    }

    /**
     * Envoie un message dans un sujet et retourne l'ID du nouveau message.
     * @async
     * @param {number} idSujet - ID du sujet.
     * @param {string} message - Le message à envoyer.
     * @returns {Promise<number|null>} Une promesse qui résout avec l'ID du message envoyé (null si non trouvé).
     */
    static async envoyerMessageEtRetournerId(idSujet, message) {
        try {
            const data = await AccesForum.envoyerMessage(idSujet, message);
            const response = $(data).find("cmd:eq(1)").text();

            if (!response || response.includes("Vous n'avez pas accès à ce forum.")) {
                console.error("[Utils][envoyerMessageEtRetournerId] Impossible de récupérer le contenu du sujet après l'envoi du message.");
                return null;
            }

            const messageElements = $("<div/>").append(response).find(".messageForum");
            let idMessage = null;

            if (messageElements.length > 0) {
                const lastMessageElement = messageElements.last();
                const editLink = $(lastMessageElement).find("a[onclick*='xajax_editMessage']");
                if (editLink.length > 0) {
                    const onclickAttr = editLink.attr('onclick');
                    const match = onclickAttr.match(/xajax_editMessage\((\d+)\)/);
                    if (match && match[1]) {
                        idMessage = parseInt(match[1], 10);
                    }
                }
            }

            return idMessage;
        } catch (error) {
            console.error(`[Utils][envoyerMessageEtRetournerId] Erreur lors de l'envoi pour le sujet ${idSujet}:`, error);
            throw error;
        }
    }

    /**
     * Modifie le contenu d'un message existant dans un sujet de forum.
     * @async
     * @param {Number} idMessage - ID du message.
     * @param {String} nouveauContenu - Le nouveau contenu du message.
     * @returns {Promise<Boolean>} Une promesse qui résout avec true en cas de succès, false en cas d'échec.
     */
    static async modifierMessage(idMessage, nouveauContenu) {
        try {
            await $.ajax({
                type: "post",
                url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
                data: {
                    "xajax": "envoiEditMessage",
                    "xajaxargs[]": `<xjxquery><q>IDMessage=${idMessage}&message=${encodeURIComponent(nouveauContenu)}&send=Envoyer</q></xjxquery>`,
                    "xajaxr": moment().valueOf()
                }
            });
            return true;
        } catch (error) {
            console.error(`[Utils] Erreur lors de la modification du message ID: ${idMessage}:`, error);
            throw error;
        }
    }

    /**
 * Supprime un message du forum.
 * @static
 * @param {number} idMessage - L'ID du message à supprimer.
 * @returns {Promise<any>}
 */
    static async supprimerMessage(idMessage) {
        try {
            const data = await $.ajax({
                type: "post",
                url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
                data: {
                    "xajax": "callSupprimerMessage",
                    "xajaxargs[]": idMessage,
                    "xajaxr": moment().valueOf()
                }
            });

            let responseText = "";
            if (data) {
                if (typeof data === "string") {
                    responseText = data;
                } else {
                    responseText = $(data).find("cmd").text() || $(data).text() || "";
                }
            }

            if (responseText.includes(`remove_message(${idMessage})`) ||
                responseText.includes(`remove_message('${idMessage}')`) ||
                responseText.includes(`xajax_editMessage(${idMessage})`) ||
                responseText.includes(`xajax_editMessage('${idMessage}')`)) {
                throw new Error(`Le message ID ${idMessage} est toujours présent dans la réponse du forum après suppression.`);
            }

            return data;
        } catch (error) {
            console.error(`[Utils] Erreur lors de la suppression du message : ${idMessage}):`, error);
            throw error;
        }
    }

}