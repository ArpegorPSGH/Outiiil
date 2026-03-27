# Bonus chasses et armée

## Objectifs
Créer un bonus pour ceux chassant plus ou ayant une grosse armée.

## Fonctionnement Détaillé
- Creéer un bonus proportionnel au multiple par rapport à la moyenne des capacités de chasse de l'alliance en TdC/J (coeffcient réglable, et pas de malus si en-dessous de la moyenne)
- Le calcul des valeurs doit se faire lissé sur les 10 dernières chasses, et prendre le max entre cette valeur et le lissage sur la dernière chasse
- Creéer un bonus proportionnel au multiple par rapport à la moyenne des stats des armées de l'alliance :
    - coeff1*(coeff2^(max(stats armée joueur/stats armées moyennes,1)-1)-1) (coeff1 (supérieur à 0) pour régler le poids du bonus et coeff2 (légèrement supérieur à 1) pour régler l'écart de bonus entre joueurs)
- Le bonus d'armée doit être plus intéressant que celui de chasse si le joueur gère bien ses pex et sait préserver son armée
- Le calcul des valeurs doit se faire lissé sur un an, et prendre le max entre cette valeur et le lissage sur le dernier mois

## Plan d'Implémentation

## Tests à effectuer

## Avancement