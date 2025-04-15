# Technical Context: Outiiil

## Core Technologies
- **Type:** Extension Chrome (Manifest V2 actuellement, basé sur la structure des fichiers)
- **Langage Principal:** JavaScript (ES6+)
- **Bibliothèques Frontend Clés:**
    - jQuery (manipulation DOM, AJAX)
    - Moment.js (manipulation dates/heures)
    - Numeral.js (formatage nombres)
    - DataTables (tri/filtrage tableaux)
    - Highcharts (graphiques, ex: historique joueur)
    - jQuery UI (widgets UI comme tooltips, progressbar, autocomplete)
    - jQuery Toast (notifications)
- **Styling:** CSS

## Code Structure
- **`manifest.json`**: Définit l'extension, les permissions, et les content scripts.
- **`js/content.js`**: Point d'entrée principal. Injecté dans les pages Fourmizzz. Gère l'initialisation globale, le routing basé sur l'URL, et charge les modules spécifiques.
- **`js/class/`**: Contient les classes de données et utilitaires (ex: `Joueur`, `Alliance`, `Armee`, `Utils`, `Parametre`). Modélise les entités du jeu et fournit des fonctions transverses.
- **`js/page/`**: Modules spécifiques à chaque page majeure de Fourmizzz (ex: `Armee.js`, `Forum.js`, `Construction.js`). Contiennent la logique pour parser la page et ajouter les fonctionnalités Outiiil.
- **`js/boite/`**: Modules gérant les composants UI ajoutés par Outiiil (ex: `Dock.js` pour la barre d'outils, `ComptePlus.js` pour la boîte d'infos globale, `BoiteRang.js` pour le popup de gestion de rang).
- **`js/lib/`**: Contient les bibliothèques JavaScript tierces.
- **`css/`**: Feuilles de style pour l'extension (`outiiil.css`, `toasts.css`) et les bibliothèques (`datatables.css`).
- **`images/`**: Icônes et autres ressources graphiques utilisées par l'extension.
- **`memory-bank/`**: Documentation interne (ce dossier).

## Interaction avec Fourmizzz
- **Parsing DOM:** Utilisation intensive de jQuery pour sélectionner des éléments HTML des pages Fourmizzz et en extraire des données.
- **Injection UI:** Ajout d'éléments HTML (boutons, boîtes d'info, tableaux) dans les pages Fourmizzz.
- **Appels AJAX:**
    - Requêtes vers les pages Fourmizzz pour récupérer des informations non présentes sur la page actuelle (ex: `/Armee.php` depuis la boîte `ComptePlus`).
    - Requêtes Xajax vers le forum interne pour lire et poster des messages/sujets (`alliance.php?forum_menu`).
- **Stockage Local:** Utilisation de `localStorage` pour sauvegarder les paramètres de l'utilisateur (`outiiil_parametre`), les données du profil joueur (`outiiil_joueur`), et l'état des activités en cours (`outiiil_evolution`).

## Contraintes Techniques
- **Dépendance à la Structure DOM de Fourmizzz:** Les sélecteurs jQuery utilisés pour le parsing sont sensibles aux changements de structure HTML du site Fourmizzz. Une mise à jour du jeu peut casser certaines fonctionnalités.
- **Manifest V2:** Si l'extension utilise toujours Manifest V2, une migration vers V3 sera nécessaire à terme.
- **Gestion Asynchrone:** Utilisation de Promises (via jQuery `$.ajax`, `Promise.all`) et de `async/await` (dans la fonction Recensement) pour gérer les opérations asynchrones (AJAX).
