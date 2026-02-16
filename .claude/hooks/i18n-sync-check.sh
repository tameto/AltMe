#!/bin/bash
# PostToolUse hook: i18n ロケールファイル間のキー不一致を検出
# exit code 0 = 警告のみ（ブロックしない）
#
# ja.json, en.json, ko.json のトップレベルキーを比較し、
# 不一致がある場合に警告を出力する。

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -z "$FILE_PATH" ] && exit 0

# locales/*.json のみ対象
case "$FILE_PATH" in
  */i18n/locales/*.json) ;;
  *) exit 0 ;;
esac

[ ! -f "$FILE_PATH" ] && exit 0

# ロケールディレクトリを取得
LOCALES_DIR=$(dirname "$FILE_PATH")

# 全ロケールファイルを取得
LOCALE_FILES=$(find "$LOCALES_DIR" -maxdepth 1 -name "*.json" 2>/dev/null | sort)
FILE_COUNT=$(echo "$LOCALE_FILES" | wc -l | tr -d ' ')

# 2ファイル未満なら不要
[ "$FILE_COUNT" -lt 2 ] && exit 0

# 各ファイルのトップレベルキーを抽出して比較
REFERENCE_FILE=""
REFERENCE_KEYS=""
REFERENCE_LANG=""
WARNINGS=""

for LOCALE_FILE in $LOCALE_FILES; do
  LANG=$(basename "$LOCALE_FILE" .json)
  KEYS=$(jq -r 'keys[]' "$LOCALE_FILE" 2>/dev/null | sort)

  if [ -z "$REFERENCE_FILE" ]; then
    REFERENCE_FILE="$LOCALE_FILE"
    REFERENCE_KEYS="$KEYS"
    REFERENCE_LANG="$LANG"
    continue
  fi

  # リファレンスにあって対象にないキー
  MISSING=$(comm -23 <(echo "$REFERENCE_KEYS") <(echo "$KEYS"))
  # 対象にあってリファレンスにないキー
  EXTRA=$(comm -13 <(echo "$REFERENCE_KEYS") <(echo "$KEYS"))

  if [ -n "$MISSING" ]; then
    MISSING_LIST=$(echo "$MISSING" | sed 's/^/    /')
    WARNINGS="${WARNINGS}\n  ${LANG}.json に不足 (${REFERENCE_LANG}.json にはある):\n${MISSING_LIST}"
  fi

  if [ -n "$EXTRA" ]; then
    EXTRA_LIST=$(echo "$EXTRA" | sed 's/^/    /')
    WARNINGS="${WARNINGS}\n  ${LANG}.json に余分 (${REFERENCE_LANG}.json にはない):\n${EXTRA_LIST}"
  fi
done

if [ -n "$WARNINGS" ]; then
  cat <<FEEDBACK
[i18n Sync] ロケールファイル間でトップレベルキーの不一致が検出されました:
$(echo -e "$WARNINGS")

すべてのロケールファイル (${LOCALES_DIR}/) のキーを同期してください。
FEEDBACK
fi

exit 0
