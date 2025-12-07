# Niveau de de restriction variable des paramètres

## Objectifs
Permettre de définir pour chaque paramètre le niveau de droit minimal pour ne pas être restreint.

## Fonctionnement Détaillé
- Rajouter dans la classe mère des paramètres un attribut droitMinimal étant un string
- Ne plus effectuer la vérification de droits en amont de l'appel pour l'affichage, mais juste passer un flag à true pour dire qu'on est en mode restreint
- En mode restreint, le paramètre vérifie ses droits auprès du gestionnaire via la fonction verifierDroit de sa fonctionnalité, en passant droitMinimal comme argument, et utilise la réponse pour le reste du traitement

## Plan d'Implémentation

## Tests à effectuer

## Avancement