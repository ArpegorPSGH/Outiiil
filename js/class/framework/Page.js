class Page {
    /**
     * Configuration déclarative. Liste unifiée contenant des références de méthodes 
     * (fonctionnalités locales) et des classes `FonctionnaliteAlliance`.
     * L'ordre de cette liste dicte l'ordre d'exécution.
     * @type {Array<Function|typeof FonctionnaliteAlliance>}
     * @protected
     */
    static FONCTIONNALITES = [];

    /**
     * Orchestre l'initialisation séquentielle de toutes les fonctionnalités déclarées 
     * dans la liste statique `FONCTIONNALITES`.
     * @returns {Promise<void>}
     */
    async init() {
        const versionsPresentes = await gestionnaireVersions.verifierPresenceSectionVersions();
        if (versionsPresentes) {
            await gestionnaireVersions.rafraichir();
        }

        for (const item of this.constructor.FONCTIONNALITES) {
            if (item.prototype instanceof FonctionnaliteAlliance) {
                if (versionsPresentes) {
                    console.log('item fonctionnalite ', item)
                    const instance = new item(this);
                    await instance.init();
                }
            } else if (typeof item === 'function') {
                await item.call(this);
            }
        }
    }

    /**
     * Vérifie si le joueur est un administrateur Fourmizzz sur la page actuelle.
     * A surcharger dans les classes filles avec le moyen de le déterminer.
     * @returns {boolean}
     */
    estAdminFourmizzz() {
        return false;
    }
}
