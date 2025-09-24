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
- Lors de l'actualisation de l'alliance, initialiser l'alliance de rattachement du Joueur.
- Considérer uniquement les joueurs sur le forum comme membre de l'alliance, et ceux sur la page alliance comme de simples joueurs s'ils ne sont pas sur le forum, chargés via leur pseudo (le chargement local ne doit pas être bloqué par l'absence d'id sujet)
- Redéfinir conditions d'accès à l'actualisation d'alliance, à chaque colonne supplémentaire, au recensement, et à chaque modification de rang (voir roadmap)(combinaison de niveau de droits, données publiques (attributs purs) ou données privées (au moins un paramètre), et membre de l'alliance ou non)(Définir un getter booléen pour l'affichage de la colonne)

## Plan d'Implémentation

## Tests à effectuer
- Pour chaque niveau de restriction de version, tester le blocage ou fonctionnement correct de chaque fonctionnalité (+ message)
- S'assurer du bon comportement lié à la présence ou non d'un sujet membre, l'existence de la section et celui lié aux droits d'administration

## Avancement