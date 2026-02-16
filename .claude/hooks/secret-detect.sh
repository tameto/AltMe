#!/bin/bash
# PreToolUse hook: ハードコードされたシークレットを検出してブロック
# exit code 2 = ブロック

set -euo pipefail

INPUT=$(cat)
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

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# テストファイル・モック・フック自身はスキップ
case "$FILE_PATH" in
  *__tests__*|*__mocks__*|*.test.*|*.spec.*|*.mock.*|*/.claude/hooks/*)
    exit 0
    ;;
esac

# --- パターン 1: AWS キー ---
if echo "$CONTENT" | grep -qE 'AKIA[0-9A-Z]{16}'; then
  echo "🔐 シークレット検出: AWS Access Key が含まれています。環境変数を使用してください。" >&2
  exit 2
fi

# --- パターン 2: 汎用 API キー/トークン/シークレットの直接代入 ---
# "sk-" (OpenAI), "sb-" (Supabase), "dop_v1_" (DigitalOcean), "rc_" (RevenueCat) 等
if echo "$CONTENT" | grep -qE "(sk-[a-zA-Z0-9]{20,}|sk_live_[a-zA-Z0-9]+|sb-[a-zA-Z0-9]{20,}|dop_v1_[a-f0-9]{64}|rc_[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36})"; then
  echo "🔐 シークレット検出: APIキー/トークンがハードコードされています。環境変数または Expo Constants を使用してください。" >&2
  exit 2
fi

# --- パターン 3: password/secret/token への直接文字列代入 ---
# 変数代入パターン: password = "xxx", apiKey: "xxx" 等（短すぎるものは除外）
if echo "$CONTENT" | grep -qiE "(password|secret|api_?key|access_?token|private_?key|auth_?token)\s*[:=]\s*[\"'\`][a-zA-Z0-9+/=]{12,}[\"'\`]"; then
  # 型定義・インターフェース・プレースホルダーは除外
  if ! echo "$CONTENT" | grep -qE '(type |interface |placeholder|example|dummy|test|TODO|FIXME|process\.env|Constants\.expoConfig|Deno\.env)'; then
    echo "🔐 シークレット検出: password/secret/apiKey にリテラル値が代入されています。環境変数を使用してください。" >&2
    exit 2
  fi
fi

# --- パターン 4: Base64エンコードされた長い文字列（JWT等） ---
if echo "$CONTENT" | grep -qE 'eyJ[a-zA-Z0-9_-]{50,}\.[a-zA-Z0-9_-]{50,}'; then
  echo "🔐 シークレット検出: JWT トークンがハードコードされています。" >&2
  exit 2
fi

exit 0
