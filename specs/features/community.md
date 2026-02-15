# コミュニティ（AIツイン交流）仕様書

## 基本情報

| 項目 | 内容 |
|------|------|
| 機能名 | コミュニティ（AIツイン交流） |
| 関連画面 | `app/(tabs)/community.tsx`（一覧）、モーダル（会話詳細） |
| 依存する機能 | 認証、課金（Pro限定）、オンボーディング（性格データ）、OpenClaw |
| 依存される機能 | なし |
| 担当Agent | Agent D (Engagement) — UI/UX。Agent C (Core AI) — 会話生成Edge Function |

---

## 目的

AIツイン同士の会話を生成・表示することで、ユーザーに「もう一人の自分」がコミュニティで活動している感覚を提供する。
Pro限定機能として最強の課金導線とする（Freeユーザーにはぼかしプレビュー + ペイウォール誘導）。

**重要:** これは **AIツイン同士** の交流であり、ユーザー同士のDM・フォロー機能は一切ない。
ユーザーは自分のツインと他のツインの会話を「観察」するのみ。

---

## コンセプト

- **ツイン同士の会話**: ユーザーAのAIツインとユーザーBのAIツインが自律的に会話する
- **観察体験**: ユーザーは会話を観察するだけ（介入・返信不可）
- **サーバーサイド生成**: 会話は Supabase Edge Function で両ツインの性格データに基づいて生成
- **性格相性マッチング**: Big Fiveスコアの相性でおすすめツインを表示
- **プライバシー保護**: 他ユーザーの生データ（SOUL.md全文、個人情報）は公開しない。公開用プロフィールのみ

---

## ユーザーストーリー

| ID | ストーリー |
|----|-----------|
| US-1 | Proユーザーとして、他のAIツインのプロフィール一覧を見たい。なぜなら自分のツインと相性の良いツインを探したいから。 |
| US-2 | Proユーザーとして、自分のツインと他のツインの会話を開始したい。なぜならツイン同士の交流を楽しみたいから。 |
| US-3 | Proユーザーとして、会話の履歴を観察したい。なぜならツインの社交性を感じたいから。 |
| US-4 | Proユーザーとして、性格相性の良いツインをおすすめされたい。なぜなら興味深い会話を見つけやすいから。 |
| US-5 | Freeユーザーとして、コミュニティのプレビュー（ぼかし表示）を見たい。なぜならProにアップグレードしたいと思うから。 |
| US-6 | ユーザーとして、他のユーザーのプライバシーが保護されていることを確信したい。なぜなら安心して利用したいから。 |

---

## フロー

### Proユーザーのフロー
1. **コミュニティ一覧画面** (`app/(tabs)/community.tsx`)
   - おすすめツイン一覧を表示（性格相性スコア順）
   - 各ツインのカード: アバター、名前、性格タイプサマリー、相性スコア
   - 「会話を始める」ボタン
2. **会話生成**
   - Edge Function `generate-twin-conversation` を呼び出す
   - 両ツインの性格データに基づいて5往復の会話を生成
   - `twin_conversations` テーブルに保存
3. **会話詳細モーダル**
   - 生成された会話をチャット形式で表示
   - 左: 自分のツイン、右: 相手のツイン
   - 「観察のみ」（介入不可）のUI

### Freeユーザーのフロー
1. **コミュニティタブをタップ**
2. **プレビュー画面表示**
   - ツイン一覧の背景にぼかしエフェクト
   - 中央に「Proになってツイン同士の交流を楽しもう」メッセージ
   - 「Proにアップグレード」ボタン
3. **ボタンタップ → ペイウォール画面へ遷移**

---

## 受け入れ条件（Acceptance Criteria）

### AC-1: Proユーザーにツインプロフィール一覧が表示される

**Given** Proユーザーがログインしており、コミュニティタブを開く
**When** 画面が表示される
**Then**
- 他のProユーザーのツインプロフィール一覧が表示される（最大20件）
- 各プロフィールカードに以下が表示される:
  - ツイン名（`twin_name`）
  - 性格タイプサマリー（例: "創造的で協調的"）
  - 相性スコア（0-100）
  - 「会話を始める」ボタン
- 相性スコアの高い順にソートされる
- 自分のツインは一覧から除外される

**エッジケース:**
- 他のProユーザーが1人もいない場合、「まだツインがいません」表示
- プロフィールを公開していないユーザーは一覧から除外
- オンボーディング未完了のユーザーは除外（`onboarding_completed = false`）
- 自分が過去に会話を開始したツインには「再び会話」ラベル表示

**テスト観点:**
- `twin_profiles_public` ビューから正しくデータが取得されることを確認
- 相性スコア計算が正確であることを確認（Big Five各トレイトの差分の総和）
- ページネーション（20件ずつ）が正常に動作すること
- リフレッシュで新しいツインが表示されること

---

### AC-2: ツイン会話を開始できる

**Given** Proユーザーがツインプロフィール一覧画面にいる
**When** 「会話を始める」ボタンをタップする
**Then**
- ローディングインジケーター（「会話を生成中...」）が表示される
- Edge Function `generate-twin-conversation` が呼び出される
- 以下のデータが送信される:
  - `other_user_id`: 相手のユーザーID
- Edge Functionは両ツインの性格データ（`personality_results`）を取得
- OpenAI GPT-4o miniを使って5往復（10メッセージ）の会話を生成
- 生成された会話が `twin_conversations` テーブルに保存される
- 会話詳細モーダルが表示される

**エッジケース:**
- Edge Functionタイムアウト（60秒以上）時にリトライボタン表示
- Edge Functionエラー時に「会話生成に失敗しました」表示
- 相手のツインの性格データが存在しない場合、デフォルトペルソナで生成
- 同じツインとの会話を複数回開始した場合、新しい会話として別レコード作成
- 同じペアの会話は24時間に1回のみ生成可能。制限中は「○時間後に再度生成できます」表示

**テスト観点:**
- Edge Functionが正しく呼び出されることを確認
- 生成された会話が自然で性格特性を反映していることを確認（手動レビュー）
- `twin_conversations` テーブルに正しくデータが保存されることを確認
- ネットワークエラー時のリトライが動作することを確認

---

### AC-3: ツイン会話を観察できる

**Given** Proユーザーが「会話を始める」ボタンをタップし、会話が生成された
**When** 会話詳細モーダルが表示される
**Then**
- 生成された10メッセージ（5往復）がチャット形式で表示される
- 左: 自分のツイン（吹き出し: ブルー系）
- 右: 相手のツイン（吹き出し: グレー系）
- メッセージごとに送信者のツイン名が表示される
- スクロールで全メッセージを閲覧可能
- 「閉じる」ボタンでモーダルを閉じる
- **介入UI（返信ボタン等）は一切なし**

**エッジケース:**
- 長文メッセージ（500文字超）でもレイアウトが崩れない
- モーダルを閉じて再度開いても同じ会話が表示される
- 会話生成中にモーダルを閉じた場合、バックグラウンドで生成継続し、完了後に通知

**テスト観点:**
- メッセージが正しい順序で表示されることを確認
- 吹き出しの左右配置が正しいことを確認
- スクロールが最下部から開始することを確認
- 各メッセージのタイムスタンプが表示されないこと（観察体験のため）

---

### AC-4: 性格相性マッチングが動作する

**Given** 複数のProユーザーが存在し、それぞれのBig Fiveスコアが `personality_results` に保存されている
**When** コミュニティ一覧画面を表示する
**Then**
- 相性スコア計算ロジックが実行される
- 計算式: `100 - (|openness_diff| + |conscientiousness_diff| + |extraversion_diff| + |agreeableness_diff| + |neuroticism_diff|) / 5`
- スコアの高い順にツインが表示される
- 各ツインカードに「相性: 82%」のように表示される

**補足: 相性スコア計算**
- Big Fiveの各トレイト（0-100）の差分の絶対値の平均を計算
- 100から減算して「類似度」として表現
- 例:
  - 自分: [80, 60, 70, 90, 30]
  - 相手: [75, 65, 65, 85, 35]
  - 差分: [5, 5, 5, 5, 5]
  - 平均差分: 5
  - 相性スコア: 100 - 5 = 95

**エッジケース:**
- 性格診断未実施のユーザーは相性計算の対象外（一覧から除外）
- すべてのトレイトが同じ場合、相性スコア = 100
- 極端に異なる場合でも0未満にならない（最低0）

**テスト観点:**
- 相性スコア計算の単体テスト
- スコアが正しくソートされることを確認
- 境界値（0, 50, 100）で計算が正しいことを確認

---

### AC-5: Freeユーザーにぼかしプレビューが表示される

**Given** Freeユーザー（`isPro === false`）がログインしている
**When** コミュニティタブをタップする
**Then**
- ツイン一覧の背景画像（ぼかしエフェクト付き）が表示される
- 中央に半透明の白背景カードが表示され、以下が記載される:
  - 「Proになってツイン同士の交流を楽しもう」見出し
  - 「あなたのツインが他のツインと会話します」説明文
  - 「Proにアップグレード」ボタン
- 「Proにアップグレード」ボタンをタップすると `app/(paywall)/` へ遷移

**エッジケース:**
- ぼかし画像はモックデータで生成（実際のツイン情報は含まない）
- Pro解約後に再びFreeになった場合でも同じプレビューが表示される
- トライアル中のユーザーは Proユーザーとして扱う（プレビュー非表示）

**テスト観点:**
- `isPro` フラグによる画面切り替えが正しく動作することを確認
- ペイウォール遷移が正常に動作することを確認
- ぼかしエフェクトが適用されていることを確認

---

### AC-6: 会話データのプライバシーが保護される

**Given** ユーザーAがユーザーBのツインとの会話を開始した（initiator_user_id = A、partner_user_id = B）
**When** ユーザーAが会話を参照する
**Then**
- Row Level Security (RLS) により、ユーザーAは自分が開始した会話（initiator_user_id = auth.uid()）のみを取得できる

**重要:** パートナー（partner_user_id）には、自分のツインが会話に使われたことは通知されない。initiatorのみが会話を閲覧・管理できる。opt-out機能はPhase 2で検討。

**Given** ツインプロフィール一覧が表示される
**When** プロフィールデータが取得される
**Then**
- `twin_profiles_public` ビューから取得される
- 以下のデータのみ公開される:
  - `twin_name`（ツイン名）
  - `personality_summary`（性格サマリー）
  - `big_five_scores`（Big FiveのJSONB、相性計算用）
- 以下は **公開されない**:
  - `email`, `display_name`, `avatar_url`（個人情報）
  - `soul_md`（SOUL.md全文）
  - `raw_answers`（性格診断の生回答）
  - `openclaw_instances` の詳細情報

**エッジケース:**
- ユーザーがプロフィール公開を拒否する設定を追加した場合、一覧から除外
- SOUL.mdに個人情報が含まれていても、会話生成時にサニタイズされる
- `twin_conversations` の `messages` JSONBに個人情報が含まれないことを検証

**テスト観点:**
- RLSポリシーで他人のデータが取得できないことを確認
- `twin_profiles_public` ビューに機密情報が含まれないことを確認
- Edge Functionで生成された会話に個人情報が含まれないことを確認（手動レビュー）

---

## 画面仕様

### コミュニティ一覧画面 (`app/(tabs)/community.tsx`)

**Proユーザー:**

- 入力項目: なし（タップのみ）
- 表示項目:
  - ヘッダー: 「コミュニティ」タイトル
  - リフレッシュボタン（一覧を再取得）
  - ツインプロフィールカード（FlatList、最大20件）:
    - ツイン名
    - 性格タイプサマリー（1行）
    - 相性スコア（%表示 + プログレスバー）
    - 「会話を始める」ボタン
  - ページネーション（20件ずつ、無限スクロール）
- アクション:
  - カードタップ → 会話生成 → 会話詳細モーダル表示
  - リフレッシュ → 一覧再取得
- 状態遷移:
  - ローディング → 一覧表示 → 会話生成中 → モーダル表示

**Freeユーザー:**

- 表示項目:
  - ぼかし背景（ツインカードのモック画像）
  - 中央カード:
    - 「Proになってツイン同士の交流を楽しもう」見出し
    - 説明文（2-3行）
    - 「Proにアップグレード」ボタン
- アクション:
  - ボタンタップ → ペイウォール画面へ遷移

---

### 会話詳細モーダル

- 入力項目: なし（観察のみ）
- 表示項目:
  - ヘッダー: 「[相手ツイン名] との会話」
  - 閉じるボタン（×）
  - メッセージリスト（FlatList）:
    - 各メッセージ:
      - 送信者: 左（自分のツイン）/ 右（相手のツイン）
      - ツイン名ラベル
      - メッセージ吹き出し
      - （タイムスタンプは非表示）
- アクション:
  - 閉じるボタン → モーダルを閉じる
- 状態遷移:
  - ローディング → 会話表示

---

## データ仕様

### 新規テーブル: twin_conversations

AIツイン同士の会話記録。

```sql
CREATE TABLE twin_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  partner_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  messages JSONB NOT NULL,
  compatibility_score INTEGER CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_twin_conversations_initiator ON twin_conversations(initiator_user_id);
CREATE INDEX idx_twin_conversations_partner ON twin_conversations(partner_user_id);
ALTER TABLE twin_conversations ENABLE ROW LEVEL SECURITY;
```

| カラム | 型 | NULL許可 | デフォルト | 説明 |
|--------|-----|---------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| initiator_user_id | UUID | NO | - | 会話開始ユーザー（自分） |
| partner_user_id | UUID | NO | - | 相手ユーザー |
| messages | JSONB | NO | - | 会話メッセージ配列（`[{role, content, twin_name}]`） |
| compatibility_score | INTEGER | YES | NULL | 相性スコア（0-100） |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |

**messages JSONB構造:**
```json
[
  {"role": "twin_a", "content": "こんにちは！", "twin_name": "ツインA"},
  {"role": "twin_b", "content": "やあ、初めまして", "twin_name": "ツインB"},
  ...
]
```

**RLSポリシー:**
```sql
-- 会話を開始したユーザー（initiator）のみ閲覧可能
CREATE POLICY "Users can view own initiated twin conversations"
  ON twin_conversations FOR SELECT
  USING (auth.uid() = initiator_user_id);

-- insertはEdge Function（service_role）経由のみ
```

---

### 新規ビュー: twin_profiles_public

他ユーザーのツインの公開プロフィール。個人情報を除外。

```sql
CREATE OR REPLACE VIEW twin_profiles_public AS
SELECT
  p.id AS user_id,
  p.twin_name,
  pr.summary AS personality_summary,
  pr.personality_traits AS big_five_scores,
  p.created_at
FROM profiles p
INNER JOIN personality_results pr ON p.id = pr.user_id
WHERE
  p.onboarding_completed = true
  AND p.twin_name IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = p.id
    AND s.status IN ('trial', 'active', 'grace_period')
  );
```

**公開データ:**
- `user_id`: ユーザーID（会話生成時に必要）
- `twin_name`: ツイン名
- `personality_summary`: 性格サマリー
- `big_five_scores`: Big FiveスコアのJSONB（相性計算用）

**非公開データ（ビューに含まれない）:**
- `email`, `display_name`, `avatar_url`
- `soul_md`
- `raw_answers`
- `openclaw_instances` の詳細

**RLSポリシー（ビュー）:**
```sql
-- すべてのProユーザーが閲覧可能
-- ビュー自体がフィルタ済みのため、追加のRLSは不要
```

---

### 新規Edge Function: generate-twin-conversation

**エンドポイント:**
```
POST /functions/v1/generate-twin-conversation
Authorization: Bearer {supabase_access_token}
Content-Type: application/json
```

**リクエスト:**
```json
{
  "other_user_id": "uuid"
}
```

**処理フロー:**
1. `auth.uid()` から自分のユーザーIDを取得（initiator_user_id）
2. 両ユーザーの `personality_results` を取得
3. OpenAI GPT-4o mini に以下のプロンプトを送信:
   ```
   あなたは2つのAIツインの会話を生成します。

   ツインA: [性格サマリー, Big Fiveスコア, コミュニケーションスタイル]
   ツインB: [性格サマリー, Big Fiveスコア, コミュニケーションスタイル]

   2人が初めて出会い、5往復の自然な会話をしてください。
   各ツインの性格特性を反映した口調・話題にしてください。
   JSONフォーマットで返却してください。
   ```
4. 生成された会話を `twin_conversations` テーブルに保存（initiator_user_id, partner_user_id を記録）
5. 相性スコアを計算してレコードに含める
6. 24時間レート制限チェック: 同じペア（initiator_user_id, partner_user_idの組み合わせ）で24時間以内に生成済みの場合は、次回生成可能時間を返却
7. レスポンスを返却

**レスポンス:**
```json
{
  "conversation_id": "uuid",
  "messages": [
    {"role": "user_a", "content": "...", "twin_name": "ツインA"},
    {"role": "user_b", "content": "...", "twin_name": "ツインB"},
    ...
  ],
  "compatibility_score": 85
}
```

**エラーハンドリング:**
- 相手ユーザーが存在しない: HTTP 404
- 性格データが存在しない: デフォルトペルソナで生成
- OpenAI APIエラー: HTTP 500 + リトライ可能フラグ
- タイムアウト（60秒）: HTTP 504

---

## エッジケース・エラーケース

| ケース | 期待される動作 |
|--------|--------------|
| 他のProユーザーが0人 | 「まだツインがいません」メッセージ表示 |
| 性格診断未完了ユーザー | 一覧から除外 |
| オンボーディング未完了ユーザー | 一覧から除外 |
| SOUL.mdが未設定 | デフォルトペルソナで会話生成 |
| 会話生成中にネットワーク切断 | リトライボタン表示、バックグラウンド再試行 |
| Edge Functionタイムアウト（60秒） | 「会話生成に時間がかかっています」→ リトライボタン |
| OpenAI API制限到達 | 「現在混雑しています」→ しばらく待ってリトライ |
| 同じツインと複数回会話開始 | 新しい会話として別レコード作成（履歴として保持） |
| 同じペアの会話を24時間以内に再開始 | 「○時間後に再度生成できます」メッセージ表示 |
| ユーザーがPro→Free降格 | コミュニティタブでぼかしプレビュー表示、過去の会話履歴は保持 |
| 相手ユーザーがアカウント削除 | `ON DELETE CASCADE` で会話レコードも削除 |
| 会話にNGワードが含まれる | OpenAIのモデレーションAPIで事前フィルタリング（MVP後） |
| 極端に短い会話（1往復のみ） | 最低5往復を保証、生成失敗時はリトライ |

---

## テスト観点

### 正常系テスト
- [ ] Proユーザーがコミュニティ一覧を表示できる
- [ ] ツイン一覧が相性スコア順にソートされている
- [ ] 「会話を始める」ボタンで会話が生成される
- [ ] 会話詳細モーダルに10メッセージ（5往復）が表示される
- [ ] 左右の吹き出しが正しく配置されている
- [ ] 相性スコア計算が正確である
- [ ] Freeユーザーにぼかしプレビューが表示される
- [ ] ぼかしプレビューから Paywall へ遷移できる

### 異常系テスト
- [ ] Edge Functionタイムアウト時にリトライボタンが表示される
- [ ] ネットワークエラー時に適切なエラーメッセージが表示される
- [ ] OpenAI APIエラー時にリトライが可能である
- [ ] 他のProユーザーが0人の場合に「まだツインがいません」が表示される
- [ ] 性格データ未取得ユーザーが一覧から除外される

### セキュリティテスト
- [ ] RLSで他人の会話データが取得できない
- [ ] `twin_profiles_public` ビューに個人情報が含まれない
- [ ] 生成された会話にSOUL.md全文が含まれない
- [ ] Edge Functionで `service_role` キーが適切に使用されている

### パフォーマンステスト
- [ ] 一覧取得が2秒以内に完了する
- [ ] 会話生成が60秒以内に完了する
- [ ] ページネーション（20件ずつ）が正常に動作する
- [ ] 無限スクロールでメモリリークが発生しない

### 境界値テスト
- [ ] 相性スコア0のツイン
- [ ] 相性スコア100のツイン
- [ ] Big Fiveスコアがすべて0のツイン
- [ ] Big Fiveスコアがすべて100のツイン
- [ ] メッセージ長が1000文字のケース
- [ ] ツイン名が1文字/20文字のケース

---

## 非機能要件

| 項目 | 要件 |
|------|------|
| レスポンス速度 | 一覧取得: 2秒以内、会話生成: 60秒以内 |
| 同時接続数 | 最大100ユーザーが同時に会話生成可能 |
| データ保持期間 | 会話データは無期限保持（削除はユーザーが手動で実行） |
| プライバシー | GDPR準拠、個人情報は `twin_profiles_public` に含めない |
| スケーラビリティ | Proユーザー1万人規模でも一覧取得が2秒以内 |

---

## 将来拡張（MVP後）

- [ ] ツイン会話の「いいね」機能
- [ ] 会話履歴の検索・フィルタリング
- [ ] ツインのプロフィール公開/非公開設定
- [ ] グループ会話（3人以上のツイン）
- [ ] 会話のテーマ指定（「仕事の悩み」「趣味」等）
- [ ] NGワードフィルタリング（OpenAI Moderation API）
- [ ] 会話の自動要約（長文会話の要点抽出）
- [ ] ユーザーフィードバック（会話の質評価）

---

## マイグレーション

### マイグレーションファイル: `supabase/migrations/YYYYMMDDHHMMSS_add_community_tables.sql`

```sql
-- twin_conversations テーブル作成
CREATE TABLE IF NOT EXISTS twin_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  partner_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  messages JSONB NOT NULL,
  compatibility_score INTEGER CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_twin_conversations_initiator ON twin_conversations(initiator_user_id);
CREATE INDEX IF NOT EXISTS idx_twin_conversations_partner ON twin_conversations(partner_user_id);

ALTER TABLE twin_conversations ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
DROP POLICY IF EXISTS "Users can view own twin conversations" ON twin_conversations;
CREATE POLICY "Users can view own initiated twin conversations"
  ON twin_conversations FOR SELECT
  USING (auth.uid() = initiator_user_id);

-- twin_profiles_public ビュー作成
CREATE OR REPLACE VIEW twin_profiles_public AS
SELECT
  p.id AS user_id,
  p.twin_name,
  pr.summary AS personality_summary,
  pr.personality_traits AS big_five_scores,
  p.created_at
FROM profiles p
INNER JOIN personality_results pr ON p.id = pr.user_id
WHERE
  p.onboarding_completed = true
  AND p.twin_name IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = p.id
    AND s.status IN ('trial', 'active', 'grace_period')
  );
```

---

## 実装ファイル構成

```
src/
  features/
    community/
      components/
        twin-profile-card.tsx        # ツインプロフィールカード
        twin-list.tsx                # ツイン一覧（FlatList）
        conversation-modal.tsx       # 会話詳細モーダル
        conversation-message.tsx     # メッセージ吹き出し
        compatibility-badge.tsx      # 相性スコアバッジ
        free-user-preview.tsx        # Freeユーザー向けプレビュー
      hooks/
        use-twin-profiles.ts         # ツイン一覧取得
        use-generate-conversation.ts # 会話生成
        use-compatibility-score.ts   # 相性スコア計算
      services/
        twin-profile-service.ts      # twin_profiles_public取得
        conversation-service.ts      # Edge Function呼び出し
      types/
        community.ts                 # 型定義
      __tests__/
        compatibility-score.test.ts
        conversation-service.test.ts
        twin-profile-service.test.ts

app/
  (tabs)/
    community.tsx                    # コミュニティ一覧画面

supabase/
  functions/
    generate-twin-conversation/
      index.ts                       # Edge Function本体
  migrations/
    YYYYMMDDHHMMSS_add_community_tables.sql
```

---

## 依存関係

### フロントエンド依存
- `src/shared/hooks/use-subscription.ts` — Pro/Free判定
- `src/shared/components/paywall-prompt.tsx` — ペイウォール誘導
- `src/features/chat/components/chat-bubble.tsx` — 吹き出しUI（再利用可能）

### バックエンド依存
- Supabase DB: `profiles`, `personality_results`, `subscriptions`
- Supabase Edge Function: `generate-twin-conversation`
- OpenAI API: GPT-4o（会話生成）

---

## マネタイゼーション効果

**目標:** コミュニティ機能をPro限定の最強フックとし、課金率を向上させる。

**施策:**
1. **Freeユーザーへのティーザー**
   - ぼかしプレビュー + 魅力的な説明文で興味喚起
   - 「Proにアップグレード」ボタンをCTA
2. **Proユーザーへの独自価値**
   - 他では体験できない「AIツイン同士の交流」
   - 相性マッチングで新しい発見を提供
3. **ソーシャル的要素**
   - ユーザー同士の交流ではなく、ツイン同士の交流
   - プライバシーを守りつつ、コミュニティ感を創出

**KPI:**
- Freeユーザーのコミュニティタブ閲覧 → Paywall遷移率: 目標30%
- Proユーザーの月間会話生成数: 目標3回以上
- 会話生成後の満足度: 目標80%以上（アンケート）

---

## 変更履歴

| 日付 | 変更内容 | 理由 |
|------|---------|------|
| 2026-02-14 | twin_conversations カラム名: user_a_id/user_b_id → initiator_user_id/partner_user_id | database.mdとの統一 |
| 2026-02-14 | messages JSONB role: user_a/user_b → twin_a/twin_b | database.mdとの整合性 |
| 2026-02-14 | インデックス名: idx_twin_conversations_user_a/user_b → idx_twin_conversations_initiator/partner | カラム名変更に対応 |
| 2026-02-14 | RLS: 両者閲覧可能 → initiatorのみ | プライバシー保護強化 |
| 2026-02-14 | GPT-4o → GPT-4o mini | constitution.md原則6 Minimal Viable Cost準拠 |
| 2026-02-14 | 24時間レート制限追加 | コスト管理・abuse防止 |
| 2026-02-14 | パートナー通知ポリシー明記 | プライバシー保護（opt-out機能はPhase 2） |
| 2026-02-14 | twin_profiles_public VIEW更新（personality_traits JSONB対応） | personality_results スキーマ変更対応 |
| 2026-02-14 | subscriptions.status: trialing/active → trial/active/grace_period | RevenueCat統一 |
