class DateSouhaite extends ParametreObjetForum {
    static TYPE_AFFICHAGE = 'moment-D MMM YYYY';
    static FORMAT_AFFICHAGE = 'D MMM YYYY';
    static VERSION_LOGIQUE = '1.0';
    static NOM_APPEL = ['Date Souhaitée'];
    static FORMAT_HISTORY = [{ nom: 'DateSouh', format: '(nom): (valeur) |' }];
    valeur = moment(); // Date stored as string DD MMM YYYY
}
