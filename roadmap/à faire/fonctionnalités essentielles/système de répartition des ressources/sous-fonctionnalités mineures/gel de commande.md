# Gel de commande

## Objectifs
Geler une commande de manière à ce qu'elle soit hors système.

## Fonctionnement Détaillé
- Ajouter un booléen de gel de commande accessible au joueur demandeur et à l'administration
- Une commande en attente gelée ne pourra pas passer à en cours automatiquement
- Une commande en cours gelée sera repassée en attente
- Une commande en attente non gelée dont la livraison a commencé doit être passée en cours, indépendamment du nombre de commandes maximales en cours possibles (ce nombre est pris en compte pour savoir combien de commandes rajouter après)
- L'activation/désactivation du gel déclenche l'appel à la fonction d'activation des prochaines commandes

## Plan d'Implémentation

## Tests à effectuer

## Avancement