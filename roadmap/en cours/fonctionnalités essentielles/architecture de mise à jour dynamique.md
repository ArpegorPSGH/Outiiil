# Architecture de mise à jour dynamique (Loader / Bootstrap)

## Objectifs
Mettre en place un système de mise à jour automatique, transparent et multi-plateformes (Windows, macOS, Linux, Android/Kiwi, iPhone/Orion) ne nécessitant ni modification des stratégies de registre système, ni élévation de privilèges administrateur, ni réinstallation manuelle, tout en préservant un flux de développement local isolé.

## Fonctionnement Détaillé

### 1. Organisation en 3 branches Git
- **Branche `dev` (Développement) :**
  - Contient l'intégralité du code source (scripts unitaires, documentation, roadmap, tests, `scripts/bundle_sources.json`).
  - Le flag `DEV_MODE` y est toujours activé (`true`) dans le chargeur : l'extension injecte directement les sources locales à chaque rechargement (F5) sans mise en cache ni interférence réseau.
  - Le dossier de distribution (`dist/`) n'y est pas conservé.
- **Branche `gh-pages` (Serveur / Publication dynamique) :**
  - Branche dédiée servie par GitHub Pages.
  - Contient les fichiers de distribution générés : `version.json`, `bundle.js`, `bundle.css` ainsi que le dossier des ressources visuelles (`dist/images/`) pour permettre la mise à jour des images et icônes sans réinstallation.
  - C'est cette branche que les navigateurs des utilisateurs interrogent en tâche de fond pour récupérer les mises à jour.
- **Branche `socle` (Distribution initiale / Releases GitHub) :**
  - Contient le socle minimal pour l'installation initiale des joueurs : `manifest.json`, `js/loader.js` (avec `DEV_MODE: false`) et le dossier `dist/` initial (incluant ses images/icônes).
  - Les releases GitHub et les archives `.zip` à destination des nouveaux utilisateurs sont créées à partir de cette branche.

### 2. Gestion de la Version et Exécution
1. **Numéro de version unique dans `manifest.json` :**
   - Le numéro de version officiel de l'application reste centralisé dans `manifest.json` sur `dev`.
   - Il est extrait directement depuis `manifest.json` par le code de l'extension (aussi bien en mode `dev` qu'en production) afin de garantir la cohérence d'affichage et de détection de version sur toutes les branches.
   - Le script de release lit également `manifest.json` pour renseigner la version dans `dist/version.json`.
2. **Démarrage instantané (Stale-While-Revalidate) :** Le loader injecte immédiatement le bundle CSS et JS depuis le cache local (`chrome.storage.local`).
3. **Vérification en tâche de fond :** Une requête asynchrone ultra-légère interroge GitHub Pages (`gh-pages/version.json`).
4. **Mise à jour silencieuse :** Si une version plus récente est disponible, le nouveau bundle (et les ressources associées) est téléchargé et enregistré dans le cache local pour la navigation suivante.
5. **Gestion de l'obsolescence critique :** En cas d'incompatibilité détectée sur le forum, l'utilisateur est invité à actualiser sa page (F5) pour charger la dernière version en cache.

### 3. Automatisation du processus de Release
Un script unique de release prend en charge le cycle complet :
1. Vérification que la branche courante est propre.
2. Lecture et validation du numéro de version depuis `manifest.json`.
3. Construction du bundle de distribution (`bundle.js`, `bundle.css`, `version.json` et copie des images vers `dist/images/`).
4. Publication du contenu de `dist/` sur la branche `gh-pages`.
5. Mise à jour de la branche `socle` avec le socle minimal (`manifest.json` synchronisé, `js/loader.js` avec `DEV_MODE: false`, et `dist/`).
6. Création du tag Git et de la Release GitHub (avec l'archive zip d'installation initiale).
7. Nettoyage de `dist/` local et retour sur la branche `dev` avec `DEV_MODE: true`.

## Plan d'Implémentation
1. **Mode développement dans le loader :**
   - Intégrer la bascule `DEV_MODE` dans `js/loader.js` pour charger directement les sources locales sans cache pendant le travail en dev.
2. **Script d'automatisation de Release :**
   - Concevoir le script (ex: Python/Bash) orchestrant la compilation, le push sur `gh-pages`, la mise à jour de la branche `socle` et la création de la release.
3. **Tests et validation :**
   - Valider le workflow de développement local sans interférence.
   - Tester l'exécution du script de release et la propagation de la mise à jour dynamique.

## Tests à effectuer
- [x] Vérifier que les modifications de fichiers sources en local sont prises en compte immédiatement en dev (F5).
- Vérifier que le script de release publie correctement sur `gh-pages` et met à jour `socle`.
- Vérifier que les clients en `DEV_MODE: false` détectent et appliquent automatiquement la mise à jour poussée sur `gh-pages`.
- Vérifier que le numéro de version s'incrémente bien
- Vérifier le comportement bloquant et le message adapté en cas d'incompatibilité de données forum.

## Avancement
- [x] Création du loader d'injection dynamique (`js/loader.js`).
- [x] Mise en place du bundle distant et du script de packaging initial (`scripts/build_bundle.py`).
- [x] Branchement de la synchronisation asynchrone dans `chrome.storage.local`.
- [x] Allégement du manifest (`manifest.json`) avec point d'entrée unique sur `loader.js`.
- [x] Ajout de la bascule `DEV_MODE` dans le loader pour l'isolation totale du développement (chargement direct des sources locales).
- [x] Inclusion des images et icônes dans `dist/images/` pour être servies dynamiquement.
- [x] Création du script d'orchestration de release multi-branches (`scripts/release.py` : compilation, déploiement sur `gh-pages`, mise à jour de `socle`, génération de l'archive `Outiiil-vX.Y.Z.zip` et tag de release).
- [x] Configuration de `.gitignore` pour exclure `dist/` de la branche `dev`.