class ParametreObjetForum {
    /**
     * Configuration déclarative. Version de la logique de fonctionnement du paramètre.
     * Ex: '1.0'. Doit être surchargée dans chaque classe fille si le paramètre est versionné.
     * @type {String|null}
     */
    static VERSION_LOGIQUE = null;

    /**
     * Configuration déclarative. Liste des formats historiques du paramètre, du plus ancien au plus récent.
     * Chaque élément est un dictionnaire {'nom': 'Nom du paramètre', 'format': 'template string avec (nom) et (valeur)'}.
     * Ex: { nom: 'Nourriture', format: '--- Ressources ---\n(nom): (valeur) | ' }
     * Doit être surchargée dans chaque classe fille.
     * @type {Array<Object>}
     */
    static FORMAT_HISTORY = [];

    /**
     * Configuration déclarative. Chaîne à afficher si l'accès est restreint.
     * Si null, la donnée n'est pas restreinte.
     * Doit être surchargée dans la classe fille si nécessaire.
     * @type {String|null}
     * @protected
     */
    static STRING_RESTRICTION = null;

    /**
     * Configuration déclarative. Indique si la colonne est visible par défaut dans les tableaux.
     * @type {boolean}
     */
    static VISIBLE_PAR_DEFAUT = true;

    /**
     * Retourne le nom du format le plus récent.
     * @returns {string} Le dernier nom de format.
     */
    static getDernierNom() {
        if (this.FORMAT_HISTORY.length === 0) {
            return '';
        }
        return this.FORMAT_HISTORY[this.FORMAT_HISTORY.length - 1].nom;
    }

    /**
     * Valeur réelle de la donnée.
     * La valeur initiale est définie directement dans la déclaration de la classe fille.
     * @type {any}
     * @protected
     */
    valeur = null;

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
     * Valide et caste une valeur par rapport à la valeur actuelle du paramètre.
     * @param {any} valeurAParser - La valeur extraite à valider.
     * @returns {{success: boolean, value: any}} - Le résultat de l'opération.
     * @private
     */
    _checkValeur(valeurAValider) {
        if (this.valeur === null || this.valeur === undefined) {
            console.error(`[${this.constructor.name}] La valeur actuelle est nulle, impossible de valider le type.`);
            return { success: false };
        }

        const typeContenantActuel = Array.isArray(this.valeur) ? 'array' : (typeof this.valeur === 'object' && this.valeur !== null) ? 'object' : 'primitive';
        const typeContenantAValider = Array.isArray(valeurAValider) ? 'array' : (typeof valeurAValider === 'object' && valeurAValider !== null) ? 'object' : 'primitive';

        if (typeContenantActuel !== typeContenantAValider) {
            console.error(`[${this.constructor.name}] Le type de contenant ne correspond pas: attendu ${typeContenantActuel}, reçu ${typeContenantAValider}.`);
            return { success: false };
        }

        if (typeContenantActuel === 'primitive') {
            const typeCible = typeof this.valeur;
            let valeurCastee;
            switch (typeCible) {
                case 'number':
                    valeurCastee = Number(valeurAValider);
                    if (isNaN(valeurCastee)) {
                        console.error(`[${this.constructor.name}] Échec du casting de "${valeurAValider}" en nombre.`);
                        return { success: false };
                    }
                    break;
                case 'boolean':
                    const strVal = String(valeurAValider).toLowerCase();
                    if (strVal === 'true' || strVal === '1' || valeurAValider === true) valeurCastee = true;
                    else if (strVal === 'false' || strVal === '0' || valeurAValider === false) valeurCastee = false;
                    else {
                        console.error(`[${this.constructor.name}] Échec du casting de "${valeurAValider}" en booléen.`);
                        return { success: false };
                    }
                    break;
                default:
                    valeurCastee = String(valeurAValider);
            }
            return { success: true, value: valeurCastee };
        }

        if (typeContenantActuel === 'array') {
            if (this.valeur.length === 0) {
                console.error(`[${this.constructor.name}] La liste actuelle est vide, impossible de valider le type des éléments.`);
                return { success: false };
            }
            const resultatListe = [];
            for (const element of valeurAValider) {
                const checkResult = this._checkValeur.call({ valeur: this.valeur[0] }, element);
                if (!checkResult.success) {
                    console.error(`[${this.constructor.name}] Échec du casting de l'élément "${element}" de la liste.`);
                    return { success: false };
                }
                resultatListe.push(checkResult.value);
            }
            return { success: true, value: resultatListe };
        }

        if (typeContenantActuel === 'object') {
            for (const cle in this.valeur) {
                if (!valeurAValider.hasOwnProperty(cle)) {
                    console.error(`[${this.constructor.name}] La clé attendue "${cle}" est manquante dans la valeur validée.`);
                    return { success: false };
                }
            }
            const resultatDict = {};
            for (const cle in valeurAValider) {
                if (!this.valeur.hasOwnProperty(cle)) {
                    console.error(`[${this.constructor.name}] La clé "${cle}" n'est pas attendue dans le dictionnaire.`);
                    return { success: false };
                }
                const checkResult = this._checkValeur.call({ valeur: this.valeur[cle] }, valeurAValider[cle]);
                if (!checkResult.success) return { success: false };
                resultatDict[cle] = checkResult.value;
            }
            return { success: true, value: resultatDict };
        }
        return { success: false };
    }

    /**
     * Peuple la valeur du paramètre en parsant une chaîne de caractères fournie.
     * @param {String} contenu - La chaîne à parser.
     * @returns {Boolean} - True si le chargement a réussi, false sinon.
     */
    async chargerDepuisString(contenu) {
        await this._acquireLoadLock();
        try {
            let meilleureValeurExtraite = null;

            for (const formatInfo of this.constructor.FORMAT_HISTORY) {
                console.log(`[${this.constructor.name}] Tentative d'extraction avec le format:`, formatInfo);
                const formatAvecNom = formatInfo.format.replace('(nom)', formatInfo.nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
                const [prefix, suffix] = formatAvecNom.split('(valeur)');
                if (prefix === undefined || suffix === undefined) {
                    console.log(`[${this.constructor.name}] Format invalide (manque '(valeur)'): "${formatInfo.format}"`);
                    continue;
                }

                const regex = new RegExp(`${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(.*?)${suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 's');
                console.log(`[${this.constructor.name}] Regex construite:`, regex);
                console.log(`[${this.constructor.name}] Contenu:`, contenu);
                const match = contenu.match(regex);
                console.log(`[${this.constructor.name}] Résultat du match:`, match);

                if (match && match[1] !== undefined) {
                    const valeurExtraite = match[1];
                    console.log(`[${this.constructor.name}] Valeur extraite: "${valeurExtraite}"`);
                    if (meilleureValeurExtraite === null || valeurExtraite.length < meilleureValeurExtraite.length) {
                        meilleureValeurExtraite = valeurExtraite;
                        console.log(`[${this.constructor.name}] Nouvelle meilleure valeur extraite: "${meilleureValeurExtraite}"`);
                    }
                }
            }

            if (meilleureValeurExtraite === null) {
                console.error(`[${this.constructor.name}] Aucun format n'a pu extraire de valeur.`);
                return false;
            }

            let valeurAParser;
            try {
                valeurAParser = JSON.parse(meilleureValeurExtraite.trim());
            } catch (e) {
                // Si le parsing JSON échoue, cela peut signifier que la valeur est une chaîne simple
                // ou un nombre/booléen non stringifié en JSON.
                // Dans ce cas, on considère que c'est la valeur brute.
                valeurAParser = meilleureValeurExtraite.trim();
                console.warn(`[${this.constructor.name}] Le parsing JSON a échoué pour la valeur extraite: "${meilleureValeurExtraite.trim()}". La valeur sera traitée comme une chaîne brute.`);
            }

            // Étape de migration : convertir l'ancienne valeur parsée vers le format actuel si nécessaire
            const valeurMigree = await this._migrerValeur(valeurAParser);

            if (valeurMigree === null || typeof valeurMigree === 'undefined') {
                console.error(`[${this.constructor.name}] La migration a retourné une valeur nulle ou indéfinie, chargement annulé.`);
                return false;
            }

            const aEteMigre = JSON.stringify(valeurAParser) !== JSON.stringify(valeurMigree);

            if (aEteMigre) {
                console.log(`[${this.constructor.name}] La valeur a été migrée, estModifie sera à true.`);
            }

            const checkResult = this._checkValeur(valeurMigree);
            if (checkResult.success) {
                this.valeur = checkResult.value;
                console.log('valeur enregistrée: ', checkResult.value)
                this.estCharge = true;
                this.estModifie = aEteMigre;
                return true;
            } else {
                // Check failed, but format matched. Do not update value and return false.
                return false;
            }
        } finally {
            this._releaseLoadLock();
        }
    }

    /**
     * Méthode protégée à surcharger dans les classes filles pour migrer une valeur chargée
     * d'un ancien format vers le format actuel du paramètre.
     * @param {any} valeurChargee - La valeur parsée depuis le forum.
     * @returns {Promise<any>} La valeur migrée vers le format actuel.
     * @protected
     */
    async _migrerValeur(valeurChargee) {
        // Par défaut, aucune migration n'est effectuée. La valeur est retournée telle quelle.
        return valeurChargee;
    }

    /**
     * Retourne la chaîne de caractères formatée pour ce paramètre.
     * @returns {String} - La chaîne formatée.
     */
    async genererStringPourEnregistrement() {
        await this._acquireReadLock();
        try {
            const dernierFormatInfo = this.constructor.FORMAT_HISTORY[this.constructor.FORMAT_HISTORY.length - 1];
            let valeurStringifiee;
            if (typeof this.valeur === 'object' && this.valeur !== null) {
                valeurStringifiee = JSON.stringify(this.valeur);
            } else {
                valeurStringifiee = String(this.valeur);
            }
            let str = dernierFormatInfo.format.replace('(nom)', dernierFormatInfo.nom);
            str = str.replace('(valeur)', valeurStringifiee);
            return str;
        } finally {
            this._releaseReadLock();
        }
    }

    /**
     * Met à jour la valeur interne du paramètre.
     * @param {*} nouvelleValeur - La nouvelle valeur.
     * @returns {Boolean} - True si l'écriture a réussi.
     */
    async Ecrire(nouvelleValeur) {
        await this._acquireExclusiveLock();
        try {
            const checkResult = this._checkValeur(nouvelleValeur);
            if (checkResult.success) {
                this.valeur = checkResult.value;
                this.estModifie = true;
                return true;
            }
            console.error(`[${this.constructor.name}] La nouvelle valeur fournie pour Ecrire n'est pas valide.`);
            return false;
        } finally {
            this._releaseExclusiveLock();
        }
    }

    _appliquerRestriction(valeur) {
        const typeContenant = Array.isArray(valeur) ? 'array' : (typeof valeur === 'object' && valeur !== null) ? 'object' : 'primitive';
        if (typeContenant === 'primitive') {
            return this.constructor.STRING_RESTRICTION;
        }
        if (typeContenant === 'array') {
            return valeur.map(v => this._appliquerRestriction(v));
        }
        if (typeContenant === 'object') {
            const res = {};
            for (const key in valeur) {
                res[key] = this._appliquerRestriction(valeur[key]);
            }
            return res;
        }
    }

    /**
     * Fournit un accès direct en lecture à la valeur du paramètre, en respectant les restrictions.
     * @param {Boolean} [peutVoirDonneesRestreintes=true] - Indique si l'utilisateur a les droits.
     * @returns {*} - La valeur ou la chaîne de restriction.
     */
    async Lire(peutVoirDonneesRestreintes = true) {
        await this._acquireReadLock();
        try {
            if (this.constructor.STRING_RESTRICTION !== null && !peutVoirDonneesRestreintes) {
                return this._appliquerRestriction(this.valeur);
            }
            return this.valeur;
        } finally {
            this._releaseReadLock();
        }
    }
}
