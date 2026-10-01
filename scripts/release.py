#!/usr/bin/env python3
"""
scripts/release.py
Orchestrateur de release automatisé pour Outiiil.

Workflow :
  1. Vérifie que le répertoire de travail Git est propre.
  2. Récupère la version actuelle depuis manifest.json.
  3. Compile le dossier `dist/` complet (runtime.js, runtime.css, version.json, images/).
  4. Génère l'archive zip de distribution (`Outiiil-vX.Y.zip` : manifest.json,
     js/background.js, js/bridge.js, dist/).
  5. Déploie le contenu de `dist/` sur la branche distante `gh-pages`.
  6. Crée/étiquette le tag Git et crée la Release GitHub (via gh CLI si présent).
  7. Nettoie le dossier `dist/` local.

Il n'y a plus de branche `socle` : la distribution dynamique est servie depuis
`gh-pages` (dist/ + images/), et l'archive zip est l'artefact de release.
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import urllib.request
import zipfile
import hashlib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST_PATH = os.path.join(BASE_DIR, "manifest.json")
BACKGROUND_PATH = os.path.join(BASE_DIR, "js", "background.js")
BRIDGE_PATH = os.path.join(BASE_DIR, "js", "bridge.js")
DIST_DIR = os.path.join(BASE_DIR, "dist")
IMAGES_DIR = os.path.join(BASE_DIR, "images")
BRANCH_GH_PAGES = "gh-pages"

def run_cmd(cmd, cwd=BASE_DIR, check=True):
    """Exécute une commande système et retourne sa sortie textuelle."""
    git_cmd_prefix = "-c safe.directory=* " if cmd.strip().startswith("git") else ""
    full_cmd = f"git {git_cmd_prefix}{cmd[4:]}" if cmd.strip().startswith("git ") else cmd
    res = subprocess.run(full_cmd, cwd=cwd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace")
    if check and res.returncode != 0:
        print(f"Erreur lors de l'exécution : {cmd}", file=sys.stderr)
        print(res.stderr, file=sys.stderr)
        sys.exit(res.returncode)
    return res.stdout.strip()

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
        if "manifest.json" in remote_files:
            try:
                manifest_obj = json.loads(remote_files["manifest.json"].decode("utf-8"))
                manifest_obj = normaliser_manifest_icones(manifest_obj)
                remote_files["manifest.json"] = json.dumps(manifest_obj, sort_keys=True, ensure_ascii=False).encode("utf-8")
            except Exception:
                pass

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

def verifier_git_propre():
    status = run_cmd("git status --porcelain")
    lines = [line for line in status.splitlines() if not line.strip().endswith("dist/") and " dist/" not in line]
    if lines:
        print("Erreur : Des modifications non commitées sont présentes dans le dépôt Git :", file=sys.stderr)
        for l in lines:
            print("  " + l, file=sys.stderr)
        print("Veuillez commiter ou remiser vos modifications avant de lancer une release.", file=sys.stderr)
        sys.exit(1)

def verifier_deploiement_gh_pages(version, expected_sha256, max_wait_seconds=60, retry_interval_seconds=15):
    base_update_url = 'https://arpegorpsgh.github.io/Outiiil/dist/'
    version_url = base_update_url + 'version.json'
    start = __import__('time').time()
    last_problems = []
    while True:
        problems = []
        # Cache-busting: GitHub Pages CDN can serve a stale version.json (the only file
        # that changes when the hash changes). The runtime itself uses ?_t=Date.now(),
        # so we must fetch the same way to avoid a false mismatch.
        cache_buster = str(int(__import__('time').time() * 1000))
        try:
            req = urllib.request.Request(version_url + '?_t=' + cache_buster, headers={'Cache-Control': 'no-cache', 'Pragma': 'no-cache'})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode('utf-8'))
        except Exception as e:
            problems = [f"impossible de lire version.json distant: {e}"]

        if not problems:
            remote_version = data.get('version')
            remote_sha = data.get('sha256')
            if remote_version != version:
                problems.append(f"version distante={remote_version}, attendue={version}")
            elif remote_sha != expected_sha256:
                problems.append(f"sha256 dans version.json distant={remote_sha}, attendu={expected_sha256}")

            try:
                remote_entries = []
                if data.get('runtime'):
                    remote_entries.append(data['runtime'])
                if data.get('css'):
                    remote_entries.append(data['css'])
                remote_entries.extend(data.get('images', []) or [])
                remote_entries.sort()

                print(f"[*] Fichiers distants inclus dans le hash ({len(remote_entries)}):")
                for rel_path in remote_entries:
                    print(f"  - {rel_path}")

                # Diagnostic par fichier : comparer le hash local et distant de chaque fichier
                print(f"[*] Diagnostic par fichier (hash local vs distant):")
                mismatches = []
                for rel_path in remote_entries:
                    local_path = os.path.join(DIST_DIR, rel_path)
                    local_hash = hashlib.sha256()
                    if os.path.exists(local_path):
                        with open(local_path, "rb") as f:
                            local_hash.update(f.read())
                        local_hash = local_hash.hexdigest()
                    else:
                        local_hash = "MANQUANT"
                    
                    try:
                        req = urllib.request.Request(base_update_url + rel_path + '?_t=' + cache_buster, headers={'Cache-Control': 'no-cache', 'Pragma': 'no-cache'})
                        with urllib.request.urlopen(req, timeout=30) as resp:
                            remote_bytes = resp.read()
                        remote_hash = hashlib.sha256(remote_bytes).hexdigest()
                    except Exception as e:
                        remote_hash = "ERREUR: " + str(e)
                    
                    match = local_hash == remote_hash
                    symbol = "✓" if match else "✗"
                    print(f"  {symbol} {rel_path}: local={local_hash[:16]}..., distant={remote_hash[:16] if isinstance(remote_hash, str) else remote_hash}")
                    if not match:
                        mismatches.append(rel_path)
                
                if mismatches:
                    print(f"[!] Fichiers différents entre local et distant: {', '.join(mismatches)}")

                remote_blobs = {}
                for rel_path in remote_entries:
                    req = urllib.request.Request(base_update_url + rel_path + '?_t=' + cache_buster, headers={'Cache-Control': 'no-cache', 'Pragma': 'no-cache'})
                    with urllib.request.urlopen(req, timeout=30) as resp:
                        remote_blobs[rel_path] = resp.read()

                combined_length = 0
                for rel_path in remote_entries:
                    combined_length += len(f"dist/{rel_path}\n".encode('utf-8')) + len(remote_blobs[rel_path])
                combined = bytearray(combined_length)
                offset = 0
                for rel_path in remote_entries:
                    prefix = f"dist/{rel_path}\n".encode('utf-8')
                    combined[offset:offset + len(prefix)] = prefix
                    offset += len(prefix)
                    blob = remote_blobs[rel_path]
                    combined[offset:offset + len(blob)] = blob
                    offset += len(blob)

                remote_computed_sha = hashlib.sha256(bytes(combined)).hexdigest()
                if remote_computed_sha != expected_sha256:
                    problems.append(f"sha256 global distant={remote_computed_sha}, attendu={expected_sha256}")
            except Exception as e:
                problems.append(f"impossible de vérifier le hash global distant: {e}")

        last_problems = problems
        if not problems:
            print(f"[*] Déploiement gh-pages cohérent pour v{version} (version.json et dist/ vérifiés).")
            return True

        elapsed = __import__('time').time() - start
        if elapsed >= max_wait_seconds:
            print(
                f"[!] Déploiement incohérent : {'; '.join(last_problems)}.",
                file=sys.stderr,
            )
            return False

        print(f"[*] Vérification différée de {retry_interval_seconds}s pour laisser le CDN se propager...")
        __import__('time').sleep(retry_interval_seconds)

def get_current_branch():
    return run_cmd("git rev-parse --abbrev-ref HEAD")

def main():
    print("========================================")
    print("  OUTIIIL - Orchestrateur de Release    ")
    print("========================================")

    # 1. Vérification Git
    verifier_git_propre()
    branche_origine = get_current_branch()
    print(f"[*] Branche courante : {branche_origine}")

    # 2. Lecture de la version
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest_data = json.load(f)
    version = manifest_data.get("version")
    if not version:
        print("Erreur : Impossible de lire la version dans manifest.json", file=sys.stderr)
        sys.exit(1)

    print(f"[*] Version cible pour la release : {version}")
    tag_name = version

    # 3. Compilation du runtime dans dist/
    print("[*] Compilation du runtime...")
    build_script = os.path.join(BASE_DIR, "scripts", "build_bundle.py")
    run_cmd(f'python "{build_script}"')

    if not os.path.exists(DIST_DIR) or not os.path.exists(os.path.join(DIST_DIR, "version.json")):
        print("Erreur : La compilation de dist/ a échoué.", file=sys.stderr)
        sys.exit(1)

    # Vérification locale de cohérence sha256 avant déploiement
    dist_version_path = os.path.join(DIST_DIR, "version.json")
    with open(dist_version_path, "r", encoding="utf-8") as f:
        dist_version_data = json.load(f)
    dist_entries = []
    for racine, _, fichiers in os.walk(DIST_DIR):
        for fichier in fichiers:
            chemin_complet = os.path.join(racine, fichier)
            rel_path = os.path.relpath(chemin_complet, DIST_DIR).replace(os.sep, "/")
            if rel_path == "version.json":
                continue
            dist_entries.append(rel_path)
    dist_entries.sort()
    
    print(f"[*] Fichiers inclus dans le hash local ({len(dist_entries)}):")
    for rel_path in dist_entries:
        print(f"  - {rel_path}")
    
    computed_hash = hashlib.sha256()
    for rel_path in dist_entries:
        abs_path = os.path.join(DIST_DIR, rel_path)
        with open(abs_path, "rb") as f:
            computed_hash.update(f"dist/{rel_path}\n".encode("utf-8"))
            computed_hash.update(f.read())
    computed_hash = computed_hash.hexdigest()
    expected_hash = dist_version_data.get("sha256")
    if expected_hash != computed_hash:
        print(
            f"Erreur : Incohérence locale avant déploiement : version.json indique {expected_hash}, "
            f"mais dist/ vaut {computed_hash}.",
            file=sys.stderr,
        )
        sys.exit(1)
    print(f"[*] SHA-256 local vérifié : {computed_hash}")

    # 4. Génération de l'archive zip (uniquement si le socle a changé)
    print("[*] Vérification des modifications du socle (manifest + js + icons, HORS numéro de version)...")
    socle_a_changer, raison_socle = verifier_socle_a_changer(version)
    if socle_a_changer:
        print(f"[*] Le socle a changé ({raison_socle}) : génération de l'archive zip et de la release GitHub.")
    else:
        print(f"[*] Le socle n'a pas changé ({raison_socle}) : archive zip et release GitHub sautées, push de la distribution sur gh-pages uniquement.")

    zip_dest_path = None
    zip_filename = None
    if socle_a_changer:
        zip_filename = f"Outiiil-v{version}.zip"
        zip_dest_path = os.path.join(BASE_DIR, zip_filename)
        print(f"[*] Génération de l'archive de release : {zip_filename}...")
        with tempfile.TemporaryDirectory() as temp_zip_dir:
            # manifest.json — l'artefact de release ne contient pas de dist/ ;
            # les icônes sont placées dans un dossier "icons/" à la racine (et le manifest
            # est modifié pour référence "icons/gear_48.png" au lieu de "images/icons/...").
            with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
                manifest = json.load(f)
            if "icons" in manifest:
                for key, path in list(manifest["icons"].items()):
                    if path.startswith("images/icons/"):
                        manifest["icons"][key] = "icons/" + os.path.basename(path)
            if "action" in manifest and "default_icon" in manifest["action"]:
                if manifest["action"]["default_icon"].startswith("images/icons/"):
                    manifest["action"]["default_icon"] = "icons/" + os.path.basename(manifest["action"]["default_icon"])
            with open(os.path.join(temp_zip_dir, "manifest.json"), "w", encoding="utf-8") as f:
                json.dump(manifest, f, indent=2, ensure_ascii=False)

            # js/background.js avec DEV_MODE = false
            os.makedirs(os.path.join(temp_zip_dir, "js"), exist_ok=True)
            with open(BACKGROUND_PATH, "r", encoding="utf-8") as f:
                bg_code = f.read()
            bg_code_prod = bg_code.replace("const DEV_MODE = true;", "const DEV_MODE = false;")
            # Écrire avec LF pour que le zip distant soit identique au source local
            # (sans newline=, Windows écrirait CRLF → fausse différence de hash).
            with open(os.path.join(temp_zip_dir, "js", "background.js"), "w", encoding="utf-8", newline="\n") as f:
                f.write(bg_code_prod)

            # js/bridge.js (copié directement)
            with open(BRIDGE_PATH, "r", encoding="utf-8") as f:
                bridge_code = f.read()
            with open(os.path.join(temp_zip_dir, "js", "bridge.js"), "w", encoding="utf-8", newline="\n") as f:
                f.write(bridge_code)

            # icons/ à la racine du zip (les icônes d'extension, sans le dossier images/)
            icons_src = os.path.join(IMAGES_DIR, "icons")
            if os.path.isdir(icons_src):
                icons_dest = os.path.join(temp_zip_dir, "icons")
                if os.path.exists(icons_dest):
                    shutil.rmtree(icons_dest)
                shutil.copytree(icons_src, icons_dest)

            # Création du zip
            with zipfile.ZipFile(zip_dest_path, "w", zipfile.ZIP_DEFLATED) as zipf:
                for root, _, files in os.walk(temp_zip_dir):
                    for file in files:
                        full_path = os.path.join(root, file)
                        rel_path = os.path.relpath(full_path, temp_zip_dir)
                        zipf.write(full_path, rel_path)

    # 5. Déploiement sur gh-pages avec tag Git
    print(f"[*] Déploiement du runtime sur la branche '{BRANCH_GH_PAGES}'...")
    remote_url = run_cmd("git remote get-url origin")

    with tempfile.TemporaryDirectory() as temp_gh_dir:
        run_cmd(f'git clone --single-branch --branch {BRANCH_GH_PAGES} "{remote_url}" "{temp_gh_dir}"')
        if not os.path.exists(os.path.join(temp_gh_dir, ".git")):
            run_cmd(f'git clone "{remote_url}" "{temp_gh_dir}"')
            run_cmd(f"git checkout --orphan {BRANCH_GH_PAGES}", cwd=temp_gh_dir)
            run_cmd("git rm -rf .", cwd=temp_gh_dir, check=False)

        # Vérifier s'il y a un .gitignore dans gh-pages qui pourrait bloquer dist/
        gitignore_path = os.path.join(temp_gh_dir, ".gitignore")
        if os.path.exists(gitignore_path):
            with open(gitignore_path, "r", encoding="utf-8") as f:
                gitignore_content = f.read()
            if "dist/" in gitignore_content or "dist" in gitignore_content:
                print(f"[!] Attention : .gitignore dans gh-pages contient une règle qui pourrait ignorer dist/")
        
        # Vérifier les flags git sur les fichiers dist/
        for fname in ["dist/runtime.js", "dist/runtime.css"]:
            flags = run_cmd(f"git ls-files -v {fname}", cwd=temp_gh_dir)
            if flags and flags.startswith("S"):
                print(f"[!] Attention : {fname} a le flag skip-worktree dans gh-pages")
            elif flags and flags.startswith("h"):
                print(f"[!] Attention : {fname} a le flag assume-unchanged dans gh-pages")

        # Copier le contenu de dist/ sous dist/ de gh-pages
        dest_dist = os.path.join(temp_gh_dir, "dist")
        if os.path.exists(dest_dist):
            shutil.rmtree(dest_dist)
        shutil.copytree(DIST_DIR, dest_dist)

        copied_runtime_path = os.path.join(dest_dist, "runtime.js")
        copied_runtime_size = os.path.getsize(copied_runtime_path) if os.path.exists(copied_runtime_path) else -1
        copied_runtime_sha = None
        if copied_runtime_size > 0:
            with open(copied_runtime_path, "rb") as f:
                copied_runtime_sha = hashlib.sha256(f.read()).hexdigest()
        print(f"[*] Diagnostic copie : runtime.js taille={copied_runtime_size} octets, sha256={copied_runtime_sha}, attendu={computed_hash}")

        # Ajouter et commiter sur gh-pages
        run_cmd("git add -A", cwd=temp_gh_dir)
        status_gh = run_cmd("git status --porcelain", cwd=temp_gh_dir)
        print(f"[*] Diagnostic git gh-pages status:\n{status_gh}")
        
        # Forcer l'ajout de dist/runtime.js et dist/runtime.css s'ils ne sont pas détectés
        if status_gh and "dist/runtime.js" not in status_gh and "dist/runtime.css" not in status_gh:
            print("[*] Forçage de l'ajout de dist/runtime.js et dist/runtime.css...")
            run_cmd("git add -f dist/runtime.js dist/runtime.css", cwd=temp_gh_dir)
            status_gh = run_cmd("git status --porcelain", cwd=temp_gh_dir)
            print(f"[*] Diagnostic git gh-pages status après forçage:\n{status_gh}")

        if status_gh:
            runtime_diff = run_cmd("git diff -- dist/runtime.js", cwd=temp_gh_dir)
            print(f"[*] Diagnostic git gh-pages diff dist/runtime.js:\n{runtime_diff}")
        if status_gh:
            run_cmd(f'git commit -m "Release {version} (runtime update)"', cwd=temp_gh_dir)
            run_cmd(f"git push origin {BRANCH_GH_PAGES}", cwd=temp_gh_dir)
            print(f"  -> Branche {BRANCH_GH_PAGES} mise à jour et poussée.")
            commit_hash = run_cmd("git rev-parse HEAD", cwd=temp_gh_dir)
            print(f"[*] Diagnostic git gh-pages commit: {commit_hash}")
            print(f"[*] Diagnostic git gh-pages diff stat:\n{run_cmd('git show --stat HEAD', cwd=temp_gh_dir)}")
            print(f"[*] Diagnostic git gh-pages dist/ status:\n{run_cmd('git ls-tree -r HEAD -- dist/', cwd=temp_gh_dir)}")
            prev_commit = run_cmd("git rev-parse HEAD~1", cwd=temp_gh_dir)
            print(f"[*] Diagnostic git gh-pages previous commit: {prev_commit}")
            print(f"[*] Diagnostic git gh-pages previous dist/runtime.js blob:\n{run_cmd('git ls-tree -r HEAD~1 -- dist/runtime.js', cwd=temp_gh_dir)}")
        else:
            print(f"  -> Aucun changement détecté pour {BRANCH_GH_PAGES}.")

    if not verifier_deploiement_gh_pages(version, computed_hash):
        print("[!] Déploiement gh-pages incohérent côté distant ; la release continue, mais l'incohérence sera détectée au runtime.", file=sys.stderr)

    # Création (ou re-création en force) et push du tag (uniquement si le socle a changé)
    if socle_a_changer:
        with tempfile.TemporaryDirectory() as temp_tag_dir:
            run_cmd(f'git clone --single-branch --branch {BRANCH_GH_PAGES} "{remote_url}" "{temp_tag_dir}"')
            run_cmd(f'git tag -fa {tag_name} -m "Release {version}"', cwd=temp_tag_dir)
            run_cmd(f"git push -f origin {tag_name}", cwd=temp_tag_dir)
            print(f"  -> Tag Git {tag_name} créé et poussé.")

    # 7. Publication de la Release GitHub (uniquement si le socle a changé)
    if socle_a_changer:
        print(f"[*] Publication de la release GitHub pour le tag {tag_name}...")
        gh_available = shutil.which("gh") is not None
        if gh_available:
            cmd_gh = f'gh release create {tag_name} "{zip_dest_path}" --title "Outiiil {version}" --target {BRANCH_GH_PAGES} --notes "Mise à jour dynamique Outiiil v{version}"'
            res_gh = run_cmd(cmd_gh)
            print(f"  -> Release GitHub créée avec succès via gh CLI : {res_gh}")
        else:
            print(f"  -> GitHub CLI (gh) non détecté. Vous pouvez créer la release manuellement sur GitHub en y joignant {zip_filename}.")
    else:
        print(f"  -> Aucune archive zip/tag/release : le socle n'a pas changé.")

    # 8. Nettoyage local du dossier dist/
    if os.path.exists(DIST_DIR):
        shutil.rmtree(DIST_DIR)
        print("[*] Nettoyage local du dossier dist/ effectué.")

    print("========================================")
    print(f" Release {version} terminée avec succès ! ")
    print(f" - {BRANCH_GH_PAGES:<12}: runtime déployé + tag {tag_name}")
    print(f" - artefact    : {zip_filename or '(none - socle inchangé)'}")
    print(f" - branche     : reste sur {branche_origine} en mode DEV")
    print("========================================")

if __name__ == "__main__":
    main()
