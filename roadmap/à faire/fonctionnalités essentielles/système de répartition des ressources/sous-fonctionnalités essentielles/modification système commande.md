# Modification système commande

## Objectifs
Diverses modifications pour s'adapter au framework.

## Fonctionnement Détaillé
- Vérifier s'il est toujours possible de changer le statut d'une commande
- Changer système annulation convoi en mettant listener sur chaque lien d'annulation de convoi (si ce n'est pas déjà le cas), et si au rechargement le convoi a bien disparu, chercher à l'annuler sur le forum ; s'il n'existe pas, le considérer hors système ou déjà annulé, et s'il est arrivé, ne pas l'annuler. Si au rechargement le convoi n'a pas disparu, le considérer comme non annulable.
Si pas de listener possible, chercher à annuler sur le forum tous les convois disparus au rechargement ; ceux qui n'existent pas, les considérer comme hors système ou déjà annulés, et s'ils sont arrivés, ne pas les annuler. Tester tous les cas.
- Plus besoin de convois négatifs, supprimer le message et repasser la commande en cours si nécessaire via une fonction d'annulation de convoi de la commande
- Retirer le système de matching des convois positifs et négatifs pour l'affichage des convois
- Supprimer les paramètres X et Y et récupérer les données depuis le joueur
- Ajouter/retirer des droits accumulés (émetteur et receveur) directement depuis la fonctionnalité au moment de l'opération
- Vérifier que lancer un convoi à un joueur de l'alliance ou avec une commande est bien considéré comme convoi extérieur s'il n'y a pas eu de clic préalable sur le bouton de livraison de la commande
- L'annulation d'un convois terminant une commande doit la remettre en cours, et repasser la dernière mise en cours à la place à en attente
- L'annulation d'un convoi lié à une commande annulée ou supprimée doit être pris en compte
- Vérifier cas annulation de convoi déjà annulé depuis une autre page parallèle (voir système rafraîchissement objet?)
- Vérifier cas lancement de convoi sur deux pages parallèles sans rechargement (voir système rafraîchissement objet?)
- Vérifier robustesse identification idannulation convoi
- Retirer double chargement envoi convoi (normalement possible)
- Restreindre l'affichage du montant des commandes en bas du tableau
- Ajuster la précision des dates commandes et convois et mettre en format français
- Mettre à jour le tableau lors de la création d'une commande
- Mettre à jour le tableau lors de l'envoi d'un convoi
- Mettre le nom de l'état et l'évolution et non les indices (conversion depuis les constantes au chargement et enregistrement)
- En mode restreint, les commandes et convois du joueur ne doivent pas être restreints (voir à généraliser pour tous les objets)

## Plan d'Implémentation

## Tests à effectuer

## Avancement