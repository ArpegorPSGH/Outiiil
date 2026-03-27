# Récupérations

## Objectifs
Gérer les ghosts/vols de TdC de l'alliance ou de joueurs extérieurs.

## Fonctionnement Détaillé
- Système de suivi des soldes sur chaque alli/joueur (dans les deux sens) :
    - Via le message de rapport au moment de l'impact
    - Via un tracé du TdC de l'alliance :
        - Identifier le/les joueurs extérieurs concernés si possible
        - Tracer le TdC des joueurs ayant eu une variation dans le même sens que l'alliance
        - Si la quantité extérieure correspond à celle globale de l'alliance, identifier les joueurs lanceur et cible
    - Avant de mettre à jour le système, vérifier la cohérence/match avec les données déjà postées :
        - Si match :
            - Via un rapport : remplacer
            - Via tracé : ignorer
        - Si pas de match :
            - Via un rapport : poster
            - Via tracé : poster les infos disponibles
        - Si incohérent :
            - Via un rapport : poster et déplacer la partie incohérente vers un objet dédié pour vérification manuelle
            - Via tracé : poster dans l'objet dédié pour vérification manuelle
    - Si c'est un allié, récupération possible sur toute son alliance (possibilité de restreindre la récupération sur certains joueurs de l'alliance uniquement)
    - Sinon, récupération possible seulement sur lui
    - En cas de TdC évacué ailleurs, utilisation manuelle du tracé en cascade et contact des joueurs concernés
    - Ajout manuel à la liste des cibles surlesquelles récupérer ou qui peuvent récupérer
    - Fusion manuelle de soldes de récupération
    - Récupération de l'extérieur possible sur tous les joueurs de l'alliance
- Système de tracking des joueurs à portée sur lesquels récupérer
- Système de lancement de floods borné par les quantités à récupérer
- Prendre en compte les récups en cours, si elles vont toucher
- Système de lancement de ghosts

## Plan d'Implémentation

## Tests à effectuer

## Avancement