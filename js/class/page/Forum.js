/*
 * Forum.js
 * Hraesvelg
 **********************************************************************/

/**
 * Classe de fonction pour la page /alliance.php?forum_menu.
 *
 * @class Forum
 * @extends {Page}
 */
Utils.register(class Forum extends Page {
    static URIs = { href: "/alliance.php?forum_menu" };

    /**
     * Liste unifiée des fonctionnalités à exécuter sur la page Forum.
     * @type {Array<Function|typeof FonctionnaliteAlliance>}
     */
    static FONCTIONNALITES = [
        AdministrerForum,
        AdministrerCommandes
    ];

    constructor() {
        super();
        /**
        * liste des joueurs.
        */
        this._monAlliance = null;
    }

    get alliance() {
        return this._monAlliance;
    }

    set alliance(newAlliance) {
        this._monAlliance = newAlliance;
    }

    /**
     * Initialisation spécifique au forum :
     * lance init() native, puis installe un MutationObserver pour réévaluer 
     * le chargement des sections Ajax.
     */
    async init() {
        // Exécution initiale du framework
        await super.init();

        // Récupération des données du forum pour communiquer (mutation observer)
        // Utile parce que l'arborescence Ajax (clic sur une catégorie) remplace 
        // une partie de #alliance ou de l'intérieur de #alliance.
        let observer = new MutationObserver(async (mutationsList) => {
            // Lors d'une mutation, on réexécute init() simplifié (ou majIdsSections + les fonctionnalités admin)
            // Pour être propre avec le framework, on peut simplement rejouer les fonctionnalités.
            // On s'assure de ne pas boucler avec l'observer.
            observer.disconnect();
            await super.init();
            observer.observe($("#alliance")[0], { childList: true });
        });
        if ($("#alliance").length) {
            observer.observe($("#alliance")[0], { childList: true });
        }
    }
});
