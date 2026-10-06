#!/usr/bin/env python3
"""
scripts/release.py
Orchestrateur de release automatisé pour Outiiil.

Workflow :
  1. Vérifie que le répertoire de travail Git est propre.
  2. Récupère la version actuelle depuis manifest.json.
  3. Compile le dossier `dist/` complet (runtime.js, runtime.css, version.json, images/).
  4. Génère l'archive zip de distribution (`Outiiil-vX.Y.zip` : manifest.json,
     js/background.js, js/bridge.js, dist/) — uniquement si le socle a changé.
  5. Déploie le contenu de `dist/` sur la branche distante `gh-pages`.
  6. Crée/étiquette le tag Git et crée la Release GitHub (via gh CLI si présent).
  7. Nettoie le dossier `dist/` local.

Ce script utilise `scripts/lib/release_common.py` pour le code partagé avec
`scripts/test_prod.py`, évitant la duplication de la logique de build, de
déploiement et de génération de zip socle.

Il n'y a plus de branche `socle` : la distribution dynamique est servie depuis
`gh-pages` (dist/ + images/), et l'archive zip est l'artefact de release.
"""

import json
import os
import re
import shutil
import sys
import tempfile
import urllib.request
import zipfile

# Importer le module commun (scripts/lib/release_common.py)
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import release_common as rc

# Constantes pour verifier_socle_a_changer (logique prod-spécifique, conservée ici)
BASE_DIR = rc.BASE_DIR
MANIFEST_PATH = os.path.join(BASE_DIR, "manifest.json")
BACKGROUND_PATH = os.path.join(BASE_DIR, "js", "background.js")
BRIDGE_PATH = os.path.join(BASE_DIR, "js", "bridge.js")
DIST_DIR = os.path.join(BASE_DIR, "dist")
IMAGES_DIR = os.path.join(BASE_DIR, "images")
BRANCH_GH_PAGES = "gh-pages"


def verifier_socle_a_changer(version):
    """Détermine si le socle (manifest + background.js + bridge.js + icons,
    HORS numéro de version) a changé depuis la dernière release GitHub.

    La source de référence est l'artefact de la dernière release (le zip
    `Outiiil-vX.Y.zip`), pas le code sur la branche gh-pages : c'est cet artefact
    qui définit ce qui a été release.

    Retourne (a_changer, reason). Un simple bump de version ne déclenche pas
    une nouvelle archive zip / release GitHub.
    """
    api_url = 'https://api.github.com/repos/ArpegorPSGH/Outiiil/releases/latest'
    zip_url = None
    try:
        req = urllib.request.Request(api_url, headers={'Accept': 'application/vnd.github+json', 'User-Agent': 'release.py'})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        # Chercher l'asset zip (nom de la forme Outiiil-vX.Y.zip)
        for asset in data.get('assets', []) or []:
            name = asset.get('name', '')
            if name.endswith('.zip'):
                zip_url = asset.get('browser_download_url')
                break
    except Exception as e:
        return True, f"impossible de lire la dernière release GitHub: {e}"

    if not zip_url:
        return True, "aucun asset zip trouvé dans la dernière release"

    with tempfile.TemporaryDirectory() as temp_dir:
        zip_path = os.path.join(temp_dir, "release.zip")
        try:
            req = urllib.request.Request(zip_url, headers={'User-Agent': 'release.py'})
            with urllib.request.urlopen(req, timeout=60) as resp:
                with open(zip_path, "wb") as f:
                    shutil.copyfileobj(resp, f)
        except Exception as e:
            return True, f"impossible de télécharger le zip de la dernière release: {e}"

        # Lire les fichiers du socle depuis le zip (sans dist/)
        remote_files = {}
        try:
            with zipfile.ZipFile(zip_path, "r") as zf:
                for name in zf.namelist():
                    if name.endswith("/"):
                        continue
                    if name.startswith("dist/") or name.startswith(".git/"):
                        continue
                    remote_files[name] = zf.read(name)
        except Exception as e:
            return True, f"impossible de lire le zip de la dernière release: {e}"

        def normaliser_chemin_icone(rel_path):
            """Normalise le chemin d'une icône pour la comparaison : images/icons/X ≡ icons/X.
            Les séparateurs sont normalisés en slash pour ignorer les différences Windows/Unix."""
            rel_path = rel_path.replace(os.sep, "/")
            if rel_path.startswith("images/icons/"):
                return "icons/" + rel_path[len("images/icons/"):]
            if rel_path.startswith("images/"):
                return rel_path[len("images/"):]
            return rel_path

        def normaliser_manifest_icones(manifest_obj):
            """Normalise les chemins d'icônes dans le manifest (images/icons/X ≡ icons/X)."""
            if isinstance(manifest_obj, dict):
                for key, value in manifest_obj.items():
                    if isinstance(value, str) and value.startswith("images/icons/"):
                        manifest_obj[key] = "icons/" + value[len("images/icons/"):]
                    elif isinstance(value, str) and value.startswith("images/"):
                        manifest_obj[key] = value[len("images/"):]
                    elif isinstance(value, dict):
                        normaliser_manifest_icones(value)
            return manifest_obj

        # Lire les fichiers du socle local (sans dist/, sans le numéro de version)
        local_files = {}
        for rel_path in ["manifest.json", "js/background.js", "js/bridge.js"]:
            abs_path = os.path.join(BASE_DIR, rel_path)
            if os.path.exists(abs_path):
                with open(abs_path, "rb") as f:
                    data = f.read()
                # Normaliser le numéro de version pour la comparaison
                try:
                    data = data.replace(version.encode(), b"0.0.0")
                except Exception:
                    pass
                # Normaliser DEV_MODE : l'artefact de release contient DEV_MODE = false
                # (remplacé par release.py), or le code source est en DEV_MODE = true.
                if rel_path == "js/background.js":
                    data = data.replace(b"const DEV_MODE = true;", b"const DEV_MODE = false;")
                # Normaliser le manifest : le local utilise des onglets, le zip distant
                # est écrit par json.dump (espaces). Comparer en JSON normalisé.
                # Les chemins d'icônes sont aussi normalisés (images/icons/X ≡ icons/X).
                if rel_path == "manifest.json":
                    try:
                        manifest_obj = json.loads(data.decode("utf-8"))
                        manifest_obj = normaliser_manifest_icones(manifest_obj)
                        data = json.dumps(manifest_obj, sort_keys=True, ensure_ascii=False).encode("utf-8")
                    except Exception:
                        pass
                local_files[rel_path] = data

        icons_src = os.path.join(IMAGES_DIR, "icons")
        if os.path.isdir(icons_src):
            for racine, _, fichiers in os.walk(icons_src):
                for f in fichiers:
                    abs_path = os.path.join(racine, f)
                    rel_path = os.path.relpath(abs_path, BASE_DIR)
                    with open(abs_path, "rb") as fh:
                        local_files[normaliser_chemin_icone(rel_path)] = fh.read()

        # Normaliser les chemins d'icônes distants (images/icons/X ≡ icons/X)
        remote_files = {normaliser_chemin_icone(k): v for k, v in remote_files.items()}

        # Normaliser le manifest distant : le zip est écrit par json.dump (espaces),
        # on le re-parse pour comparer en JSON normalisé avec le local.
        # Les chemins d'icônes sont aussi normalisés (images/icons/X ≡ icons/X).
        # Le numéro de version est aussi normalisé (le zip distant contient l'ancienne version).
        if "manifest.json" in remote_files:
            try:
                print(f"[*] Normalisation manifest distant (version courante={version})...")
                remote_raw = remote_files["manifest.json"]
                print(f"    distant brut: {remote_raw[:300]!r}")
                # Normaliser n'importe quel numéro de version (X.Y ou X.Y.Z) par 0.0.0
                # Le zip distant contient l'ancienne version, pas la version courante.
                remote_data = re.sub(rb'\"version\":\s*\"[0-9.]+\"', b'"version": "0.0.0"', remote_raw)
                print(f"    distant après norm version: {remote_data[:300]!r}")
                manifest_obj = json.loads(remote_data.decode("utf-8"))
                manifest_obj = normaliser_manifest_icones(manifest_obj)
                remote_files["manifest.json"] = json.dumps(manifest_obj, sort_keys=True, ensure_ascii=False).encode("utf-8")
                print(f"    distant normalisé: {remote_files['manifest.json'][:200]!r}")
            except Exception as e:
                print(f"[*] Erreur normalisation manifest distant: {e}")

        # Comparer les clés (fichiers)
        local_keys = set(local_files.keys())
        remote_keys = set(remote_files.keys())
        print(f"[*] Clés locales: {sorted(local_keys)}")
        print(f"[*] Clés distantes: {sorted(remote_keys)}")
        if local_keys != remote_keys:
            return True, f"différence d'ensemble de fichiers: local={sorted(local_keys)}, distant={sorted(remote_keys)}"

        # Comparer le contenu de chaque fichier
        for key in sorted(local_keys):
            # Diagnostic détaillé avant normalisation
            print(f"[*] Diagnostic pour {key}:")
            print(f"    local brut ({len(local_files[key])} bytes): {local_files[key]!r}")
            print(f"    distant brut ({len(remote_files[key])} bytes): {remote_files[key]!r}")
            if local_files[key] != remote_files[key]:
                # Normaliser les fins de ligne pour la comparaison (CRLF vs LF)
                # et ignorer un éventuel saut de ligne final (json.dump n'en ajoute pas,
                # mais le manifest local en a un).
                local_norm = local_files[key].replace(b"\r\n", b"\n").rstrip(b"\n")
                remote_norm = remote_files[key].replace(b"\r\n", b"\n").rstrip(b"\n")
                if local_norm != remote_norm:
                    print(f"    local normalisé ({len(local_norm)} bytes): {local_norm!r}")
                    print(f"    distant normalisé ({len(remote_norm)} bytes): {remote_norm!r}")
                    # Trouver la première différence
                    for i in range(min(len(local_norm), len(remote_norm))):
                        if local_norm[i] != remote_norm[i]:
                            print(f"    Première diff à byte {i}: local=0x{local_norm[i]:02x} distant=0x{remote_norm[i]:02x}")
                            print(f"    Contexte local: {local_norm[max(0,i-20):i+20]!r}")
                            print(f"    Contexte distant: {remote_norm[max(0,i-20):i+20]!r}")
                            break
                    else:
                        print(f"    Différence de longueur: local={len(local_norm)}, distant={len(remote_norm)}")
                    return True, f"fichier modifié: {key}"
            else:
                print(f"    -> IDENTIQUE (brut)")

        return False, "aucune modification du socle détectée depuis la dernière release"


def main():
    print("========================================")
    print("  OUTIIIL - Orchestrateur de Release")
    print("========================================")

    ctx = rc.ReleaseContext()

    # 1. Vérification Git
    rc.verifier_git_propre(ctx)
    branche_origine = rc.get_current_branch()
    print(f"[*] Branche courante : {branche_origine}")

    # 2. Lecture de la version
    manifest_data = rc.read_manifest(ctx)
    version = manifest_data.get("version")
    if not version:
        print("Erreur : Impossible de lire la version dans manifest.json", file=sys.stderr)
        sys.exit(1)

    print(f"[*] Version cible pour la release : {version}")
    tag_name = version

    # 3. Compilation du runtime dans dist/
    rc.build_runtime(ctx)

    if not os.path.exists(DIST_DIR) or not os.path.exists(os.path.join(DIST_DIR, "version.json")):
        print("Erreur : La compilation de dist/ a échoué.", file=sys.stderr)
        sys.exit(1)

    # Vérification locale de cohérence sha256 avant déploiement
    computed_hash = rc.compute_dist_sha256(ctx)

    # 4. Génération de l'archive zip (uniquement si le socle a changé)
    print("[*] Vérification des modifications du socle (manifest + js + icons, HORS numéro de version)...")
    socle_a_changer, raison_socle = verifier_socle_a_changer(version)
    zip_filename = None
    zip_dest_path = None
    if socle_a_changer:
        print(f"[*] Le socle a changé ({raison_socle}) : génération de l'archive zip et de la release GitHub.")
        zip_filename = f"Outiiil-v{version}.zip"
        zip_dest_path = os.path.join(BASE_DIR, zip_filename)
        rc.generate_zip_socle(
            ctx, version, dev_mode=False,
            update_url=ctx.update_url, zip_path=zip_dest_path,
        )
    else:
        print(f"[*] Le socle n'a pas changé ({raison_socle}) : archive zip et release GitHub sautées, "
              f"push de la distribution sur gh-pages uniquement.")

    # 5. Déploiement sur gh-pages
    remote_url = rc.get_remote_url()
    print(f"[*] Déploiement du runtime sur '{BRANCH_GH_PAGES}' (remote : {remote_url})...")

    commit_hash = rc.deploy_dist_to_branch(
        ctx, BRANCH_GH_PAGES, remote_url,
        commit_message=f"Release {version} (runtime update)",
    )
    print(f"[*] gh-pages commit : {commit_hash}")

    # Vérification de cohérence dist après déploiement
    if not rc.verify_deployment(ctx, ctx.update_url, version, computed_hash):
        print("[!] Déploiement gh-pages incohérent côté distant ; la release continue, "
              "mais l'incohérence sera détectée au runtime.", file=sys.stderr)

    # 6. Création (ou re-création en force) du tag Git (uniquement si le socle a changé)
    if socle_a_changer:
        print(f"[*] Création du tag Git {tag_name}...")
        with tempfile.TemporaryDirectory() as temp_tag_dir:
            rc.run_cmd(f'git clone --single-branch --branch {BRANCH_GH_PAGES} "{remote_url}" "{temp_tag_dir}"')
            rc.run_cmd(f'git tag -fa {tag_name} -m "Release {version}"', cwd=temp_tag_dir)
            rc.run_cmd(f"git push -f origin {tag_name}", cwd=temp_tag_dir)
            print(f"  -> Tag Git {tag_name} créé et poussé.")

    # 7. Publication de la Release GitHub (uniquement si le socle a changé)
    if socle_a_changer:
        print(f"[*] Publication de la release GitHub pour le tag {tag_name}...")
        gh_available = shutil.which("gh") is not None
        if gh_available:
            cmd_gh = f'gh release create {tag_name} "{zip_dest_path}" --title "Outiiil {version}" --target {BRANCH_GH_PAGES} --notes "Mise à jour dynamique Outiiil v{version}"'
            res_gh = rc.run_cmd(cmd_gh)
            print(f"  -> Release GitHub créée avec succès via gh CLI : {res_gh}")
        else:
            print(f"  -> GitHub CLI (gh) non détecté. Vous pouvez créer la release manuellement "
                  f"sur GitHub en y joignant {zip_filename}.")
    else:
        print(f"  -> Aucune archive zip/tag/release : le socle n'a pas changé.")

    # 8. Nettoyage local du dossier dist/
    rc.cleanup_dist(ctx)

    print("========================================")
    print(f" Release {version} terminée avec succès !")
    print(f" - {BRANCH_GH_PAGES:<12}: runtime déployé + tag {tag_name}")
    print(f" - artefact    : {zip_filename or '(none - socle inchangé)'}")
    print(f" - branche     : reste sur {branche_origine} en mode DEV")
    print("========================================")


if __name__ == "__main__":
    main()
