# Contraintes création et modification commande

## Objectifs
Contraindre les commandes a être cohérentes à la création et la modification

## Fonctionnement Détaillé
- Création :
    - Au moins l'une des quantités de ressources doit être supérieure à 0
    - Le champ Date Après doit être compris entre la date du jour et le champ Date Souhaitée
- Modification :
    - Les quantités de ressources ne peuvent pas être diminuées en-deça de ce qui a déjà été livré, et doivent rester au delà de 0 pour au moins une, et ne peuvent pas être augmentées si la livraison a commencé
    - Le champ Date Après doit être compris entre la date de la commande et le champ Date Souhaitée

## Plan d'Implémentation

## Tests à effectuer

## Avancement