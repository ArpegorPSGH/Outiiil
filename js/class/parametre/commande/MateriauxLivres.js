class MateriauxLivres extends ParametreObjetForum {
    static VERSION_LOGIQUE = '1.0';
    static NOM_APPEL = ['Matériaux Livrés'];
    static FORMAT_HISTORY = [{ nom: 'MatLiv', format: '(nom): (valeur) |' }];
    static STRING_RESTRICTION = 'Restreint';
    static NOM_AFFICHAGE = [`Qté Livrée ${IMG_MAT}`];
    valeur = 0;
}
