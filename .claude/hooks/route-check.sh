#!/bin/bash
# PostToolUse hook: router.push/replace の遷移先が存在するか検証
# exit code 0 = 警告のみ（ブロックしない）
#
# Expo Router のファイルベースルーティングで、存在しないルートへの遷移を検出。

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -z "$FILE_PATH" ] && exit 0

# .tsx/.ts ファイルのみ対象
case "$FILE_PATH" in
  *.tsx|*.ts) ;;
  *) exit 0 ;;
esac

[ ! -f "$FILE_PATH" ] && exit 0

# プロジェクトルートを取得
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
[ -z "$REPO_ROOT" ] && exit 0

APP_DIR="$REPO_ROOT/app"
[ ! -d "$APP_DIR" ] && exit 0

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Write の場合は content、Edit の場合は new_string をチェック
if [ "$TOOL_NAME" = "Write" ]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // empty')
elif [ "$TOOL_NAME" = "Edit" ]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // empty')
else
  exit 0
fi

[ -z "$CONTENT" ] && exit 0

# router.push('...') / router.replace('...') からルートを抽出
ROUTES=$(echo "$CONTENT" | grep -oE "router\.(push|replace)\(['\"]([^'\"]+)['\"]" | sed -E "s/router\.(push|replace)\(['\"]//;s/['\"]$//" | sort -u)

[ -z "$ROUTES" ] && exit 0

MISSING=""

for ROUTE in $ROUTES; do
  # 動的セグメント [param] を含むルートはスキップ
  if echo "$ROUTE" | grep -q '\['; then
    continue
  fi

  # ルートパスからファイルパスの候補を生成
  # /(paywall) -> app/(paywall)/index.tsx
  # /subscription-manage -> app/subscription-manage.tsx
  ROUTE_CLEAN=$(echo "$ROUTE" | sed 's|^/||')

  FOUND=false

  # 候補1: app/{route}.tsx
  if [ -f "$APP_DIR/${ROUTE_CLEAN}.tsx" ]; then
    FOUND=true
  fi

  # 候補2: app/{route}/index.tsx
  if [ -f "$APP_DIR/${ROUTE_CLEAN}/index.tsx" ]; then
    FOUND=true
  fi

  # 候補3: グループルート — (group) を含む場合
  # /(paywall) -> app/(paywall)/index.tsx (既にカバー)
  # /(auth)/login -> app/(auth)/login.tsx (既にカバー)

  # 候補4: _layout で定義されたグループ内のルート
  if [ "$FOUND" = false ]; then
    # find で探す（浅い検索）
    SEARCH_NAME=$(basename "$ROUTE_CLEAN")
    if find "$APP_DIR" -maxdepth 3 -name "${SEARCH_NAME}.tsx" 2>/dev/null | grep -q .; then
      FOUND=true
    fi
    if [ "$FOUND" = false ] && find "$APP_DIR" -maxdepth 3 -path "*/${ROUTE_CLEAN}/index.tsx" 2>/dev/null | grep -q .; then
      FOUND=true
    fi
  fi

  if [ "$FOUND" = false ]; then
    MISSING="${MISSING}\n  - ${ROUTE} (router.push/replace で参照)"
  fi
done

if [ -n "$MISSING" ]; then
  BASENAME=$(basename "$FILE_PATH")
  cat <<FEEDBACK
[Route Check] "${BASENAME}" で存在しないルートへの遷移が検出されました:
$(echo -e "$MISSING")

Expo Router はファイルベースルーティングです。app/ 配下に対応するファイルを作成するか、
遷移先を修正してください。
FEEDBACK
fi

exit 0
