# Amélioration de la création de commandes

## Objectifs
Pouvoir prendre en compte la quantité de ressources présente dans l'entrepôt du joueur au moment de la création de la commande.

## Fonctionnement Détaillé
Lors de la création de la commande, possibilité de prendre en compte la quantité en entrepôt via une tick box par défaut à oui. Si mis à oui, enregistrer comme quantité de référence en entrepôt 0, poster un premier auto-convoi fictif de la quantité actuelle en entrepôt des ressources demandées (qui ne peut pas dépasser la valeur demandée) et mettre à jour la quantité livrée pour refléter ça, sinon enregistrer la quantité actuelle en entrepôt comme quantité de référence en entrepôt.

## Plan d'Implémentation

## Tests à effectuer

## Avancement