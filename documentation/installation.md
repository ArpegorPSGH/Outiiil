# Installation et mise à jour du socle Outiiil

> **À quoi sert le socle ?** Le *socle* (bootstrap statique) est l'extension installée une fois dans le navigateur. Il contient `manifest.json`, `js/background.js` (service worker), `js/bridge.js` (content script isolé) et les icônes. Le socle orchestre les mises à jour et injecte dynamiquement le **runtime** (logique du jeu) téléchargé depuis GitHub Pages.
>
> Le runtime est mis à jour **automatiquement** par le socle — aucune action de votre part n'est nécessaire en temps normal.
>
> Le **socle** lui-même n'est mis à jour que rarement, lorsque ses propres fichiers évoluent. Quand cela arrive, le runtime est **bloqué** et un **toast de mise à jour bloquée** s'affiche sur fourmizzz.fr avec un bouton pour télécharger le nouveau socle. La procédure ci-dessous détaille alors la réinstallation du socle.

---

> **Prérequis commun** : Outiiil est une extension basée sur l'API `chrome.userScripts.register()` avec `world: "MAIN"`. Elle nécessite un navigateur supportant Manifest V3 et les *user scripts*.
>
> Navigateurs compatibles : **Chrome 120+**, **Microsoft Edge 120+**, **Brave 120+**, **Firefox 121+**, **Firefox pour Android 121+**, **Orion (iOS 16+) en bêta**.
>
> L'extension agit sur le site **[www.fourmizzz.fr](https://www.fourmizzz.fr/)**.
>
> Outiiil utilise une architecture en deux couches : le **socle** (bootstrap statique, installé une fois) orchestre les mises à jour et télécharge dynamiquement le **runtime** (logique du jeu) depuis `https://arpegorpsgh.github.io/Outiiil/dist/`. Les mises à jour du jeu ne nécessitent donc pas de réinstaller l'extension.

---

## 1. Pour les utilisateurs — Installation sur PC

### Étape 1 — Télécharger le socle depuis GitHub

1. Ouvrez [https://github.com/ArpegorPSGH/Outiiil/releases](https://github.com/ArpegorPSGH/Outiiil/releases) dans votre navigateur.
2. Sous la **dernière version stable**, téléchargez le fichier **`Outiiil-v<version>.zip`** (ex. `Outiiil-v3.22.2.zip`) en cliquant sur **Assets**.
3. Extrayez l'archive dans un dossier dédié, par exemple `Outiiil`.
   > Le dossier extrait contient `manifest.json`, `js/`, `css/`, `images/`, etc.

### Étape 2 — Accéder à la page des extensions

| Navigateur | Menu de navigation (GUI) | URL directe |
|---|---|---|
| **Chrome** | `⋮` → **Extensions** → **Gérer les extensions** | `chrome://extensions` |
| **Edge** | `…` → **Modules complémentaires** → **Extensions** | `edge://extensions` |
| **Brave** | `☰` → **Extensions** | `brave://extensions` |
| **Firefox** | `☰` → **Modules complémentaires** → **Mode développeur** (bas de page) | `about:debugging` → **Ce Firefox** |
| **Orion (iOS)** | Ouvrir Orion → **Réglages** (icône engrenage) → **Extensions** | — |

### Étape 3 — Installer le socle (selon votre navigateur)

#### Google Chrome / Microsoft Edge / Brave (Windows, macOS, Linux) — v120 minimum

1. Rendez-vous sur la page des extensions de votre navigateur :
   - **Chrome** : `chrome://extensions/`
   - **Edge** : `edge://extensions/`
   - **Brave** : `brave://extensions/`
2. Activez le **Mode développeur**.
3. Cliquez sur **Charger l'extension non empaquetée** (*Load unpacked*).
4. Sélectionnez le dossier extrait à l'[Étape 1](#étape-1--télécharger-le-socle-depuis-github).
5. L'extension **Outiiil** apparaît dans la liste. Cliquez sur **Détails** et activez le bouton **Scripts utilisateurs** dans la section Permissions.
   > ⚠️ Sans cette option, `chrome.userScripts` n'est pas disponible et le runtime ne peut pas s'injecter sur fourmizzz.fr.

#### Mozilla Firefox (Windows, macOS, Linux) — v121 minimum

1. Rendez-vous sur **`about:debugging`**.
2. Cliquez sur **Ce Firefox** (*This Firefox*).
3. Activez **Mode développeur**.
4. Cliquez sur **Charger un module permanent** (*Load Permanent Add-on*).
5. Dans le dossier extrait, sélectionnez **n'importe quel fichier** (ex. `manifest.json`).
6. L'extension est installée.

> Sur fourmizzz.fr, une boîte de dialogue vous demandera d'autoriser **Scripts utilisateurs** — cliquez sur **Autoriser**.

---

## Mise à jour du socle (toast *Mise à jour bloquée*)

Le **socle** n'est mis à jour que rarement. Quand ses propres fichiers évoluent, le runtime devient incompatible avec le socle installé : il est alors **bloqué** et un **toast** s'affiche sur fourmizzz.fr avec un bouton **Télécharger** (télécharge le nouveau socle depuis les releases GitHub).

> ℹ️ Le bouton **Télécharger** du toast lance automatiquement le téléchargement du zip depuis GitHub Releases. Celui **Voir les releases** renvoie vers la page des releases GitHub.

Suivez cette procédure :

1. **Télécharger le nouveau socle** → référez-vous à [l'Étape 1 — Télécharger le socle depuis GitHub](#étape-1--télécharger-le-socle-depuis-github).
2. **Supprimer l'ancien socle** → référez-vous à [l'Étape 2 — Accéder à la page des extensions](#étape-2--accéder-à-la-page-des-extensions) pour l'accès aux extensions.
Sur cette  page, repérez Outiiil dans la liste, cliquez sur **Supprimer** (ou **Remove**) puis confirmez. Vous pouvez également simplement désactiver l'extension en cliquant sur le slider, l'important étant que deux versions de l'extension ne soient pas simultanément actives.
3. **Charger le nouveau socle** → référez-vous à [l'Étape 3 — Installer le socle selon votre navigateur](#étape-3--installer-le-socle-selon-votre-navigateur).
4. Voir [Étape 4 — Désactiver puis réactiver les scripts utilisateurs](#étape-4--désactiver-puis-réactiver-les-scripts-utilisateurs).
5. Voir [Étape 5 — Vérifier la réussite](#étape-5--vérifier-la-réussite).

### Étape 4 — Désactiver puis réactiver les scripts utilisateurs

> ⚠️ **Cette étape est obligatoire après le chargement du nouveau socle.** Même si les scripts utilisateurs apparaissent activés, ils doivent être **désactivés puis réactivés** pour forcer le navigateur à réinitialiser l'état interne des scripts enregistrés par l'ancien socle.

1. Sur la page des extensions (cf. [Étape 2](#étape-2--accéder-à-la-page-des-extensions)), cliquez sur **Détails** de l'extension Outiiil.
2. Désactivez le bouton **Scripts utilisateurs**, puis **réactivez-le** immédiatement.
   - **Chrome / Edge / Brave** : la permission *Scripts utilisateurs* figure dans la section Permissions de la fiche de l'extension.
   - **Firefox** : la permission `userScripts` est demandée à la volée sur fourmizzz.fr ; il n'y a donc pas à effectuer de désactivation.

### Étape 5 — Vérifier la réussite

1. Ouvrez [www.fourmizzz.fr](https://www.fourmizzz.fr/).
2. **Le toast de mise à jour bloquée ne doit plus s'afficher.**
3. **La barre d'outils d'Outiiil (dock) doit apparaître.**

---

## 2. Pour les utilisateurs — Installation sur mobile

### Android — Firefox pour Android

**Version minimale** : Firefox 121 (MV3)

> ⚠️ **Chrome sur Android ne supporte pas les extensions ni les `user scripts`.** Utilisez Firefox pour Android.

1. Ouvrez Firefox et allez sur **`about:debugging`**.
2. Activez **Mode développeur**.
3. Cliquez sur **Charger un module permanent** (*Load Permanent Add-on*).
4. Dans le dossier extrait, sélectionnez `manifest.json`.
5. L'extension est installée.

### iPhone / iPad (iOS) — Orion

> ⚠️ **Safari, Chrome et Firefox sur iOS sont basés sur WebKit** et **ne prennent pas en charge les `user scripts` non empaquetés**. **Orion** est le seul navigateur mobile capable d'exécuter des extensions Chrome/Firefox sur iOS.

**Version minimale** : iOS 16+ (Orion depuis l'App Store)

1. Ouvrez **Orion** → **Réglages** (icône engrenage) → activez **Extensions** → **Activer l'installation d'extensions tierces**.
2. Dans Orion, ouvrez le **gestionnaire d'extensions** et choisissez **Installer une extension** → **À partir d'un fichier**.
3. Sélectionnez le dossier socle extrait.
4. L'extension est installée.

> ⚠️ **Limites** : le support des extensions sur iOS Orion est **en bêta**. Certaines APIs (`userScripts` avec `world: "MAIN"`) peuvent ne pas être pleinement supportées. Si Outiiil n'apparaît pas sur fourmizzz.fr, privilégiez un ordinateur de bureau ou un appareil **Android**.

---

## 3. Pour les développeurs — Installation depuis les sources

Cette procédure convient aux **contributeurs** et **développeurs**. Elle part du code source et génère le bundle localement en mode développement (`DEV_MODE = true`).

> En mode développement, le runtime est injecté directement depuis les fichiers sources via `bundle_sources.json`, **sans** être téléchargé depuis GitHub Pages.

### Prérequis

- Git
- Python 3 (pour générer le bundle)
- Un navigateur compatible (voir tableau ci-dessous)

### Procédure

1. **Clonez le dépôt** :
   ```bash
   git clone https://github.com/ArpegorPSGH/Outiiil.git
   cd Outiiil
   ```
2. **Chargez l'extension non empaquetée** dans votre navigateur en suivant les [Étapes 2 et 3](#étape-2--accéder-à-la-page-des-extensions-navigation-gui) de la section utilisateur, en sélectionnant la **racine du dépôt cloné** comme dossier.

---

## 4. Tableaux récapitulatifs

### 4.1 — Utilisateurs

| Système | Navigateur | Version min. | Mode d'installation |
|---|---|---|---|
| Windows | Chrome / Edge / Brave | 120 | `chrome://extensions` (ou `edge://`, `brave://`) → Load unpacked (socle zip) |
| Windows | Firefox | 121 | `about:debugging` → Load Permanent Add-on (socle zip) |
| macOS | Chrome / Edge / Brave | 120 | `chrome://extensions` (ou `edge://`, `brave://`) → Load unpacked (socle zip) |
| macOS | Firefox | 121 | `about:debugging` → Load Permanent Add-on (socle zip) |
| Linux | Chrome / Edge / Brave / Chromium | 120 | `chrome://extensions` → Load unpacked (socle zip) |
| Linux | Firefox | 121 | `about:debugging` → Load Permanent Add-on (socle zip) |
| Android | Firefox pour Android | 121 | `about:debugging` → Load Permanent Add-on (socle zip) |
| iOS | Orion | iOS 16+ | Orion Settings → Enable 3rd-party extensions → Load from file (socle zip) |

### 4.2 — Développeurs

| Système | Navigateur | Version min. | Mode d'installation |
|---|---|---|---|
| Windows | Chrome / Edge / Brave | 120 | `chrome://extensions` (ou `edge://`, `brave://`) → Load unpacked (dossier cloné) |
| Windows | Firefox | 121 | `about:debugging` → Load Permanent Add-on (dossier cloné) |
| macOS | Chrome / Edge / Brave | 120 | `chrome://extensions` (ou `edge://`, `brave://`) → Load unpacked (dossier cloné) |
| macOS | Firefox | 121 | `about:debugging` → Load Permanent Add-on (dossier cloné) |
| Linux | Chrome / Chromium | 120 | `chrome://extensions` → Load unpacked (dossier cloné) |
| Linux | Firefox | 121 | `about:debugging` → Load Permanent Add-on (dossier cloné) |

---

## 6. Dépannage fréquent

### L'extension ne s'affiche pas sur fourmizzz.fr

- Vérifiez que l'extension est bien **activée** dans la page des extensions (`chrome://extensions`, `edge://extensions`, `brave://extensions`, `about:addons`).
- Sur **Chrome/Edge/Brave**, cliquez sur **Détails** de l'extension Outiiil et vérifiez que le bouton **Scripts utilisateurs** est activé dans la section Permissions.
- Sur **Firefox**, une boîte de dialogue demande l'autorisation `userScripts` à la volée — cliquez sur **Autoriser**.
- Redémarrez le navigateur après installation.

### Impossible d'activer les scripts utilisateurs

- Sur **Chrome/Edge/Brave**, si l'option est grisée, vous utilisez probablement un compte géré par une entreprise. Utilisez un profil local non géré.
- Sur **Firefox**, la permission est demandée à la volée sur fourmizzz.fr. Si elle a été refusée, réinstallez l'extension et cliquez sur **Autoriser** lors de la boîte de dialogue.

### Le toast *Mise à jour bloquée* persiste après la procédure

- Vérifiez que vous avez bien **désactivé puis réactivé** le bouton **Scripts utilisateurs** (cf. [Étape 4](#étape-4--désactiver-puis-réactiver-les-scripts-utilisateurs)).
- Actualisez la page (`F5`) ou redémarrez le navigateur.
- Si le toast réapparaît, la version téléchargée ne correspond peut-être pas à une release contenant un socle compatible : téléchargez la **dernière** release depuis [GitHub Releases](https://github.com/ArpegorPSGH/Outiiil/releases).
