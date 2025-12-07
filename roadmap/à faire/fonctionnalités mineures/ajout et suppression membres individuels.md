# Ajout et suppression membres individuels

## Objectifs
Pouvoir ajouter et supprimer des membres un à un depuis la page alliance.

## Fonctionnement Détaillé
- Dans la fonctionnalité d'actualisation de l'alliance, rajouter l'ajout d'un bouton dans la colonne du crayon pour les joueurs n'étant pas membres
- Un clic sur ce bouton vérifiera si le joueur n'a pas déjà des sujets dans les archives (dont le paramètre pseudo match), et si c'est le cas, les remettra dans les sections actives, et affichera un message
- Si certaines sections n'ont pas d'archives du joueur alors que les autres en ont, indiquer lesquelles via un message
- Si le joueur n'avait pas de sujet membre, en créer un (peu importe ce qui a été restauré des archives par ailleurs), et l'indiquer par un message
- Le bouton d'actualisation de l'alliance suivra le même principe, mais en balayant tous les joueurs de la page, et en s'appliquant à ceux n'étant pas membres
- Rajouter un bouton dans la colonne de suppression d'un joueur de l'alliance s'il est membre
- Un clic sur ce bouton ouvrira une boîte avec deux options : archiver le joueur et supprimer le joueur
- Cliquer sur l'archivage déplacera tous les sujets du joueur vers les sections d'archives correspondantes et fermera la boîte
- cliquer sur la suppression promptera une boîte supplémentaire avec un message "Êtes-vous sûr de vouloir supprimer toutes les données liées à ce joueur? Si non, optez pour l'archivage." et deux options, oui et non
- Cliquer sur oui supprimera tous les sujets du joueur et fermera les deux boîtes
- Cliquer sur non fermera juste la deuxième boîte

## Plan d'Implémentation

## Tests à effectuer

## Avancement