#!/bin/bash
# PreToolUse hook: 危険な Bash コマンドをブロック
# exit code 2 = ブロック

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

[ -z "$COMMAND" ] && exit 0

# 危険なコマンドパターンの検出
if echo "$COMMAND" | grep -qE 'rm\s+-rf\s+/|rm\s+-rf\s+\.|git\s+push\s+--force\s+(origin\s+)?(main|master)|git\s+reset\s+--hard|git\s+clean\s+-fd'; then
  echo "危険なコマンドが検出されました: $COMMAND — 本当に実行する場合は手動で行ってください" >&2
  exit 2
fi

exit 0
