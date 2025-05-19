# Envoi des données du joueur

## Objectifs
Permettre à chaque joueur de partager toutes ses données avec l'alliance en un clic.

## Fonctionnement Détaillé
- Sur la page membres ajouter en haut avec les autres un bouton recensement
- L'accès au bouton est conditionné par l'existence d'un ID section membres et la présence d’un sujet pour le joueur dans cette section
- Lorsque le joueur clique sur le bouton, ses données sont postées sur son sujet dans outiiil_membre :
    - « Nourriture : quantité »
    - « Matériaux : quantité »
    - « Terrain de Chasse : quantité »
    - Toutes les constructions :
        - « Nom : niveau »
    - Toutes les technologies :
        - « Nom : niveau »
    - Toutes les unités :
        - « Nom : quantité »

## Plan d'Implémentation
1.  Ajouter un bouton "Recensement" sur la page des membres de l'alliance (`/alliance.php?Membres`).
2.  Conditionner l'affichage du bouton à l'existence d'un ID de section membres configuré dans les paramètres et à la présence d'un sujet dédié au joueur dans cette section.
3.  Lors du clic sur le bouton :
    a.  Récupérer les données du joueur (ressources, ouvrières, niveaux via `Utils` et `monProfil`).
    b.  Effectuer un appel AJAX vers `/Armee.php` pour récupérer les unités militaires.
    c.  Parser la réponse HTML de `/Armee.php` pour extraire les données d'unités (`Armee.parseHtml`).
    d.  Formater les données collectées en un message texte (sans le pseudo du joueur, incluant les ouvrières).
    e.  Vérifier si l'ID du sujet forum du joueur est connu (`monProfil.sujetForum`).
    f.  Si l'ID du sujet n'est pas connu, récupérer l'ID de la section membres depuis les paramètres (`monProfil.parametre.forumMembre`), puis consulter cette section (`forumManager.consulterSection`) pour trouver l'ID du sujet du joueur.
    g.  Envoyer le message formaté sur le sujet du forum du joueur (`forumManager.envoyerMessage`).
    h.  Afficher un feedback visuel (indicateur de chargement, désactivation/réactivation du bouton) pendant l'exécution.
    i.  Afficher une notification (`$.toast`) une fois l'opération terminée.
4.  Déplacer la logique et le bouton de `js/boite/ComptePlus.js` vers `js/page/Alliance.js` pour une meilleure contextualisation.
5.  Ajuster le style du bouton pour qu'il s'intègre visuellement avec les autres boutons DataTables (`dt-button`, styles CSS spécifiques pour la taille et l'espacement).
6.  Implémenter la logique dans `js/page/Forum.js` (`verifierSujetMembre`) pour vérifier l'existence du sujet membre et mettre à jour `monProfil.sujetForum`.
7.  Utiliser `verifierSujetMembre` dans `js/page/Alliance.js` pour conditionner l'affichage du bouton "Recensement".
8.  Ajuster la logique d'actualisation du tableau des membres de l'alliance (`actualiserMembre`) pour gérer correctement l'initialisation de DataTables en fonction de l'existence du sujet membre après une potentielle création de sujet.

## Tests à effectuer
1.  **Vérifier l'affichage conditionnel du bouton :**
    *   S'assurer que l'ID de la section membres est configuré dans les paramètres.
    *   Vérifier que le bouton "Recensement" n'est pas affiché si le joueur n'a pas de sujet dédié dans la section membres configurée.
    *   Créer un sujet dédié au joueur dans la section membres configurée (si possible manuellement ou via une autre fonctionnalité).
    *   Actualiser la page membres de l'alliance.
    *   Vérifier que le bouton "Recensement" est maintenant affiché.

2.  **Vérifier l'envoi des données :**
    *   Cliquer sur le bouton "Recensement".
    *   Vérifier qu'un indicateur de chargement s'affiche et que le bouton est désactivé pendant l'opération.
    *   Vérifier qu'une notification s'affiche une fois l'opération terminée.
    *   Aller sur le sujet dédié au joueur dans la section membres du forum.
    *   Vérifier qu'un nouveau message a été posté.
    *   Vérifier que le message contient les données correctes et formatées du joueur (ressources, terrain de chasse, constructions, technologies, unités).

3.  **Vérifier le comportement en cas d'erreur :**
    *   Tester le clic sur le bouton dans différentes conditions (par exemple, si l'ID de la section membres est incorrect, si le sujet du joueur n'existe plus, si une erreur réseau se produit).
    *   Vérifier que l'extension gère ces erreurs de manière appropriée (messages d'erreur, réactivation du bouton).

4.  **Vérifier la mise à jour du tableau des membres après création/détection du sujet membre (si le bug est corrigé) :**
    *   Partir d'une situation où le joueur n'a pas de sujet membre et le bouton n'est pas affiché.
    *   Créer le sujet membre (si possible via l'extension ou manuellement).
    *   Actualiser la page membres de l'alliance.
    *   Vérifier que le bouton "Recensement" s'affiche et que le tableau des membres s'initialise correctement avec les colonnes supplémentaires liées au recensement si elles existent.

## Avancement
La logique principale de récupération des données (unités via AJAX, ressources/ouvrières/niveaux via Utils et monProfil), le formatage du message et l'envoi du message sur le sujet du forum sont implémentés et fonctionnels. Cette logique a été déplacée de `js/boite/ComptePlus.js` vers `js/page/Alliance.js`.

Le bouton "Recensement" est ajouté sur la page membres de l'alliance avec le style correct et positionné entre les boutons "Actualiser l'alliance" et "Colonne". Son affichage est maintenant conditionné par l'existence du sujet membre du joueur dans la section configurée. Le feedback visuel (chargement) est implémenté. La vérification et mise à jour automatique des IDs forum est implémentée dans `js/page/Forum.js`, ainsi que la fonction `verifierSujetMembre` utilisée pour conditionner l'affichage.

Un problème persiste concernant l'affichage correct du tableau des membres de l'alliance après une actualisation si le sujet membre est créé pendant cette actualisation. `monProfil.sujetForum` ne semble pas mis à jour comme prévu, ce qui empêche l'initialisation correcte de DataTables avec les colonnes supplémentaires. Ce point nécessite un débogage (voir Next Steps dans `activeContext.md`).

Des tests utilisateurs sont nécessaires pour valider le fonctionnement complet de la fonctionnalité "Recensement", l'affichage conditionnel du bouton, et la gestion des mises à jour du tableau après création/détection du sujet membre.
