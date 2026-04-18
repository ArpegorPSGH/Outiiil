Utils.register(class TestObjetForumCommande extends ObjetForum {
    static VERSION_LOGIQUE = '1.0'
    static PARAMETRES_OBJET = [[TestParametreQuantite, TestParametreCoordonnees]];
    static LOCATION_HISTORY = [{ section: 'Données Test SDC', lieu: 'titre' }];
    static classeObjetsForumContenus = TestObjetForumLigneCommande;
})
