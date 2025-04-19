# Decision Log: Outiiil

*Ce journal enregistre les décisions architecturales et techniques importantes prises au cours du développement de l'extension Outiiil.*

---
[2025-04-19 19:14:00] - **Architecture Initiale:** Choix d'une architecture basée sur les Content Scripts Chrome pour l'injection et l'interaction avec les pages Fourmizzz. Utilisation de `content.js` comme point d'entrée principal.
[2025-04-19 19:14:00] - **Routing par Page:** Mise en place d'un système dans `content.js` pour détecter la page courante et charger dynamiquement le module JavaScript correspondant (`js/page/*.js`).
[2025-04-19 19:14:00] - **Modélisation Objet:** Organisation du code en classes ES6 pour représenter les entités du jeu (`Joueur`, `Alliance`, `Armee`, etc.) et les composants UI (`Boite*`, `Page*`).
[2025-04-19 19:14:00] - **Bibliothèque Principale:** Adoption de jQuery comme bibliothèque principale pour la manipulation du DOM et les requêtes AJAX, malgré l'utilisation de ES6+.
[2025-04-19 19:14:00] - **Persistance des Données:** Utilisation de `localStorage` pour stocker les paramètres utilisateur (`outiiil_parametre`), les données du profil (`outiiil_joueur`), et l'état des évolutions (`outiiil_evolution`).
[2025-04-19 19:14:00] - **Gestion Contenu Asynchrone:** Utilisation de `MutationObserver` pour détecter l'ajout de contenu dynamique (ex: chargement du forum) et déclencher les traitements appropriés.
[2025-04-19 19:14:00] - **Gestion Données Globales:** Centralisation de l'accès aux données globales via l'instance `monProfil` (représentant le joueur connecté) et la classe utilitaire statique `Utils`.
[2025-04-19 19:14:00] - **Implémentation Recensement:** Choix de récupérer les unités via AJAX vers `/Armee.php` et les autres données via `Utils`/`monProfil`, puis de poster le tout via Xajax vers le sujet forum personnel du membre.
[2025-04-19 19:14:00] - **Refactoring Recensement:** Déplacement de la logique principale de la fonctionnalité Recensement depuis `BoiteComptePlus.js` vers `PageAlliance.js` pour une meilleure séparation des responsabilités.
[2025-04-19 19:14:00] - **Auto-Correction IDs Forum:** Mise en place d'un mécanisme de secours pour trouver les sections forum "Outiiil_Commande" et "Outiiil_Membre" par leur nom si l'ID sauvegardé est invalide ou manquant, afin de pallier la fragilité potentielle des IDs.
[2025-04-19 19:14:00] - **Fiabilisation Auto-Correction:** Remplacement de la recherche jQuery `:contains()` par une boucle `.each()` sur les spans avec comparaison insensible à la casse et ciblage plus précis de `#cat_forum` pour améliorer la robustesse de la détection par nom.
[2025-04-19 19:14:00] - **Correction Regex Auto-Correction:** Ajustement de l'expression régulière (`/forum(\d+)/`) utilisée pour extraire l'ID numérique de la classe CSS du span de la section forum pour correspondre au format réel observé.
[2025-04-18 10:33:00] - **Feedback Correction ID:** Ajout d'une notification `$.toast` pour informer l'utilisateur lorsqu'une correction/trouvaille d'ID de section forum a été effectuée automatiquement en arrière-plan.