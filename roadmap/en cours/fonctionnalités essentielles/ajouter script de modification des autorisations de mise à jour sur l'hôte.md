# Ajouter script de modification des autorisations de mise à jour sur l'hôte

## Objectifs
Ajouter un script pour modifier sur système Windows/Mac/Linux les autorisations de mise à jour sur l'hôte (les environnements mobiles Android/iOS ne supportant pas l'exécution de scripts de stratégie hôte).

## Fonctionnement Détaillé
Les deux voies de déclenchement de la vérification de mise à jour sont :
1. **À chaque chargement de page** (vérification réseau ultra-légère et asynchrone sans impact sur la vitesse d'affichage).
2. **Manuellement depuis l'onglet extensions** de Chrome.

Dans les deux cas, si la tentative de mise à jour échoue (bloquée par les restrictions hôte/Chrome) :
- Un message s'affiche avec un simple bouton permettant d'exécuter le script de modification des autorisations sur l'hôte.
- Si la mise à jour échoue toujours, un message invite l'utilisateur à télécharger et installer manuellement la nouvelle version de l'extension.

## Plan d'Implémentation
1. **Nettoyage :**
   - Retirer le mécanisme de lancement forcé de mise à jour lors d'une incompatibilité de version.
2. **Déclenchement de la vérification :**
   - Lancer la vérification de mise à jour de manière asynchrone à chaque chargement de page.
   - Supporter également le déclenchement manuel via le bouton de mise à jour de l'onglet extensions de Chrome (`chrome.runtime.onUpdateAvailable`).
3. **Gestion des erreurs et escalade UI :**
   - En cas d'échec ou de blocage de la mise à jour (autorisations hôte manquantes) : afficher une notification avec un bouton permettant d'exécuter le script de modification des autorisations sur l'hôte via `chrome.downloads`.
   - Si la mise à jour échoue toujours après une tentative d'autorisation : afficher un message invitant l'utilisateur à télécharger et installer manuellement la nouvelle version de l'extension.
4. **Scripts Hôte :**
   - Fournir les scripts et politiques pour Windows (`scripts/autoriser_maj_windows.bat`) et Unix/macOS (`scripts/autoriser_maj_unix.sh`) pour autoriser la mise à jour d'extension hors Chrome Web Store.
   - Rendre ces scripts accessibles depuis l'extension (`web_accessible_resources`).

## Tests à effectuer
- Tester la vérification au chargement de page.
- Tester le déclenchement manuel depuis le bouton de l'onglet extensions.
- Vérifier comportement en cas d'absence de mise à jour
- Vérifier que la détection d'incompatibilité de version ne déclenche plus de mise à jour dédiée.
- Vérifier l'affichage du message et le bon fonctionnement du bouton de lancement du script en cas d'échec.
- Vérifier comportement de mise à jour si le script a déjà été exécuté précédemment

## Avancement
- [x] Retrait du mécanisme de mise à jour forcée lors d'incompatibilité dans `GestionnaireVersions.js`.
- [x] Création des scripts d'autorisation des politiques hôte pour Windows (`scripts/autoriser_maj_windows.bat`) et Unix/macOS (`scripts/autoriser_maj_unix.sh`).
- [x] Ajout des scripts dans les ressources accessibles du manifest (`manifest.json`).
- [x] Optimisation de `js/background.js` avec gestion de l'écouteur `chrome.runtime.onUpdateAvailable` et limitation de fréquence.
- [x] Déclenchement de la vérification asynchrone au chargement de page dans `js/main.js` avec notification toast et bouton lançant l'exécution du script hôte via `chrome.downloads`.
- [x] Escalade vers un message invitant à l'installation manuelle de la nouvelle version si la mise à jour automatique échoue toujours.