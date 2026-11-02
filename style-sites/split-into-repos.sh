#!/usr/bin/env bash
# Split each style-sites/<site> folder into its own PRIVATE GitHub repository, keeping
# that folder's own commit history (git subtree split). GitHub Pages is not enabled.
#
# Run from the root of a clone of this repository, on a machine where `gh auth status` succeeds:
#   bash style-sites/split-into-repos.sh            # create + push all 15
#   bash style-sites/split-into-repos.sh --dry-run  # only build the split branches, push nothing
#   bash style-sites/split-into-repos.sh style-07-dark-cyberpunk-voidline   # just one
#
# Repos that already exist on your account are skipped (nothing is overwritten).
set -euo pipefail

DRY=0
ONLY=()
for a in "$@"; do
  case "$a" in
    --dry-run) DRY=1 ;;
    *) ONLY+=("$a") ;;
  esac
done

cd "$(git rev-parse --show-toplevel)"
[ -d style-sites ] || { echo "Run this from the repository that contains style-sites/." >&2; exit 1; }

if [ "$DRY" -eq 0 ]; then
  command -v gh >/dev/null || { echo "The GitHub CLI (gh) is required: https://cli.github.com" >&2; exit 1; }
  gh auth status >/dev/null 2>&1 || { echo "Not logged in. Run: gh auth login" >&2; exit 1; }
  OWNER="$(gh api user -q .login)"
fi

if [ "${#ONLY[@]}" -gt 0 ]; then SITES=("${ONLY[@]}"); else
  mapfile -t SITES < <(find style-sites -mindepth 1 -maxdepth 1 -type d -name 'style-*' -printf '%f\n' | sort)
fi

for site in "${SITES[@]}"; do
  prefix="style-sites/$site"
  [ -f "$prefix/index.html" ] || { echo "skip $site: no $prefix/index.html"; continue; }
  branch="split/$site"
  echo "== $site"
  git branch -D "$branch" >/dev/null 2>&1 || true
  git subtree split --prefix="$prefix" -b "$branch" >/dev/null 2>&1
  echo "   commits: $(git rev-list --count "$branch")  ($(git log --format=%s "$branch" | tr '\n' '|' | sed 's/|$//'))"

  if [ "$DRY" -eq 1 ]; then continue; fi

  if gh repo view "$OWNER/$site" >/dev/null 2>&1; then
    echo "   $OWNER/$site already exists: skipped"
    continue
  fi
  gh repo create "$OWNER/$site" --private --description "Design-style demo site ($site). Fictional brand." >/dev/null
  git push "https://github.com/$OWNER/$site.git" "$branch:refs/heads/main"
  echo "   pushed: https://github.com/$OWNER/$site (private)"
done

echo "Done. Split branches are named split/<site>; delete them with: git branch -D \$(git branch --list 'split/*')"
