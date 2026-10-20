# Architecture de mise à jour dynamique (Bootstrapper / Runtime)

## Objectifs
Mettre en place un système de mise à jour automatique, transparent et multi-plateformes (Windows, macOS, Linux, Android/Kiwi, iPhone/Orion) ne nécessitant ni modification des stratégies de registre système, ni élévation de privilèges administrateur, ni réinstallation manuelle, tout en préservant un flux de développement local isolé.

## Architecture en 2 niveaux

L'extension utilise une architecture en deux niveaux :

1. **Bootstrapper (socle)** — installé une fois, stable pour la vie de l'extension :
   - `manifest.json` — manifeste MV3 (version officielle centrale, point d'entrée unique : `js/bridge.js`)
   - `js/background.js` — service worker (statique) : RPC dispatcher générique + coordinateur de mise à jour
   - `js/bridge.js` — content script (monde isolé) : pont communication MAIN ↔ background + gestion des toasts
   - `icons/` — icônes d'extension

2. **Runtime dynamique** — mis à jour depuis GitHub Pages (`release`), caché localement dans `chrome.storage.local` :
   - `dist/runtime.js` — bundle JS (`browserAPI.js` + `runtime_init.js` + bibliothèques + classes + `main.js`), avec version et table de sources pour le débogage des stack traces
   - `dist/runtime.css` — styles concaténés
   - `dist/version.json` — version, sha256, socle_hash, liste des fichiers, timestamp
   - `dist/images/` — images et icônes servies dynamiquement

### Organisation Git

- **Branche `dev` (développement)** : contient l'intégralité du code source (`manifest.json`, `js/`, `css/`, `images/`, `bundle_sources.json`, scripts, tests, roadmap). La constante `DEV_MODE` est activée (`true`) dans `js/background.js`. Le dossier `dist/` est exclu par `.gitignore` et n'y est jamais conservé. Le chargeur injecte directement les sources locales à chaque rechargement (F5) sans mise en cache ni interférence réseau.
- **Branche `release` (publication dynamique)** : servie par GitHub Pages. Contient uniquement le dossier `dist/` (runtime.js, runtime.css, version.json, images/). C'est cette branche que les navigateurs des utilisateurs interrogent en tâche de fond pour récupérer les mises à jour.
- **Archive zip de release (socle initial)** : générée par `scripts/release.py` à partir du code source `dev`. Contient `manifest.json`, `js/background.js` (avec `DEV_MODE: false` et `SOCLE_HASH` patché), `js/bridge.js`, et `icons/`. Publiée comme asset de release GitHub pour l'installation initiale des nouveaux utilisateurs.

## Gestion de la version et exécution

### 1. Numéro de version unique

- Le numéro de version officiel de l'application est centralisé dans `manifest.json` sur `dev`.
- Le script de release (`build_bundle.py`) le lit et le bake dans `runtime.js` sous `window.__OUTIIIL_RUNTIME_VERSION`.
- `dist/version.json` stocke la version du runtime + sha256 du dist/ + socle_hash + liste des images.
- `SOCLE_HASH` est calculé par `build_bundle.py` à partir de `manifest.json` + `js/background.js` + `js/bridge.js` (normalisés). Ce hash est patché dans `js/background.js` du zip socle au moment de la release.
- `main.js` lit la version via `runtime_init.js` → `RUNTIME_INFO` RPC (storage) → fallback `manifest.json` (toujours disponible localement).

### 2. Démarrage instantané (Stale-While-Revalidate)

- **DEV_MODE** : `background.js` enregistre via `chrome.userScripts.register()` chaque fichier source listé dans `bundle_sources.json` comme entrée `file:` individuelle. Le CSS est concaténé depuis les fichiers locaux. F5 recharge directement les sources, sans cache ni interférence réseau.
- **PROD_MODE** : le runtime précédemment téléchargé est stocké dans `chrome.storage.local` (`outiiil_runtime_code`, `outiiil_runtime_css`, `outiiil_runtime_version`). Le service worker le register/update immédiatement via `chrome.userScripts.register()` / `chrome.userScripts.update()` avec `world: "MAIN"`, `runAt: "document_start"`. Le jeu démarre sans attendre la vérification réseau — le runtime en cache est exécuté immédiatement, la vérification se fait en arrière-plan.

### 3. Vérification en tâche de fond

Le service worker interroge `release/version.json` (avec cache-busting `?_t=...`) :
- Au démarrage du service worker (`onStartup`)
- À l'installation/mise à jour de l'extension (`onInstalled`)
- À chaque navigation vers fourmizzz.fr (`tabs.onUpdated` en DEV_MODE — re-register forcé)
- Toutes les 60 secondes (`UPDATE_CHECK_INTERVAL_MS`) en PROD_MODE

### 4. Mise à jour silencieuse

- Si `remoteVersion > storedVersion`, le nouveau `runtime.js`, `runtime.css` et les images sont téléchargés en parallèle.
- Le **SHA-256 combiné** est vérifié : fichiers triés, préfixe `dist/<chemin>\n` + contenu binaire, hashé via `crypto.subtle.digest`. Comparé contre `version.json.sha256`.
  - En cas d'échec de hash, le runtime précédemment mis en cache est conservé (fallback) ou une erreur est notifiée.
- Le code, le CSS, la version et les images sont persistes dans `chrome.storage.local`.
- Le user script est mis à jour via `chrome.userScripts.update()`.
- Les statuts (in_progress, success, error, blocked) sont notifiés aux onglets via `chrome.tabs.sendMessage` → le bridge les relaie au monde MAIN pour l'affichage des toasts.

### 5. Gestion de l'obsolescence du socle (socle_hash)

- Le `SOCLE_HASH` local (baked dans `background.js` au moment de la release) est comparé au `socle_hash` de `version.json` distant.
- Si un mismatch est détecté, le socle (manifest + background + bridge) a changé entre la version installée et le runtime disponible. Le runtime distant peut utiliser des APIs background/bridge inexistantes dans l'ancien socle.
- Le service worker recherche alors un commit compatible dans l'historique de `release` (jusqu'à 100 commits via l'API GitHub) dont le `socle_hash` correspond à celui du socle installé.
- Si un commit compatible est trouvé, le runtime est téléchargé depuis `raw.githubusercontent.com/<owner>/<repo>/<sha>/dist/` 
- Une notification "blocked" avec un bouton **Télécharger** et **Voir les releases** est affichée.

### 6. Coordination de rechargement (transaction-safe)

- `runtime_init.js` (monde MAIN) compare `window.__OUTIIIL_RUNTIME_VERSION` (version en cours d'exécution) avec la version disponible (via `CHECK_UPDATE` RPC au background).
- Si elles diffèrent et que la version stockée ≠ version en cours, une mise à jour est en attente. Le runtime notifie le bridge via `OUTIIIL_SHOW_PENDING`.
- Le rechargement de page n'a lieu qu'au **point sûr** : `Transaction.js` expose `window.__outiiilTransactionActive` et dispatch `outiiil:transaction:end` quand aucune transaction n'est active. Le runtime écoute cet événement + le message `OUTIIIL_RELOAD_NOW` pour demander le rechargement au bridge.
- Le bridge exécute `location.reload()` après avoir affiché le toast "reloading".
- Si le rechargement est refusé (beforeunload), le runtime est déjà en cache et s'appliquera à la prochaine navigation.

## Communication inter-mondes

```
MAIN world (runtime.js)              Isolated world (bridge.js)             Background (SW)
┌───────────────────────────────────┐  ┌───────────────────────────────────┐  ┌───────────────────────────────────┐
│ window.browserAPI (proxy RPC)     │  │                                   │  │                                   │
│ postMessage(OUTIIIL_RPC_REQUEST) │──→│ message listener                  │──→│ chrome.runtime.sendMessage       │
│                                   │  │   → forwards CHROME_API_CALL      │  │   → dispatchChromeApiCall()       │
│                                   │  │   ← responds OUTIIIL_RPC_RESPONSE │←──│   ← sendResponse()                │
│                                   │  │   ← OUTIIIL_UPDATE_STATUS         │←──│   ← chrome.tabs.sendMessage()     │
│                                   │  │     (toast rendering)             │  │                                   │
│                                   │  │                                   │  │                                   │
│                                   │  │   ← OUTIIIL_BRIDGE_READY          │  │   (bridge queries DEV_MODE)       │
│                                   │  │   ← OUTIIIL_DEV_MODE              │  │                                   │
│                                   │  │   ← OUTIIIL_UPDATE_AVAILABLE      │  │                                   │
│                                   │  │   ← OUTIIIL_RUNTIME_READY         │  │                                   │
│                                   │  │   ← OUTIIIL_RELOAD_NOW            │  │                                   │
└───────────────────────────────────┘  └───────────────────────────────────┘  └───────────────────────────────────┘
```

Le proxy `browserAPI.js` transforme n'importe quelle chaîne de propriétés (`chrome.storage.local.get`, `chrome.tabs.query`, etc.) en un appel RPC. Les namespaces d'événements (`*.on*`) sont gérés avec `addListener`/`removeListener`/`hasListener` et un `cbId` de corrélation.

## Sécurité des appels API

- `background.js` expose un RPC dispatcher générique qui résout dynamiquement n'importe quel chemin `chrome.*` / `browser.*`.
- Les chemins blacklistés (`extension`, `i18n`, `test`, `devtools`, `debugger`, `system`, `management`, `identity`, `certificateProvider`, `pkcs8Token`, `vpnProvider`, `wallpaper`, `enterprise.platformKeys`, `offscreen`, `declarativeNetRequest*`) sont bloqués.
- `runtime.sendMessage` est intercepté et traité comme une RPC interne (`CHECK_UPDATE`, `RUNTIME_INFO`, `LOG_ERROR`, `LOG_INFO`), évitant la boucle de broadcast.
- Les réponses sont sérialisées via `wrapForSerialization()` qui gère les promesses, fonctions, symboles et bigints.

## Table de sources pour le débogage en production

- `build_bundle.py` insère `window.__OUTIIIL_SOURCES` au début de `runtime.js` : une table de correspondance `[{f: "chemin/source.js", s: ligne_début}]` permettant au `Logger` de traduire les frames de stack production (UUID:N générées par V8 pour les user scripts) vers le fichier source et la ligne d'origine.
- Cette table est utilisée par `Logger.js` pour ignorer les getters/setters/méthodes privées (`#`) lors de l'instrumentation et pour les rapports d'erreur.

## Automatisation du processus de release

Un script unique (`scripts/release.py`) orcheste le cycle complet via `scripts/lib/release_common.py` :

1. **Vérification Git** : le répertoire de travail doit être propre (sauf `dist/`).
2. **Lecture de la version** depuis `manifest.json`.
3. **Check des conditions spéciales** :
   - Détection de changement de socle (comparaison normalisée vs le zip de la dernière release GitHub — version, DEV_MODE, SOCLE_HASH, URLs serveur et commentaires ignorés).
   - Vérification qu'une modification hors version a eu lieu.
   - Vérification que la version est bien supérieure à la dernière release.
   - Confirmation utilisateur si une condition spéciale est détectée.
4. **Compilation** du runtime dans `dist/` via `build_bundle.py` (runtime.js, runtime.css, version.json, images/).
5. **Vérification locale** du SHA-256 de `dist/`.
6. **Génération de l'archive zip socle** (`Outiiil-vX.Y.Z.zip`) uniquement si le socle a changé. Le zip contient : manifest.json (version patchée), js/background.js (DEV_MODE=false, BASE_UPDATE_URL, SOCLE_HASH, GitHub constants patchés), js/bridge.js, icons/.
7. **Déploiement** du contenu de `dist/` sur la branche `release` (clone, copy, commit, push).
8. **Vérification distante** de la cohérence SHA-256 (optionnelle, avec attente de propagation CDN).
9. **Création du tag Git** et **release GitHub** (uniquement si le socle a changé) via `gh release create` (ou instructions manuelles si gh CLI absent).
10. **Nettoyage** du dossier `dist/` local, de l'archive zip socle (`Outiiil-vX.Y.Z.zip`) et des zips de test éventuels (`Outiiil-test-*.zip`) via `rc.cleanup_dist()` + `rc.cleanup_zip()` + `rc.cleanup_test_zips()`.

### Script de test pré-déploiement (`scripts/test_prod.py`)

- Simule le workflow de release sur un repo secondaire (`Outiiil-test`).
- Génère une version de test Chrome-valide (4 parties) basée sur le SHA du commit.
- Build du runtime, déploiement sur `test` du repo test, génération du zip socle en mode production (DEV_MODE=false, BASE_UPDATE_URL=test).
- Vérification optionnelle de cohérence SHA-256 à distance.
- Nettoyage du dossier `dist/` à la fin.

## Tests

- [x] Vérifier que le script de release publie correctement sur `release`.
- [x] Vérifier que les clients en `DEV_MODE: false` détectent et appliquent automatiquement la mise à jour poussée sur `release`.
- [x] Vérifier que le numéro de version s'incrémente bien.
- [x] Vérifier le comportement bloquant et le message adapté en cas d'incompatibilité de données forum.
- [x] Vérifier qu'une mise à jour attend bien la fin d'une transaction.
- [x] Vérifier tous les chemins d'exécution du socle en mode production.
- [x] Vérifier que les logs identifient bien le bon fichier et la bonne ligne en mode production.
- [x] Vérifier que le `socle_hash` déclenche la recherche d'un commit compatible sur `release`.
- [x] Vérifier que le SHA-256 du runtime téléchargé est validé.
- [x] Vérifier que le script de test pré-déploiement (`test_prod.py`) génère un zip socle fonctionnel.

## Avancement

- [x] Création du bootstrapper statique (`js/background.js` : service worker + RPC dispatcher générique + coordinateur de mise à jour).
- [x] Création du pont isolé (`js/bridge.js` : content script + gestion des toasts + replay des notifications bloquantes).
- [x] Création de l'abstraction API navigateur (`js/browserAPI.js` : proxy RPC générique dans le monde MAIN).
- [x] Création de l'initialisation du runtime (`js/runtime_init.js` : chargement des images cache, vérification de version, coordination de rechargement transaction-safe).
- [x] Mise en place du bundle dynamique et du script de packaging (`scripts/lib/build_bundle.py`).
- [x] Branchement de la synchronisation asynchrone dans `chrome.storage.local` (code, CSS, version, images).
- [x] Allègement du manifeste (`manifest.json`) avec point d'entrée unique sur `js/bridge.js`.
- [x] Ajout de la bascule `DEV_MODE` dans `background.js` pour l'isolation totale du développement (chargement direct des sources locales).
- [x] Inclusion des images et icônes dans `dist/images/` pour être servies dynamiquement.
- [x] Calcul et vérification du `SOCLE_HASH` (manifest + background + bridge, normalisé) avec recherche de commit compatible en cas de mismatch.
- [x] Vérification SHA-256 du runtime téléchargé contre `version.json.sha256`.
- [x] Coordination de rechargement transaction-safe via `Transaction.js` (`window.__outiiilTransactionActive` + `outiiil:transaction:end`).
- [x] Création du script d'orchestration de release multi-mode (`scripts/release.py` + `scripts/lib/release_common.py`).
- [x] Configuration de `.gitignore` pour exclure `dist/` de la branche `dev`.
