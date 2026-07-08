class Transaction {
    /**
     * Listes d'objets créés durant la transaction.
     * @type {Array<ObjetForum>}
     * @private
     */
    creations = [];
    /**
     * Listes d'objets modifiés durant la transaction.
     * @type {Array<ObjetForum>}
     * @private
     */
    modifications = [];
    /**
     * Listes d'objets transférés durant la transaction.
     * @type {Array<ObjetForum>}
     * @private
     */
    transferts = [];
    /**
     * Listes d'objets supprimés durant la transaction.
     * @type {Array<ObjetForum>}
     * @private
     */
    suppressions = [];
    /**
     * Indique si la transaction est en cours d'annulation.
     * @type {Boolean}
     * @private
     */
    rollbacking = false;

    /**
     * Lie la transactrion à la fonctionnalité qui l'a lancée.
     * @type {FonctionnaliteAlliance}
     * @private
     */
    fonctionnalite = true;

    constructor(fonctionnalite) {
        this.bloquerFermetureEtRafraichissement = this.bloquerFermetureEtRafraichissement.bind(this);
        this.intercepterClicsDestructeurs = this.intercepterClicsDestructeurs.bind(this);
        this.intercepterSoumissionsFormulaire = this.intercepterSoumissionsFormulaire.bind(this);
        this.fonctionnalite = fonctionnalite
    }

    /**
     * Vérifie si l'opération en cours provient de l'intérieur de la transaction.
     * @private
     * @returns {Boolean}
     */
    _vientDeLaTransaction() {
        const stack = new Error().stack || "";
        return stack.includes("Transaction.run") || (stack.match(/executerTransaction/g) || []).length >= 2;
    }

    // Bloque les clics sur les liens menant à une autre page dans le même onglet
    intercepterClicsDestructeurs(e) {
        if (this._vientDeLaTransaction()) return;
        const lien = e.target.closest('a');
        if (lien) {
            const href = lien.getAttribute('href');
            const target = lien.getAttribute('target');

            // On ne bloque que si le lien navigue réellement dans l'onglet courant
            const estLienInterneVide = !href || href.startsWith('#') || href.startsWith('javascript:');
            const ouvreDansNouvelOnglet = target === '_blank';

            if (!estLienInterneVide && !ouvreDansNouvelOnglet) {
                e.preventDefault();
                e.stopPropagation();
                $.toast({
                    ...TOAST_WARNING,
                    text: "Navigation bloquée : une transaction est en cours."
                });
            }
        }
    }

    // Bloque la soumission de formulaires standards (qui rechargeraient la page)
    intercepterSoumissionsFormulaire(e) {
        console.log('tentative de transmission de formulaire');
        if (this._vientDeLaTransaction()) return;
        e.preventDefault();
        e.stopPropagation();
        $.toast({
            ...TOAST_WARNING,
            text: "Action bloquée : attendez la fin de la transaction pour soumettre des formulaires."
        });
    };

    // Bloque le rafraîchissement (F5 / bouton actualiser), la fermeture d'onglet, et la navigation externe
    bloquerFermetureEtRafraichissement(e) {
        if (this._vientDeLaTransaction()) return;
        e.preventDefault();
        e.returnValue = "Une transaction est en cours. Vos modifications risquent d'être perdues.";
        return e.returnValue;
    };

    /**
     * Exécute la transaction.
     * @param {Function} callback - Fonction asynchrone contenant les opérations à effectuer.
     * @returns {Promise<any>} Résultat de la transaction.
     */
    async run(callback) {
        try {
            // Active les bloqueurs pour cette transaction
            window.addEventListener('beforeunload', this.bloquerFermetureEtRafraichissement);
            document.addEventListener('click', this.intercepterClicsDestructeurs, true);
            document.addEventListener('submit', this.intercepterSoumissionsFormulaire, true);

            const resultat = await callback();
            console.warn("Transaction : Callback terminé ")

            if (this.contientDesOperationsActives()) {
                await Utils.sleep(TRANSACTION_COLLISION_WAIT_MS);
                // if (!transaction3) {
                //     transaction = transaction2;
                // }
                const etatCollision = await this.verifierEtatForum();
                if (etatCollision === 'COLLISION_TOTAL') {
                    $.toast({
                        ...TOAST_ERROR,
                        heading: "Collision totale détectée",
                        text: "Les modifications forum ont été entièrement altérées ou supprimées par un tiers, invalidant l'opération. La page va être rechargée.",
                        hideAfter: 5000
                    });
                    setTimeout(() => location.href = location.href, 5000);
                    return;
                } else if (etatCollision === 'COLLISION_INCOHERENT') {
                    $.toast({
                        ...TOAST_ERROR,
                        heading: "Collision partielle détectée",
                        text: "Une collision partielle a été détectée, invalidant l'opération. Annulation des opérations effectuées et rechargement de la page.",
                        hideAfter: 5000
                    });
                    const debutAnnulation = moment();
                    try {
                        await this.annuler();
                    } catch (rollbackError) {
                        console.error("[executerTransaction] Échec du rollback après collision incohérente:", rollbackError);
                    }
                    await this.executerActionsApresAnnuler();
                    const dureeAnnulation = moment().diff(debutAnnulation);
                    const tempsRestant = Math.max(0, 5000 - dureeAnnulation);
                    setTimeout(() => location.href = location.href, tempsRestant);
                    return;
                }
            }

            return resultat;
        } catch (error) {
            console.error(`[${this.constructor.name}][executerTransaction] Erreur lors de l'exécution de la transaction. Lancement du rollback.`, error);
            try {
                await this.annuler();
            } catch (rollbackError) {
                console.error(`[${this.constructor.name}][executerTransaction] Échec critique lors du rollback de la transaction:`, rollbackError);
            }
            await this.executerActionsApresAnnuler();
            $.toast({
                ...TOAST_ERROR,
                text: "Une erreur est survenue lors de l'opération. Les modifications ont été annulées. La page va être rechargée."
            });
            setTimeout(() => location.href = location.href, 3000);
            throw error;
        } finally {
            window.removeEventListener('beforeunload', this.bloquerFermetureEtRafraichissement);
            document.removeEventListener('click', this.intercepterClicsDestructeurs, true);
            document.removeEventListener('submit', this.intercepterSoumissionsFormulaire, true);
        }
    }

    /**
     * Retourne true s'il y a au moins une opération enregistrée dans la transaction.
     * @returns {Boolean}
     */
    contientDesOperationsActives() {
        return this.creations.length > 0 ||
            this.modifications.length > 0 ||
            this.transferts.length > 0;
    }

    /**
     * Enregistre la création d'un ObjetForum.
     * @param {ObjetForum} objetForum - L'instance de l'objet créé.
     */
    enregistrerCreation(objetForum) {
        if (this.rollbacking) {
            return;
        }

        this.creations.push(objetForum);
    }

    /**
     * Enregistre la modification d'un ObjetForum.
     * @param {ObjetForum} objetForum - L'instance de l'objet modifié.
     */
    enregistrerModification(objetForum) {
        if (this.rollbacking) {
            return;
        }

        if (this.creations.includes(objetForum)) {
            return;
        }

        const existe = this.modifications.some(m => m.objetForum === objetForum);
        if (!existe) {
            const stringInitial = objetForum.stringInitial;
            if (!stringInitial) {
                console.error(`[Transaction] Erreur lors de l'enregistrement de modification: L'état original de l'objet n'a pas été défini.`);
                return;
            }

            this.modifications.push({ objetForum, stringInitial });
        }
    }

    /**
     * Enregistre le transfert d'un ObjetForum.
     * @param {ObjetForum} objetForum - L'instance du sujet transféré.
     */
    enregistrerTransfert(objetForum) {
        if (this.rollbacking) {
            return;
        }

        if (this.creations.includes(objetForum)) {
            return;
        }

        const existe = this.transferts.some(t => t.objetForum === objetForum);
        if (!existe) {
            const idSectionSource = objetForum.idSection;
            this.transferts.push({ objetForum, idSectionSource });
        }
    }

    /**
     * Enregistre la suppression d'un ObjetForum.
     * @param {ObjetForum} objetForum - L'instance de l'objet supprimé.
     */
    enregistrerSuppression(objetForum) {
        if (this.rollbacking) {
            return;
        }
        console.warn(`idSection: ${objetForum.idSection}`);
        const indexCreation = this.creations.indexOf(objetForum);
        if (indexCreation !== -1) {
            this.creations.splice(indexCreation, 1);
            return;
        }

        const existe = this.suppressions.some(s => s.objet === objetForum);
        if (!existe) {
            const formatLieu = objetForum.getLastLocation();
            let entry = null;
            if (formatLieu.lieu === 'titre') {
                entry = {
                    objet: objetForum,
                    idSujet: objetForum.idSujet,
                    idMessage: null
                };
            } else if (formatLieu.lieu === 'message') {
                entry = {
                    objet: objetForum,
                    idSujet: objetForum.objetParent.idSujet,
                    idMessage: objetForum.idMessage
                };
            }
            if (entry) {
                this.suppressions.push(entry);
            }
        }
    }

    /**
     * Annule toutes les modifications enregistrées.
     */
    async annuler() {
        this.rollbacking = true;

        console.log('modifications:', this.modifications);
        console.log('suppressions:', this.suppressions);
        console.log('transferts:', this.transferts);
        console.log('creations:', this.creations);

        // 1. Suppressions (Recréations) dans l'ordre inverse
        const suppressionsInverse = [...this.suppressions].reverse();
        for (const entry of suppressionsInverse) {
            try {
                const objet = entry.objet;
                const formatLieu = objet.getLastLocation();
                if (formatLieu.lieu === 'titre') {
                    await objet.enregistrerSurForum();
                } else if (formatLieu.lieu === 'message') {
                    if (objet.objetParent) {
                        const existeDeja = objet.objetParent.objetsForumContenus.some(m => m === objet);
                        if (!existeDeja) {
                            objet.objetParent.objetsForumContenus.push(objet);
                        }
                    }
                    await objet.enregistrerSurForum();
                }
            } catch (e) {
                console.error(`[Transaction] Erreur lors de la recréation de l'objet supprimé:`, e);
            }
        }

        // 2. Transferts
        for (const { objetForum, idSectionSource } of this.transferts) {
            try {
                await objetForum.transferer(idSectionSource);
            } catch (e) {
                console.error(`[Transaction] Erreur lors du rollback de transfert:`, e);
            }
        }

        // 3. Modifications
        for (const { objetForum, stringInitial } of this.modifications) {
            console.warn(`[Transaction] Rollback de modification: ${stringInitial}`);
            try {
                await objetForum.chargerDepuisString(stringInitial);
                console.log(`[Transaction] après chargement depuis string:`, objetForum);
                await objetForum.enregistrerSurForum();
            } catch (e) {
                console.error(`[Transaction] Erreur lors du rollback de modification:`, e);
            }
        }

        // 4. Créations dans l'ordre inverse
        const creationsInverse = [...this.creations].reverse();
        for (const objet of creationsInverse) {
            try {
                await objet.supprimerSurForum();
            } catch (e) {
                console.error(`[Transaction] Erreur lors du rollback de création:`, e);
            }
        }

    }

    /**
     * Exécute les actions après l'annulation de la transaction.
     */
    async executerActionsApresAnnuler() {
        const convoisCrees = this.creations.filter(obj => obj.constructor.name === 'Convoi');
        if (convoisCrees.length > 0) {
            console.log(`[Transaction] Annulation de convois détectée.`, convoisCrees);
            const convoisPage = this.fonctionnalite.getConvoisEnCoursDePage();
            const convoisPageIds = convoisPage.map(cp => cp.idAnnulation);
            for (const convoi of convoisCrees) {
                const idConvoi = await convoi.lire('Id Convoi');
                if (convoisPageIds.includes(idConvoi)) {
                    const $link = $(`a[href*="commerce.php?annuler=${idConvoi}"]`);
                    console.log(`[Transaction] Clic sur le lien d'annulation pour le convoi ID ${idConvoi}`);
                    $link.get(0).click();
                }
            }
        }
    }

    /**
     * Vérifie l'état actuel sur le forum après une transaction pour détecter des collisions.
     * @returns {Promise<String>} Le statut global: 'OK', 'COLLISION_TOTAL', ou 'COLLISION_INCOHERENT'.
     */
    async verifierEtatForum() {
        console.log(`[verifierEtatForum] modifications: ${this.modifications.length}`);
        console.log(`[verifierEtatForum] suppressions: ${this.suppressions.legth}`);
        console.log(`[verifierEtatForum] transferts: ${this.transferts.length}`);
        console.log(`[verifierEtatForum] creations: ${this.creations.length}`);;

        const resultatsUnitaires = []; // Tableau de booleans (true = Succès unitaire, false = Échec unitaire)

        // Déterminer la liste unique des objets actifs (creations, modifications, transferts non présents dans suppressions et sans parent supprimé)
        const idSuppressions = new Set(this.suppressions.map(s => s.objet));
        const estExclu = (o) => idSuppressions.has(o) || (o.objetParent && idSuppressions.has(o.objetParent));
        const actifs = new Set();
        this.creations.forEach(o => { if (!estExclu(o)) actifs.add(o); });
        this.modifications.forEach(m => { if (!estExclu(m.objetForum)) actifs.add(m.objetForum); });
        this.transferts.forEach(t => { if (!estExclu(t.objetForum)) actifs.add(t.objetForum); });

        // Pour chaque objet actif
        for (const objet of actifs) {
            const formatLieu = objet.getLastLocation();
            const estSujet = (formatLieu.lieu === 'titre');

            const inCreations = this.creations.includes(objet);
            const inModifications = this.modifications.some(m => m.objetForum === objet);
            const inTransferts = this.transferts.some(t => t.objetForum === objet);

            const tests = new Set();
            if (inCreations) {
                if (estSujet) {
                    tests.add('section');
                }
                tests.add('valeur');
            }
            if (inModifications) {
                tests.add('valeur');
            }
            if (inTransferts) {
                tests.add('section');
            }

            console.log(`objet.idSection avant rafraichissement: ${objet.idSection}`);

            const stringForumInitial = await objet.genererStringParametres();

            let rafraichissementOk;
            try {
                rafraichissementOk = await objet.rafraichir(false, false);
            } catch (err) {
                rafraichissementOk = false;
            }

            let resValeur = true;
            let resSection = true;

            if (!rafraichissementOk) {
                if (tests.has('valeur')) {
                    resValeur = false;
                    resultatsUnitaires.push(false);
                }
                if (tests.has('section')) {
                    resSection = false;
                    resultatsUnitaires.push(false);
                }
            } else {
                const executerTest = async (nomTest) => {
                    if (nomTest === 'valeur') {
                        return await objet.genererStringParametres() === stringForumInitial;
                    }
                    if (nomTest === 'section') {
                        try {
                            console.log(`objet.idSection après rafraichissement: ${objet.idSection}`);
                            const sujetsSection = await Utils.recupererSujetsSection(objet.idSection);
                            return sujetsSection.some(s => s.id === objet.idSujet);
                        } catch (err) {
                            return false;
                        }
                    }
                    return false;
                };

                console.log('tests', tests);
                console.log('test valeur:', objet.estModifie === false, objet.estModifie)

                for (const test of tests) {
                    const res = await executerTest(test);
                    if (test === 'valeur') {
                        resValeur = res;
                    } else if (test === 'section') {
                        resSection = res;
                    }
                    resultatsUnitaires.push(res);
                }
            }

            if (!resValeur) {
                if (inCreations) {
                    this.creations = this.creations.filter(o => o !== objet);
                }
                if (inModifications) {
                    this.modifications = this.modifications.filter(m => m.objetForum !== objet);
                }
            }
            if (!resSection) {
                if (inCreations) {
                    this.creations = this.creations.filter(o => o !== objet);
                }
                if (inTransferts) {
                    this.transferts = this.transferts.filter(t => t.objetForum !== objet);
                }
            }
        }

        console.log('resultatsUnitaires:', resultatsUnitaires);

        if (resultatsUnitaires.length === 0) {
            return 'OK';
        }

        const nbSucces = resultatsUnitaires.filter(x => x === true).length;
        const nbEchecs = resultatsUnitaires.filter(x => x === false).length;

        if (nbEchecs === 0) {
            return 'OK';
        } else if (nbSucces === 0) {
            return 'COLLISION_TOTAL';
        } else {
            return 'COLLISION_INCOHERENT';
        }
    }
}
