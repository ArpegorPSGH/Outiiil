# Modification système commande

## Objectifs
Diverses modifications pour s'adapter au framework.

## Fonctionnement Détaillé
- Vérifier s'il est toujours possible de changer le statut d'une commande
- Changer système annulation convoi en mettant listener sur chaque lien d'annulation de convoi (si ce n'est pas déjà le cas), et si au rechargement le convoi a bien disparu, chercher à l'annuler sur le forum ; s'il n'existe pas, le considérer hors système ou déjà annulé, et s'il est arrivé ou a dépassé le délai d'annulation de deux minutes, ne pas l'annuler. Tester tous les cas.
- Plus besoin de convois négatifs, supprimer le message et repasser la commande en cours si nécessaire via une fonction d'annulation de convoi de la commande
- L'annulation d'un convois terminant une commande doit la remettre en cours, et repasser la dernière mise en cours à la place à en attente
- L'annulation d'un convoi lié à une commande annulée ou supprimée doit être pris en compte
- Retirer double chargement envoi convoi:
    - Au rechargement unique, chercher sur la page les convois en cours dont les quantités de matériaux et nourriture, ainsi que le destinataire et la date d'arrivée (à 1 seconde près) correspondent à celles prévues pour le convoi qui vient d'être envoyé à Fourmizzz, et qui ne sont pas déjà liés à une commande
    - Si aucun convoi ne correspond, considérer que l'envoi a échoué et afficher un message
    - Si un convoi correspond, récupérer son Id d'annulation et l'ajouter à la commande
    - Si plusieurs convois correspondent, considérer le plus proche en date d'arrivée comme étant le bon, récupérer son Id et l'ajouter à la commande
    - Tester tous les cas :
        - Aucun convoi correspondant (bloquer clic envoi formulaire)
        - Un convoi correspond (envoi normal)
        - Plusieurs convois correspondent (envoi hors système via une autre page avec moins de 1s d'écart)
- S'assurer que les dates d'un convoi sont les plus proches possible du moment du clic
- Délocaliser les ajouts de fonctions de clics des boutons de modification, livraison et annulation de la fonctionnalité vers les attributs de Commande
- Restreindre l'affichage du montant des commandes en bas du tableau si au moins une commande n'est pas de soi
- Mettre à jour le tableau lors de la création d'une commande
- Mettre le nom de l'état et l'évolution et non les indices (conversion depuis les constantes au chargement et enregistrement)
- Raccourcir les dates souhaitées et après enregistrées à la journée près
- Vérifier le fonctionnement de la fonction plus de Commerce (notamment les convois vers soi à l'aide du forum)

## Plan d'Implémentation

## Tests à effectuer

## Avancement
- Changement de du statut d'une commande possible
- Enlèvement du double rechargement pour l'annulation
- Remplacement des convois négatifs par une suppression du message
- Remise en attente de la nouvelle commande après annulation fonctionnelle
- Annulation fonctionnelle pour les commandes annulées ou supprimées
- Suppression du double rechargement lors de l'envoi (reconnaissance par matching)
- Délocaisation effectuée
- Restriction total effectuée
- Tableau mis à jour lors de la création d'une commande
- Affichage des noms au lieu des indices
- Enregistrement dates raccourci
- Ajout de l'affichage des convois vers le joueur quand le C+ n'est pas activé