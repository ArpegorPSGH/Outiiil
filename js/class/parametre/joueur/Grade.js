class ParametreJoueurGrade extends ParametreObjetForum {
    static VISIBLE_PAR_DEFAUT = true;
    static SORTABLE_PAR_DEFAUT = false;
    static VERSION_LOGIQUE = '1.0';
    static FORMAT_HISTORY = [{ nom: 'Grade', format: '(nom): (valeur) |' }];
    static STRING_RESTRICTION = 'Restreint';
    valeur = '';
}
