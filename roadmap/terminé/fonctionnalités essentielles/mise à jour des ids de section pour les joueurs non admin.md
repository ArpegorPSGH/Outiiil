# Mise à jour des ids de section pour les joueurs non admin

## Objectifs
Permettre aux joueurs n'ayant pas l'accès au forum caché de pouvoir récupérer les ids des sections de façon automatique.

## Fonctionnement Détaillé
- Rajouter dans le chargement complémentaire de Joueur un appel ajax à la page membres et en extraire la valeur du rang du joueur (s'inspirer de la logique d'extraction du pseudo)
- Créer un attribut joueur 'Droits Fourmizzz', sous la forme d'un dictionnaire avec les clés 'Voir Candidatures',	'Gérer Candidatures',	'Envoyer Messages Collectif',	'Gérer Diplomatie',	'Voir les forums cachés',	'Voir les forums restreints',	'Administrer le forum',	"Administrer l'alliance"	
- Le charger dans le chargement complémentaire en faisant un appel ajax à la page "http://s4.fourmizzz.fr/alliance.php?Options" pour récupérer les droits liés au rang du joueur
- Rajouter une entrée au dictionnaire formatLieux des objets pour préciser la visibilité, pouvant prendre les valeurs 'caché', 'restreint', 'visible'
- Intégrer cette entrée à la liste des sections à gérer (qui devient une liste de dictionnaires), ainsi que si la section est la plus récente (dernière) de l'objet, car désormais toutes les sections sont mises dans la liste
- La fonction de mise en place du SdC sur la page forum devra prendre en compte cette valeur pour définir la visibilité de chaque section, et ne créer que la plus récente pour chaque objet
- Si jamais une même section est présente en plusieurs exemplaires dans la liste, avec des visibilités différentes, alors pour celles liées à un même objet, ne considérer que la visibilité la plus récente, et s'il reste encore plusieurs visibilités différentes (plusieurs objets utilisant la même section), alors considérer la visibilité la plus restrictive (caché > restreint > visible).
- Créer un gestionnaire de sections sur le modèle de celui de versions, qui stockera chaque section (par son nom) et son id dans le titre d'un sujet d'une section du forum, sous la forme d'un dictionnaire JSON
- Ajouter la section du gestionnaire à la liste des sections à gérer de la même manière que pour le gestionnaire de versions
- Lors du chargement d'une page, dans le main, une fonction chargerSections du gestionnaire sera appelée
- Cette fonction reprendra ce qui est actuellement fait sur la page Forum pour la mise à jour des ids, sauf que les données ne seront pas directement mises dans le profilUtilisateur, mais stockées en interne dans un dictionnaire créé à partir de la liste des sections à gérer. Si une section n'est pas trouvée, il faut vérifier si le joueur (profilJoueur) a bien les droits pour la voir. Si ce n'est pas le cas, alors il faut laisser l'entrée correspondante vide, mais s'il a les droits, il faut mettre une valeur signifiant que la section n'existe pas. Si le joueur a les droits d'administrateur forum, vérifier que la visibilité effective de chaque section correspond à celle considérée dans Outiiil, et si ce n'est pas le cas, la modifier.
- Ensuite, la fonction appellera une autre fonction du gestionnaire, synchroniser, qui chargera depuis la section des ids de section du forum (si l'id de cette section est vide ou marqué comme n'existant pas, et qu'il est donc impossible d'y accéder, sauter la synchronisation) toutes les sections disponibles avec leur id. Pour chaque section dont l'id est connu en interne et diffère de celui sur le forum, mettre à jour le forum. Pour chaque section en interne qui n'existe pas, vider l'id du forum. Pour chaque section en interne dont l'id est inconnu, le récupérer à partir du forum (même s'il est vide). Si une section interne n'a pas de sujet correspondant sur le forum, le créer, avec la valeur de l'id de section interne s'il est connu, sinon avec un id vide.
- Pour finir, la fonction chargerSections mettra à jour le profilUtilisateur avec les ids récupérés (pour un id vide ou une section n'existant pas, l'id est vidé)
- Si une modification des ids du profilUtilisateur est faite, afficher un popup de notification (sur la base de ce qui est fait sur la page Forum actuellement)
- La fonction de mise à jour des ids sur le forum sera supprimée
- estAdminFourmizzz sera supprimée pour être remplacée par l'utilisation de la clé pertinente de 'Droit Fourmizzz'

## Plan d'Implémentation

### Étape 1 : Récupération du Rang et des Droits du Joueur (Classe `Joueur`)
1. **Création et Initialisation de l'attribut `DroitsFourmizzz` :**
   - Créer le fichier `js/class/attribut/joueur/DroitsFourmizzz.js` héritant de `AttributObjet`.
   - Initialiser sa propriété `valeur` avec l'ensemble des 8 clés suivantes positionnées à `false` :
     ```javascript
     valeur = {
         'Voir Candidatures': false,
         'Gérer Candidatures': false,
         'Envoyer Messages Collectif': false,
         'Gérer Diplomatie': false,
         'Voir les forums cachés': false,
         'Voir les forums restreints': false,
         'Administrer le forum': false,
         "Administrer l'alliance": false
     };
     ```
   - Importer et déclarer ce nouvel attribut dans `Joueur.ATTRIBUTS_OBJET` dans `Joueur.js`.
2. **Chargement Complémentaire de l'utilisateur courant :**
   - Dans `Joueur.js`, au sein de `completerRafraichissement()`, si `await this.estJoueurCourant()` est vrai, appeler successivement `this.chargerRang()` puis `this.chargerDroitsFourmizzz()`.
   - Implémenter la fonction `chargerRang()` :
     - Effectuer un appel AJAX vers `alliance.php?Membres` (en utilisant `Utils.serveur`).
     - Trouver la ligne (`tr`) du tableau des membres correspondant au pseudo du joueur (`await this.lire('Pseudo')`).
     - Extraire la valeur textuelle du rang dans la colonne "Rang" de cette ligne et mettre à jour l'attribut `Rang` du joueur via `await this.ecrire('Rang', rangExtrait)`.
   - Implémenter la fonction `chargerDroitsFourmizzz()` :
     - Effectuer un appel AJAX à `alliance.php?Options`.
     - **Parsing Robuste des Droits :**
       - Cibler le tableau des rangs dans `#AffichageRang table`.
       - Lire la ligne d'en-tête (`tr`) pour identifier dynamiquement la correspondance entre les indices de colonne et les droits Outiiil. Scanner le texte de chaque cellule d'en-tête et le lier aux clés (ex. `"Voir les forums cachés"` -> `'Voir les forums cachés'`). Cela évite de se fier aux numéros fixes des colonnes (en tenant compte de la visibilité variable des première et dernière colonnes).
       - Trouver la ligne (`tr`) représentant le rang du joueur : identifier le `tr` dont le premier `td` textuel (contenant un `strong`) est un exact match (ou un match exact après trim) pour le nom du rang du joueur connecté (précédemment récupéré via `chargerRang()` et stocké dans l'attribut `Rang`). Ne pas se fier au pseudo dans le sous-titre du rang car il peut être erroné.
       - Parcourir les colonnes de cette ligne de permissions. Si le `td` à l'index de colonne correspondant à un droit contient une image (comme `images/OK.gif` ou `img` avec `alt="ok"` / `title="ok"`), positionner ce droit à `true` dans le dictionnaire, sinon à `false`.
       - Enregistrer ce dictionnaire dans l'attribut `Droits Fourmizzz` via `await this.ecrire('Droits Fourmizzz', dictionnaireDroits)`.

### Étape 2 : Visibilité des Sections dans `LOCATION_HISTORY` et Gestion Globale
1. **Enrichissement de `LOCATION_HISTORY` :**
   - Rajouter le champ `visibilite` (pouvant prendre les valeurs `'caché'`, `'restreint'`, ou `'visible'`) dans l'historique des lieux des objets (`LOCATION_HISTORY`).
2. **Construction et Dé-doublonnage de la Liste Globale (`main.js`) :**
   - Modifier la constitution de la liste globale dans `js/main.js` pour ajouter **toutes** les sections de l'historique de lieux (`LOCATION_HISTORY`) de chaque objet (et non plus seulement la dernière).
   - Lors de ce parcours, effectuer le dé-doublonnage à la volée de manière robuste pour produire une liste finale de dictionnaires `{ nom, visibilite, estDerniere }` (le champ `objetSource` n'étant pas utile dans la structure finale) :
     - Pour un même objet : si la section apparaît plusieurs fois dans son historique avec des visibilités différentes, ne conserver que la visibilité de l'entrée la plus récente.
     - Pour des objets différents : si une section est partagée par plusieurs objets, résoudre le conflit de visibilité en appliquant la visibilité la plus restrictive (`'caché' > 'restreint' > 'visible'`).
     - Conserver l'information `estDerniere` (vrai si la section est la plus récente/dernière dans l'historique de l'objet d'origine).

### Étape 3 : Création du `GestionnaireSections`
1. **Définition de `GestionnaireSections` (`js/class/framework/GestionnaireSections.js`) :**
   - Créer une classe autonome `GestionnaireSections` (sans héritage d'`ObjetForum`, calquée sur `GestionnaireVersions`).
   - Déclarer son historique de stockage (cible la section `Sections Outiiil` en mode `titre`).
   - Enregistrer le nom de sa propre section de stockage dans la liste globale des sections à gérer.
2. **Structure et Remplissage Interne :**
   - Initialiser en interne un dictionnaire JavaScript simple `this.idsSections = {}` pour associer chaque section à son ID (ex: `{ 'Section A': '12345', 'Section B': 'inexistant', 'Section C': '' }`).
3. **Implémentation de `chargerSections()` :**
   - Parcourir l'HTML de la page Forum pour extraire les IDs des sections présentes dans le DOM et remplir `this.idsSections`.
   - **Gestion des sections manquantes/non trouvées :**
     - Si le joueur n'a pas les droits requis pour la voir (vérification de `'Voir les forums cachés'` ou `'Voir les forums restreints'` de son attribut `Droits Fourmizzz` selon la visibilité théorique de la section) : laisser l'entrée vide `""` (id inconnu).
     - Si le joueur a les droits mais que la section n'existe pas dans le DOM : stocker la valeur spécifique `'inexistant'`.
   - **Vérification d'Administration :**
     - Si le joueur a le droit `'Administrer le forum'` : vérifier si la visibilité réelle sur le forum correspond à la visibilité théorique de la section. Si incohérente, appeler `AccesForum.modifierSection(idCat, nomSection, typeCategorie)` pour forcer la bonne catégorie (`"cache"`, `"restreint"` ou `"visible"`).
   - Appeler `this.synchroniser()`.
   - **Mise à jour de `monProfilUtilisateur` :**
     - Parcourir `this.idsSections` : si l'ID est `'inexistant'` ou vide `""`, enregistrer une chaîne vide `""` dans `monProfilUtilisateur.parametre[nomSection].valeur`. Sinon, enregistrer l'ID extrait.
     - Si des modifications ont été apportées aux valeurs de `monProfilUtilisateur`, appeler `.sauvegarde()` sur les paramètres modifiés et afficher un popup toast de notification.
4. **Implémentation de `synchroniser()` :**
   - Charger les sujets de la section de stockage des IDs sur le forum (si l'ID de cette section est vide ou `'inexistant'`, sauter la synchronisation).
   - Décoder le dictionnaire JSON des sections stocké sur le forum (`{"nom": "...", "id": "..."}`). Un ID absent ou vide `""` sur le forum est considéré comme inconnu.
   - Effectuer la synchronisation :
     - Pour chaque section avec un ID interne connu qui diffère de celui du forum : mettre à jour le forum.
     - Pour chaque section marquée interne `'inexistant'` : effacer son ID sur le forum.
     - Pour chaque section avec un ID interne vide/inconnu : récupérer l'ID depuis le forum (qu'il soit défini ou vide).
     - Si une section interne n'a pas de sujet sur le forum : le créer (avec l'ID interne s'il est connu, sinon vide).

### Étape 4 : Adaptation de la Création des Sections du SdC (Classe `AdministrerForum`)
1. **Création avec Visibilité Spécifiée :**
   - Lors de la création des sections via le bouton "Préparer le forum pour un SDC", ne créer que la section la plus récente pour chaque objet (toutes les sections avec la clé `'estDerniere'` à `true`).
   - Lors de la création ou de la mise à jour d'une section via `AccesForum.creerSectionEtRetournerId()` et `AccesForum.modifierSection()` :
     - Déterminer la visibilité théorique associée de la section.
     - Convertir cette visibilité (`'caché'` -> `"cache"`, `'restreint'` -> `"restreint"`, `'visible'` -> `"visible"`) et la passer à la fonction de création/modification afin de configurer directement la bonne visibilité sur Fourmizzz.

### Étape 5 : Nettoyage et Remplacement de `estAdminFourmizzz`
1. **Nettoyage de `Forum.js` :**
   - Supprimer la fonction locale `majIdsSections()`.
   - Retirer `this.prototype.majIdsSections` de `FONCTIONNALITES`.
2. **Suppression de `estAdminFourmizzz` :**
   - Supprimer toutes les occurrences locales de `estAdminFourmizzz()`.
   - Remplacer ces vérifications par des requêtes directes sur la clé correspondante du dictionnaire de l'attribut `Droits Fourmizzz` de `monProfilJoueur` (ex : `'Administrer le forum'` ou `"Administrer l'alliance"`).

### Étape 6 : Séquencement d'Initialisation (`main.js`)
- Dans `js/main.js`, s'assurer de respecter l'ordre d'appel suivant :
  1. Charger les données du joueur connecté : `await monProfilJoueur.chargerJoueurCourant();` (ce qui récupère également son rang et ses droits).
  2. Charger et synchroniser les sections : `window.gestionnaireSections = new GestionnaireSections(); await gestionnaireSections.chargerSections();`
  3. Rafraîchir le gestionnaire de versions : `window.gestionnaireVersions = new GestionnaireVersions(); await gestionnaireVersions.rafraichir();`

## Tests à effectuer
- S'assurer que le popup ne s'affiche que qaund il le doit dans tous les tests
- Vérifier qu'au chargement de la page, le rang du joueur courant est bien récupéré
- Vérifier que les droits du joueur sont correctement formatés et complétés
- Tester la création de sections Outiiil visibles, restreintes et cachées
- Vérifier format section ids
- Tester récupération des ids de section corrects lorsque (supprimer objet section à chaque fois) :
    - Toutes les sections sont trouvées
    - Une section visible n'est pas trouvée
    - Une section restreinte n'est pas trouvée et le joueur a les droits
    - Une section restreinte n'est pas trouvée et le joueur n'a pas les droits
    - Une section cachée n'est pas trouvée et le joueur a les droits
    - Une section cachée n'est pas trouvée et le joueur n'a pas les droits
- Tester le cas où un objet a dans son historique de lieux plusieurs fois la même section avec des visibilités différentes (restreint/visible)
- Tester le cas où plusieurs objets ont dans leur historique de lieux la même section avec des visibilités identiques
- Tester le cas où plusieurs objets ont dans leur historique de lieux la même section avec des visibilités différentes (caché/restreint)
- Tester le cas où plusieurs objets ont dans leur historique de lieux plusieurs fois la même section avec des visibilités différentes (caché/restreint/visible)
- Tester le changement de visibilité d'une section existante via une nouvelle entrée de l'historique de lieux
- Tester section ids section introuvable et le joueur a les droits
- Tester section ids section introuvable et le joueur n'a pas les droits
- Tester ids récupérés dans le profilUtilisateur lorsque la synchronisation ne se fait pas pour un joueur avec droits partiels (mélange de sections récupérées et non récupérées)
- Tester mise à jour id forum si différent de celui interne
- Tester suppression section du forum implique bien le vidage de l'id du forum
- Tester récupération d'id inconnu à partir du forum quand l'id y est défini
- Tester récupération d'id inconnu à partir du forum quand l'id y est vide
- Tester création sujet section quand la section est connue
- Tester création sujet section quand la section est inconnue ou n'existe pas
- Tester que les droits d'administration forum et alliance sont bien pris en compte
- Tester liste des sections de la boîte quand un objet utilise plusieurs sections différentes dans son historique de lieux

## Avancement
- Rang du joueur correctement chargé
- Droits du joueur correctement formatés et chargés
- Création de sections visibles, restreintes et cachées validé
- Format section Ids correct
- Récupération des ids correcte lorsque toutes les sections sont visibles
- Récupération des ids correcte lorsqu'une section visible n'est pas trouvée
- Récupération des ids correcte lorsqu'une section restreinte n'est pas trouvée et que le joueur a les droits
- Récupération des ids correcte lorsqu'une section restreinte n'est pas trouvée et le joueur n'a pas les droits
- Récupération des ids correcte lorsqu'une section cachée n'est pas trouvée et le joueur a les droits
- Récupération des ids correcte lorsqu'une section cachée n'est pas trouvée et le joueur n'a pas les droits
- Cas où un objet a dans son historique de lieux plusieurs fois la même section avec des visibilités différentes validé
- Cas où plusieurs objets ont dans leur historique de lieux la même section avec des visibilités identiques validé
- Cas où plusieurs objets ont dans leur historique de lieux la même section avec des visibilités différentes validé
- Cas où plusieurs objets ont dans leur historique de lieux plusieurs fois la même section avec des visibilités différentes validé
- Changement de visibilité d'une section existante via une nouvelle entrée de l'historique de lieux validé
- Cas où la section ids est introuvable et que le joueur a les droits validé
- Cas où la section ids est introuvable et que le joueur n'a pas les droits validé
- Cas ids récupérés dans le profilUtilisateur lorsque la synchronisation ne se fait pas pour un joueur avec droits partiels validé
- Mise à jour id forum si différent de celui interne validé
- Suppression section du forum implique le vidage de l'id du forum validé
- Récupération d'id inconnu à partir du forum quand l'id y est défini validé
- Récupération d'id inconnu à partir du forum quand l'id y est vide validé
- Création sujet section quand la section est connue validé
- Création sujet section quand la section est inconnue ou n'existe pas validé
- Droits d'administration forum et alliance pris en compte
- Liste des sections de la boîte quand un objet utilise plusieurs sections différentes dans son historique de lieux validé