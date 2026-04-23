# Modification mise à jour automatique ids sections

## Objectifs
Modifier la mise à jour automatique des ids de section pour qu'elle ne se fasse pas si l'id actuel pointe vers une section accessible dont le nom contient celui de la section cible.

## Fonctionnement Détaillé
- Gérer cas pas de section au nom exact (retirer l'id ou laisser vide), et section actuelle ne contenant pas le bon nom (recherche d'une section avec le nom exact).

## Plan d'Implémentation

## Tests à effectuer

## Avancement
- [x] Implémentation du nouveau fonctionnement dans `Forum.js` le 23/04/2026.