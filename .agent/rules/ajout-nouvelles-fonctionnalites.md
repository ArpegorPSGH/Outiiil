---
trigger: always_on
---

# 1 Fonctionnalités n'utilisant pas de données stockées sur le forum

Pour ajouter une fonctionnalité qui ne persiste pas de données sur le forum :
- Implémentez la logique dans une classe héritant de `Page` qui sera utilisée sur la page souhaitée.
- Ajoutez le point d'entrée (méthode) de cette fonctionnalité à la liste statique `FONCTIONNALITES_LOCALES` de la classe `Page` correspondante.

# 2 Fonctionnalités utilisant des données stockées sur le forum

Pour ajouter ou modifier une fonctionnalité d'alliance, un objet ou un paramètre qui utilise des données stockées sur le forum :
- **Fonctionnalité :** Créez une classe héritant de `FonctionnaliteAlliance`. Définissez son historique d'abréviations via la propriété statique `FonctionnaliteAlliance.ABREVIATIONS_HISTORY`.
    - Ajoutez cette classe à la liste statique `FONCTIONNALITES_ALLIANCE` de la classe `Page` correspondante.
- **Objet :** Créez une classe héritant de `ObjetForum`.
    - Définissez sa version logique via `ObjetForum.VERSION_LOGIQUE`.
    - Spécifiez l'historique de ses lieux de stockage via `ObjetForum.LOCATION_HISTORY`.
    - Déclarez les attributs de l'instance via `ObjetForum.ATTRIBUTS_OBJET`. Ces attributs (héritant de `AttributObjet`) permettent de gérer des données calculées ou non persistées directement comme paramètres sur le forum. Pour les objets complexes, utilisez une fonction factory.
    - Déclarez les classes de paramètres qu'il utilise pour chaque version via `ObjetForum.CLASSES_PARAMETRES`.
    - Si l'objet contient d'autres `ObjetForum`, spécifiez la classe du sous-objet via `ObjetForum.classeObjetsForumContenus`.
- **Paramètre / Attribut :** Créez une classe héritant de `ParametreObjetForum` ou `AttributObjet`.
    - Définissez son historique de noms / formats via `FORMAT_HISTORY` (pour les paramètres) ou `NOM_AFFICHAGE` (pour les attributs). Chaque élément est un objet de la forme `{ nom: 'NomDuParam', format: 'un string contenant '(nom)' et '(valeur)'' }` pour les paramètres, ou simplement une chaîne pour les attributs.
    - Pour un paramètre, définissez sa version logique via `ParametreObjetForum.VERSION_LOGIQUE`.
    - Si le paramètre a des restrictions d'affichage, définissez `STRING_RESTRICTION`.
    - La valeur par défaut doit être initialisée directement dans la déclaration de la classe fille (ex: `valeur = 0;`). La valeur peut être un type primitif, une liste ou un dictionnaire.
    - Pour un attribut calculé, surchargez la méthode `calculerValeur(peutVoirDonneesRestreintes)`.

# 3 Ajout d'une Nouvelle Classe de Page

Pour créer une nouvelle classe de page :
- Créez une classe héritant de `Page`.
- Définissez les fonctionnalités d'alliance spécifiques à cette page en ajoutant les classes `FonctionnaliteAlliance` à la liste statique `Page.FONCTIONNALITES_ALLIANCE`.
- Implémentez les fonctionnalités locales dans la classe.
- Définissez les fonctionnalités locales spécifiques à cette page en ajoutant les méthodes à la liste statique `Page.FONCTIONNALITES_LOCALES`.
- Enregistrez la nouvelle classe de page dans l'objet `window` avec `Utils.register()`.