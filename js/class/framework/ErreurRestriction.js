/**
 * Erreur personnalisée pour signaler un accès restreint à une ou plusieurs données.
 * Elle transporte les données qui ont pu être lues avant la restriction.
 */
class ErreurRestriction extends Error {
    constructor(message, donnees = {}) {
        super(message);
        this.name = 'ErreurRestriction';
        this.donnees = donnees;
    }
}