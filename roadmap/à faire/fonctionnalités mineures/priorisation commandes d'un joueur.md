# Priorisation commandes d'un joueur

## Objectifs
Permettre à un même joueur de définir l'ordre dans lequel il souhaite recevoir ses commandes s'il en poste plusieurs en parallèle.

## Fonctionnement Détaillé
- Ajouter un attribut "Priorité de la commande" à l'objet commande
- Permettre au joueur de le définir et modifier de la même façon que les autres attibuts actuellement accessibles
- Ce doit être un nombre
- Par défaut il vaut 0 si le joueur n'a aucune commande de statut "nouvelle", "en attente ou "en cours", sinon il vaut la priorité de la commande la plus élevée additionné de 1 et arrondi à l'entier inférieur
- Rajouter une colonne masquée par défaut "Priorité du rang" affichant cet attribut

## Plan d'Implémentation

## Avancement