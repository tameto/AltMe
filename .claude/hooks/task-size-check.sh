#!/bin/bash
# PostToolUse hook: TaskCreate 時にタスクの粒度をチェック
# タスクの description が長すぎる or 複数の独立した作業を含む場合に警告
#
# exit code 0 = OK（警告のみ、stdout で feedback）
# このフックはブロックせず、フィードバックとして分割を提案する

set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# TaskCreate 以外は無視
[ "$TOOL_NAME" != "TaskCreate" ] && exit 0

SUBJECT=$(echo "$INPUT" | jq -r '.tool_input.subject // empty')
DESCRIPTION=$(echo "$INPUT" | jq -r '.tool_input.description // empty')

[ -z "$DESCRIPTION" ] && exit 0

# --- チェック 1: description の長さ（文字数） ---
DESC_LENGTH=${#DESCRIPTION}
if [ "$DESC_LENGTH" -gt 1500 ]; then
  cat <<'FEEDBACK'
⚠️ タスク粒度警告: description が 1500 文字を超えています。
タスクが大きすぎる可能性があります。以下を検討してください:
- 複数の独立した作業が含まれていないか → 分割を推奨
- フロントエンド + バックエンドの変更が混在していないか → 別タスクに
- 適正サイズ: S(1-2h, 1ファイル) / M(半日, 2-3ファイル) / L(1-2日) / XL(分割必須)
FEEDBACK
  exit 0
fi

# --- チェック 2: 複数ファイルパスの検出 ---
FILE_COUNT=$(echo "$DESCRIPTION" | grep -oE '(src/|app/|supabase/)[^ )"]+\.(ts|tsx|sql|md)' | sort -u | wc -l | tr -d ' ')
if [ "$FILE_COUNT" -gt 5 ]; then
  cat <<FEEDBACK
⚠️ タスク粒度警告: ${FILE_COUNT} 個のファイルパスが検出されました。
5ファイル以上を変更するタスクは L〜XL サイズです。分割を検討してください:
- DB/Edge Function/フロントエンドは別タスクに
- shared/ の型変更は独立タスクに
FEEDBACK
  exit 0
fi

# --- チェック 3: 複合アクション検出 ---
ACTION_COUNT=$(echo "$DESCRIPTION" | grep -oiE '(実装する|作成する|設定する|追加する|変更する|修正する|テストする|リファクタする|移行する|削除する|構築する|統合する|接続する|デプロイする)' | wc -l | tr -d ' ')
if [ "$ACTION_COUNT" -gt 4 ]; then
  cat <<FEEDBACK
⚠️ タスク粒度警告: ${ACTION_COUNT} 個のアクション動詞が検出されました。
1タスク = 1アクションが理想です。複数の独立した作業は別タスクに分割してください。
FEEDBACK
  exit 0
fi

# --- チェック 4: "and" / "かつ" / "＋" による複合タスク検出 ---
COMPOUND_COUNT=$(echo "$SUBJECT" | grep -oiE '( and |、|＋| \+ |かつ|および|と$)' | wc -l | tr -d ' ')
if [ "$COMPOUND_COUNT" -gt 0 ]; then
  cat <<FEEDBACK
⚠️ タスク粒度警告: タスク名に複合表現が含まれています: "${SUBJECT}"
1タスク = 1つの責務にしてください。複合タスクは分割を推奨します。
FEEDBACK
  exit 0
fi

exit 0
