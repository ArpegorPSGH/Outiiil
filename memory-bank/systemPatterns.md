# System Patterns: Outiiil

## Architecture Générale
L'extension suit un modèle basé sur les **Content Scripts** de Chrome (Manifest V2 probable, à vérifier/migrer). Le script principal (`js/content.js`) est injecté dans les pages du domaine `fourmizzz.fr`.

1.  **Initialisation Globale (`content.js`)**:
    *   Vérifie si l'utilisateur est connecté.
    *   Charge les constantes du jeu et configure les bibliothèques clés : jQuery, Moment.js, Numeral.js, DataTables, Highcharts, jQuery UI, jQuery Toast.
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
- **Persistance**: Via `localStorage` pour les paramètres (`outiiil_parametre`), le profil joueur (`outiiil_joueur`), et l'état des évolutions (`outiiil_evolution`).
- **Requêtes Asynchrones**: Utilisation de `$.ajax` (jQuery Promises) et `async/await` pour les appels réseau.
- **Auto-Correction IDs Forum (Corrigée) (`Forum.js`)**:
    - La fonction `checkAndCorrectForumId` (appelée dans `traitementSection` lorsque `#cat_forum` est détecté) vérifie la validité des IDs des sections "Outiiil_Commande" et "Outiiil_Membre".
    - **Fiabilité améliorée :**
        - Cible explicitement `#cat_forum`.
        - Vérifie d'abord l'existence par ID (`span.forum_ID`).
        - Si non trouvé par ID (ou ID manquant), utilise une boucle `.each()` sur `span[class^='forum']` avec comparaison de texte insensible à la casse pour trouver par nom.
        - Extrait l'ID de la classe (`forum_(\d+)`) et met à jour `monProfil.parametre` si une correction est nécessaire.
        - Loggue des informations de débogage détaillées.

## Flux de Données (Exemple: Recensement - *Maintenant dans Alliance.js*)
1.  Clic sur bouton (`PageAlliance`).
2.  Appel AJAX vers `/Armee.php`.
3.  Parsing de la réponse HTML via `Armee.parseHtml()`.
4.  Récupération des autres données via `Utils` et `monProfil`.
5.  Formatage du message.
6.  Vérification `monProfil.sujetForum` (ID du *sujet* personnel, pas de la *section*).
7.  Si ID du sujet absent:
    a. Récupération `idSectionMembre` depuis `monProfil.parametre["forumMembre"]` (qui est potentiellement auto-corrigé si l'utilisateur a visité le forum avant).
    b. Appel `forumManager.consulterSection(idSectionMembre)`.
    c. Parsing de la réponse pour trouver l'`idSujet` correspondant au pseudo du joueur.
8.  Appel `forumManager.envoyerMessage(idSujet, message)`.
9.  Affichage notification (`$.toast`).

---
# System Patterns: Outiiil (2025-04-18)

## Patterns Clés (Ajouts)
- **Notification Utilisateur (Feedback Arrière-plan):**
    - Utilisation de `$.toast` (via `jquery-toast`) pour fournir un retour visuel à l'utilisateur lorsqu'une action automatique en arrière-plan réussit, comme la correction d'un ID de section forum (`js/page/Forum.js`). Cela améliore la transparence sans interrompre le flux de l'utilisateur.
    - Les configurations de toast (ex: `TOAST_SUCCESS`, `TOAST_ERROR`) sont probablement définies globalement (à vérifier, potentiellement dans `content.js` ou un fichier de constantes) pour assurer la cohérence visuelle.

## Contraintes Techniques Connues
- **Dépendance Forte au DOM:** La majorité des fonctionnalités repose sur le parsing HTML via des sélecteurs jQuery, rendant l'extension vulnérable aux mises à jour de l'interface de Fourmizzz.
- **Manifest V2:** Si confirmé, une migration vers Manifest V3 sera nécessaire à terme, impliquant potentiellement des refactorisations importantes (ex: Service Worker).
- **Gestion de l'Asynchronisme:** Bien que Promises et `async/await` soient utilisés, la complexité des interactions AJAX (jeu + forum) nécessite une gestion rigoureuse pour éviter les race conditions ou les erreurs.
