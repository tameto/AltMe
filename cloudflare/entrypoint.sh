#!/bin/sh
set -e
# Write SOUL.md from env var
if [ -n "$SOUL_MD" ]; then
  echo "$SOUL_MD" > /app/SOUL.md
fi
# Start OpenClaw
exec openclaw serve --host 0.0.0.0 --port 18789
