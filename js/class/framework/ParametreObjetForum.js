class ParametreObjetForum {
    /**
     * Configuration déclarative. Liste des noms historiques du paramètre, du plus ancien au plus récent.
     * Doit être surchargée dans chaque classe fille.
     * @type {Array<String>}
     */
    static NAME_HISTORY = [];

    /**
     * Configuration déclarative. Liste des formats de template string disponibles pour le paramètre.
     * Ex: '(nom): (valeur) | '
     * Doit être surchargée dans la classe mère.
     * @type {Array<String>}
     */
    static FORMATS = ['(nom): (valeur) | ', '(nom)=(valeur) #'];

    /**
     * La propriété statique FORMAT_HISTORY est générée dynamiquement dans le constructeur.
     * Elle contient une liste de dictionnaires: {'nom': 'Nom unique', 'format': 'template string avec (nom) et (valeur)'}.
     * @type {Array<Object>}
     * @private
     */
    static FORMAT_HISTORY = [];

    /**
     * Configuration déclarative. Chaîne à afficher si l'accès est restreint.
     * Si null, la donnée n'est pas restreinte.
     * Doit être surchargée dans la classe fille si nécessaire.
     * @type {String|null}
     * @protected
     */
    static stringRestriction = null;

    /**
     * Retourne le nom du format le plus récent.
     * @returns {string} Le dernier nom de format.
     */
    static getDernierNom() {
        if (this.NAME_HISTORY.length === 0) {
            return '';
        }
        return this.NAME_HISTORY[this.NAME_HISTORY.length - 1];
    }

    /**
     * Valeur réelle de la donnée.
     * La valeur initiale est définie directement dans la déclaration de la classe fille.
     * @type {any}
     * @protected
     */
    valeur = null;

    /**
     * Type de la valeur réelle de la donnée, extrait de la valeur par défaut.
     * @type {String}
     * @private
     */
    get typeValeur() {
        return typeof this.valeur;
    }

    /**
     * Référence à l'instance de l'ObjetForum qui contient ce paramètre.
     * @type {ObjetForum|null}
     * @protected
     */
    objetParent = null;

    /**
     * Passe à true uniquement lorsque le paramètre a réussi à charger une valeur.
     * @type {Boolean}
     */
    estCharge = false;

    /**
     * Passe à true si le paramètre a été modifié depuis le dernier chargement ou la dernière initialisation.
     * @type {Boolean}
     */
    estModifie = true;

    /** Locking mechanism properties
     * @type {Number}
     * @private
    */
    _readLockCount = 0;

    /**
     * @type {Number}
     * @private
    */
    _loadLockCount = 0;

    /**
     * @type {Boolean}
     * @private
    */
    _exclusiveLockActive = false;

    /**
     * @type {Array<any>}
     * @private
    */
    _waitingReaders = []; // For Lire, genererStringPourEnregistrement

    /**
     * @type {Array<any>}
     * @private
    */
    _waitingLoaders = []; // For chargerDepuisString

    /**
     * @type {Array<any>}
     * @private
    */
    _waitingExclusives = []; // For Ecrire


    /**
     * Crée une instance "vierge" du paramètre et établit la liaison avec son objet parent.
     * @param {ObjetForum} objetParent - L'instance de l'ObjetForum qui contient ce paramètre.
     */
    constructor(objetParent) {
        this.objetParent = objetParent;

        // Génération dynamique de FORMAT_HISTORY si elle n'a pas déjà été générée pour cette classe
        if (this.constructor.FORMAT_HISTORY.length === 0 && this.constructor.NAME_HISTORY.length > 0 && this.constructor.FORMATS.length > 0) {
            const uniqueNames = [...new Set(this.constructor.NAME_HISTORY)];
            const uniqueFormats = [...new Set(this.constructor.FORMATS)];
            const generatedHistory = [];

            uniqueNames.forEach(name => {
                uniqueFormats.forEach(format => {
                    generatedHistory.push({ 'nom': name, 'format': format });
                });
            });
            this.constructor.FORMAT_HISTORY = generatedHistory;
        }
    }

    /**
     * Acquiert un verrou de lecture sur l'instance de l'objet.
     * Permet à plusieurs lecteurs de s'exécuter simultanément, mais bloque si un writer est actif ou en attente.
     * @returns {Promise<void>}
     * @private
     */

    async _acquireReadLock() {
        // Read lock (Lire, genererStringPourEnregistrement) can proceed if no exclusive lock and no active load locks
        // and no waiting exclusive locks or waiting load locks (to prevent starvation)
        if (this._exclusiveLockActive || this._loadLockCount > 0 || this._waitingExclusives.length > 0 || this._waitingLoaders.length > 0) {
            await new Promise(resolve => this._waitingReaders.push(resolve));
        }
        this._readLockCount++;
    }

    /**
     * Libère un verrou de lecture.
     * Si aucun autre lecteur n'est actif et qu'il y a des writers en attente, le prochain writer est notifié.
     * @private
     */

    _releaseReadLock() {
        this._readLockCount--;
        this._releaseWaitingOperations();
    }

    /**
     * Acquiert un verrou de chargement sur l'instance du paramètre.
     * @returns {Promise<void>}
     * @private
     */

    async _acquireLoadLock() {
        // Load lock (chargerDepuisString) can proceed if no exclusive lock and no active read locks
        // and no waiting exclusive locks or waiting read locks (to prevent starvation)
        if (this._exclusiveLockActive || this._readLockCount > 0 || this._waitingExclusives.length > 0 || this._waitingReaders.length > 0) {
            await new Promise(resolve => this._waitingLoaders.push(resolve));
        }
        this._loadLockCount++;
    }

    /**
     * Libère un verrou de chargement.
     * @private
     */

    _releaseLoadLock() {
        this._loadLockCount--;
        this._releaseWaitingOperations();
    }

    /**
     * Acquiert un verrou exclusif sur l'instance du paramètre.
     * @returns {Promise<void>}
     * @private
     */

    async _acquireExclusiveLock() {
        // Exclusive lock (Ecrire) can proceed only if no other locks are active
        if (this._exclusiveLockActive || this._readLockCount > 0 || this._loadLockCount > 0) {
            await new Promise(resolve => this._waitingExclusives.push(resolve));
        }
        this._exclusiveLockActive = true;
    }

    /**
     * Libère un verrou exclusif.
     * @private
     */

    _releaseExclusiveLock() {
        this._exclusiveLockActive = false;
        this._releaseWaitingOperations();
    }

    /**
     * @private
     */

    _releaseWaitingOperations() {
        // Prioritize exclusive locks
        if (this._waitingExclusives.length > 0 && !this._exclusiveLockActive && this._readLockCount === 0 && this._loadLockCount === 0) {
            this._waitingExclusives.shift()();
            return;
        }

        // If no exclusive locks, prioritize loaders if there are no active readers
        if (this._waitingLoaders.length > 0 && !this._exclusiveLockActive && this._readLockCount === 0) {
            while (this._waitingLoaders.length > 0 && !this._exclusiveLockActive && this._readLockCount === 0) {
                this._waitingLoaders.shift()();
            }
            return;
        }

        // If no exclusive or load locks, prioritize readers if there are no active loaders
        if (this._waitingReaders.length > 0 && !this._exclusiveLockActive && this._loadLockCount === 0) {
            while (this._waitingReaders.length > 0 && !this._exclusiveLockActive && this._loadLockCount === 0) {
                this._waitingReaders.shift()();
            }
            return;
        }
    }

    /**
     * Délègue la vérification de compatibilité de version au GestionnaireVersions.
     * @returns {Boolean} - Le verdict de la vérification.
     */
    async verifierVersionSuffisante() {
        return await gestionnaireVersions.verifierCompatibiliteParametre(this);
    }

    /**
     * Peuple la valeur du paramètre en parsant une chaîne de caractères fournie.
     * La valeur est convertie dans le type initialement détecté.
     * @param {String} contenu - La chaîne à parser.
     * @returns {Boolean} - True si le chargement a réussi et la conversion est valide, false sinon.
     */
    async chargerDepuisString(contenu) {
        await this._acquireLoadLock();
        try {
            console.log(`[${this.constructor.name}] Début de chargerDepuisString pour le contenu: "${contenu}". Type attendu: "${this.typeValeur}".`);
            for (let i = this.constructor.FORMAT_HISTORY.length - 1; i >= 0; i--) {
                const formatInfo = this.constructor.FORMAT_HISTORY[i];
                console.log(`[${this.constructor.name}] Tentative de correspondance avec le format: "${formatInfo.format}".`);
                
                // Échapper les caractères spéciaux dans le format pour la regex, sauf '(nom)' et '(valeur)'
                const escapedFormatPart = formatInfo.format.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regexPattern = escapedFormatPart
                                        .replace('\\(nom\\)', formatInfo.nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Inject escaped nom
                                        .replace('\\(valeur\\)', '(.*?)'); // Non-greedy capture for valeur
                const formatRegex = new RegExp(regexPattern);
                const match = contenu.match(formatRegex);

                if (match && match[1] !== undefined) {
                    const rawValue = match[1].trim();
                    let convertedValue;
                    let conversionSuccess = true;

                    switch (this.typeValeur) {
                        case 'number':
                            convertedValue = Number(rawValue);
                            if (isNaN(convertedValue)) {
                                conversionSuccess = false;
                                console.error(`[${this.constructor.name}] Échec de conversion: "${rawValue}" ne peut pas être converti en nombre.`);
                            }
                            break;
                        case 'boolean':
                            // Convertit 'true', 'false', '1', '0' en booléen. Autres valeurs considérées comme échec.
                            if (rawValue.toLowerCase() === 'true' || rawValue === '1') {
                                convertedValue = true;
                            } else if (rawValue.toLowerCase() === 'false' || rawValue === '0') {
                                convertedValue = false;
                            } else {
                                conversionSuccess = false;
                                console.error(`[${this.constructor.name}] Échec de conversion: "${rawValue}" ne peut pas être converti en booléen.`);
                            }
                            break;
                        case 'string':
                        default:
                            convertedValue = rawValue;
                            break;
                    }

                    if (conversionSuccess) {
                        this.valeur = convertedValue;
                        this.estCharge = true;
                        this.estModifie = false; // Set to false on successful load
                        console.log(`[${this.constructor.name}] Correspondance trouvée. Valeur chargée et convertie: "${this.valeur}" (Type: ${typeof this.valeur}).`);
                        console.log(`[${this.constructor.name}] Fin de chargerDepuisString: true.`);
                        return true;
                    } else {
                        // Conversion failed, but format matched. Do not update value and return false.
                        console.log(`[${this.constructor.name}] Format correspondant trouvé, mais échec de conversion de la valeur. Fin de chargerDepuisString: false.`);
                        return false;
                    }
                } else {
                    console.log(`[${this.constructor.name}] Pas de correspondance pour le format: "${formatInfo.format}".`);
                }
            }
            console.log(`[${this.constructor.name}] Aucun format correspondant trouvé. Fin de chargerDepuisString: false.`);
            return false;
        } finally {
            this._releaseLoadLock();
        }
    }

    /**
     * Retourne la chaîne de caractères formatée pour ce paramètre.
     * @returns {String} - La chaîne formatée.
     */
    async genererStringPourEnregistrement() {
        await this._acquireReadLock();
        console.log(`[${this.constructor.name}] Début de genererStringPourEnregistrement pour le paramètre: "${this.constructor.NAME_HISTORY}".`);
        try {
            const formatInfo = this.constructor.FORMAT_HISTORY[this.constructor.FORMAT_HISTORY.length - 1];
            const result = formatInfo.format
                                     .replace('(nom)', formatInfo.nom)
                                     .replace('(valeur)', this.valeur);
            console.log(`[${this.constructor.name}] Génération de la chaîne pour enregistrement: Nom="${formatInfo.nom}", Valeur="${this.valeur}", Résultat="${result}".`);
            return result;
        } finally {
            this._releaseReadLock();
            console.log(`[${this.constructor.name}] Fin de genererStringPourEnregistrement pour le paramètre: "${this.constructor.NAME_HISTORY}".`);
        }
    }

    /**
     * Met à jour la valeur interne du paramètre.
     * @param {*} valeur - La nouvelle valeur.
     */
    async Ecrire(valeur) {
        await this._acquireExclusiveLock();
        console.log(`[${this.constructor.name}] Début de ecrire pour le paramètre: "${this.constructor.NAME_HISTORY}".`);
        try {
            this.valeur = valeur;
            this.estModifie = true; // Set to true on write
        } finally {
            this._releaseExclusiveLock();
            console.log(`[${this.constructor.name}] Fin de ecrire pour le paramètre: "${this.constructor.NAME_HISTORY}".`);
        }
    }

    /**
     * Fournit un accès direct en lecture à la valeur du paramètre, en respectant les restrictions.
     * @param {Boolean} [peutVoirDonneesRestreintes=true] - Indique si l'utilisateur a les droits.
     * @returns {*} - La valeur ou la chaîne de restriction.
     */
    async Lire(peutVoirDonneesRestreintes = true) {
        await this._acquireReadLock();
        console.log(`[${this.constructor.name}] Début de lire pour le paramètre: "${this.constructor.NAME_HISTORY}".`);
        try {
            if (this.constructor.stringRestriction !== null && !peutVoirDonneesRestreintes) {
                return this.constructor.stringRestriction;
            }
            return this.valeur;
        } finally {
            this._releaseReadLock();
            console.log(`[${this.constructor.name}] Fin de lire pour le paramètre: "${this.constructor.NAME_HISTORY}".`);
        }
    }
}
