/*
 * Util.js
 * Hraesvelg
 **********************************************************************/

/**
 * Données globales du projet, de fourmizzz et des fonctions utilisables partout dans le code.
 *
 * @class Utils
 */
class Utils {
    /**
    * Renvoie le serveur sur lequel joue le joueur.
    *
    * @static
    * @method serveur
    * @return {String} le serveur en cours.
    */
    static get serveur() {
        return location.hostname.split(".")[0].toUpperCase();
    }
    /**
    *
    */
    static get alliance() {
        return $("#tag_alliance").text();
    }
    /**
    * Renvoie si le joueur à du compte plus.
    *
    * @static
    * @method comptePlus
    * @return {Boolean} Vrai si le joueur a du compte plus, faux sinon.
    */
    static get comptePlus() {
        return $("#menuComptePlus a.boutonStatJoueur").length && $("#menuComptePlus a.boutonStatJoueur").text() == "Stat" ? true : false;
    }
    /**
    * Renvoie le terrain du joueur en cm².
    *
    * @static
    * @method tag
    * @return {Integer} le de nombre de cm².
    */
    static get terrain() {
        return parseInt($("#quantite_tdc").text());
    }
    /**
    * Renvoie le nombre d'ouvrières.
    *
    * @static
    * @method ouvrieres
    * @return {Integer} le nombre d'ouvriére.
    */
    static get ouvrieres() {
        return parseInt($("#nb_ouvrieres").text());
    }
    /**
    * Renvoie le nombre de nourritures en stock dans l'entrepot.
    *
    * @static
    * @method nourriture
    * @return {Integer} le quantité de nourritures.
    */
    static get nourriture() {
        return parseInt($("#nb_nourriture").text());
    }
    /**
    * Renvoie le nombre de materiaux en stock dans l'entrepot.
    *
    * @static
    * @method materiaux
    * @return {Integer} le quantité de materiaux.
    */
    static get materiaux() {
        return parseInt($("#nb_materiaux").text());
    }
    /**
    * Calcul des quantités de ressources commandées - fdthierry
    */
    static async calculQuantite(evo_commande) {
        let constructions = await monProfilJoueur.lire('Niveaux Constructions');
        switch (true) {
            // cas Champi
            case evo_commande == 0:
                return [0, COUT_CONSTUCTION[evo_commande] * Math.pow(1.85, constructions[evo_commande])];
            // cas construction
            case evo_commande > 0 && evo_commande < 13:
                return [0, COUT_CONSTUCTION[evo_commande] * Math.pow(2, constructions[evo_commande])];
            // cas recherche
            case evo_commande >= 13 && evo_commande < 23:
                let recherches = await monProfilJoueur.lire('Niveaux Recherches');
                return [COUT_RECHERCHE_POM[evo_commande - 13] * Math.pow(2, recherches[evo_commande - 13]), COUT_RECHERCHE_BOI[evo_commande - 13] * Math.pow(2, recherches[evo_commande - 13])];
            default:
                return [0, 0];
        }
    }
    /**
    *
    */
    static arrondiQuantite(val) {
        if (val > 10000000000) return Math.floor(val / 1000000000) * 1000000000;
        if (val > 10000000) return Math.floor(val / 1000000) * 1000000;
        if (val > 1000) return Math.floor(val / 1000) * 1000;
        return val;
    }
    /**
    * Formate un nombre entier en temps.
    *
    * @static
    * @method intToTime
    * @param {Integer} val
    * @return {String} La chaine formatée.
    */
    static intToTime(val) {
        return val ? moment.duration(val, 's').format(FORMAT_DUREE_DEFAUT).split(" ").filter((elt) => { return parseInt(elt); }).join(" ") : "0 sec";
    }
    /**
    * Convertit une chaine de caractere en entier.
    *
    * @static
    * @method timeToInt
    * @param {String} val
    * @return {Integer} le nombre de seconde correspondant la chaine.
    */
    static timeToInt(val) {
        let regexp = new RegExp("((\\d+)J ?)?\s*((\\d+)h ?)?\s*((\\d+)m ?)?\s*((\\d+)s)?\s*", "i"), duree = 0, sec, minute, heure, jour;
        if (sec = val.replace(regexp, "$8"))
            duree += ~~sec;
        if (minute = val.replace(regexp, "$6"))
            duree += (~~minute * 60);
        if (heure = val.replace(regexp, "$4"))
            duree += (~~heure * 3600);
        if (jour = val.replace(regexp, "$2"))
            duree += (~~jour * 86400);
        return duree;
    }
    /**
    * Arrondie un temps à la minute.
    *
    * @static
    * @method roundMinute
    * @param {Object} temps
    * @return {Object} temps à arrondi a la minute supérieur.
    */
    static roundMinute(temps) {
        if (moment.isMoment(temps)) {
            // Si c'est un objet moment, arrondir au début de la minute suivante
            return temps.add(1, 'minute').startOf('minute');
        } else {
            // Si c'est un entier (durée en secondes), appliquer la logique actuelle
            return moment().add(temps, 's').add(1, "minute").startOf("minute");
        }
        // Retourne null ou gère l'erreur si le type n'est pas pris en charge
        return null;
    }
    /**
    * Decremente un chrono dynamique toutes les secondes.
    *
    * @static
    * @method decreaseTime
    * @param {Integer} time
    * @param {String} id
    * @return L'affichage du contenue de l'id est decrementé d'une seconde.
    */
    static decreaseTime(time, id) {
        $("#" + id).text(this.intToTime(time));
        if (time > 0)
            setTimeout(() => { Utils.decreaseTime(time - 1, id); }, 1000);
    }
    /**
    * Incremente un chrono dynamique toutes les secondes.
    *
    * @static
    * @method incrementTime
    * @param {Integer} time
    * @param {String} id
    * @param {String} idRound
    * @return L'affichage du contenue de l'id est incrementé d'une seconde.
    */
    static incrementTime(time, id, idRound = "") {
        let retour = moment().add(time, 's');
        $("#" + id).text(retour.format("D MMM à HH[h]mm[m]ss[s]"));
        if (idRound && retour.seconds() % 60 == 0) $("#" + idRound).text(Utils.roundMinute(time).format("D MMM à HH[h]mm"));
        setTimeout(() => { Utils.incrementTime(time, id, idRound); }, 1000);
    }
    /**
    * Réduit la taille d'une chaine de caractére qui représente une durée.
    *
    * @static
    * @method shortcutTime
    * @param {String} time
    * @return {String} La chaine coupée.
    */
    static shortcutTime(time) {
        let tmp = this.intToTime(time).split(" ");
        if (tmp.length > 4)
            return tmp.splice(0, tmp.length - 3).join(" ");
        else if (tmp.length > 3)
            return tmp.splice(0, tmp.length - 2).join(" ");
        else if (tmp.length > 2)
            return tmp.splice(0, tmp.length - 1).join(" ");
        else
            return tmp.join(" ");
    }
    /**
    * Extrait les paramètres d'une URL.
    *
    * @static
    * @method extractUrlParams
    * @return {Array} La liste associatives des paramètres.
    */
    static extractUrlParams() {
        let f = new Array(), t = location.search.substring(1).split('&');
        if (t != '') {
            for (let elt of t) {
                let x = elt.split('=');
                f["" + x[0]] = "" + x[1];
            }
        }
        return f;
    }
    /**
    *
    */
    static extraitRecherche(data, joueur = true, alliance = true) {
        let element = new Array(), cptJ = alliance ? 3 : 6, cptA = joueur ? 3 : 6;
        // si la recherche renvoi ne renvoi qu'un resultat on tombe sur un profil de joueur
        if ($(data).find("h2").length) {
            let pseudo = $(data).find("h2").text();
            element.push({ value: pseudo, value_avec_html: pseudo, url: "Membre.php?Pseudo=" + pseudo });
        } else {
            $(data).find(".simulateur:eq(0) tr").each((i, elt) => {
                // les joueurs et les alli ont 6 cellules
                if ($(elt).find("td").length == 6) {
                    let cellule = $(elt).find("td:eq(1) a"), lien = cellule.attr("href"), nom = cellule.text();
                    // c'est un joueur si on trouve un lien de profil cellule 2
                    if (joueur && lien.includes("Membre.php") && cptJ) {
                        element.push({ value: nom, value_avec_html: nom, url: "Membre.php?Pseudo=" + nom });
                        cptJ--;
                    }
                    // c'est une alliance
                    if (alliance && lien.includes("classementAlliance.php") && cptA) {
                        let tag = $(elt).find("td:eq(0)").text();
                        element.push({ value: nom, value_avec_html: `<span style="white-space:nowrap;"><strong>${tag}</strong> ${nom}</span>`, tag: tag, url: "classementAlliance.php?alliance=" + tag });
                        cptA--;
                    }
                }
            });
        }
        return element;
    }

    /**
     * Compare deux chaînes de version (ex: "1.0.0", "1.1.0").
     *
     * @static
     * @method compareVersions
     * @param {String} v1 La première chaîne de version.
     * @param {String} v2 La deuxième chaîne de version.
     * @return {Number} -1 si v1 < v2, 0 si v1 == v2, 1 si v1 > v2.
     */
    static compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        const maxLength = Math.max(parts1.length, parts2.length);

        for (let i = 0; i < maxLength; i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;

            if (p1 < p2) {
                return -1;
            }
            if (p1 > p2) {
                return 1;
            }
        }
        return 0;
    }

    /**
     * Adds a class to the window object.
     *
     * @static
     * @method register
     * @param {Object} classObject The class to add to the window.
     */
    static register(classObject) {
        if (classObject && classObject.name) {
            window[classObject.name] = classObject;
        }
    }

    /**
     * Pause l'exécution pendant un nombre de millisecondes donné.
     * @static
     * @method sleep
     * @param {Number} ms - Le nombre de millisecondes à attendre.
     * @returns {Promise<void>} Une promesse qui se résout après le délai spécifié.
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Formate un nombre avec un séparateur de milliers (espace par défaut).
     *
     * @static
     * @method formatNombre
     * @param {Number|String} val - Le nombre à formater.
     * @param {String} [separateur=' '] - Le séparateur à utiliser.
     * @return {String} Le nombre formaté sous forme de chaîne.
     */
    static formatNombre(val, separateur = ' ') {
        if (val === null || val === undefined) return '';
        let s = val.toString().trim();
        // Vérifier si la chaîne représente un nombre pur (entier ou décimal)
        if (!/^-?\d+(\.\d+)?$/.test(s)) return val;

        let parts = s.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separateur);
        return parts.join(".");
    }

    /**
    * Crée une section forum.
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
            const data = await Utils.creerSection(nomSection);
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
    static modifierSection(nomSection, id, categorie) {
        return $.ajax({
            type: "post",
            url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
            data: {
                "xajax": "renommerCategorie",
                "xajaxargs[]": `<xjxquery><q>nom=${nomSection}&type=${categorie}&ID_cat=${id}&del=Supprimer</q></xjxquery>`,
                "xajaxr": moment().valueOf()
            }
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
    * Crée un sujet.
    */
    static creerSujet(nomSujet, contenu, id, type = "normal") {
        return $.ajax({
            type: "post",
            url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
            data: {
                "xajax": "envoiNouveauSujet",
                "xajaxargs[]": `<xjxquery><q>cat=${id}&sujet=${nomSujet}&message=${encodeURIComponent(contenu)}&type=${type}&modifiable=envoyer&send=Envoyer&question=&reponse[]=&reponse[]=&reponse[]=</q></xjxquery>`,
                "xajaxr": moment().valueOf()
            }
        }).catch(error => {
            console.error(`[Utils] Erreur lors de la création du sujet "${nomSujet}" (ID: ${id}):`, error);
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
    static async creerSujetEtRetournerId(nomSujet, contenu, id, type = "normal") {
        try {
            const data = await Utils.creerSujet(nomSujet, contenu, id, type);
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
    */
    static modifierSujet(nomSujet, contenu, id) {
        return $.ajax({
            type: "post",
            url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
            data: {
                "xajax": "envoiEditTopic",
                "xajaxargs[]": `<xjxquery><q>IDTopic=${id}&sujet=${nomSujet}&message=${encodeURIComponent(contenu)}&modifiable=envoyer&send=Envoyer</q></xjxquery>`,
                "xajaxr": moment().valueOf()
            }
        }).catch(error => {
            console.error(`[Utils] Erreur lors de la modification du sujet "${nomSujet}" (ID: ${id}):`, error);
            throw error;
        });
    }

    /**
     * Consulte un sujet et retourne le contenu HTML brut.
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
     * Consulte un sujet et retourne une liste d'objets message, incluant le contenu et l'ID de chaque message.
     * @async
     * @param {Number} idSujet L'ID du sujet à consulter.
     * @returns {Promise<{titre: String, messages: Array<{id: Number, contenu: String}>}>} Une promesse qui résout avec un objet contenant le titre du sujet et un tableau d'objets message.
     */
    static async consulterSujetAvecMessagesEtIds(idSujet) {
        try {
            const dataSujet = await Utils.consulterSujet(idSujet);
            const response = $(dataSujet).find("cmd:eq(1)").text();
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
    * Envoie un message.
    */
    static envoyerMessage(id, message) {
        return $.ajax({
            type: "post",
            url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
            data: {
                "xajax": "envoiNouveauMessage",
                "xajaxargs[]": `<xjxquery><q>topic=${id}&message=${message}&send=Envoyer</q></xjxquery>`,
                "xajaxr": moment().valueOf()
            }
        });
    }

    /**
     * Supprime un message du forum.
     * @static
     * @param {number|string} idMessage L'ID du message à supprimer.
     * @returns {Promise<any>}
     */
    static supprimerMessage(idMessage) {
        return $.ajax({
            type: "post",
            url: "http://" + Utils.serveur + ".fourmizzz.fr/alliance.php?forum_menu",
            data: {
                "xajax": "callSupprimerMessage",
                "xajaxargs[]": idMessage,
                "xajaxr": moment().valueOf()
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
    static async envoyerMessageEtRetournerId(idSujet, message) {
        try {
            const data = await Utils.envoyerMessage(idSujet, message);
            const response = $(data).find("cmd:eq(1)").text();

            if (!response || response.includes("Vous n'avez pas accès à ce forum.")) {
                console.error("[Utils][envoyerMessageEtRetournerId] Impossible de récupérer le contenu du sujet après l'envoi du message.");
                return null;
            }

            const messageElements = $("<div/>").append(response).find(".messageForum");

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
            return null;
        } catch (error) {
            console.error(`[Utils][envoyerMessageEtRetournerId] Erreur lors de l'envoi pour le sujet ${idSujet}:`, error);
            throw error;
        }
    }

    /**
     * Transfère un sujet existant vers une nouvelle section du forum.
     * @async
     * @param {Number} idSujet L'ID du sujet à transférer.
     * @param {Number} idSectionDestination L'ID de la section de destination.
     * @returns {Promise<Boolean>} Une promesse qui résout avec true en cas de succès, false en cas d'échec.
     */
    static async transfererSujet(idSujet, idSectionDestination) {
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

            return true;

        } catch (error) {
            console.error(`[Utils] Erreur lors du transfert du sujet ID: ${idSujet} vers la section ID: ${idSectionDestination}:`, error);
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
    static async modifierMessage(idMessage, nouveauContenu) {
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

            return true;

        } catch (error) {
            console.error(`[Utils] Erreur lors de la modification du message ID: ${idMessage}:`, error);
            return false;
        }
    }

    /**
     * Récupère tous les sujets d'une section et les place dans une liste de dictionnaires.
     * @async
     * @param {Number} idSection L'ID de la section à consulter.
     * @returns {Promise<Array<{id: Number, contenu: String}>>} Une promesse qui résout avec une liste de sujets.
     */
    static async recupererSujetsSection(idSection) {
        try {
            const dataSection = await Utils.consulterSection(idSection);
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
            return [];
        }
    }
}

/**
 * Plugin jQuery pour sécuriser une action utilisateur (clic).
 * Vérifie que les données ne sont pas périmées avant d'exécuter l'action.
 * @param {String} evenement - Le nom de l'événement (ex: 'click').
 * @param {FonctionnaliteAlliance} fonctionnalite - L'instance de la fonctionnalité parente.
 * @param {Function} callback - La fonction à exécuter si les données sont à jour.
 */
$.fn.onActionSecurisee = function (evenement, fonctionnalite, callback) {
    return this.on(evenement, async function (e, data) {
        // 1. Validation du flag de sécurité
        if (data && data.isSecured) {
            return await callback.call(this, e);
        }

        // 2. Blocage de l'événement original
        e.preventDefault();
        e.stopImmediatePropagation();

        try {
            // 3. Identification des signatures d'appels de chargement
            const signatures = fonctionnalite._determinerAppelsChargement();

            // 4. Prise de l'empreinte globale initiale (sur les objets en cache)
            const empreinteInitiale = await fonctionnalite._prendreEmpreinteGlobale(signatures);

            // 5. Vérifications initiales (Droits, Versions, Membre) avec rafraîchissement forcé
            const conditionsOk = await fonctionnalite.verifierConditionsInitiales(true);
            if (!conditionsOk) {
                $.toast({
                    ...TOAST_INFO,
                    heading: "Action bloquée",
                    text: "Vos droits, votre appartenance à l'alliance ou la configuration du forum ont été modifiés. La page va être rechargée.",
                    hideAfter: 5000
                });
                setTimeout(() => location.reload(), 5000);
                return;
            }

            // 6. Rafraîchissement global (vide le cache)
            await fonctionnalite.rafraichirDonneesFonctionnalite();

            // 7. Prise de la nouvelle empreinte (provoque le rechargement effectif)
            const empreinteFinale = await fonctionnalite._prendreEmpreinteGlobale(signatures);
            console.warn("[Utils][onActionSecurisee] Empreinte initiale: " + empreinteInitiale + ", Empreinte finale: " + empreinteFinale);
            if (empreinteInitiale !== empreinteFinale) {
                $.toast({
                    ...TOAST_INFO,
                    heading: "Données obsolètes",
                    text: "Les données ont été modifiées par un autre utilisateur. L'affichage va être actualisé.",
                    hideAfter: 3000
                });
                setTimeout(() => location.reload(), 3000);
                return;
            }

            // 8. Tout est OK, on redéclenche l'événement avec le flag isSecured
            $(this).trigger(evenement, [{ isSecured: true }]);

            // Cas particulier des liens <a> : trigger('click') ne déclenche pas la navigation native
            if (evenement === 'click' && $(this).is('a')) {
                const href = $(this).attr('href');
                if (href && href !== '#' && !href.startsWith('javascript:')) {
                    window.location.href = href;
                }
            }

        } catch (error) {
            console.error("[onActionSecurisee] Erreur lors de la sécurisation de l'action:", error);
            $.toast({
                ...TOAST_ERROR,
                heading: "Erreur de synchronisation",
                text: "Une erreur est survenue lors de la vérification des données. La page va être rechargée par sécurité.",
                hideAfter: 3000
            });
            setTimeout(() => location.reload(), 3000);
        }
    });
};

