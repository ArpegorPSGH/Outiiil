# Séparation fonctionnalités alliance

## Objectifs
Rendre les fonctionnalités sur la page alliance indépendantes les unes des autres.

## Fonctionnement Détaillé
- Séparer ajout boutons base tableau, comptage état, stats alliance, et indications adversaires à portée, exécutés quoi qu'il arrive
- Séparer de traitementMembre en une fonction distincte le code de la fonctionnalité de recensement
- Préserver le comportement lié à la présence ou non d'un sujet membre, l'existence de la section et celui lié aux droits d'administration
- Lancer cette fonction depuis executer
- L'encapsuler avec checkVersion
- Sur la page membres, les droits d'administration Fourmizzz by-passent les droits Outiiil.

## Plan d'Implémentation

## Tests à effectuer
- Pour chaque niveau de restriction de version, tester le blocage ou fonctionnement correct de chaque fonctionnalité (+ message)
- S'assurer du bon comportement lié à la présence ou non d'un sujet membre, l'existence de la section et celui lié aux droits d'administration

## Avancement