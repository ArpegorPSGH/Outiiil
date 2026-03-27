# Commande de plusieurs niveaux simultanés

## Objectifs
Permettre la commande de plusieurs niveaux d'une même construction/recherche simultanément.

## Fonctionnement Détaillé
- Lors de la création d'une commande, vérifier si le joueur a déjà des commandes en attente, en cours ou nouvelle pour cette construction/recherche.
- Si oui, empêcher le joueur de mettre un ordre de priorité inférieur ou égal à celui des commandes existantes. Le coût doit être calculé en considérant que les niveaux déjà commandés seront construits (se baser sur le coût de la commande de plus haut niveau).
- Si non, créer la commande de façon classique.

## Plan d'Implémentation

## Tests à effectuer

## Avancement