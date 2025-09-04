class FonctionnaliteAlliance {
    /**
     * Configuration déclarative. Liste des abréviations de la fonctionnalité.
     * @type {Array<String>}
     */
    static ABREVIATIONS_HISTORY = [];

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
            console.log(`[${this.constructor.name}] Appel de verifierVersionSuffisanteEtPresenceSections().`);
            if (!await this.verifierVersionSuffisanteEtPresenceSections()) {
                console.log(`[${this.constructor.name}] verifierVersionSuffisanteEtPresenceSections() a retourné false.`);
                return false;
            }
            console.log(`[${this.constructor.name}] Appel de verifierPresenceSujetMembre().`);
            if (!await this.verifierPresenceSujetMembre()) {
                console.log(`[${this.constructor.name}] verifierPresenceSujetMembre() a retourné false.`);
                return false;
            }
            console.log(`[${this.constructor.name}] Appel de verifierDroitInit().`);
            if (!await this.verifierDroitInit()) {
                console.log(`[${this.constructor.name}] verifierDroitInit() a retourné false.`);
                return false;
            }

            // La méthode run() doit être implémentée par la classe fille.
            if (typeof this.run === 'function') {
                console.log(`[${this.constructor.name}] Appel de run().`);
                this.run();
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
        console.log(`[${this.constructor.name}] Début de _decouvrirObjetForumsDependants().`);
        const nomClasse = this.constructor.name;
        if (dependancesObjetForumsCache.has(nomClasse)) {
            this.objetsDependants = dependancesObjetForumsCache.get(nomClasse);
            console.log(`[${this.constructor.name}] ObjetForums dépendants récupérés du cache pour ${nomClasse}.`);
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
            console.log(`[${this.constructor.name}] Identifiants collectés:`, [...allIdentifiers]);

        } catch (e) {
            console.error(`Erreur lors du parsing AST pour ${nomClasse}:`, e);
            return;
        }

        const dependancesTrouvees = new Set();
        const registreObjetForums = registreClasses.ObjetForum;
        console.log(`[${this.constructor.name}] Registre des objets disponibles:`, [...registreObjetForums.keys()]);

        // Parcourt les identifiants trouvés pour les résoudre en classes ObjetForum.
        for (const nom of allIdentifiers) {
            // Scénario 1: L'identifiant est directement le nom d'une classe ObjetForum.
            if (registreObjetForums.has(nom)) {
                dependancesTrouvees.add(nom);
                console.log(`[${this.constructor.name}] Dépendance directe trouvée: ${nom}`);
            }
            // Scénario 2: L'identifiant est une variable globale qui pointe vers une instance d'ObjetForum.
            // On utilise la carte des types pour trouver le nom de la classe.
            if (carteDesTypes.has(`window.${nom}`)) {
                const nomClasseMappee = carteDesTypes.get(`window.${nom}`);
                if (registreObjetForums.has(nomClasseMappee)) {
                    dependancesTrouvees.add(nomClasseMappee);
                    console.log(`[${this.constructor.name}] Dépendance via carteDesTypes trouvée: ${nomClasseMappee} (via ${nom})`);
                }
            }
        }
        console.log(`[${this.constructor.name}] Dépendances uniques trouvées:`, [...dependancesTrouvees]);

        // Instancie chaque classe de dépendance unique.
        const instancesDependances = [];
        for (const nomClasseDependance of dependancesTrouvees) {
            const ClasseDependance = registreObjetForums.get(nomClasseDependance);
            if (ClasseDependance) {
                instancesDependances.push(new ClasseDependance(this));
                console.log(`[${this.constructor.name}] Instance de dépendance créée: ${nomClasseDependance}`);
            }
        }

        // Met en cache le résultat pour les futurs appels et peuple la liste de l'instance.
        dependancesObjetForumsCache.set(nomClasse, instancesDependances);
        this.objetsDependants = instancesDependances;
        console.log(`[${this.constructor.name}] Fin de _decouvrirObjetForumsDependants(). ObjetForums dépendants:`, this.objetsDependants.map(o => o.constructor.name));
    }

    /**
     * Vérifie que tous les objets dépendants ont une version compatible et que leurs sections existent.
     * @private
     * @returns {Boolean} - True si tout est valide, sinon false.
     */
    async verifierVersionSuffisanteEtPresenceSections() {
        console.log(`[${this.constructor.name}] Début de verifierVersionSuffisanteEtPresenceSections().`);

        this._decouvrirObjetForumsDependants();

        for (const objet of this.objetsDependants) {
            console.log(`[${this.constructor.name}] Vérification de l'objet dépendant: ${objet.constructor.name}`);
            const verificationResult = await objet.verifierVersionSuffisanteEtPresenceSection();
            console.log(`[${this.constructor.name}] Résultat de la vérification pour ${objet.constructor.name}: ${verificationResult}`);
            if (!verificationResult) {
                console.error(`Échec de la vérification de version/section pour l'objet ${objet.constructor.name}`);
                console.log(`[${this.constructor.name}] Fin de verifierVersionSuffisanteEtPresenceSections(): false.`);
                return false;
            }
        }
        console.log(`[${this.constructor.name}] Fin de verifierVersionSuffisanteEtPresenceSections(): true.`);
        return true;
    }

    /**
     * Vérifie si le joueur actuel est bien membre de l'alliance en se basant sur la liste des joueurs.
     * @private
     * @returns {Promise<Boolean>} - True si le joueur est membre, sinon false.
     */
    async verifierPresenceSujetMembre() {
        console.log(`[${this.constructor.name}] Début de verifierPresenceSujetMembre.`);
        // Pour les tests, on utilise JoueurTest. En production, ce serait la classe Joueur.
        console.log(`[${this.constructor.name}] Chargement des objets JoueurTest.`);
        const joueurs = await this.chargerObjetForumsMultiples(JoueurTest);
        const pseudoJoueurActuel = monProfilJoueur.pseudo; // En supposant que `pseudo` contient le pseudo du joueur connecté.

        console.log(`[${this.constructor.name}] Pseudo du joueur actuel: "${pseudoJoueurActuel}".`);
        // Attendre que toutes les promesses de lireParametre soient résolues avant de logger.
        const pseudosJoueursCharges = await Promise.all(joueurs.map(j => j.lireParametre('Pseudo')));
        console.log(`[${this.constructor.name}] Joueurs chargés:`, pseudosJoueursCharges);

        if (!pseudoJoueurActuel) {
            console.error(`[${this.constructor.name}] Le pseudo du joueur actuel n'a pas pu être déterminé.`);
            console.log(`[${this.constructor.name}] Fin de verifierPresenceSujetMembre: false (pseudo manquant).`);
            return false;
        }

        const estMembre = await Promise.all(joueurs.map(async joueur => {
            const joueurPseudo = await joueur.lireParametre('Pseudo');
            console.log(`[${this.constructor.name}] Comparaison: "${joueurPseudo}" === "${pseudoJoueurActuel}"`);
            // 'pseudo' est le nom du paramètre dans la classe Joueur.
            return joueurPseudo === pseudoJoueurActuel;
        })).then(results => results.some(result => result));

        console.log(`[${this.constructor.name}] Résultat de la recherche de membre: ${estMembre}.`);

        if (!estMembre) {
            console.log(`[${this.constructor.name}] Le joueur "${pseudoJoueurActuel}" n'est pas trouvé dans la liste des membres de l'alliance.`);
        }

        console.log(`[${this.constructor.name}] Fin de verifierPresenceSujetMembre: ${estMembre}.`);
        return estMembre;
    }

    /**
     * Demande au gestionnaire de droits de rafraîchir sa liste de droits.
     * @protected
     * @returns {Promise<void>}
     */
    async rafraichirDroits() {
        console.log(`[${this.constructor.name}] Début de rafraichirDroits().`);
        // On passe 'this' pour que le gestionnaire puisse utiliser les méthodes de la fonctionnalité,
        // comme chargerObjetForumsMultiples, pour charger les données nécessaires.
        await gestionnaireDroits.rafraichir(this);
        console.log(`[${this.constructor.name}] Fin de rafraichirDroits().`);
    }

    /**
     * Vérifie si le joueur actuel a le niveau de droit requis pour cette fonctionnalité.
     * @protected
     * @param {String} niveauRequis - Le niveau de droit à vérifier (ex: 'R', 'N', 'A').
     * @returns {Boolean} - True si le joueur a le droit suffisant, sinon false.
     */
    async verifierDroit(niveauRequis) {
        console.log(`[${this.constructor.name}] Début de verifierDroit() pour niveau: ${niveauRequis}.`);
        const abrevHistory = this.constructor.ABREVIATIONS_HISTORY;
        if (!abrevHistory || abrevHistory.length === 0) {
            console.error(`Aucune abréviation n'est définie pour la fonctionnalité ${this.constructor.name}.`);
            console.log(`[${this.constructor.name}] Fin de verifierDroit(): false (abréviation manquante).`);
            return false;
        }
        const abrev = abrevHistory[abrevHistory.length - 1];
        console.log(`[${this.constructor.name}] Abréviation de la fonctionnalité: ${abrev}.`);
        const resultat = await gestionnaireDroits.verifierDroit(abrev, niveauRequis);
        console.log(`[${this.constructor.name}] Résultat de verifierDroit: ${resultat}.`);
        return resultat;
    }

    /**
     * Vérifie que le joueur a les droits suffisants pour l'initialisation de la fonctionnalité.
     * @private
     * @returns {Promise<Boolean>} - True si le joueur a au minimum le droit 'Restreint', sinon false.
     */
    async verifierDroitInit() {
        console.log(`[${this.constructor.name}] Début de verifierDroitInit().`);
        await this.rafraichirDroits();
        const resultat = await this.verifierDroit('R');
        console.log(`[${this.constructor.name}] Fin de verifierDroitInit(): ${resultat}.`);
        return resultat;
    }

    /**
     * Charge en masse toutes les instances d'un type d'objet depuis le forum, en utilisant un cache de page.
     * @template T
     * @param {new() => T} ClasseObjetForum - La classe de l'objet à charger.
     * @param {Boolean} chargerContenus - Si true, charge aussi les objets contenus.
     * @returns {Promise<Array<T>>} - Une promesse qui résout avec un tableau d'instances de l'objet.
     */
    async chargerObjetForumsMultiples(ClasseObjetForum, chargerContenus = true) {
        console.log(`[${this.constructor.name}] Début de chargerObjetForumsMultiples() pour la classe: ${ClasseObjetForum.name}.`);
        const nomClasse = ClasseObjetForum.name;
        if (cacheObjetForums.has(nomClasse)) {
            console.log(`[${this.constructor.name}] ObjetForums de ${nomClasse} récupérés du cache.`);
            return cacheObjetForums.get(nomClasse);
        }

        const instanceTemporaire = new ClasseObjetForum();
        if (!instanceTemporaire.idsSection || instanceTemporaire.idsSection.length === 0) {
            console.warn(`La classe ${nomClasse} n'a pas d'idsSection configurés.`);
            console.log(`[${this.constructor.name}] Fin de chargerObjetForumsMultiples(): [] (idsSection manquants).`);
            return [];
        }
        console.log(`[${this.constructor.name}] IDs de section pour ${nomClasse}:`, instanceTemporaire.idsSection);

        let tousLesSujets = [];
        for (const idSection of instanceTemporaire.idsSection) {
            try {
                console.log(`[${this.constructor.name}] Récupération des sujets de la section ${idSection} via recupererSujetsSection.`);
                const sujetsSection = await pageForum.recupererSujetsSection(idSection);
                sujetsSection.forEach(sujet => {
                    sujet.idSectionSource = idSection;
                    tousLesSujets.push(sujet);
                    console.log(`[${this.constructor.name}] Sujet trouvé: ID ${sujet.id}, Titre: "${sujet.contenu}", Section Source: ${idSection}.`);
                });
            } catch (error) {
                console.error(`Impossible de charger les sujets pour la section ${idSection}.`, error);
            }
        }
        console.log(`[${this.constructor.name}] Tous les sujets trouvés:`, tousLesSujets.length);

        const objetsCharges = [];
        for (const sujet of tousLesSujets) {
            console.log(`[${this.constructor.name}] Tentative de chargement de l'objet depuis le sujet ID: ${sujet.id}, Titre: "${sujet.contenu}".`);
            const instance = new ClasseObjetForum(this, { idSujet: parseInt(sujet.id, 10) });
            const chargementReussi = await instance.rafraichir(chargerContenus);
            if (chargementReussi) {
                // Transfert du sujet si nécessaire :
                const idDerniereSection = instance.idsSection[instance.idsSection.length - 1];
                if (sujet.idSectionSource !== idDerniereSection) {
                    console.log(`[${this.constructor.name}] Transfert du sujet ID ${instance.idSujet} de la section ${sujet.idSectionSource} vers la section ${idDerniereSection}.`);
                    await pageForum.transfererSujet(instance.idSujet, idDerniereSection);
                }
                objetsCharges.push(instance);
                console.log(`[${this.constructor.name}] ObjetForum de ${nomClasse} chargé avec succès.`);
            } else {
                console.warn(`Échec du chargement de l'objet depuis le sujet: "${sujet.titre}" (ID: ${sujet.id})`);
            }
        }

        cacheObjetForums.set(nomClasse, objetsCharges);
        console.log(`[${this.constructor.name}] Fin de chargerObjetForumsMultiples() pour ${nomClasse}. ObjetForums chargés: ${objetsCharges.length}.`);
        return objetsCharges;
    }
}
