Utils.register(class TestFonctionnaliteSDC extends FonctionnaliteAlliance {
    static ABREVIATIONS_HISTORY = ['sdc'];

    async run() {
        console.log('TEST: Début rafraîchissement...');
        const commandes = await this.chargerObjetForumsMultiples(TestObjetForumCommandeV2);
        await commandes[0].rafraichir();
        console.log('TEST: Fin rafraîchissement.');
    }
})
