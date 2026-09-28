#!/usr/bin/env python3
"""
scripts/release.py
Orchestrateur de release automatisé pour Outiiil.

Workflow :
  1. Vérifie que le répertoire de travail Git est propre.
  2. Récupère la version actuelle depuis manifest.json.
  3. Compile le dossier `dist/` complet (runtime.js, runtime.css, version.json, images/).
  4. Génère l'archive zip de distribution du socle (`Outiiil-vX.Y.zip` :
     manifest.json, js/background.js, js/bridge.js, dist/).
  5. Déploie le contenu de `dist/` sur la branche distante `gh-pages`.
  6. Met à jour la branche `socle` avec le socle minimal.
  7. Crée/étiquette le tag Git et crée la Release GitHub (via gh CLI si présent).
  8. Nettoie le dossier `dist/` local.
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
BRANCH_SOCLE = "socle"

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

def verifier_git_propre():
    status = run_cmd("git status --porcelain")
    lines = [line for line in status.splitlines() if not line.strip().endswith("dist/") and " dist/" not in line]
    if lines:
        print("Erreur : Des modifications non commitées sont présentes dans le dépôt Git :", file=sys.stderr)
        for l in lines:
            print("  " + l, file=sys.stderr)
        print("Veuillez commiter ou remiser vos modifications avant de lancer une release.", file=sys.stderr)
        sys.exit(1)

def verifier_deploiement_gh_pages(version, expected_sha256, max_wait_seconds=10, retry_interval_seconds=10):
    base_update_url = 'https://arpegorpsgh.github.io/Outiiil/dist/'
    version_url = base_update_url + 'version.json'
    start = __import__('time').time()
    last_problems = []
    while True:
        problems = []
        try:
            with urllib.request.urlopen(version_url, timeout=30) as resp:
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

                remote_blobs = {}
                for rel_path in remote_entries:
                    with urllib.request.urlopen(base_update_url + rel_path, timeout=30) as resp:
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

    # 4. Génération de l'archive zip (manifest + background.js + bridge.js + dist/* + dist/images/)
    zip_filename = f"Outiiil-v{version}.zip"
    zip_dest_path = os.path.join(BASE_DIR, zip_filename)
    print(f"[*] Génération de l'archive de release : {zip_filename}...")

    with tempfile.TemporaryDirectory() as temp_zip_dir:
        # manifest.json
        with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
            manifest = json.load(f)
        # Mettre à jour les chemins des icônes vers dist/images/
        if "icons" in manifest:
            for key, path in manifest["icons"].items():
                if path.startswith("images/"):
                    manifest["icons"][key] = "dist/" + path
        if "action" in manifest and "default_icon" in manifest["action"]:
            if manifest["action"]["default_icon"].startswith("images/"):
                manifest["action"]["default_icon"] = "dist/" + manifest["action"]["default_icon"]
        with open(os.path.join(temp_zip_dir, "manifest.json"), "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)

        # js/background.js avec DEV_MODE = false
        os.makedirs(os.path.join(temp_zip_dir, "js"), exist_ok=True)
        with open(BACKGROUND_PATH, "r", encoding="utf-8") as f:
            bg_code = f.read()
        bg_code_prod = bg_code.replace("const DEV_MODE = true;", "const DEV_MODE = false;")
        with open(os.path.join(temp_zip_dir, "js", "background.js"), "w", encoding="utf-8") as f:
            f.write(bg_code_prod)

        # js/bridge.js (copié directement)
        with open(BRIDGE_PATH, "r", encoding="utf-8") as f:
            bridge_code = f.read()
        with open(os.path.join(temp_zip_dir, "js", "bridge.js"), "w", encoding="utf-8") as f:
            f.write(bridge_code)

        # dist/ : runtime.js, runtime.css, version.json, images/
        dist_target = os.path.join(temp_zip_dir, "dist")
        os.makedirs(dist_target, exist_ok=True)
        for fname in ["runtime.js", "runtime.css", "version.json"]:
            src = os.path.join(DIST_DIR, fname)
            if os.path.exists(src):
                shutil.copy2(src, os.path.join(dist_target, fname))

        # images/ dans dist/
        if not os.path.exists(IMAGES_DIR):
            print("Erreur : le dossier images/ est introuvable à la racine du projet.", file=sys.stderr)
            sys.exit(1)
        images_dest = os.path.join(dist_target, "images")
        if os.path.exists(images_dest):
            shutil.rmtree(images_dest)
        shutil.copytree(IMAGES_DIR, images_dest)

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
        print("Erreur : Le déploiement gh-pages est incohérent. Abandon de la release.", file=sys.stderr)
        sys.exit(1)

    # Création (ou re-création en force) et push du tag
    with tempfile.TemporaryDirectory() as temp_tag_dir:
        run_cmd(f'git clone --single-branch --branch {BRANCH_GH_PAGES} "{remote_url}" "{temp_tag_dir}"')
        run_cmd(f'git tag -fa {tag_name} -m "Release {version}"', cwd=temp_tag_dir)
        run_cmd(f"git push -f origin {tag_name}", cwd=temp_tag_dir)
        print(f"  -> Tag Git {tag_name} créé et poussé.")

    # 6. Mise à jour de la branche socle
    print(f"[*] Mise à jour de la branche '{BRANCH_SOCLE}'...")
    with tempfile.TemporaryDirectory() as temp_socle_dir:
        try:
            run_cmd(f'git clone --single-branch --branch {BRANCH_SOCLE} "{remote_url}" "{temp_socle_dir}"')
        except SystemExit:
            print(f"  -> La branche {BRANCH_SOCLE} n'existe pas encore, création...")
            run_cmd(f'git clone "{remote_url}" "{temp_socle_dir}"')
            run_cmd(f"git checkout --orphan {BRANCH_SOCLE}", cwd=temp_socle_dir)
            run_cmd("git rm -rf .", cwd=temp_socle_dir, check=False)

        # Copier le socle minimal
        shutil.copy2(MANIFEST_PATH, os.path.join(temp_socle_dir, "manifest.json"))

        # background.js avec DEV_MODE = false
        os.makedirs(os.path.join(temp_socle_dir, "js"), exist_ok=True)
        with open(BACKGROUND_PATH, "r", encoding="utf-8") as f:
            bg_code = f.read()
        bg_code_prod = bg_code.replace("const DEV_MODE = true;", "const DEV_MODE = false;")
        with open(os.path.join(temp_socle_dir, "js", "background.js"), "w", encoding="utf-8") as f:
            f.write(bg_code_prod)

        # bridge.js
        with open(BRIDGE_PATH, "r", encoding="utf-8") as f:
            bridge_code = f.read()
        with open(os.path.join(temp_socle_dir, "js", "bridge.js"), "w", encoding="utf-8") as f:
            f.write(bridge_code)

        # dist/ complet
        dist_dest = os.path.join(temp_socle_dir, "dist")
        if os.path.exists(dist_dest):
            shutil.rmtree(dist_dest)
        if os.path.exists(DIST_DIR):
            shutil.copytree(DIST_DIR, dist_dest)

        # images/
        images_dest = os.path.join(temp_socle_dir, "images")
        if os.path.exists(images_dest):
            shutil.rmtree(images_dest)
        if os.path.exists(IMAGES_DIR):
            shutil.copytree(IMAGES_DIR, images_dest)

        # scripts/ (bundle_sources.json needed for DEV_MODE source loading in background.js)
        scripts_src = os.path.join(BASE_DIR, "scripts")
        if os.path.exists(scripts_src):
            scripts_dest = os.path.join(temp_socle_dir, "scripts")
            if os.path.exists(scripts_dest):
                shutil.rmtree(scripts_dest)
            shutil.copytree(scripts_src, scripts_dest)

        # Commit et push
        run_cmd("git add -A", cwd=temp_socle_dir)
        status_socle = run_cmd("git status --porcelain", cwd=temp_socle_dir)
        if status_socle:
            run_cmd(f'git commit -m "Update socle for v{version}"', cwd=temp_socle_dir)
            run_cmd(f"git push -f origin {BRANCH_SOCLE}", cwd=temp_socle_dir)
            print(f"  -> Branche {BRANCH_SOCLE} mise à jour et poussée.")
        else:
            print(f"  -> Aucun changement détecté pour {BRANCH_SOCLE}.")

    # 7. Publication de la Release GitHub
    print(f"[*] Publication de la release GitHub pour le tag {tag_name}...")
    gh_available = shutil.which("gh") is not None
    if gh_available:
        cmd_gh = f'gh release create {tag_name} "{zip_dest_path}" --title "Outiiil {version}" --target {BRANCH_GH_PAGES} --notes "Mise à jour dynamique Outiiil v{version}"'
        res_gh = run_cmd(cmd_gh)
        print(f"  -> Release GitHub créée avec succès via gh CLI : {res_gh}")
    else:
        print(f"  -> GitHub CLI (gh) non détecté. Vous pouvez créer la release manuellement sur GitHub en y joignant {zip_filename}.")

    # 8. Nettoyage local du dossier dist/
    if os.path.exists(DIST_DIR):
        shutil.rmtree(DIST_DIR)
        print("[*] Nettoyage local du dossier dist/ effectué.")

    print("========================================")
    print(f" Release {version} terminée avec succès ! ")
    print(f" - {BRANCH_GH_PAGES:<12}: runtime déployé + tag {tag_name}")
    print(f" - {BRANCH_SOCLE:<12}: socle minimal mis à jour")
    print(f" - artefact    : {zip_filename}")
    print(f" - branche     : reste sur {branche_origine} en mode DEV")
    print("========================================")

if __name__ == "__main__":
    main()
