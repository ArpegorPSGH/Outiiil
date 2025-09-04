class Page {
    /**
     * Configuration déclarative. Liste des classes de FonctionnaliteAlliance à lancer.
     * @type {Array<typeof FonctionnaliteAlliance>}
     * @protected
     */
    static FONCTIONNALITES_ALLIANCE = [];

    /**
     * Configuration déclarative. Liste des méthodes de la classe fille à exécuter.
     * @type {Array<Function>}
     * @protected
     */
    static FONCTIONNALITES_LOCALES = [];

    /**
     * Orchestre l'initialisation de toutes les fonctionnalités (d'alliance et locales)
     * déclarées dans les attributs de la classe en garantissant que l'état global du
     * framework est présent.
     * @returns {Promise<void>}
     */
    async init() {
        // 1. Construction de l'État Global
        // await initialiserFrameworkGlobal();

                
        console.log(`[${this.constructor.name}] Appel de gestionnaireVersions.verifierPresenceSectionVersions().`);
        if (await gestionnaireVersions.verifierPresenceSectionVersions()) {
            // 2. Rafraîchissement du GestionnaireVersions
            await gestionnaireVersions.rafraichir();

            // 3. Initialisation des Fonctionnalités d'Alliance
            for (const ClasseFonctionnalite of this.constructor.FONCTIONNALITES_ALLIANCE) {
                const instance = new ClasseFonctionnalite(this);
                await instance.init();
            }
        }

        // 4. Lancement des Fonctionnalités Locales
        for (const fonctionLocale of this.constructor.FONCTIONNALITES_LOCALES) {
            fonctionLocale.call(this);
        }
    }
}
