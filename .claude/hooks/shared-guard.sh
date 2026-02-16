#!/bin/bash
# PreToolUse hook: shared/ および shared/types/ の変更を警告
# exit code 0 = 警告のみ（ブロックしない）、stdout で feedback
#
# Agent間の契約ファイル（型定義、共通hooks、共通コンポーネント）の
# 変更は他のAgentに影響するため、注意喚起する。

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

[ -z "$FILE_PATH" ] && exit 0

# shared/types/ の変更 — 最も影響が大きい
case "$FILE_PATH" in
  */src/shared/types/*)
    cat <<'FEEDBACK'
⚠️ 型契約ファイル変更: shared/types/ はAgent間の契約です。
この変更は全Agentの実装に影響します。以下を確認してください:
- 破壊的変更（プロパティ削除・型変更）は全Agentの合意が必要
- 追加のみなら比較的安全だが、既存の import 先を確認すること
- 変更後は `npx tsc --noEmit` で型チェックを実行してください
FEEDBACK
    exit 0
    ;;
esac

# shared/hooks/ の変更
case "$FILE_PATH" in
  */src/shared/hooks/*)
    cat <<'FEEDBACK'
⚠️ 共通Hook変更: shared/hooks/ は複数の画面・機能から使用されています。
- 戻り値の型やパラメータを変更する場合、呼び出し元を全て確認してください
- 新規hookの追加は安全です
FEEDBACK
    exit 0
    ;;
esac

# shared/components/ の変更
case "$FILE_PATH" in
  */src/shared/components/*)
    cat <<'FEEDBACK'
⚠️ 共通コンポーネント変更: shared/components/ は複数の画面から使用されています。
- Props の型変更は呼び出し元を全て確認してください
- ビジュアル変更は全画面で意図通りか確認してください
FEEDBACK
    exit 0
    ;;
esac

# src/config/ の変更
case "$FILE_PATH" in
  */src/config/*)
    cat <<'FEEDBACK'
⚠️ 設定ファイル変更: src/config/ はアプリ全体に影響します。
- 定数値の変更は全機能に波及する可能性があります
- 環境変数の追加/変更は .env.example も更新してください
FEEDBACK
    exit 0
    ;;
esac

exit 0
