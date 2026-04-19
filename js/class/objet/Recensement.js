/**
 * Classe pour créer et gérer un recensement, conforme au framework ObjetForum.
 * Un recensement est un message sur le forum associé à un sujet de joueur.
 *
 * @class Recensement
 * @extends {ObjetForum}
 */
Utils.register(class Recensement extends ObjetForum {
    static VERSION_LOGIQUE = '1.0';
    static LOCATION_HISTORY = [{ section: 'Membres Outiiil', lieu: 'message' }]; // Un recensement est toujours un message
    static SEPARATEUR_PARAMETRES = '\n'; // Chaque paramètre sur une nouvelle ligne
    static PARAMETRES_OBJET = [
        [
            Ressources,
            Constructions,
            Recherches,
            Unites
        ]
    ];
});