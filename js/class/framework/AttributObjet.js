/**
 * AttributObjet.js
 * Classe mère pour les attributs d'un ObjetForum.
 * Encapsule le nom affiché, la valeur courante et la méthode de calcul.
 */

class AttributObjet extends DonneeValidable {

    /**
    * Chaîne à afficher si l'accès est restreint.
    * Doit être surchargée dans les classes filles si nécessaire.
    * @type {String|null}
    * @protected
    */
    static STRING_RESTRICTION = 'Restreint';

    /**
     * Obtient la valeur de l'attribut.
     * Si l'attribut est calculé (calculerValeur surchargé), appelle la méthode de calcul sécurisé.
     * Sinon, retourne directement la valeur stockée.
     * @param {Boolean} [peutVoirDonneesRestreintes=true] - Si l'utilisateur peut voir les données restreintes.
     * @returns {Promise<*>} La valeur de l'attribut.
     */
    async obtenirValeur(peutVoirDonneesRestreintes = true) {
        if (this._estCalcule()) {
            return await this._invoquerCalculSecurise(peutVoirDonneesRestreintes);
        }
        return this.valeur;
    }

    /**
     * Vérifie si l'attribut est calculé en détectant si calculerValeur a été surchargé.
     * @returns {Boolean} Vrai si calculerValeur a été surchargé.
     * @private
     */
    _estCalcule() {
        return this.calculerValeur !== AttributObjet.prototype.calculerValeur;
    }

    /**
     * Méthode de calcul de la valeur de l'attribut.
     * À surcharger dans les classes filles pour les attributs calculés.
     * @param {Boolean} peutVoirDonneesRestreintes - Si l'utilisateur peut voir les données restreintes.
     * @returns {Promise<*>} La valeur calculée.
     * @protected
     */
    async calculerValeur(peutVoirDonneesRestreintes) {
        return this.valeur;
    }

    /**
     * Invoque de manière sécurisée la méthode de calcul d'un attribut.
     * Gère les erreurs de restriction (dues à des paramètres restreints) et les valeurs incalculables.
     * Si une ErreurRestriction est attrapée, applique récursivement la restriction sur error.donnees.
     * @param {Boolean} peutVoirDonneesRestreintes - Si l'utilisateur peut voir les données restreintes.
     * @returns {Promise<*>} La valeur calculée, ou une chaîne indiquant une restriction ou une erreur.
     * @private
     */
    async _invoquerCalculSecurise(peutVoirDonneesRestreintes) {
        try {
            const resultat = await this.calculerValeur(peutVoirDonneesRestreintes);
            // Sécurité supplémentaire : si le calcul produit NaN, null ou undefined sans planter, on le gère aussi.
            if (Number.isNaN(resultat) || resultat === null || typeof resultat === 'undefined') {
                return '<i>Incalculable</i>';
            }
            return resultat;
        } catch (error) {
            // Ne capturer que les erreurs de restriction, relancer les autres
            if (error instanceof ErreurRestriction) {
                // Les paramètres sous-jacents sont restreints
                // Appliquer récursivement la restriction sur error.donnees
                console.warn(`[${this.constructor.name}] Le calcul a échoué à cause de données restreintes : ${error.message}`);
                return this._appliquerRestriction(this.valeur);
            }
            // Relancer toutes les autres erreurs
            throw error;
        }
    }

    /**
     * Modifie la valeur de l'attribut avec validation du type.
     * Bloque la modification si l'attribut est calculé.
     * @param {*} nouvelleValeur - La nouvelle valeur à assigner.
     * @returns {Boolean} True si la modification a réussi, false sinon.
     */
    modifierValeur(nouvelleValeur) {
        if (this._estCalcule()) {
            console.error(`[${this.constructor.name}] Impossible de modifier un attribut calculé.`);
            return false;
        }
        const checkResult = this._checkValeur(nouvelleValeur);
        if (!checkResult.success) {
            console.error(`[${this.constructor.name}] La nouvelle valeur n'est pas valide.`);
            return false;
        }
        this.valeur = checkResult.value;
        return true;
    }
}
