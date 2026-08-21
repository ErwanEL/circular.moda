#!/bin/sh
# Launcher for the read-only Supabase MCP server, used by .mcp.json.
#
# Reads SUPABASE_ACCESS_TOKEN from .env.local so the secret stays in one place
# (and out of .mcp.json, which is safe to commit). The token line in .env.local
# uses "KEY = value" spacing, which dotenv accepts but the shell cannot source
# directly — hence the manual grep/sed extraction below.

ENV_FILE="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)/.env.local"

SUPABASE_ACCESS_TOKEN=$(grep -E '^[[:space:]]*SUPABASE_ACCESS_TOKEN[[:space:]]*=' "$ENV_FILE" \
  | tail -n1 \
  | sed -E 's/^[^=]*=[[:space:]]*//; s/[[:space:]]*$//')
export SUPABASE_ACCESS_TOKEN

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "supabase-mcp: SUPABASE_ACCESS_TOKEN not found in $ENV_FILE" >&2
  exit 1
fi

exec npx -y @supabase/mcp-server-supabase@latest \
  --read-only \
  --project-ref=mygfywownbtwjjosadvd
