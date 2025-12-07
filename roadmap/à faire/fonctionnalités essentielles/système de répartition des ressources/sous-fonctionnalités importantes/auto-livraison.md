# Auto-livraison

## Objectifs
Permettre au joueur de prendre en compte sa production personnelle ou tout autre source de ressources en-dehors des convois de l'alliance comme une contribution à la complétion de sa commande.

## Fonctionnement Détaillé
- Donner la possibilité de s’auto-livrer également quand la commande est nouvelle ou en attente
- En cas d’auto-livraison, effectuer la différence entre la quantité actuelle en entrepôt moins la quantité de référence en entrepôt plus les éventuels convois en cours correspondant à la commande et la quantité livrée pour la commande. Pré-remplir les quantités à envoyer avec le maximum entre cette valeur et 0.
- Résoudre le problème d'absence de durée du convois quand sa durée est plus courte que le temps de post du message
- Etudier impact décalage d'une minute entre data d'arrivée sur le forum et réelle
- Mettre une option sur la page pour effectuer l'auto-livraison de façon automatique (en continu ou à chaque chargement de page?), désactivée par défaut

## Plan d'Implémentation

## Tests à effectuer

## Avancement