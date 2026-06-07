#!/usr/bin/env bash
# Initialize a new git repository in the current directory and push to GitHub.
# Usage:
#   1. Create a new empty repository on https://github.com/new (no README, no .gitignore, no license)
#   2. Run this script from the project root: ./scripts/init-github.sh <github-user> [repo-name]
#   3. Follow the printed instructions for the first push.
#
# Example:
#   ./scripts/init-github.sh your-username flow
set -euo pipefail

GITHUB_USER="${1:-}"
REPO_NAME="${2:-flow}"

if [[ -z "$GITHUB_USER" ]]; then
  echo "Usage: $0 <github-user> [repo-name]"
  echo "  github-user: your GitHub username (e.g. 'octocat')"
  echo "  repo-name:   repository name (default: 'flow')"
  exit 1
fi

if [[ ! -d .git ]]; then
  echo "→ Initializing git repository"
  git init -b main
else
  echo "→ Reusing existing .git"
fi

echo "→ Configuring git user (override via GIT_USER_NAME / GIT_USER_EMAIL if needed)"
git config user.name "${GIT_USER_NAME:-$(git config --global user.name || echo FLOW Bot)}"
git config user.email "${GIT_USER_EMAIL:-$(git config --global user.email || echo bot@flow.local)}"

echo "→ Adding all files"
git add .

if git diff --cached --quiet; then
  echo "→ No changes to commit"
else
  echo "→ Creating initial commit"
  git commit -m "Initial commit: FLOW order-management SaaS"
fi

REMOTE_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
if git remote get-url origin >/dev/null 2>&1; then
  echo "→ Reusing existing 'origin' remote: $(git remote get-url origin)"
else
  echo "→ Adding remote: $REMOTE_URL"
  git remote add origin "$REMOTE_URL"
fi

echo ""
echo "============================================================"
echo "Next steps:"
echo "  1. Make sure the empty repo exists on GitHub:"
echo "     https://github.com/new  (name: $REPO_NAME, no README/license/.gitignore)"
echo "  2. Push:"
echo "       git push -u origin main"
echo "  3. On GitHub, go to: Settings → Pages → Source: 'GitHub Actions'"
echo "  4. The workflow in .github/workflows/deploy.yml will run automatically"
echo "  5. Your app will be live at: https://${GITHUB_USER}.github.io/${REPO_NAME}/"
echo "============================================================"
