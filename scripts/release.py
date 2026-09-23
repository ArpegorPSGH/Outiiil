#!/usr/bin/env python3
"""
scripts/release.py
Orchestrateur de release automatisé pour Outiiil.

Workflow :
 1. Vérifie que le répertoire de travail Git est propre.
 2. Récupère la version actuelle depuis manifest.json.
 3. Compile le dossier `dist/` complet (bundle.js, bundle.css, version.json, images/).
 4. Génère l'archive zip de distribution du socle (`Outiiil-vX.Y.zip` : manifest, loader, dist/, images/).
 5. Déploie le contenu de `dist/` sur la branche distante `gh-pages` et tague le commit avec le numéro de version.
 6. Crée la Release sur GitHub (via GitHub CLI `gh` si présent) en y attachant le zip.
 7. Nettoie le dossier `dist/` local et garantit que la branche de travail reste sur `dev`.
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import zipfile

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST_PATH = os.path.join(BASE_DIR, "manifest.json")
LOADER_PATH = os.path.join(BASE_DIR, "js", "loader.js")
DIST_DIR = os.path.join(BASE_DIR, "dist")
IMAGES_DIR = os.path.join(BASE_DIR, "images")

# Nom de la branche de distribution GitHub Pages
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

def verifier_git_propre():
    status = run_cmd("git status --porcelain")
    lines = [line for line in status.splitlines() if not line.strip().endswith("dist/") and " dist/" not in line]
    if lines:
        print("Erreur : Des modifications non commitées sont présentes dans le dépôt Git :", file=sys.stderr)
        for l in lines:
            print("  " + l, file=sys.stderr)
        print("Veuillez commiter ou remiser vos modifications avant de lancer une release.", file=sys.stderr)
        sys.exit(1)

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

    # 3. Compilation du bundle dans dist/
    print("[*] Compilation du bundle...")
    build_script = os.path.join(BASE_DIR, "scripts", "build_bundle.py")
    run_cmd(f'python "{build_script}"')

    if not os.path.exists(DIST_DIR) or not os.path.exists(os.path.join(DIST_DIR, "version.json")):
        print("Erreur : La compilation de dist/ a échoué.", file=sys.stderr)
        sys.exit(1)

    # 4. Génération de l'archive zip (manifest + loader en prod + dist + images racine)
    zip_filename = f"Outiiil-v{version}.zip"
    zip_dest_path = os.path.join(BASE_DIR, zip_filename)
    print(f"[*] Génération de l'archive de release : {zip_filename}...")

    with tempfile.TemporaryDirectory() as temp_zip_dir:
        # manifest.json
        shutil.copyfile(MANIFEST_PATH, os.path.join(temp_zip_dir, "manifest.json"))

        # js/loader.js avec DEV_MODE = false
        os.makedirs(os.path.join(temp_zip_dir, "js"), exist_ok=True)
        with open(LOADER_PATH, "r", encoding="utf-8") as f_loader:
            loader_code = f_loader.read()
        loader_code_prod = loader_code.replace("const DEV_MODE = true;", "const DEV_MODE = false;")
        with open(os.path.join(temp_zip_dir, "js", "loader.js"), "w", encoding="utf-8") as f_loader_out:
            f_loader_out.write(loader_code_prod)

        # dist/
        shutil.copytree(DIST_DIR, os.path.join(temp_zip_dir, "dist"))

        # images/ à la racine (référencées par le manifest et le bundle)
        if not os.path.exists(IMAGES_DIR):
            print("Erreur : le dossier images/ est introuvable à la racine du projet.", file=sys.stderr)
            sys.exit(1)
        shutil.copytree(IMAGES_DIR, os.path.join(temp_zip_dir, "images"))

        # Création du zip
        with zipfile.ZipFile(zip_dest_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(temp_zip_dir):
                for file in files:
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, temp_zip_dir)
                    zipf.write(full_path, rel_path)

    # 5. Déploiement sur gh-pages avec tag Git
    print(f"[*] Déploiement du bundle sur la branche '{BRANCH_GH_PAGES}'...")
    # URL du dépôt distant réel (GitHub), pour pousser vers origin et non vers le dépôt local
    remote_url = run_cmd("git remote get-url origin")

    with tempfile.TemporaryDirectory() as temp_gh_dir:
        run_cmd(f'git clone --single-branch --branch {BRANCH_GH_PAGES} "{remote_url}" "{temp_gh_dir}"')
        if not os.path.exists(os.path.join(temp_gh_dir, ".git")):
            # Si la branche n'existe pas encore sur origin, on la crée (orphan)
            run_cmd(f'git clone "{remote_url}" "{temp_gh_dir}"')
            run_cmd(f"git checkout --orphan {BRANCH_GH_PAGES}", cwd=temp_gh_dir)
            # Sur une branche orpheline fraîche, il n'y a rien à supprimer : seul échec toléré du script
            run_cmd("git rm -rf .", cwd=temp_gh_dir, check=False)

        # Copier le contenu de dist/ sous dist/ de gh-pages
        dest_dist = os.path.join(temp_gh_dir, "dist")
        if os.path.exists(dest_dist):
            shutil.rmtree(dest_dist)
        shutil.copytree(DIST_DIR, dest_dist)

        # Ajouter et commiter sur gh-pages
        run_cmd("git add -A", cwd=temp_gh_dir)
        status_gh = run_cmd("git status --porcelain", cwd=temp_gh_dir)
        if status_gh:
            run_cmd(f'git commit -m "Release {version} (dist update)"', cwd=temp_gh_dir)
            run_cmd(f"git push origin {BRANCH_GH_PAGES}", cwd=temp_gh_dir)
            print(f"  -> Branche {BRANCH_GH_PAGES} mise à jour et poussée.")
        else:
            print(f"  -> Aucun changement détecté pour {BRANCH_GH_PAGES}.")

        # Création (ou re-création en force) et push du tag sur ce commit
        run_cmd(f'git tag -fa {tag_name} -m "Release {version}"', cwd=temp_gh_dir)
        run_cmd(f"git push -f origin {tag_name}", cwd=temp_gh_dir)
        print(f"  -> Tag Git {tag_name} créé et poussé.")

    # 6. Publication de la Release GitHub via gh CLI
    print(f"[*] Publication de la release GitHub pour le tag {tag_name}...")
    gh_available = shutil.which("gh") is not None
    if gh_available:
        cmd_gh = f'gh release create {tag_name} "{zip_dest_path}" --title "Outiiil {version}" --target {BRANCH_GH_PAGES} --notes "Mise à jour dynamique Outiiil v{version}"'
        res_gh = run_cmd(cmd_gh)
        print(f"  -> Release GitHub créée avec succès via gh CLI : {res_gh}")
    else:
        print(f"  -> GitHub CLI (gh) non détecté. Vous pouvez créer la release manuellement sur GitHub en y joignant {zip_filename}.")

    # 7. Nettoyage local du dossier dist/
    if os.path.exists(DIST_DIR):
        shutil.rmtree(DIST_DIR)
        print("[*] Nettoyage local du dossier dist/ effectué.")

    print("========================================")
    print(f" Release {version} terminée avec succès ! ")
    print(f" - {BRANCH_GH_PAGES:<10} : code déployé + tag {tag_name}")
    print(f" - artefact   : {zip_filename}")
    print(f" - branche    : reste sur {branche_origine} en mode DEV")
    print("========================================")

if __name__ == "__main__":
    main()
