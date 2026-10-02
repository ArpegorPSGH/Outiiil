# Optimisations

## Objectifs
Optimiser l'exécution et la compression du logging

## Fonctionnement Détaillé
- Choisir, pour chaque référencement, duplicate ou delta, le plus court en termes de caractères entre l'utiliser ou sérialiser les données complètes (pour les petits objets)
- Ignorer les logs ne provenant pas de l'extension (la pile d'appel ne contient aucun fichier de l'extension)

## Plan d'Implémentation

## Tests à effectuer

## Avancement