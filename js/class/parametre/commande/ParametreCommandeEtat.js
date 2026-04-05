class ParametreCommandeEtat extends ParametreObjetForum {
    static VERSION_LOGIQUE = '1.0';
    static FORMAT_HISTORY = [{ nom: 'État', format: '(nom): (valeur) |' }];
    valeur = ETAT_COMMANDE['Nouvelle'];
}
