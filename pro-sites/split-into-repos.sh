#!/usr/bin/env bash
# Publish every pro-sites/<name> folder as its OWN private GitHub repository,
# keeping that folder's commit history (via git subtree split).
#
# Why this exists: the sites were built in a cloud session whose GitHub access was
# limited to the Different-websites repository, so it could not create new repos.
#
# Usage (from the root of the Different-websites checkout, with `gh auth login` done):
#   bash pro-sites/split-into-repos.sh            # all sites
#   bash pro-sites/split-into-repos.sh pro-03-tidewater-scrollytelling   # one site
set -euo pipefail

gh auth status >/dev/null 2>&1 || { echo "Not logged in. Run: gh auth login"; exit 1; }
root="$(git rev-parse --show-toplevel)"
cd "$root"
work="$(mktemp -d)"
sites=("$@")
[ ${#sites[@]} -eq 0 ] && sites=($(ls -d pro-sites/pro-*/ | xargs -n1 basename))

for name in "${sites[@]}"; do
  echo "==> $name"
  branch="split-$name"
  git subtree split --prefix="pro-sites/$name" -b "$branch" >/dev/null
  mkdir -p "$work/$name"
  (
    cd "$work/$name"
    git init -q -b main
    git pull -q "$root" "$branch"
    # GitHub Pages is NOT enabled; repo is private.
    gh repo create "$name" --private --source=. --remote=origin --push
  )
  git branch -D "$branch" >/dev/null
done
echo "Done. Temporary clones are in $work"
