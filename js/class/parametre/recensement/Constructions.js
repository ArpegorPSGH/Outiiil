class ParametreRecensementConstructions extends ParametreObjetForum {
    static VERSION_LOGIQUE = '1.0';
    static FORMAT_HISTORY = [
        { nom: 'Constructions', format: '--- Constructions ---\n(nom): (valeur) | ' }
    ];
    valeur = CONSTRUCTION.reduce((acc, nom) => {
        acc[nom] = 0;
        return acc;
    }, {});
};