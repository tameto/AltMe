# チャット体験改善 実装計画

## Phase 0: 基盤整備（ブロッカー解消）

### 0-1. DB マイグレーション
- `is_read` / `read_at` カラム確認・追加
- `ogp_cache` テーブル作成
- `chat-media` Storage バケット作成
- インデックス追加

### 0-2. 型定義更新
- `ChatMessageMetadata` に `attachments`, `ogp`, `translation` 追加
- `ChatAttachment`, `OGPData` 型追加
- `FREE_DAILY_CHAT_LIMIT` → 定数ファイルに統一

### 0-3. useChat フック分割
- `use-chat-messages.ts` 抽出
- `use-chat-transport.ts` 抽出
- `use-chat-scroll.ts` 新規作成
- `use-chat-unread.ts` 新規作成
- `chat-store.ts` Zustand store 作成
- `chat-message-repo.ts` DB操作抽出
- `use-chat.ts` を facade に再構成

### 0-4. ライブラリインストール
- `@ronradtke/react-native-markdown-display`
- `expo-clipboard`（未インストールの場合）
- `expo-haptics`（未インストールの場合）

---

## Phase 1: コア UX 改善（日常使いの品質）

### 1-1. マークダウンレンダリング（AC-12, AC-13）
- `markdown-renderer.tsx` コンポーネント作成
- カスタムルール: コードブロック（コピーボタン付き）、リンク、見出し
- `chat-bubble.tsx` のテキスト表示を置き換え
- XSS サニタイズ維持
- ユーザーメッセージもマークダウンレンダリング（送信後）

### 1-2. 長押しコンテキストメニュー（AC-14）
- `message-context-menu.tsx` コンポーネント作成
- カスタムモーダル（Web/Native 統一）
- アクション: コピー、返信（引用挿入）、翻訳
- `expo-clipboard` でコピー
- `expo-haptics` でフィードバック
- コードブロック個別コピーボタン（AC-12 の一部）

### 1-3. ScrollToBottom FAB（AC-17）
- `scroll-to-bottom-fab.tsx` コンポーネント作成
- スクロール位置監視（500px 閾値）
- 未読バッジ表示
- スムーズスクロールアニメーション
- フェードイン/アウトアニメーション

### 1-4. 未読メッセージ管理（AC-16）
- `use-chat-unread.ts` hook
- FlatList viewability コールバックで既読更新
- Supabase Realtime subscription で未読カウント同期
- タブバッジ更新（Native tabs + Web sidebar + Mobile bottom tabs）
- `chat-store.ts` に unreadCount 追加

### 1-5. ページネーション改善
- 初回ロード 50件に変更
- 上方向スクロールで追加 50件ロード
- 「これ以上メッセージはありません」表示
- `use-chat-messages.ts` にページネーションロジック集約

---

## Phase 2: リッチ機能

### 2-1. 画像送信（AC-11）
- `media-picker.tsx` コンポーネント作成（expo-image-picker）
- `media-upload.ts` サービス（signed URL + プログレス追跡）
- `media-attachment.tsx` コンポーネント（サムネイル表示）
- 全画面プレビュー（ピンチズーム）
- サイズバリデーション（10MB制限）
- アップロード中プログレスインジケーター

### 2-2. OGP プレビューカード（AC-18）
- `fetch-ogp` Edge Function 作成
- `ogp-fetcher.ts` クライアントサービス
- `ogp-preview-card.tsx` コンポーネント
- URL自動検出 + OGP取得
- タップで外部ブラウザ
- `ogp_cache` テーブルで24時間キャッシュ

### 2-3. 翻訳機能（AC-19）
- `translate-message` Edge Function 作成
- `translation-view.tsx` 折りたたみコンポーネント
- コンテキストメニューから翻訳トリガー
- `metadata.translation` に結果保存
- 日本語 ↔ 英語（自動検出）
- 翻訳済みラベル表示

### 2-4. 日記統合（AC-8, AC-10）
- Pro ユーザー振り返りプロンプトロジック
- `journal-reflect` Edge Function 呼び出し
- `chat_messages` + `journal_entries` 二重保存
- 📝 バッジ表示（isJournalPrompt / isJournalEntry）
- 振り返りメッセージのアクセントカラーバブル

---

## Phase 3: メディア拡張 + ポリッシュ

### 3-1. 動画・音声送信（AC-15）
- メディアピッカー拡張（ビデオ/音声選択）
- 動画: サムネイル + 再生ボタン
- 音声: 波形 + 再生ボタン
- サイズ制限: 動画100MB / 音声50MB

### 3-2. アクセシビリティ
- accessibilityLabel / accessibilityRole 全コンポーネント
- VoiceOver サポート
- キーボードナビゲーション（Web）

---

## Agent Team 割り当て

| Agent | Phase 0 | Phase 1 | Phase 2 | Phase 3 |
|-------|---------|---------|---------|---------|
| Agent A (Foundation) | 0-1 DB, 0-2 型, 0-3 Hook分割, 0-4 Lib | 1-5 ページネーション | — | 3-2 A11y |
| Agent C (Core AI) | — | 1-1 Markdown | 2-2 OGP EF, 2-3 翻訳EF, 2-4 日記統合 | — |
| Agent D (Engagement) | — | 1-2 コンテキストメニュー, 1-3 FAB, 1-4 未読 | 2-1 画像送信 | 3-1 動画音声 |
| Codex | — | Phase 1 レビュー | Phase 2 レビュー | 最終レビュー |

## 依存関係

```
Phase 0 (0-1, 0-2, 0-3, 0-4) — 全て並列可
    ↓
Phase 1 (1-1〜1-5) — 0-3完了後。1-1〜1-5は並列可（1-3は1-4に依存）
    ↓
Phase 2 (2-1〜2-4) — Phase 1完了後。2-1〜2-4は並列可
    ↓
Phase 3 (3-1, 3-2) — Phase 2完了後
```
