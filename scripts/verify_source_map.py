#!/usr/bin/env python3
"""
Vérification de la table des positions de sources (window.__OUTIIIL_SOURCES)
émise par build_bundle.py :
  1. Rebuild le bundle.
  2. Vérifie que les lignes de début/fin déclarées pour chaque fichier coïncident
     avec le contenu effectif du bundle.
  3. Simule l'algorithme de résolution du Logger (#resoudrePositionSource) et
     vérifie l'aller-retour bundle -> source -> bundle sur un échantillon de lignes.
  4. Vérifie le marquage "lib" des fichiers tiers (js/lib/).
  5. Vérifie les cas limites (en-tête du bundle, mode dev, ligne invalide).

Exécution : python -m scripts.verify_source_map   (depuis la racine du projet)
"""

import json
import os
import random
import re
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except (AttributeError, OSError):
    pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(BASE_DIR, "dist")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import build_bundle


def resoudre_position_source(fichier, ligne, sources):
    """Jumeau Python de Logger.#resoudrePositionSource (mêmes règles, même recherche binaire)."""
    if fichier not in ("<anonymous>", "unknown", "runtime.js"):
        return None
    if not isinstance(ligne, int) or ligne < 1:
        return None
    bas, haut = 0, len(sources) - 1
    while bas <= haut:
        milieu = (bas + haut) >> 1
        if sources[milieu]["s"] <= ligne:
            bas = milieu + 1
        else:
            haut = milieu - 1
    if haut < 0:
        return None
    entree = sources[haut]
    if ligne < entree["s"]:
        return None
    return {"fichier": entree["f"].split("/")[-1], "ligne": ligne - entree["s"] + 1}


def nb_lignes_source(content):
    return len(content.split("\n")) - (1 if content.endswith("\n") else 0)


def main():
    erreurs = []

    build_bundle.build_dist()

    with open(os.path.join(BASE_DIR, "scripts", "bundle_sources.json"), "r", encoding="utf-8") as f:
        cfg = json.load(f)
    js_files = cfg.get("js", [])

    with open(os.path.join(DIST_DIR, "runtime.js"), "r", encoding="utf-8") as f:
        bundle = f.read()
    bundle_lines = bundle.split("\n")

    m = re.search(r"^window\.__OUTIIIL_SOURCES = (\[.*\]);\s*$", bundle, re.MULTILINE)
    if not m:
        print("ERREUR : table __OUTIIIL_SOURCES introuvable dans runtime.js", file=sys.stderr)
        sys.exit(1)
    sources = json.loads(m.group(1))

    # 1. Nombre d'entrées (un par fichier présent)
    manquants = [p for p in js_files if not os.path.exists(os.path.join(BASE_DIR, p))]
    attendu = len(js_files) - len(manquants)
    if len(sources) != attendu:
        erreurs.append(f"nombre d'entrées inattendu : {len(sources)} (attendu {attendu})")

    # 2. Positions strictement croissantes
    for i in range(1, len(sources)):
        if sources[i]["s"] <= sources[i - 1]["s"]:
            erreurs.append(f"positions non strictement croissantes à l'indice {i}")
            break

    # 3. Marque "lib" uniquement pour js/lib/
    for entree in sources:
        if (entree.get("lib") == 1) != entree["f"].startswith("js/lib/"):
            erreurs.append(f"marque lib incohérente pour {entree['f']}")

    # 4. Correspondance des lignes de début/fin de chaque fichier dans le bundle
    for entree in sources:
        with open(os.path.join(BASE_DIR, entree["f"]), "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        lines = content.split("\n")
        ncount = nb_lignes_source(content)
        debut = entree["s"] - 1
        if debut >= len(bundle_lines) or bundle_lines[debut] != lines[0]:
            erreurs.append(f"{entree['f']} : début incohérent (ligne {entree['s']})")
        fin = debut + ncount - 1
        if fin < len(bundle_lines) and bundle_lines[fin] != lines[ncount - 1]:
            erreurs.append(f"{entree['f']} : fin incohérente (ligne {fin + 1})")

    # 5. Aller-retour bundle -> source -> bundle sur un échantillon de lignes
    random.seed(42)
    echantillons = []
    for entree in sources:
        with open(os.path.join(BASE_DIR, entree["f"]), "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        ncount = max(1, nb_lignes_source(content))
        echantillons.append((entree, 1))
        echantillons.append((entree, ncount))
        echantillons.append((entree, random.randint(1, ncount)))

    for entree, ligne_src in echantillons:
        ligne_bundle = entree["s"] + ligne_src - 1
        resolue = resoudre_position_source("<anonymous>", ligne_bundle, sources)
        if resolue is None or (resolue["fichier"], resolue["ligne"]) != (entree["f"].split("/")[-1], ligne_src):
            erreurs.append(
                f"résolution échouée : {entree['f']}:{ligne_src} (ligne bundle {ligne_bundle}) -> {resolue}"
            )
            if len(erreurs) >= 12:
                break

    # 6. Cas limites
    if resoudre_position_source("<anonymous>", 3, sources) is not None:
        erreurs.append("une ligne d'en-tête du bundle ne devrait pas être résolue")
    if resoudre_position_source("Logger.js", 1234, sources) is not None:
        erreurs.append("un fichier source (mode dev) ne devrait pas être ré-résolu")
    if resoudre_position_source("<anonymous>", 0, sources) is not None:
        erreurs.append("la ligne 0 ne devrait pas être résolue")

    if erreurs:
        for e in erreurs:
            print(f"ERREUR : {e}", file=sys.stderr)
        sys.exit(1)
    print(f"[Outiiil verify] Table __OUTIIIL_SOURCES : OK ({len(sources)} fichiers, {len(echantillons)} positions vérifiées)")


if __name__ == "__main__":
    main()
