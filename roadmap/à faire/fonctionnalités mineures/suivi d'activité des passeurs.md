# Suivi d'activité des passeurs

## Objectifs
Ajouter un tableau d'activité des passeurs mentionnant la date, durée depuis le dernier flood envoyé, et cibles à portée

## Fonctionnement Détaillé
- Gérer le cas où il n'y a pas de cibles à portée actuellement (date et durée vide?)
- Calculer la quantité de TdC total floodé (ou lancé si pas touché) par rapport à la quantité qui était floodable (par jour?) pour chaque joueur sur un an et prendre le max entre cette valeur et celle sur le dernier mois
- Créer et piloter un bonus/malus du tableau des bonus en fonction de l'écart relatif du joueur à la moyenne de l'alliance
- Détecter les floods non-opti (ratio d'efficacité récent?)

## Plan d'Implémentation

## Tests à effectuer

## Avancement