#!/usr/bin/env bash
# Commit the game and push it to GitHub.
#
#   ./tools/publish.sh                                            # commit + push (origin already set)
#   ./tools/publish.sh "my message"                               # custom commit message
#   ./tools/publish.sh "my message" git@github.com:me/repo.git    # set/replace origin first
#
# If .git-ssh/id_ed25519 exists (created in this workspace, because ~/.ssh was
# not writable), it is used for the push automatically.
set -euo pipefail
cd "$(dirname "$0")/.."

MSG="${1:-Update Quran Letter Maze}"
URL="${2:-}"
KEY="$PWD/.git-ssh/id_ed25519"

if [ -f "$KEY" ]; then
  export GIT_SSH_COMMAND="ssh -i $KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=$PWD/.git-ssh/known_hosts"
fi

if [ ! -d .git ]; then git init -b main >/dev/null; fi
# repo-local identity (never touches your global git config)
git config user.name  >/dev/null 2>&1 || git config user.name  "Quran Maze Dev"
git config user.email >/dev/null 2>&1 || git config user.email "quran-maze@example.com"

git add -A
if git diff --cached --quiet; then
  echo "nothing new to commit"
else
  git commit -m "$MSG"
fi

# add or update the remote — never fail with "remote origin already exists"
if [ -n "$URL" ]; then
  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "$URL"
    echo "origin updated -> $URL"
  else
    git remote add origin "$URL"
    echo "origin added   -> $URL"
  fi
fi

if git remote get-url origin >/dev/null 2>&1; then
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  echo "pushing $(git rev-parse --short HEAD) to $(git remote get-url origin) [$BRANCH]…"
  if git push -u origin "$BRANCH"; then
    echo
    echo "✅ Pushed. Enable web hosting once (free):"
    echo "   repo → Settings → Pages → Build and deployment → Source: GitHub Actions"
    echo "   the game will be at https://<user>.github.io/<repo>/"
  else
    cat <<'TXT'

❌ Push failed — this machine is probably not authorized on GitHub yet.
   (The remote itself is fine: do NOT run "git remote add origin" again.)

Authorize with the workspace key (fastest here):
  1) show the public key:
       cat .git-ssh/id_ed25519.pub
  2) GitHub → your repository → Settings → Deploy keys → Add deploy key
     paste that line and tick "Allow write access"
     (or add it to your account instead: https://github.com/settings/keys)
  3) push again:
       ./tools/publish.sh

Alternative — HTTPS with a token:
  git remote set-url origin https://github.com/<user>/<repo>.git
  # prompts: username = your GitHub user
  #          password = a Personal Access Token with "repo" scope
  #          (create one at https://github.com/settings/tokens)
TXT
    exit 1
  fi
else
  cat <<'TXT'
No git remote is set yet. Create an empty repository on GitHub, then:
  ./tools/publish.sh "first commit" git@github.com:<user>/<repo>.git
TXT
fi
