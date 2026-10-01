# Rollback version

## Objectifs
Permettre de revenir à une version antérieure en cas de problème important.

## Fonctionnement Détaillé
- Le socle récupère la version du dernier commit sur la branche release à partir du moment où elle est différente de celle en cache, et non seulement supérieure
- Créer un script de rollback qui supprimme le dernier commit de la branche release

## Plan d'Implémentation

## Tests à effectuer

## Avancement