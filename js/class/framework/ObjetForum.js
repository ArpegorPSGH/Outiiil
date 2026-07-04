class ObjetForum {
    /**
     * Configuration déclarative. Version de la logique de fonctionnement de l'objet.
     * @type {String|null}
     */
    static VERSION_LOGIQUE = null;

    /**
     * Configuration déclarative. Séparateur à utiliser entre les chaînes de paramètres lors de l'enregistrement.
     * @type {String}
     */
    static SEPARATEUR_PARAMETRES = ' ';

    /**
     * Configuration déclarative. Liste de listes des classes de ParametreObjetForum.
     * Chaque liste interne représente les paramètres d'une version.
     * @type {Array<Array<typeof ParametreObjetForum>>}
     */
    static PARAMETRES_OBJET = [];

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
     * Configuration déclarative. Liste des classes d'attributs de l'objet.
     * @type {Array<typeof AttributObjet>}
     */
    static ATTRIBUTS_OBJET = [];

    /**
     * Configuration déclarative. Colonnes du tableau à afficher par défaut.
     * @type {Array<String>|null}
     */
    static COLONNES_DEFAUT = null;

    /**
     * Conteneur des instances de ParametreObjetForum.
     * @type {Array<ParametreObjetForum>}
     * @private
     */
    parametres = [];

    /**
     * Conteneur des instances d'AttributObjet.
     * @type {Array<AttributObjet>}
     * @private
     */
    attributs = [];

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
     * L'id de la section dans laquelle se trouve l'objet.
     * @type {Number|null}
     * @protected
     */
    idSection = null;

    /**
     * Liste d'autres instances d'ObjetForum imbriquées.
     * @type {Array<ObjetForum>}
     * @protected
     */
    objetsForumContenus = [];

    /**
     * L'état original (chaîne de paramètres) de l'objet pour la transaction en cours.
     * @type {String|null}
     */
    stringInitial = null;

    /**
     * Cache unifié des instances de DonneeValidable (paramètres et attributs), indexées par leurs noms normalisés.
     * Remplace mapParametres et mapAttributs. Aucun attribut et paramètre ne peut porter le même nom.
     * @type {Map<String, DonneeValidable>}
     * @private
     */
    mapDonnees = new Map();

    /**
     * Indique si les objets contenus de cette instance ont été chargés depuis le forum.
     * @type {Boolean}
     * @protected
     */
    contenusCharges = false;

    /**
     * Indique si l'objet a été modifié depuis son dernier chargement/enregistrement.
     * C'est un getter qui retourne le OU logique des estModifie des paramètres de la dernière version de l'objet.
     * @private
     * @type {Boolean}
     */
    get estModifie() {
        const classesDerniereVersion = this.constructor.PARAMETRES_OBJET[this.constructor.PARAMETRES_OBJET.length - 1];
        return this.parametres.some(p => classesDerniereVersion.includes(p.constructor) && p.estModifie);
    }

    /**
     * Définit l'état modifié des paramètres de la dernière version de l'objet.
     * @private
     * @param {Boolean} value - La valeur à laquelle définir estModifie.
     */
    set estModifie(value) {
        const classesDerniereVersion = this.constructor.PARAMETRES_OBJET[this.constructor.PARAMETRES_OBJET.length - 1];
        this.parametres.forEach(p => {
            if (classesDerniereVersion.includes(p.constructor)) {
                p.estModifie = value;
            }
        });
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
    constructor(fonctionnaliteCreatrice = null, options = {}) {
        this.fonctionnaliteCreatrice = fonctionnaliteCreatrice;
        this.objetParent = options.objetParent || null;
        this.idSection = options.idSection || null;
        this.idSujet = options.idSujet || null;
        this.idMessage = options.idMessage || null;

        // 1. & 2. Aplatir et dédoublonner les classes de paramètres
        const classesParametresUniques = [...new Set(this.constructor.PARAMETRES_OBJET.flat())];

        // 3. Instancier et lier chaque paramètre
        classesParametresUniques.forEach(ClasseDeParametre => {
            if (typeof ClasseDeParametre !== 'function') {
                const errorMsg = `[ObjetForum] Erreur : L'élément '${ClasseDeParametre}' dans PARAMETRES_OBJET de la classe '${this.constructor.name}' n'est pas un constructeur de classe valide. Cela peut être dû à un problème d'ordre de chargement des scripts ou à une corruption des données de version sur le forum.`;
                console.error(errorMsg);
                throw new TypeError(errorMsg);
            }
            const nouveauParametre = new ClasseDeParametre(this);
            this.parametres.push(nouveauParametre);

            // Mise en cache des noms pour un accès rapide
            nouveauParametre.constructor.NOM_APPEL.forEach(nom => {
                if (this.mapDonnees.has(nom)) console.warn(`[${this.constructor.name}] Collision de nom dans mapDonnees: "${nom}" est déjà enregistré.`);
                this.mapDonnees.set(nom, nouveauParametre);
            });
            nouveauParametre.constructor.FORMAT_HISTORY.forEach(format => {
                if (this.mapDonnees.has(format.nom)) console.warn(`[${this.constructor.name}] Collision de nom dans mapDonnees: "${format.nom}" est déjà enregistré.`);
                this.mapDonnees.set(format.nom, nouveauParametre);
            });
        });

        // 4. Initialiser les attributs avec leurs classes depuis la déclaration statique
        const classesAttributs = this.constructor.ATTRIBUTS_OBJET || [];
        for (const ClasseAttribut of classesAttributs) {
            const nouvelAttribut = new ClasseAttribut(this);
            this.attributs.push(nouvelAttribut);

            // Mettre à jour le cache mapDonnees pour tous les noms de l'historique
            const nomsAffichage = ClasseAttribut.NOM_AFFICHAGE || [];
            for (const nom of nomsAffichage) {
                if (this.mapDonnees.has(nom)) console.warn(`[${this.constructor.name}] Collision de nom dans mapDonnees: "${nom}" est déjà enregistré.`);
                this.mapDonnees.set(nom, nouvelAttribut);
            }
            const nomsAppel = ClasseAttribut.NOM_APPEL || [];
            for (const nom of nomsAppel) {
                if (this.mapDonnees.has(nom)) console.warn(`[${this.constructor.name}] Collision de nom dans mapDonnees: "${nom}" est déjà enregistré.`);
                this.mapDonnees.set(nom, nouvelAttribut);
            }
        }

        // 5. Initialiser les attributs et peupler avec les données initiales
        this._initialiserAttributsEtParametres(options.donneesInitiales);

        // 6. Initialiser les IDs de section à partir de la configuration statique
        this._actualiserIdsSection();
    }

    /**
     * Met à jour la liste des IDs de section de l'objet à partir du profil utilisateur.
     * @protected
     */
    _actualiserIdsSection() {
        if (this.constructor.LOCATION_HISTORY.length > 0) {
            const ids = new Set();
            this.constructor.LOCATION_HISTORY.forEach(format => {
                const parametreSection = monProfilUtilisateur.parametre[format.section];
                if (parametreSection && parametreSection.valeur !== undefined) {
                    const id = parseInt(parametreSection.valeur, 10);
                    if (!isNaN(id)) {
                        ids.add(id);
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
        }
    }

    /**
     * Initialise les attributs déclarés statiquement et les peuple avec les données initiales.
     * @param {Object} [donneesInitiales] - Un objet clé-valeur pour peupler les paramètres et attributs.
     * @private
     */
    _initialiserAttributsEtParametres(donneesInitiales) {
        console.log('donneesInitiales:', donneesInitiales)
        // Appliquer les données initiales fournies, qui écrasent les valeurs par défaut
        if (donneesInitiales && typeof donneesInitiales === 'object') {
            for (const cle in donneesInitiales) {
                const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), cle);
                if (descriptor && descriptor.set) {
                    // Si un setter public existe (ex: 'etat'), l'utiliser
                    this[cle] = donneesInitiales[cle];
                } else {
                    // Déléguer à ecrire() qui gère paramètres et attributs uniformément
                    this.ecrire(cle, donneesInitiales[cle]);
                }
            }
        }
    }

    /**
     * Vérifie que la version de l'objet et de ses dépendances (paramètres, objets contenus) est suffisante.
     * Cette vérification est récursive.
     * @returns {Promise<Boolean>} Vrai si toutes les vérifications de version réussissent, sinon faux.
     */
    async verifierVersionSuffisante() {
        await this._acquireReadLock();
        try {
            // 1. Validation des Paramètres
            for (const parametre of this.parametres) {
                if (!(await parametre.verifierVersionSuffisante())) {
                    console.error(`Paramètre incompatible pour ${this.constructor.name}`);
                    return false;
                }
            }

            // 2. Validation de l'ObjetForum lui-même
            const estVersionne = this.constructor.VERSION_LOGIQUE && this.constructor.LOCATION_HISTORY.length > 0 && this.constructor.PARAMETRES_OBJET.length > 0;
            if (estVersionne) {
                if (!(await gestionnaireVersions.verifierCompatibiliteObjetForum(this))) {
                    console.error(`ObjetForum incompatible: ${this.constructor.name}`);
                    return false;
                }
            }

            // 3. Validation Récursive des ObjetForums Contenus
            if (this.constructor.classeObjetsForumContenus) {
                const instanceContenue = new this.constructor.classeObjetsForumContenus();
                if (!(await instanceContenue.verifierVersionSuffisante())) {
                    console.error(`ObjetForum contenu incompatible pour ${this.constructor.name}`);
                    return false;
                }
            }

            // 4. Résultat Final
            return true;
        } finally {
            this._releaseReadLock();
        }
    }

    /**
     * Vérifie la présence de la section sur le forum pour cet objet.
     * Cette vérification n'est pas récursive.
     * @returns {Promise<Boolean>} Vrai si la section est présente, sinon faux.
     */
    async verifierPresenceSection() {
        await this._acquireReadLock();
        try {
            if (this.idsSection.length > 0) {
                const dernierId = this.idsSection[this.idsSection.length - 1];

                if (!dernierId) {
                    return false;
                }

                if (sectionsEnCache && sectionsEnCache.has(dernierId)) {
                    if (!sectionsEnCache.get(dernierId)) return false;
                } else {
                    let estValide = false;
                    try {
                        const nomSection = this.getLastLocation().section;
                        const xmlDoc = await Utils.consulterSection(dernierId);

                        if (xmlDoc.querySelector('parsererror')) {
                            console.error(`[${this.constructor.name}] Erreur lors du parsing de la réponse XML pour la section '${nomSection}'.`);
                        } else {
                            const allianceCmdElement = xmlDoc.querySelector('cmd[n="as"][t="alliance"]');
                            if (!allianceCmdElement) {
                                console.error(`[${this.constructor.name}] Impossible de trouver l'élément 'cmd' avec t="alliance" dans le XML de la section '${nomSection}'.`);
                            } else {
                                const htmlContent = allianceCmdElement.textContent;
                                const htmlParser = new DOMParser();
                                const htmlDoc = htmlParser.parseFromString(htmlContent, "text/html");
                                const sectionTitleElement = htmlDoc.querySelector('table.tab_triable tr.alt th:nth-child(2) span:first-child');
                                const extractedTitle = sectionTitleElement ? sectionTitleElement.textContent.trim() : null;
                                if (extractedTitle.includes(nomSection)) {
                                    estValide = true;
                                } else {
                                    console.warn(`[${this.constructor.name}] Le titre de la section '${nomSection}' (ID: ${dernierId}) ne correspond pas. Titre reçu: "${extractedTitle}".`);
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`[${this.constructor.name}] Erreur lors de la vérification de la section ${dernierId} pour ${this.constructor.name}.`, error);
                        throw error;
                    }

                    sectionsEnCache.set(dernierId, estValide);
                    if (!estValide) return false;
                }
            } else {
                return false;
            }

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
    async rafraichir(chargerContenus = true, mettreAJourCache = true) {
        await this._acquireReadLock();
        console.log('début rafraichir')
        console.log('transaction existe rafraichir:', transaction);
        let rafraichissementReussi = false;
        try {
            const formatLieu = this.getLastLocation();
            if (formatLieu.lieu === 'message') {
                if (!this.objetParent || !this.objetParent.idSujet || this.idMessage === null) {
                    console.error(`[${this.constructor.name}] Impossible de rafraîchir un message sans parent valide ou sans idMessage.`);
                } else {
                    const { messages: messagesLu } = await Utils.consulterSujetAvecMessagesEtIds(this.objetParent.idSujet);
                    const msg = messagesLu.find(m => m.id === this.idMessage);
                    if (!msg) {
                        console.warn(`[${this.constructor.name}] Message ID ${this.idMessage} non trouvé dans le sujet parent.`);
                    } else {
                        rafraichissementReussi = await this.chargerDepuisString(msg.contenu);
                    }
                }
            } else {
                if (!this.idSujet || this.idSujet < 0) {
                    console.error(`[${this.constructor.name}] Impossible de rafraîchir un objet sans idSujet valide. idSujet: ${this.idSujet}.`);
                } else {
                    console.log('rafraichir 1')
                    const { titre: titreLu, messages: messagesLu } = await Utils.consulterSujetAvecMessagesEtIds(this.idSujet);
                    console.log('titreLu:', titreLu);
                    if (titreLu === null) {
                        console.warn(`[${this.constructor.name}] Le sujet ID ${this.idSujet} n'a pas pu être lu ou n'existe pas.`);
                    } else {
                        console.log('rafraichir 2')
                        if (!await this.chargerDepuisString(titreLu)) {
                            console.warn(`[${this.constructor.name}] Échec du chargement des paramètres depuis le titre pour le sujet ID ${this.idSujet}.`);
                        } else {
                            console.log('rafraichir 3')
                            let erreurContenu = false;
                            if (chargerContenus) {
                                if (!await this.chargerObjetForumsContenus(messagesLu)) {
                                    console.warn(`[${this.constructor.name}] Échec du chargement des objets contenus pour le sujet ID ${this.idSujet}.`);
                                    erreurContenu = true;
                                }
                            }
                            if (!erreurContenu) {
                                console.log('rafraichir 4')
                                if (!await this.completerRafraichissement()) {
                                    console.warn(`[${this.constructor.name}] Le complément de rafraîchissement a échoué pour le sujet ID ${this.idSujet}.`);
                                } else {
                                    console.log('rafraichir 5')
                                    rafraichissementReussi = true;
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`[${this.constructor.name}] Erreur lors du rafraîchissement de l'objet (ID: ${this.idSujet}).`, error);
            throw error;
        } finally {
            console.log('resultat chargement :', this)
            this._releaseReadLock();
        }



        if (rafraichissementReussi) {
            console.log('rafraichir 5.1')
            this.stringInitial = await this.genererStringParametres();
            if (this.objetsForumContenus && this.objetsForumContenus.length > 0) {
                for (const sousObjet of this.objetsForumContenus) {
                    sousObjet.stringInitial = await sousObjet.genererStringParametres();
                }
            }
            console.log('rafraichir 5.2')
            await this.enregistrerSurForum(mettreAJourCache);
            console.log('rafraichir 6')
        }

        return rafraichissementReussi;
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
        await this._acquireReadLock();
        try {
            // 1. Vérification des prérequis
            if (!this.constructor.classeObjetsForumContenus) {
                this.contenusCharges = true;
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
                    }

                    const chargeOk = await instance.chargerDepuisString(contenuMessage);

                    if (chargeOk) {
                        nouveauxObjetForumsContenus.push(instance);
                    } else {
                        console.warn(`[${this.constructor.name}] Échec du chargement de l'objet contenu ${instance.constructor.name} depuis le message ID ${idMessage}.`);
                        return false; // Si un sous-objet échoue, le chargement global échoue
                    }
                }

                // Nettoyage des doublons logiques
                const listeSansDoublons = await Utils.eliminerDoublons(nouveauxObjetForumsContenus);

                // Remplacement de l'ancienne liste par la nouvelle
                this.objetsForumContenus = listeSansDoublons; // Cette affectation utilisera le setter si une classe fille en définit un.
                this.contenusCharges = true;
                return true;

            } catch (error) {
                console.error(`[${this.constructor.name}] Erreur lors du chargement des objets contenus pour l'objet parent (ID: ${this.idSujet})`, error);
                throw error;
            }
        } finally {
            this._releaseReadLock();
        }
    }

    /**
     * Vérifie de manière récursive si cet objet est un doublon logique de 'autre'.
     * @param {ObjetForum} autre - L'autre objet à comparer.
     * @returns {Promise<Boolean>} Vrai si c'est un doublon logique.
     */
    async estDoublonDe(autre) {
        if (!autre || this.constructor !== autre.constructor) {
            return false;
        }

        const lieu = this.getLastLocation().lieu;

        console.log("[estDoublonDe] this.genererStringParametres() : ", await this.genererStringParametres());
        console.log("[estDoublonDe] autre.genererStringParametres() : ", await autre.genererStringParametres());

        if (await this.genererStringParametres() !== await autre.genererStringParametres()) {
            return false;
        }

        if (lieu === 'message') {
            return true;
        }

        if (this.objetsForumContenus.length !== autre.objetsForumContenus.length) {
            return false;
        }
        const associes = new Set();
        for (const sousObj of this.objetsForumContenus) {
            let trouve = false;
            for (let i = 0; i < autre.objetsForumContenus.length; i++) {
                if (associes.has(i)) continue;
                const autreSousObj = autre.objetsForumContenus[i];
                if (await sousObj.estDoublonDe(autreSousObj)) {
                    associes.add(i);
                    trouve = true;
                    break;
                }
            }
            if (!trouve) {
                return false;
            }
        }
        return true;
    }

    /**
     * Orchestrateur central du chargement à partir d'une chaîne. Peuple les paramètres de l'objet,
     * puis lance le chargement de ses objets contenus.
     * @param {String} contenu - La chaîne de caractères à parser.
     * @returns {Promise<Boolean>} Vrai si le chargement a réussi.
     * @protected
     */
    async chargerDepuisString(contenu) {
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
                return false;
            }

            // 2. Succès du Chargement Principal
            // L'état estModifie des paramètres individuels est géré par ParametreObjetForum.chargerDepuisString

            // 3. Migration des Données Anciennes
            await this.completerChargementPourVersionsAnterieures();

            // 4. Retour Final
            return true;
        } catch (error) {
            console.error(`[${this.constructor.name}] Erreur lors de chargerDepuisString() pour l'objet ID: ${this.idSujet}.`, error);
            throw error;
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
     * Recherche une classe de paramètre ou d'attribut à partir d'un nom (actuel ou historique).
     * @param {string} nom - Le nom à rechercher.
     * @returns {typeof DonneeValidable|null} La classe correspondante ou null.
     * @private
     */
    static _trouverClasseParNom(nom) {
        if (!nom) return null;

        // Chercher parmi les paramètres
        for (const C of this.PARAMETRES_OBJET[this.PARAMETRES_OBJET.length - 1]) {
            if (C.NOM_AFFICHAGE && C.NOM_AFFICHAGE.includes(nom)) return C;
            if (C.NOM_APPEL && C.NOM_APPEL.includes(nom)) return C;
            if (C.FORMAT_HISTORY && C.FORMAT_HISTORY.some(h => h.nom === nom)) return C;
        }

        // Chercher parmi les attributs
        for (const C of (this.ATTRIBUTS_OBJET || [])) {
            if (C.NOM_AFFICHAGE && C.NOM_AFFICHAGE.includes(nom)) return C;
            if (C.NOM_APPEL && C.NOM_APPEL.includes(nom)) return C;
        }

        return null;
    }

    /**
     * Génère la chaîne HTML pour l'en-tête d'un tableau, en respectant l'ordre des colonnes spécifié.
     * @param {Array<String>} [liste=null] - Liste optionnelle des noms de paramètres/attributs à afficher, définissant l'ordre des colonnes.
     * @returns {String} Le HTML de l'en-tête (<tr> avec les <th>).
     * @static
     */
    static afficherEntete(liste = this.COLONNES_DEFAUT) {
        // Déterminer l'ordre d'affichage
        let ordreAffichage;
        if (liste) {
            ordreAffichage = liste;
        } else {
            // Ordre par défaut : paramètres de la dernière version + attributs
            const classesDerniereVersion = this.PARAMETRES_OBJET[this.PARAMETRES_OBJET.length - 1] || [];
            const classesAttributs = this.ATTRIBUTS_OBJET || [];

            ordreAffichage = [];

            // Ajouter les noms des paramètres
            for (const ClasseParam of classesDerniereVersion) {
                ordreAffichage.push(ClasseParam.getDernierNom());
            }

            // Ajouter les noms des attributs
            for (const ClasseAttribut of classesAttributs) {
                ordreAffichage.push(ClasseAttribut.getNomAffichage());
            }
        }
        console.log('ordreAffichage:', ordreAffichage)
        // Construction de l'en-tête HTML
        let en_tete_html = '';
        ordreAffichage.forEach(nom => {
            const element = this._trouverClasseParNom(nom);
            if (element) {
                en_tete_html += `<th>${element.getNomAffichage()}</th>`;
            } else if (nom) {
                // Si ce n'est ni un paramètre ni un attribut, on l'affiche tel quel
                en_tete_html += `<th>${nom}</th>`;
            } else {
                // Si la chaîne est vide
                en_tete_html += '<th></th>';
            }
        });

        return en_tete_html;
    }

    /**
     * Génère l'élément jQuery pour le corps d'une ligne de tableau, en respectant l'ordre des colonnes spécifié.
     * @param {Array<String>} [liste=null] - Liste optionnelle des noms de paramètres/attributs à afficher, définissant l'ordre des colonnes.
     * @returns {Promise<jQuery>} L'objet jQuery de la ligne (<tr> avec les <td>).
     */
    async afficherCorps(liste = this.constructor.COLONNES_DEFAUT) {
        // 1. Vérification des droits et lecture des données
        let peutVoirDonneesRestreintes = await this.fonctionnaliteCreatrice.verifierDroit('N');

        if (!peutVoirDonneesRestreintes) {
            let pseudoCourant = "";
            pseudoCourant = await monProfilJoueur.lire('Pseudo');

            if (pseudoCourant) {
                for (const donnee of [...this.parametres, ...this.attributs]) {
                    const val = await donnee.lire(true);
                    if (val === pseudoCourant) {
                        peutVoirDonneesRestreintes = true;
                        break;
                    }
                }
            }
        }

        // Lire toutes les données (paramètres dernière version + attributs) via la méthode unifiée
        let donnees = {};
        try {
            donnees = await this.lire(liste, peutVoirDonneesRestreintes);
        } catch (error) {
            if (error instanceof ErreurRestriction) {
                console.log('Données via ErreurRestriction:', error.donnees);
                donnees = error.donnees;
            } else {
                // On relance les erreurs inattendues.
                throw error;
            }
        }
        console.log('donnees:', donnees);

        // 2. Détermination de l'ordre d'affichage
        let ordreAffichage;
        if (liste) {
            ordreAffichage = liste;
        } else {
            // Ordre par défaut : paramètres + attributs
            const classesDerniereVersion = this.constructor.PARAMETRES_OBJET[this.constructor.PARAMETRES_OBJET.length - 1] || [];
            const mapClasseInstance = new Map(this.parametres.map(p => [p.constructor, p]));

            ordreAffichage = classesDerniereVersion.map(classe => {
                const p = mapClasseInstance.get(classe);
                return p.constructor.getDernierNom();
            });

            // Ajouter les attributs
            const classesAttributs = this.constructor.ATTRIBUTS_OBJET || [];
            for (const ClasseAttribut of classesAttributs) {
                ordreAffichage.push(ClasseAttribut.getDernierNom());
            }
        }

        const proprietes = this.constructor.recupererProprietesAffichage(ordreAffichage);

        // 3. Construction du corps jQuery
        const $tr = $('<tr>');
        let totalCells = 0;

        ordreAffichage.forEach(nomParametre => {
            const valeur = donnees[nomParametre];
            const typeLien = proprietes[nomParametre] ? proprietes[nomParametre].typeLien : null;

            const formaterValeur = (val, nom) => {
                if (val === null || val === undefined || val === '') return '';
                if (val instanceof jQuery || val instanceof Element) return val;

                const donnee = this._resoudreDonnee(nom);
                const affichage = donnee ? donnee.formaterValeur(val) : Utils.formatNombre(val);

                if (typeLien === 'joueur') {
                    return `<a href="Membre.php?Pseudo=${encodeURIComponent(val)}" target="_blank">${affichage}</a>`;
                } else if (typeLien === 'alliance') {
                    return `<a href="classementAlliance.php?alliance=${encodeURIComponent(val)}" target="_blank">${affichage}</a>`;
                }
                return affichage;
            };

            const ajouterCellule = (val, nom) => {
                const $td = $('<td>');
                const contenu = formaterValeur(val, nom);
                if (contenu instanceof jQuery || contenu instanceof Element) {
                    $td.append(contenu);
                } else {
                    $td.html(contenu);
                }
                $tr.append($td);
                totalCells++;
            };

            if (valeur !== undefined && valeur !== null) {
                if (Array.isArray(valeur)) {
                    if (valeur.length > 0) {
                        valeur.forEach(item => ajouterCellule(item, nomParametre));
                    } else {
                        ajouterCellule('', nomParametre); // Tableau vide, une seule cellule vide
                    }
                } else {
                    ajouterCellule(valeur, nomParametre);
                }
            } else {
                ajouterCellule('', nomParametre); // Paramètre non trouvé, cellule vide
            }
        });

        console.log(`[ObjetForum] afficherCorps(): ${totalCells} cellules générées.`);
        return $tr;
    }

    /**
     * Récupère les propriétés d'affichage (visibilité, tri, type, lien) pour une liste d'éléments.
     * @param {Array<String>} [liste=null] - Liste optionnelle des noms de paramètres/attributs. Si null, la liste par défaut de l'objet est utilisée.
     * @returns {Object} Un dictionnaire associant le nom de chaque paramètre à ses propriétés ({visible, sortable, type, typeLien}).
     * @static
     */
    static recupererProprietesAffichage(liste = this.COLONNES_DEFAUT) {
        const proprietes = {};

        let ordreAffichage;
        if (liste) {
            ordreAffichage = liste;
        } else {
            const classesDerniereVersion = this.PARAMETRES_OBJET[this.PARAMETRES_OBJET.length - 1] || [];

            ordreAffichage = classesDerniereVersion.map(classe => {
                return classe.getDernierNom();
            });

            const classesAttributs = this.ATTRIBUTS_OBJET || [];
            for (const ClasseAttribut of classesAttributs) {
                ordreAffichage.push(ClasseAttribut.getDernierNom());
            }
        }

        ordreAffichage.forEach(nom => {
            const element = this._trouverClasseParNom(nom);

            if (element) {
                proprietes[nom] = {
                    visible: element.VISIBLE_PAR_DEFAUT,
                    sortable: element.SORTABLE_PAR_DEFAUT,
                    type: element.TYPE_AFFICHAGE,
                    format: element.FORMAT_AFFICHAGE,
                    typeLien: element.TYPE_LIEN
                };
            } else {
                // Valeurs par défaut si le nom ne correspond pas à un paramètre défini
                proprietes[nom] = {
                    visible: true,
                    sortable: nom !== "",
                    type: null,
                    format: FORMAT_DATE_DEFAUT,
                    typeLien: null
                };
            }
        });

        return proprietes;
    }

    static getLastLocation() {
        return this.LOCATION_HISTORY[this.LOCATION_HISTORY.length - 1];
    }

    getLastLocation() {
        return this.constructor.getLastLocation();
    }

    // =========================================================================
    // MÉTHODES UNIFIÉES DE LECTURE / ÉCRITURE
    // =========================================================================

    /**
     * Résout un nom de donnée (paramètre ou attribut) en son instance DonneeValidable.
     * @param {string} nom - Le nom à rechercher dans mapDonnees.
     * @returns {DonneeValidable|null} L'instance trouvée ou null.
     * @private
     */
    _resoudreDonnee(nom) {
        const donnee = this.mapDonnees.get(nom);
        if (!donnee) {
            console.warn(`[${this.constructor.name}] Donnée "${nom}" introuvable dans mapDonnees.`);
        }
        return donnee || null;
    }

    /**
     * Point d'accès unique en lecture pour les paramètres et les attributs.
     *
     * - `lire('Pseudo')` → retourne la valeur seule
     * - `lire(['Pseudo', 'Grade'])` → retourne `{ Pseudo: ..., Grade: ... }`
     * - `lire(null)` ou `lire('tout')` → retourne l'ensemble : paramètres (dernière version) + tous les attributs
     * - `lire('parametres')` → retourne uniquement les paramètres de la dernière version
     * - `lire('attributs')` → retourne uniquement tous les attributs
     * - `lire('attributs_calculés')` → retourne uniquement les attributs calculés
     * - `lire('attributs_non_calculés')` → retourne uniquement les attributs non calculés
     *
     * En mode liste, les ErreurRestriction sont agrégées dans l'objet résultat puis relancées
     * sous forme d'une unique ErreurRestriction portant l'objet partiel en `.donnees`.
     *
     * @param {string|string[]|null} noms - Nom unique, liste de noms, mot-clé ('tout', 'parametres', 'attributs', 'attributs_calculés', 'attributs_non_calculés'), ou null pour tout lire.
     * @param {boolean} [peutVoirDonneesRestreintes=true]
     * @returns {Promise<*|Object>} Valeur unique (string) ou objet {nom: valeur} (liste/null/mots-clés).
     */
    async lire(noms = 'tout', peutVoirDonneesRestreintes = true) {
        const normalizeKey = (str) => {
            if (typeof str !== 'string') return '';
            return str.toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]/g, "");
        };

        // --- Mode unitaire ---
        const motsClesNormalises = ['tout', 'tous', 'parametres', 'attributs', 'attributscalcules', 'attributsnoncalcules'];
        const nomNormalise = typeof noms === 'string' ? normalizeKey(noms) : '';
        if (typeof noms === 'string' && !motsClesNormalises.includes(nomNormalise)) {
            const donnee = this._resoudreDonnee(noms);
            if (!donnee) return null;
            return await donnee.lire(peutVoirDonneesRestreintes);
        }

        // --- Mode liste ou mots-clés ou null ---
        const resultats = {};
        const erreursRestriction = [];

        let entrees = []; // [{nom, donnee}]
        let selectors = [];
        if (Array.isArray(noms)) {
            selectors = noms;
        } else {
            selectors = [noms];
        }

        selectors.forEach(sel => {
            const selNorm = normalizeKey(sel);
            if (motsClesNormalises.includes(selNorm)) {
                // Ajouter les paramètres
                if (selNorm === 'tout' || selNorm === 'tous' || selNorm === 'parametres') {
                    const classesDerniereVersion = this.constructor.PARAMETRES_OBJET[this.constructor.PARAMETRES_OBJET.length - 1] || [];
                    const mapClasseInstance = new Map(this.parametres.map(p => [p.constructor, p]));
                    classesDerniereVersion.forEach(classe => {
                        const p = mapClasseInstance.get(classe);
                        if (p) {
                            entrees.push({ nom: p.constructor.getDernierNom(), donnee: p });
                        }
                    });
                }

                // Ajouter les attributs
                if (selNorm === 'tout' || selNorm === 'tous' || selNorm === 'attributs' || selNorm === 'attributscalcules' || selNorm === 'attributsnoncalcules') {
                    for (const attribut of this.attributs) {
                        const estCalcule = attribut._estCalcule();
                        if (selNorm === 'tout' || selNorm === 'tous' || selNorm === 'attributs' ||
                            (selNorm === 'attributscalcules' && estCalcule) ||
                            (selNorm === 'attributsnoncalcules' && !estCalcule)) {
                            entrees.push({ nom: attribut.constructor.getDernierNom(), donnee: attribut });
                        }
                    }
                }
            } else {
                // Nom de donnée spécifique
                const donnee = this._resoudreDonnee(sel);
                if (donnee) {
                    entrees.push({ nom: sel, donnee });
                }
            }
        });

        for (const { nom, donnee } of entrees) {
            try {
                resultats[nom] = await donnee.lire(peutVoirDonneesRestreintes);
            } catch (error) {
                if (error instanceof ErreurRestriction) {
                    erreursRestriction.push(error);
                    // Utiliser les données de l'erreur au lieu de remplacer par '<i>Restreint</i>'
                    resultats[nom] = error.donnees;
                } else {
                    throw error;
                }
            }
        }

        if (erreursRestriction.length > 0) {
            const err = new ErreurRestriction('Certaines données sont restreintes.');
            err.donnees = resultats;
            throw err;
        }

        return resultats;
    }

    /**
     * Point d'accès unique en écriture pour les paramètres et les attributs.
     *
     * - `ecrire('Pseudo', 'Tartempion')` → retourne true/false
     * - `ecrire({ Pseudo: 'Tartempion', Grade: 'R1' })` → retourne `{ Pseudo: true, Grade: true }`
     *
     * @param {string|Object} noms - Nom unique ou objet {nom: valeur}.
     * @param {*} [valeur] - Valeur si noms est un string.
     * @returns {Promise<boolean|Object>} Résultat ou dictionnaire de résultats.
     */
    async ecrire(noms, valeur) {
        // --- Mode unitaire ---
        if (typeof noms === 'string') {
            const donnee = this._resoudreDonnee(noms);
            if (!donnee) return false;
            return await donnee.ecrire(valeur);
        }

        // --- Mode objet ---
        const resultats = {};
        for (const nom in noms) {
            const donnee = this._resoudreDonnee(nom);
            if (donnee) {
                resultats[nom] = await donnee.ecrire(noms[nom]);
            } else {
                resultats[nom] = false;
            }
        }
        return resultats;
    }

    /**
     * Supprime cet objet du forum et nettoie ses identifiants.
     * @returns {Promise<void>}
     */
    async supprimerSurForum() {
        await this._acquireWriteLock();
        try {
            const formatLieu = this.getLastLocation();
            if (formatLieu.lieu === 'titre') {
                if (this.idSujet !== null) {
                    await Utils.supprimerSujet(this.idSujet, this.idSection);
                    transaction.enregistrerSuppression(this);
                    this.idSujet = null;
                    this.estModifie = true;
                }
                if (this.objetsForumContenus && this.objetsForumContenus.length > 0) {
                    this.objetsForumContenus.forEach(m => {
                        m.idMessage = null;
                        m.estModifie = true;
                    });
                }
            } else if (formatLieu.lieu === 'message') {
                if (this.idMessage !== null) {
                    console.warn(`Suppression message: ${this.idMessage}`);
                    await Utils.supprimerMessage(this.idMessage);
                    transaction.enregistrerSuppression(this);
                    this.idMessage = null;
                    this.estModifie = true;
                }
            }
            await FonctionnaliteAlliance.mettreAJourCache(this, true);
        } finally {
            this._releaseWriteLock();
        }
    }

    /**
     * Supprime cet objet du forum et se retire de son parent.
     * @returns {Promise<void>}
     */
    async supprimer() {
        await this.supprimerSurForum();
        if (this.objetParent) {
            const index = this.objetParent.objetsForumContenus.indexOf(this);
            if (index !== -1) {
                this.objetParent.objetsForumContenus.splice(index, 1);
            }
        }
    }

    /**
     * Transfère cet objet vers une autre section.
     * @param {number} idSection - L'ID de la section de destination.
     */
    async transferer(idSectionCible) {
        await this._acquireWriteLock();
        try {
            if (this.idSujet === null || this.idSection === null) {
                console.error(`Erreur lors du transfert: L'objet n'a pas de sujet forum ou de section.`);
                return;
            }
            await Utils.transfererSujet(this.idSujet, idSectionCible, this.idSection);
            transaction.enregistrerTransfert(this);
            this.idSection = idSectionCible;
            console.log(`[${this.constructor.name}] Transfert: ${this.idSujet} -> ${idSectionCible}. Nouvelle section: ${this.idSection}`);
        } finally {
            this._releaseWriteLock();
        }
    }

    /**
     * Point d'entrée unique pour écrire l'état de l'objet sur le forum.
     * Si l'objet principal n'a pas été modifié, seul l'enregistrement des objets contenus sera tenté.
     * @returns {Promise<void>}
     */
    async enregistrerSurForum(mettreAJourCache = true) {
        await this._acquireWriteLock();
        try {
            console.log(`[${this.constructor.name}] estModifie:`, this.estModifie);
            console.log('transaction existe enregistrerSurForum:', transaction);
            // 1. Enregistrement de l'objet principal (conditionnel)
            if (this.estModifie) {
                const contenuFinal = await this.genererStringParametres();
                console.log(`[${this.constructor.name}] contenuFinal: ${contenuFinal}`);

                const formatLieu = this.getLastLocation();
                const idSection = this.idSection ? this.idSection : this.idsSection[this.idsSection.length - 1];

                if (formatLieu.lieu === 'titre') {
                    if (contenuFinal.length > 240) {
                        throw new Error(`La chaîne d'enregistrement dépasse la limite autorisée pour un titre de sujet (${contenuFinal.length} > 240 caractères).`);
                    }
                    if (this.idSujet === null) {
                        const newId = await Utils.creerSujetEtRetournerId(idSection, contenuFinal);
                        if (!newId) {
                            console.error(`[${this.constructor.name}] Échec de la création du sujet.`);
                        } else {
                            this.idSujet = newId;
                            this.idSection = idSection;
                            transaction.enregistrerCreation(this);
                        }
                    } else {
                        await Utils.modifierSujet(this.idSujet, contenuFinal);
                        transaction.enregistrerModification(this);
                    }
                } else if (formatLieu.lieu === 'message') {
                    if (!this.objetParent || !this.objetParent.idSujet) {
                        console.error(`[${this.constructor.name}] Erreur: Un objet contenu ne peut être enregistré sans un objet parent ayant un idSujet.`);
                        throw new Error("Un objet contenu ne peut être enregistré sans un objet parent ayant un idSujet.");
                    }
                    if (contenuFinal.length > 61495) {
                        throw new Error(`La chaîne d'enregistrement dépasse la limite autorisée pour un message (${contenuFinal.length} > 61495 caractères).`);
                    }
                    if (this.idMessage === null) {
                        const newId = await Utils.envoyerMessageEtRetournerId(this.objetParent.idSujet, contenuFinal);
                        if (newId === null) {
                            console.error(`[${this.constructor.name}] Échec de l'envoi du message.`);
                        } else {
                            this.idMessage = newId;
                            transaction.enregistrerCreation(this);
                        }
                    } else {
                        await Utils.modifierMessage(this.idMessage, contenuFinal);
                        transaction.enregistrerModification(this);
                    }
                }
                this.estModifie = false; // Utilise le setter pour réinitialiser les estModifie des paramètres
                if (mettreAJourCache) {
                    await FonctionnaliteAlliance.mettreAJourCache(this);
                }
            }

            // 2. Enregistrement des objets contenus (toujours tenté)
            if (this.objetsForumContenus.length > 0) {
                for (const sousObjetForum of this.objetsForumContenus) {
                    await sousObjetForum.enregistrerSurForum();
                    // Ajouter un petit délai pour éviter les problèmes de course sur le forum
                    await Utils.sleep(10);
                }
            }

            this.stringInitial = await this.genererStringParametres();
            if (this.objetsForumContenus && this.objetsForumContenus.length > 0) {
                for (const sousObjet of this.objetsForumContenus) {
                    sousObjet.stringInitial = await sousObjet.genererStringParametres();
                }
            }

        } finally {
            this._releaseWriteLock();
        }
    }

    /**
     * Génère la chaîne de caractères représentant les paramètres de l'objet pour l'enregistrement.
     * @returns {Promise<String>} La chaîne de paramètres.
     */
    async genererStringParametres() {
        const classesDerniereVersion = new Set(this.constructor.PARAMETRES_OBJET[this.constructor.PARAMETRES_OBJET.length - 1]);
        const parametresAEnregistrer = this.parametres.filter(p => classesDerniereVersion.has(p.constructor));

        let contenuFinal = [];
        for (const p of parametresAEnregistrer) {
            const paramString = await p.genererStringPourEnregistrement();
            contenuFinal.push(paramString);
        }
        return contenuFinal.join(this.constructor.SEPARATEUR_PARAMETRES);
    }

    /**
     * Génère un objet JSON représentant l'état complet de l'objet (paramètres de la dernière
     * version + attributs sérialisables) pour un stockage en localStorage.
     * Les attributs dont la valeur n'est pas sérialisable en JSON sont ignorés silencieusement.
     * @returns {Promise<Object>} L'objet JSON prêt à être sérialisé.
     */
    async genererObjetPourLocalStorage() {
        const obj = {};

        // Paramètres de la dernière version
        const classesDerniereVersion = new Set(
            this.constructor.PARAMETRES_OBJET[this.constructor.PARAMETRES_OBJET.length - 1] || []
        );
        for (const parametre of this.parametres) {
            if (classesDerniereVersion.has(parametre.constructor)) {
                const nom = parametre.constructor.getDernierNom();
                obj[nom] = await parametre.lire();
            }
        }

        // Attributs
        for (const attribut of this.attributs) {
            const nom = attribut.constructor.getDernierNom();
            try {
                const valeur = await attribut.lire();
                // Vérifier que la valeur est sérialisable (lève une exception sinon)
                JSON.stringify(valeur);
                obj[nom] = valeur;
            } catch (e) {
                // Attribut non sérialisable (objet complexe, référence circulaire...) : ignoré
            }
        }

        return obj;
    }

    /**
     * Enregistre l'objet comme entrée **unique** dans le localStorage (remplace l'éventuelle
     * valeur existante sous cette clé), en sérialisant paramètres et attributs.
     * À utiliser pour un objet singleton (ex. profil du joueur courant),
     * contrairement à `enregistrerLocalStorage` qui gère une liste.
     * @param {String} [cleStockage=this.constructor.name] - La clé de stockage dans le localStorage.
     */
    async enregistrerLocalStorage(cleStockage = this.constructor.name) {
        await this._acquireReadLock();
        console.log(`[${this.constructor.name}.enregistrerLocalStorage] Enregistrement de ${this.constructor.name} dans le localStorage...`);
        try {
            const obj = await this.genererObjetPourLocalStorage();
            localStorage.setItem(cleStockage, JSON.stringify(obj));
        } finally {
            this._releaseReadLock();
        }
    }

    /**
     * Charge l'état de l'objet depuis une entrée unique dans le localStorage.
     * Peuple les paramètres et les attributs dont le dernier nom affiché correspond
     * à une clé présente dans l'objet stocké. Les clés absentes sont ignorées.
     * @param {String} [cleStockage=this.constructor.name] - La clé de stockage dans le localStorage.
     * @returns {Promise<boolean>} True si des données ont été trouvées et chargées.
     */
    async chargerDepuisLocalStorage(cleStockage = this.constructor.name) {
        const data = JSON.parse(localStorage.getItem(cleStockage));
        if (!data || typeof data !== 'object') return false;

        // Charger toutes les données via la méthode unifiée ecrire()
        for (const [nom, valeur] of Object.entries(data)) {
            await this.ecrire(nom, valeur);
        }

        return true;
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

        for (let i = 0; i < this.constructor.PARAMETRES_OBJET.length; i++) {
            const classesDeVersion = new Set(this.constructor.PARAMETRES_OBJET[i]);

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

    /**
     * Génère une empreinte sérialisée de l'état actuel de l'objet, incluant ses paramètres,
     * attributs et objets contenus (récursivement).
     * @returns {Promise<String>} - L'empreinte de l'objet.
     */
    async _prendreEmpreinte() {
        const etat = {
            idSujet: this.idSujet,
            idMessage: this.idMessage,
            parametres: {},
            attributs: {},
            contenus: []
        };

        // Capturer les paramètres
        for (const p of this.parametres) {
            etat.parametres[p.constructor.name] = await p.lire(true);
        }

        // Capturer les attributs non calculés et marqués pour l'empreinte
        for (const a of this.attributs) {
            if (!a._estCalcule() && a.EST_INCLUS_DANS_EMPREINTE) {
                etat.attributs[a.constructor.name] = await a.lire(true);
            }
        }

        // Capturer récursivement les objets contenus
        if (this.objetsForumContenus && this.objetsForumContenus.length > 0) {
            const empreintesContenus = await Promise.all(this.objetsForumContenus.map(sousObjet => sousObjet._prendreEmpreinte()));
            etat.contenus = empreintesContenus.sort();
        }

        return JSON.stringify(etat);
    }
}
