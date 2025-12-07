# Traceur

## Objectifs
Réparer et améliorer la fonctionnalité traceur de l'extension.

## Fonctionnement Détaillé
- Calcul initial : chercher un joueur qui était à portée de la cible dont le TdC a varié d'une quantité négative équivalente la même minute (si VA connue, filtrer également les joueurs qui étaient à portée au moment du lancement)
- Fallback : si aucun joueur trouvé, chercher à retrouver la quantité via la combinaisons des variations négatives d'amplitude strictement inférieure des joueurs filtrés
- Appliquer le même principe pour les floods reçus (sans filtrage avec la VA)
- Appliquer le même principe pour les floods envoyés et reçus au niveau de l'alliance entière vers/depuis l'extérieur (en comptant les joueurs à l'extérieur pour son alliance)
- Créer un mode de tracé en cascade pour voir le cheminement du Tdc et identifier où il se trouve actuellement

## Plan d'Implémentation

## Tests à effectuer

## Avancement