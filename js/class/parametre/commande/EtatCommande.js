class EtatCommande extends ParametreObjetForum {
    static ENUM = ETAT_COMMANDE;
    static VERSION_LOGIQUE = '1.0';
    static FORMAT_HISTORY = [{ nom: 'État', format: '(nom): (valeur) |' }];
    valeur = ETAT_COMMANDE['Nouvelle'];
}
