# 07 -- ツイン情報・洞察仕様

## ステータス: APPROVED
- 作成日: 2026-02-14
- 最終更新: 2026-02-15
- 承認状態: 承認済み
- 担当: Agent D (Engagement)

---

## 1. 概要

旧「洞察（Insights）」タブは**ツイン情報（Twin Info）**タブに統合・リニューアルされた。

ユーザーのAIツインに関する全情報を1画面に統合表示する:
- Big Five 性格プロフィール
- 気分トラッキング（5段階）
- SOUL.md サマリー（Pro限定）
- OpenClaw インスタンスステータス（Pro限定）

**目的**: データの蓄積を可視化し、AIツインとの関係性の深さを実感させることで解約防止に貢献する。

---

## 2. 画面仕様

### 2.1 ツイン情報タブ -- `(tabs)/twin.tsx`

```
+-------------------------------+
| [アバター] ツイン名            | <- セクション1: ヘッダー
+-------------------------------+
|                               |
| 性格プロフィール               | <- セクション2
| 開放性        --------  80    |
| 誠実性        -------   65    |
| 外向性        --------  75    |
| 協調性        --------  90    |
| 神経症傾向     -----    30    |
|                               |
| サマリーテキスト...            |
| [性格診断をやり直す]           |
+-------------------------------+
|                               |
| 今日の気分                     | <- セクション3
| great good neutral bad terrible|
+-------------------------------+
|                               |
| 気分の推移（直近7日間）        | <- セクション4
| [週次グラフ]                   |
+-------------------------------+
|                               |
| AIツインの性格 (Pro)           | <- セクション5
| SOUL.mdサマリーテキスト        |
| [Proにアップグレード] (Free)   |
+-------------------------------+
|                               |
| インスタンス状態 (Pro)         | <- セクション6
| ステータス: [●稼働中]          |
| [詳細設定]                    |
+-------------------------------+
```

### 2.2 気分の5段階定義

| 値 | 絵文字 | 意味 | 色 |
|----|--------|------|-----|
| great | great_emoji | とても良い | #10B981（緑） |
| good | good_emoji | 良い | #4ECDC4（青緑） |
| neutral | neutral_emoji | 普通 | #6B7280（グレー） |
| bad | bad_emoji | 悪い | #F59E0B（黄） |
| terrible | terrible_emoji | とても悪い | #EF4444（赤） |

### 2.3 実装上の差分

現在の `insights.tsx` 実装では旧6段階の気分選択（great/good/neutral/sad/angry/tired）が残っている。仕様上は5段階（great/good/neutral/bad/terrible）に変更済み。画面側の `MOOD_OPTIONS` を更新する必要がある。

---

## 3. セクション詳細

### 3.1 ツイン名ヘッダー

| 要素 | 仕様 |
|------|------|
| アバター | 80x80pt 円形（将来実装、現在はプレースホルダー） |
| ツイン名 | `profiles.twin_name`、Display 32pt Bold |

### 3.2 Big Five 性格プロフィール

5トレイトの横棒グラフを表示。

| トレイト | 英語 | スコア | バー色 |
|---------|------|--------|--------|
| 開放性 | Openness | 0-100 | #6C63FF |
| 誠実性 | Conscientiousness | 0-100 | #4ECDC4 |
| 外向性 | Extraversion | 0-100 | #6C63FF |
| 協調性 | Agreeableness | 0-100 | #4ECDC4 |
| 神経症傾向 | Neuroticism | 0-100 | #F59E0B |

- データソース: `personality_results.personality_traits` (JSONB)
- サマリーテキスト: `personality_results.summary`
- アニメーション: 0%からスコアまで spring animation (800ms, stagger 100ms)
- 「性格診断をやり直す」リンク付き（確認ダイアログ経由）

### 3.3 今日の気分（5段階）

- 5つの気分絵文字を横並び、タップで記録/上書き
- データソース: `mood_records` テーブル（Single Source of Truth）
- 保存: upsert（同日レコードがあれば上書き）
- 楽観的UI更新 -> Supabase保存 -> 成功: グラフ更新 / 失敗: 巻き戻し + エラートースト
- デバウンス: 500ms（連続タップ防止）

### 3.4 週次気分グラフ

直近7日間の気分推移を視覚化。

| 項目 | 仕様 |
|------|------|
| 横軸 | 日付（月/日） |
| 縦軸 | 気分レベル（5段階: terrible=1 - great=5） |
| 未記録日 | グレーアウト「--」表示 |
| データソース | `mood_records`（`recorded_at >= CURRENT_DATE - 6 days`） |
| タイムゾーン | `profiles.timezone` 基準 |
| 空状態 | 「気分を記録してみよう」メッセージ |
| キャッシュ | Zustand persist、5分TTL |

### 3.5 AIツインの性格（Pro限定）

| 表示条件 | 表示内容 |
|---------|---------|
| Proユーザー | SOUL.mdサマリーテキスト（`personality_results.communication_style`） |
| Freeユーザー | ぼかし表示（BlurView） + 「Proにアップグレードして詳細を見る」 |
| SOUL.md未生成 | 「AIツインをセットアップ中...」+ スピナー |
| 取得エラー | 「詳細を取得できませんでした」+ リトライボタン |

### 3.6 インスタンスステータス（Pro限定）

| ステータス | バッジテキスト | 色 |
|-----------|-------------|-----|
| provisioning | セットアップ中... | #F59E0B（黄） |
| running | 稼働中 | #10B981（緑） |
| stopped | 停止中 | #6B7280（グレー） |
| error | エラー | #EF4444（赤） |

- ポーリング: 30秒ごと（Twin Infoタブがフォアグラウンド時のみ）
- タブ切替/バックグラウンド移行時はポーリング停止（バッテリー最適化）
- 「詳細設定」リンク -> 設定画面に遷移
- Freeユーザーには非表示

---

## 4. Edge Function: generate-insight

### データフロー

```
App -> POST /functions/v1/generate-insight
    -> JWT認証 + Pro課金チェック
    -> chat_messages / mood_records / journal_entries 取得（直近N日）
    -> personality_results / profiles 取得
    -> OpenAI chatCompletion で洞察生成
    <- { insight, period, dataPoints }
```

### リクエスト

```json
{
  "type": "daily",
  "days": 7
}
```

### レスポンス

```json
{
  "insight": "今週は仕事関連の話題が多かったね...",
  "period": { "days": 7, "type": "daily" },
  "dataPoints": {
    "messages": 42,
    "moods": 5,
    "journals": 3
  }
}
```

### AIプロンプト仕様

| 項目 | 値 |
|------|-----|
| temperature | 0.7 |
| maxTokens | 800 |
| 出力長 | 200-400文字 |
| データソース | チャット履歴 + 気分記録 + 日記 |
| コンテキスト | `personality_results.summary` |

---

## 5. Edge Function: monthly-report

### データフロー

```
App -> POST /functions/v1/monthly-report
    -> JWT認証 + Pro課金チェック
    -> クレジット残高チェック (>= 20)
    -> 過去30日のデータ集計（chat_messages, journal_entries, mood_records）
    -> 統計計算（発言数、日記数、気分数、最頻気分）
    -> OpenAI chatCompletion でレポート生成
    -> クレジット消費 (-20)
    -> credit_transactions にレコード追加
    <- { report, stats }
```

### リクエスト

ボディなし（ユーザーのJWTから自動取得）

### レスポンス

```json
{
  "report": "## 今月の活動パターン\n...",
  "stats": {
    "totalChats": 120,
    "totalJournals": 15,
    "totalMoods": 25,
    "dominantMood": "good",
    "creditsUsed": 20
  }
}
```

### レポート構成

| セクション | 内容 |
|-----------|------|
| 今月の活動パターン | チャットの頻度・話題の傾向 |
| 感情の推移と傾向 | 気分記録の変化パターン、安定度 |
| 成長のポイント | 日記やチャットから見える前向きな変化 |
| 来月へのアドバイス | 具体的で実行可能な提案 |

### AIプロンプト仕様

| 項目 | 値 |
|------|-----|
| temperature | 0.7 |
| maxTokens | 2000 |
| 出力長 | 各セクション200-300文字、合計800-1200文字 |
| クレジット消費 | 20 |
| 月次上限 | 月1回（同月の再生成は追加クレジット不要） |

### エラーハンドリング

| エラー | ステータス | レスポンス |
|--------|----------|-----------|
| 未認証 | 401 | `{ error: "unauthorized" }` |
| Pro未課金 | 403 | `{ error: "pro_required" }` |
| クレジット不足 | 403 | `{ error: "insufficient_credits" }` |
| 内部エラー | 500 | `{ error: "internal_error" }` |

---

## 6. データ仕様

### mood_records テーブル（Single Source of Truth）

| カラム | 型 | NULL | 説明 |
|--------|-----|------|------|
| id | uuid | NO | PK |
| user_id | uuid | NO | FK -> auth.users |
| mood | text | NO | 気分（great/good/neutral/bad/terrible） |
| note | text | YES | メモ |
| recorded_at | date | NO | 記録日（ユーザーTZ基準） |
| created_at | timestamptz | NO | 作成日時 |

**RLS**: `user_id = auth.uid()` で本人のみアクセス可能

### 型定義 -- `src/shared/types/journal.ts`

```typescript
export type MoodRecord = {
  id: string;
  userId: string;
  mood: Mood;
  note: string | null;
  recordedAt: string;
  createdAt: string;
};

export type MoodRecordInput = {
  mood: Mood;
  note?: string;
};
```

### 関連テーブル

| テーブル | 用途 |
|---------|------|
| `personality_results` | Big Five診断結果（`personality_traits` JSONB, `summary`, `communication_style`） |
| `profiles` | ユーザー情報（`twin_name`, `timezone`） |
| `openclaw_instances` | インスタンスステータス（Pro限定） |
| `credits` | クレジット残高 |
| `credit_transactions` | クレジット消費履歴 |

---

## 7. 性格診断やり直しフロー

```
リンクタップ -> 確認ダイアログ
「性格診断をやり直すと、AIツインの性格も変わります。よろしいですか？」
  -> 「はい」-> オンボーディング (personality-quiz) 遷移
  -> 診断完了 -> personality_results 新規レコード INSERT
  -> Pro: Edge Function update-soul-md 呼び出し（SOUL.md自動更新）
  -> Free: DB更新のみ（OpenClawへの反映はPro課金後）
  -> Twin Info タブに戻る -> Big Five グラフ更新
```

---

## 8. Free / Pro 差分

| 項目 | Free | Pro |
|------|------|-----|
| 性格プロフィール | 表示 | 表示 |
| 今日の気分 | 表示 | 表示 |
| 週次気分グラフ | 表示 | 表示 |
| SOUL.mdサマリー | ぼかし + アップグレードプロンプト | 表示 |
| OpenClawステータス | 非表示 | 表示 + 30秒ポーリング |
| 性格診断やり直し | 可能（SOUL.md更新なし） | 可能（SOUL.md自動更新） |
| デイリーAI洞察 | 非表示 | 表示（Phase 2） |
| 月次レポート | 非表示 | クレジット消費で生成 |

---

## 9. キャッシュ戦略

| データ | キャッシュ |
|--------|----------|
| 気分データ | Zustand persist、5分TTL |
| ステータスポーリング | 最終既知値をキャッシュ |
| Big Fiveスコア | `useMemo`でメモ化、スコア変更時のみ再描画 |
| デイリー洞察 | Zustand persist、当日中有効 |
| 月次レポート | Supabase DB保存（永続） |

---

## 10. 検証条件

### 正常系
- [ ] Big Five 5トレイトが正しいスコアで表示されること
- [ ] 気分記録の作成・上書きが正常に動作すること
- [ ] 週次グラフが正しく表示されること
- [ ] ProユーザーにSOUL.mdサマリーが表示されること
- [ ] ProユーザーにOpenClawステータスが表示されること
- [ ] 性格診断やり直しフローが正常に動作すること
- [ ] ステータスポーリングが30秒ごとに実行されること

### 異常系
- [ ] ネットワークエラー時のフォールバック動作
- [ ] SOUL.md取得エラー時のリトライボタン
- [ ] ステータス取得エラー時のキャッシュ表示
- [ ] 性格診断未実施時のリダイレクト

### 境界値
- [ ] 日付変更境界（23:59 -> 0:00）での気分記録
- [ ] 全日未記録時の空状態表示
- [ ] Big Fiveスコアが0と100の場合のグラフ表示
- [ ] 利用開始から7日未満の場合の表示

### 権限
- [ ] Freeユーザーに SOUL.mdサマリーが非表示
- [ ] Freeユーザーに OpenClawステータスが非表示
- [ ] トライアルユーザーは Pro同様に全機能利用可能
