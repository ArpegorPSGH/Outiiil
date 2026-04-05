class ParametreJoueurPseudo extends ParametreObjetForum {
    static VERSION_LOGIQUE = '1.0';
    static TYPE_LIEN = 'joueur';
    static FORMAT_HISTORY = [{ nom: 'Pseudo', format: '(nom): (valeur) |' }];
    valeur = '';
}
