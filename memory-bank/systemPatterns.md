# System Patterns: Outiiil

## Architecture Générale
L'extension suit un modèle basé sur les **Content Scripts** de Chrome. Le script principal (`js/content.js`) est injecté dans les pages du domaine `fourmizzz.fr`.
## Technologies et Bibliothèques Clés
- **Type:** Extension Chrome (Manifest V2 actuellement)
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

1.  **Initialisation Globale (`content.js`)**:
    *   Vérifie si l'utilisateur est connecté.
    *   Charge les constantes du jeu et configure les bibliothèques (moment, numeral, datatables).
    *   Instancie l'objet `monProfil` (classe `Joueur`) qui représente l'utilisateur courant.
    *   Récupère les paramètres de l'extension et les données de base du joueur (profil, constructions, recherches) via `localStorage` ou des appels AJAX initiaux.
    *   Instancie et affiche les composants UI globaux (ex: `Dock`, `BoiteComptePlus`, `BoiteRadar`).
    *   Lance les fonctionnalités persistantes (ex: Traceur si activé).

2.  **Routing par Page (`content.js`)**:
    *   Détecte l'URL de la page courante (`location.pathname`, `location.search`).
    *   Instancie la classe `Page*` correspondante (ex: `PageArmee`, `PageForum`) en lui passant parfois des références aux boîtes globales (ex: `BoiteComptePlus`).
    *   Appelle la méthode `executer()` du module de page.

3.  **Logique Spécifique à la Page (`js/page/*.js`)**:
    *   La méthode `executer()` du module de page contient la logique spécifique :
        *   **Parsing DOM**: Extrait les informations pertinentes de la page HTML.
        *   **Calculs/Logique Métier**: Effectue les calculs nécessaires (ex: temps HOF, stats armée, simulation chasse).
        *   **Injection UI**: Ajoute les boutons, tableaux, ou modifications visuelles propres à cette page.
        *   **Gestion Événements**: Attache des écouteurs d'événements aux éléments ajoutés.
        *   **Mise à jour Données Globales**: Peut mettre à jour `monProfil` ou les données dans `localStorage` (ex: `PageArmee` qui pourrait sauvegarder les unités).

## Structure du Code
- **`manifest.json`**: Définit l'extension, les permissions, et les content scripts.
- **`js/content.js`**: Point d'entrée principal. Injecté dans les pages Fourmizzz. Gère l'initialisation globale, le routing basé sur l'URL, et charge les modules spécifiques.
- **`js/class/`**: Contient les classes de données et utilitaires (ex: `Joueur`, `Alliance`, `Armee`, `Utils`, `Parametre`). Modélise les entités du jeu et fournit des fonctions transverses.
- **`js/page/`**: Modules spécifiques à chaque page majeure de Fourmizzz (ex: `Armee.js`, `Forum.js`, `Construction.js`). Contiennent la logique pour parser la page et ajouter les fonctionnalités Outiiil.
- **`js/boite/`**: Modules gérant les composants UI ajoutés par Outiiil (ex: `Dock.js` pour la barre d'outils, `ComptePlus.js` pour la boîte d'infos globale, `BoiteRang.js` pour le popup de gestion de rang).
- **`js/lib/`**: Contient les bibliothèques JavaScript tierces.
- **`css/`**: Feuilles de style pour l'extension (`outiiil.css`, `toasts.css`) et les bibliothèques (`datatables.css`).
- **`images/`**: Icônes et autres ressources graphiques utilisées par l'extension.
- **`memory-bank/`**: Documentation interne (ce dossier).
4.  **Composants UI (`js/boite/*.js`)**:
    *   Chaque classe gère l'affichage (`afficher()`) et la logique interne d'un composant UI spécifique (ex: la boîte d'infos, la barre d'outils, les popups).
    *   Ces composants peuvent lire les données depuis `monProfil` ou `Utils` et interagir avec d'autres parties de l'extension (ex: `Dock` qui ouvre d'autres boîtes).
    *   La fonction "Recensement" est implémentée dans `BoiteComptePlus.js`.

5.  **Classes de Données (`js/class/*.js`)**:
    *   Modélisent les entités du jeu (`Joueur`, `Alliance`, `Armee`, `Commande`).
    *   Encapsulent les données et les méthodes associées (calculs, parsing, formatage).
    *   `Utils.js` fournit des accesseurs statiques pour les données globales extraites du DOM (`Utils.nourriture`, `Utils.terrain`, etc.) et des fonctions utilitaires (temps, formatage).
    *   `Parametre.js` gère la structure des paramètres de l'extension.

## Patterns Clés
- **Injection de Dépendances (Simple)**: Les modules de page reçoivent parfois des instances des boîtes globales via leur constructeur.
- **Module Pattern (via Classes ES6)**: Le code est organisé en classes, encapsulant état et comportement.
- **Observer Pattern (MutationObserver)**: Utilisé dans `PageForum` et `PageAlliance` pour détecter le chargement asynchrone de contenu et déclencher le traitement.
- **Accès Données Globales**: Via l'instance `monProfil` et la classe statique `Utils`.
- **Persistance**: Via `localStorage` pour les paramètres, le profil joueur, et l'état des évolutions.
- **Requêtes Asynchrones**: Utilisation de `$.ajax` (jQuery Promises) et `async/await` pour les appels réseau.

## Flux de Données (Exemple: Recensement)
## Contraintes Techniques
- **Dépendance à la Structure DOM de Fourmizzz:** Les sélecteurs jQuery utilisés pour le parsing sont sensibles aux changements de structure HTML du site Fourmizzz. Une mise à jour du jeu peut casser certaines fonctionnalités.
- **Manifest V2:** Si l'extension utilise toujours Manifest V2, une migration vers V3 sera nécessaire à terme.
1.  Clic sur bouton (`BoiteComptePlus`).
2.  Appel AJAX vers `/Armee.php`.
3.  Parsing de la réponse HTML via `Armee.parseHtml()`.
4.  Récupération des autres données via `Utils` et `monProfil`.
5.  Formatage du message.
6.  Vérification `monProfil.sujetForum`.
7.  Si ID absent:
    a. Récupération `idSection` depuis `monProfil.parametre`.
    b. Appel `forumManager.consulterSection(idSection)`.
    c. Parsing de la réponse pour trouver `idSujet`.
8.  Appel `forumManager.envoyerMessage(idSujet, message)`.
9.  Affichage notification (`$.toast`).
