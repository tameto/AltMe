#!/bin/bash
# PreToolUse hook: 新規ファイル作成時に kebab-case 命名規約を検証
# exit code 2 = ブロック
# 対象: src/, app/, supabase/ 配下の .ts/.tsx ファイル

set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Write のみ（新規作成時のみチェック。Edit は既存ファイルなのでスキップ）
[ "$TOOL_NAME" != "Write" ] && exit 0

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -z "$FILE_PATH" ] && exit 0

# 既に存在するファイルはスキップ（編集の場合）
[ -f "$FILE_PATH" ] && exit 0

# 対象: src/, app/, supabase/ 配下の .ts/.tsx ファイルのみ
case "$FILE_PATH" in
  */src/*.ts|*/src/*.tsx|*/app/*.ts|*/app/*.tsx|*/supabase/*.ts)
    ;;
  *)
    exit 0
    ;;
esac

# ファイル名を抽出（拡張子除去）
BASENAME=$(basename "$FILE_PATH")
FILENAME="${BASENAME%.*}"
FILENAME="${FILENAME%.*}"  # .test.ts 等の二重拡張子対応

# 特殊ファイル名はスキップ
case "$FILENAME" in
  _layout|+not-found|+html|index|__tests__|__mocks__)
    exit 0
    ;;
esac

# 角括弧付きファイル名はスキップ（Expo Router の動的ルート: [id], [...rest] 等）
if echo "$FILENAME" | grep -qE '^\[.*\]$|^\[\.\.\..+\]$'; then
  exit 0
fi

# kebab-case チェック: 小文字英数字とハイフンのみ許可
if ! echo "$FILENAME" | grep -qE '^[a-z][a-z0-9]*(-[a-z0-9]+)*$'; then
  echo "📛 命名規約違反: \"$BASENAME\" は kebab-case ではありません。" >&2
  echo "   正しい例: my-component.tsx, auth-store.ts, use-network.ts" >&2
  echo "   ルール: 小文字英数字 + ハイフン区切り（PascalCase, camelCase, snake_case 禁止）" >&2
  exit 2
fi

exit 0
