# Sécurisation accès forum

## Objectifs
Empêcher l'accès aux sections de l'extension à ceux qui n'en ont pas le droit.

## Fonctionnement Détaillé
- Remplacer les ids section en clair dans les paramètres par une version cryptée
- Mettre la clé de cryptage dans un fichier non inclus dans le code public
- N'installer l'extension que via un fichier compilé pour empêcher d'accéder à la clé
- Crypter le contenu des requêtes ajax pour empêcher l'accès à l'id de section
- Si le cryptage des requêtes n'est pas possible, crypter le contenu du forum, et utiliser les fonctions de lecture et écriture de contenu crypté pour l'accès manuel

## Plan d'Implémentation

## Tests à effectuer

## Avancement