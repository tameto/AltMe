#!/bin/bash
# PostToolUse hook: git commit/gh pr 後に Greenlight App Store コンプライアンスチェック
# exit code 0 = 警告のみ（ブロックしない）、stdout で feedback
#
# タイミング:
# - git commit 完了後 → greenlight codescan（軽量・高速）
# - gh pr create 前 → greenlight preflight（フルチェック）

set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

[ "$TOOL_NAME" != "Bash" ] && exit 0

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
[ -z "$COMMAND" ] && exit 0

# greenlight がインストールされているか確認
if ! command -v greenlight &>/dev/null; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"

# git commit 完了後 → codescan（軽量）
if echo "$COMMAND" | grep -qE 'git\s+commit'; then
  RESULT=$(greenlight codescan "$PROJECT_DIR" 2>&1) || true
  CRITICAL_COUNT=$(echo "$RESULT" | grep -c '\[CRITICAL\]' || true)
  WARN_COUNT=$(echo "$RESULT" | grep -c '\[WARN\]' || true)

  if [ "$CRITICAL_COUNT" -gt 0 ]; then
    cat <<FEEDBACK
[Greenlight] App Store コンプライアンス警告:
CRITICAL: ${CRITICAL_COUNT}件 — App Store リジェクト対象です。
WARN: ${WARN_COUNT}件
\`greenlight preflight .\` で詳細を確認してください。
FEEDBACK
  elif [ "$WARN_COUNT" -gt 0 ]; then
    cat <<FEEDBACK
[Greenlight] GREENLIT (CRITICALなし) — WARN: ${WARN_COUNT}件あり
FEEDBACK
  fi
  exit 0
fi

# gh pr create 前 → preflight（フルチェック）
if echo "$COMMAND" | grep -qE 'gh\s+pr\s+create'; then
  RESULT=$(greenlight preflight "$PROJECT_DIR" 2>&1) || true
  CRITICAL_COUNT=$(echo "$RESULT" | grep -c '\[CRITICAL\]' || true)
  WARN_COUNT=$(echo "$RESULT" | grep -c '\[WARN\]' || true)
  INFO_COUNT=$(echo "$RESULT" | grep -c '\[INFO\]' || true)

  if [ "$CRITICAL_COUNT" -gt 0 ]; then
    # CRITICAL がある場合は詳細を表示
    FINDINGS=$(echo "$RESULT" | grep -A2 '\[CRITICAL\]' || true)
    cat <<FEEDBACK
[Greenlight] App Store コンプライアンス CRITICAL 検出:
${FINDINGS}

PR 作成前に \`/greenlight\` で修正してください。
CRITICAL: ${CRITICAL_COUNT}件, WARN: ${WARN_COUNT}件, INFO: ${INFO_COUNT}件
FEEDBACK
  else
    cat <<FEEDBACK
[Greenlight] GREENLIT — PR 作成OK (WARN: ${WARN_COUNT}, INFO: ${INFO_COUNT})
FEEDBACK
  fi
  exit 0
fi

exit 0
