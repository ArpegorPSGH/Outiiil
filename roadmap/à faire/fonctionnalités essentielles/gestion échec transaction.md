# Gestion échec transaction

## Objectifs
Créer un système de transaction pour assurer la cohérence du forum en cas d'erreur.

## Fonctionnement Détaillé
- Créer la notion de transaction
- Le début et la fin d'une transaction sont définis au sein d'une fonctionnalité
- En cas d'erreur, interrompre la transaction, et annuler toutes les modifications effectuées depuis son début :
    - Remettre les messages/titre de sujet des objets forum à leur état avant la transaction
    - Supprimer les objets forum créés pendant la transaction
    - Recréer les objets forum supprimés pendant la transaction
- Afficher un message d'erreur
- Lancer une erreur si le nombre de caractères de la chaîne d'enregistrement d'un objet titre de sujet dépasse 240
- Lancer une erreur si le nombre de caractères de la chaîne d'enregistrement d'un objet message dépasse la limite
- Indiquer les limites de caractères de message et titre de sujet dans la documentation


## Plan d'Implémentation

## Tests à effectuer

## Avancement