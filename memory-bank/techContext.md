# Tech Context: Outiiil

## Technologies Used
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

## Development Setup
Le développement se fait principalement en JavaScript. L'extension est chargée localement dans le navigateur Chrome pour les tests.

## Technical Constraints
- **Dépendance à la Structure DOM de Fourmizzz:** Les sélecteurs jQuery utilisés pour le parsing sont sensibles aux changements de structure HTML du site Fourmizzz. Une mise à jour du jeu peut casser certaines fonctionnalités.
- **Manifest V2:** Si l'extension utilise toujours Manifest V2, une migration vers V3 sera nécessaire à terme.

## Tool Usage Patterns
- Utilisation intensive de jQuery pour la manipulation du DOM et les requêtes AJAX.
- Utilisation de bibliothèques dédiées pour des tâches spécifiques (dates, nombres, tableaux, graphiques, UI).
- Persistance des données via `localStorage`.
- Utilisation de `MutationObserver` pour détecter les chargements de contenu asynchrones.
- Utilisation de `async/await` pour la gestion des opérations asynchrones.
