# Synchronisation données locales

## Objectifs
Sauvegarder les données propres du client de l'extension (paramètres, boîte C+, radar, et visibilité colonnes uniquement?) de chaque joueur sur le forum pour synchroniser les différentes instance de l'extension utilisées par ce joueur avec ses différents serveurs/comptes.

## Fonctionnement Détaillé
- Créer une fonction de sauvegarde qui :
    - Sauvegarde en local tous les profils avec les clés (serveur, pseudo)
    - Sauvegarde en crypté sur le forum (s'il existe) uniquement le profil en cours avec sa clé
- Créer une fonction de chargement qui :
    - Tente de récupérer les infos sur le forum
    - Si non trouvé, tente de les récupérer en local
    - Si non trouvé, retourne null pour que l'appelant utilise ses défauts

## Plan d'Implémentation

## Tests à effectuer

## Avancement