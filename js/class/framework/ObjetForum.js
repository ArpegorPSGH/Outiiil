class ObjetForum {
    /**
     * Configuration déclarative. Version de la logique de fonctionnement de l'objet.
     * @type {String|null}
     */
    static VERSION_LOGIQUE = null;

    /**
     * Configuration déclarative. Liste de listes des classes de ParametreObjetForum.
     * Chaque liste interne représente les paramètres d'une version.
     * @type {Array<Array<typeof ParametreObjetForum>>}
     */
    static CLASSES_PARAMETRES = [];

    /**
     * Configuration déclarative. Historique des lieux de stockage de l'objet.
     * @type {Array<Object>}
     */
    static LOCATION_HISTORY = [];

    /**
     * Spécifie le type d'objet contenu.
     * @type {typeof ObjetForum|null}
     * @protected
     */
    static classeObjetsForumContenus = null;

    /**
     * Conteneur des instances de ParametreObjetForum.
     * @type {Array<ParametreObjetForum>}
     * @protected
     */
    parametres = [];

    /**
     * Liste des IDs de section où les données de cet objet peuvent être trouvées.
     * @type {Array<Number>}
     * @protected
     */
    idsSection = [];

    /**
     * L'ID du sujet spécifique sur le forum contenant les données de l'instance.
     * @type {Number|null}
     * @protected
     */
    idSujet = null;

    /**
     * L'id du message spécifique dans le sujet contenant les données de l'instance.
     * @type {Number|null}
     * @protected
     */
    idMessage = null;

    /**
     * Liste d'autres instances d'ObjetForum imbriquées.
     * @type {Array<ObjetForum>}
     * @protected
     */
    objetsForumContenus = [];

    /**
     * Cache pour un accès rapide aux paramètres par n'importe quel de leurs noms.
     * @type {Map<String, ParametreObjetForum>}
     * @protected
     */
    mapParametres = new Map();

    /**
     * Indique si l'objet a été modifié depuis son dernier chargement/enregistrement.
     * C'est un getter qui retourne le OU logique des estModifie des paramètres de la dernière version de l'objet.
     * @private
     * @type {Boolean}
     */
    get estModifie() {
        const classesDerniereVersion = this.constructor.CLASSES_PARAMETRES[this.constructor.CLASSES_PARAMETRES.length - 1];
        return this.parametres.some(p => classesDerniereVersion.includes(p.constructor) && p.estModifie);
    }

    /**
     * Remet à false les estModifie des paramètres de la dernière version de l'objet.
     * @private
     * @param {Boolean} value - La valeur à laquelle définir estModifie (sera toujours false pour cette implémentation).
     */
    set estModifie(value) {
        if (value === false) {
            const classesDerniereVersion = this.constructor.CLASSES_PARAMETRES[this.constructor.CLASSES_PARAMETRES.length - 1];
            this.parametres.forEach(p => {
                if (classesDerniereVersion.includes(p.constructor)) {
                    p.estModifie = false;
                }
            });
        }
    }

    /**
     * Compteur de lecteurs actifs.
     * @type {Number}
     * @private
     */
    _readerCount = 0;

    /**
     * Indique si un writer est en attente d'acquérir le verrou.
     * @type {Boolean}
     * @private
     */
    _writerWaiting = false;

    /**
     * Compteur de writers actifs.
     * @type {Number}
     * @private
     */
    _writerCount = 0;

    /**
     * File d'attente pour les lecteurs en attente.
     * @type {Array<Function>}
     * @private
     */
    _readerQueue = [];

    /**
     * File d'attente pour les writers en attente.
     * @type {Array<Function>}
     * @private
     */
    _writerQueue = [];

    /**
     * Référence à l'instance de la fonctionnalité qui a créé cet objet.
     * @type {FonctionnaliteAlliance|null}
     * @protected
     */
    fonctionnaliteCreatrice = null;

    /**
     * Référence à l'instance de l'objet parent qui a créé cet objet.
     * @type {ObjetForum|null}
     * @protected
     */
    objetParent = null;

    /**
     * Initialise l'objet, et optionnellement, peuple ses paramètres avec des valeurs fournies.
     * @param {FonctionnaliteAlliance} [fonctionnaliteCreatrice] - L'instance de la fonctionnalité qui crée cet objet.
     * @param {Object} [options={}] - Un objet d'options pour configurer l'objet.
     * @param {Object} [options.donneesInitiales] - Un objet clé-valeur pour peupler les paramètres.
     * @param {ObjetForum} [options.objetParent] - L'instance de l'objet parent.
     * @param {Number} [options.idSujet] - L'ID du sujet sur le forum.
     * @param {Number} [options.idMessage] - L'id du message dans le sujet.
     */
    constructor(fonctionnaliteCreatrice, options = {}) {
        console.log(`[${this.constructor.name}] Constructeur appelé avec options:`, options);
        this.fonctionnaliteCreatrice = fonctionnaliteCreatrice;
        this.objetParent = options.objetParent || null;
        this.idSujet = options.idSujet || null;
        this.idMessage = options.idMessage || null;

        // 1. & 2. Aplatir et dédoublonner les classes de paramètres
        const classesParametresUniques = [...new Set(this.constructor.CLASSES_PARAMETRES.flat())];
        console.log(`[${this.constructor.name}] Classes de paramètres uniques:`, classesParametresUniques.map(c => c.name));

        // 3. Instancier et lier chaque paramètre
        classesParametresUniques.forEach(ClasseDeParametre => {
            const nouveauParametre = new ClasseDeParametre(this);
            this.parametres.push(nouveauParametre);
            console.log(`[${this.constructor.name}] Paramètre instancié: ${ClasseDeParametre.name}`);

            // Mise en cache des noms pour un accès rapide
            nouveauParametre.constructor.FORMAT_HISTORY.forEach(format => {
                this.mapParametres.set(format.nom, nouveauParametre);
                console.log(`[${this.constructor.name}] Cache mapParametres: Ajout de "${format.nom}" -> ${ClasseDeParametre.name}`);
            });
        });

        // 4. Peupler les paramètres si des données initiales sont fournies
        if (options.donneesInitiales && typeof options.donneesInitiales === 'object') {
            console.log(`[${this.constructor.name}] Données initiales fournies:`, options.donneesInitiales);
            this.ecrireChaqueParametre(options.donneesInitiales);
            console.log(`[${this.constructor.name}] Paramètres peuplés à partir des données initiales.`);
        } else {
            console.log(`[${this.constructor.name}] Aucune donnée initiale fournie ou format invalide.`);
        }
        
        // 5. Initialiser les IDs de section à partir de la configuration statique
        if (this.constructor.LOCATION_HISTORY.length > 0) {
            const ids = new Set();
            this.constructor.LOCATION_HISTORY.forEach(format => {
                const parametreSection = monProfilUtilisateur.parametre[format.section];
                if (parametreSection && parametreSection.valeur !== undefined) {
                    const id = parseInt(parametreSection.valeur, 10);
                    if (!isNaN(id)) {
                        ids.add(id);
                        console.log(`[${this.constructor.name}] ID de section ajouté: ${id} pour section '${format.section}'.`);
                    } else {
                        console.warn(`[${this.constructor.name}] La valeur du paramètre de section '${format.section}' n'est pas un nombre valide:`, parametreSection.valeur);
                        ids.add(null);
                    }
                } else {
                    console.warn(`[${this.constructor.name}] Le paramètre de section '${format.section}' est manquant ou n'a pas de valeur.`);
                    ids.add(null);
                }
            });
            this.idsSection = [...ids];
            console.log(`[${this.constructor.name}] IDs de section finaux:`, this.idsSection);
        } else {
            console.log(`[${this.constructor.name}] Aucun LOCATION_HISTORY défini. IDs de section non initialisés.`);
        }
        console.log(`[${this.constructor.name}] Constructeur terminé.`);
    }

    /**
     * Orchestre la validation de l'objet et de ses dépendances (paramètres, objets contenus).
     * @returns {Boolean} Vrai si toutes les vérifications réussissent, sinon faux.
     */
    async verifierVersionSuffisanteEtPresenceSection() {
        await this._acquireReadLock();
        try {
            // 1. Validation de la Présence de la Section
            console.log(`[${this.constructor.name}] Début de verifierVersionSuffisanteEtPresenceSection`);
            console.log(`[${this.constructor.name}] idsSection:`, this.idsSection);

            if (this.idsSection.length > 0) {
                const dernierId = this.idsSection[this.idsSection.length - 1];
                console.log(`[${this.constructor.name}] Dernier ID de section:`, dernierId);

                if (!dernierId) {
                    console.log(`[${this.constructor.name}] Dernier ID de section est non valide. Retourne false.`);
                    return false;
                }

                if (window.sectionsEnCache && window.sectionsEnCache.has(dernierId)) {
                    console.log(`[${this.constructor.name}] La section (ID: ${dernierId}) est déjà en cache. Résultat: ${window.sectionsEnCache.get(dernierId)}.`);
                    if (!window.sectionsEnCache.get(dernierId)) return false;
                } else {
                    let estValide = false;
                    try {
                        const nomSection = this.constructor.LOCATION_HISTORY[this.constructor.LOCATION_HISTORY.length - 1].section;
                        console.log(`[${this.constructor.name}] Vérification de l'existence de la section via consulterSection(${dernierId}). Nom attendu: '${nomSection}'.`);
                        const xmlDoc = await pageForum.consulterSection(dernierId);
                        console.log(`[${this.constructor.name}] Réponse XML (Document) du forum pour la section '${nomSection}' (ID: ${dernierId}):`, xmlDoc);

                        if (xmlDoc.querySelector('parsererror')) {
                            console.error(`[${this.constructor.name}] Erreur lors du parsing de la réponse XML (document):`, xmlDoc.querySelector('parsererror').textContent);
                        } else {
                            const allianceCmdElement = xmlDoc.querySelector('cmd[n="as"][t="alliance"]');
                            if (!allianceCmdElement) {
                                console.error(`[${this.constructor.name}] Impossible de trouver l'élément 'cmd' avec t="alliance" dans le document XML.`);
                            } else {
                                const htmlContent = allianceCmdElement.textContent;
                                const htmlParser = new DOMParser();
                                const htmlDoc = htmlParser.parseFromString(htmlContent, "text/html");
                                const sectionTitleElement = htmlDoc.querySelector('table.tab_triable tr.alt th:nth-child(2) span:first-child');
                                const extractedTitle = sectionTitleElement ? sectionTitleElement.textContent.trim() : null;
                                console.log(`[${this.constructor.name}] Titre extrait du forum pour la section '${nomSection}' (ID: ${dernierId}): "${extractedTitle}".`);
                                if (extractedTitle === nomSection) {
                                    console.log(`[${this.constructor.name}] Section '${nomSection}' (ID: ${dernierId}) vérifiée avec succès. Titre: "${extractedTitle}".`);
                                    estValide = true;
                                } else {
                                    console.error(`[${this.constructor.name}] Le titre de la section '${nomSection}' ne correspond pas au titre attendu ou les données sont invalides. Titre reçu: "${extractedTitle}".`);
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`[${this.constructor.name}] Erreur lors de la vérification de la section ${dernierId} pour ${this.constructor.name}.`, error);
                    }

                    window.sectionsEnCache.set(dernierId, estValide);
                    console.log(`[${this.constructor.name}] Résultat de la vérification pour la section (ID: ${dernierId}) mis en cache: ${estValide}.`);
                    if (!estValide) return false;
                }
            } else {
                console.log(`[${this.constructor.name}] idsSection est vide. Vérification de section ignorée.`);
                return false;
            }

            // 2. Validation des Paramètres
            for (const parametre of this.parametres) {
            if (!(await parametre.verifierVersionSuffisante())) {
                console.error(`Paramètre incompatible pour ${this.constructor.name}`);
                return false;
            }
        }

        // 3. Validation de l'ObjetForum lui-même
        const estVersionne = this.constructor.VERSION_LOGIQUE && this.constructor.LOCATION_HISTORY.length > 0 && this.constructor.CLASSES_PARAMETRES.length > 0;
        console.log(`[${this.constructor.name}] estVersionne: ${estVersionne}, VERSION_LOGIQUE: ${this.constructor.VERSION_LOGIQUE}, longueur LOCATION_HISTORY : ${this.constructor.LOCATION_HISTORY.length}, longueur CLASSES_PARAMETRES : ${this.constructor.CLASSES_PARAMETRES.length}`);
        if (estVersionne) {
            if (!(await gestionnaireVersions.verifierCompatibiliteObjetForum(this))) {
                console.error(`ObjetForum incompatible: ${this.constructor.name}`);
                return false;
            }
        }

        // 4. Validation Récursive des ObjetForums Contenus
        if (this.constructor.classeObjetsForumContenus) {
            const instanceContenue = new this.constructor.classeObjetsForumContenus();
            if (!(await instanceContenue.verifierVersionSuffisanteEtPresenceSection())) {
                console.error(`ObjetForum contenu incompatible pour ${this.constructor.name}`);
                return false;
            }
        }

        // 5. Résultat Final
        return true;
        } finally {
            this._releaseReadLock();
        }
    }

    /**
     * Met à jour une instance d'objet déjà identifiée en lisant le titre du sujet.
     * @param {Boolean} [chargerContenus=true] - Faut-il aussi charger les objets contenus ?
     * @returns {Promise<Boolean>} Vrai si le rafraîchissement a réussi.
     */
    async rafraichir(chargerContenus = true) {
        await this._acquireReadLock();
        console.log(`[${this.constructor.name}] Début de rafraichir() pour l'objet ID: ${this.idSujet}, chargerContenus: ${chargerContenus}.`);
        try {
            console.log(`[${this.constructor.name}] Verrou de lecture acquis.`);
            if (!this.idSujet || this.idSujet < 0) {
                console.error(`[${this.constructor.name}] Impossible de rafraîchir un objet sans idSujet valide. idSujet: ${this.idSujet}.`);
                return false;
            }

            try {
                console.log(`[${this.constructor.name}] Appel de pageForum.consulterSujetAvecMessagesEtIds(${this.idSujet}).`);
                const { titre: titreLu, messages: messagesLu } = await pageForum.consulterSujetAvecMessagesEtIds(this.idSujet);
                if (titreLu === null) {
                    console.warn(`[${this.constructor.name}] consulterSujetAvecMessagesEtIds(${this.idSujet}) a retourné null pour le titre. Impossible de rafraîchir.`);
                    return false;
                }
                console.log(`[${this.constructor.name}] Titre lu: "${titreLu}".`);
                const titreCharge = await this.chargerDepuisString(titreLu);
                if (!titreCharge) {
                    console.warn(`[${this.constructor.name}] chargerDepuisString() a retourné false pour le titre. Impossible de rafraîchir.`);
                    return false;
                }
                console.log(`[${this.constructor.name}] Titre chargé avec succès: ${titreCharge}.`);

                if (chargerContenus) {
                    console.log(`[${this.constructor.name}] Appel de chargerObjetForumsContenus() avec les messages lus.`);
                    const contenusCharges = await this.chargerObjetForumsContenus(messagesLu);
                    if (!contenusCharges) {
                        console.warn(`[${this.constructor.name}] chargerObjetForumsContenus() a retourné false. Impossible de rafraîchir.`);
                        return false;
                    }
                    console.log(`[${this.constructor.name}] Objets contenus chargés avec succès: ${contenusCharges}.`);
                } else {
                    console.log(`[${this.constructor.name}] Chargement des objets contenus ignoré (chargerContenus: ${chargerContenus}, classeObjetsForumContenus: ${!!this.constructor.classeObjetsForumContenus}).`);
                }
                
                // Appel du complément de rafraîchissement
                if (!await this.completerRafraichissement()) {
                    console.warn(`[${this.constructor.name}] Le complément de rafraîchissement a échoué.`);
                    return false;
                }
                
                return true;
            } catch (error) {
                console.error(`[${this.constructor.name}] Erreur lors du rafraîchissement de l'objet (ID: ${this.idSujet}).`, error);
                return false;
            }
        } finally {
            this._releaseReadLock();
            console.log(`[${this.constructor.name}] Verrou de lecture libéré. Fin de rafraichir().`);
        }
    }

    /**
     * Méthode de complément destinée à être surchargée dans les classes filles pour ajouter une logique
     * spécifique à la fin du processus de rafraîchissement.
     * @returns {Promise<Boolean>} Vrai si le complément a réussi.
     * @protected
     */
    async completerRafraichissement() {
        // Logique à surcharger par les classes enfants.
        return true;
    }

    /**
     * Peuple le tableau `objetsForumContenus` en transformant les messages fournis en instances d'un sous-objet.
     * @param {Array<Object>} messages - La liste des messages du sujet, avec leurs IDs et contenus.
     * @returns {Promise<Boolean>} Vrai si le chargement des objets contenus a réussi.
     * @protected
     */
    async chargerObjetForumsContenus(messages) {
        console.log(`[${this.constructor.name}] Début de chargerObjetForumsContenus() pour l'objet parent ID: ${this.idSujet}.`);
        await this._acquireReadLock();
        try {
            console.log(`[${this.constructor.name}] Verrou de lecture acquis pour chargerObjetForumsContenus().`);
            // 1. Vérification des prérequis
            if (!this.constructor.classeObjetsForumContenus) {
                console.warn(`[${this.constructor.name}] Chargement des objets contenus annulé: classeObjetsForumContenus non défini.`);
                return true;
            }
            if (!(this.constructor.classeObjetsForumContenus.prototype instanceof ObjetForum)) {
                console.error(`[${this.constructor.name}] La classe ${this.constructor.classeObjetsForumContenus.name} n'hérite pas de ObjetForum.`);
                return false;
            }

            try {
                // 2. Synchronisation et chargement
                const nouveauxObjetForumsContenus = [];
                // Crée une map des objets existants par leur idMessage pour une réutilisation basée sur l'ID
                const objetsExistantsMap = new Map(this.objetsForumContenus.map(obj => [obj.idMessage, obj]));
                
                for (const messageData of messages) {
                    const contenuMessage = messageData.contenu;
                    const idMessage = messageData.id;

                    let instance = objetsExistantsMap.get(idMessage); // Tente de réutiliser l'objet existant avec cet idMessage

                    if (!instance) {
                        // Crée une nouvelle instance si aucune n'existait avec cet idMessage
                        instance = new this.constructor.classeObjetsForumContenus(this.fonctionnaliteCreatrice, { objetParent: this, idMessage: idMessage });
                        console.log(`[${this.constructor.name}] Nouvelle instance de ${instance.constructor.name} créée pour l'idMessage ${idMessage}.`);
                    } else {
                        console.log(`[${this.constructor.name}] Réutilisation de l'instance existante de ${instance.constructor.name} pour l'idMessage ${idMessage}.`);
                    }
                    
                    console.log(`[${this.constructor.name}] Appel de chargerDepuisString pour ${instance.constructor.name} avec contenu: "${contenuMessage}".`);
                    const chargeOk = await instance.chargerDepuisString(contenuMessage);
                    
                    if (chargeOk) {
                        nouveauxObjetForumsContenus.push(instance);
                        console.log(`[${this.constructor.name}] ObjetForum ${instance.constructor.name} chargé avec succès pour l'idMessage ${idMessage}.`);
                    } else {
                        console.warn(`[${this.constructor.name}] Échec du chargement de l'objet ${instance.constructor.name} pour l'idMessage ${idMessage}.`);
                        return false; // Si un sous-objet échoue, le chargement global échoue
                    }
                }

                // Remplacement de l'ancienne liste par la nouvelle
                this.objetsForumContenus = nouveauxObjetForumsContenus;
                console.log(`[${this.constructor.name}] ObjetForums contenus mis à jour. Nombre total: ${this.objetsForumContenus.length}.`);
                return true;

            } catch (error) {
                console.error(`[${this.constructor.name}] Erreur lors du chargement des objets contenus pour l'objet parent (ID: ${this.idSujet})`, error);
                return false;
            }
        } finally {
            this._releaseReadLock();
            console.log(`[${this.constructor.name}] Verrou de lecture libéré pour chargerObjetForumsContenus(). Fin de chargerObjetForumsContenus().`);
        }
    }

    /**
     * Orchestrateur central du chargement à partir d'une chaîne. Peuple les paramètres de l'objet,
     * puis lance le chargement de ses objets contenus.
     * @param {String} contenu - La chaîne de caractères à parser.
     * @returns {Promise<Boolean>} Vrai si le chargement a réussi.
     * @protected
     */
    async chargerDepuisString(contenu) {
        console.log(`[${this.constructor.name}] Début de chargerDepuisString() pour l'objet ID: ${this.idSujet}.`);
        console.log(`[${this.constructor.name}] État des verrous au début de chargerDepuisString: _readerCount=${this._readerCount}, _writerCount=${this._writerCount}, _writerWaiting=${this._writerWaiting}.`);
        await this._acquireReadLock();
        try {
            // 1. Chargement des Paramètres Propres
            for (const parametre of this.parametres) {
                await parametre.chargerDepuisString(contenu);
            }

            // Vérifier si des paramètres ont été chargés avec succès
            const versionChargeeIndex = this._determinerVersionChargee();
            const classesChargees = new Set(
                this.parametres
                    .filter(p => p.estCharge)
                    .map(p => p.constructor)
            );

            if (classesChargees.size === 0 || versionChargeeIndex === -1) {
                console.warn(`[${this.constructor.name}] Chargement échoué: aucun paramètre chargé ou paramètres incompatibles.`);
                return false;
            }

            // 2. Succès du Chargement Principal
            // L'état estModifie des paramètres individuels est géré par ParametreObjetForum.chargerDepuisString
            console.log(`[${this.constructor.name}] ObjetForum principal chargé avec succès.`);

            // 3. Migration des Données Anciennes
            await this.completerChargementPourVersionsAnterieures();
            console.log(`[${this.constructor.name}] Migration des données anciennes terminée.`);

            // 4. Retour Final
            console.log(`[${this.constructor.name}] Fin de chargerDepuisString(). Retourne true.`);
            return true;
        } catch (error) {
            console.error(`[${this.constructor.name}] Erreur lors de chargerDepuisString() pour l'objet ID: ${this.idSujet}.`, error);
            return false;
        } finally {
            this._releaseReadLock();
        }
    }

    /**
     * Contient la logique de migration pour calculer les valeurs des paramètres des versions récentes
     * à partir des données d'une version plus ancienne qui a été chargée.
     * Cette méthode est destinée à être surchargée dans les classes filles.
     * @protected
     */
    async completerChargementPourVersionsAnterieures() {
        // La classe de base n'a pas de logique de migration.
    }

    /**
     * Génère les chaînes HTML pour l'en-tête et le corps d'un tableau, en respectant l'ordre des colonnes spécifié.
     * @param {Array<String>} [liste=null] - Liste optionnelle des noms de paramètres à afficher, définissant l'ordre des colonnes.
     * @returns {{en_tete_html: String, corps_html: String}}
     */
    async afficher(liste = null) {
        // 1. Vérification des droits et lecture des données
        const peutVoirDonneesRestreintes = await this.fonctionnaliteCreatrice.verifierDroit('N'); // 'N' pour Normal
        let donnees;

        try {
            donnees = await this.lireChaqueParametre(peutVoirDonneesRestreintes, liste);
        } catch (error) {
            if (error instanceof ErreurRestriction) {
                // On récupère les données partielles (contenant les strings de restriction) et on continue.
                donnees = error.donnees;
            } else {
                // On relance les erreurs inattendues.
                throw error;
            }
        }

        // Appel de la méthode de complément pour permettre des modifications
        donnees = await this.completerAffichage(donnees);

        // 2. Détermination de l'ordre d'affichage
        let ordreAffichage;
        if (liste) {
            ordreAffichage = liste;
        } else {
            // Ordre par défaut : celui des paramètres de la dernière version de l'objet
            const classesDerniereVersion = this.constructor.CLASSES_PARAMETRES[this.constructor.CLASSES_PARAMETRES.length - 1];
            const mapClasseInstance = new Map(this.parametres.map(p => [p.constructor, p]));
            ordreAffichage = classesDerniereVersion.map(classe => {
                const p = mapClasseInstance.get(classe);
                return p.constructor.getDernierNom();
            });

            // Ajoute les clés supplémentaires de 'donnees' qui ne sont pas déjà dans 'ordreAffichage'
            const ordreSet = new Set(ordreAffichage);
            for (const key in donnees) {
                if (!ordreSet.has(key)) {
                    ordreAffichage.push(key);
                }
            }
        }

        // 3. Construction de l'en-tête HTML
        let en_tete_html = '<tr>';
        ordreAffichage.forEach(nomParametre => {
            if (donnees[nomParametre]) {
                const nomAffiche = donnees[nomParametre].nom_affiche;
                en_tete_html += `<th>${nomAffiche}</th>`;
            }
        });
        en_tete_html += '</tr>';

        // 4. Construction du corps HTML
        let corps_html = '<tr>';
        ordreAffichage.forEach(nomParametre => {
            if (donnees[nomParametre]) {
                const valeur = donnees[nomParametre].valeur;
                corps_html += `<td>${valeur}</td>`;
            }
        });
        corps_html += '</tr>';

        // 4. Retour
        return {'en_tete_html': en_tete_html, 'corps_html': corps_html};
    }

    /**
     * Méthode de complément destinée à être surchargée pour modifier ou ajouter des données avant l'affichage.
     * @param {Object} donnees - Les données des paramètres prêtes à être affichées.
     * @returns {Promise<Object>} Les données modifiées.
     * @protected
     */
    async completerAffichage(donnees) {
        // Logique à surcharger par les classes enfants.
        return donnees;
    }

    /**
     * Invoque de manière sécurisée une méthode de calcul d'un attribut dérivé.
     * Gère les droits d'accès et les erreurs de calcul (typiquement dues à des données restreintes).
     * @param {Function} methodeCalcul - La méthode de calcul à invoquer (doit être liée avec .bind(this)).
     * @returns {Promise<*>} La valeur calculée, ou une chaîne indiquant une restriction ou une erreur.
     * @protected
     */
    async _invoquerCalculSecurise(methodeCalcul) {
        const peutVoirDonneesRestreintes = await this.fonctionnaliteCreatrice.verifierDroit('N');
        try {
            const resultat = await methodeCalcul(peutVoirDonneesRestreintes);
            // Sécurité supplémentaire : si le calcul produit NaN, null ou undefined sans planter, on le gère aussi.
            if (Number.isNaN(resultat) || resultat === null || typeof resultat === 'undefined') {
                return '<i>Incalculable</i>';
            }
            return resultat;
        } catch (error) {
            console.warn(`Le calcul d'un attribut a échoué (probablement à cause de données restreintes) : ${error.message}`);
            return '<i>Restreint</i>';
        }
    }

    /**
     * Agrège les valeurs des paramètres en un dictionnaire. Garantit que chaque paramètre est unique.
     * Si une `liste` est fournie, la clé est le nom de la liste ; sinon, c'est le nom d'affichage le plus récent.
     * @param {Boolean} [peutVoirDonneesRestreintes=true] - Si l'utilisateur peut voir les données restreintes.
     * @param {Array<String>} [liste=null] - Liste optionnelle de noms de paramètres à retourner.
     * @returns {Object} Un dictionnaire où chaque valeur est un objet { valeur, nom_affiche }.
     */
    async lireChaqueParametre(peutVoirDonneesRestreintes = true, liste = null) {
        const donnees = {};
        let aRencontreRestriction = false;

        const cles = liste || this.parametres;

        for (const nomParametre of cles) {
            // Trouve le paramètre, que la clé soit un nom historique ou le nom d'affichage le plus récent.
            const parametre = this.mapParametres.get(nomParametre);
            if (!parametre) {
                donnees[nomParametre] = { valeur: null, nom_affiche: null };
                continue;
            } 

            const valeur = await parametre.Lire(peutVoirDonneesRestreintes);
            const nomAffiche = parametre.constructor.getDernierNom();

            if (valeur === null) {
                aRencontreRestriction = true;
                // Le paramètre lui-même fournit la chaîne de restriction.
                donnees[nomParametre] = { valeur: parametre.constructor.STRING_RESTRICTION, nom_affiche: nomAffiche };
            } else {
                donnees[nomParametre] = { valeur: valeur, nom_affiche: nomAffiche };
            }
        }

        if (aRencontreRestriction) {
            throw new ErreurRestriction('Lecture partielle en raison de restrictions.', donnees);
        }
        return donnees;
    }

    /**
     * Met à jour rapidement les valeurs des paramètres à partir d'un objet clé-valeur.
     * @param {Object} donnees - Un objet où les clés sont les noms des paramètres.
     */
    async ecrireChaqueParametre(donnees) {
        for (const nomParametre in donnees) {
            await this.ecrireParametre(nomParametre, donnees[nomParametre])
        }
    }

    /**
     * Point d'entrée unique pour écrire l'état de l'objet sur le forum.
     * Si l'objet principal n'a pas été modifié, seul l'enregistrement des objets contenus sera tenté.
     * @returns {Promise<void>}
     */
    async enregistrerSurForum() {
        await this._acquireWriteLock();
        try {
            console.log(`[${this.constructor.name}] Verrou d'écriture acquis.`);
            // 1. Enregistrement de l'objet principal (conditionnel)
            if (this.estModifie) {
                const classesDerniereVersion = new Set(this.constructor.CLASSES_PARAMETRES[this.constructor.CLASSES_PARAMETRES.length - 1]);
                const parametresAEnregistrer = this.parametres.filter(p => classesDerniereVersion.has(p.constructor));
                
                console.log(`[${this.constructor.name}] Début de enregistrerSurForum.`);
                let contenuFinal = '';
                for (const p of parametresAEnregistrer) {
                    const paramString = await p.genererStringPourEnregistrement();
                    contenuFinal += paramString;
                    console.log(`[${this.constructor.name}] Ajout du paramètre "${p.constructor.getDernierNom()}" au contenu final: "${paramString}". Contenu final actuel: "${contenuFinal}".`);
                }

                const formatLieu = this.constructor.LOCATION_HISTORY[this.constructor.LOCATION_HISTORY.length - 1];
                const idSection = this.idsSection[this.idsSection.length - 1];
                console.log(`[${this.constructor.name}] Format de lieu: "${formatLieu.lieu}", ID de section: "${idSection}".`);

                if (formatLieu.lieu === 'titre') {
                    if (this.idSujet === null) {
                        console.log(`[${this.constructor.name}] Tentative de création d'un nouveau sujet dans la section ${idSection} avec titre: "${contenuFinal}".`);
                        // Trim the final content to ensure no trailing spaces cause mismatch issues
                        this.idSujet = await pageForum.creerSujetEtRetournerId(contenuFinal, ' ', idSection);
                        if (this.idSujet) {
                            console.log(`[${this.constructor.name}] Nouveau sujet créé avec ID: "${this.idSujet}".`);
                        } else {
                            console.error(`[${this.constructor.name}] Échec de la création du sujet.`);
                        }
                    } else {
                        console.log(`[${this.constructor.name}] Tentative de modification du sujet existant (ID: ${this.idSujet}) avec titre: "${contenuFinal}".`);
                        // Trim the final content to ensure no trailing spaces cause mismatch issues
                        await pageForum.modifierSujet(contenuFinal, ' ', this.idSujet);
                        console.log(`[${this.constructor.name}] Sujet modifié avec succès.`);
                    }
                } else if (formatLieu.lieu === 'message') {
                    console.log(`[${this.constructor.name}] Enregistrement en tant que message.`);
                    if (!this.objetParent || !this.objetParent.idSujet) {
                        console.error(`[${this.constructor.name}] Erreur: Un objet contenu ne peut être enregistré sans un objet parent ayant un idSujet.`);
                        throw new Error("Un objet contenu ne peut être enregistré sans un objet parent ayant un idSujet.");
                    }
                    if (this.idMessage === null) {
                        console.log(`[${this.constructor.name}] Tentative d'envoi d'un nouveau message dans le sujet parent (ID: ${this.objetParent.idSujet}) avec contenu: "${contenuFinal}".`);
                        this.idMessage = await pageForum.envoyerMessageEtRetournerId(this.objetParent.idSujet, contenuFinal);
                        if (this.idMessage !== null) {
                            console.log(`[${this.constructor.name}] Nouveau message envoyé avec ID: "${this.idMessage}".`);
                        } else {
                            console.error(`[${this.constructor.name}] Échec de l'envoi du message.`);
                        }
                    } else {
                        console.log(`[${this.constructor.name}] Tentative de modification du message existant (ID: ${this.idMessage}) avec contenu: "${contenuFinal}".`);
                        await pageForum.modifierMessage(this.idMessage, contenuFinal);
                        console.log(`[${this.constructor.name}] Message modifié avec succès.`);
                    }
                }
                this.estModifie = false; // Utilise le setter pour réinitialiser les estModifie des paramètres
                console.log(`[${this.constructor.name}] estModifie mis à false via le setter.`);
            } else {
                console.log(`[${this.constructor.name}] L'objet principal n'a pas été modifié. Skipping son enregistrement.`);
            }

            // 2. Enregistrement des objets contenus (toujours tenté)
            if (this.objetsForumContenus.length > 0) {
                console.log(`[${this.constructor.name}] Début de l'enregistrement des objets contenus (${this.objetsForumContenus.length} objets).`);
                for (const sousObjetForum of this.objetsForumContenus) {
                    console.log(`[${this.constructor.name}] Enregistrement de l'objet contenu: ${sousObjetForum.constructor.name}.`);
                    await sousObjetForum.enregistrerSurForum();
                    // Ajouter un petit délai pour éviter les problèmes de course sur le forum
                    await Utils.sleep(10); 
                }
                console.log(`[${this.constructor.name}] Fin de l'enregistrement des objets contenus.`);
            } else {
                console.log(`[${this.constructor.name}] Aucun objet contenu à enregistrer.`);
            }
            console.log(`[${this.constructor.name}] Fin de enregistrerSurForum.`);
        } finally {
            this._releaseWriteLock();
            console.log(`[${this.constructor.name}] Verrou d'écriture libéré. Fin de enregistrerSurForum.`);
        }
    }

    /**
     * Fournit un accès direct et rapide en lecture à la valeur brute d'un paramètre.
     * @param {String} nomParametre - Le nom du paramètre à lire.
     * @returns {*} La valeur brute du paramètre, ou null si non trouvé.
     */
    async lireParametre(nomParametre, peutVoirDonneesRestreintes = true) {
        const parametre = this.mapParametres.get(nomParametre);
        if (!parametre) {
            console.warn(`[${this.constructor.name}] Tentative de lecture d'un paramètre inexistant: "${nomParametre}".`);
            // Le calcul échouera avec une erreur TypeError si on tente d'utiliser ce résultat.
            return null;
        }

        const valeur = await parametre.Lire(peutVoirDonneesRestreintes);
        if (valeur === null) {
            // La lecture d'un seul paramètre restreint est une opération qui doit échouer.
            throw new ErreurRestriction(`Accès restreint au paramètre "${nomParametre}".`);
        }
        return valeur;
    }

    /**
     * Fournit un accès direct et rapide en écriture à un paramètre.
     * @param {String} nomParametre - Le nom du paramètre à écrire.
     * @param {*} valeur - La nouvelle valeur pour le paramètre.
     */
    async ecrireParametre(nomParametre, valeur) {
        console.log(`[${this.constructor.name}] Début de ecrireParametre pour le paramètre: "${nomParametre}".`);
        const parametre = this.mapParametres.get(nomParametre);
        if (parametre) {
            await parametre.Ecrire(valeur);
            // L'état estModifie de l'objet est géré par le getter/setter
        }
        console.log(`[${this.constructor.name}] Fin de ecrireParametre pour le paramètre: "${nomParametre}".`);
    }

    /**
     * Analyse les paramètres chargés pour déterminer à quelle version de l'objet ils correspondent.
     * @returns {Number} L'index de la version correspondante, ou -1 si aucune correspondance exacte n'est trouvée.
     * @protected
     */
    _determinerVersionChargee() {
        const classesChargees = new Set(
            this.parametres
                .filter(p => p.estCharge)
                .map(p => p.constructor)
        );

        for (let i = 0; i < this.constructor.CLASSES_PARAMETRES.length; i++) {
            const classesDeVersion = new Set(this.constructor.CLASSES_PARAMETRES[i]);

            const estCorrespondanceExacte = (classesChargees.size === classesDeVersion.size) &&
                                           [...classesChargees].every(classe => classesDeVersion.has(classe));

            if (estCorrespondanceExacte) {
                return i; // Retourne l'index de la version
            }
        }

        return -1; // Aucune correspondance exacte
    }

    /**
     * Acquiert un verrou de lecture sur l'instance de l'objet.
     * Permet à plusieurs lecteurs de s'exécuter simultanément, mais bloque si un writer est actif ou en attente.
     * @returns {Promise<void>}
     * @private
     */
    async _acquireReadLock() {
        return new Promise(resolve => {
            const tryAcquire = () => {
                // If a read lock is already held by this context, allow re-entry.
                // In a single-threaded async environment, if _readerCount > 0,
                // it implies the current execution path holds the lock.
                if (this._readerCount > 0) {
                    this._readerCount++;
                    resolve();
                } else if (this._writerCount > 0 || this._writerWaiting) { // Block if any writer is active or waiting
                    this._readerQueue.push(tryAcquire);
                } else {
                    this._readerCount++;
                    resolve();
                }
            };
            tryAcquire();
        });
    }

    /**
     * Libère un verrou de lecture.
     * Si aucun autre lecteur n'est actif et qu'il y a des writers en attente, le prochain writer est notifié.
     * @private
     */
    _releaseReadLock() {
        this._readerCount--;
        if (this._readerCount === 0) {
            // If no other readers are active, check if there are writers waiting
            if (this._writerQueue.length > 0) {
                const nextWriter = this._writerQueue.shift();
                nextWriter();
            }
        }
    }

    /**
     * Acquiert un verrou d'écriture sur l'instance de l'objet.
     * Bloque les lecteurs mais permet à plusieurs writers de s'exécuter simultanément.
     * @returns {Promise<void>}
     * @private
     */
    async _acquireWriteLock() {
        return new Promise(resolve => {
            const tryAcquire = () => {
                if (this._readerCount > 0) { // Block if any reader is active
                    this._writerWaiting = true; // A writer is now waiting
                    this._writerQueue.push(tryAcquire);
                } else {
                    this._writerCount++;
                    // Update _writerWaiting based on queue state after acquiring lock
                    this._writerWaiting = (this._writerQueue.length > 0);
                    resolve();
                }
            };
            tryAcquire();
        });
    }

    /**
     * Libère un verrou d'écriture.
     * Notifie les lecteurs ou le prochain writer en attente si aucun writer n'est actif.
     * @private
     */
    _releaseWriteLock() {
        this._writerCount--;
        if (this._writerCount === 0) { // Only notify if no other writers are active
            // Update _writerWaiting based on the queue state
            this._writerWaiting = (this._writerQueue.length > 0);

            if (this._readerQueue.length > 0) {
                // Libère tous les lecteurs en attente
                while (this._readerQueue.length > 0) {
                    const nextReader = this._readerQueue.shift();
                    nextReader();
                }
            } else if (this._writerQueue.length > 0) {
                // Ou le prochain writer en attente
                const nextWriter = this._writerQueue.shift();
                nextWriter();
            }
        }
    }
}
