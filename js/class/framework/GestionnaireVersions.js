class GestionnaireVersions {
    /**
     * Cache des versions d'objets lues sur le forum.
     * Format : { idSujet, type, nomClasse, versionLogique, classesParametres, Lieux, idVersionLogique, idClassesParametres, idLieux }
     * @private
     * @type {Array<Object>}
     */
    versionsObjetsForum = [];

    /**
     * Cache des versions de paramètres lues sur le forum.
     * Format : { idSujet, type, nomClasse, versionLogique, formatHistory, idMessageVersionLogique, idMessageFormatHistory }
     * @private
     * @type {Array<Object>}
     */
    versionsParamsForum = [];

    /**
     * Indique si le verrou est actuellement acquis.
     * @type {Boolean}
     * @private
     */
    _lockAcquired = false;

    /**
     * File d'attente pour les fonctions en attente d'acquérir le verrou.
     * @type {Array<Function>}
     * @private
     */
    _lockQueue = [];

    /**
     * Acquiert un verrou unique sur l'instance du gestionnaire.
     * Bloque toutes les autres tentatives d'acquisition jusqu'à ce qu'il soit libéré.
     * @returns {Promise<void>}
     * @private
     */
    async _acquireLock() {
        return new Promise(resolve => {
            const tryAcquire = () => {
                if (this._lockAcquired) {
                    this._lockQueue.push(tryAcquire);
                } else {
                    this._lockAcquired = true;
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
    _releaseLock() {
        this._lockAcquired = false;
        if (this._lockQueue.length > 0) {
            const nextInQueue = this._lockQueue.shift();
            nextInQueue();
        }
    }

    constructor() {
        sectionsRequises.add({
            nom: 'Versions Outiiil',
            visibilite: 'caché',
            estDerniere: true
        });
    }

    /**
     * Vérifie la présence et l'accessibilité de la section 'Versions Outiiil' sur le forum.
     * @returns {Promise<Boolean>} Vrai si la section 'Versions Outiiil' est présente et accessible, sinon faux.
     */
    async verifierPresenceSectionVersions() {
        await this._acquireLock();
        try {
            const nomSection = 'Versions Outiiil';
            const idSection = monProfilUtilisateur.parametre[nomSection]?.valeur;

            if (idSection) {
                if (sectionsEnCache && sectionsEnCache.has(idSection)) {
                    return sectionsEnCache.get(idSection);
                }

                let estValide = false;
                try {
                    const xmlDoc = await AccesForum.consulterSection(idSection); // Assuming this already returns a parsed XML Document

                    // Check for parsing errors if the document itself indicates them (e.g., from a previous internal parse)
                    if (xmlDoc.querySelector('parsererror')) {
                        console.error(`[GestionnaireVersions.verifierPresenceSectionVersions] Erreur lors du parsing de la réponse XML (document):`, xmlDoc.querySelector('parsererror').textContent);
                        estValide = false;
                    } else {
                        // Extract the HTML content which is within the CDATA section of the 'alliance' command
                        const allianceCmdElement = xmlDoc.querySelector('cmd[n="as"][t="alliance"]');
                        if (!allianceCmdElement) {
                            console.error(`[GestionnaireVersions.verifierPresenceSectionVersions] Impossible de trouver l'élément 'cmd' avec t="alliance" dans le document XML.`);
                            estValide = false;
                        } else {
                            const htmlContent = allianceCmdElement.textContent;

                            // Parse the HTML content
                            const htmlParser = new DOMParser();
                            const htmlDoc = htmlParser.parseFromString(htmlContent, "text/html");

                            // Find the section title within the HTML. It's typically in a <span> inside the second <th> of the table.
                            // The structure is: <table> -> <tbody> (implied) -> <tr class="alt"> -> <th> (first) -> <th> (second) -> <span> (first child)
                            const sectionTitleElement = htmlDoc.querySelector('table.tab_triable tr.alt th:nth-child(2) span:first-child');
                            const extractedTitle = sectionTitleElement ? sectionTitleElement.textContent.trim() : null;

                            if (extractedTitle === nomSection) { // Vérification du titre
                                estValide = true;
                            } else {
                                console.error(`[GestionnaireVersions.verifierPresenceSectionVersions] Le titre de la section '${nomSection}' ne correspond pas au titre attendu ou les données sont invalides. Titre reçu: "${extractedTitle}".`);
                                estValide = false;
                            }
                        }
                    }
                } catch (error) {
                    console.error(`[GestionnaireVersions.verifierPresenceSectionVersions] Erreur lors de la vérification de la section '${nomSection}' (ID: ${idSection}).`, error);
                    estValide = false;
                    throw error;
                }

                sectionsEnCache.set(idSection, estValide);
                return estValide;
            }
            console.warn(`[GestionnaireVersions.verifierPresenceSectionVersions] La section '${nomSection}' n'est pas configurée.`);
            return false; // Ajout d'un retour false si idSection n'est pas trouvé
        } finally {
            this._releaseLock();
        }
    }

    /**
     * Vide et reconstruit l'état du gestionnaire en lisant les titres des sujets de la section `Versions Outiiil`.
     */
    async rafraichir() {
        await this._acquireLock();
        try {
            // 1. Réinitialisation
            this.versionsObjetsForum = [];
            this.versionsParamsForum = [];

            try {
                // 2. Chargement des Sujets
                const idSection = monProfilUtilisateur.parametre['Versions Outiiil'].valeur;

                // 2. Chargement des Sujets via recupererSujetsSection
                const sujets = await AccesForum.recupererSujetsSection(idSection);

                // 3. Parsing des Sujets et Messages
                for (const sujet of sujets) {
                    try {
                        // Extraction du Type et Nom de Classe du contenu (titre)
                        const titreMatch = sujet.contenu.match(/^(objet|parametre): (.+)$/);
                        if (!titreMatch) {
                            console.warn(`Titre de sujet de version invalide: ${sujet.contenu}`);
                            continue;
                        }
                        const type = titreMatch[1];
                        const nomClasse = titreMatch[2];

                        // Lecture des Messages avec IDs
                        const { messages: messagesDuSujet } = await AccesForum.consulterSujetAvecMessagesEtIds(sujet.id);

                        // Le message 0 est le message initial du sujet, les données commencent à l'index 1.
                        // Nous devons donc ajuster les index pour récupérer les messages de données.
                        // Si le message 0 est le message initial du sujet, alors messagesDuSujet[0] est le message initial.
                        // Les messages de données peuvent être dans n'importe quel ordre.

                        let versionLogique, classesParametres, formatsLieux, formatHistory;
                        let idMessageVersionLogique, idMessageClassesParametres, idMessageFormatsLieux, idMessageFormatHistory;

                        for (const message of messagesDuSujet) {
                            if (!versionLogique) {
                                const parsed = this._parseVersionLogique(message.contenu);
                                if (parsed) { versionLogique = parsed; idMessageVersionLogique = message.id; }
                            }
                            if (!classesParametres) {
                                const parsed = this._parseClassesParametres(message.contenu);
                                if (parsed) { classesParametres = parsed; idMessageClassesParametres = message.id; }
                            }
                            if (!formatsLieux) {
                                const parsed = this._parseLieux(message.contenu);
                                if (parsed) { formatsLieux = parsed; idMessageFormatsLieux = message.id; }
                            }
                            if (!formatHistory) {
                                const parsed = this._parseFormatHistory(message.contenu);
                                if (parsed) { formatHistory = parsed; idMessageFormatHistory = message.id; }
                            }
                        }

                        if (type === 'objet') {
                            if (!versionLogique || !classesParametres || !formatsLieux) {
                                console.warn(`[GestionnaireVersions.rafraichir] Sujet objet ${sujet.contenu} (ID: ${sujet.id}) n'a pas toutes les données requises. Données récupérées : ${versionLogique}, ${classesParametres}, ${formatsLieux}`);
                                continue;
                            }
                            this.versionsObjetsForum.push({
                                idSujet: sujet.id,
                                type,
                                nomClasse,
                                versionLogique,
                                classesParametres,
                                formatsLieux,
                                idMessageVersionLogique,
                                idMessageClassesParametres,
                                idMessageFormatsLieux
                            });
                        } else if (type === 'parametre') {
                            if (!versionLogique || !formatHistory) {
                                console.warn(`[GestionnaireVersions.rafraichir] Sujet parametre ${sujet.contenu} (ID: ${sujet.id}) n'a pas toutes les données requises.`);
                                continue;
                            }
                            this.versionsParamsForum.push({
                                idSujet: sujet.id,
                                type,
                                nomClasse,
                                versionLogique,
                                formatHistory,
                                idMessageVersionLogique,
                                idMessageFormatHistory
                            });
                        }
                    } catch (e) {
                        console.error(`[GestionnaireVersions.rafraichir] Erreur lors du parsing du sujet de version ${sujet.contenu} (ID: ${sujet.id}):`, e);
                        // Ignorer les sujets qui ne sont pas du format attendu
                        throw e;
                    }
                }
            } catch (error) {
                console.error("[GestionnaireVersions.rafraichir] Erreur lors du rafraîchissement du GestionnaireVersions:", error);
                throw error;
            }
        } finally {
            this._releaseLock();
        }
    }

    /**
     * Parse le contenu d'un message pour extraire la version logique.
     * @private
     * @param {String} contenu - Le contenu du message.
     * @returns {String|null} La version logique ou null si non trouvée.
     */
    _parseVersionLogique(contenu) {
        // According to user feedback, the content is directly the version string (e.g., "1.0"), not prefixed.
        // We need to verify it's a valid version format, allowing for leading/trailing whitespace and newlines.
        const trimmedContent = contenu.trim();
        const versionMatch = trimmedContent.match(/^\d+(\.\d+)*$/);
        return versionMatch ? trimmedContent : null;
    }

    /**
     * Parse le contenu d'un message pour extraire les classes de paramètres.
     * @private
     * @param {String} contenu - Le contenu du message.
     * @returns {Array<Array<Number>>|null} Les classes de paramètres ou null si non trouvées.
     */
    _parseClassesParametres(contenu) {
        try {
            const parsed = JSON.parse(contenu);
            if (Array.isArray(parsed) && parsed.every(arr => Array.isArray(arr) && arr.every(item => typeof item === 'number'))) {
                return parsed;
            }
        } catch (e) {
            // Not a valid JSON or not the expected format
        }
        return null;
    }

    /**
     * Parse le contenu d'un message pour extraire l'historique des formats.
     * @private
     * @param {String} contenu - Le contenu du message.
     * @returns {Array<Object>|null} L'historique des formats ou null si non trouvé.
     */
    _parseFormatHistory(contenu) {
        try {
            const parsed = JSON.parse(contenu);
            if (Array.isArray(parsed) && parsed.every(item =>
                typeof item === 'object' && item !== null &&
                'nom' in item &&
                'format' in item
            )) {
                return parsed;
            }
        } catch (e) {
            // Not a valid JSON or not the expected format
        }
        return null;
    }

    /**
     * Parse le contenu d'un message pour extraire les formats de lieux.
     * @private
     * @param {String} contenu - Le contenu du message.
     * @returns {Array<Object>|null} Les formats de lieux ou null si non trouvés.
     */
    _parseLieux(contenu) {
        try {
            const parsed = JSON.parse(contenu);
            if (Array.isArray(parsed) && parsed.every(obj => typeof obj === 'object' && obj !== null && 'section' in obj && 'lieu' in obj)) {
                return parsed;
            }
        } catch (e) {
            // Not a valid JSON or not the expected format
        }
        return null;
    }


    /**
     * Valide la compatibilité d'un ObjetForum en comparant sa version locale à celle sur le forum.
     * @param {ObjetForum} objet - L'instance de l'objet à vérifier.
     * @returns {Promise<Boolean>} - True si l'objet est compatible ou si la synchronisation a réussi.
     */
    async verifierCompatibiliteObjetForum(objet) {
        await this._acquireLock();
        try {
            // Phase 1 : Construction des "Empreintes" de Versions

            // 1. Construire l'Empreinte Locale
            const nomClasseLocale = objet.constructor.name;
            const versionLogiqueLocale = objet.constructor.VERSION_LOGIQUE;

            const mapClasseParametreVersIdSujet = new Map();
            this.versionsParamsForum.forEach(vpf => {
                // L'ancre pour un paramètre est basée sur le premier élément de son FORMAT_HISTORY.
                if (vpf.formatHistory && vpf.formatHistory.length > 0) {
                    const paramAnchor = JSON.stringify(vpf.formatHistory[0]);
                    mapClasseParametreVersIdSujet.set(paramAnchor, vpf.idSujet);
                }
            });

            let convertirIdsEnClasses;

            if (objet instanceof ObjetForumDroits) {
                const mapIdSujetVersClasse = new Map();
                objet.constructor.PARAMETRES_OBJET.forEach(versionParams =>
                    versionParams.forEach(classeParam => {
                        if (classeParam.FORMAT_HISTORY && classeParam.FORMAT_HISTORY.length > 0) {
                            const localParamAnchor = JSON.stringify(classeParam.FORMAT_HISTORY[0]);
                            const idSujet = mapClasseParametreVersIdSujet.get(localParamAnchor);
                            if (idSujet && !mapIdSujetVersClasse.has(idSujet)) {
                                mapIdSujetVersClasse.set(idSujet, classeParam);
                            }
                        }
                    })
                );

                convertirIdsEnClasses = (historiqueIds) => {
                    return historiqueIds.map(version =>
                        version.map(id => {
                            const classe = mapIdSujetVersClasse.get(id);
                            if (!classe) {
                                const errorMsg = `[GestionnaireVersions] Erreur critique : Impossible de trouver la classe locale correspondant à l'ID de paramètre forum '${id}'. Votre extension est probablement obsolète ou le registre des classes est incomplet.`;
                                console.error(errorMsg);
                                throw new Error(errorMsg);
                            }
                            return classe;
                        })
                    );
                };
            }

            const classesParametresLocales = objet.constructor.PARAMETRES_OBJET.map(versionParams =>
                versionParams.map(classeParam => {
                    // Construire l'ancre locale pour le paramètre actuel en utilisant son FORMAT_HISTORY.
                    if (classeParam.FORMAT_HISTORY && classeParam.FORMAT_HISTORY.length > 0) {
                        const localParamAnchor = JSON.stringify(classeParam.FORMAT_HISTORY[0]);
                        const idSujet = mapClasseParametreVersIdSujet.get(localParamAnchor);
                        if (!idSujet) {
                            console.error(`Impossible de trouver un idSujet pour le paramètre ${classeParam.name} avec l'ancre:`, localParamAnchor);
                            return null;
                        }
                        return idSujet;
                    }
                    console.error(`Le paramètre ${classeParam.name} n'a pas de FORMAT_HISTORY valide.`);
                    return null;
                })
            );
            const formatsLieuxLocaux = objet.constructor.LOCATION_HISTORY;

            // 2. Trouver l'Empreinte Forum
            const ancreFormatsLieux = JSON.stringify(formatsLieuxLocaux[0]);
            const ancreClassesParametres = JSON.stringify(classesParametresLocales[0]);

            const versionForum = this.versionsObjetsForum.find(vf => {
                const lieuxMatch = JSON.stringify(vf.formatsLieux[0]) === ancreFormatsLieux;
                if (!lieuxMatch) return false;

                if (objet instanceof ObjetForumDroits) {
                    const localParamsVersionZero = classesParametresLocales[0] || [];
                    const forumParamsVersionZero = vf.classesParametres[0] || [];
                    // Pour les droits, on considère que c'est le bon sujet si au moins un paramètre correspond
                    return localParamsVersionZero.some(localParamId => forumParamsVersionZero.includes(localParamId));
                } else {
                    return JSON.stringify(vf.classesParametres[0]) === ancreClassesParametres;
                }
            });

            // Phase 2 : Synchronisation et Comparaison
            // Scénario 4 (Nouvel objet)
            if (!versionForum) {
                console.log(`[GestionnaireVersions.verifierCompatibiliteObjetForum] Nouvel objet ${nomClasseLocale} détecté. Création de la version sur le forum.`);
                const idSection = monProfilUtilisateur.parametre['Versions Outiiil'].valeur;
                const titreSujet = `objet: ${nomClasseLocale}`;
                const newId = await AccesForum.creerSujetEtRetournerId(idSection, titreSujet);
                if (newId) {
                    // Le message 0 est créé automatiquement avec le sujet. Les messages suivants commencent à l'index 1.
                    // On envoie les données dans les messages suivants et on récupère leurs IDs.
                    const idMessageVersionLogique = await AccesForum.envoyerMessageEtRetournerId(newId, versionLogiqueLocale); // Message 1
                    await Utils.sleep(10)
                    const idMessageClassesParametres = await AccesForum.envoyerMessageEtRetournerId(newId, JSON.stringify(classesParametresLocales)); // Message 2
                    await Utils.sleep(10)
                    const idMessageFormatsLieux = await AccesForum.envoyerMessageEtRetournerId(newId, JSON.stringify(formatsLieuxLocaux)); // Message 3
                    this.versionsObjetsForum.push({
                        idSujet: newId,
                        type: 'objet',
                        nomClasse: nomClasseLocale,
                        versionLogique: versionLogiqueLocale,
                        classesParametres: classesParametresLocales,
                        formatsLieux: formatsLieuxLocaux,
                        idMessageVersionLogique,
                        idMessageClassesParametres,
                        idMessageFormatsLieux
                    });
                }
                return true;
            }

            // Scénarios 1, 2, 3
            const versionLogiqueForum = versionForum.versionLogique;
            const compVersion = Utils.compareVersions(versionLogiqueLocale, versionLogiqueForum);
            const compFormats = formatsLieuxLocaux.length - versionForum.formatsLieux.length;

            // Logique de comparaison spécifique pour les classes de paramètres
            const derniereVersionParamsLocaleStr = JSON.stringify(classesParametresLocales[classesParametresLocales.length - 1]);
            const classesParametresForum = versionForum.classesParametres;
            const indexDansForum = classesParametresForum.findIndex(v => JSON.stringify(v) === derniereVersionParamsLocaleStr);

            const estExtensionEnRetard = indexDansForum !== -1 && indexDansForum < classesParametresForum.length - 1;
            const estForumEnRetard = indexDansForum === -1;
            const estAJour = indexDansForum !== -1 && indexDansForum === classesParametresForum.length - 1;

            // Scénario 1 (Extension obsolète)
            if ((compVersion < 0 || compFormats < 0 || estExtensionEnRetard) && compVersion <= 0 && compFormats <= 0 && !estForumEnRetard) {
                console.warn(`L'extension est obsolète. L'objet ${objet.constructor.name} nécessite une mise à jour.`);
                if (objet instanceof ObjetForumDroits) {
                    const historiqueTronque = versionForum.classesParametres.slice(0, indexDansForum + 1);
                    objet.constructor.PARAMETRES_OBJET = convertirIdsEnClasses(historiqueTronque);
                    console.log('Historique de classe de paramètres réécrit:', objet.constructor.PARAMETRES_OBJET);
                }
                $.toast({
                    heading: 'Mise à jour requise',
                    text: "Votre extension Outiiil nécessite une mise à jour pour fonctionner correctement. Tentative de mise à jour automatique...",
                    icon: 'warning',
                    loader: true,
                    loaderBg: '#9EC600',
                    position: 'top-right',
                    hideAfter: 5000
                });

                chrome.runtime.sendMessage({ action: "requestUpdateCheck" }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn("Canal de message fermé, probablement en raison d'une mise à jour de l'extension.", chrome.runtime.lastError.message);
                        return true; // C'est un comportement attendu si la mise à jour réussit et recharge l'extension
                    }
                    // Si nous recevons une réponse, cela signifie que la mise à jour n'a pas eu lieu ou a échoué
                    $.toast({
                        heading: 'Échec de la mise à jour',
                        text: "La mise à jour automatique a échoué. Veuillez mettre à jour votre extension manuellement.",
                        icon: 'error',
                        loader: true,
                        loaderBg: '#FF0000',
                        position: 'top-right',
                        hideAfter: false // Garder le message visible
                    });
                });
                return false; // Arrêter l'exécution actuelle car la version est incompatible
            }
            // Scénario 2 (Forum obsolète)
            else if ((compVersion > 0 || compFormats > 0 || estForumEnRetard) && compVersion >= 0 && compFormats >= 0 && !estExtensionEnRetard) {
                let nouvelHistoriqueComplet = classesParametresLocales;
                if (objet instanceof ObjetForumDroits) {
                    const derniereVersionLocale = classesParametresLocales[classesParametresLocales.length - 1];
                    nouvelHistoriqueComplet = [...versionForum.classesParametres, derniereVersionLocale];
                    objet.constructor.PARAMETRES_OBJET = convertirIdsEnClasses(nouvelHistoriqueComplet);
                    console.log('Historique de classe de paramètres réécrit:', objet.constructor.PARAMETRES_OBJET);
                }
                console.log(`[GestionnaireVersions.verifierCompatibiliteObjetForum] Forum obsolète pour ${nomClasseLocale}. Mise à jour de la version sur le forum.`);
                await AccesForum.modifierSujet(versionForum.idSujet, `objet: ${nomClasseLocale}`);
                // Les messages sont modifiés en utilisant leurs IDs.
                await AccesForum.modifierMessage(versionForum.idMessageVersionLogique, versionLogiqueLocale); // Message pour versionLogique
                await AccesForum.modifierMessage(versionForum.idMessageClassesParametres, JSON.stringify(nouvelHistoriqueComplet)); // Message pour classesParametres
                await AccesForum.modifierMessage(versionForum.idMessageFormatsLieux, JSON.stringify(formatsLieuxLocaux)); // Message pour formatsLieux

                // Mettre à jour le cache local
                versionForum.versionLogique = versionLogiqueLocale;
                versionForum.classesParametres = nouvelHistoriqueComplet;
                versionForum.formatsLieux = formatsLieuxLocaux;
                return true;
            }
            // Scénario 3 (Concordance parfaite)
            else if (compVersion === 0 && compFormats === 0 && estAJour) {
                console.log('Concordance parfaite')
                if (objet instanceof ObjetForumDroits) {
                    objet.constructor.PARAMETRES_OBJET = convertirIdsEnClasses(versionForum.classesParametres);
                    console.log('Historique de classe de paramètres réécrit:', objet.constructor.PARAMETRES_OBJET);
                }
                return true;
            }
            // Cas anormal
            else {
                console.error(`[GestionnaireVersions.verifierCompatibiliteObjetForum] Cas anormal: Cas de comparaison de version inattendu pour l'objet ${objet.constructor.name}.`);
                throw new Error(`Cas de comparaison de version inattendu pour l'objet ${objet.constructor.name}.`);
            }
        } finally {
            this._releaseLock();
        }
    }

    /**
     * Valide la compatibilité d'un Parametre en comparant son format à celui sur le forum.
     * @param {ParametreObjetForum} parametre - L'instance du paramètre à vérifier.
     * @returns {Promise<Boolean>} - True si le paramètre est compatible ou si la synchronisation a réussi.
     */
    async verifierCompatibiliteParametre(parametre) {
        await this._acquireLock();
        try {
            // Phase 1 : Identification
            const nomClasseLocale = parametre.constructor.name;
            const versionLogiqueLocale = parametre.constructor.VERSION_LOGIQUE;
            const formatHistoryLocal = parametre.constructor.FORMAT_HISTORY;
            const ancreFormatHistory = JSON.stringify(formatHistoryLocal[0]);

            const versionForum = this.versionsParamsForum.find(vf => {
                const vfFormatHistoryAnchor = JSON.stringify(vf.formatHistory[0]);
                return vfFormatHistoryAnchor === ancreFormatHistory;
            });

            // Phase 2 : Synchronisation

            // Scénario 4 (Nouveau paramètre)
            if (!versionForum) {
                console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Scénario 4: Nouveau paramètre. Création du sujet sur le forum.`);
                const idSection = monProfilUtilisateur.parametre['Versions Outiiil'].valeur;
                const titreSujet = `parametre: ${nomClasseLocale}`;
                const newId = await AccesForum.creerSujetEtRetournerId(idSection, titreSujet);
                if (newId) {
                    const idMessageVersionLogique = await AccesForum.envoyerMessageEtRetournerId(newId, versionLogiqueLocale); // Message 1
                    await Utils.sleep(10)
                    const idMessageFormatHistory = await AccesForum.envoyerMessageEtRetournerId(newId, JSON.stringify(formatHistoryLocal)); // Message 2
                    this.versionsParamsForum.push({
                        idSujet: newId,
                        type: 'parametre',
                        nomClasse: nomClasseLocale,
                        versionLogique: versionLogiqueLocale,
                        formatHistory: formatHistoryLocal,
                        idMessageVersionLogique,
                        idMessageFormatHistory
                    });
                } else {
                    console.error(`[GestionnaireVersions.verifierCompatibiliteParametre] Échec de la création du sujet pour le paramètre ${nomClasseLocale}.`);
                }
                return true;
            }

            const versionLogiqueForum = versionForum.versionLogique;
            const compVersion = Utils.compareVersions(versionLogiqueLocale, versionLogiqueForum);
            const compFormatHistory = formatHistoryLocal.length - versionForum.formatHistory.length;

            // Scénario 1 (Extension obsolète)
            if (compVersion < 0 || compFormatHistory < 0) {
                console.warn(`[GestionnaireVersions.verifierCompatibiliteParametre] Scénario 1: Extension obsolète. Le paramètre ${parametre.constructor.name} nécessite une mise à jour.`);
                $.toast({
                    heading: 'Mise à jour requise',
                    text: "Votre extension Outiiil nécessite une mise à jour pour fonctionner correctement. Tentative de mise à jour automatique...",
                    icon: 'warning',
                    loader: true,
                    loaderBg: '#9EC600',
                    position: 'top-right',
                    hideAfter: 5000
                });

                chrome.runtime.sendMessage({ action: "requestUpdateCheck" }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn("[GestionnaireVersions.verifierCompatibiliteParametre] Canal de message fermé, probablement en raison d'une mise à jour de l'extension.", chrome.runtime.lastError.message);
                        return;
                    }
                    $.toast({
                        heading: 'Échec de la mise à jour',
                        text: "La mise à jour automatique a échoué. Veuillez mettre à jour votre extension manuellement.",
                        icon: 'error',
                        loader: true,
                        loaderBg: '#FF0000',
                        position: 'top-right',
                        hideAfter: false
                    });
                });
                return false;
            }
            // Scénario 2 (Forum obsolète)
            else if (compVersion > 0 || compFormatHistory > 0) {
                console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Scénario 2: Forum obsolète. Mise à jour du sujet et des messages pour le paramètre ${nomClasseLocale}.`);
                await AccesForum.modifierSujet(versionForum.idSujet, `parametre: ${nomClasseLocale}`);
                await AccesForum.modifierMessage(versionForum.idMessageVersionLogique, versionLogiqueLocale);
                await AccesForum.modifierMessage(versionForum.idMessageFormatHistory, JSON.stringify(formatHistoryLocal));
                versionForum.versionLogique = versionLogiqueLocale; // Mise à jour du cache
                versionForum.formatHistory = formatHistoryLocal; // Mise à jour du cache
                return true;
            }
            // Scénario 3 (Concordance)
            else if (compVersion === 0 && compFormatHistory === 0) {
                return true;
            }
            // Cas anormal
            else {
                console.error(`[GestionnaireVersions.verifierCompatibiliteParametre] Cas anormal: Cas de comparaison de version inattendu pour le paramètre ${parametre.constructor.name}.`);
                throw new Error(`Cas de comparaison de version inattendu pour le paramètre ${parametre.constructor.name}.`);
            }
        } finally {
            this._releaseLock();
        }
    }
}
