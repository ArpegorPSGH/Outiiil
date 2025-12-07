# Utilisation des droits fourmizzz

## Objectifs
By-passer les droits Outiiil en cas de droits d'administration Fourmizzz.

## Fonctionnement Détaillé
- Rajouter un attribut rang Fourmizzz dans Joueur
- Rajouter un attribut droitsRangs dans le gestionnaire de droits, contenant un objet DroitsRangs (n'héritant pas d'ObjetForum)(initialement vide)
- DroitsRangs contient une liste de rangs, chacun composé d'un dictionnaire de droits, ainsi qu'une fonction de chargement allant récupérer les données sur la page options de l'alliance
- Lors du rafraîchissement du gestionnaire de droits, créer une instance de DroitsRangs et invoquer cette fonction, puis stocker l'objet dans droitsRangs
- Lors de la vérificartion de droits, filtrer les rangs dans droitsRangs pour récupérer celui du joueur concerné
- Si le joueur a les droits d'administration du forum ou de l'alliance, considérer automatiquement que le joueur a les droits 'A' dans Outiiil, et répondre en conséquence
- Ne plus utiliser les icônes de droits sur la page alliance

## Plan d'Implémentation

## Tests à effectuer

## Avancement