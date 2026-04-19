class DateCommande extends ParametreObjetForum {
    static VISIBLE_PAR_DEFAUT = false;
    static TYPE_AFFICHAGE = 'moment-D MMM YYYY';
    static VERSION_LOGIQUE = '1.0';
    static NOM_APPEL = ['Date Commande'];
    static FORMAT_HISTORY = [{ nom: 'DateCmd', format: '(nom): (valeur) |' }];
    valeur = moment();
}
