# Gestion de l'annulation des convois

## Objectifs
Répercuter l'annulation d'un convoi par un joueur sur les données de la commande sur le forum, sans que cela ne crée de dysfonctionnement avec les autres fonctionnalités utilisant ces données.

## Fonctionnement Détaillé
- Au moment du chargement de la page commerce, après l’extraction des convois en cours du joueur et ceux en cours du forum, comparer un à un ces derniers pour lesquels le joueur est l’expéditeur à ceux en cours sur la page.
- Le destinataire, montant de ressources et date d’arrivée doivent coïncider parfaitement.
- Dès qu’il y a un match, le convoi sur la page concerné ne peut pas être réutilisé pour les convois du forum suivant. Tous les convois côté forum qui ne matchent pas ont été annulés.
- En cas d’annulation d’un convoi, poster sur le sujet de commande dont est issu le convoi une livraison négative du montant du convoi annulé, soustraire à la quantité livrée de la commande le montant du convoi, et si elle était terminée la remettre en en cours (vérifier si une commande est complétée au départ ou à l’arrivée du dernier convoi).

## Plan d'Implémentation

## Tests à effectuer

## Avancement