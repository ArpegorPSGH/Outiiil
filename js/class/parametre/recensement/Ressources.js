class Ressources extends ParametreObjetForum {
    static VERSION_LOGIQUE = '1.0';
    static FORMAT_HISTORY = [
        { nom: 'Ressources', format: '(nom): (valeur) |' }
    ];
    valeur = {
        'Nourriture': 0,
        'Matériaux': 0,
        'Terrain de Chasse': 0
    };
};