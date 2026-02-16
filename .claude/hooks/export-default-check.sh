#!/bin/bash
# PostToolUse hook: export default の使用を検出
# exit code 0 = 警告のみ（ブロックしない）、stdout で feedback
#
# コーディング規約: named export のみ（Expo Router の画面ファイルは例外）

set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -z "$FILE_PATH" ] && exit 0

# .ts/.tsx ファイルのみ対象
case "$FILE_PATH" in
  *.ts|*.tsx)
    ;;
  *)
    exit 0
    ;;
esac

# Expo Router の画面ファイルは例外（app/ 配下）
case "$FILE_PATH" in
  */app/*)
    exit 0
    ;;
esac

# Write の場合は content、Edit の場合は new_string をチェック
if [ "$TOOL_NAME" = "Write" ]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // empty')
elif [ "$TOOL_NAME" = "Edit" ]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // empty')
else
  exit 0
fi

[ -z "$CONTENT" ] && exit 0

# export default の検出
if echo "$CONTENT" | grep -qE '^export\s+default\s|^export\s*\{\s*\w+\s+as\s+default'; then
  BASENAME=$(basename "$FILE_PATH")
  cat <<FEEDBACK
⚠️ コーディング規約違反: "${BASENAME}" に export default が含まれています。
- named export を使用してください: export const/function/class ...
- 例外: app/ 配下の Expo Router 画面ファイルのみ export default 許可
FEEDBACK
  exit 0
fi

exit 0
