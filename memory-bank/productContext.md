# Product Context: Outiiil

## Problem Solved
Le jeu Fourmizzz, bien que riche en fonctionnalités, manque de certains outils et d'une centralisation de l'information qui faciliteraient la gestion quotidienne et la stratégie à long terme pour les joueurs, en particulier au sein d'une alliance. Des tâches comme le suivi des activités, le partage d'informations clés, ou l'optimisation de certaines actions (chasse, flood) peuvent être répétitives ou nécessiter des calculs manuels.

## How it Should Work
Outiiil s'injecte dans les pages du jeu Fourmizzz pour :
1.  **Centraliser l'Information :** Afficher un aperçu rapide des pontes, constructions, recherches, et mouvements de troupes en cours dans une boîte dédiée.
2.  **Fournir des Outils Contextuels :** Ajouter des boutons, des calculateurs, et des aides visuelles sur les pages spécifiques (Armée, Ressources, Forum, Profils, etc.) pour simplifier les actions courantes.
3.  **Faciliter la Communication d'Alliance :** Permettre des actions coordonnées via le forum interne (ex: gestion SDC, partage de statistiques via la fonction "Recensement").
4.  **Permettre la Personnalisation :** Offrir des paramètres configurables par l'utilisateur.

## Fonctionnalités Clés (Détails)
- **Boîte d'informations globale (`BoiteComptePlus`) :** Affiche un résumé des activités en cours (pontes, constructions, recherches, mouvements de troupes).
- **Outils spécifiques aux pages (`js/page/*`) :**
    - **Armée :** Aide au flood, simulateurs.
    - **Ressources :** Optimisation des échanges.
    - **Forum :** Gestion SDC (Système de Défense Coordonnée), préparation de guerre.
    - **Chasse :** Calculateur de rentabilité.
    - **Profils :** Affichage d'informations supplémentaires.
    - **Alliance :** Fonctionnalité "Recensement".
- **Paramètres personnalisables (`BoiteParametres`) :** Permet à l'utilisateur de configurer certains aspects de l'extension (ex: IDs forum, options d'affichage).
- **Barre d'outils (`Dock`) :** Accès rapide aux différentes boîtes et fonctionnalités.
- **Radar & Traceur :** Suivi des mouvements de flottes (si activé).

## User Experience Goals
- **Intégration Transparente :** L'extension doit s'intégrer visuellement et fonctionnellement au jeu sans être intrusive.
- **Gain de Temps :** Automatiser ou simplifier les tâches répétitives.
- **Aide à la Décision :** Fournir des informations calculées ou agrégées pour aider à la stratégie.
- **Fiabilité :** Les informations affichées et les actions effectuées doivent être précises et correspondre à l'état réel du jeu.

## Scope Technique (Résumé)
L'extension interagit principalement avec l'interface web de Fourmizzz via des **content scripts** Chrome. Elle **parse le DOM** pour extraire des informations, effectue des **requêtes AJAX** (y compris vers le forum interne pour des actions comme le Recensement ou la gestion SDC) et stocke certaines données et paramètres localement via **`localStorage`**.

## Fonctionnalité "Recensement"
- **Besoin :** Les alliances demandent souvent à leurs membres de partager régulièrement leurs statistiques (ressources, niveaux, unités) pour la coordination et le suivi. Ce processus est manuel et fastidieux.
- **Solution :** Un bouton "Recensement" (maintenant situé sur la page Alliance) permet, en un clic, de récupérer toutes les données pertinentes (unités via AJAX vers `/Armee.php`, reste via `Utils`/`monProfil`) et de les poster automatiquement dans le sujet forum personnel du joueur au sein de la section "Outiiil_Membre" de l'alliance.
