#!/usr/bin/env bash
# macOS / Linux launcher: checks for Node and Git, then runs install.mjs with whatever options you pass.
#   bash install.sh          core skills + MCP servers
#   bash install.sh --all    everything in the catalog
set -euo pipefail
for tool in node git; do
  command -v "$tool" >/dev/null 2>&1 || { echo "$tool is not installed (macOS: brew install $tool)"; exit 1; }
done
exec node "$(cd "$(dirname "$0")" && pwd)/install.mjs" "$@"
