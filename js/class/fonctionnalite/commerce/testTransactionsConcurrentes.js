Utils.register(class testTransactionsConcurrentes extends FonctionnaliteAlliance {
    static ABREVIATIONS_HISTORY = ['TTC'];

    /**
     * Point d'entrée principal de la fonctionnalité.
     */
    async run() {
        // Charger toutes les commandes via le framework
        await this.executerTransaction(async () => {
            this.commandes = await this.chargerObjetsForum(Commande, true);
        })

        let commandeOriginale = this.commandes[0];
        let commandeCopie = new Commande(this);
        commandeCopie.ecrire(commandeOriginale.lire());
        commandeCopie.idSection = structuredClone(commandeOriginale.idSection); // copie profonde
        commandeCopie.idSujet = structuredClone(commandeOriginale.idSujet);// copie profonde

        this.executerTransaction(async () => {
            await commandeOriginale.ecrire('Matériaux Demandés', 5);
            await commandeOriginale.enregistrerSurForum();
        })

        await Utils.sleep(500);

        await this.executerTransaction(async () => {
            await commandeCopie.transferer(50908);
        })
    }
});