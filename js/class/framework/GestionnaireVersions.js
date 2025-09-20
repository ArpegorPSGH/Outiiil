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
     * Format : { idSujet, type, nomClasse, nameHistory, formats, idNameHistory, idFormats }
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

    /**
     * Vérifie la présence et l'accessibilité de la section 'Versions Outiiil' sur le forum.
     * @returns {Promise<Boolean>} Vrai si la section 'Versions Outiiil' est présente et accessible, sinon faux.
     */
    async verifierPresenceSectionVersions() {
        await this._acquireLock();
        try {
            console.log(`[GestionnaireVersions.verifierPresenceSectionVersions] Début de la vérification de la section 'Versions Outiiil'.`);
            const nomSection = 'Versions Outiiil';
            const idSection = monProfilUtilisateur.parametre[nomSection]?.valeur;

            if (idSection) {
                try {
                    console.log(`[GestionnaireVersions.verifierPresenceSectionVersions] Vérification de la section '${nomSection}' (ID: ${idSection}).`);
                    const xmlDoc = await pageForum.consulterSection(idSection); // Assuming this already returns a parsed XML Document
                    console.log(`[GestionnaireVersions.verifierPresenceSectionVersions] Réponse XML (Document) du forum pour la section '${nomSection}' (ID: ${idSection}):`, xmlDoc);

                    // Check for parsing errors if the document itself indicates them (e.g., from a previous internal parse)
                    if (xmlDoc.querySelector('parsererror')) {
                        console.error(`[GestionnaireVersions.verifierPresenceSectionVersions] Erreur lors du parsing de la réponse XML (document):`, xmlDoc.querySelector('parsererror').textContent);
                        return false;
                    }

                    // Extract the HTML content which is within the CDATA section of the 'alliance' command
                    const allianceCmdElement = xmlDoc.querySelector('cmd[n="as"][t="alliance"]');
                    if (!allianceCmdElement) {
                        console.error(`[GestionnaireVersions.verifierPresenceSectionVersions] Impossible de trouver l'élément 'cmd' avec t="alliance" dans le document XML.`);
                        return false;
                    }
                    const htmlContent = allianceCmdElement.textContent;

                    // Parse the HTML content
                    const htmlParser = new DOMParser();
                    const htmlDoc = htmlParser.parseFromString(htmlContent, "text/html");

                    // Find the section title within the HTML. It's typically in a <span> inside the second <th> of the table.
                    // The structure is: <table> -> <tbody> (implied) -> <tr class="alt"> -> <th> (first) -> <th> (second) -> <span> (first child)
                    const sectionTitleElement = htmlDoc.querySelector('table.tab_triable tr.alt th:nth-child(2) span:first-child');
                    const extractedTitle = sectionTitleElement ? sectionTitleElement.textContent.trim() : null;

                    console.log(`[GestionnaireVersions.verifierPresenceSectionVersions] Titre extrait du forum pour la section '${nomSection}' (ID: ${idSection}): "${extractedTitle}".`);

                    if (extractedTitle === nomSection) { // Vérification du titre
                        console.log(`[GestionnaireVersions.verifierPresenceSectionVersions] Section '${nomSection}' (ID: ${idSection}) vérifiée avec succès. Titre: "${extractedTitle}".`);
                    } else {
                        console.error(`[GestionnaireVersions.verifierPresenceSectionVersions] Le titre de la section '${nomSection}' ne correspond pas au titre attendu ou les données sont invalides. Titre reçu: "${extractedTitle}".`);
                        return false;
                    }
                } catch (error) {
                    console.error(`[GestionnaireVersions.verifierPresenceSectionVersions] Erreur lors de la vérification de la section '${nomSection}' (ID: ${idSection}).`, error);
                    return false;
                }
                console.log(`[GestionnaireVersions.verifierPresenceSectionVersions] La section 'Versions Outiiil' est présente et accessible.`);
                return true;
            }
            console.log(`[GestionnaireVersions.verifierPresenceSectionVersions] La section '${nomSection}' n'est pas configurée dans monProfilUtilisateur.parametre.`);
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
                const sujets = await pageForum.recupererSujetsSection(idSection);
                console.log(`[GestionnaireVersions.rafraichir] ${sujets.length} sujets de version récupérés.`);

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
                        const { messages: messagesDuSujet } = await pageForum.consulterSujetAvecMessagesEtIds(sujet.id);

                        // Le message 0 est le message initial du sujet, les données commencent à l'index 1.
                        // Nous devons donc ajuster les index pour récupérer les messages de données.
                        // Si le message 0 est le message initial du sujet, alors messagesDuSujet[0] est le message initial.
                        // Les messages de données peuvent être dans n'importe quel ordre.

                        let versionLogique, classesParametres, formatsLieux, nameHistory, formats;
                        let idMessageVersionLogique, idMessageClassesParametres, idMessageFormatsLieux, idMessageNameHistory, idMessageFormats;

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
                            if (!nameHistory) {
                                const parsed = this._parseNameHistory(message.contenu);
                                if (parsed) { nameHistory = parsed; idMessageNameHistory = message.id; }
                            }
                            if (!formats) {
                                const parsed = this._parseFormats(message.contenu);
                                if (parsed) { formats = parsed; idMessageFormats = message.id; }
                            }
                        }

                        if (type === 'objet') {
                            if (!versionLogique || !classesParametres || !formatsLieux) {
                                console.warn(`[GestionnaireVersions.rafraichir] Sujet objet ${sujet.titre} (ID: ${sujet.id}) n'a pas toutes les données requises.`);
                                console.log(`[GestionnaireVersions.rafraichir] Debug - versionLogique:`, versionLogique);
                                console.log(`[GestionnaireVersions.rafraichir] Debug - classesParametres:`, classesParametres);
                                console.log(`[GestionnaireVersions.rafraichir] Debug - formatsLieux:`, formatsLieux);
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
                            if (!nameHistory || !formats) {
                                console.warn(`[GestionnaireVersions.rafraichir] Sujet parametre ${sujet.titre} (ID: ${sujet.id}) n'a pas toutes les données requises.`);
                                console.log(`[GestionnaireVersions.rafraichir] Debug - nameHistory:`, nameHistory);
                                console.log(`[GestionnaireVersions.rafraichir] Debug - formats:`, formats);
                                continue;
                            }
                            this.versionsParamsForum.push({ 
                                idSujet: sujet.id, 
                                type, 
                                nomClasse, 
                                nameHistory, 
                                formats,
                                idMessageNameHistory,
                                idMessageFormats
                            });
                        }
                    } catch (e) {
                        console.error(`[GestionnaireVersions.rafraichir] Erreur lors du parsing du sujet de version ${sujet.titre} (ID: ${sujet.id}):`, e);
                        // Ignorer les sujets qui ne sont pas du format attendu
                    }
                }
                console.log(`[GestionnaireVersions.rafraichir] Fin du parsing des sujets. versionsObjetsForum:`, this.versionsObjetsForum);
                console.log(`[GestionnaireVersions.rafraichir] Fin du parsing des sujets. versionsParamsForum:`, this.versionsParamsForum);
            } catch (error) {
                console.error("[GestionnaireVersions.rafraichir] Erreur lors du rafraîchissement du GestionnaireVersions:", error);
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
        console.log(`[GestionnaireVersions._parseVersionLogique] Attempting to parse content:`, contenu);
        // According to user feedback, the content is directly the version string (e.g., "1.0"), not prefixed.
        // We need to verify it's a valid version format, allowing for leading/trailing whitespace and newlines.
        const trimmedContent = contenu.trim();
        const versionMatch = trimmedContent.match(/^\d+(\.\d+)*$/);
        console.log(`[GestionnaireVersions._parseVersionLogique] Trimmed content:`, trimmedContent);
        console.log(`[GestionnaireVersions._parseVersionLogique] Regex match result:`, versionMatch);
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
     * Parse le contenu d'un message pour extraire l'historique des noms.
     * @private
     * @param {String} contenu - Le contenu du message.
     * @returns {Array<String>|null} L'historique des noms ou null si non trouvé.
     */
    _parseNameHistory(contenu) {
        try {
            const parsed = JSON.parse(contenu);
            if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string' && !item.includes('(nom)') && !item.includes('(valeur)'))) {
                return parsed;
            }
        } catch (e) {
            // Not a valid JSON or not the expected format
        }
        return null;
    }

    /**
     * Parse le contenu d'un message pour extraire les formats.
     * Vérifie spécifiquement la présence de '(nom)' et '(valeur)' dans chaque format.
     * @private
     * @param {String} contenu - Le contenu du message.
     * @returns {Array<String>|null} Les formats ou null si non trouvés.
     */
    _parseFormats(contenu) {
        console.log(`[GestionnaireVersions._parseFormats] Attempting to parse content:`, contenu);
        try {
            const parsed = JSON.parse(contenu);
            console.log(`[GestionnaireVersions._parseFormats] JSON parsed result:`, parsed);
            if (Array.isArray(parsed)) {
                console.log(`[GestionnaireVersions._parseFormats] Is array. Checking every item...`);
                const allItemsValid = parsed.every(item => typeof item === 'string' && item.includes('(nom)') && item.includes('(valeur)'));
                console.log(`[GestionnaireVersions._parseFormats] All items valid:`, allItemsValid);
                if (allItemsValid) {
                    return parsed;
                }
            }
        } catch (e) {
            console.log(`[GestionnaireVersions._parseFormats] Error parsing JSON or invalid format:`, e);
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
                // L'ancre pour un paramètre est basée sur le premier élément de son NAME_HISTORY et de ses FORMATS
                const paramAnchor = JSON.stringify({
                    nameHistoryAnchor: vpf.nameHistory[0],
                    formatsAnchor: vpf.formats[0]
                });
                mapClasseParametreVersIdSujet.set(paramAnchor, vpf.idSujet);
            });

            const classesParametresLocales = objet.constructor.CLASSES_PARAMETRES.map(versionParams => 
                versionParams.map(classeParam => {
                    // Construire l'ancre locale pour le paramètre actuel
                    const localParamAnchor = JSON.stringify({
                        nameHistoryAnchor: classeParam.NAME_HISTORY[0],
                        formatsAnchor: classeParam.FORMATS[0]
                    });
                    return mapClasseParametreVersIdSujet.get(localParamAnchor) || null;
                })
            );
            const formatsLieuxLocaux = objet.constructor.LOCATION_HISTORY;

            // 2. Trouver l'Empreinte Forum
            const ancreFormatsLieux = JSON.stringify(formatsLieuxLocaux[0]);
            const ancreClassesParametres = JSON.stringify(classesParametresLocales[0]);

            const versionForum = this.versionsObjetsForum.find(vf => 
                JSON.stringify(vf.formatsLieux[0]) === ancreFormatsLieux &&
                JSON.stringify(vf.classesParametres[0]) === ancreClassesParametres
            );

            // Phase 2 : Synchronisation et Comparaison
            // Scénario 4 (Nouvel objet)
            if (!versionForum) {
                const idSection = monProfilUtilisateur.parametre['Versions Outiiil'].valeur;
                const titreSujet = `objet: ${nomClasseLocale}`;
                const newId = await pageForum.creerSujetEtRetournerId(titreSujet, ' ', idSection);
                if (newId) {
                    // Le message 0 est créé automatiquement avec le sujet. Les messages suivants commencent à l'index 1.
                    // On envoie les données dans les messages suivants et on récupère leurs IDs.
                    const idMessageVersionLogique = await pageForum.envoyerMessageEtRetournerId(newId, versionLogiqueLocale); // Message 1
                    await Utils.sleep(10)
                    const idMessageClassesParametres = await pageForum.envoyerMessageEtRetournerId(newId, JSON.stringify(classesParametresLocales)); // Message 2
                    await Utils.sleep(10)
                    const idMessageFormatsLieux = await pageForum.envoyerMessageEtRetournerId(newId, JSON.stringify(formatsLieuxLocaux)); // Message 3
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
                console.log(`[GestionnaireVersions.verifierCompatibiliteObjetForum] Scénario 4 (Nouvel objet) - Retour: true`);
                return true;
            }

            // Scénarios 1, 2, 3
            const versionLogiqueForum = versionForum.versionLogique;
            const compVersion = Utils.compareVersions(versionLogiqueLocale, versionLogiqueForum);
            const compFormats = formatsLieuxLocaux.length - versionForum.formatsLieux.length;
            const compParams = classesParametresLocales.length - versionForum.classesParametres.length;

            // Scénario 1 (Extension obsolète)
            if (compVersion < 0 || compFormats < 0 || compParams < 0) {
                console.warn(`L'extension est obsolète. L'objet ${objet.constructor.name} nécessite une mise à jour.`);
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
                        console.log("Canal de message fermé, probablement en raison d'une mise à jour de l'extension.", chrome.runtime.lastError.message);
                        return; // C'est un comportement attendu si la mise à jour réussit et recharge l'extension
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
                console.log(`[GestionnaireVersions.verifierCompatibiliteObjetForum] Scénario 1 (Extension obsolète) - Retour: false`);
                return false; // Arrêter l'exécution actuelle car la version est incompatible
            }
            // Scénario 2 (Forum obsolète)
            else if (compVersion > 0 || compFormats > 0 || compParams > 0) {
                await pageForum.modifierSujet(`objet: ${nomClasseLocale}`, ' ', versionForum.idSujet);
                // Les messages sont modifiés en utilisant leurs IDs.
                await pageForum.modifierMessage(versionForum.idMessageVersionLogique, versionLogiqueLocale); // Message pour versionLogique
                await pageForum.modifierMessage(versionForum.idMessageClassesParametres, JSON.stringify(classesParametresLocales)); // Message pour classesParametres
                await pageForum.modifierMessage(versionForum.idMessageFormatsLieux, JSON.stringify(formatsLieuxLocaux)); // Message pour formatsLieux
                
                // Mettre à jour le cache local
                versionForum.versionLogique = versionLogiqueLocale;
                versionForum.classesParametres = classesParametresLocales;
                versionForum.formatsLieux = formatsLieuxLocaux;
                console.log(`[GestionnaireVersions.verifierCompatibiliteObjetForum] Scénario 2 (Forum obsolète) - Retour: true`);
                return true;
            }
            // Scénario 3 (Concordance parfaite)
            else if (compVersion === 0 && compFormats === 0 && compParams === 0) {
                console.log(`[GestionnaireVersions.verifierCompatibiliteObjetForum] Scénario 3 (Concordance parfaite) - Retour: true`);
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
            console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Début de la vérification pour le paramètre:`, parametre);

            // Phase 1 : Identification
            const nomClasseLocale = parametre.constructor.name;
            const nameHistoryLocal = parametre.constructor.NAME_HISTORY;
            const formatsLocaux = parametre.constructor.FORMATS;

            console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Nom de classe local: ${nomClasseLocale}`);
            console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Name History local:`, nameHistoryLocal);
            console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Formats locaux:`, formatsLocaux);

            const ancreNameHistory = JSON.stringify(nameHistoryLocal[0]);
            const ancreFormats = JSON.stringify(formatsLocaux[0]);

            console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Ancre Name History: ${ancreNameHistory}`);
            console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Ancre Formats: ${ancreFormats}`);
            console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Contenu de versionsParamsForum avant recherche:`, this.versionsParamsForum);

            const versionForum = this.versionsParamsForum.find(vf => {
                const vfNameHistoryAnchor = JSON.stringify(vf.nameHistory[0]);
                const vfFormatsAnchor = JSON.stringify(vf.formats[0]);
                console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Comparaison avec l'entrée du forum - vf.nameHistory[0]: ${vfNameHistoryAnchor}, vf.formats[0]: ${vfFormatsAnchor}`);
                return vfNameHistoryAnchor === ancreNameHistory && vfFormatsAnchor === ancreFormats;
            });
            console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Version trouvée sur le forum:`, versionForum);

            // Phase 2 : Synchronisation

            // Scénario 4 (Nouveau paramètre)
            if (!versionForum) {
                console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Scénario 4: Nouveau paramètre. Création du sujet sur le forum.`);
                const idSection = monProfilUtilisateur.parametre['Versions Outiiil'].valeur;
                const titreSujet = `parametre: ${nomClasseLocale}`;
                console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Création du sujet avec titre: ${titreSujet} dans la section ID: ${idSection}`);
                const newId = await pageForum.creerSujetEtRetournerId(titreSujet, ' ', idSection);
                if (newId) {
                    console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Sujet créé avec succès, ID: ${newId}. Envoi des messages.`);
                    const idMessageNameHistory = await pageForum.envoyerMessageEtRetournerId(newId, JSON.stringify(nameHistoryLocal)); // Message 1
                    await Utils.sleep(10)
                    const idMessageFormats = await pageForum.envoyerMessageEtRetournerId(newId, JSON.stringify(formatsLocaux)); // Message 2
                    this.versionsParamsForum.push({ 
                        idSujet: newId, 
                        type: 'parametre', 
                        nomClasse: nomClasseLocale, 
                        nameHistory: nameHistoryLocal, 
                        formats: formatsLocaux,
                        idMessageNameHistory,
                        idMessageFormats
                    });
                    console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Nouveau paramètre ${nomClasseLocale} ajouté au cache. État actuel de versionsParamsForum:`, this.versionsParamsForum);
                } else {
                    console.error(`[GestionnaireVersions.verifierCompatibiliteParametre] Échec de la création du sujet pour le paramètre ${nomClasseLocale}.`);
                }
                return true;
            }

            const compNameHistory = nameHistoryLocal.length - versionForum.nameHistory.length;
            const compFormats = formatsLocaux.length - versionForum.formats.length;

            console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Comparaison - compNameHistory: ${compNameHistory}, compFormats: ${compFormats}`);

            // Scénario 1 (Extension obsolète)
            if (compNameHistory < 0 || compFormats < 0) {
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
                        console.log("[GestionnaireVersions.verifierCompatibiliteParametre] Canal de message fermé, probablement en raison d'une mise à jour de l'extension.", chrome.runtime.lastError.message);
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
            else if (compNameHistory > 0 || compFormats > 0) {
                console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Scénario 2: Forum obsolète. Mise à jour du sujet et des messages pour le paramètre ${nomClasseLocale}.`);
                await pageForum.modifierSujet(`parametre: ${nomClasseLocale}`, ' ', versionForum.idSujet);
                console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Sujet ID ${versionForum.idSujet} modifié.`);
                // Les messages sont modifiés en utilisant leurs IDs.
                await pageForum.modifierMessage(versionForum.idMessageNameHistory, JSON.stringify(nameHistoryLocal)); // Message pour nameHistory
                console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Message ID ${versionForum.idMessageNameHistory} (nameHistory) modifié.`);
                await pageForum.modifierMessage(versionForum.idMessageFormats, JSON.stringify(formatsLocaux)); // Message pour formats
                console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Message ID ${versionForum.idMessageFormats} (formats) modifié.`);
                versionForum.nameHistory = nameHistoryLocal; // Mise à jour du cache
                versionForum.formats = formatsLocaux; // Mise à jour du cache
                console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Cache local mis à jour pour le paramètre ${nomClasseLocale}.`);
                return true;
            }
            // Scénario 3 (Concordance)
            else if (compNameHistory === 0 && compFormats === 0) {
                console.log(`[GestionnaireVersions.verifierCompatibiliteParametre] Scénario 3: Concordance parfaite pour le paramètre ${nomClasseLocale}.`);
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
