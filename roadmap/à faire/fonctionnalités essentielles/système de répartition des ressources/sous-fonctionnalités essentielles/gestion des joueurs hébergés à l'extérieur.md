# Gestion des joueurs hébergés à l'extérieur

## Objectifs
Afin de pouvoir maintenir en permanence le système de répartition des ressources, les données des joueurs doivent être récupérées même s'ils sont temporairement hébergés à l'extérieur.

## Fonctionnement Détaillé
- Au chargement de la page membres de l’alliance, si un joueur dans la section membres n’est pas dans le tableau de base, aller récupérer ses données dans la BDD et l’ajouter au tableau avec son Tag d'alliance à côté de son pseudo, en permettant l'accès et la modification des données de son statut (rang, coefficient, etc...) avec les droits d'administration
- De la même manière, pour le joueur hébergé, ajouter au tableau des membres de l'alliance hébergeuse les joueurs de l'alliance d'origine qui n'y sont pas avec leurs Tags d'alliance à côté de leurs pseudos, mais sans accès aux données de statut puisqu'il n'aura pas les droits d'administration

## Plan d'Implémentation

## Avancement