# Rollback version

## Objectifs
Permettre de revenir à une version antérieure en cas de problème important.

## Fonctionnement Détaillé
- Le socle récupère la version du dernier commit sur la branche release à partir du moment où elle est **différente** de celle en cache, et non seulement supérieure
  - **background.js** : la comparaison de version passe de `compareVersions(...) <= 0` (version identique ou inférieure = "up to date") à une comparaison de différence (`remoteVersion === storedVersion && sha256 === storedSha256`). Toute différence — qu'elle soit une baisse de version (rollback) ou une hausse — déclenche le téléchargement. Le sha256 est maintenant stocké (`STORAGE_KEY_SHA256`) et comparé pour détecter les changements de code avec le même numéro de version.
  - **background.js** : détection de rollback dans le chemin de téléchargement — `compareVersions(remoteVersion, storedVersion) < 0` active le flag `rollbackDetected`, transmis dans les toasts (success, in_progress, blocked).
  - **background.js** : en cas de mismatch de socle + aucun commit compatible (`blocked`) : **unregistration** du user script (runtime bloqué), toast "rollback" dédié, bouton "Télécharger" pointe vers la **dernière release GitHub** via l'API (fallback sur le hint).
  - **background.js** : `runtime_init.js` respecte le flag `blocked` — pas de reload, pas d'exposition de la version rollbackée comme `window.VERSION`.
- Créer un script de rollback qui supprime le dernier commit de la branche release et la dernière release si elle y est attachée
  - **scripts/rollback.py** : script autonome qui :
    1. Récupère le HEAD de la branche release depuis le remote
    2. Lit le numéro de version depuis `dist/version.json` du dernier commit
    3. Supprime la release GitHub + le tag Git associés (`gh` CLI ou API REST avec `GITHUB_TOKEN`)
    4. Force-pousse le commit précédent (HEAD~1) comme nouveau HEAD de la branche release
    5. Vérifie le rollback en relisant la version du nouveau HEAD
  - **scripts/lib/release_common.py** : ajout de `get_file_from_commit()` (lecture d'un fichier depuis un commit git) et `delete_github_release()` (suppression release + tag via `gh` CLI ou GitHub API REST avec token).

## Plan d'Implémentation
1. **background.js** — Ajouter `STORAGE_KEY_SHA256`, stocker le sha256 lors du téléchargement, modifier la comparaison de version (différence ≠ supériorité)
2. **background.js** — Dans le cas `blocked` (pas de commit compatible) : détecter un rollback, unregister le user script, notifier tabs avec `rollbackDetected`
3. **background.js** — `DOWNLOAD_SOCLE` : récupérer la dernière release GitHub via l'API et pointer le bouton vers la release la plus récente
4. **background.js** — Détecter le rollback dans le chemin de téléchargement (`compareVersions < 0`), propager `rollbackDetected`
5. **background.js** — `notifyTabs` : propager `rollbackDetected` dans le message vers le bridge + CHECK_UPDATE response
6. **bridge.js** — `showToast` : accepter `rollbackDetected`, texte "rollback" dédié pour success + blocked
7. **runtime_init.js** — TOAST_CONFIG : ajouter `rollbackText` et `rollbackSuccessText`. Respecter `blocked` flag — pas de reload, pas de VERSION incorrecte
8. **release_common.py** — Ajouter `get_file_from_commit()` et `delete_github_release()` (avec support `gh` CLI + token)
9. **scripts/rollback.py** — Créer le script de rollback avec `--dry-run`, `--branch`, `--no-commit-check`
10. **AGENTS.md** — Ajouter `rollback.py` à la vérification syntaxique et documenter l'usage

## Tests à effectuer
- `python -m py_compile scripts/lib/release_common.py scripts/rollback.py` — syntaxe Python
- `python scripts/rollback.py --help` — affichage de l'aide
- `python scripts/rollback.py --dry-run --no-commit-check` — simulation sans modification (échoue proprement si `dist/version.json` absent)
- Tester le rollback avec un socle incompatible (socle_hash différent) → le runtime doit être bloqué + toast rollback + bouton dl → latest release
- Tester le rollback avec socle identique → le runtime rollbacké est téléchargé (toast "Rollback vX appliqué")
- Vérifier que `downloader_socle_url` pointe toujours vers `releases/latest` et non vers une version supprimée

## Avancement
- [x] background.js : comparaison de version par différence + stockage du sha256
- [x] background.js : détection rollback (`compareVersions < 0`) + flag `rollbackDetected` dans success/in_progress/blocked toasts
- [x] background.js : blocage runtime (`chrome.userScripts.unregister`) + toast "rollback" + bouton dl vers latest release via API
- [x] bridge.js : support du flag `rollbackDetected` dans toasts blocked + success
- [x] runtime_init.js : respect du blocage (`blocked` flag) — pas de reload, pas de VERSION incorrecte, `rollbackText` + `rollbackSuccessText`
- [x] release_common.py : helpers `get_file_from_commit` et `delete_github_release` (gh CLI + GITHUB_TOKEN)
- [x] scripts/rollback.py : script de rollback fonctionnel
- [x] AGENTS.md : syntaxe check + documentation mises à jour
- [x] Syntaxe Python validée
