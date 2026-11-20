#!/usr/bin/env bash
# Installs every skill and agent in this repo into Claude Code on this computer (macOS / Linux / Git Bash).
#   ./install.sh          # skip skills that already exist
#   ./install.sh --force  # overwrite them with this repo's copy
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
force=0; [ "${1:-}" = "--force" ] && force=1
skills="$HOME/.claude/skills"; agents="$HOME/.claude/agents"
mkdir -p "$skills" "$agents"
added=0; skipped=0

install_dir() { # src name
  local dest="$skills/$2"
  if [ -e "$dest" ]; then
    if [ $force -eq 0 ]; then skipped=$((skipped+1)); echo "  skip   $2 (already installed)"; return; fi
    rm -rf "$dest"
  fi
  cp -R "$1" "$dest"; added=$((added+1)); echo "  added  $2"
}

echo "Skills from this repo:"
for d in "$here"/skills/*/; do install_dir "${d%/}" "$(basename "$d")"; done

echo "Skills fetched from their original repos:"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
python3 - "$here/upstream.json" <<'PY' > "$tmp/list" || python - "$here/upstream.json" <<'PY2' > "$tmp/list"
import json,sys
for u in json.load(open(sys.argv[1])): print(u["name"], u["repo"], u["path"], u["license_file"])
PY
import json,sys
for u in json.load(open(sys.argv[1])): print(u["name"], u["repo"], u["path"], u["license_file"])
PY2
while read -r name repo path lic; do
  if git clone --depth 1 --quiet "$repo" "$tmp/$name"; then
    cp "$tmp/$name/$lic" "$tmp/$name/$path/LICENSE" 2>/dev/null || true
    install_dir "$tmp/$name/$path" "$name"
  else echo "  warn   could not clone $repo"; fi
done < "$tmp/list"

echo "Agents:"
for f in "$here"/agents/*.md; do
  n="$(basename "$f")"
  if [ -e "$agents/$n" ] && [ $force -eq 0 ]; then echo "  skip   ${n%.md}"; continue; fi
  cp "$f" "$agents/$n"; echo "  added  ${n%.md}"
done
echo; echo "Done: $added skills added, $skipped already there. Restart Claude Code (or start a new session) to load them."
