# Système d'anti-collision forum

## Objectifs
Empêcher les collisions de plusieurs clients sur un même sujet. A n'ajouter qu'en cas de collision avérée.

## Fonctionnement Détaillé
- Utiliser un marqueur à ajouter au titre d'un sujet pour savoir s'il est en cours d'utilisation par un client
1. Au moment du rafraichissement d'un objet avant sa modification, vérifier que ce sujet n'est pas déjà en cours de traitement par un autre client
2. Si c'est le cas, attendre sa libération
3. Lorsqu'il est disponible, le lire et marquer le sujet pour le réserver
4. A l'issue du traitement, si le sujet est toujours réservé par le client, le mettre à jour et le libérer
5. Sinon, il y a eu collision au moment de la réservation, et il faut reprendre à l'étape 2.
- Retenter l'opération complète depuis le début en cas de collision pour ne pas rater de changement de situation
- Résoudre problème mélange des marqueurs au moment de la réquisition causant état inconsistant
- Résoudre problème attente indéfinie si un joueur ne termine jamais son opération
- Ce système devrait être plus robuste et pouvoir remplacer celui avec les verrous?
- Ce système remplacera l'anticollision au niveau des transactions

## Plan d'Implémentation

## Tests à effectuer

## Avancement