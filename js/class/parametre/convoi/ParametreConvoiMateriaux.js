class ParametreConvoiMateriaux extends ParametreObjetForum {
    static TYPE_AFFICHAGE = 'quantite-grade';
    static VERSION_LOGIQUE = '1.0';
    static FORMAT_HISTORY = [{ nom: 'Matériaux', format: '(nom): (valeur) |' }];
    static STRING_RESTRICTION = 'Restreint';
    static NOM_AFFICHAGE = [`Qté ${IMG_MAT}`];
    valeur = 0;
}
