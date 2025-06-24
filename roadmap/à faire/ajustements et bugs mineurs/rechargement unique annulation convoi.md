# Rechargement unique annulation convoi

## Objectifs
Eviter le double rechargement pour l'annulation d'un convoi s'il est hors système.

## Fonctionnement Détaillé
- Chercher le convoi sur le forum dès le clic initial.
- S'il n'est pas présent, interrompre la procédure là et rediriger sur le lien d'annulation pour le rechargement.
- S'il est présent, l'enregistrer dans le localStorage à la place des données actuelles.
- Poursuivre le traitement en utilisant le convoi enregistré.

## Plan d'Implémentation

## Tests à effectuer

## Avancement