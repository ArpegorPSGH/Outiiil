# Mise à jour automatique

## Objectifs
Permettre la mise à jour automatique pour éviter au joueur de devoir télécharger et installer manuellement chaque nouvelle version, et ainsi limiter la coexistence de versions différentes.

## Fonctionnement Détaillé
L'extension utilisera un mécanisme de mise à jour automatique via un serveur privé, en l'occurrence GitHub Pages pour le fichier de configuration des mises à jour (`update.xml`) et GitHub Releases pour les fichiers de l'extension empaquetée (`.crx`).

**Prérequis pour l'utilisateur :**
*   L'utilisateur doit activer le "Mode développeur" dans Chrome (`chrome://extensions/`).
*   L'extension doit être installée initialement en "chargeant l'extension non empaquetée" (en sélectionnant le dossier de l'extension).
*   Chrome vérifiera périodiquement l'URL spécifiée dans le `manifest.json` pour détecter les nouvelles versions.

**Flux de mise à jour :**
1.  Le développeur incrémente le numéro de version dans `manifest.json`.
2.  Le développeur empaquette l'extension pour générer un fichier `.crx` et conserve la clé privée (`.pem`).
3.  Le développeur crée une nouvelle "Release" sur GitHub et y attache le fichier `.crx`.
4.  Le développeur met à jour le fichier `update.xml` (hébergé sur GitHub Pages) avec la nouvelle version et l'URL du `.crx` de la Release.
5.  Chrome (chez l'utilisateur) lit l'`update_url` dans le `manifest.json` de l'extension installée.
6.  Chrome télécharge le `update.xml` depuis GitHub Pages.
7.  Si la version dans `update.xml` est supérieure à la version installée, Chrome télécharge le nouveau `.crx` depuis GitHub Releases.
8.  Chrome met à jour l'extension automatiquement (généralement au prochain redémarrage du navigateur).

## Plan d'Implémentation
1.  **Mettre à jour `manifest.json` :**
    *   Ajouter la clé `"update_url"` dans le `manifest.json`, pointant vers l'URL de votre fichier `update.xml` sur GitHub Pages.
    *   Exemple : `"update_url": "https://votre-nom-utilisateur.github.io/votre-repo/update.xml"`
2.  **Gestion du Versionnement :**
    *   S'assurer que le numéro de version dans `manifest.json` est toujours incrémenté pour chaque nouvelle mise à jour.
3.  **Créer le Fichier `update.xml` :**
    *   Créer un fichier `update.xml` avec la structure suivante, en remplaçant `votre_id_extension_chrome`, `votre-nom-utilisateur`, `votre-repo` et le numéro de version :
        ```xml
        <?xml version='1.0' encoding='UTF-8'?>
        <gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
          <app appid='votre_id_extension_chrome'>
            <updatecheck codebase='https://github.com/votre-nom-utilisateur/votre-repo/releases/download/vX.Y.Z/outiiil-X.Y.Z.crx' version='X.Y.Z' />
          </app>
        </gupdate>
        ```
    *   L'`appid` est l'ID unique de l'extension Chrome (visible dans `chrome://extensions/` une fois l'extension chargée en mode développeur).
    *   Le `codebase` doit pointer vers l'URL du fichier `.crx` hébergé sur GitHub Releases.
4.  **Héberger les Fichiers sur GitHub :**
    *   **Pour `update.xml` :** Activer GitHub Pages pour le dépôt. Placer `update.xml` dans un dossier (ex: `updates/`) à la racine de la branche `gh-pages` (ou `main`/`master` si configuré pour GitHub Pages).
    *   **Pour les fichiers `.crx` :** Pour chaque nouvelle version, empaqueter l'extension (via `chrome://extensions/` -> "Empaqueter l'extension") pour générer le `.crx` et le `.pem`. Créer une nouvelle "Release" sur GitHub et attacher le fichier `.crx` comme un asset à cette release. Conserver le fichier `.pem` en sécurité pour les futures mises à jour.
5.  **Instructions d'Installation Initiale pour les Utilisateurs :**
    *   Fournir des instructions claires aux utilisateurs pour activer le "Mode développeur" dans Chrome et "Charger l'extension non empaquetée" en sélectionnant le dossier de l'extension.

## Tests à effectuer
1.  **Test de la mise à jour automatique :**
    *   Installer une version initiale de l'extension (par exemple, v1.0.0) en mode développeur.
    *   Simuler une nouvelle version (v1.0.1) en incrémentant le `manifest.json`, empaquetant le `.crx`, créant une release GitHub et mettant à jour le `update.xml` sur GitHub Pages.
    *   Forcer une vérification de mise à jour dans Chrome (`chrome://extensions/` -> "Mettre à jour les extensions maintenant").
    *   Vérifier que l'extension est bien passée à la version 1.0.1.
2.  **Test de la non-mise à jour si version identique ou inférieure :**
    *   S'assurer que Chrome ne tente pas de mettre à jour si la version sur le serveur est égale ou inférieure à la version installée.

## Avancement
-   **Mettre à jour `manifest.json` :** La clé `"update_url"` a été ajoutée, pointant vers `https://arpegorpsgh.github.io/Outiiil/update.xml`.
-   **Créer le Fichier `update.xml` :** Le fichier `update.xml` a été créé à la racine du dépôt avec l'AppID `lhbjojdecimkjdkcdmgbgiddlpdkdnol` et l'URL du `.crx` de la première release (`https://github.com/ArpegorPSGH/Outiiil/releases/download/2.1.15/Outiiil.crx`) et la version `2.1.15`.
-   **Héberger les Fichiers sur GitHub :**
    *   GitHub Pages a été activé pour le dépôt.
    *   La première Release sur GitHub a été créée et le fichier `Outiiil.crx` y a été attaché.
-   **Clé privée (.pem) :** Le fichier `.pem` a été généré et l'utilisateur a été instruit de le conserver en sécurité en dehors du dépôt public.
-   **Tests effectués :**
    *   **Test de la mise à jour automatique :** Réussi. L'extension installée en version `2.0.1.1` a été mise à jour vers la version `2.1.15` via le mécanisme de mise à jour de Chrome.
    *   **Test de la non-mise à jour si version identique ou inférieure :** Réussi. Chrome a indiqué "extensions mises à jour" mais la version d'Outiiil est restée `2.1.15`, confirmant qu'aucune mise à jour n'a été effectuée car la version sur le serveur n'était pas supérieure.
