# Installation d'Outiiil sur les navigateurs compatibles

> **Prérequis commun** : Outiiil est une extension basée sur l'API `chrome.userScripts.register()` avec `world: "MAIN"`. Elle nécessite un navigateur supportant Manifest V3 et les *user scripts*.
>
> Navigateurs compatibles : **Chrome 120+**, **Microsoft Edge 120+**, **Brave 120+**, **Firefox 121+**, **Firefox pour Android 121+**, **Orion (iOS 16+) en bêta**.
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

### Étape 3 — Installer le socle (selon votre navigateur)

#### Google Chrome (Windows, macOS, Linux) — v120 minimum

1. Rendez-vous sur **`chrome://extensions/`**.
2. Activez le **Mode développeur** (bouton en haut à droite).
3. Cliquez sur **Charger l'extension non empaquetée** (*Load unpacked*).
4. Sélectionnez le dossier extrait à l'[Étape 1](#étape-1--télécharger-le-socle-depuis-github).
5. L'extension **Outiiil** apparaît dans la liste. Cliquez sur **Détails** et activez le bouton **Autoriser les scripts utilisateurs**.
   > ⚠️ Sans cette option, `chrome.userScripts` n'est pas disponible et le runtime ne peut pas s'injecter.

#### Microsoft Edge (Windows, macOS, Linux) — v120 minimum

1. Rendez-vous sur **`edge://extensions/`**.
2. Activez **Mode développeur**.
3. Activez l'option **Scripts utilisateurs** si elle apparaît (`edge://settings/content/userScripts` ou directement dans la page des extensions).
4. Cliquez sur **Importer l'extension non empaquetée** (*Load unpacked*).
5. Sélectionnez le dossier extrait.
6. L'extension est installée.

#### Brave (Windows, macOS, Linux) — v120 minimum

1. Rendez-vous sur **`brave://extensions/`**.
2. Activez **Mode développeur**.
3. Activez **Scripts utilisateurs** (`brave://settings/content/userScripts`).
4. Cliquez sur **Charger l'extension non empaquetée** (*Load unpacked*).
5. Sélectionnez le dossier extrait.
6. L'extension apparaît dans la liste.

#### Mozilla Firefox (Windows, macOS, Linux) — v121 minimum

1. Rendez-vous sur **`about:debugging`**.
2. Cliquez sur **Ce Firefox** (*This Firefox*).
3. Activez **Mode développeur**.
4. Cliquez sur **Charger un module permanent** (*Load Permanent Add-on*).
5. Dans le dossier extrait, sélectionnez **n'importe quel fichier** (ex. `manifest.json`).
6. L'extension est installée.

> Sur fourmizzz.fr, une boîte de dialogue vous demandera d'autoriser **Scripts utilisateurs** — cliquez sur **Autoriser**.

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

> ⚠️ **Safari, Chrome et Firefox sur iOS sont basés sur WebKit** et **ne prennent pas en charge les `user scripts` non empaquetés**.  
> **Orion** est le seul navigateur mobile capable d'exécuter des extensions Chrome/Firefox sur iOS, grâce à son support expérimental des *Web Extensions*.

**Version minimale** : iOS 16+ (Orion depuis l'App Store)

1. Ouvrez **Orion** → **Réglages** (icône engrenage) → activez **Extensions** → **Activer l'installation d'extensions tierces**.
2. Dans Orion, ouvrez le **gestionnaire d'extensions** et choisissez **Installer une extension** → **À partir d'un fichier**.
3. Sélectionnez le dossier socle extrait.
4. L'extension est installée.

> ⚠️ **Limites** : le support des extensions sur iOS Orion est **en bêta** et imposé par les restrictions d'Apple. Certaines APIs (notamment `userScripts` avec `world: "MAIN"`) peuvent ne pas être entièrement fonctionnelles. Si Outiiil n'apparaît pas sur fourmizzz.fr, c'est que l'API n'est pas encore pleinement supportée sur iOS.  
> Pour une expérience optimale, privilégiez un ordinateur de bureau ou un appareil **Android**.

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
| Windows | Chrome | 120 | `chrome://extensions` → Load unpacked (socle zip) |
| Windows | Edge | 120 | `edge://extensions` → Load unpacked (socle zip) |
| Windows | Brave | 120 | `brave://extensions` → Load unpacked (socle zip) |
| Windows | Firefox | 121 | `about:debugging` → Load Permanent Add-on (socle zip) |
| macOS | Chrome | 120 | `chrome://extensions` → Load unpacked (socle zip) |
| macOS | Brave | 120 | `brave://extensions` → Load unpacked (socle zip) |
| macOS | Firefox | 121 | `about:debugging` → Load Permanent Add-on (socle zip) |
| Linux | Chrome / Chromium | 120 | `chrome://extensions` → Load unpacked (socle zip) |
| Linux | Firefox | 121 | `about:debugging` → Load Permanent Add-on (socle zip) |
| Linux | Brave | 120 | `brave://extensions` → Load unpacked (socle zip) |
| Android | Firefox pour Android | 121 | `about:debugging` → Load Permanent Add-on (socle zip) |
| iOS | Orion | iOS 16+ | Orion Settings → Enable 3rd-party extensions → Load from file (socle zip) |

### 4.2 — Développeurs

| Système | Navigateur | Version min. | Mode d'installation |
|---|---|---|---|
| Windows | Chrome | 120 | `chrome://extensions` → Load unpacked (dossier cloné) |
| Windows | Edge | 120 | `edge://extensions` → Load unpacked (dossier cloné) |
| Windows | Firefox | 121 | `about:debugging` → Load Permanent Add-on (dossier cloné) |
| macOS | Chrome | 120 | `chrome://extensions` → Load unpacked (dossier cloné) |
| macOS | Firefox | 121 | `about:debugging` → Load Permanent Add-on (dossier cloné) |
| Linux | Chrome / Chromium | 120 | `chrome://extensions` → Load unpacked (dossier cloné) |
| Linux | Firefox | 121 | `about:debugging` → Load Permanent Add-on (dossier cloné) |

---

## 6. Dépannage fréquent

### L'extension ne s'affiche pas sur fourmizzz.fr

- Vérifiez que l'extension est bien **activée** dans la page des extensions (`chrome://extensions`, `edge://extensions`, `brave://extensions`, `about:addons`).
- Sur **Chrome/Edge/Brave**, le bouton **Scripts utilisateurs** doit être activé. Sans cela, le runtime est bloqué.
- Sur **Firefox**, une boîte de dialogue demande l'autorisation `userScripts` à la volée — cliquez sur **Autoriser**.
- Redémarrez le navigateur après installation.

### Impossible d'activer les scripts utilisateurs

- Sur **Chrome**, si l'option est grisée, vous utilisez probablement un compte géré par une entreprise. Utilisez un profil local non géré.
- Sur **Firefox**, la permission est demandée à la volée. Allez dans `about:preferences#privacy` → **Permissions** et rétabissez l'autorisation, ou réinstallez l'extension.
