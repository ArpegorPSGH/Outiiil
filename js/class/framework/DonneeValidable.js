/**
 * DonneeValidable.js
 * Classe de base pour les données qui nécessitent validation et gestion des restrictions.
 * Contient les méthodes communes de validation (_checkValeur) et d'application de restrictions (_appliquerRestriction).
 */

class DonneeValidable {

    /**
     * Configuration déclarative. Liste des formats historiques du paramètre, du plus ancien au plus récent.
     * Chaque élément est un dictionnaire {'nom': 'Nom du paramètre', 'format': 'template string avec (nom) et (valeur)'}.
     * Ex: { nom: 'Nourriture', format: '--- Ressources ---\n(nom): (valeur) |' }
     * Doit être surchargée dans chaque classe fille.
     * @type {Array<Object>}
     */
    static FORMAT_HISTORY = [];

    /**
     * Chaîne à afficher si l'accès est restreint.
     * Si null, la donnée n'est pas restreinte.
     * Doit être surchargée dans les classes filles si nécessaire.
     * @type {String|null}
     * @protected
     */
    static STRING_RESTRICTION = null;

    /**
     * Configuration déclarative. Indique si la colonne est visible par défaut dans les tableaux.
     * @type {boolean}
     */
    static VISIBLE_PAR_DEFAUT = true;

    /**
     * Configuration déclarative. Indique si la colonne est triable par défaut dans les tableaux.
     * @type {boolean}
     */
    static SORTABLE_PAR_DEFAUT = true;

    /**
     * Configuration déclarative. Indique le type de donnée pour le tri et l'affichage par défaut (ex: 'quantite-grade', 'moment-D MMM YYYY').
     * @type {string|null}
     */
    static TYPE_AFFICHAGE = null;

    /**
     * Configuration déclarative. Indique le type de lien automatique à appliquer lors de l'affichage ('joueur' ou 'alliance').
     * Si null, aucun lien n'est appliqué.
     * @type {string|null}
     */
    static TYPE_LIEN = null;
    
    /**
     * Configuration déclarative. Format d'affichage personnalisé (ex: 'D MMM YYYY').
     * Pour les moments, si null, FORMAT_DATE_DEFAUT est utilisé.
     * @type {string|null}
     */
    static FORMAT_AFFICHAGE = FORMAT_DATE_DEFAUT;

    /**
     * Catégorie de nom, utilisée pour l'appel du paramètre depuis ObjetForum ou ailleurs.
     * @type {String}
     */
    static NOM_APPEL = [];

    /**
     * Historique des noms affichés de la donnée.
     * Le dernier nom de la liste est le nom actuel.
     * @type {Array<String>}
     */
    static NOM_AFFICHAGE = [];

    /**
     * Configuration déclarative. Mapping pour les enums (Objet ou Tableau).
     * Si défini, formaterValeur utilisera ce mapping pour traduire les indices en labels.
     * @type {Object|Array|null}
     */
    static ENUM = null;

    /**
     * Référence à l'instance de l'ObjetForum qui contient cette donnée.
     * @type {ObjetForum|null}
     * @protected
     */
    objetParent = null;

    /**
     * Valeur courante de la donnée.
     * @type {*}
     * @protected
     */
    valeur = null;

    /**
     * Crée une instance "vierge" de la donnée et établit la liaison avec son objet parent.
     * @param {ObjetForum} objetParent - L'instance de l'ObjetForum qui contient cette donnée.
     */
    constructor(objetParent) {
        this.objetParent = objetParent;
    }

    /**
     * Formate la valeur pour l'affichage.
     * @param {*} valeur - La valeur à formater.
     * @returns {String|jQuery|Element} La valeur formatée.
     */
    formaterValeur(valeur) {
        if (valeur === null || valeur === undefined || valeur === '') return '';
        if (valeur instanceof jQuery || valeur instanceof Element) return valeur;

        // Gestion des enums
        if (this.constructor.ENUM) {
            if (Array.isArray(this.constructor.ENUM)) {
                return this.constructor.ENUM[valeur] || valeur;
            } else if (typeof this.constructor.ENUM === 'object') {
                const key = Object.keys(this.constructor.ENUM).find(k => this.constructor.ENUM[k] === valeur);
                return key || valeur;
            }
        }

        // Gestion des moments
        if (moment.isMoment(valeur)) {
            return valeur.format(this.constructor.FORMAT_AFFICHAGE);
        }

        // Par défaut, formatage numérique
        return Utils.formatNombre(valeur);
    }

    /**
     * Obtient le nom d'affichage actuel de la donnée (dernier de la liste).
     * @returns {String} Le nom d'affichage.
     * @static
     */
    static getNomAffichage() {
        const noms = this.NOM_AFFICHAGE;
        if (noms && noms.length > 0) {
            return noms[noms.length - 1];
        } else {
            return this.getDernierNom();
        }
    }

    /**
     * Retourne le dernier nom d'appel du paramètre.
     * Si elle n'est pas définie, fait un fallback pour la compatibilité.
     * @returns {string} Le dernier nom d'appel du paramètre ou le nom d'affichage ou celui du format le plus récent.
     */
    static getDernierNom() {
        if (this.NOM_APPEL && this.NOM_APPEL.length > 0) {
            return this.NOM_APPEL[this.NOM_APPEL.length - 1];
        }
        if (this.FORMAT_HISTORY.length === 0) {
            return this.getNomAffichage();
        }
        return this.FORMAT_HISTORY[this.FORMAT_HISTORY.length - 1].nom;
    }

    /**
     * Valide et caste une valeur par rapport à la valeur actuelle.
     * @param {any} valeurAValider - La valeur à valider.
     * @returns {{success: boolean, value: any}} - Le résultat de l'opération.
     * @private
     */
    _checkValeur(valeurAValider) {
        console.log(`[${this.constructor.name}] valeurAValider`, valeurAValider);
        if (this.valeur === null || this.valeur === undefined) {
            console.error(`[${this.constructor.name}] La valeur actuelle est nulle, impossible de valider le type.`);
            return { success: false };
        }

        if (valeurAValider === null || valeurAValider === undefined) {
            console.error(`[${this.constructor.name}] La valeur à valider est nulle, impossible de valider le type.`);
            return { success: false };
        }

        // Détection spéciale pour les objets moment
        const estMomentActuel = moment.isMoment(this.valeur);
        const estMomentAValider = moment.isMoment(valeurAValider);

        // Si la valeur actuelle est un moment, gérer spécifiquement
        if (estMomentActuel) {
            let valeurCastee;
            if (estMomentAValider) {
                // Déjà un moment, on le garde tel quel
                valeurCastee = valeurAValider;
            } else if (typeof valeurAValider === 'string') {
                // Convertir depuis une chaîne ISO (format de sérialisation)
                valeurCastee = moment(valeurAValider);
                if (!valeurCastee.isValid()) {
                    console.error(`[${this.constructor.name}] Échec de la conversion de "${valeurAValider}" en moment valide.`);
                    return { success: false };
                }
            } else {
                console.error(`[${this.constructor.name}] Type incompatible pour un moment: ${typeof valeurAValider}.`);
                return { success: false };
            }
            return { success: true, value: valeurCastee };
        }

        const typeContenantActuel = Array.isArray(this.valeur) ? 'array' : (typeof this.valeur === 'object' && this.valeur !== null) ? 'object' : 'primitive';
        const typeContenantAValider = Array.isArray(valeurAValider) ? 'array' : (typeof valeurAValider === 'object' && valeurAValider !== null) ? 'object' : 'primitive';

        if (typeContenantActuel !== typeContenantAValider) {
            console.error(`[${this.constructor.name}] Le type de contenant ne correspond pas: attendu ${typeContenantActuel}, reçu ${typeContenantAValider}.`);
            return { success: false };
        }

        if (typeContenantActuel === 'primitive') {
            const typeCible = typeof this.valeur;
            let valeurCastee;
            switch (typeCible) {
                case 'number':
                    valeurCastee = Number(valeurAValider);
                    if (isNaN(valeurCastee)) {
                        console.error(`[${this.constructor.name}] Échec du casting de "${valeurAValider}" en nombre.`);
                        return { success: false };
                    }
                    break;
                case 'boolean':
                    const strVal = String(valeurAValider).toLowerCase();
                    if (strVal === 'true' || strVal === '1' || valeurAValider === true) valeurCastee = true;
                    else if (strVal === 'false' || strVal === '0' || valeurAValider === false) valeurCastee = false;
                    else {
                        console.error(`[${this.constructor.name}] Échec du casting de "${valeurAValider}" en booléen.`);
                        return { success: false };
                    }
                    break;
                default:
                    valeurCastee = String(valeurAValider);
            }
            return { success: true, value: valeurCastee };
        }

        if (typeContenantActuel === 'array') {
            if (this.valeur.length === 0) {
                console.error(`[${this.constructor.name}] La liste actuelle est vide, impossible de valider le type des éléments.`);
                return { success: false };
            }
            const resultatListe = [];
            for (const element of valeurAValider) {
                const checkResult = this._checkValeur.call({ valeur: this.valeur[0] }, element);
                if (!checkResult.success) {
                    console.error(`[${this.constructor.name}] Échec du casting de l'élément "${element}" de la liste.`);
                    return { success: false };
                }
                resultatListe.push(checkResult.value);
            }
            return { success: true, value: resultatListe };
        }

        if (typeContenantActuel === 'object') {
            // Si c'est une instance de classe (autre que Object), on vérifie simplement la classe
            if (this.valeur.constructor && this.valeur.constructor !== Object) {
                if (valeurAValider instanceof this.valeur.constructor) {
                    return { success: true, value: valeurAValider };
                }
                console.error(`[${this.constructor.name}] Type de classe incompatible: attendu ${this.valeur.constructor.name}, reçu ${valeurAValider?.constructor?.name || typeof valeurAValider}.`);
                return { success: false };
            }

            for (const cle in this.valeur) {
                if (!valeurAValider.hasOwnProperty(cle)) {
                    console.error(`[${this.constructor.name}] La clé attendue "${cle}" est manquante dans la valeur validée.`);
                    return { success: false };
                }
            }
            const resultatDict = {};
            for (const cle in valeurAValider) {
                if (!this.valeur.hasOwnProperty(cle)) {
                    console.error(`[${this.constructor.name}] La clé "${cle}" n'est pas attendue dans le dictionnaire.`);
                    return { success: false };
                }
                const checkResult = this._checkValeur.call({ valeur: this.valeur[cle] }, valeurAValider[cle]);
                if (!checkResult.success) return { success: false };
                resultatDict[cle] = checkResult.value;
            }
            return { success: true, value: resultatDict };
        }
        return { success: false };
    }

    /**
     * Applique récursivement la restriction sur une valeur.
     * @param {*} valeur - La valeur sur laquelle appliquer la restriction.
     * @returns {*} La valeur avec les restrictions appliquées.
     * @private
     */
    _appliquerRestriction(valeur) {
        // Détection spéciale pour les objets moment ou autres instances de classes
        if (typeof moment !== 'undefined' && moment.isMoment(valeur)) {
            return this.constructor.STRING_RESTRICTION;
        }

        const typeContenant = Array.isArray(valeur) ? 'array' : (typeof valeur === 'object' && valeur !== null) ? 'object' : 'primitive';
        if (typeContenant === 'primitive') {
            return this.constructor.STRING_RESTRICTION;
        }
        if (typeContenant === 'array') {
            return valeur.map(v => this._appliquerRestriction(v));
        }
        if (typeContenant === 'object') {
            // Si c'est une instance de classe (autre que Object), on vérifie simplement la classe
            if (valeur.constructor && valeur.constructor !== Object) {
                return this.constructor.STRING_RESTRICTION;
            }

            const res = {};
            for (const key in valeur) {
                res[key] = this._appliquerRestriction(valeur[key]);
            }
            return res;
        }
    }
}
