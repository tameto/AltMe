# チャット体験改善 仕様書

## 概要
既存チャット仕様書 (`specs/features/chat.md`) の全未実装項目を体系的に実装し、
チャット体験を完成させる。

## 参照元仕様
- `specs/features/chat.md` — Single Source of Truth（全19 AC）
- `specs/api/database.md` — DBスキーマ定義

## 実装済み / 未実装ステータス

### 実装済み（変更不要）
- AC-1: Free SSE チャット（3回/日制限）
- AC-2: Pro WebSocket チャット
- AC-3: フォールバック（Edge Function）
- AC-4: WebSocket 再接続（exponential backoff）
- AC-5: 履歴ロード（20件、要50件に変更）
- AC-6: ストリーミング応答表示
- AC-7: メッセージ長制限（1000文字）
- AC-9: トピックタブ（日常/仕事/振り返り/相談）

### 未実装（本プロジェクトで実装）
| AC | 機能名 | 優先度 | 依存 |
|----|--------|--------|------|
| AC-12 | マークダウンレンダリング（AI応答） | P0 | なし |
| AC-13 | マークダウン入力（ユーザー） | P0 | AC-12 |
| AC-14 | 長押しコンテキストメニュー + コピー | P0 | AC-12 |
| AC-17 | ScrollToBottom FAB + 未読バッジ | P0 | AC-16 |
| AC-16 | 未読メッセージ管理 | P0 | DB migration |
| AC-5+ | ページネーション改善（50件化） | P1 | なし |
| AC-11 | 画像送信 | P1 | Storage bucket |
| AC-18 | OGP プレビューカード | P1 | Edge Function |
| AC-19 | 翻訳機能 | P1 | Edge Function |
| AC-8 | 日記統合（振り返りプロンプト） | P1 | AC-10 |
| AC-10 | ジャーナル自動保存 | P1 | journal-reflect EF |
| AC-15 | 動画・音声送信 | P2 | AC-11 |

## アーキテクチャ改善

### useChat フック分割（Codex 提言）
現状の `useChat.ts` (471 LOC) を以下に分離:

```
src/features/chat/
  hooks/
    use-chat.ts            # Orchestrator facade (200 LOC目標)
    use-chat-messages.ts   # メッセージ状態 + 履歴ロード + ページネーション
    use-chat-transport.ts  # SSE / WebSocket 送受信切り替え
    use-chat-scroll.ts     # スクロール位置 + FAB 表示制御
    use-chat-unread.ts     # 未読管理 + Realtime subscription
  stores/
    chat-store.ts          # Zustand store（未読カウント、接続状態）
  services/
    chat-message-repo.ts   # Supabase CRUD（insert, select, markAsRead, updateMetadata）
    media-upload.ts        # Supabase Storage アップロード + プログレス
    ogp-fetcher.ts         # OGP取得 + キャッシュ
```

### ライブラリ選定
| 用途 | ライブラリ | バージョン |
|------|-----------|-----------|
| Markdown | @ronradtke/react-native-markdown-display | ^8.1.1 |
| 画像ピッカー | expo-image-picker | SDK 54 |
| ファイルシステム | expo-file-system | SDK 54 |
| ハプティクス | expo-haptics | SDK 54 |
| Clipboard | expo-clipboard | SDK 54 |

## 技術仕様

### DB マイグレーション追加
```sql
-- chat_messages に既に is_read, read_at が存在する場合はスキップ
-- ogp_cache テーブル追加
CREATE TABLE IF NOT EXISTS ogp_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  image TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);
CREATE INDEX idx_ogp_cache_url ON ogp_cache(url);

-- chat-media Storage bucket
-- INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', false);
```

### Edge Functions 追加
1. `fetch-ogp` — URL → OGP メタデータ取得
2. `translate-message` — メッセージ翻訳（日↔英）

### Supabase Storage
- バケット: `chat-media`
- パス: `{user_id}/{message_id}/{filename}`
- RLS: 本人のみ read/write
- サイズ制限: 画像 10MB / 動画 100MB / 音声 50MB
