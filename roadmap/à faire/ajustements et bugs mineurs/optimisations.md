# Optimisations

## Objectifs
Optimiser le temps de traitement et la réutilisation du code.

## Fonctionnement Détaillé
- Lors du rafraichissement d'un objet, n'effectuer qu'une seule lecture, et pas une pour l'objet contenant, et une pour les objets contenus
- Paralléliser les lectures de sections et sujets multiples
- Modifier le setter de estModifie des paramètres pour éviter qu'il y ait conflit en cas d'écriture entre la récupération du string d'enregistrement et la mise à false de estModifie
- Ajouter un cache de versions pour le rafraîchissement du gestionnaire de versions appelé par chaque fonctionnalité

## Plan d'Implémentation

## Tests à effectuer

## Avancement