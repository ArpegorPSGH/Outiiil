# Project Brief: Outiiil Fourmizzz Extension

## Core Goal
Outiiil est une extension Chrome conçue pour améliorer l'expérience utilisateur sur le jeu de stratégie en ligne Fourmizzz. Elle vise à fournir des outils, des automatisations et des affichages d'informations supplémentaires non disponibles nativement dans le jeu.

## Key Features
- **Boîte d'informations globale :** Affiche un résumé des activités en cours (pontes, constructions, recherches, mouvements de troupes).
- **Outils spécifiques aux pages :** Fonctionnalités ajoutées sur les pages Armée, Ressources, Forum, etc. (ex: aide au flood, calcul de chasse, gestion SDC).
- **Paramètres personnalisables :** Permet à l'utilisateur de configurer certains aspects de l'extension.
- **Fonctionnalité "Recensement" (récente) :** Ajoute un bouton dans la boîte globale pour permettre aux joueurs de poster leurs statistiques (ressources, niveaux, unités) sur un sujet de forum dédié de leur alliance.

## Scope
L'extension interagit principalement avec l'interface web de Fourmizzz via des content scripts. Elle parse le DOM, effectue des requêtes AJAX (y compris vers le forum interne) et stocke certaines données localement (`localStorage`).
