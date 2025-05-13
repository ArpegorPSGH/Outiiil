# Restriction d'affichage du tableau des commandes

## Objectifs
Ne pas permettre aux joueurs externes hébergés par l'alliance d'accéder au tableau des commandes.

## Fonctionnement Détaillé
Ajouter aux restrictions accès tableau commande la présence d’un sujet pour le joueur dans la section membres.

## Plan d'Implémentation
1.  Modifier la logique d'affichage du tableau des commandes sur la page Commerce (`js/page/Commerce.js`).
2.  Ajouter une condition pour vérifier si les paramètres `forumCommande` et `forumMembre` sont configurés dans les paramètres de l'extension.
3.  Utiliser la fonction `verifierSujetMembre` de `js/page/Forum.js` pour vérifier si le joueur courant a un sujet dédié dans la section membres du forum configurée.
4.  Le tableau des commandes ne doit être affiché que si les conditions des étapes 2 et 3 sont remplies.

## Avancement
La logique d'affichage du tableau des commandes sur la page Commerce (`js/page/Commerce.js`) a été modifiée. Le tableau ne s'affiche désormais que si les paramètres `forumCommande` et `forumMembre` sont configurés ET que le joueur courant a un sujet dédié dans la section membres du forum configurée (vérifié via `js/page/Forum.js.verifierSujetMembre`). La fonctionnalité est terminée et fonctionnelle.
