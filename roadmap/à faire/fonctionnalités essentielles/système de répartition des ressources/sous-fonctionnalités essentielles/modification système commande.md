# Modification système commande

## Objectifs
Diverses modifications pour s'adapter au framework.

## Fonctionnement Détaillé
- Vérifier s'il est toujours possible de changer le statut d'une commande
- Plus besoin de convois négatifs, supprimer le message
- Ajouter/retirer des droits accumulés (émetteur et receveur) directement depuis la fonctionnalité au moment de l'opération
- Vérifier que lancer un convoi à un joueur de l'alliance ou avec une commande est bien considéré comme convoi extérieur s'il n'y a pas eu de clic préalable sur le bouton de livraison de la commande
- L'annulation d'un convois terminant une commande doit la remettre en cours, et repasser celle mise en cours à la place à en attente

## Plan d'Implémentation

## Tests à effectuer

## Avancement