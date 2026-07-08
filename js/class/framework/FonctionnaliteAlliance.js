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
     * Vérification de l'état de membre requis pour initialiser la fonctionnalité.
     * @type {boolean}
     */
    static VERIFICATION_MEMBRE_REQUIS = true;

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
     * Exécute une série d'opérations dans le contexte d'une transaction.
     * @param {Function} callback - La fonction asynchrone contenant les opérations à exécuter.
     * @returns {Promise<any>} Le résultat du callback.
     */
    async executerTransaction(callback) {
        console.log("[GererCommandes] Transaction : ", transaction);
        if (transaction !== null) {
            // Pour s'assurer qu'il s'agit d'un véritable appel imbriqué (nesting)
            // et non d'une tâche de fond concurrente, on inspecte la pile d'appels.
            const stack = new Error().stack || "";
            const isNested = stack.includes("Transaction.run") || (stack.match(/executerTransaction/g) || []).length >= 2;
            if (isNested) {
                console.log("[FonctionnaliteAlliance] Transaction déjà en cours, exécution du callback dans le contexte de la transaction active (nesting).");
                return await callback();
            }

            $.toast({
                ...TOAST_WARNING,
                text: "Une opération est déjà en cours, veuillez patienter."
            });
            return; // Bloque l'exécution concurrente hors nesting (ex: tâche de fond autonome)
        }

        // if (transaction2 != null) {
        //     transaction3 = new Transaction();
        //     transaction = transaction3;
        // } else {
        //     transaction2 = new Transaction();
        //     transaction = transaction2;
        // }
        transaction = new Transaction(this);

        try {
            const resultat = await transaction.run(callback);
            return resultat;
        } finally {
            // if (transaction === transaction2) {
            //     transaction2 = null;
            // } else if (transaction === transaction3) {
            //     transaction3 = null;
            // }
            transaction = null;
        }
    }

    /**
     * Gère la séquence d'initialisation asynchrone de la fonctionnalité.
     * @returns {Promise<Boolean>}
     */
    async init() {
        console.log(`[${this.constructor.name}] Début de l'initialisation.`);
        try {
            if (!await this.verifierConditionsInitiales()) {
                return false;
            }

            // La méthode run() doit être implémentée par la classe fille.
            await this.run();

            console.log(`[${this.constructor.name}] Initialisation terminée avec succès.`);
            return true;
        } catch (error) {
            console.error(`Erreur lors de l'initialisation de la fonctionnalité ${this.constructor.name}:`, error);
            return false;
        }
    }

    /**
     * Regroupe les vérifications critiques (version, appartenance, droits) nécessaires
     * à l'exécution ou à la sécurisation d'une action.
     * @param {Boolean} [forcerRafraichissement=false] - Si true, rafraîchit les gestionnaires et données clés.
     * @returns {Promise<Boolean>} - True si toutes les conditions sont remplies.
     */
    async verifierConditionsInitiales(forcerRafraichissement = false) {
        if (!await this.verifierVersionSuffisanteEtPresenceSections(forcerRafraichissement)) {
            console.warn(`[${this.constructor.name}] Conditions de version ou de section non remplies.`);
            return false;
        }

        if (this.constructor.VERIFICATION_MEMBRE_REQUIS && !await this.verifierPresenceSujetMembre(forcerRafraichissement)) {
            console.warn(`[${this.constructor.name}] Le joueur n'est pas membre.`);
            return false;
        }

        if (!await this.verifierDroits(forcerRafraichissement)) {
            console.warn(`[${this.constructor.name}] Droits d'initialisation insuffisants.`);
            return false;
        }

        return true;
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
            throw e;
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
     * Analyse statiquement le code de la fonctionnalité pour identifier tous les appels à chargerObjetsForum.
     * @private
     * @returns {Array<Array<Object>>} - Liste des signatures d'appels (tableau d'arguments décrits).
     */
    _determinerAppelsChargement() {
        const nomClasse = this.constructor.name;
        if (appelsChargementCache.has(nomClasse)) {
            return appelsChargementCache.get(nomClasse);
        }

        // Concatène le code source de la classe actuelle
        const codeSource = this.constructor.toString() + '\n' + Object.getPrototypeOf(this.constructor).toString();
        const clesUniques = new Set();
        const appels = [];

        try {
            const ast = acorn.parse(codeSource, { ecmaVersion: 2022, sourceType: 'script' });

            const traverse = (node) => {
                if (!node) return;

                if (node.type === 'CallExpression') {
                    const callee = node.callee;
                    const isMethodCall = callee.type === 'MemberExpression' &&
                        callee.object.type === 'ThisExpression' &&
                        callee.property.name === 'chargerObjetsForum';
                    const isDirectCall = callee.type === 'Identifier' && callee.name === 'chargerObjetsForum';

                    if (isMethodCall || isDirectCall) {
                        const args = node.arguments;
                        if (args.length > 0) {
                            const signature = args.map(arg => {
                                if (arg.type === 'Identifier') return { type: 'Identifier', value: arg.name };
                                if (arg.type === 'Literal') return { type: 'Literal', value: arg.value };
                                return { type: 'Other', raw: codeSource.substring(arg.start, arg.end) };
                            });

                            const key = JSON.stringify(signature);
                            if (!clesUniques.has(key)) {
                                clesUniques.add(key);
                                appels.push(signature);
                            }
                        }
                    }
                }

                for (const key in node) {
                    if (Object.prototype.hasOwnProperty.call(node, key)) {
                        const child = node[key];
                        if (typeof child === 'object' && child !== null) {
                            if (Array.isArray(child)) {
                                child.forEach(traverse);
                            } else {
                                traverse(child);
                            }
                        }
                    }
                }
            };

            traverse(ast);
        } catch (e) {
            console.error(`Erreur lors de l'analyse AST des appels de chargement pour ${nomClasse}:`, e);
            throw e;
        }

        appelsChargementCache.set(nomClasse, appels);
        return appels;
    }

    /**
     * Rafraîchit l'intégralité des données forum utilisées par la fonctionnalité,
     * en vidant les caches appropriés et en rejouant les chargements détectés.
     * @returns {Promise<void>}
     */
    async rafraichirDonneesFonctionnalite() {
        const signatures = this._determinerAppelsChargement();

        // Identifier les classes impliquées pour vider leur cache
        const classesUniques = new Set();
        signatures.forEach(sig => {
            if (sig.length > 0 && sig[0].type === 'Identifier') {
                classesUniques.add(sig[0].value);
            }
        });

        for (const nomClasse of classesUniques) {
            console.log(`[${this.constructor.name}] Vidage du cache pour la classe ${nomClasse}.`);
            FonctionnaliteAlliance.viderCacheClasse(nomClasse);
        }
    }

    /**
     * Vide toutes les entrées du cache (signatures) pour une classe donnée.
     * @param {typeof ObjetForum|String} Classe - La classe ou son nom.
     * @static
     */
    static viderCacheClasse(Classe) {
        const nomClasse = typeof Classe === 'string' ? Classe : Classe.name;
        for (const key of cacheObjetForums.keys()) {
            if (key.startsWith(`${nomClasse}_`)) {
                cacheObjetForums.delete(key);
            }
        }
    }

    /**
     * Capture l'état actuel de tous les objets forum chargés pour cette fonctionnalité.
     * @param {Set<String>} classesIdentifiees - Les noms des classes à inclure dans l'empreinte.
     * @returns {Promise<String>} - L'empreinte globale sérialisée.
     */
    async _prendreEmpreinteGlobale(signaturesAppels) {
        const empreinteTotale = {};

        for (const sig of signaturesAppels) {
            // Résolution des arguments pour l'appel à chargerObjetsForum
            const resolvedArgs = sig.map(arg => {
                if (arg.type === 'Identifier') {
                    if (arg.value === 'true') return true;
                    if (arg.value === 'false') return false;
                    return window[arg.value] || registreClasses.ObjetForum.get(arg.value);
                }
                if (arg.type === 'Literal') return arg.value;
                return undefined;
            });

            if (resolvedArgs[0]) {
                const nomClasse = resolvedArgs[0].name;
                const keySig = JSON.stringify(sig); // Utiliser la signature comme clé pour différencier les chargements

                console.log(`[${this.constructor.name}] Prise d'empreinte pour la signature : chargerObjetsForum(${sig.map(a => a.value || a.raw).join(', ')})`);
                let objets;
                await this.executerTransaction(async () => {
                    objets = await this.chargerObjetsForum(...resolvedArgs);
                });
                const empreintes = await Promise.all(objets.map(obj => obj._prendreEmpreinte()));
                empreinteTotale[nomClasse + "_" + keySig] = empreintes.sort();
            }
        }

        return JSON.stringify(empreinteTotale);
    }

    /**
     * Vérifie que tous les objets dépendants ont une version compatible et que leurs sections existent.
     * @param {Boolean} [forcerRafraichissement=false] - Si true, rafraîchit le gestionnaire de versions.
     * @private
     * @returns {Boolean} - True si tout est valide, sinon false.
     */
    async verifierVersionSuffisanteEtPresenceSections(forcerRafraichissement = false) {
        this._decouvrirObjetForumsDependants();

        if (forcerRafraichissement) {
            sectionsEnCache.clear();
            await gestionnaireVersions.rafraichir();
            this.objetsDependants.forEach(obj => obj._actualiserIdsSection());
        }

        for (const objet of this.objetsDependants) {
            if (!(await objet.verifierVersionSuffisante())) {
                console.error(`Échec de la vérification de version pour l'objet ${objet.constructor.name}`);
                return false;
            }
            if (!(await objet.verifierPresenceSection())) {
                console.error(`Échec de la vérification de section pour l'objet ${objet.constructor.name}`);
                return false;
            }
        }
        return true;
    }

    /**
     * Vérifie si le joueur actuel est bien membre de l'alliance en se basant sur la liste des joueurs.
     * @param {Boolean} [forcerRafraichissement=false] - Si true, force le rechargement de la liste des joueurs en ignorant le cache.
     * @private
     * @returns {Promise<Boolean>} - True si le joueur est membre, sinon false.
     */
    async verifierPresenceSujetMembre(forcerRafraichissement = false) {
        console.log('Inside verifierPresenceSujetMembre')
        if (forcerRafraichissement) {
            FonctionnaliteAlliance.viderCacheClasse(Joueur);
        }
        let joueurs;
        await this.executerTransaction(async () => {
            joueurs = await this.chargerObjetsForum(Joueur, false);
            console.log('joueurs chargés inside', joueurs)
        });
        console.log('joueurs chargés outside', joueurs)
        const pseudoJoueurActuel = await monProfilJoueur.lire('Pseudo'); // En supposant que `pseudo` contient le pseudo du joueur connecté.
        console.log('pseudoJoueurActuel', pseudoJoueurActuel)
        if (!pseudoJoueurActuel) {
            console.error(`[${this.constructor.name}] Le pseudo du joueur actuel n'a pas pu être déterminé.`);
            return false;
        }

        const estMembre = await Promise.all(joueurs.map(async joueur => {
            const joueurPseudo = await joueur.lire('Pseudo');
            // 'Pseudo' est le nom du paramètre dans la classe Joueur.
            console.log('joueurPseudo', joueurPseudo)
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
        // comme chargerObjetsForum, pour charger les données nécessaires.
        await this.executerTransaction(async () => {
            await gestionnaireDroits.rafraichir(this);
        });
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
     * @param {Boolean} [forcerRafraichissement=false] - Si true, rafraîchit le gestionnaire de droits.
     * @private
     * @returns {Promise<Boolean>} - True si le joueur a le droit requis, sinon false.
     */
    async verifierDroits(forcerRafraichissement = false) {
        if (forcerRafraichissement) {
            console.log(`[${this.constructor.name}] Rafraîchissement forcé des droits : vidage du cache.`);
            const classeDroits = gestionnaireDroits.constructor.classeObjetsForumContenus;
            FonctionnaliteAlliance.viderCacheClasse(classeDroits);
        }
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
    async chargerObjetsForum(ClasseObjetForum, chargerContenus = true) {
        console.log('Inside chargerObjetsForum')
        const nomClasse = ClasseObjetForum.name;
        const cleDemande = `${nomClasse}_${chargerContenus}`;
        const cleOpposee = `${nomClasse}_${!chargerContenus}`;

        if (cacheObjetForums.has(cleDemande)) {
            return cacheObjetForums.get(cleDemande);
        }

        const objetsCharges = [];

        if (cacheObjetForums.has(cleOpposee)) {
            console.log(`[${this.constructor.name}] Utilisation du cache existant (${cleOpposee}) pour charger ${cleDemande} via rafraîchissement.`);
            const objetsEnCacheOppose = cacheObjetForums.get(cleOpposee);
            const nouveauxObjets = [];
            for (const obj of objetsEnCacheOppose) {
                const instance = new ClasseObjetForum(this, { idSujet: obj.idSujet, idSection: obj.idSection });
                if (await instance.rafraichir(chargerContenus, false)) {
                    nouveauxObjets.push(instance);
                }
            }
            cacheObjetForums.set(cleDemande, nouveauxObjets);
            return nouveauxObjets;
        }

        console.log('nomClasse', nomClasse)
        const instanceTemporaire = new ClasseObjetForum();
        if (!instanceTemporaire.idsSection || instanceTemporaire.idsSection.length === 0) {
            console.warn(`La classe ${nomClasse} n'a pas d'idsSection configurés.`);
            return [];
        }
        console.log('instanceTemporaire.idsSection', instanceTemporaire.idsSection)
        let tousLesSujets = [];
        for (const idSection of instanceTemporaire.idsSection) {
            try {
                const sujetsSection = await Utils.recupererSujetsSection(idSection);
                sujetsSection.forEach(sujet => {
                    sujet.idSectionSource = idSection;
                    tousLesSujets.push(sujet);
                });
            } catch (error) {
                console.error(`Impossible de charger les sujets pour la section ${idSection}.`, error);
                throw error;
            }
        }
        console.log('tousLesSujets: ', tousLesSujets)

        for (const sujet of tousLesSujets) {
            console.log(`id Section sujet: ${sujet.idSectionSource}`)
            const instance = new ClasseObjetForum(this, { idSujet: parseInt(sujet.id, 10), idSection: sujet.idSectionSource });
            console.log(`instance section id avant rafraichissement: ${instance.idSection}`);
            const chargementReussi = await instance.rafraichir(chargerContenus, false);
            console.log(`instance section id après rafraichissement: ${instance.idSection}`);
            console.log('chargementReussi: ', chargementReussi)
            if (chargementReussi) {
                // Transfert du sujet si nécessaire :
                const idDerniereSection = instance.idsSection[instance.idsSection.length - 1];
                console.log('idDerniereSection', idDerniereSection)
                if (sujet.idSectionSource !== idDerniereSection) {
                    console.log(`[${this.constructor.name}] Transfert du sujet ID ${instance.idSujet} de la section ${sujet.idSectionSource} vers la section ${idDerniereSection}.`);
                    await instance.transferer(idDerniereSection);
                }
                console.log('instance pushing', instance);
                objetsCharges.push(instance);
            } else {
                console.warn(`Échec du chargement de l'objet depuis le sujet: "${sujet.titre}" (ID: ${sujet.id})`);
            }
        }

        // Détection et suppression des doublons logiques sur les objets principaux
        const listeSansDoublons = await Utils.eliminerDoublons(objetsCharges);

        console.log('objetsCharges (sans doublons): ', listeSansDoublons)
        cacheObjetForums.set(cleDemande, listeSansDoublons);
        return listeSansDoublons;
    }

    /**
     * Met à jour le cache global des objets forum avec une instance donnée.
     * Si l'objet existe déjà (même idSujet), il est remplacé ou supprimé. Sinon, il est ajouté en début de liste.
     * @param {ObjetForum} objet - L'instance de l'objet à mettre en cache.
     * @param {Boolean} [supprimer=false] - Si true, retire l'objet du cache.
     * @static
     */
    static async mettreAJourCache(objet, supprimer = false) {
        console.log('mise à jour cache pour: ', objet, 'supprimer:', supprimer)

        if (objet.getLastLocation().lieu !== 'titre') {
            return;
        }

        const nomClasse = objet.constructor.name;
        const clesAMettreAJour = Array.from(cacheObjetForums.keys()).filter(key => key.startsWith(`${nomClasse}_`));
        const aDesContenus = objet.objetsForumContenus.length > 0;

        for (const key of clesAMettreAJour) {
            const liste = cacheObjetForums.get(key);
            const index = liste.findIndex(o => o.idSujet === objet.idSujet);
            const keyFlag = key.split('_')[1] === 'true';

            if (index !== -1) {
                if (supprimer) {
                    console.log(`[FonctionnaliteAlliance] Suppression de l'objet ${nomClasse} (ID: ${objet.idSujet}) du cache ${key}.`);
                    liste.splice(index, 1);
                } else {
                    const objetEnCache = liste[index];
                    if (keyFlag === aDesContenus) {
                        console.log(`[FonctionnaliteAlliance] Mise à jour complète de l'objet ${nomClasse} (ID: ${objet.idSujet}) dans le cache ${key}.`);
                        liste[index] = objet;
                    } else {
                        console.log(`[FonctionnaliteAlliance] Mise à jour partielle (données) de l'objet ${nomClasse} (ID: ${objet.idSujet}) dans le cache ${key}.`);
                        // Transfert des paramètres et attributs de l'objet modifié vers l'objet en cache (qui garde ses flag/contenus propres)
                        const donnees = await objet.lire(['paramètres', 'attributs non calculés']);
                        await objetEnCache.ecrire(donnees);
                    }
                }
            } else if (!supprimer) {
                // Ajout au cache existant
                if (!aDesContenus || keyFlag && aDesContenus) {
                    console.log(`[FonctionnaliteAlliance] Ajout de l'objet ${nomClasse} (ID: ${objet.idSujet}) au début du cache ${key}.`);
                    liste.unshift(objet);
                } else {
                    // Liste sans contenants mais objet avec contenus -> ajout d'une version légère
                    console.log(`[FonctionnaliteAlliance] Ajout d'une version légère de l'objet ${nomClasse} (ID: ${objet.idSujet}) dans le cache ${key}.`);
                    const instanceLegere = new objet.constructor(objet.fonctionnaliteCreatrice, { idSujet: objet.idSujet, idSection: objet.idSection });
                    const donnees = await objet.lire(['paramètres', 'attributs non calculés']);
                    await instanceLegere.ecrire(donnees);
                    liste.unshift(instanceLegere);
                }
            }
        }
    }
}
