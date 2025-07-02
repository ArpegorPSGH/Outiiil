# Compatibilité entre versions

## Objectifs
Eviter que des versions utilisant des formats différents de stockage de données sur le forum ne créent des incohérences dans les données stockées.

## Fonctionnement Détaillé
- L'extension possède en interne en hard-coded les versions minimales nécessaires à l'accès à chaque partie du forum
- Lors de l'accès au forum :
    - Si la version de l'extension est inférieure à la version sur le forum, déclencher une mise à jour et afficher un message de notification
    - Si la mise à jour ne marche pas, afficher un message d'erreur suggérant une mise à jour manuelle
    - Si la version de l'extension est supérieure ou égale à la version sur le forum :
        - Si la version interne est supérieure à la version sur le forum, mettre la version interne à la place et afficher un message de notification
- La restriction doit pouvoir se faire au global, par section, ou pour le titre des sujets d'une section ou leur contenu, en précisant pour chaque la version minimale nécessaire.
- Associer à chaque fonctionnalité la liste des parties du forum nécessaire à son fonctionnement.
- Si au moins une de ces parties n'est pas accessible, bloquer l'accès à la fonctionnalité en affichage et/ou son exécution en tâche de fond.


## Plan d'Implémentation

## Tests à effectuer

## Avancement