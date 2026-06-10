#!/bin/sh
set -e

echo "[entrypoint] Starting PropNest frontend..."

# ── shadcn setup ──────────────────────────────────────────────────────────────
# We use dialog.tsx as the sentinel since it's one of the last components added.
# If it's missing, we (re)run the full shadcn setup.

SENTINEL="/app/src/components/ui/dialog.tsx"

if [ ! -f "$SENTINEL" ]; then
  echo "[entrypoint] shadcn components not found or incomplete — initialising..."

  # Init shadcn — non-interactive, force yes on all prompts
  echo "" | npx --yes shadcn@latest init --defaults --force 2>/dev/null || \
  npx --yes shadcn@latest init --defaults -y --force || true

  # Add components one by one so a single failure doesn't abort the rest
  for component in button input label select badge dialog table dropdown-menu avatar separator tooltip alert card; do
    echo "[entrypoint] Adding shadcn component: $component"
    npx --yes shadcn@latest add --yes --overwrite "$component" || \
      echo "[entrypoint] Warning: failed to add $component, continuing..."
  done

  echo "[entrypoint] shadcn setup complete."
else
  echo "[entrypoint] shadcn components already present — skipping."
fi

# ── Start Next.js ─────────────────────────────────────────────────────────────
echo "[entrypoint] Starting Next.js dev server..."
exec npm run dev
