class ParametreRecensementRecherches extends ParametreObjetForum {
    static VERSION_LOGIQUE = '1.0';
    static FORMAT_HISTORY = [
        { nom: 'Recherches', format: '--- Recherches ---\n(nom): (valeur) | ' }
    ];
    valeur = RECHERCHE.reduce((acc, nom) => {
        acc[nom] = 0;
        return acc;
    }, {});
};