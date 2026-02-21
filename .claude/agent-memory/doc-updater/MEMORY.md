# doc-updater Memory

## プロジェクト構造
- 仕様書: `specs/features/*.md`, `specs/screens/*.md`, `specs/api/*.md`, `specs/shared/*.md`
- フォーマット: spec-driven-dev スキルのテンプレート準拠
- 変更履歴: 各仕様書の末尾に変更ログテーブルを追加

## 最近の更新

### メディア添付機能（Media Attachment） (2026-02-20)
- `specs/features/chat.md`, `specs/api/database.md`, `.sdd/specs/20260220-chat-media-attach/spec.md` 更新
- 変更内容:
  - メディア添付機能仕様セクション追加（attachment-panel, media-preview-bar, audio-recorder-ui等）
  - インライン添付パネル（300ms スライドアップ）、4メディアタイプ（image/video/audio/file）
  - フォトライブラリ統合（最近8件グリッド）、音声録音（5分上限）、ビデオ録画（3分上限）
  - chat_attachments テーブル（file_name カラム追加）、Storage RLS（{user_id}/{message_id}/{filename}）
  - Implementation Notes セクション: アーキテクチャ決定（インライン式、マイクロコンポーネント分割、送信時アップロード、複数メディア最大5件）
  - 仕様逸脱記録: 音声フォーマット（M4A/MP3/AAC限定）、ビデオサムネイル自動生成、ストレージパス（draft_message_id使用）

### WebSocket TLS & SSE統合 (2026-02-14)
- `specs/features/chat.md` と `specs/api/external-services.md` 更新
- 変更内容:
  - ws:// → wss:// (全箇所)：TLS必須化
  - nginx reverse proxy追加：自己署名証明書で初期運用
  - cloud-initスクリプト更新：certbot対応、機密情報削除
  - OpenClaw WebSocketプロトコル統一：chat.mdに合わせる
  - Free chat Edge Function SSE明確化
  - フォールバック復帰ポリシー追加
  - ページネーション仕様（50件ずつ）追加
  - Free上限到達UX詳細化
  - 振り返り回答文字数制限3,000文字
  - journal_entries.mood参照削除（mood_recordsがSSoT）

### Twin Info（ツイン情報）タブ統合 (2026-02-14)
- `specs/features/insights.md` を Twin Info 仕様として全面書き換え
- 統合内容:
  - Big Five 性格プロフィール（棒グラフ + サマリー）
  - 気分トラッキング（5段階: great/good/neutral/bad/terrible、6段階から変更）
  - SOUL.md サマリー表示（Pro限定）
  - OpenClaw インスタンスステータス（Pro限定、表示のみ）
- OpenClaw インスタンス管理の詳細操作は `specs/features/settings.md` に委譲

## Reconcile チェックリスト
- [ ] 実装コードと仕様書の差分検出
- [ ] デザインファイル（designs/*.pen）との整合性
- [ ] Constitution 整合性（specs/constitution.md）
- [ ] 変更履歴の記録（各仕様書末尾）
- [ ] 影響範囲チェック（overview.md, screen-list.md, database.md 等）

## 気分トラッキング仕様の変更
- 旧: 6段階（great/good/neutral/sad/angry/tired）
- 新: 5段階（great/good/neutral/bad/terrible）
- データ型: `mood_records.mood` enum 型の更新が必要
