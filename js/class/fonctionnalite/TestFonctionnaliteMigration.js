class ParametreAncien extends ParametreObjetForum {
    static FORMAT_HISTORY = [{ nom: 'AncienParam', format: '(nom): (valeur) | ' }];
    valeur = '';
}

class ParametreNouveau extends ParametreObjetForum {
    static FORMAT_HISTORY = [{ nom: 'AncienParam', format: '(nom): (valeur) | ' }];
    valeur = ['test']; // La nouvelle version attend une liste

    async _migrerValeur(valeurChargee) {
        // Si la valeur chargée n'est pas un tableau, on la met dans un tableau.
        if (!Array.isArray(valeurChargee)) {
            return [valeurChargee];
        }
        return valeurChargee;
    }
}

class ParametreRestreint extends ParametreObjetForum {
    static FORMAT_HISTORY = [{ nom: 'Restreint', format: '(nom): (valeur) | ' }];
    static STRING_RESTRICTION = 'ACCES REFUSE';
    valeur = ['secret1', 'secret2'];
}

class ParametreNouveauDict extends ParametreObjetForum {
    static FORMAT_HISTORY = [{ nom: 'AncienParam', format: '(nom): (valeur) | ' }];
    valeur = { cle: 'test' }; // La nouvelle version attend un dictionnaire

    async _migrerValeur(valeurChargee) {
        // Si la valeur chargée est une primitive, on la place dans la clé par défaut du dictionnaire.
        if (typeof valeurChargee !== 'object' || Array.isArray(valeurChargee) || valeurChargee === null) {
            return { cle: valeurChargee };
        }
        return valeurChargee;
    }
}

class ParametreRestreintDict extends ParametreObjetForum {
    static FORMAT_HISTORY = [{ nom: 'Restreint', format: '(nom): (valeur) | ' }];
    static STRING_RESTRICTION = 'ACCES REFUSE';
    valeur = { secret: 'valeur' };
}

// Nouveaux paramètres et objets pour le test de migration d'ObjetForum
class ParametreAncienObjetForum extends ParametreObjetForum {
    static FORMAT_HISTORY = [{ nom: 'AncienParamObjetForum', format: '(nom): (valeur) | ' }];
    valeur = 'valeur ancienne';
}

class ParametreNouveauObjetForum extends ParametreObjetForum {
    static FORMAT_HISTORY = [{ nom: 'AncienParamObjetForum', format: '(nom): (valeur) | ' }];
    valeur = ['valeur initiale']; // La nouvelle version attend une liste

    async _migrerValeur(valeurChargee) {
        if (!Array.isArray(valeurChargee)) {
            return [valeurChargee];
        }
        return valeurChargee;
    }
}

class ObjetForumAncien extends ObjetForum {
    static CLASSES_PARAMETRES = [[ParametreAncienObjetForum]];
    static LOCATION_HISTORY = [{ section: 'Membres Outiiil', lieu: 'titre' }];
}

class ObjetForumNouveau extends ObjetForum {
    static CLASSES_PARAMETRES = [[ParametreNouveauObjetForum]];
    static LOCATION_HISTORY = [{ section: 'Membres Outiiil', lieu: 'titre' }];

    async completerChargementPourVersionsAnterieures() {
        // Pour ce test, la migration est gérée au niveau du paramètre.
        // Si une logique de migration au niveau de l'objet était nécessaire, elle serait ici.
    }
}

Utils.register(class TestFonctionnaliteMigration extends FonctionnaliteAlliance {
    static ABREVIATIONS_HISTORY = ['TEST_MIGRATION'];

    async run() {
        await this._testerMigrationReussie();
        await this._testerLectureRestreinte();
        await this._testerEcritureInvalide();
        await this._testerMigrationReussieDict();
        await this._testerLectureRestreinteDict();
        await this._testerEcritureInvalideDict();
        await this._testerMigrationObjetForumReussie();
    }

    async _testerMigrationReussie() {
        console.log("Début du test de migration réussie vers LISTE...");
        const paramAncien = new ParametreAncien(this);
        await paramAncien.Ecrire('valeur primitive');
        const chaineEnregistree = await paramAncien.genererStringPourEnregistrement();
        const paramNouveau = new ParametreNouveau(this);
        const succesChargement = await paramNouveau.chargerDepuisString(chaineEnregistree);
        const valeurFinale = await paramNouveau.Lire();
        if (succesChargement && Array.isArray(valeurFinale) && valeurFinale[0] === 'valeur primitive') {
            console.log("%cTest de migration réussie LISTE réussi.", "color: green; font-weight: bold;");
        } else {
            console.error("%cTest de migration réussie LISTE échoué.", "color: red; font-weight: bold;");
        }
    }

    async _testerLectureRestreinte() {
        console.log("\nDébut du test de lecture restreinte sur une liste...");
        const paramRestreint = new ParametreRestreint(this);
        const valeurLue = await paramRestreint.Lire(false); // Lecture sans droits

        console.log("Valeur lue (sans droits):", valeurLue);
        
        const attendu = ['ACCES REFUSE', 'ACCES REFUSE'];
        if (Array.isArray(valeurLue) && valeurLue.length === 2 && valeurLue[0] === 'ACCES REFUSE' && valeurLue[1] === 'ACCES REFUSE') {
            console.log("%cTest de lecture restreinte réussi.", "color: green; font-weight: bold;");
        } else {
            console.error("%cTest de lecture restreinte échoué. Attendu:", attendu, "Reçu:", valeurLue);
        }
    }

    async _testerEcritureInvalide() {
        console.log("\nDébut du test d'écriture invalide (primitive sur type array)...");
        const paramNouveau = new ParametreNouveau(this);
        const valeurInitiale = await paramNouveau.Lire();
        const succesEcriture = await paramNouveau.Ecrire('valeur primitive invalide');
        const valeurFinale = await paramNouveau.Lire();

        console.log("Tentative d'écriture d'une primitive a-t-elle réussi ?", succesEcriture);
        console.log("Valeur finale du paramètre :", valeurFinale);

        if (!succesEcriture && JSON.stringify(valeurInitiale) === JSON.stringify(valeurFinale)) {
            console.log("%cTest d'écriture invalide réussi : L'écriture a été refusée et la valeur n'a pas changé.", "color: green; font-weight: bold;");
        } else {
            console.error("%cTest d'écriture invalide échoué.", "color: red; font-weight: bold;");
        }
    }

    // Surcharge pour simplifier le test, pas besoin de vérifier les droits ou la présence du membre pour ce test unitaire.
    async verifierVersionSuffisanteEtPresenceSections() { return true; }
    async verifierPresenceSujetMembre() { return true; }
    async verifierDroitInit() { return true; }

    async _testerMigrationReussieDict() {
        console.log("\nDébut du test de migration réussie vers DICT...");
        const paramAncien = new ParametreAncien(this);
        await paramAncien.Ecrire('valeur primitive');
        const chaineEnregistree = await paramAncien.genererStringPourEnregistrement();
        const paramNouveau = new ParametreNouveauDict(this);
        const succesChargement = await paramNouveau.chargerDepuisString(chaineEnregistree);
        const valeurFinale = await paramNouveau.Lire();
        if (succesChargement && typeof valeurFinale === 'object' && !Array.isArray(valeurFinale) && valeurFinale.cle === 'valeur primitive') {
            console.log("%cTest de migration réussie DICT réussi.", "color: green; font-weight: bold;");
        } else {
            console.error("%cTest de migration réussie DICT échoué.", "color: red; font-weight: bold;");
        }
    }

    async _testerLectureRestreinteDict() {
        console.log("\nDébut du test de lecture restreinte sur un DICT...");
        const paramRestreint = new ParametreRestreintDict(this);
        const valeurLue = await paramRestreint.Lire(false); // Lecture sans droits
        const attendu = { secret: 'ACCES REFUSE' };
        if (typeof valeurLue === 'object' && !Array.isArray(valeurLue) && valeurLue.secret === 'ACCES REFUSE') {
            console.log("%cTest de lecture restreinte DICT réussi.", "color: green; font-weight: bold;");
        } else {
            console.error("%cTest de lecture restreinte DICT échoué. Attendu:", attendu, "Reçu:", valeurLue);
        }
    }

    async _testerEcritureInvalideDict() {
        console.log("\nDébut des tests d'écriture invalide sur type DICT...");
        const paramNouveau = new ParametreNouveauDict(this);
        const valeurInitiale = await paramNouveau.Lire();
        let testsReussis = true;

        // Test 1: Écriture d'une primitive
        console.log("  - Test 1: Écriture d'une primitive...");
        let succesEcriture = await paramNouveau.Ecrire('valeur primitive invalide');
        let valeurFinale = await paramNouveau.Lire();
        if (succesEcriture || JSON.stringify(valeurInitiale) !== JSON.stringify(valeurFinale)) {
            console.error("    %cÉchec du test 1: L'écriture d'une primitive aurait dû échouer.", "color: red;");
            testsReussis = false;
        }

        // Test 2: Dictionnaire avec une clé manquante
        console.log("  - Test 2: Dictionnaire avec clé manquante...");
        succesEcriture = await paramNouveau.Ecrire({ cleManquante: 'valeur' });
        valeurFinale = await paramNouveau.Lire();
        if (succesEcriture || JSON.stringify(valeurInitiale) !== JSON.stringify(valeurFinale)) {
            console.error("    %cÉchec du test 2: L'écriture avec une clé manquante aurait dû échouer.", "color: red;");
            testsReussis = false;
        }

        // Test 3: Dictionnaire avec une clé en trop
        console.log("  - Test 3: Dictionnaire avec clé en trop...");
        succesEcriture = await paramNouveau.Ecrire({ cle: 'valeur ok', cleEnTrop: 'pas ok' });
        valeurFinale = await paramNouveau.Lire();
        if (succesEcriture || JSON.stringify(valeurInitiale) !== JSON.stringify(valeurFinale)) {
            console.error("    %cÉchec du test 3: L'écriture avec une clé en trop aurait dû échouer.", "color: red;");
            testsReussis = false;
        }

        if (testsReussis) {
            console.log("%cTests d'écriture invalide DICT réussis : Toutes les écritures invalides ont été refusées.", "color: green; font-weight: bold;");
        } else {
            console.error("%cTests d'écriture invalide DICT échoués.", "color: red; font-weight: bold;");
        }
    }

    async _testerMigrationObjetForumReussie() {
        console.log("\nDébut du test de migration réussie d'ObjetForum (enregistrement réel, 1ère migration, rechargement, 2ème migration)...");

        try {
            // Étape 1: Créer et enregistrer un ObjetForumAncien sur le forum réel
            console.log("  - Création et enregistrement de l'ObjetForumAncien sur le forum...");
            const objetAncien = new ObjetForumAncien(this);
            await objetAncien.ecrireParametre('AncienParamObjetForum', 'valeur ancienne');
            await objetAncien.enregistrerSurForum(); // Utilise pageForum.creerSujetEtRetournerId

            if (!objetAncien.idSujet) {
                console.error("%cÉchec: L'ObjetForumAncien n'a pas pu être enregistré sur le forum (idSujet est null).", "color: red;");
                throw new Error("Échec de l'enregistrement initial sur le forum.");
            }
            console.log("    ObjetForumAncien enregistré avec succès. ID Sujet:", objetAncien.idSujet);
            
            await Utils.sleep(10000)

            // Étape 2: Charger avec ObjetForumNouveau (migration)
            console.log("  - 1er chargement avec ObjetForumNouveau (migration attendue)...");
            const objetNouveau1 = new ObjetForumNouveau(this);
            objetNouveau1.idSujet = objetAncien.idSujet; // Lier au sujet réel
            const succesChargement1 = await objetNouveau1.rafraichir(); // Utilise pageForum.consulterSujetAvecMessagesEtIds
            const valeurApresMigration1 = await objetNouveau1.lireParametre('AncienParamObjetForum');

            if (succesChargement1 && Array.isArray(valeurApresMigration1) && valeurApresMigration1[0] === 'valeur ancienne') {
                console.log("    1ère migration réussie. Valeur:", valeurApresMigration1);
            } else {
                console.error("    %cÉchec de la 1ère migration. Attendu: ['valeur ancienne'], Reçu:", "color: red;", valeurApresMigration1);
                throw new Error("Échec de la 1ère migration.");
            }

        } catch (error) {
            console.error("%cTest de migration réussie d'ObjetForum a rencontré une erreur inattendue.", "color: red; font-weight: bold;", error);
        } 
    }
})
