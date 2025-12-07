# Gestion des joueurs hébergés à l'extérieur

## Objectifs
Afin de pouvoir maintenir en permanence le système de répartition des ressources, les données des joueurs doivent être récupérées même s'ils sont temporairement hébergés à l'extérieur.

## Fonctionnement Détaillé
- Au chargement de la page membres de l’alliance, si un joueur dans la section Outiil_Membre n’est pas dans le tableau, aller récupérer ses données dans la BDD et l’ajouter au tableau avec son Tag d'alliance à côté de son pseudo et le traiter exactement comme les autres joueurs

## Plan d'Implémentation

1.  **Modification de `PageAlliance.traitementMembre()` :**
    *   Conserver la logique actuelle de récupération des joueurs du tableau HTML dans `tmpJoueurs` et l'assignation à `this._alliance.joueurs`.
    *   Après l'appel à `this._utilitaire.chargerJoueur(data)` (qui peuple `this._utilitaire.alliance.joueurs` avec les données du SDC), appeler une nouvelle méthode `_fusionnerJoueursUtilitaire()`.

2.  **Création d'une nouvelle méthode `PageAlliance._fusionnerJoueursUtilitaire()` :**
    *   Cette méthode sera responsable de la fusion des joueurs.
    *   Elle itérera sur `this._utilitaire.alliance.joueurs`.
    *   Pour chaque `joueurUtilitaire` dans `this._utilitaire.alliance.joueurs` :
        *   Si `this._alliance.joueurs` ne contient pas de joueur avec le même pseudo que `joueurUtilitaire.pseudo` (c'est-à-dire, le joueur est hébergé à l'extérieur et n'est pas sur la page Fourmizzz actuelle) :
            *   Créer un nouvel objet `Joueur` en utilisant les données de `joueurUtilitaire` (qui proviennent du SDC).
            *   Ajouter ce nouvel objet `Joueur` à `this._alliance.joueurs`.
            *   Marquer ce joueur comme `estExterieur: true` (ou une propriété similaire) pour un traitement spécifique lors de l'affichage.

3.  **Modification de `PageAlliance.traitementUtilitaire()` :**
    *   Cette méthode est appelée après la fusion et est responsable de l'enrichissement du tableau HTML.
    *   Actuellement, elle met à jour les joueurs existants. Il faudra étendre sa logique.
    *   Après la boucle qui met à jour les joueurs existants (`for(let pseudo in this._utilitaire.alliance.joueurs)`), ajouter une nouvelle boucle.
    *   Cette nouvelle boucle itérera sur `this._alliance.joueurs`.
    *   Pour chaque `joueur` dans `this._alliance.joueurs` qui est marqué comme `estExterieur: true` :
        *   Appeler une nouvelle méthode privée `_creerLigneJoueurExterieur(joueur)` pour générer le HTML de la ligne du tableau.
        *   Insérer cette ligne dans le tableau `$("#tabMembresAlliance")` à l'endroit approprié (par exemple, avant le `<tfoot>`).

4.  **Création d'une nouvelle méthode `PageAlliance._creerLigneJoueurExterieur(joueur)` :**
    *   Cette méthode prendra un objet `Joueur` (celui marqué `estExterieur: true`).
    *   Elle construira une chaîne HTML représentant une ligne `<tr>` complète pour ce joueur.
    *   Les cellules devront inclure :
        *   Un espace pour le bouton d'actualisation (peut-être vide ou un placeholder si non pertinent pour les joueurs extérieurs).
        *   Le pseudo du joueur avec son tag d'alliance (si `joueur.alliance` est différent de `Utils.alliance`). Le tag d'alliance devra être récupéré depuis l'objet `Joueur` du SDC.
        *   Le grade du joueur.
        *   Le terrain, la technologie, la fourmilière (affichés comme N/C si non disponibles ou -1).
        *   Les colonnes Tdt et Retour (affichées comme N/C si `x` ou `y` sont -1).
        *   Le bouton de modification de grade (`images/crayon.gif`) si l'utilisateur a les droits d'administration et que le joueur est connu de l'utilitaire.

5.  **Mise à jour de `PageAlliance.actualiserMembre()` :**
    *   Cette méthode devra être revue pour s'assurer qu'elle gère correctement la recréation ou la mise à jour des lignes des joueurs hébergés à l'extérieur après une actualisation. La logique de `_fusionnerJoueursUtilitaire` et `_creerLigneJoueurExterieur` devra être réutilisée ou adaptée.

6.  **Mise à jour de `PageAlliance.tableau()` et `PageAlliance.tableauUtilitaire()` :**
    *   S'assurer que l'ajout dynamique de lignes ne perturbe pas le tri et la pagination de DataTables. Il faudra peut-être appeler `DataTable().row.add()` pour chaque nouvelle ligne plutôt que d'ajouter directement le HTML, puis redessiner le tableau. Cela garantira que DataTables gère correctement les nouvelles données.

7.  **Récupération du Tag d'Alliance pour les joueurs extérieurs :**
    *   L'objet `Joueur` du SDC (`this._utilitaire.alliance.joueurs[pseudo]`) devrait contenir le tag de l'alliance du joueur. Il faudra s'assurer que cette information est bien disponible et utilisée lors de la création de la ligne HTML. Si l'objet `Joueur` ne contient pas directement le tag de l'alliance, il faudra voir comment le `PageForum` le gère ou si une propriété `allianceTag` doit être ajoutée à l'objet `Joueur` lors de son chargement depuis le SDC.

## Tests à effectuer

1.  **Test d'affichage initial :**
    *   **Scénario :** Un joueur est hébergé à l'extérieur et est connu dans l'utilitaire, mais n'est pas dans le tableau HTML de la page `/alliance.php`.
    *   **Attendu :** Au chargement de la page, le joueur hébergé à l'extérieur apparaît dans le tableau des membres de l'alliance, avec son pseudo et son tag d'alliance (si différent de l'alliance courante). Ses informations (grade, technologie, fourmilière, etc.) sont affichées.

2.  **Test de modification des données (avec droits admin) :**
    *   **Scénario :** L'utilisateur a les droits d'administration. Un joueur hébergé à l'extérieur est affiché dans le tableau.
    *   **Attendu :** Un bouton ou un lien permet de modifier le grade et d'autres informations du joueur hébergé à l'extérieur. La modification est prise en compte et persistée via l'utilitaire.

3.  **Test de modification des données (sans droits admin) :**
    *   **Scénario :** L'utilisateur n'a pas les droits d'administration. Un joueur hébergé à l'extérieur est affiché dans le tableau.
    *   **Attendu :** Aucun bouton ou lien de modification n'est visible pour le joueur hébergé à l'extérieur.

4.  **Test de l'actualisation de l'alliance :**
    *   **Scénario :** Un joueur hébergé à l'extérieur est affiché. Ses coordonnées sont initialement inconnues. L'utilisateur clique sur "Actualiser l'alliance".
    *   **Attendu :** Si le profil du joueur est récupérable, ses coordonnées sont mises à jour et les temps de trajet/retour sont affichés correctement.

5.  **Test de la persistance des données :**
    *   **Scénario :** Un joueur hébergé à l'extérieur est ajouté au tableau. La page est rechargée.
    *   **Attendu :** Le joueur hébergé à l'extérieur est toujours présent dans le tableau avec ses informations.

6.  **Test de performance :**
    *   **Scénario :** Un grand nombre de joueurs hébergés à l'extérieur sont connus dans l'utilitaire.
    *   **Attendu :** L'ajout et l'affichage de ces joueurs ne dégradent pas significativement les performances de la page.

7.  **Test de cas limite (joueur inconnu de l'utilitaire) :**
    *   **Scénario :** Un joueur est dans le tableau HTML de la page, mais n'est pas connu de l'utilitaire.
    *   **Attendu :** Ce joueur n'est pas affecté par la logique des joueurs hébergés à l'extérieur.

8.  **Test de l'intégration DataTables :**
    *   **Scénario :** Le tableau contient des joueurs de l'alliance et des joueurs hébergés à l'extérieur.
    *   **Attendu :** Le tri, la recherche et la pagination de DataTables fonctionnent correctement pour tous les joueurs du tableau.

## Avancement
- Ajout des propriétés `estExterieur` et `allianceTag` à la classe `Joueur`.
- Modification de `PageAlliance.traitementMembre()` pour appeler `_fusionnerJoueursUtilitaire()` après le chargement des données de l'utilitaire.
- Implémentation de la méthode `_fusionnerJoueursUtilitaire()` pour fusionner les joueurs de l'utilitaire avec les joueurs de l'alliance, en marquant les joueurs extérieurs.
- Modification de `PageAlliance.traitementUtilitaire()` pour ajouter les lignes des joueurs extérieurs au tableau.
- Implémentation de la méthode `_creerLigneJoueurExterieur()` pour générer le HTML des lignes des joueurs extérieurs.
- Mise à jour de `PageAlliance.actualiserMembre()` pour détruire et reconstruire le tableau, en incluant les joueurs extérieurs.
- Correction de l'affichage du pseudo des joueurs externes dans le tableau.
- Ajustement du nombre de colonnes générées dans `_creerLigneJoueurExterieur()` pour correspondre au tableau DataTables.
- **Mise à jour de `js/class/Joueur.js` :**
    - La méthode `getProfil()` a été modifiée pour inclure le pseudo du joueur dans l'URL de la requête AJAX.
    - La méthode `chargerProfil(html)` a été étendue pour extraire les valeurs de `fourmiliere` et `technologie` à partir des lignes 2 et 3 du tableau `.tableau_score` de la page de profil.
    - Des logs ont été ajoutés dans `getProfil()` et `chargerProfil()` pour suivre le processus de récupération et d'extraction des données.
- **Mise à jour de `js/page/Alliance.js` :**
    - La méthode `_fusionnerJoueursUtilitaire()` a été rendue `async`.
    - Pour les joueurs extérieurs, seuls les appels à `joueur.getProfil()` sont effectués, et les promesses sont collectées et attendues via `Promise.all()`. Les appels à `getConstruction()` et `getLaboratoire()` ont été supprimés pour les joueurs extérieurs, car ces informations sont désormais extraites du profil.
    - Des logs ont été ajoutés dans `_fusionnerJoueursUtilitaire()` pour suivre le traitement des joueurs extérieurs et l'attente des promesses.
    - Les appels à `_fusionnerJoueursUtilitaire()` dans `traitementMembre()` et `actualiserMembre()` ont été mis à jour avec `await` pour garantir que les données sont chargées avant la mise à jour du tableau.
    - Des logs ont été ajoutés dans `traitementMembre()` et `actualiserMembre()` pour suivre le flux d'exécution.
    - **Correction du problème de chargement asynchrone :** La méthode `traitementMembre()` a été rendue asynchrone et les appels à `this._utilitaire.verifierSujetMembre` et `this._utilitaire.consulterSection` ont été précédés de `await` pour garantir que les données sont entièrement chargées avant la construction du tableau. Une gestion d'erreur a été ajoutée pour les promesses de `getProfil()` afin d'éviter les blocages en cas d'échec de récupération.
    - Ajout de la pastille "En vacances" pour les joueurs extérieurs en vacances dans la colonne "État" du tableau des membres de l'alliance, en utilisant l'image du jeu.
    - La colonne "État" pour les joueurs extérieurs qui ne sont pas en vacances est désormais vide au lieu d'afficher "N/C".
    - L'affichage de l'image de vacances dans la première colonne d'état est maintenant conditionné à la propriété `mv` du joueur.
    - Ajout de la gestion de l'état de colonisation pour les joueurs extérieurs : la propriété `_colonise` a été ajoutée à la classe `Joueur` et est parsée dans `chargerProfil`. L'image `IMG_COLONISE` est affichée dans la colonne "État" de `_creerLigneJoueurExterieur` si le joueur est colonisé.
- **Mise à jour de `js/page/Forum.js` :**
    - Des logs détaillés et une gestion d'erreur explicite avec timeout ont été ajoutés à la méthode `consulterSection` pour faciliter le diagnostic des problèmes de requête AJAX.
- **Résolution :** Le problème d'affichage des données de terrain, fourmilière et technologie à -1 pour les joueurs extérieurs est résolu. Les logs s'affichent désormais correctement et le flux d'exécution n'est plus suspendu.
- **Correction du comptage des images d'état :** La logique de comptage des images (Actif, Vacances, Inactif, Bannie, Colonisé) a été déplacée de `traitementMembre()` à `traitementUtilitaire()` pour s'assurer que les images des joueurs extérieurs sont incluses.
- Le calcul des totaux de terrain, fourmilière et technologie sur la page des membres de l'alliance prend désormais en compte les joueurs hébergés à l'extérieur.
- Intégration de la logique de calcul et d'affichage des icônes d'attaque/défense pour les joueurs extérieurs dans `_creerLigneJoueurExterieur()`.
- Ajout du tri par défaut du tableau par ordre de terrain décroissant dans les méthodes `tableau()` et `tableauUtilitaire()`.
- Fonctionalité complétée et tests validés.
