# Annulation Fourmizzz lors d'un rollback de transaction

## Objectifs
Maintenir la cohérence entre les données sur Fourmizzz et celles dans Outiiil en cas d'annulation d'une transaction

## Fonctionnement Détaillé
- S'applique aux Convois, Attaques et Chasses
- Retrait du finally pour mettre son contenu à la fin de la fonction
- Etendre la transaction à toute la fonction de post de l'objet après rechargement, hors suppression des entrées du localStorage
- Appliquer les précédents principes à la fonction d'annulation après rechargement de l'objet
- A l'issue de l'annulation de la transaction, dans la fonctionnalité, vérifier si des objets d'une de ces classes se trouvent dans la liste de créations
- Si c'est le cas, récupérer la liste des objets Fourmizzz présents sur la page
- Pour chaque objet récupéré de la liste de créations, s'il est présent sur la page (match id), cliquer sur son lien d'annulation
- Rendre l'action sécurisée réentrante si elle est appelée par une autre action sécurisée

## Plan d'Implémentation

## Tests à effectuer
- Lancer une erreur dans la fonction de post de l'objet et vérifier qu'il est bien annulé sur Fourmizzz

## Avancement
- Annulation de convoi validé