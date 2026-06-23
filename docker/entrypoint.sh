#!/bin/sh
set -e

# ── shadcn setup ──────────────────────────────────────────────────────────────
SENTINEL="/app/src/components/ui/dialog.tsx"

if [ ! -f "$SENTINEL" ]; then
  echo "[entrypoint] shadcn components not found — initialising..."

  npx --yes shadcn@latest init --defaults -y --force 2>/dev/null || true

  for component in button input label select badge dialog table dropdown-menu avatar separator tooltip alert card; do
    echo "[entrypoint] Adding: $component"
    npx --yes shadcn@latest add --yes --overwrite "$component" ||       echo "[entrypoint] Warning: failed to add $component, continuing..."
  done

  echo "[entrypoint] shadcn setup complete."
else
  echo "[entrypoint] shadcn components already present — skipping."
fi

# ── Run command or fall back to dev server ────────────────────────────────────
# If arguments were passed (e.g. `docker compose run frontend npx jest`),
# execute them directly instead of starting the dev server.
# This makes CI test runs work without spawning Next.js.
if [ $# -gt 0 ]; then
  exec "$@"
else
  echo "[entrypoint] Starting Next.js dev server..."
  exec npm run dev
fi
