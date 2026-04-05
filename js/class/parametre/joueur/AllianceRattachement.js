class ParametreJoueurAllianceRattachement extends ParametreObjetForum {
    static VERSION_LOGIQUE = '1.0';
    static TYPE_LIEN = 'alliance';
    static FORMAT_HISTORY = [{ nom: 'Alliance Rattachement', format: '(nom): (valeur) |' }];
    static STRING_RESTRICTION = 'Restreint';
    valeur = '';
}
