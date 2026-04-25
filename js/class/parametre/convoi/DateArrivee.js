class DateArrivee extends ParametreObjetForum {
    static TYPE_AFFICHAGE = 'moment-D MMM [à] HH[h]mm';
    static VERSION_LOGIQUE = '1.0';
    static FORMAT_HISTORY = [{ nom: 'Date Arrivée', format: '(nom): (valeur) |' }];
    static STRING_RESTRICTION = 'Restreint';
    valeur = moment(); // Date stored as ISO string or legacy format string? Using string for now to match 'Retour le ...'
}
