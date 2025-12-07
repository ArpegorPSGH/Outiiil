# Outils batch GUI

## Objectifs
Mettre à disposition des outils pour effectuer des changements en batch dans un tableau de gestion administration (SdC, Droits, etc).

## Fonctionnement Détaillé
- Possibilité de sélectionner/déselectionner une ligne/toutes les lignes, une colonne/toutes les colonnes avec des valeurs modifiables, via des tickboxes
- Si une valeur d'une ligne et colonne sélectionnée est modifiée, seront modifiées également toutes les valeurs des lignes sélectionnées et des colonnes sélectionnées correspondant à :
    - La même classe de paramètre s'il est primitif
    - Les éléments de la même classe de paramètre si c'est une liste
    - Les clés identiques de la même classe de paramètre si c'est un dictionnaire
- Trois modes de modification sélectionnables via une liste déroulante, avec une valeur par défaut à définir dans les paramètres Outiiil :
    - Exact, qui copie la valeur exacte
    - Si supérieur, qui copie la valeur si elle est supérieure à celle actuelle (en terme d'indice de l'élément pour une liste de choix, ou de valeur numérique sinon)
    - Si inférieur, qui copie la valeur si elle est inférieure à celle actuelle

## Plan d'Implémentation

## Tests à effectuer

## Avancement