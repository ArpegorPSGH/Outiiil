class ParametreCommandeNourritureLivree extends ParametreObjetForum {
    static VERSION_LOGIQUE = '1.0';
    static NOM_APPEL = ['Nourriture Livrée'];
    static FORMAT_HISTORY = [{ nom: 'NouLiv', format: '(nom): (valeur) | ' }];
    static STRING_RESTRICTION = 'Restreint';
    static NOM_AFFICHAGE = [`Qté Livrée ${IMG_POMME}`];
    valeur = 0;
}
