class Page {
    /**
     * Critères de correspondance pour activer cette page.
     * Peut être une String (hrefContains), un Object { href, search }, ou un Array d'entre eux.
     * @type {String|Object|Array}
     */
    static URIs = null;

    /**
     * Le constructeur de Page agit comme une fabrique polymorphe :
     * Si appelé via "new Page()", il retourne une instance de la sous-classe appropriée.
     */
    constructor() {
        if (this.constructor === Page) {
            const ClasseAppropriee = Page.detecterClassePage();
            if (ClasseAppropriee) {
                return new ClasseAppropriee();
            }
        }
    }

    /**
     * Parcourt le registre des pages pour trouver celle qui correspond à l'URL actuelle.
     * @returns {typeof Page|null}
     */
    static detecterClassePage() {
        if (!registreClasses || !registreClasses.Page) return null;
        for (const [nom, Classe] of registreClasses.Page) {
            if (Classe.estSurPage()) {
                return Classe;
            }
        }
        return null;
    }

    /**
     * Vérifie si l'on se trouve sur la page correspondante à la classe.
     * Logique générique basée sur la propriété statique URIs.
     * @returns {boolean}
     */
    static estSurPage() {
        const uris = this.URIs;
        if (!uris) return false;

        const checkMatch = (criterion) => {
            if (typeof criterion === 'string') {
                return location.href.includes(criterion);
            } else if (typeof criterion === 'object' && criterion !== null) {
                const hrefMatch = criterion.href ? location.href.includes(criterion.href) : true;
                const searchMatch = criterion.search !== undefined ? location.search === criterion.search : true;
                return hrefMatch && searchMatch;
            }
            return false;
        };

        if (Array.isArray(uris)) {
            return uris.some(checkMatch);
        }
        return checkMatch(uris);
    }

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

        for (const item of this.constructor.FONCTIONNALITES) {
            if (item.prototype instanceof FonctionnaliteAlliance) {
                console.log('item fonctionnalite ', item)
                const instance = new item(this);
                await instance.init();
            } else if (typeof item === 'function') {
                await item.call(this);
            }
        }
    }
}
