class ParametreObjetForum extends DonneeValidable {
    /**
     * Configuration déclarative. Format d'enregistrement personnalisé (ex: 'YYYY-MM-DD').
     * Si null, pour les moments, la méthode toISOString() est utilisée.
     * @type {string|null}
     */
    static FORMAT_ENREGISTREMENT = null;

    /**
     * Configuration déclarative. Version de la logique de fonctionnement du paramètre.
     * Ex: '1.0'. Doit être surchargée dans chaque classe fille si le paramètre est versionné.
     * @type {String|null}
     */
    static VERSION_LOGIQUE = null;

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

    // La méthode _checkValeur est maintenant héritée de DonneeValidable

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
                const formatTrime = formatInfo.format.trim();
                const nomTrime = formatInfo.nom.trim();

                const formatAvecNom = formatTrime.replace('(nom)', nomTrime.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
                let [prefix, suffix] = formatAvecNom.split('(valeur)');
                if (prefix === undefined || suffix === undefined) {
                    console.log(`[${this.constructor.name}] Format invalide (manque '(valeur)'): "${formatInfo.format}"`);
                    continue;
                }

                prefix = prefix.trim();
                suffix = suffix.trim();

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
                const strTrimee = valeurAParser;
                if (strTrimee.startsWith('{') || strTrimee.startsWith('[')) {
                    console.warn(`[${this.constructor.name}] Le parsing JSON a échoué pour la valeur extraite qui semble être un objet/tableau: "${strTrimee}". La valeur sera traitée comme une chaîne brute.`);
                } else {
                    console.log(`[${this.constructor.name}] Valeur lue comme chaîne brute: "${strTrimee}"`);
                }
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
                this.estCharge = true;
                if (JSON.stringify(this.valeur) !== JSON.stringify(checkResult.value)) {
                    console.log(`[${this.constructor.name}] La valeur a été modifiée. Valeur avant : ${this.valeur}. Valeur après : ${checkResult.value}.`);
                    this.estModifie = true;
                }
                this.valeur = checkResult.value;
                console.log('valeur enregistrée: ', checkResult.value)
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

            // Gérer spécifiquement les objets moment
            if (moment.isMoment(this.valeur)) {
                // Sérialiser en format personnalisé ou en ISO 8601 string
                valeurStringifiee = this.constructor.FORMAT_ENREGISTREMENT
                    ? this.valeur.format(this.constructor.FORMAT_ENREGISTREMENT)
                    : this.valeur.toISOString();
            } else if (typeof this.valeur === 'object' && this.valeur !== null) {
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
    async ecrire(nouvelleValeur) {
        await this._acquireExclusiveLock();
        try {
            const checkResult = this._checkValeur(nouvelleValeur);
            if (checkResult.success) {
                if (this.valeur !== checkResult.value) {
                    this.valeur = checkResult.value;
                    this.estModifie = true;
                }
                return true;
            }
            console.error(`[${this.constructor.name}] La nouvelle valeur fournie pour ecrire n'est pas valide.`);
            return false;
        } finally {
            this._releaseExclusiveLock();
        }
    }

    // La méthode _appliquerRestriction est maintenant héritée de DonneeValidable

    /**
     * Fournit un accès direct en lecture à la valeur du paramètre, en respectant les restrictions.
     * Si les données sont restreintes et que l'utilisateur n'a pas les droits, émet une ErreurRestriction.
     * @param {Boolean} [peutVoirDonneesRestreintes=true] - Indique si l'utilisateur a les droits.
     * @returns {*} - La valeur du paramètre.
     * @throws {ErreurRestriction} Si les données sont restreintes et que l'utilisateur n'a pas les droits.
     */
    async lire(peutVoirDonneesRestreintes = true) {
        await this._acquireReadLock();
        try {
            if (this.constructor.STRING_RESTRICTION !== null && !peutVoirDonneesRestreintes) {
                const valeurRestreinte = this._appliquerRestriction(this.valeur);
                const err = new ErreurRestriction(`Accès restreint au paramètre ${this.constructor.getDernierNom()}`);
                err.donnees = valeurRestreinte;
                throw err;
            }
            return this.valeur;
        } finally {
            this._releaseReadLock();
        }
    }
}
