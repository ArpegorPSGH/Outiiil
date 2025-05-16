# Recensement automatique

## Objectifs
Mettre à disposition une routine de déclenchement du recensement de façon autonome, sans que le joueur ait besoin de penser à cliquer sur le bouton de recensement.

## Fonctionnement Détaillé
- Ajouter une option de recensement automatique désactivée par défaut avec deux modes combinables en OR :
    - Selon un intervalle définissable par le joueur : chaque minute, vérifier si la date de la dernière activité de son sujet membres remonte à plus longtemps que l’intervalle précisé, et si c’est le cas effectuer le recensement
    - En fonction des différences : chaque minute, vérifier s’il y a eu un changement dans les niveaux de constructions ou recherches ou une variation suffisamment importante des ouvris, TdC ou ressources mentionnés dans le dernier message du sujet du joueur, et si c’est le cas, effectuer le recensement

## Plan d'Implémentation

## Avancement