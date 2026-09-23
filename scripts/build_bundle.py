#!/usr/bin/env python3
"""
Script de packaging pour l'architecture de mise à jour dynamique d'Outiiil.
Lit manifest.json, concatène le CSS et le JS listés dans bundle_sources.json,
copie les images vers dist/images/, et génère un dossier de distribution `dist/` prêt pour GitHub Pages :
 - dist/bundle.js
 - dist/bundle.css
 - dist/version.json
 - dist/images/
"""

import json
import os
import shutil
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(BASE_DIR, "dist")
MANIFEST_PATH = os.path.join(BASE_DIR, "manifest.json")
IMAGES_SRC_DIR = os.path.join(BASE_DIR, "images")
IMAGES_DIST_DIR = os.path.join(DIST_DIR, "images")

def build_dist():
    print(f"[Outiiil Builder] Répertoire racine : {BASE_DIR}")
    if not os.path.exists(MANIFEST_PATH):
        print(f"Erreur : {MANIFEST_PATH} introuvable.", file=sys.stderr)
        sys.exit(1)

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    version = manifest.get("version", "1.0.0")
    print(f"[Outiiil Builder] Version détectée : {version}")

    sources_config = os.path.join(BASE_DIR, "scripts", "bundle_sources.json")
    if not os.path.exists(sources_config):
        print(f"Erreur : {sources_config} introuvable.", file=sys.stderr)
        sys.exit(1)

    with open(sources_config, "r", encoding="utf-8") as f:
        cfg = json.load(f)
        css_files = cfg.get("css", [])
        js_files = cfg.get("js", [])

    os.makedirs(DIST_DIR, exist_ok=True)

    # Concaténation CSS
    css_bundle_path = os.path.join(DIST_DIR, "bundle.css")
    print(f"[Outiiil Builder] Concaténation de {len(css_files)} fichiers CSS...")
    with open(css_bundle_path, "w", encoding="utf-8") as out_css:
        for rel_path in css_files:
            abs_path = os.path.join(BASE_DIR, rel_path)
            if os.path.exists(abs_path):
                out_css.write(f"/* Source: {rel_path} */\n")
                with open(abs_path, "r", encoding="utf-8", errors="replace") as f_in:
                    out_css.write(f_in.read())
                out_css.write("\n\n")
            else:
                print(f"Avertissement : Fichier CSS manquant : {rel_path}", file=sys.stderr)

    # Concaténation JS
    js_bundle_path = os.path.join(DIST_DIR, "bundle.js")
    print(f"[Outiiil Builder] Concaténation de {len(js_files)} fichiers JS...")
    with open(js_bundle_path, "w", encoding="utf-8") as out_js:
        for rel_path in js_files:
            abs_path = os.path.join(BASE_DIR, rel_path)
            if os.path.exists(abs_path):
                out_js.write(f"// Source: {rel_path}\n")
                with open(abs_path, "r", encoding="utf-8", errors="replace") as f_in:
                    out_js.write(f_in.read())
                out_js.write("\n;\n")
            else:
                print(f"Avertissement : Fichier JS manquant : {rel_path}", file=sys.stderr)

    # Copie des images vers dist/images
    if os.path.exists(IMAGES_SRC_DIR):
        print("[Outiiil Builder] Synchronisation des images vers dist/images/...")
        if os.path.exists(IMAGES_DIST_DIR):
            shutil.rmtree(IMAGES_DIST_DIR)
        shutil.copytree(IMAGES_SRC_DIR, IMAGES_DIST_DIR)

    # Génération du fichier version.json (avec la liste des images servies dynamiquement)
    liste_images = []
    if os.path.exists(IMAGES_DIST_DIR):
        for racine, _, fichiers in os.walk(IMAGES_DIST_DIR):
            for fichier in fichiers:
                chemin_complet = os.path.join(racine, fichier)
                liste_images.append(os.path.relpath(chemin_complet, DIST_DIR).replace(os.sep, "/"))

    version_json_path = os.path.join(DIST_DIR, "version.json")
    version_data = {
        "version": version,
        "js": "bundle.js",
        "css": "bundle.css",
        "images": liste_images,
        "timestamp": os.path.getmtime(js_bundle_path)
    }
    with open(version_json_path, "w", encoding="utf-8") as f_ver:
        json.dump(version_data, f_ver, indent=2)

    print(f"[Outiiil Builder] Succès ! Bundle généré dans {DIST_DIR} :")
    print(f" - bundle.js ({os.path.getsize(js_bundle_path) // 1024} Ko)")
    print(f" - bundle.css ({os.path.getsize(css_bundle_path) // 1024} Ko)")
    print(f" - images/ ({len(os.listdir(IMAGES_DIST_DIR)) if os.path.exists(IMAGES_DIST_DIR) else 0} dossiers/fichiers)")
    print(f" - version.json (Version: {version}, {len(liste_images)} images listées)")
    return version

if __name__ == "__main__":
    build_dist()
