class ParametreCommandeDemandeur extends ParametreObjetForum {
    static VERSION_LOGIQUE = '1.0';
    static TYPE_LIEN = 'joueur';
    static NOM_APPEL = ['Demandeur'];
    static FORMAT_HISTORY = [{ nom: 'Dem', format: '(nom): (valeur) |' }];
    valeur = '';
}
