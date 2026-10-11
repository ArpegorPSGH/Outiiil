#!/usr/bin/env python3
"""
Script de packaging pour l'architecture de mise à jour dynamique d'Outiiil.
Lit manifest.json, concatène le CSS et le JS listés dans bundle_sources.json
(préfixé par browserAPI.js et runtime_init.js), copie les images vers dist/images/,
et génère un dossier de distribution `dist/` prêt pour GitHub Pages :
  - dist/runtime.js       (bundle JS + browserAPI)
  - dist/runtime.css      (bundle CSS)
  - dist/version.json     (version, sha256, runtime, css, images)
  - dist/images/          (dynamic images)
"""

import json
import os
import re
import shutil
import sys
import hashlib

# Ensure scripts/lib/ is in sys.path so we can import release_common.py (same dir)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import release_common as rc

# Ensure UTF-8 output for Windows compatibility
try:
    sys.stdout.reconfigure(encoding='utf-8')
except (AttributeError, OSError):
    pass

# __file__ est scripts/lib/build_bundle.py → remonter 3 niveaux pour atteindre la racine du projet
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DIST_DIR = os.path.join(BASE_DIR, "dist")
MANIFEST_PATH = os.path.join(BASE_DIR, "manifest.json")
IMAGES_SRC_DIR = os.path.join(BASE_DIR, "images")
IMAGES_DIST_DIR = os.path.join(DIST_DIR, "images")
BACKGROUND_PATH = os.path.join(BASE_DIR, "js", "background.js")
BRIDGE_PATH = os.path.join(BASE_DIR, "js", "bridge.js")
DEFAULT_UPDATE_URL = "https://arpegorpsgh.github.io/Outiiil/dist/"

def normalize_js(code):
    """Normalize JavaScript code by removing comments, excess whitespace, and semicolons.

    This ensures that cosmetic changes (formatting, comments, semicolons) don't
    trigger false-positive socle hash mismatches. Token boundaries are preserved
    by collapsing whitespace sequences to a single space (not removing entirely,
    since e.g. 'return true' must remain two tokens).
    """
    # --- Remove multi-line comments /* ... */ ---
    code = re.sub(r'/\*.*?\*/', ' ', code, flags=re.DOTALL)

    # --- Remove single-line comments // ... (preserving strings) ---
    result = []
    i = 0
    in_string = False
    string_char = None
    while i < len(code):
        c = code[i]
        if in_string:
            if c == '\\' and i + 1 < len(code):
                result.append(code[i:i + 2])
                i += 2
                continue
            if c == string_char:
                in_string = False
            result.append(c)
            i += 1
            continue
        # Not in string
        if c in ('"', "'", '`'):
            in_string = True
            string_char = c
            result.append(c)
            i += 1
            continue
        if c == '/' and i + 1 < len(code):
            if code[i + 1] == '/':
                while i < len(code) and code[i] != '\n':
                    i += 1
                continue
            elif code[i + 1] == '*':
                i += 2
                while i + 1 < len(code) and not (code[i] == '*' and code[i + 1] == '/'):
                    i += 1
                i += 2
                result.append(' ')
                continue
        result.append(c)
        i += 1
    code = ''.join(result)

    # --- Normalize whitespace: all whitespace sequences → single space ---
    code = re.sub(r'\s+', ' ', code)
    # --- Remove semicolons ---
    code = code.replace(';', '')
    return code.strip()


def compute_socle_hash(version):
    """
    Compute SHA-256 of the socle (manifest.json + js/background.js + js/bridge.js),
    excluding icons and normalizing:
      - manifest version → "0.0.0"
      - manifest icon paths → normalized (any prefix/icons/X → icons/X)
      - background.js: DEV_MODE → false, SOCLE_HASH → '', all server URLs → '' (normalized)
      - bridge.js: as-is
      - All JS code is passed through normalize_js() to strip comments,
        whitespace, and semicolons so only semantic content affects the hash.

    Server-specific constants (BASE_UPDATE_URL, GITHUB_OWNER, GITHUB_REPO,
    GITHUB_ZIP_PREFIX, GITHUB_RELEASES_URL, GITHUB_LATEST_RELEASE_URL) are
    normalized to empty strings so that only the server address changes do
    NOT trigger false-positive socle mismatches. This allows the same zip
    to be patched with different URLs for test/prod without changing the
    socle hash.
    """
    hasher = hashlib.sha256()

    # --- manifest.json : version → "0.0.0", icons normalized, deterministic JSON ---
    with open(MANIFEST_PATH, "rb") as f:
        manifest_bytes = rc.normalize_manifest(f.read())

    # --- background.js : DEV_MODE → false, SOCLE_HASH → '', server URLs → '' (normalized) ---
    with open(BACKGROUND_PATH, "r", encoding="utf-8") as f:
        bg_code = f.read()
    bg_code = bg_code.replace("const DEV_MODE = true;", "const DEV_MODE = false;")
    bg_code = re.sub(r"const SOCLE_HASH\s*=\s*[^;]+;", "const SOCLE_HASH = '';", bg_code)

    # Normalize all server-specific constants to empty strings so that
    # BASE_UPDATE_URL / GitHub repo changes do not trigger false socle-change
    # detections. The server address must be allowed to differ between test
    # and prod (and across renames) without invalidating the socle hash.
    bg_code = re.sub(r"const BASE_UPDATE_URL\s*=\s*['\"][^'\"]*['\"];",
                     "const BASE_UPDATE_URL = '';", bg_code)
    bg_code = re.sub(r"const GITHUB_OWNER\s*=\s*['\"][^'\"]*['\"];",
                     "const GITHUB_OWNER = '';", bg_code)
    bg_code = re.sub(r"const GITHUB_REPO\s*=\s*['\"][^'\"]*['\"];",
                     "const GITHUB_REPO = '';", bg_code)
    bg_code = re.sub(r"const GITHUB_ZIP_PREFIX\s*=\s*['\"][^'\"]*['\"];",
                     "const GITHUB_ZIP_PREFIX = '';", bg_code)
    bg_code = re.sub(r"const GITHUB_RELEASES_URL\s*=\s*[^;]+;",
                     "const GITHUB_RELEASES_URL = '';", bg_code)
    bg_code = re.sub(r"const GITHUB_LATEST_RELEASE_URL\s*=\s*[^;]+;",
                     "const GITHUB_LATEST_RELEASE_URL = '';", bg_code)

    bg_code = normalize_js(bg_code)
    bg_bytes = bg_code.encode("utf-8")

    # --- bridge.js : as-is (but normalized) ---
    with open(BRIDGE_PATH, "r", encoding="utf-8") as f:
        bridge_code = f.read()
    bridge_code = normalize_js(bridge_code)
    bridge_bytes = bridge_code.encode("utf-8")

    # --- Combined hash ---
    hasher.update(b"manifest.json\n")
    hasher.update(manifest_bytes)
    hasher.update(b"\njs/background.js\n")
    hasher.update(bg_bytes)
    hasher.update(b"\njs/bridge.js\n")
    hasher.update(bridge_bytes)
    return hasher.hexdigest()


def build_dist(override_version=None, override_update_url=None):
    """
    Build du runtime dans dist/.

    Args:
        override_version      : si fourni, utilise cette version au lieu de manifest.json.
        override_update_url   : DEPRECATED — no longer used. The socle hash is now
                                URL-agnostic (server constants are normalized to ''),
                                so test/prod builds produce identical hashes.
    """
    print(f"[Outiiil Builder] Répertoire racine : {BASE_DIR}")
    if not os.path.exists(MANIFEST_PATH):
        print(f"Erreur : {MANIFEST_PATH} introuvable.", file=sys.stderr)
        sys.exit(1)

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    version = override_version or manifest.get("version", "1.0.0")
    print(f"[Outiiil Builder] Version détectée : {version}" +
          (f" (override)" if override_version else ""))

    sources_config = os.path.join(BASE_DIR, "bundle_sources.json")
    if not os.path.exists(sources_config):
        print(f"Erreur : {sources_config} introuvable.", file=sys.stderr)
        sys.exit(1)

    with open(sources_config, "r", encoding="utf-8") as f:
        cfg = json.load(f)
        css_files = cfg.get("css", [])
        js_files = cfg.get("js", [])

    os.makedirs(DIST_DIR, exist_ok=True)

    # --- Concaténation JS → runtime.js ---
    js_runtime_path = os.path.join(DIST_DIR, "runtime.js")
    print(f"[Outiiil Builder] Concaténation de {len(js_files)} fichiers JS → runtime.js...")

    # Lecture des fichiers sources (les manquants sont sautés avec avertissement)
    js_fichiers_present = []
    for rel_path in js_files:
        abs_path = os.path.join(BASE_DIR, rel_path)
        if os.path.exists(abs_path):
            with open(abs_path, "r", encoding="utf-8", errors="replace") as f_in:
                js_fichiers_present.append((rel_path, f_in.read()))
        else:
            print(f"Avertissement : Fichier JS manquant : {rel_path}", file=sys.stderr)

    # Table des positions des fichiers sources dans le bundle : pour chaque fichier,
    # la ligne (1-indexée) où débute son contenu. Émise dans le bundle sous
    # window.__OUTIIIL_SOURCES, elle permet au Logger de traduire les frames de stack
    # de production (<anonymous>:N, le code étant injecté par chrome.userScripts
    # sous forme de chaîne) en fichier source : ligne source.
    #
    # Disposition du bundle :
    #   ligne 1 : // Outiiil built runtime version: X
    #   ligne 2 : window.__OUTIIIL_RUNTIME_VERSION = "X";
    #   ligne 3 : window.__OUTIIIL_SOURCES = [...];
    #   ligne 4 : (ligne vide)
    #   ligne 5 : // Source: <premier fichier>  -> contenu du fichier à la ligne 6
    nb_lignes_ecrites = 4
    table_sources = []
    for rel_path, contenu in js_fichiers_present:
        entree = {"f": rel_path, "s": nb_lignes_ecrites + 2}
        if rel_path.startswith("js/lib/"):
            entree["lib"] = 1
        table_sources.append(entree)
        nb_lignes_ecrites += 1 + contenu.count("\n") + 2  # marqueur + contenu + séparateur "\n;\n"

    table_compacte = json.dumps(table_sources, separators=(",", ":"))

    with open(js_runtime_path, "w", encoding="utf-8", newline="\n") as out_js:
        # Bake the runtime version into the bundle so the running page can tell
        # which version of ITSELF is executing. This is used by runtime_init.js to
        # detect that a newer/other runtime was cached by the background and reload
        # the page. (Compared against the *available* version, never the manifest
        # version, to avoid an infinite reload loop.)
        out_js.write(f"// Outiiil built runtime version: {version}\n")
        out_js.write(f"window.__OUTIIIL_RUNTIME_VERSION = {json.dumps(version)};\n")
        out_js.write(f"window.__OUTIIIL_SOURCES = {table_compacte};\n")
        out_js.write("\n")
        for rel_path, contenu in js_fichiers_present:
            out_js.write(f"// Source: {rel_path}\n")
            out_js.write(contenu)
            out_js.write("\n;\n")

    # Calcul du SHA-256 du runtime.js
    with open(js_runtime_path, "rb") as f:
        sha256_hash = hashlib.sha256(f.read()).hexdigest()
    print(f"[Outiiil Builder] SHA-256 du runtime.js : {sha256_hash}")

    # --- Concaténation CSS → runtime.css ---
    css_runtime_path = os.path.join(DIST_DIR, "runtime.css")
    print(f"[Outiiil Builder] Concaténation de {len(css_files)} fichiers CSS → runtime.css...")
    with open(css_runtime_path, "w", encoding="utf-8", newline="\n") as out_css:
        for rel_path in css_files:
            abs_path = os.path.join(BASE_DIR, rel_path)
            if os.path.exists(abs_path):
                out_css.write(f"/* Source: {rel_path} */\n")
                with open(abs_path, "r", encoding="utf-8", errors="replace") as f_in:
                    out_css.write(f_in.read())
                out_css.write("\n\n")
            else:
                print(f"Avertissement : Fichier CSS manquant : {rel_path}", file=sys.stderr)

    # --- Copie des images vers dist/images ---
    if os.path.exists(IMAGES_SRC_DIR):
        print("[Outiiil Builder] Synchronisation des images vers dist/images/...")
        if os.path.exists(IMAGES_DIST_DIR):
            shutil.rmtree(IMAGES_DIST_DIR)
        shutil.copytree(IMAGES_SRC_DIR, IMAGES_DIST_DIR)

    # --- Liste des images servies dynamiquement ---
    liste_images = []
    if os.path.exists(IMAGES_DIST_DIR):
        for racine, _, fichiers in os.walk(IMAGES_DIST_DIR):
            for fichier in fichiers:
                chemin_complet = os.path.join(racine, fichier)
                liste_images.append(os.path.relpath(chemin_complet, DIST_DIR).replace(os.sep, "/"))

    # --- Calcul du SHA-256 global de dist/ (sans version.json) ---
    dist_entries = []
    for racine, _, fichiers in os.walk(DIST_DIR):
        for fichier in fichiers:
            chemin_complet = os.path.join(racine, fichier)
            rel_path = os.path.relpath(chemin_complet, DIST_DIR).replace(os.sep, "/")
            if rel_path == "version.json":
                continue
            dist_entries.append(rel_path)
    dist_entries.sort()

    print(f"[Outiiil Builder] Fichiers inclus dans le hash global ({len(dist_entries)}):")
    for rel_path in dist_entries:
        print(f"  - {rel_path}")

    sha256_hash = hashlib.sha256()
    for rel_path in dist_entries:
        abs_path = os.path.join(DIST_DIR, rel_path)
        with open(abs_path, "rb") as f:
            sha256_hash.update(f"dist/{rel_path}\n".encode("utf-8"))
            sha256_hash.update(f.read())
    sha256_hash = sha256_hash.hexdigest()
    print(f"[Outiiil Builder] SHA-256 global de dist/ : {sha256_hash}")

    # --- version.json avec sha256 + socle_hash ---
    version_json_path = os.path.join(DIST_DIR, "version.json")

    # Compute the socle hash (manifest + background + bridge, excluding icons/version/server URLs)
    socle_hash = compute_socle_hash(version)
    print(f"[Outiiil Builder] SHA-256 du socle : {socle_hash}")

    version_data = {
        "version": version,
        "sha256": sha256_hash,
        "socle_hash": socle_hash,
        "runtime": "runtime.js",
        "css": "runtime.css",
        "images": liste_images,
        "timestamp": os.path.getmtime(js_runtime_path)
    }
    with open(version_json_path, "w", encoding="utf-8") as f_ver:
        json.dump(version_data, f_ver, indent=2)

    print(f"[Outiiil Builder] Succès ! Distribution générée dans {DIST_DIR} :")
    print(f" - runtime.js ({os.path.getsize(js_runtime_path) // 1024} Ko)")
    print(f" - runtime.css ({os.path.getsize(css_runtime_path) // 1024} Ko)")
    print(f" - images/ ({len(liste_images)} fichiers)")
    print(f" - version.json (Version: {version}, sha256: {sha256_hash[:16]}..., "
          f"socle_hash: {socle_hash[:16]}..., {len(liste_images)} images)")

    return version

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Build le runtime Outiiil dans dist/")
    parser.add_argument("--version", default=None,
                        help="Override la version (ex: pour les tests)")
    parser.add_argument("--update-url", default=None,
                        help="Override BASE_UPDATE_URL for socle hash computation "
                             "(default: production URL, used for test builds)")
    args = parser.parse_args()
    build_dist(override_version=args.version, override_update_url=args.update_url)
