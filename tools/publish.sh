#!/usr/bin/env bash
# Commit the game, and push it if a git remote is configured.
#   ./tools/publish.sh ["commit message"]
set -euo pipefail
cd "$(dirname "$0")/.."

MSG="${1:-Update Quran Letter Maze}"

if [ ! -d .git ]; then
  git init -b main >/dev/null
fi
# make sure a commit identity exists (repo-local, does not touch global config)
git config user.name  >/dev/null 2>&1 || git config user.name  "Quran Maze Dev"
git config user.email >/dev/null 2>&1 || git config user.email "quran-maze@example.com"

git add -A
if git diff --cached --quiet; then
  echo "nothing to commit"
else
  git commit -m "$MSG"
fi

if git remote get-url origin >/dev/null 2>&1; then
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  echo "pushing to $(git remote get-url origin) ($BRANCH)…"
  git push -u origin "$BRANCH"
  echo
  echo "Hosting: the repo ships .github/workflows/pages.yml, so GitHub Pages"
  echo "deploys automatically — enable it once under:"
  echo "  Settings → Pages → Build and deployment → Source: GitHub Actions"
else
  cat <<'TXT'
No git remote is configured yet, so the commit is local only.

To publish on GitHub (needs your GitHub account):
  1. create an empty repository named e.g. quran-letter-maze
  2. then run:
       git remote add origin git@github.com:<YOUR-USER>/quran-letter-maze.git
       git push -u origin main
  3. Settings → Pages → Source: "GitHub Actions"  (workflow already included)
     your game will be at https://<YOUR-USER>.github.io/quran-letter-maze/

To play it right now on this network:
  ./tools/serve.sh          # prints a phone-friendly http://<your-ip>:8137 URL
TXT
fi
