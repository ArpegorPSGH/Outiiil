# Historiques

## Objectifs
Permettre la visualisation et l'exploration des historiques des joueurs et de l'alliance.

## Fonctionnement Détaillé
Mettre en place affichage historiques :
- Evolutions
- Troupes
- Ressources
- TdC
- Chasses
- Convois
- Floods
- Pex
- Echange TdC
- Statut membre (grade, priorité, coefficient, ajustement, droits accumulés)
- Chaque joueur accède à ses historiques et ceux globaux de l'alliance
- Le conseil a également accès aux historiques de chaque joueur
Pour cela, mettre en place un workflow extensible :
- Un système de filtrage d'objets basé sur les attributs des objets, de leurs paramètres, des objets contenus et de leurs paramètres
- Un système d'application de calcul sur les objets retournés pour générer des abscisses/ordonnées
- Un système d'affichage de courbes 2D :
    - Prend une abscisse et de multiples courbes en ordonnées
    - Chaque courbe pourra être affichée ou non via une checkbox, et il sera possible de tout dé/sélectionner
    - Généralement, les courbes correspondront à des joueurs ou au total/moyenne des joueurs

## Plan d'Implémentation

## Tests à effectuer

## Avancement