#!/usr/bin/env python3
"""
scripts/test_prod.py
Test pré-déploiement : simule le workflow de release mais sur un repo/branche de test,
SANS créer de tag Git, de release GitHub, ni pousser de code source.

Le script se concentre sur la partie "runtime dynamique" :
  - Build du runtime (version suffixée)
  - Déploiement de dist/ sur le repo secondaire (GitHub Pages)
  - Génération d'un socle zip en mode production (DEV_MODE=false) pointant vers le repo de test

Contrairement à release.py, aucune branche de code source n'est poussée : le code
est build localement depuis le commit courant, et seul dist/ est déployé.

Workflow :
  1. Vérifie que le répertoire Git est propre.
  2. Calcule une version de test (Chrome-valide, basée sur le SHA du commit).
  3. Compile le runtime via build_bundle.py (--version <test_version>).
  4. Vérifie localement la cohérence sha256 de dist/.
  5. Déploie dist/ sur la branche gh-pages du repo secondaire (GitHub Pages).
  6. Génère l'archive zip socle avec DEV_MODE=false et BASE_UPDATE_URL=test.
  7. (Optionnel) Vérifie la cohérence sha256 du déploiement distant.
  8. Nettoie dist/ localement.

Prérequis :
  - Un repo secondaire GitHub (ex: Outiiil-test) avec GitHub Pages activé sur
    sa branche gh-pages. Créez-le une fois via l'interface GitHub.
  - Le remote 'origin' doit pointer vers le repo principal.

Usage :
  python scripts/test_prod.py [options]

Options:
  --test-repo NOM         Nom du repo secondaire pour le serving (default: Outiiil-test)
  --test-branch BRANCHE   Branche du repo secondaire pour dist/ (default: gh-pages)
  --test-version VERSION  Version de test manuelle (sinon, calculée depuis le SHA)
  --verify                Vérifie la cohérence sha256 du déploiement (lent, ~60s)
  --no-commit-check       Désactive la vérification Git propre
  --keep-dist             Ne pas nettoyer dist/ après le test
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import release_common as rc

# Import verifier_socle_a_changer from release.py for socle change detection
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from release import verifier_socle_a_changer


def parse_github_remote(remote_url):
    """
    Parse une URL Git GitHub et retourne (owner, repo).
    Supporte HTTPS et SSH.
    Exemples :
      https://github.com/owner/repo.git     → (owner, repo)
      git@github.com:owner/repo.git         → (owner, repo)
    """
    if remote_url.startswith("https://github.com/"):
        path = remote_url[len("https://github.com/"):].rstrip("/")
        if path.endswith(".git"):
            path = path[:-4]
        parts = path.split("/")
        if len(parts) >= 2:
            return parts[0], parts[1]
    elif remote_url.startswith("git@github.com:"):
        path = remote_url[len("git@github.com:"):].rstrip("/")
        if path.endswith(".git"):
            path = path[:-4]
        parts = path.split("/")
        if len(parts) >= 2:
            return parts[0], parts[1]
    return None, None


def _report_release_conditions(prod_version, test_version):
    """Check and print (without blocking) the three special release conditions.
    Called at the end of the test for information."""
    print("\n" + "-" * 55)
    print("  Vérification des conditions spéciales de release")
    print("-" * 55)

    issues = []

    # Condition 1 : changement de socle depuis la dernière release
    try:
        socle_a_changer, raison_socle, latest_version = verifier_socle_a_changer(prod_version)
        if socle_a_changer:
            issues.append(f"CHANGEMENT DE SOCLE : {raison_socle}")
    except Exception as e:
        issues.append(f"CHANGEMENT DE SOCLE : erreur lors de la vérification : {e}")

    # Condition 2 : aucune modification hors numéro de version
    no_code_changes = False
    last_tag, changed_files = rc.get_changed_files_since_tag()
    if last_tag and changed_files:
        non_manifest = [f for f in changed_files if f != "manifest.json"]
        if not non_manifest and "manifest.json" in changed_files:
            no_code_changes = True
            issues.append(
                f"AUCUNE MODIFICATION : seul le numéro de version a changé "
                f"(diff depuis {last_tag} : {changed_files})"
            )

    # Condition 3 : version identique ou inférieure
    remote_url = rc.get_remote_url()
    owner, repo = rc.get_repo_owner_repo(remote_url)
    latest_version = None
    if owner and repo:
        latest_version, _ = rc.get_latest_github_release_version(owner, repo)
        if latest_version and rc.compare_versions(prod_version, latest_version) <= 0:
            issues.append(
                f"VERSION : la version prod ({prod_version}) est identique ou inférieure "
                f"à la dernière release ({latest_version})"
            )

    if issues:
        print("\n  ⚠️  CONDITIONS SPÉCIALES DÉTECTÉES (informationnel) :")
        for i, issue in enumerate(issues, 1):
            print(f"    {i}. {issue}")
    else:
        print("  ✅ Aucune condition spéciale détectée.")
    print("-" * 55)


def make_test_version(prod_version):
    """
    Génère une version de test Chrome-valide (4 parties séparées par des points).

    Utilise un hash court du commit pour garantir l'unicité et
    l'ordre de comparaison (version de test > version prod).

    Exemple : 3.22.27 → 3.22.27.47813
    """
    short_sha = rc.get_current_head()
    sha_int = int(short_sha[:4], 16) % 65536
    return f"{prod_version}.{sha_int}"


def main():
    parser = argparse.ArgumentParser(
        description="Test pré-déploiement : build + déploiement dist/ + zip socle sur un repo de test.",
    )
    parser.add_argument("--test-repo", default="Outiiil-test",
                        help="Nom du repo secondaire pour GitHub Pages (default: Outiiil-test)")
    parser.add_argument("--test-branch", default="gh-pages",
                        help="Branche du repo secondaire pour dist/ (default: gh-pages)")
    parser.add_argument("--test-version", default=None,
                        help="Version de test manuelle (sinon, calculée depuis le SHA)")
    parser.add_argument("--verify", action="store_true",
                        help="Vérifie la cohérence sha256 du déploiement (lent)")
    parser.add_argument("--no-commit-check", action="store_true",
                        help="Désactive la vérification Git propre")
    parser.add_argument("--keep-dist", action="store_true",
                        help="Ne pas nettoyer dist/ après le test")
    args = parser.parse_args()

    print("=" * 55)
    print("  OUTIIIL - Test pré-déploiement (prod simulé)")
    print("=" * 55)

    ctx = rc.ReleaseContext()

    # 1. Vérification Git propre
    if not args.no_commit_check:
        rc.verifier_git_propre(ctx)
    branche_origine = rc.get_current_branch()
    print(f"[*] Branche courante  : {branche_origine}")
    print(f"[*] Commit courant   : {rc.get_current_head()}")

    # 2. Version de test
    manifest = rc.read_manifest(ctx)
    prod_version = manifest.get("version")
    if not prod_version:
        print("Erreur : Impossible de lire la version dans manifest.json", file=sys.stderr)
        sys.exit(1)

    if args.test_version:
        test_version = args.test_version
    else:
        test_version = make_test_version(prod_version)

    print(f"[*] Version prod     : {prod_version}")
    print(f"[*] Version test     : {test_version}")

    # 3. Parsing du remote pour construire l'URL du repo secondaire
    remote_url = rc.get_remote_url()
    owner, repo = parse_github_remote(remote_url)
    if not owner or not repo:
        print(f"Erreur : Impossible de parser le remote GitHub : {remote_url}", file=sys.stderr)
        print("Assurez-vous que 'origin' pointe vers github.com.", file=sys.stderr)
        sys.exit(1)

    test_repo_name = args.test_repo
    test_remote_url = f"https://github.com/{owner}/{test_repo_name}.git"
    test_github_pages_url = f"https://{owner}.github.io/{test_repo_name}/dist/"

    print(f"[*] Repo principal  : {owner}/{repo}")
    print(f"[*] Repo test       : {owner}/{test_repo_name}")
    print(f"[*] URL GitHub Pages: {test_github_pages_url}")
    print(f"[*] Branche dist    : {args.test_branch} (repo {test_repo_name})")

    # 4. Build du runtime (version de test)
    print(f"\n[*] Compilation du runtime (version {test_version})...")
    rc.build_runtime(ctx, version=test_version, update_url=test_github_pages_url)

    # 5. Vérification locale sha256
    computed_hash = rc.compute_dist_sha256(ctx)

    # 6. Déploiement dist/ sur le repo secondaire
    print(f"\n[*] Déploiement de dist/ sur {args.test_branch} ({test_repo_name})...")
    try:
        commit_hash = rc.deploy_dist_to_branch(
            ctx, args.test_branch, test_remote_url,
            commit_message=f"Test deploy {test_version}",
        )
    except SystemExit:
        print(f"[!] Erreur : Le clone du repo '{test_repo_name}' a échoué.", file=sys.stderr)
        print(f"   Créez le repo GitHub '{owner}/{test_repo_name}' et activez GitHub Pages"
              f" sur sa branche '{args.test_branch}' avant de relancer.", file=sys.stderr)
        rc.cleanup_dist(ctx)
        sys.exit(1)

    print(f"  -> dist/ déployé sur {test_remote_url} ({args.test_branch}).")
    if commit_hash:
        print(f"  -> Commit distant : {commit_hash}")

    # 7. Génération du zip socle (prod mode, URL test)
    print(f"\n[*] Génération du zip socle (DEV_MODE=false, URL test)...")
    zip_filename = f"Outiiil-test-{test_version}.zip"
    zip_dest_path = os.path.join(ctx.base_dir, zip_filename)
    rc.generate_zip_socle(
        ctx, test_version,
        dev_mode=False,
        update_url=test_github_pages_url,
        zip_path=zip_dest_path,
    )
    print(f"  -> Zip socle test : {zip_dest_path}")

    # 8. Vérification réseau (optionnelle)
    if args.verify:
        print(f"\n[*] Vérification de cohérence sha256 sur {test_github_pages_url}...")
        print(f"    (version={test_version}, sha256={computed_hash[:16]}...)")
        ok = rc.verify_deployment(ctx, test_github_pages_url, test_version, computed_hash)
        if not ok:
            print("[!] Incohérence détectée — le CDN peut ne pas avoir propagé.", file=sys.stderr)

    # 9. Nettoyage
    if not args.keep_dist:
        rc.cleanup_dist(ctx)

    # 10. Vérification des conditions spéciales (informationnel seulement, sans blocage)
    _report_release_conditions(prod_version, test_version)

    print("\n" + "=" * 55)
    print("  Test pré-déploiement terminé !")
    print("=" * 55)
    print(f"  - version test : {test_version}")
    print(f"  - zip socle    : {zip_filename}")
    print(f"  - URL runtime  : {test_github_pages_url}")
    print("  -> Installez le zip socle dans Chrome (mode développeur) pour tester.")
    print("=" * 55)


if __name__ == "__main__":
    main()
