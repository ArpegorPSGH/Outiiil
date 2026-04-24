# Enregistrement version extension joueur

## Objectifs
Au démarrage de l'extension, enregistrer sur le forum la version de l'extension du joueur.

## Fonctionnement Détaillé
- La version de l'extension est automatiquement vérifiée et mise à jour lors du rafraîchissement d'un objet `Joueur` si celui-ci correspond au joueur courant et qu'il est lié à un sujet sur le forum.

## Plan d'Implémentation
1. [x] Créer la classe de paramètre `VersionExtension`.
2. [x] Ajouter le paramètre à la classe `Joueur`.
3. [x] Intégrer la logique de mise à jour et d'enregistrement automatique dans `Joueur.completerRafraichissement()`. Cela permet de déclencher l'enregistrement dès que le profil du joueur est chargé depuis le forum (par exemple lors d'une vérification de droits ou de membre).

## Tests à effectuer
- [ ] Vérifier que la version est mise à jour sur le forum lors de l'initialisation d'une fonctionnalité d'alliance.

## Avancement
- [x] Implémenté (version optimisée intégrée au cycle de vie de l'objet).