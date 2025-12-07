class FonctionnaliteAlliance {
    /**
     * Configuration déclarative. Liste des abréviations de la fonctionnalité.
     * @type {Array<String>}
     */
    static ABREVIATIONS_HISTORY = [];

    /**
     * Niveau de droit requis pour initialiser la fonctionnalité.
     * @type {String}
     */
    static NIVEAU_DROIT_REQUIS = 'R';

    /**
     * Liste des instances des classes ObjetForum utilisées par la fonctionnalité.
     * @private
     * @type {Array<ObjetForum>}
     */
    objetsDependants = [];

    /**
     * Référence à l'instance de la page qui a créé cette fonctionnalité.
     * @protected
     * @type {Page|null}
     */
    page = null;

    /**
     * Effectue l'initialisation synchrone de la fonctionnalité.
     * @param {Page} page - L'instance de la page parente.
     */
    constructor(page) {
        this.page = page;
    }

    /**
     * Gère la séquence d'initialisation asynchrone de la fonctionnalité.
     * @returns {Promise<Boolean>}
     */
    async init() {
        console.log(`[${this.constructor.name}] Début de l'initialisation.`);
        try {
            if (!await this.verifierVersionSuffisanteEtPresenceSections()) {
                console.warn(`[${this.constructor.name}] Conditions de version ou de section non remplies.`);
                return false;
            }
            if (!await this.verifierPresenceSujetMembre()) {
                console.warn(`[${this.constructor.name}] Le joueur n'est pas membre.`);
                return false;
            }
            if (!await this.verifierDroits()) {
                console.warn(`[${this.constructor.name}] Droits d'initialisation insuffisants.`);
                return false;
            }

            // La méthode run() doit être implémentée par la classe fille.
            if (typeof this.run === 'function') {
                await this.run();
            }
            
            console.log(`[${this.constructor.name}] Initialisation terminée avec succès.`);
            return true;
        } catch (error) {
            console.error(`Erreur lors de l'initialisation de la fonctionnalité ${this.constructor.name}:`, error);
            return false;
        }
    }

    /**
     * Découvre et instancie les classes ObjetForum dont cette fonctionnalité dépend en analysant le code.
     * Utilise un cache global pour éviter de répéter l'analyse.
     * @private
     */
    _decouvrirObjetForumsDependants() {
        const nomClasse = this.constructor.name;
        if (dependancesObjetForumsCache.has(nomClasse)) {
            this.objetsDependants = dependancesObjetForumsCache.get(nomClasse);
            return;
        }

        // Concatène le code source de la classe actuelle et de sa classe parente.
        const codeSource = this.constructor.toString() + '\n' + Object.getPrototypeOf(this.constructor).toString();
        const allIdentifiers = new Set();

        try {
            // Utilise acorn pour parser le code et générer un AST.
            // Mise à jour de ecmaVersion à 2022 pour supporter les champs de classe statiques.
            const ast = acorn.parse(codeSource, { ecmaVersion: 2022, sourceType: 'script' });
            
            // Fonction récursive simple pour parcourir l'AST et collecter tous les identifiants.
            function collectIdentifiers(node) {
                if (!node) return;
                if (node.type === 'Identifier') {
                    allIdentifiers.add(node.name);
                }
                for (const key in node) {
                    if (Object.prototype.hasOwnProperty.call(node, key)) {
                        const child = node[key];
                        if (typeof child === 'object' && child !== null) {
                            if (Array.isArray(child)) {
                                child.forEach(collectIdentifiers);
                            } else {
                                collectIdentifiers(child);
                            }
                        }
                    }
                }
            }
            collectIdentifiers(ast);

        } catch (e) {
            console.error(`Erreur lors du parsing AST pour ${nomClasse}:`, e);
            return;
        }

        const dependancesTrouvees = new Set();
        const registreObjetForums = registreClasses.ObjetForum;

        // Parcourt les identifiants trouvés pour les résoudre en classes ObjetForum.
        for (const nom of allIdentifiers) {
            // Scénario 1: L'identifiant est directement le nom d'une classe ObjetForum.
            if (registreObjetForums.has(nom)) {
                dependancesTrouvees.add(nom);
            }
            // Scénario 2: L'identifiant est une variable globale qui pointe vers une instance d'ObjetForum.
            // On utilise la carte des types pour trouver le nom de la classe.
            if (carteDesTypes.has(`window.${nom}`)) {
                const nomClasseMappee = carteDesTypes.get(`window.${nom}`);
                if (registreObjetForums.has(nomClasseMappee)) {
                    dependancesTrouvees.add(nomClasseMappee);
                }
            }
        }

        // Instancie chaque classe de dépendance unique.
        const instancesDependances = [];
        for (const nomClasseDependance of dependancesTrouvees) {
            const ClasseDependance = registreObjetForums.get(nomClasseDependance);
            if (ClasseDependance) {
                const nomInstance = nomClasseDependance.charAt(0).toLowerCase() + nomClasseDependance.slice(1);
                if (window[nomInstance] && window[nomInstance] instanceof ClasseDependance) {
                    console.log(`[${this.constructor.name}] Utilisation de l'instance globale existante pour ${nomClasseDependance}.`);
                    instancesDependances.push(window[nomInstance]);
                } else {
                    instancesDependances.push(new ClasseDependance(this));
                }
            }
        }

        // Met en cache le résultat pour les futurs appels et peuple la liste de l'instance.
        dependancesObjetForumsCache.set(nomClasse, instancesDependances);
        this.objetsDependants = instancesDependances;
    }

    /**
     * Vérifie que tous les objets dépendants ont une version compatible et que leurs sections existent.
     * @private
     * @returns {Boolean} - True si tout est valide, sinon false.
     */
    async verifierVersionSuffisanteEtPresenceSections() {
        this._decouvrirObjetForumsDependants();

        for (const objet of this.objetsDependants) {
            const verificationResult = await objet.verifierVersionSuffisanteEtPresenceSection();
            if (!verificationResult) {
                console.error(`Échec de la vérification de version/section pour l'objet ${objet.constructor.name}`);
                return false;
            }
        }
        return true;
    }

    /**
     * Vérifie si le joueur actuel est bien membre de l'alliance en se basant sur la liste des joueurs.
     * @private
     * @returns {Promise<Boolean>} - True si le joueur est membre, sinon false.
     */
    async verifierPresenceSujetMembre() {
        const joueurs = await this.chargerObjetForumsMultiples(Joueur);
        const pseudoJoueurActuel = await monProfilJoueur.lireParametre('pseudo'); // En supposant que `pseudo` contient le pseudo du joueur connecté.

        if (!pseudoJoueurActuel) {
            console.error(`[${this.constructor.name}] Le pseudo du joueur actuel n'a pas pu être déterminé.`);
            return false;
        }

        const estMembre = await Promise.all(joueurs.map(async joueur => {
            const joueurPseudo = await joueur.lireParametre('pseudo');
            // 'pseudo' est le nom du paramètre dans la classe Joueur.
            return joueurPseudo === pseudoJoueurActuel;
        })).then(results => results.some(result => result));

        if (!estMembre) {
            console.log(`[${this.constructor.name}] Le joueur "${pseudoJoueurActuel}" n'est pas trouvé dans la liste des membres de l'alliance.`);
        }

        return estMembre;
    }

    /**
     * Demande au gestionnaire de droits de rafraîchir sa liste de droits.
     * @protected
     * @returns {Promise<void>}
     */
    async rafraichirDroits() {
        // On passe 'this' pour que le gestionnaire puisse utiliser les méthodes de la fonctionnalité,
        // comme chargerObjetForumsMultiples, pour charger les données nécessaires.
        await gestionnaireDroits.rafraichir(this);
    }

    /**
     * Vérifie si le joueur actuel a le niveau de droit requis pour cette fonctionnalité.
     * @protected
     * @param {String} niveauRequis - Le niveau de droit à vérifier (ex: 'R', 'N', 'A').
     * @returns {Boolean} - True si le joueur a le droit suffisant, sinon false.
     */
    async verifierDroit(niveauRequis) {
        const abrevHistory = this.constructor.ABREVIATIONS_HISTORY;
        if (!abrevHistory || abrevHistory.length === 0) {
            console.error(`Aucune abréviation n'est définie pour la fonctionnalité ${this.constructor.name}.`);
            return false;
        }
        const abrev = abrevHistory[abrevHistory.length - 1];
        return await gestionnaireDroits.verifierDroit(abrev, niveauRequis);
    }

    /**
     * Vérifie que le joueur a les droits suffisants pour l'initialisation de la fonctionnalité,
     * en se basant sur l'attribut `NIVEAU_DROIT_REQUIS`.
     * @private
     * @returns {Promise<Boolean>} - True si le joueur a le droit requis, sinon false.
     */
    async verifierDroits() {
        await this.rafraichirDroits();
        const aDroitOutiiil = await this.verifierDroit(this.constructor.NIVEAU_DROIT_REQUIS);
        const estAdminFZ = this.page.estAdminFourmizzz();
        return aDroitOutiiil || estAdminFZ;
    }

    /**
     * Charge en masse toutes les instances d'un type d'objet depuis le forum, en utilisant un cache de page.
     * @template T
     * @param {new() => T} ClasseObjetForum - La classe de l'objet à charger.
     * @param {Boolean} chargerContenus - Si true, charge aussi les objets contenus.
     * @returns {Promise<Array<T>>} - Une promesse qui résout avec un tableau d'instances de l'objet.
     */
    async chargerObjetForumsMultiples(ClasseObjetForum, chargerContenus = true) {
        const nomClasse = ClasseObjetForum.name;
        if (cacheObjetForums.has(nomClasse)) {
            return cacheObjetForums.get(nomClasse);
        }

        const instanceTemporaire = new ClasseObjetForum();
        if (!instanceTemporaire.idsSection || instanceTemporaire.idsSection.length === 0) {
            console.warn(`La classe ${nomClasse} n'a pas d'idsSection configurés.`);
            return [];
        }

        let tousLesSujets = [];
        for (const idSection of instanceTemporaire.idsSection) {
            try {
                const sujetsSection = await pageForum.recupererSujetsSection(idSection);
                sujetsSection.forEach(sujet => {
                    sujet.idSectionSource = idSection;
                    tousLesSujets.push(sujet);
                });
            } catch (error) {
                console.error(`Impossible de charger les sujets pour la section ${idSection}.`, error);
            }
        }
        console.log('tousLesSujets: ', tousLesSujets)
        const objetsCharges = [];
        for (const sujet of tousLesSujets) {
            const instance = new ClasseObjetForum(this, { idSujet: parseInt(sujet.id, 10) });
            const chargementReussi = await instance.rafraichir(chargerContenus);
            console.log('chargementReussi: ', chargementReussi)
            if (chargementReussi) {
                // Transfert du sujet si nécessaire :
                const idDerniereSection = instance.idsSection[instance.idsSection.length - 1];
                if (sujet.idSectionSource !== idDerniereSection) {
                    console.log(`[${this.constructor.name}] Transfert du sujet ID ${instance.idSujet} de la section ${sujet.idSectionSource} vers la section ${idDerniereSection}.`);
                    await pageForum.transfererSujet(instance.idSujet, idDerniereSection);
                }
                objetsCharges.push(instance);
            } else {
                console.warn(`Échec du chargement de l'objet depuis le sujet: "${sujet.titre}" (ID: ${sujet.id})`);
            }
        }
        console.log('objetsCharges: ', objetsCharges)
        cacheObjetForums.set(nomClasse, objetsCharges);
        return objetsCharges;
    }
}
