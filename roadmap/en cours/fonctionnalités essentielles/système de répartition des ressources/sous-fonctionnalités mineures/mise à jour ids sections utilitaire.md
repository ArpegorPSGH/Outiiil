# Mise à jour ids sections utilitaire

## Objectifs
Ne pas avoir à chercher ni renseigner manuellement les ids des sections du forum utilisées par l'extension.

## Fonctionnement Détaillé
- Lors du passage sur la page forum, si les ids renseignés dans l’extension ne correspondent pas à des sections existantes, scanner le forum pour trouver les bons ids correspondant à « outiiil_membre » et « outiiil_commande » et les remplacer dans l’extension. Faire attention à ne pas briser la fonctionnalité des boutons du forum. Ajouter un popup indiquant que cette mise à jour a été effectuée.
- Etendre la mise à jour au chargement de n’importe quelle page ayant besoin d'accéder au forum

## Plan d'Implémentation
1.  Modifier la logique de la page Forum (`js/page/Forum.js`) pour inclure une vérification des IDs des sections "Outiiil_Commande" et "Outiiil_Membre" lors du chargement de la page.
2.  Si les IDs stockés dans les paramètres de l'extension sont manquants ou incorrects, scanner le DOM de la page Forum pour trouver les IDs corrects des sections nommées "outiiil_membre" et "outiiil_commande".
3.  Mettre à jour les IDs trouvés dans les paramètres de l'extension (`localStorage`).
4.  Afficher un popup de notification (`$.toast`) pour informer l'utilisateur que les IDs ont été mis à jour.
5.  S'assurer que cette logique de mise à jour automatique ne perturbe pas les autres fonctionnalités de la page Forum.
6.  Étendre cette logique de vérification et de mise à jour des IDs pour qu'elle s'exécute lors du chargement de toute page de l'extension qui nécessite d'accéder aux IDs du forum (par exemple, les pages Commerce et Alliance).

## Tests à effectuer
1.  **Test sur la page Forum avec IDs incorrects/manquants :**
    *   Modifier manuellement les IDs des sections "Outiiil_Commande" et "Outiiil_Membre" dans les paramètres de l'extension (par exemple, via le `localStorage` du navigateur) pour qu'ils soient incorrects ou les supprimer.
    *   Aller sur la page Forum.
    *   Vérifier qu'un popup de notification s'affiche, indiquant que les IDs ont été mis à jour.
    *   Vérifier dans les paramètres de l'extension que les IDs des sections "Outiiil_Commande" et "Outiiil_Membre" ont été correctement mis à jour avec les IDs réels des sections sur le forum.
    *   Vérifier que les boutons et fonctionnalités de la page Forum fonctionnent toujours correctement après la mise à jour.

2.  **Test sur la page Forum avec IDs corrects :**
    *   S'assurer que les IDs des sections "Outiiil_Commande" et "Outiiil_Membre" dans les paramètres de l'extension sont corrects.
    *   Aller sur la page Forum.
    *   Vérifier qu'aucun popup de notification ne s'affiche et qu'aucune tentative de mise à jour des IDs n'est effectuée.

3.  **Test sur une autre page nécessitant les IDs du forum (après extension de la logique) :**
    *   Aller sur une page comme Commerce ou Alliance (après avoir implémenté l'extension de la logique de mise à jour à ces pages).
    *   Modifier manuellement les IDs dans les paramètres de l'extension pour qu'ils soient incorrects ou les supprimer.
    *   Actualiser la page.
    *   Vérifier qu'un popup de notification s'affiche, indiquant que les IDs ont été mis à jour.
    *   Vérifier dans les paramètres de l'extension que les IDs ont été correctement mis à jour.
    *   Vérifier que les fonctionnalités de la page (par exemple, chargement des commandes sur la page Commerce) qui dépendent des IDs du forum fonctionnent correctement.

## Avancement
La logique de vérification et de mise à jour automatique des IDs des sections "Outiiil_Commande" et "Outiiil_Membre" dans les paramètres de l'extension a été implémentée dans `js/page/Forum.js` (`traitementSection`). Cette mise à jour se déclenche lors du passage sur la page Forum si les sections sont présentes et que les IDs stockés sont incorrects ou manquants. Un popup de notification est affiché en cas de mise à jour. La mise à jour fonctionnelle des IDs lors du passage sur la page forum est terminée. L'extension de cette logique pour qu'elle s'exécute lors du chargement de n'importe quelle page ayant besoin d'accéder au forum reste à faire.
