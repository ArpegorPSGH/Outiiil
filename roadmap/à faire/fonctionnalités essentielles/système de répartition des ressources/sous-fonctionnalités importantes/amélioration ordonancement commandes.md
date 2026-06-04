# Amélioration ordonancement commandes

## Objectifs
Rendre la gestion de l'ordre des commandes plus performante et flexible.

## Fonctionnement Détaillé
- Ajouter un paramètre (forum?) pour définir le nombre de commandes en cours maximal (par défaut 1)
- Remettre dans le pool des commandes en attente toutes les commandes en cours dont la livraison n'a pas encore commencée, puis passer à en cours les premières (du point de vue du score) commandes en attente dans la limite du maximum de commande en cours autorisé
- Il faut pouvoir prendre en compte un nombre de commandes en cours supérieur au max si trop de commandes sont déjà en cours de livraison
- La fonction d'activation des prochaines commandes sera appelée après la complétion d'une commande (depuis la fonction objet d'ajout de convoi), après la modification d'une commande, après l'annulation d'un convoi conduisant au repassage d'une commande de terminé à en cours (depuis la fonction objet d'annulation de convoi, à la place de la fonction actuelle), au chargement de la fonctionnalité.

## Plan d'Implémentation

## Tests à effectuer

## Avancement