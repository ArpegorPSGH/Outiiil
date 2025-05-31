# Compatibilité entre versions

## Objectifs
Eviter que des versions utilisant des formats différents de stockage de données sur le forum ne créent des incohérences dans les données stockées.

## Fonctionnement Détaillé
- Restreindre l'accès au forum aux versions de l’extension supérieures ou égales à une certaine version et afficher un message d’erreur.
- La restriction doit pouvoir se faire au global, par section, ou pour le titre des sujets d'une section ou leur contenu, en précisant pour chaque la version minimale nécessaire.
- Associer à chaque fonctionnalité la liste des parties du forum nécessaire à son fonctionnement.
- Si au moins une de ces parties n'est pas accessible, bloquer l'accès à la fonctionnalité en affichage et/ou son exécution en tâche de fond.

## Plan d'Implémentation

## Tests à effectuer

## Avancement