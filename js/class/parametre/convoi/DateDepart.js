class DateDepart extends ParametreObjetForum {
    static TYPE_AFFICHAGE = 'moment-D MMM [à] HH[h]mm';
    static VERSION_LOGIQUE = '1.0';
    static FORMAT_HISTORY = [{ nom: 'Date Départ', format: '(nom): (valeur) |' }];
    static STRING_RESTRICTION = 'Restreint';
    valeur = moment();
}
