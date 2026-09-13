#!/usr/bin/env bash
# Serve the game for this computer AND for phones on the same Wi-Fi.
#   ./tools/serve.sh [port]
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${1:-8137}"
IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
echo "──────────────────────────────────────────────"
echo " Quran Letter Maze is being served:"
echo "   computer : http://localhost:$PORT"
if [ -n "${IP:-}" ]; then
  echo "   phone    : http://$IP:$PORT   (same Wi-Fi network)"
  echo "              open it on the phone, then 'Add to Home screen'"
  echo "              to play offline like an app."
fi
echo "──────────────────────────────────────────────"
exec python3 -m http.server "$PORT" --bind 0.0.0.0
