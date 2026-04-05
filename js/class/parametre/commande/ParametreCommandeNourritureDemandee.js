class ParametreCommandeNourritureDemandee extends ParametreObjetForum {
    static VISIBLE_PAR_DEFAUT = false;
    static TYPE_AFFICHAGE = 'quantite-grade';
    static VERSION_LOGIQUE = '1.0';
    static NOM_APPEL = ['Nourriture Demandée'];
    static FORMAT_HISTORY = [{ nom: 'NouDem', format: '(nom): (valeur) |' }];
    static STRING_RESTRICTION = 'Restreint';
    static NOM_AFFICHAGE = [`Qté Demandée ${IMG_POMME}`];
    valeur = 0;
}
