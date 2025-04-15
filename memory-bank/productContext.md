# Product Context: Outiiil

## Problem Solved
Le jeu Fourmizzz, bien que riche en fonctionnalités, manque de certains outils et d'une centralisation de l'information qui faciliteraient la gestion quotidienne et la stratégie à long terme pour les joueurs, en particulier au sein d'une alliance. Des tâches comme le suivi des activités, le partage d'informations clés, ou l'optimisation de certaines actions (chasse, flood) peuvent être répétitives ou nécessiter des calculs manuels.

## How it Should Work
Outiiil s'injecte dans les pages du jeu Fourmizzz pour :
1.  **Centraliser l'Information :** Afficher un aperçu rapide des pontes, constructions, recherches, et mouvements de troupes en cours dans une boîte dédiée.
2.  **Fournir des Outils Contextuels :** Ajouter des boutons, des calculateurs, et des aides visuelles sur les pages spécifiques (Armée, Ressources, Forum, Profils, etc.) pour simplifier les actions courantes.
3.  **Faciliter la Communication d'Alliance :** Permettre des actions coordonnées via le forum interne (ex: gestion SDC, partage de statistiques via la fonction "Recensement").

## User Experience Goals
- **Intégration Transparente :** L'extension doit s'intégrer visuellement et fonctionnellement au jeu sans être intrusive.
- **Gain de Temps :** Automatiser ou simplifier les tâches répétitives.
- **Aide à la Décision :** Fournir des informations calculées ou agrégées pour aider à la stratégie.
- **Fiabilité :** Les informations affichées et les actions effectuées doivent être précises et correspondre à l'état réel du jeu.

## Fonctionnalité "Recensement"
- **Besoin :** Les alliances demandent souvent à leurs membres de partager régulièrement leurs statistiques (ressources, niveaux, unités) pour la coordination et le suivi. Ce processus est manuel et fastidieux.
- **Solution :** Un bouton "Recensement" dans la boîte d'info globale permet, en un clic, de récupérer toutes les données pertinentes (via AJAX pour les unités, via le DOM/variables globales pour le reste) et de les poster automatiquement dans le sujet forum personnel du joueur au sein de la section "Outiiil_Membre" de l'alliance.
