#!/usr/bin/env python3
"""
scripts/lib/release_common.py
Fonctions communes entre release.py (prod) et test_prod.py (test pré-déploiement).

Ces fonctions factorisent l'essentiel du workflow de release :
  - exécution de commandes git
  - vérification du répertoire Git propre
  - build du runtime (build_bundle.py)
  - vérification locale de cohérence sha256
  - génération de l'archive zip du socle (manifest + background + bridge + icons)
  - déploiement de dist/ sur une branche Git distante
  - vérification de cohérence sha256 à distance (optionnelle)
  - nettoyage du dossier dist/ local
"""

import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request
import zipfile

# __file__ est scripts/lib/release_common.py → remonter 3 niveaux pour atteindre la racine du projet
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class ReleaseContext:
    """Contexte partagé entre prod (release.py) et test (test_prod.py)."""

    def __init__(self, update_url=None, test_repo=None):
        self.base_dir = BASE_DIR
        self.manifest_path = os.path.join(BASE_DIR, "manifest.json")
        self.background_path = os.path.join(BASE_DIR, "js", "background.js")
        self.bridge_path = os.path.join(BASE_DIR, "js", "bridge.js")
        self.dist_dir = os.path.join(BASE_DIR, "dist")
        self.images_dir = os.path.join(BASE_DIR, "images")
        self.build_script = os.path.join(BASE_DIR, "scripts", "build_bundle.py")

        # URL de mise à jour distante (prod par défaut, test pour test_prod.py)
        self.update_url = update_url or "https://arpegorpsgh.github.io/Outiiil/dist/"
        self.test_repo = test_repo or "Outiiil-test"


# --------------------------------------------------------------------------- #
#  Command execution
# --------------------------------------------------------------------------- #

def run_cmd(cmd, cwd=None, check=True):
    """Exécute une commande système et retourne sa sortie textuelle."""
    cwd = cwd or BASE_DIR
    if cmd.strip().startswith("git "):
        full_cmd = f"git -c safe.directory=* {cmd[4:]}"
    else:
        full_cmd = cmd
    res = subprocess.run(
        full_cmd, cwd=cwd, shell=True,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        text=True, encoding="utf-8", errors="replace",
    )
    if check and res.returncode != 0:
        print(f"Erreur lors de l'exécution : {cmd}", file=sys.stderr)
        print(res.stderr, file=sys.stderr)
        sys.exit(res.returncode)
    return res.stdout.strip()


# --------------------------------------------------------------------------- #
#  Git helpers
# --------------------------------------------------------------------------- #

def verifier_git_propre(ctx, ignore_dist=True, extra_ignores=None):
    """
    Vérifie que le répertoire Git est propre.
    Par défaut, ignore les modifications du dossier dist/ (qui est généré).
    """
    status = run_cmd("git status --porcelain")
    ignores = [" dist/"]
    if extra_ignores:
        ignores.extend(extra_ignores)
    lines = [
        line for line in status.splitlines()
        if not (ignore_dist and any(ign in line for ign in ignores))
    ]
    if lines:
        print("Erreur : Des modifications non commitées sont présentes :", file=sys.stderr)
        for l in lines:
            print("  " + l, file=sys.stderr)
        print("Veuillez commiter ou remiser vos modifications avant de continuer.", file=sys.stderr)
        sys.exit(1)


def get_current_branch(ctx=None):
    """Retourne le nom de la branche Git courante."""
    return run_cmd("git rev-parse --abbrev-ref HEAD")


def get_current_head(ctx=None):
    """Retourne le hash du commit courant (court)."""
    return run_cmd("git rev-parse --short HEAD")


def get_remote_url(ctx=None):
    """Retourne l'URL du remote origin."""
    return run_cmd("git remote get-url origin")


# --------------------------------------------------------------------------- #
#  Manifest
# --------------------------------------------------------------------------- #

def read_manifest(ctx):
    """Lit manifest.json et retourne le dict."""
    with open(ctx.manifest_path, "r", encoding="utf-8") as f:
        return json.load(f)


# --------------------------------------------------------------------------- #
#  Build
# --------------------------------------------------------------------------- #

def build_runtime(ctx, version=None):
    """
    Build du runtime via build_bundle.py.
    Si version est fournie, build_bundle.py l'utilise à la place du manifeste.
    """
    cmd = f'python "{ctx.build_script}"'
    if version:
        cmd += f' --version "{version}"'
    print(f"[*] Compilation du runtime{' (' + version + ')' if version else ''}...")
    run_cmd(cmd)

    if not os.path.exists(ctx.dist_dir):
        print("Erreur : La compilation de dist/ a échoué (dossier absent).", file=sys.stderr)
        sys.exit(1)
    if not os.path.exists(os.path.join(ctx.dist_dir, "version.json")):
        print("Erreur : version.json absent après compilation.", file=sys.stderr)
        sys.exit(1)


# --------------------------------------------------------------------------- #
#  Local sha256 verification
# --------------------------------------------------------------------------- #

def compute_dist_sha256(ctx):
    """
    Vérifie localement que le sha256 de dist/ correspond à version.json.
    Parcourt tous les fichiers dist/ (sauf version.json) dans l'ordre trié,
    et calcule le hash de la même façon que build_bundle.py.

    Retourne le hash calculé.
    """
    dist_version_path = os.path.join(ctx.dist_dir, "version.json")
    with open(dist_version_path, "r", encoding="utf-8") as f:
        dist_version_data = json.load(f)

    dist_entries = []
    for racine, _, fichiers in os.walk(ctx.dist_dir):
        for fichier in fichiers:
            chemin_complet = os.path.join(racine, fichier)
            rel_path = os.path.relpath(chemin_complet, ctx.dist_dir).replace(os.sep, "/")
            if rel_path == "version.json":
                continue
            dist_entries.append(rel_path)
    dist_entries.sort()

    print(f"[*] Fichiers inclus dans le hash local ({len(dist_entries)}):")
    for rel_path in dist_entries:
        print(f"  - {rel_path}")

    sha = hashlib.sha256()
    for rel_path in dist_entries:
        abs_path = os.path.join(ctx.dist_dir, rel_path)
        with open(abs_path, "rb") as f:
            sha.update(f"dist/{rel_path}\n".encode("utf-8"))
            sha.update(f.read())
    computed = sha.hexdigest()

    expected = dist_version_data.get("sha256")
    if expected != computed:
        print(
            f"Erreur : Incohérence locale : version.json indique {expected}, "
            f"mais dist/ vaut {computed}.",
            file=sys.stderr,
        )
        sys.exit(1)

    print(f"[*] SHA-256 local vérifié : {computed}")
    return computed


# --------------------------------------------------------------------------- #
#  Zip socle generation
# --------------------------------------------------------------------------- #

def generate_zip_socle(ctx, version, dev_mode, update_url, zip_path):
    """
    Génère l'archive zip du socle minimale pour l'installation.

    Contenu du zip :
      - manifest.json  (chemins d'icônes normalisés : images/icons/X → icons/X)
      - js/background.js  (DEV_MODE + BASE_UPDATE_URL patchés)
      - js/bridge.js
      - icons/  (icônes d'extension)

    Args:
        ctx          : ReleaseContext
        version      : str — version de l'extension (pour le manifest)
        dev_mode     : bool — DEV_MODE dans background.js
        update_url   : str — BASE_UPDATE_URL dans background.js
        zip_path     : str — chemin de destination du zip
    """
    # --- manifest.json avec icônes normalisées et version patchée ---
    with open(ctx.manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    # Patcher la version (utile pour les zips de test où la version diffère du manifest source)
    manifest["version"] = version

    if "icons" in manifest:
        for key, path in list(manifest["icons"].items()):
            if path.startswith("images/icons/"):
                manifest["icons"][key] = "icons/" + os.path.basename(path)
    if "action" in manifest and "default_icon" in manifest["action"]:
        if manifest["action"]["default_icon"].startswith("images/icons/"):
            manifest["action"]["default_icon"] = "icons/" + os.path.basename(
                manifest["action"]["default_icon"]
            )

    # --- background.js avec DEV_MODE et BASE_UPDATE_URL patchés ---
    with open(ctx.background_path, "r", encoding="utf-8") as f:
        bg_code = f.read()

    bg_code = bg_code.replace(
        "const DEV_MODE = true;",
        f"const DEV_MODE = {'true' if dev_mode else 'false'};",
    )
    bg_code = bg_code.replace(
        "const BASE_UPDATE_URL = 'https://arpegorpsgh.github.io/Outiiil/dist/';",
        f"const BASE_UPDATE_URL = '{update_url}';",
    )

    # --- bridge.js ---
    with open(ctx.bridge_path, "r", encoding="utf-8") as f:
        bridge_code = f.read()

    with tempfile.TemporaryDirectory() as temp_dir:
        # manifest.json
        with open(os.path.join(temp_dir, "manifest.json"), "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)

        # js/
        os.makedirs(os.path.join(temp_dir, "js"), exist_ok=True)
        with open(os.path.join(temp_dir, "js", "background.js"), "w", encoding="utf-8", newline="\n") as f:
            f.write(bg_code)
        with open(os.path.join(temp_dir, "js", "bridge.js"), "w", encoding="utf-8", newline="\n") as f:
            f.write(bridge_code)

        # icons/
        icons_src = os.path.join(ctx.images_dir, "icons")
        if os.path.isdir(icons_src):
            icons_dest = os.path.join(temp_dir, "icons")
            if os.path.exists(icons_dest):
                shutil.rmtree(icons_dest)
            shutil.copytree(icons_src, icons_dest)

        # Création du zip
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(temp_dir):
                for file in files:
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, temp_dir)
                    zipf.write(full_path, rel_path)

    print(f"[*] Archive zip générée : {zip_path}")
    return zip_path


# --------------------------------------------------------------------------- #
#  Deployment to a Git branch
# --------------------------------------------------------------------------- #

def deploy_dist_to_branch(ctx, branch, remote_url, commit_message=None):
    """
    Déploie le contenu de dist/ sur une branche Git distante.

    Clone la branche distante (ou crée un orphan si inexistante), copie dist/
    dedans, commit et push.

    Args:
        ctx           : ReleaseContext
        branch        : str — nom de la branche cible (ex: 'gh-pages' ou 'test')
        remote_url    : str — URL du remote Git
        commit_message: str — message de commit (optionnel)

    Returns:
        str — hash du commit (ou de l'ancien commit si aucun changement)
    """
    commit_message = commit_message or f"Deploy dist to {branch}"

    with tempfile.TemporaryDirectory() as temp_gh_dir:
        # Clone de la branche (ou création orpheline si la branche n'existe pas)
        run_cmd(
            f'git clone --single-branch --branch {branch} "{remote_url}" "{temp_gh_dir}"',
            check=False,
        )
        if not os.path.exists(os.path.join(temp_gh_dir, ".git")):
            run_cmd(f'git clone "{remote_url}" "{temp_gh_dir}"')
            run_cmd(f"git checkout --orphan {branch}", cwd=temp_gh_dir)
            run_cmd("git rm -rf .", cwd=temp_gh_dir, check=False)

        # Copier dist/ → temp_gh_dir/dist/
        dest_dist = os.path.join(temp_gh_dir, "dist")
        if os.path.exists(dest_dist):
            shutil.rmtree(dest_dist)
        shutil.copytree(ctx.dist_dir, dest_dist)

        # Diagnostic : taille et sha du runtime.js copié
        copied_runtime_path = os.path.join(dest_dist, "runtime.js")
        if os.path.exists(copied_runtime_path):
            copied_size = os.path.getsize(copied_runtime_path)
            with open(copied_runtime_path, "rb") as f:
                copied_sha = hashlib.sha256(f.read()).hexdigest()
            print(f"[*] Diagnostic copie : runtime.js taille={copied_size} octets, sha256={copied_sha[:16]}...")

        # Commit & push
        run_cmd("git add -A", cwd=temp_gh_dir)
        status_gh = run_cmd("git status --porcelain", cwd=temp_gh_dir)

        if status_gh:
            run_cmd(f'git commit -m "{commit_message}"', cwd=temp_gh_dir)
            run_cmd(f"git push origin {branch}", cwd=temp_gh_dir)
            print(f"  -> Branche {branch} mise à jour et poussée.")
            return run_cmd("git rev-parse HEAD", cwd=temp_gh_dir)
        else:
            print(f"  -> Aucun changement détecté pour {branch}.")
            return run_cmd("git rev-parse HEAD", cwd=temp_gh_dir)


# --------------------------------------------------------------------------- #
#  Remote verification
# --------------------------------------------------------------------------- #

def verify_deployment(ctx, base_url, version, expected_sha256,
                      max_wait_seconds=60, retry_interval_seconds=15):
    """
    Vérifie la cohérence sha256 du déploiement distant.

    Interroge version.json + chaque fichier listé, recalcule le hash global,
    et compare avec expected_sha256. Attend que le CDN se propage si nécessaire.

    Args:
        ctx              : ReleaseContext
        base_url         : str — URL de base (ex: https://arpegorpsgh.github.io/Outiiil/dist/)
        version          : str — version attendue dans version.json
        expected_sha256  : str — hash attendu
        max_wait_seconds : int — durée max d'attente
        retry_interval_seconds : int — intervalle entre tentatives

    Returns:
        bool — True si cohérent, False sinon (ou si timeout)
    """
    version_url = base_url + "version.json"
    start = time.time()

    while True:
        problems = []

        # Cache-busting pour forcer le CDN
        cache_buster = str(int(time.time() * 1000))

        try:
            req = urllib.request.Request(
                version_url + "?_t=" + cache_buster,
                headers={"Cache-Control": "no-cache", "Pragma": "no-cache"},
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            problems.append(f"impossible de lire version.json distant: {e}")
            data = None

        if data:
            remote_version = data.get("version")
            remote_sha = data.get("sha256")

            if remote_version != version:
                problems.append(f"version distante={remote_version}, attendue={version}")
            elif remote_sha != expected_sha256:
                problems.append(f"sha256 version.json distant={remote_sha}, attendu={expected_sha256}")

            # Vérifier chaque fichier individuellement
            remote_entries = []
            if data.get("runtime"):
                remote_entries.append(data["runtime"])
            if data.get("css"):
                remote_entries.append(data["css"])
            remote_entries.extend(data.get("images", []) or [])
            remote_entries.sort()

            try:
                remote_blobs = {}
                for rel_path in remote_entries:
                    diag_url = base_url + rel_path + "?_t=" + cache_buster
                    req = urllib.request.Request(
                        diag_url,
                        headers={"Cache-Control": "no-cache", "Pragma": "no-cache"},
                    )
                    with urllib.request.urlopen(req, timeout=30) as resp:
                        remote_blobs[rel_path] = resp.read()

                # Recalculer le hash global à partir des blobs distants
                combined_length = 0
                for rel_path in remote_entries:
                    combined_length += len(f"dist/{rel_path}\n".encode("utf-8")) + len(remote_blobs[rel_path])
                combined = bytearray(combined_length)
                offset = 0
                for rel_path in remote_entries:
                    prefix = f"dist/{rel_path}\n".encode("utf-8")
                    combined[offset:offset + len(prefix)] = prefix
                    offset += len(prefix)
                    blob = remote_blobs[rel_path]
                    combined[offset:offset + len(blob)] = blob
                    offset += len(blob)

                remote_computed_sha = hashlib.sha256(bytes(combined)).hexdigest()
                if remote_computed_sha != expected_sha256:
                    problems.append(f"sha256 global distant={remote_computed_sha}, attendu={expected_sha256}")
            except Exception as e:
                problems.append(f"impossible de vérifier les fichiers distants: {e}")

        if not problems:
            print(f"[*] Déploiement cohérent pour v{version} (version.json et dist/ vérifiés).")
            return True

        elapsed = time.time() - start
        if elapsed >= max_wait_seconds:
            print(f"[!] Déploiement incohérent : {'; '.join(problems)}.", file=sys.stderr)
            return False

        print(f"[*] Vérification différée de {retry_interval_seconds}s pour laisser le CDN se propager...")
        time.sleep(retry_interval_seconds)


# --------------------------------------------------------------------------- #
#  Cleanup
# --------------------------------------------------------------------------- #

def cleanup_dist(ctx):
    """Supprime le dossier dist/ local."""
    if os.path.exists(ctx.dist_dir):
        shutil.rmtree(ctx.dist_dir)
        print("[*] Nettoyage local du dossier dist/ effectué.")
