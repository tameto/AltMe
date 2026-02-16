# 06 -- 日記機能仕様

## ステータス: APPROVED
- 作成日: 2026-02-14
- 最終更新: 2026-02-15
- 承認状態: 承認済み
- 担当: Agent C (Core AI) / Agent D (Engagement)

---

## 1. 概要

日記機能は**チャットタブに統合**されている。独立した日記タブは廃止済み。

AIツインがチャット内で振り返りを促し、ユーザーの回答がジャーナルエントリーとして保存される。
AI振り返りコメントがバックグラウンドで生成され、チャット内に表示される。

**統合方針**: チャット履歴 = 日記履歴（統合ビュー）

### 独立タブ廃止の理由
1. UXのシームレス化 -- 別タブに移動する摩擦を排除
2. エンゲージメント向上 -- 会話的に振り返りを促し継続率向上
3. 開発効率 -- チャット機能内に統合しメンテナンスコスト削減
4. AIツインとの一体感 -- 会話の中で自然に日記が生まれる体験

---

## 2. 画面仕様

### 2.1 チャット画面内の日記統合ビュー -- `(tabs)/index.tsx`

日記機能はチャット画面内に統合。振り返り関連メッセージは通常チャットと視覚的に区別される。

| 要素 | 表示 |
|------|------|
| 通常チャットメッセージ | 従来通りの背景色、バッジなし |
| 振り返りプロンプト（AI） | 📝バッジ、薄いアクセントカラー背景 |
| ユーザーの振り返り回答 | 📝バッジ、薄いアクセントカラー背景 |
| AI振り返りコメント | 📝バッジ、薄いアクセントカラー背景 |

#### Pro限定
- Proユーザーのみ振り返り機能を利用可能
- Freeユーザーには振り返りプロンプトは表示されない
- 過去にProで作成した振り返り履歴は読み取り専用で閲覧可能

### 2.2 既存の独立日記画面 -- `(tabs)/journal.tsx`（レガシー）

現在の実装では `journal.tsx` に独立した日記画面が存在する。

```
+------------------------------+
| 日記                   [+]   |
|------------------------------|
|                              |
|  -- 2026年2月 --             |
|  +----------------------+    |
|  | 2/14 (金)              |    |
|  | 今日はバレンタイン...   |    |
|  +----------------------+    |
|                              |
+------------------------------+
```

**実装上の差分**: 現在の `journal.tsx` は独立した日記作成・一覧画面として実装されている。仕様書ではチャット統合に移行予定だが、移行完了まではこの画面が残る。

#### Freeユーザー表示

```
+------------------------------+
| 日記                        |
|------------------------------|
|     (lock) 日記はProの機能です|
|                              |
|  +----------------------+    |
|  | Proにアップグレード -> |    |
|  +----------------------+    |
+------------------------------+
```

---

## 3. 日記エントリー生成フロー

### 3.1 トリガー

| トリガー | 条件 |
|---------|------|
| 定期プロンプト | 最後のチャットから6時間以上経過（1日1回まで） |
| ユーザー開始 | 「振り返りしたい」「日記書きたい」等のキーワード入力 |
| 定時プッシュ通知 | 毎日22:00（ローカルタイム）にプッシュ通知（オプション） |

### 3.2 メッセージメタデータ

```typescript
interface ChatMessageMetadata {
  isJournalPrompt?: boolean;      // AIがジャーナルを促すメッセージ
  isJournalEntry?: boolean;       // ユーザーのジャーナル回答
  isJournalReflection?: boolean;  // AIの振り返りコメント
  journalEntryId?: string;        // 対応する journal_entries.id
}
```

### 3.3 保存フロー

1. AIツインが振り返りを促す（`isJournalPrompt: true`）
2. ユーザーが回答を入力
3. `chat_messages` に保存（`isJournalEntry: true`）
4. **同時に** `journal_entries` テーブルにも保存（`mood: NULL`）
5. `journal-reflect` Edge Function を呼び出し
6. AI振り返りコメントを生成（80-150文字）
7. `chat_messages` に追加（`isJournalReflection: true`）
8. `journal_entries.ai_reflection` カラムを更新

---

## 4. Edge Function: journal-reflect

### データフロー

```
App -> POST /functions/v1/journal-reflect
    -> JWT認証 + Pro課金チェック
    -> journal_entries からエントリ取得
    -> personality_results から性格情報取得
    -> profiles からユーザー名・ツイン名取得
    -> OpenAI chatCompletion で振り返り生成
    -> journal_entries.ai_reflection を更新
    <- { reflection: string }
```

### リクエスト

```json
{
  "journalEntryId": "uuid"
}
```

### レスポンス

```json
{
  "reflection": "小さな幸せに気づけるの、素敵だね..."
}
```

### AIプロンプト仕様

| 項目 | 値 |
|------|-----|
| temperature | 0.8 |
| maxTokens | 300 |
| 出力長 | 100-150文字程度 |
| トーン | 共感的で温かい |
| コンテキスト | ユーザーの性格サマリー（`personality_results.summary`） |

### エラーハンドリング

| エラー | ステータス | レスポンス |
|--------|----------|-----------|
| 未認証 | 401 | `{ error: "unauthorized" }` |
| Pro未課金 | 403 | `{ error: "pro_required" }` |
| entryId未指定 | 400 | `{ error: "journal_entry_id_required" }` |
| エントリ未発見 | 404 | `{ error: "entry_not_found" }` |
| 内部エラー | 500 | `{ error: "internal_error" }` |

---

## 5. データ仕様

### journal_entries テーブル

| カラム | 型 | NULL | 説明 |
|--------|-----|------|------|
| id | uuid | NO | PK |
| user_id | uuid | NO | FK -> auth.users |
| content | text | NO | ユーザーの振り返り回答 |
| mood | text | YES | 気分（nullable。後からTwin Infoで記録可能） |
| ai_reflection | text | YES | AIの振り返りコメント（100-150文字） |
| tags | text[] | YES | タグ配列 |
| created_at | timestamptz | NO | 作成日時 |
| updated_at | timestamptz | NO | 更新日時 |

**RLS**: `user_id = auth.uid()` で本人のみアクセス可能

### 型定義 -- `src/shared/types/journal.ts`

```typescript
export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

export type JournalEntry = {
  id: string;
  userId: string;
  content: string;
  aiReflection: string | null;
  mood: Mood | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type JournalEntryInput = {
  content: string;
  mood?: Mood;
  tags?: string[];
};
```

### 実装上の差分

現在の `journal.tsx` 実装では、気分選択が旧6段階（happy/neutral/sad/angry/tired）のまま。型定義は新5段階（great/good/neutral/bad/terrible）に更新済み。画面側の `MOOD_OPTIONS` を型定義に合わせて更新が必要。

---

## 6. 気分トラッキング連携

日記作成時の気分は `mood_records` テーブルにも反映される（upsert）。

```
日記保存 -> journal_entries INSERT
         -> mood_records UPSERT (当日の気分記録)
         -> journal-reflect Edge Function 呼出
```

**注**: `mood_records` テーブルが気分データのSingle Source of Truth。`journal_entries.mood` は参考値。

---

## 7. 制約・制限

| 項目 | 値 |
|------|-----|
| アクセス制限 | Pro専用（Entitlement `pro`） |
| 振り返り回答文字数 | 最大3,000文字 |
| AI振り返りコメント長 | 100-150文字 |
| 振り返りプロンプト頻度 | 1日1回まで（6時間以上経過時） |
| 履歴表示件数 | 初回50件、スクロールで50件ずつ追加ロード |
| AI振り返り生成時間 | 3-5秒以内 |
| ジャーナル保存時間 | 送信後1秒以内 |
| 1日の作成上限 | なし（何件でも作成可能） |

---

## 8. 検証条件

### 正常系
- [ ] Proユーザーが日記を作成できること
- [ ] Freeユーザーにペイウォールが表示されること
- [ ] AI振り返りコメントが生成されること（100-150文字）
- [ ] 振り返りメッセージに📝バッジが表示されること
- [ ] 過去の振り返り履歴がスクロールで見返せること
- [ ] 気分記録が `mood_records` に反映されること
- [ ] チャット統合ビューで振り返りと通常チャットが視覚的に区別されること

### 異常系
- [ ] Edge Function タイムアウト時にリトライボタンが表示されること
- [ ] ネットワークエラー時に入力内容が保持されること
- [ ] Edge Function エラー時にジャーナルエントリーは保存済みであること

### 境界値
- [ ] 振り返り回答3,000文字で保存できること
- [ ] 振り返り回答3,001文字は入力できないこと
- [ ] 1日1回制限: 同日2回目の振り返りプロンプトは表示されないこと

### 権限
- [ ] Freeユーザー: 振り返りプロンプトが表示されないこと
- [ ] トライアルユーザー: 振り返り機能を利用可能であること
- [ ] グレースピリオド中: 振り返り機能を利用可能であること
- [ ] Pro->Freeダウングレード後: 過去の履歴は閲覧可能であること
