class Transaction {

    constructor() {
        this.creations = [];
        this.modifications = [];
        this.transferts = [];
        this.suppressions = [];
        this.rollbacking = false;
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

        const existe = this.suppressions.some(o => o === objetForum);
        if (!existe) {
            this.suppressions.push(objetForum);
        }
    }

    /**
     * Annule toutes les modifications enregistrées.
     */
    async annuler() {
        this.rollbacking = true;

        console.warn('modifications:', this.modifications);
        console.warn('suppressions:', this.suppressions);
        console.warn('transferts:', this.transferts);
        console.warn('creations:', this.creations);

        // 1. Suppressions (Recréations) dans l'ordre inverse
        const suppressionsInverse = [...this.suppressions].reverse();
        for (const objet of suppressionsInverse) {
            try {
                const formatLieu = objet.constructor.LOCATION_HISTORY[objet.constructor.LOCATION_HISTORY.length - 1];
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
}
