#!/bin/bash
# PreToolUse hook: 重要ファイルの変更をブロック
# exit code 2 = ブロック、stderr にメッセージ

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

[ -z "$FILE_PATH" ] && exit 0

# 保護対象ファイルパターン
case "$FILE_PATH" in
  *.env|*.env.local|*.env.production)
    echo "保護対象ファイルです: $FILE_PATH — .env ファイルは手動で編集してください" >&2
    exit 2
    ;;
  */package-lock.json)
    echo "保護対象ファイルです: $FILE_PATH — npm install で自動生成されます" >&2
    exit 2
    ;;
esac

exit 0
