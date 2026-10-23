#!/usr/bin/env python3
"""
scripts/rollback.py
Supprime le dernier commit de la branche release et la dernière release GitHub associée.

Workflow :
  1. Récupère l'état actuel de la branche release depuis le remote.
  2. Lit la version depuis dist/version.json du dernier commit.
  3. Supprime la release GitHub et le tag Git associés à cette version.
  4. Réinitialise la branche release au commit précédent (HEAD~1) via push force.
  5. Vérifie le rollback en lisant la version du nouveau HEAD.

Usage :
  python scripts/rollback.py [--dry-run] [--branch release]

Options :
  --dry-run           Simule le rollback sans effectuer de modifications.
  --branch            Branche de release à rollback (default: release).
  --no-commit-check   Désactive la vérification Git propre
"""

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import release_common as rc

BASE_DIR = rc.BASE_DIR
BRANCH_RELEASE = "release"


def rollback_release(ctx, branch, dry_run=False, no_commit_check=False):
    """Execute the full rollback workflow on the given release branch."""
    current_branch = rc.get_current_branch()
    print(f"[*] Branche courante : {current_branch}")
    print(f"[*] Branche cible de rollback : {branch}")

    if current_branch == branch:
        print(f"[!] Vous êtes sur la branche '{branch}'. "
              f"Passez à une autre branche avant de rollback.", file=sys.stderr)
        sys.exit(1)

    if not no_commit_check:
        rc.verifier_git_propre(ctx)

    # 1. Fetch and get HEAD of release branch
    print(f"\n[*] Récupération de l'état actuel de la branche '{branch}'...")
    rc.run_cmd("git fetch origin")

    head_sha = rc.run_cmd(f"git rev-parse origin/{branch}", check=False)
    if not head_sha:
        print(f"[!] La branche '{branch}' n'existe pas sur le remote.", file=sys.stderr)
        sys.exit(1)
    print(f"  -> HEAD actuel : {head_sha}")

    # 2. Get version from dist/version.json at HEAD
    version_json_str = rc.get_file_from_commit(head_sha, "dist/version.json")
    if not version_json_str:
        print(f"[!] Impossible de lire dist/version.json du dernier commit de '{branch}'.",
              file=sys.stderr)
        sys.exit(1)

    try:
        version_data = json.loads(version_json_str)
        version = version_data.get("version")
        sha256 = version_data.get("sha256", "")
    except json.JSONDecodeError as e:
        print(f"[!] Erreur lors de la lecture de version.json : {e}", file=sys.stderr)
        sys.exit(1)

    if not version:
        print(f"[!] Aucune version trouvée dans dist/version.json.", file=sys.stderr)
        sys.exit(1)

    print(f"  -> Version à rollback : v{version}")
    if sha256:
        print(f"  -> SHA-256 du dist : {sha256[:16]}...")

    # 3. Get previous commit
    prev_sha = rc.run_cmd(f"git rev-parse {head_sha}~1", check=False)
    if not prev_sha:
        print(f"[!] Il n'y a pas de commit précédent sur la branche '{branch}'. "
              f"Impossible de rollback.", file=sys.stderr)
        sys.exit(1)
    print(f"  -> Commit précédent : {prev_sha[:12]}")

    # Read the previous version for summary
    prev_version = None
    prev_version_json = rc.get_file_from_commit(prev_sha, "dist/version.json")
    if prev_version_json:
        try:
            prev_data = json.loads(prev_version_json)
            prev_version = prev_data.get("version")
        except Exception:
            pass

    if prev_version:
        print(f"  -> Version restaurée  : v{prev_version}")
    else:
        print(f"  -> Version restaurée  : (aucune version.json sur le commit précédent)")

    # 4. Determine GitHub owner/repo
    remote_url = rc.get_remote_url()
    owner, repo = rc.get_repo_owner_repo(remote_url)
    if not owner or not repo:
        print(f"[!] Impossible de déterminer owner/repo depuis le remote : {remote_url}",
              file=sys.stderr)
        sys.exit(1)

    print(f"[*] Repo GitHub : {owner}/{repo}")

    # 5. Delete GitHub release and tag (if they exist)
    if dry_run:
        print(f"\n[DRY-RUN] Suppression de la release GitHub v{version} "
              f"et du tag Git (simulée).")
    else:
        print(f"\n[*] Suppression de la release GitHub v{version}...")
        deleted_release, deleted_tag = rc.delete_github_release(owner, repo, version)
        if not deleted_release:
            print(f"  -> Aucune release GitHub trouvée pour v{version} "
                  f"(peut-être déjà supprimée ou jamais créée).")
        if not deleted_tag:
            print(f"  -> Aucun tag Git trouvé pour v{version} "
                  f"(peut-être déjà supprimé ou jamais créé).")

    # 6. Reset the release branch to the previous commit
    if dry_run:
        print(f"\n[DRY-RUN] Rollback de '{branch}' vers {prev_sha[:12]} (simulé).")
    else:
        print(f"\n[*] Rollback de la branche '{branch}' vers le commit précédent...")
        rc.run_cmd(f'git push origin {prev_sha}:refs/heads/{branch} --force')
        print(f"  -> Branche '{branch}' rollbackée au commit {prev_sha[:12]}.")

    # 7. Verify
    print(f"\n[*] Vérification du rollback...")
    new_head = rc.run_cmd(f"git rev-parse origin/{branch}", check=False)
    if new_head and new_head != head_sha:
        print(f"  -> Nouveau HEAD : {new_head}")
        if prev_version:
            print(f"  -> Version désormais active : v{prev_version}")
    elif new_head and new_head == head_sha:
        print(f"  -> [!] ATTENTION : HEAD n'a pas changé. "
              f"Le push peut avoir échoué.", file=sys.stderr)
    else:
        print(f"  -> [!] Impossible de lire le nouveau HEAD.", file=sys.stderr)

    # Summary
    print(f"\n{'=' * 55}")
    print(f"  Rollback terminé !")
    print(f"   - version supprimée   : v{version}")
    print(f"   - branche             : {branch}")
    print(f"   - nouveau HEAD        : "
          f"{new_head[:12] if new_head else '(inconnu)'}")
    print(f"   - version restaurée   : {prev_version or '(ancienne)'}")
    if dry_run:
        print(f"   - mode                : DRY-RUN (aucune modification effectuée)")
    print(f"{'=' * 55}")


def main():
    parser = argparse.ArgumentParser(
        description="Rollback de la dernière release sur la branche 'release'."
    )
    parser.add_argument("--dry-run", action="store_true",
                        help="Simule le rollback sans effectuer de modifications")
    parser.add_argument("--branch", default=BRANCH_RELEASE,
                        help=f"Branche de release à rollback (default: {BRANCH_RELEASE})")
    parser.add_argument("--no-commit-check", action="store_true",
                        help="Désactive la vérification Git propre")
    args = parser.parse_args()

    print("=" * 55)
    print("  OUTIIIL - Rollback de Release")
    print("=" * 55)

    ctx = rc.ReleaseContext()
    rollback_release(ctx, args.branch, dry_run=args.dry_run,
                     no_commit_check=args.no_commit_check)


if __name__ == "__main__":
    main()
