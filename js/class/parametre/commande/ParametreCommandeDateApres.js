class ParametreCommandeDateApres extends ParametreObjetForum {
    static VERSION_LOGIQUE = '1.0';
    static NOM_APPEL = ['Date Après'];
    static FORMAT_HISTORY = [{ nom: 'DateApr', format: '(nom): (valeur) | ' }];
    valeur = moment(); // Date stored as string DD MMM YYYY
}
