class ParametreRecensementUnites extends ParametreObjetForum {
    static VERSION_LOGIQUE = '1.0';
    static FORMAT_HISTORY = [
        { nom: 'Unités', format: '(nom): (valeur) |' }
    ];
    valeur = NOM_UNITES.reduce((acc, nom) => {
        acc[nom] = 0;
        return acc;
    }, {});
};
