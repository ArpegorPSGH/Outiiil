#!/usr/bin/env python3
"""
scripts/release.py
Orchestrateur de release automatisé pour Outiiil.

Workflow :
 1. Vérifie que le répertoire de travail Git est propre.
 2. Récupère la version actuelle depuis manifest.json.
 3. Compile le dossier `dist/` complet (bundle.js, bundle.css, version.json, images/).
 4. Publie le contenu de `dist/` sur la branche distante `gh-pages` (sans polluer l'arbre Git local).
 5. Met à jour la branche `socle` (manifest.json, loader.js avec DEV_MODE=false, dist/) et crée le tag Git vX.Y.Z.
 6. Archive un zip de distribution du socle minimal (`Outiiil-vX.Y.Z.zip`).
 7. Crée la Release sur GitHub (via GitHub CLI `gh` si présent, ou invite à l'attacher).
 8. Nettoie le dossier `dist/` local et garantit que la branche de travail reste sur `dev` avec `DEV_MODE=true`.
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

def run_cmd(cmd, cwd=BASE_DIR, check=True):
    """Exécute une commande système et retourne sa sortie textuelle."""
    res = subprocess.run(cmd, cwd=cwd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace")
    if check and res.returncode != 0:
        print(f"Erreur lors de l'exécution : {cmd}", file=sys.stderr)
        print(res.stderr, file=sys.stderr)
        sys.exit(res.returncode)
    return res.stdout.strip()

def verifier_git_propre():
    status = run_cmd("git status --porcelain")
    # Ignorer le dossier dist/ s'il apparaît dans le status
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
    tag_name = f"v{version}"

    # 3. Compilation du bundle dans dist/
    print("[*] Compilation du bundle...")
    build_script = os.path.join(BASE_DIR, "scripts", "build_bundle.py")
    run_cmd(f'python "{build_script}"')

    if not os.path.exists(DIST_DIR) or not os.path.exists(os.path.join(DIST_DIR, "version.json")):
        print("Erreur : La compilation de dist/ a échoué.", file=sys.stderr)
        sys.exit(1)

    # 4. Publication sur la branche gh-pages
    print(f"[*] Déploiement du bundle sur la branche 'gh-pages'...")
    with tempfile.TemporaryDirectory() as temp_gh_dir:
        # Clone local léger de la branche gh-pages ou création orpheline
        remote_branches = run_cmd("git branch -r", check=False)
        has_remote_gh = "origin/gh-pages" in remote_branches

        run_cmd(f'git clone --single-branch --branch gh-pages . "{temp_gh_dir}"', check=False)
        if not os.path.exists(os.path.join(temp_gh_dir, ".git")):
            # Si gh-pages n'existe pas encore localement ou sur origin
            run_cmd(f'git clone . "{temp_gh_dir}"')
            run_cmd("git checkout --orphan gh-pages", cwd=temp_gh_dir)
            run_cmd("git rm -rf .", cwd=temp_gh_dir, check=False)

        # Copier le contenu de dist/ à la racine du clone gh-pages (ou sous dist/)
        dest_dist = os.path.join(temp_gh_dir, "dist")
        if os.path.exists(dest_dist):
            shutil.rmtree(dest_dist)
        shutil.copytree(DIST_DIR, dest_dist)

        # Ajouter et commiter sur gh-pages
        run_cmd("git add -A", cwd=temp_gh_dir)
        status_gh = run_cmd("git status --porcelain", cwd=temp_gh_dir)
        if status_gh:
            run_cmd(f'git commit -m "Release {version} (dist update)"', cwd=temp_gh_dir)
            run_cmd(f'git push origin gh-pages', cwd=temp_gh_dir, check=False)
            print("  -> Branche gh-pages mise à jour et poussée.")
        else:
            print("  -> Aucun changement détecté pour gh-pages.")

    # 5. Préparation de la branche socle
    print(f"[*] Préparation de la branche 'socle' pour la version {version}...")
    with tempfile.TemporaryDirectory() as temp_socle_dir:
        run_cmd(f'git clone . "{temp_socle_dir}"')
        run_cmd("git checkout -B socle", cwd=temp_socle_dir)
        run_cmd("git rm -rf .", cwd=temp_socle_dir, check=False)

        # Recréer l'arborescence minimale du socle
        # - manifest.json
        # - js/loader.js (avec DEV_MODE = false)
        # - dist/
        os.makedirs(os.path.join(temp_socle_dir, "js"), exist_ok=True)
        shutil.copyfile(MANIFEST_PATH, os.path.join(temp_socle_dir, "manifest.json"))

        with open(LOADER_PATH, "r", encoding="utf-8") as f_loader:
            loader_code = f_loader.read()
        loader_code_prod = loader_code.replace("const DEV_MODE = true;", "const DEV_MODE = false;")
        with open(os.path.join(temp_socle_dir, "js", "loader.js"), "w", encoding="utf-8") as f_loader_out:
            f_loader_out.write(loader_code_prod)

        shutil.copytree(DIST_DIR, os.path.join(temp_socle_dir, "dist"))

        # Création du zip d'installation initiale
        zip_filename = f"Outiiil-{version}.zip"
        zip_dest_path = os.path.join(BASE_DIR, zip_filename)
        print(f"[*] Génération de l'archive d'installation initiale : {zip_filename}...")
        with zipfile.ZipFile(zip_dest_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(temp_socle_dir):
                if ".git" in root:
                    continue
                for file in files:
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, temp_socle_dir)
                    zipf.write(full_path, rel_path)

        run_cmd("git add -A", cwd=temp_socle_dir)
        status_socle = run_cmd("git status --porcelain", cwd=temp_socle_dir)
        if status_socle:
            run_cmd(f'git commit -m "Socle minimal Release {version}"', cwd=temp_socle_dir)
            run_cmd("git push origin socle", cwd=temp_socle_dir, check=False)
            print("  -> Branche socle mise à jour et poussée.")

        # Tag de release
        run_cmd(f'git tag -a {tag_name} -m "Release {version}"', cwd=temp_socle_dir, check=False)
        run_cmd(f'git push origin {tag_name}', cwd=temp_socle_dir, check=False)
        print(f"  -> Tag Git {tag_name} créé et poussé.")

    # 6. Tentative de création de Release GitHub avec gh CLI
    print(f"[*] Publication de la release GitHub pour {tag_name}...")
    gh_available = shutil.which("gh") is not None
    if gh_available:
        cmd_gh = f'gh release create {tag_name} "{zip_dest_path}" --title "Outiiil {version}" --notes "Mise à jour dynamique Outiiil v{version}"'
        res_gh = run_cmd(cmd_gh, check=False)
        print(f"  -> Release GitHub créée avec succès via gh CLI : {res_gh}")
    else:
        print(f"  -> GitHub CLI (gh) n'est pas installé. Veuillez créer la release manuellement sur GitHub en y joignant {zip_filename}.")

    # 7. Nettoyage local
    if os.path.exists(DIST_DIR):
        shutil.rmtree(DIST_DIR)
        print("[*] Nettoyage local du dossier dist/ effectué.")

    print("========================================")
    print(f" Release {version} terminée avec succès ! ")
    print(f" - gh-pages : code dynamique déployé")
    print(f" - socle    : socle minimal prêt")
    print(f" - archive  : {zip_filename}")
    print(f" - branche  : reste sur {branche_origine} en mode DEV")
    print("========================================")

if __name__ == "__main__":
    main()
