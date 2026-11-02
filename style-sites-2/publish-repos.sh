#!/usr/bin/env bash
# Split each site folder into its own PRIVATE GitHub repo (history preserved via git subtree).
# Run from the repository root after `gh auth login`:
#   bash style-sites-2/publish-repos.sh            # all sites
#   bash style-sites-2/publish-repos.sh pro2-05-*  # a subset (glob, relative to style-sites-2/)
# GitHub Pages is not enabled.
set -euo pipefail
gh auth status >/dev/null 2>&1 || { echo "Run 'gh auth login' first."; exit 1; }
cd "$(git rev-parse --show-toplevel)"
pattern="${1:-pro2-*}"
for dir in style-sites-2/$pattern/; do
  name=$(basename "$dir")
  [ -f "$dir/package.json" ] || continue
  echo "==> $name"
  branch="split/$name"
  git subtree split --prefix="style-sites-2/$name" -b "$branch" >/dev/null
  if ! gh repo view "$name" >/dev/null 2>&1; then
    gh repo create "$name" --private --description "Fictional demo site: $name" >/dev/null
  fi
  owner=$(gh api user --jq .login)
  git push "https://github.com/$owner/$name.git" "$branch:main"
  git branch -D "$branch" >/dev/null
done
