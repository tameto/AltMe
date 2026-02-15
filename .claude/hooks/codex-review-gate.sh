#!/bin/bash
# PreToolUse hook: gh pr create 前に Codex レビュー実行チェック
# exit code 0 = 警告のみ（ブロックしない）
#
# チェック内容:
# 1. gh pr create コマンドを検出
# 2. 現在のブランチの変更規模を確認
# 3. Codex レビュー完了マーカーの有無をチェック
# 4. 未実行なら警告メッセージを出力

set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

[ "$TOOL_NAME" != "Bash" ] && exit 0

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
[ -z "$COMMAND" ] && exit 0

# gh pr create を検出
echo "$COMMAND" | grep -qE 'gh\s+pr\s+create' || exit 0

# codex コマンドが利用可能か確認
if ! command -v codex &>/dev/null; then
  exit 0
fi

# 現在のブランチ名を取得
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")

# main/master ブランチからの変更行数を取得
DIFF_LINES=$(git diff main...HEAD --stat 2>/dev/null | tail -1 | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo "0")

# 小規模変更（100行未満）はスキップ
if [ "$DIFF_LINES" -lt 100 ]; then
  exit 0
fi

# Codex レビュー完了マーカーをチェック
MARKER_FILE="/tmp/codex-reviewed-${BRANCH}"
if [ -f "$MARKER_FILE" ]; then
  # マーカーが24時間以内なら OK
  MARKER_AGE=$(( $(date +%s) - $(stat -f %m "$MARKER_FILE" 2>/dev/null || echo "0") ))
  if [ "$MARKER_AGE" -lt 86400 ]; then
    exit 0
  fi
fi

cat <<FEEDBACK
[Codex Review] クロスモデルレビュー未実行の警告:
ブランチ "${BRANCH}" に ${DIFF_LINES}+ 行の変更があります。
PR 作成前に Codex レビューの実施を推奨します:

  codex exec review --full-auto --model gpt-5.3-codex --base main

または codex-reviewer サブエージェントを起動してください。
FEEDBACK

exit 0
