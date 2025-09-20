Utils.register(class TestFonctionnaliteSDC extends FonctionnaliteAlliance {
    static ABREVIATIONS_HISTORY = ['sdc'];

    async run() {
        console.log('TEST: Début test SDC Joueur.js');
        await this._testJoueurSDC();
        console.log('TEST: Fin test SDC Joueur.js');
    }

    async _testJoueurSDC() {
        try {
            // === 1. Création et Enregistrement ===
            console.log('TEST Joueur: Création et enregistrement...');
            const joueurInitial = new Joueur(this, { donneesInitiales: { 'pseudo': 'ewan706', 'rang': 'TestRang' } });
            await joueurInitial.enregistrerSurForum();
            const idSujetCree = joueurInitial.idSujet;
            console.log(`TEST Joueur: Joueur créé et enregistré avec idSujet: ${idSujetCree}`);
            if (!idSujetCree) {
                throw new Error("La création du sujet pour le joueur a échoué.");
            }

            // === 2. Chargement et Vérification ===
            console.log('TEST Joueur: Chargement et vérification...');
            const joueursCharges = await this.chargerObjetForumsMultiples(Joueur);
            const joueurCharge = joueursCharges.find(j => j.idSujet === idSujetCree);
            if (!joueurCharge) {
                throw new Error(`Le joueur avec l'idSujet ${idSujetCree} n'a pas été trouvé après chargement.`);
            }
            console.log('TEST Joueur: Joueur chargé:', joueurCharge);

            const pseudoCharge = await joueurCharge.lireParametre('pseudo');
            const rangCharge = await joueurCharge.lireParametre('rang');

            if (pseudoCharge !== 'ewan706' || rangCharge !== 'TestRang') {
                throw new Error(`Vérification échouée. Pseudo: ${pseudoCharge}, Rang: ${rangCharge}`);
            }
            console.log('TEST Joueur: Vérification initiale réussie.');

            // === 3. Modification et Enregistrement ===
            console.log('TEST Joueur: Modification et enregistrement...');
            await joueurCharge.ecrireParametre('rang', 'NouveauRangTest');
            await joueurCharge.enregistrerSurForum();
            console.log('TEST Joueur: Modification enregistrée.');

            // === 4. Rechargement et Vérification Finale ===
            console.log('TEST Joueur: Rechargement et vérification finale...');
            const joueursRecharges = await this.chargerObjetForumsMultiples(Joueur);
            const joueurRecharge = joueursRecharges.find(j => j.idSujet === idSujetCree);
            if (!joueurRecharge) {
                throw new Error(`Le joueur avec l'idSujet ${idSujetCree} n'a pas été trouvé après le rechargement.`);
            }

            const rangModifie = await joueurRecharge.lireParametre('rang');
            if (rangModifie !== 'NouveauRangTest') {
                throw new Error(`Vérification de la modification échouée. Rang: ${rangModifie}`);
            }
            console.log('TEST Joueur: Vérification finale réussie.');

            console.log('%cTEST Joueur: Succès du cycle complet de création, écriture, enregistrement, chargement et lecture.', 'color: green; font-weight: bold;');

        } catch (error) {
            console.error('%cTEST Joueur: Échec du test de la classe Joueur.', 'color: red; font-weight: bold;', error);
        }
    }
})
