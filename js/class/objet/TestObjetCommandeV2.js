Utils.register(class TestObjetForumCommandeV2 extends ObjetForum {
    static VERSION_LOGIQUE = '2.0';
    static CLASSES_PARAMETRES = [[TestParametreQuantite, TestParametreCoordonnees], [TestParametreQuantite, TestParametreCoordonnees, TestParametreStatut]];
    static LOCATION_HISTORY = [{'section': 'Données Test SDC', 'lieu': 'titre'}, {'section': 'Données Test SDC V2', 'lieu': 'titre'}];

    async completerChargementPourVersionsAnterieures() {
        let versionActuelle = this._determinerVersionChargee();
        const versionCible = this.constructor.CLASSES_PARAMETRES.length - 1;

        // Boucle tant que nous n'avons pas atteint la dernière version
        while (versionActuelle < versionCible && versionActuelle !== -1) {
            switch (versionActuelle) {
                case 0:
                    // Logique pour migrer de la v0 à la v1
                    console.log('Migration de v0 à v1...');
                    // La valeur de TestParametreQuantite (nom 'Quantité') est utilisée pour calculer et peupler TestParametreQuantite (nom 'NouvelleQuantite')
                    await this.ecrireParametre('NouvelleQuantite', await this.lireParametre('Quantité') * 2);
                    // La valeur de TestParametreCoordonnees est copiée vers TestParametreCoordonnees
                    await this.ecrireParametre('Coordonnées', await this.lireParametre('Coordonnées'));
                    // TestParametreStatut est initialisé avec une valeur par défaut
                    await this.ecrireParametre('Statut', 'Nouveau');
                    break;
            }
            
            // Incrémenter la version pour la prochaine itération de la boucle
            versionActuelle++; 
        }
    }
})
