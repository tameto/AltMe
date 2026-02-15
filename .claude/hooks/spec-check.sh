#!/bin/bash
# PreToolUse hook: src/ に新規ファイル作成時、対応する仕様書の存在を確認
# exit code 0 = 警告のみ（ブロックしない）、stdout で feedback
#
# 仕様駆動開発の原則: 仕様書にないものは作らない

set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Write（新規作成）のみ
[ "$TOOL_NAME" != "Write" ] && exit 0

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -z "$FILE_PATH" ] && exit 0

# 既存ファイルはスキップ
[ -f "$FILE_PATH" ] && exit 0

# src/features/ 配下の新規ファイルのみ対象
case "$FILE_PATH" in
  */src/features/*)
    ;;
  *)
    exit 0
    ;;
esac

# テスト・モックファイルはスキップ
case "$FILE_PATH" in
  *__tests__*|*__mocks__*|*.test.*|*.spec.*|*.mock.*)
    exit 0
    ;;
esac

# feature名を抽出 (src/features/{feature}/... → feature)
FEATURE=$(echo "$FILE_PATH" | sed -n 's|.*/src/features/\([^/]*\)/.*|\1|p')
[ -z "$FEATURE" ] && exit 0

# プロジェクトルートを検出
PROJECT_DIR=$(echo "$FILE_PATH" | sed 's|/src/features/.*||')

# 対応する仕様書の存在チェック
SPEC_FOUND=false
for SPEC_PATH in \
  "$PROJECT_DIR/specs/features/$FEATURE.md" \
  "$PROJECT_DIR/specs/features/${FEATURE//-/_}.md" \
  "$PROJECT_DIR/specs/features/${FEATURE//_/-}.md"; do
  if [ -f "$SPEC_PATH" ]; then
    SPEC_FOUND=true
    break
  fi
done

if [ "$SPEC_FOUND" = "false" ]; then
  cat <<FEEDBACK
📋 仕様書チェック: feature "${FEATURE}" の仕様書が見つかりません。
仕様駆動開発の原則: 仕様書にないものは作らない。
以下を確認してください:
- specs/features/${FEATURE}.md が存在するか
- 仕様書を先に作成する必要があるか
- 既存の仕様書の別名で定義されていないか
FEEDBACK
  exit 0
fi

exit 0
