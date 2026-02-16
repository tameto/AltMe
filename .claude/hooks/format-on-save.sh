#!/bin/bash
# PostToolUse hook: Write|Edit 後に prettier で自動フォーマット
# stdin から JSON を読み取り、対象ファイルが .ts/.tsx/.js/.jsx なら prettier 実行

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# ファイルパスが空なら終了
[ -z "$FILE_PATH" ] && exit 0

# 対象拡張子のチェック
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.json)
    # prettier がインストールされている場合のみ実行
    if command -v npx &>/dev/null && [ -f "$CLAUDE_PROJECT_DIR/node_modules/.bin/prettier" ]; then
      npx prettier --write "$FILE_PATH" 2>/dev/null || true
    fi
    ;;
esac

exit 0
