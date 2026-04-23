# Mise à jour des ids de section pour les joueurs non admin

## Objectifs
Permettre aux joueurs n'ayant pas l'accès au forum caché de pouvoir récupérer les ids des sections de façon automatique.

## Fonctionnement Détaillé
- Tout joueur ayant accès au forum caché devra automatiquement, au chargement de toute page, récupérer les ids de section (caché + restreint)(s'inspirer de ce qui est actuellement fait sur la page Forum), et s'en servir pour mettre à jour si nécessaire un objet d'ids sections stocké dans une section restreinte.
- Tout joueur n'ayant pas accès au forum caché devra automatiquement, au chargement de toute page, récupérer l'id de la section dans laquelle se trouve l'objet d'ids sections, et s'en servir pour récupérer tous les autres ids de section.
- Si un mismatch entre les ids stockés et les ids réels est détecté (pour les sections auxquelles l'accès est possible), les mettre à jour et afficher un popup de notification (sur la base de ce qui est fait sur la page Forum actuellement).

## Plan d'Implémentation

## Tests à effectuer

## Avancement