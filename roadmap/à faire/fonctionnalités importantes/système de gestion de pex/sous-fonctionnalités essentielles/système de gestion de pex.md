# Système de gestion de pex

## Objectifs
Permettre aux joueurs de communiquer et s'organiser facilement pour donner des troupes en sacrifice, sans qu'il y ait de télescopage d'armées.

## Fonctionnement Détaillé
- Possibilité d’opt-in/out
- Pour chaque unité hors ouvrières, proposer de définir un nombre et préciser s’il est gardé ou donné
- Si donné, le nombre exposé sera le minimum entre le nombre réel et ce nombre
- Si gardé, le nombre exposé sera le maximum entre 0 et le nombre réel moins ce nombre
- Les joueurs participant et leurs unités exposées ainsi que les demandes en cours, et leurs niveaux de bouclier, loge et armes seront affichées dans un tableau
- Un joueur pourra effectuer une demande auprès d’un autre dont les montants sont inférieurs ou égaux aux disponibles (égaux par défaut) en précisant ses horaires (précision à la minute) de disponibilité pour lancer (demande modifiable ou annulable à tout moment)
- Les joueurs pouvant donner/recevoir sont décidés par le conseil
- Un joueur pourra accepter ou refuser une demande d’un autre et elle pourra être supprimée par le conseil
- Si la demande est refusée, elle disparaît du tableau
- Si elle est acceptée, une liste de cibles à portée vers lesquelles le temps de trajet est compatible avec la disponibilité précisée dans la demande est affichée (triée selon l’ordre décroissant de durée de chevauchement des disponibilités), et le joueur en choisi une. Les montants demandés sont ensuite placés en loge, et le reste est envoyé en ghost sur la cible. La plage horaire de ghost est ensuite envoyée sur la demande après 2 min s’il n’est pas annulé. Si la cible est interne, l’attaque est mise dans le tableau des floods en cours. S’il n’y a aucune cible possible, un message d’information est affiché et le processus est interrompu. 
- Le joueur ayant effectué la demande peut maintenant, via sa demande, visualiser la plage horaire de lancement compatible avec le ghost (précision à la minute), et accéder à la page d’attaque vers l’autre joueur, si l’horaire actuel est dans cette plage. Sur la page d’attaque, au-dessus du bouton de lancement est précisée la plage horaire en vert si à l’intérieur, en orange s’il reste moins d’une minute, et en rouge si à l’extérieur.
- Utiliser la fonction d'optimisation des troupes à envoyer fournie par le simulateur de combat (une fois implémentée)
- La demande est clôturée lorsque les deux rapports d’attaque sont confirmés à l’issue du ghost.
- Les unités disponibles sont mises à jour (recensement)

## Plan d'Implémentation

## Avancement