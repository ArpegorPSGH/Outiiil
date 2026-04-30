# Priorisation commandes d'un joueur

## Objectifs
Permettre à un même joueur de définir l'ordre dans lequel il souhaite recevoir ses commandes s'il en poste plusieurs en parallèle.

## Fonctionnement Détaillé
- Ajouter un attribut "Priorité de la commande" à l'objet commande
- Permettre au joueur de le définir et modifier de la même façon que les autres attibuts actuellement accessibles
- Ce doit être un nombre
- Par défaut il vaut 0 si le joueur n'a aucune commande de statut "nouvelle", "en attente ou "en cours", sinon il vaut la priorité de la commande la plus élevée additionné de 1 et arrondi à l'entier inférieur
- Rajouter une colonne masquée par défaut "Priorité de la commande" affichant cet attribut
- Si deux convois parallèles peuvent être livrés dans n'importe quel ordre, leur mettre la même valeur de priorité
- Lors du passage automatique de la prochaine commande à "en cours", ne considérer pour chaque joueur que sa commande avec la plus faible priorité
- Un même joueur ne peut avoir qu'une seule commande en cours à la fois

## Plan d'Implémentation

## Tests à effectuer

## Avancement