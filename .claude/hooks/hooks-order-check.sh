#!/bin/bash
# PostToolUse hook: React hooks の条件分岐後呼び出しを検出
# exit code 0 = 警告のみ（ブロックしない）
#
# React Rules of Hooks: hooks は条件分岐・早期リターンの前に呼び出す必要がある。
# コンポーネントレベル（インデント2スペース）の early return 後に hooks 呼び出しがあれば警告。

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -z "$FILE_PATH" ] && exit 0

# .tsx ファイルのみ対象
case "$FILE_PATH" in
  *.tsx) ;;
  *) exit 0 ;;
esac

# ファイルが存在しない場合はスキップ
[ ! -f "$FILE_PATH" ] && exit 0

# コンポーネントレベル（2スペースインデント）の early return を検出
# パターン: "  if (...) {" → "    return" または "  if (...) return"
EARLY_RETURN_LINE=0
HOOK_AFTER_RETURN_LINES=""

LINE_NUM=0
IN_COMPONENT=false

while IFS= read -r line; do
  LINE_NUM=$((LINE_NUM + 1))

  # export default function / export function / function Component でコンポーネント開始検出
  if echo "$line" | grep -qE '^(export\s+default\s+)?function\s+[A-Z]'; then
    IN_COMPONENT=true
    EARLY_RETURN_LINE=0
  fi

  [ "$IN_COMPONENT" = false ] && continue

  # コンポーネントレベルの early return を検出（2-4スペースインデント）
  if echo "$line" | grep -qE '^\s{2,6}(if\s*\(|return\s)' && [ "$EARLY_RETURN_LINE" -eq 0 ]; then
    if echo "$line" | grep -qE '^\s{2,4}if\s*\('; then
      # if 文の中の return を探す（次の数行）
      :
    elif echo "$line" | grep -qE '^\s{4,6}return\s'; then
      EARLY_RETURN_LINE=$LINE_NUM
    fi
  fi

  # 2スペースインデントの return（コンポーネント直下）
  if echo "$line" | grep -qE '^\s{2}return[\s(;]' && [ "$EARLY_RETURN_LINE" -eq 0 ]; then
    # これはJSX returnの可能性が高いのでスキップ（最後のreturn）
    :
  fi

  # 4スペースインデントの return（if文の中）
  if echo "$line" | grep -qE '^\s{4}return[\s(;]' && [ "$EARLY_RETURN_LINE" -eq 0 ]; then
    EARLY_RETURN_LINE=$LINE_NUM
  fi

  # early return の後に hooks 呼び出しがあるか検出
  if [ "$EARLY_RETURN_LINE" -gt 0 ] && [ "$LINE_NUM" -gt "$EARLY_RETURN_LINE" ]; then
    if echo "$line" | grep -qE '^\s{2}(const\s.*=\s*)?(useState|useEffect|useCallback|useRef|useMemo|useReducer|useContext|useLayoutEffect|useImperativeHandle)\b'; then
      HOOK_NAME=$(echo "$line" | grep -oE '(useState|useEffect|useCallback|useRef|useMemo|useReducer|useContext|useLayoutEffect|useImperativeHandle)' | head -1)
      HOOK_AFTER_RETURN_LINES="${HOOK_AFTER_RETURN_LINES}\n  - L${LINE_NUM}: ${HOOK_NAME} (early return at L${EARLY_RETURN_LINE})"
    fi
  fi

done < "$FILE_PATH"

if [ -n "$HOOK_AFTER_RETURN_LINES" ]; then
  BASENAME=$(basename "$FILE_PATH")
  cat <<FEEDBACK
[React Hooks] "${BASENAME}" で hooks が条件付き return の後に呼び出されています:
$(echo -e "$HOOK_AFTER_RETURN_LINES")

React の Rules of Hooks 違反: すべての hooks は条件分岐や early return の前に宣言してください。
参考: https://react.dev/reference/rules/rules-of-hooks
FEEDBACK
fi

exit 0
