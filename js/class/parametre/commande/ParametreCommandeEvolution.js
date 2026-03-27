class ParametreCommandeEvolution extends ParametreObjetForum {
    static VISIBLE_PAR_DEFAUT = false;
    static VERSION_LOGIQUE = '1.0';
    static NOM_APPEL = ['Évolution'];
    static FORMAT_HISTORY = [{ nom: 'Évo', format: '(nom): (valeur) | ' }];
    static STRING_RESTRICTION = 'Restreint';
    valeur = '';
}
