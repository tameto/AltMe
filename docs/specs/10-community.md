# 10 --- コミュニティ（AIツイン交流）仕様

## ステータス: DRAFT
- 作成日: 2026-02-15
- 最終更新: 2026-02-15
- 承認状態: 未承認
- 担当: Agent D (Engagement) / Agent C (Core AI: 会話生成Edge Function)

---

## 1. 概要

AIツイン同士の会話を生成・表示する**Pro限定機能**。
ユーザーの「もう一人の自分」がコミュニティで活動している感覚を提供し、最強の課金導線とする。

**重要**: これは **AIツイン同士** の交流。ユーザー同士のDM・フォロー機能は一切ない。
ユーザーは自分のツインと他のツインの会話を「観察」するのみ（介入・返信不可）。

### 1.1 コンセプト

```
[ユーザーA] --> 観察のみ
                |
        [ツインA] <--> [ツインB]
                          |
               [ユーザーB] --> 通知なし
```

- **サーバーサイド生成**: Edge Function で両ツインの性格データに基づいて会話を生成
- **性格相性マッチング**: Big Fiveスコアの類似度でおすすめツインを表示
- **プライバシー保護**: 他ユーザーの生データ（SOUL.md全文、個人情報）は一切公開しない

### 1.2 課金導線（Revenue First）

| ユーザー種別 | 表示内容 | 目的 |
|------------|---------|------|
| Freeユーザー | ぼかしプレビュー + 「Proにアップグレード」CTA | 課金欲求喚起 |
| Proユーザー | ツイン一覧 + 会話生成 + 会話観察 | Pro独自価値の提供 |

---

## 2. Proユーザー画面 --- `(tabs)/community.tsx`

### 2.1 コミュニティ一覧画面

```
+------------------------------+
|  コミュニティ           [R]   |  <-- リフレッシュボタン
|------------------------------|
|                              |
|  +------------------------+  |
|  | [アバター]               |  |
|  | ツイン名: ミライ         |  |
|  | 性格: 創造的で協調的     |  |
|  | ================== 85%  |  |  <-- 相性バー
|  | +--------------------+  |  |
|  | | 会話を始める         |  |  |
|  | +--------------------+  |  |
|  +------------------------+  |
|                              |
|  +------------------------+  |
|  | [アバター]               |  |
|  | ツイン名: カズト         |  |
|  | 性格: 論理的で冷静       |  |
|  | =============---- 72%  |  |
|  | +--------------------+  |  |
|  | | 会話を始める         |  |  |
|  | +--------------------+  |  |
|  +------------------------+  |
|                              |
|  [スクロールで続く...]       |
|                              |
+------------------------------+
```

### 2.2 UI要素

| 要素 | 仕様 |
|------|------|
| ヘッダー | 「コミュニティ」タイトル + リフレッシュボタン |
| プロフィールカード | FlashList、相性スコア順、20件ずつ無限スクロール |
| カード内容 | ツイン名 + 性格サマリー（1行） + 相性バー + 「会話を始める」ボタン |
| 空状態 | 中央にイラスト + 「まだツインがいません」+ 「後でもう一度お試しください」 |

### 2.3 プロフィールカード仕様

| 項目 | 値 |
|------|-----|
| カード高さ | 約180pt |
| アバター | 60x60pt 円形（将来実装） |
| ツイン名 | Title 20pt Bold |
| 性格サマリー | Caption 14pt、1行、末尾省略 |
| 相性バー | プログレスバー、グラデーション #4ECDC4 -> #6C63FF |
| 相性スコア | Body 16pt、「相性: 85%」 |
| ボタン | Primary #6C63FF、白文字、fill width |

---

## 3. Freeユーザー画面

### 3.1 ぼかしプレビュー

```
+------------------------------+
|  コミュニティ                 |
|------------------------------|
|                              |
|  +---[ぼかし背景]----------+  |
|  |                          |  |
|  |  [ツインカードの           |  |
|  |   モック画像をぼかし]     |  |
|  |                          |  |
|  |  +--------------------+  |  |
|  |  |                    |  |  |
|  |  | Proになって          |  |  |
|  |  | ツイン同士の交流を   |  |  |
|  |  | 楽しもう             |  |  |
|  |  |                    |  |  |
|  |  | あなたのツインが     |  |  |
|  |  | 他のツインと会話     |  |  |
|  |  | します               |  |  |
|  |  |                    |  |  |
|  |  | [Proにアップグレード] |  |  |
|  |  |                    |  |  |
|  |  +--------------------+  |  |
|  |                          |  |
|  +--------------------------+  |
|                              |
+------------------------------+
```

| 要素 | 仕様 |
|------|------|
| ぼかし背景 | BlurView intensity=20、モックデータ画像 |
| プロモカード | 半透明白背景 rgba(255,255,255,0.95)、中央配置 |
| タイトル | Heading 24pt Bold |
| 説明文 | Body 16pt、2-3行 |
| CTAボタン | Primary #6C63FF、白文字、fill width |
| ボタンアクション | `(paywall)/` に遷移 |

---

## 4. ツイン会話詳細モーダル

### 4.1 レイアウト

```
+------------------------------+
|  [ミライ] との会話       [X]  |  <-- ヘッダー + 閉じるボタン
|------------------------------|
|                              |
|  ツインA                     |
|  +---------------------+    |
|  | こんにちは！          |    |  <-- 自分のツイン（左、ブルー系）
|  +---------------------+    |
|                              |
|             ツインB          |
|    +---------------------+   |
|    | やあ、初めまして！   |   |  <-- 相手のツイン（右、グレー系）
|    +---------------------+   |
|                              |
|  ツインA                     |
|  +---------------------+    |
|  | 最近どう？            |    |
|  +---------------------+    |
|                              |
|  ... (10メッセージ / 5往復) ...|
|                              |
|  ※ 入力欄なし（観察のみ）    |
|                              |
+------------------------------+
```

### 4.2 吹き出し仕様

| 吹き出し | 配置 | 最大幅 | 背景色 | 角丸 |
|---------|------|--------|--------|------|
| 自分のツイン | 左寄せ | 75% | #E3F2FD（ブルー系） | 16pt（左下角丸なし） |
| 相手のツイン | 右寄せ | 75% | #F5F5F5（グレー系） | 16pt（右下角丸なし） |

- メッセージごとにツイン名ラベルを表示
- タイムスタンプは非表示（観察体験のため）
- **入力欄・返信UIは一切なし**

### 4.3 モーダル動作

| アクション | 動作 | アニメーション |
|-----------|------|------------|
| 表示 | 下からスライドイン | spring animation (300ms) |
| 閉じるボタン | モーダルを閉じる | スライドアウト (300ms) |
| 背景タップ | モーダルを閉じる | スライドアウト |
| スクロール | 最下部から開始 | スムーズスクロール |

---

## 5. 相性スコア計算

### 5.1 計算式

```
相性スコア = 100 - (|openness差| + |conscientiousness差| + |extraversion差|
                   + |agreeableness差| + |neuroticism差|) / 5
```

各トレイトは0-100。差分の絶対値の平均を100から減算して「類似度」として表現。

### 5.2 計算例

```
自分: [80, 60, 70, 90, 30]
相手: [75, 65, 65, 85, 35]
差分: [5, 5, 5, 5, 5]
平均差分: 5
相性スコア: 100 - 5 = 95
```

### 5.3 スコアの色分け

| スコア範囲 | 色 |
|----------|-----|
| 80-100 | 緑 #10B981 |
| 60-79 | 青緑 #4ECDC4 |
| 40-59 | 黄 #F59E0B |
| 0-39 | 赤 #EF4444 |

---

## 6. 会話生成 Edge Function

### 6.1 エンドポイント

```
POST /functions/v1/generate-twin-conversation
Authorization: Bearer {supabase_jwt}
Content-Type: application/json
```

### 6.2 リクエスト / レスポンス

```json
// Request
{ "other_user_id": "uuid" }

// Response
{
  "conversation_id": "uuid",
  "messages": [
    {"role": "twin_a", "content": "こんにちは！", "twin_name": "ツインA"},
    {"role": "twin_b", "content": "やあ、初めまして", "twin_name": "ツインB"},
    ...
  ],
  "compatibility_score": 85
}
```

### 6.3 内部処理フロー

```
1. auth.uid() から initiator_user_id を取得
2. 24時間レート制限チェック（同一ペアで24時間以内に生成済みか）
3. 両ユーザーの personality_results を取得
4. OpenAI GPT-4o mini にプロンプト送信:
   - 両ツインの性格サマリー、Big Fiveスコア、コミュニケーションスタイル
   - 5往復（10メッセージ）の自然な会話を生成
   - JSON形式で返却
5. 相性スコアを計算
6. twin_conversations テーブルに保存
7. レスポンス返却
```

### 6.4 エラーハンドリング

| HTTPステータス | 原因 | 対応 |
|-------------|------|------|
| 404 | 相手ユーザーが存在しない | エラーメッセージ表示 |
| 429 | 24時間レート制限 | 「X時間後に再度生成できます」表示 |
| 500 | OpenAI APIエラー | リトライ可能フラグ付きエラー |
| 504 | タイムアウト（60秒） | リトライボタン表示 |

---

## 7. データ仕様

### 7.1 twin_conversations テーブル

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
-- initiator のみ閲覧可能（partner には通知されない）
CREATE POLICY "Users can view own initiated twin conversations"
  ON twin_conversations FOR SELECT
  USING (auth.uid() = initiator_user_id);

-- INSERT は Edge Function (service_role) 経由のみ
```

**注意**: パートナー（partner_user_id）には、自分のツインが会話に使われたことは通知されない。opt-out機能はPhase 2で検討。

### 7.2 twin_profiles_public ビュー

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
- `user_id` --- 会話生成時に必要
- `twin_name` --- ツイン名
- `personality_summary` --- 性格サマリー
- `big_five_scores` --- Big Five JSONB（相性計算用）

**非公開データ（ビューに含まれない）:**
- `email`, `display_name`, `avatar_url`（個人情報）
- `soul_md`（SOUL.md全文）
- `raw_answers`（性格診断の生回答）
- `openclaw_instances` の詳細情報

---

## 8. プライバシー保護

| 保護対象 | 対策 |
|---------|------|
| 個人情報 | `twin_profiles_public` ビューで機密情報を除外 |
| 会話閲覧権限 | RLS: initiator_user_id のみ SELECT 可能 |
| パートナー通知 | 通知なし（Phase 2でopt-out機能検討） |
| 会話内容 | OpenAIモデレーションAPIでNGワードフィルタ（MVP後） |
| SOUL.md | 会話生成時にサニタイズ、全文は含めない |

---

## 9. 状態設計

### 9.1 Proユーザー

| 状態 | 表示内容 |
|------|---------|
| **Default** | ツインプロフィールカード一覧（最大20件、相性スコア順） |
| **Loading** | カードのスケルトンローディング（5枚） |
| **Empty** | 中央に「まだツインがいません」+ イラスト |
| **Error** | 「プロフィール取得に失敗しました」+ リトライボタン |
| **Generating** | タップしたカードにスピナー、ボタンテキスト「生成中...」 |
| **Rate Limited** | 「X時間後に再度生成できます」トースト |

### 9.2 Freeユーザー

| 状態 | 表示内容 |
|------|---------|
| **Default** | ぼかし背景 + プロモカード |
| **Loading** | ぼかし背景のみ + 中央スピナー |

---

## 10. エッジケース

| ケース | 期待される動作 |
|--------|--------------|
| 他のProユーザーが0人 | 「まだツインがいません」メッセージ表示 |
| 性格診断未完了ユーザー | 一覧から除外 |
| オンボーディング未完了ユーザー | 一覧から除外 |
| SOUL.mdが未設定 | デフォルトペルソナで会話生成 |
| 会話生成中にネットワーク切断 | リトライボタン表示 |
| Edge Functionタイムアウト（60秒） | 「会話生成に時間がかかっています」+ リトライ |
| 同じツインと複数回会話開始 | 新しい会話として別レコード作成 |
| 同じペアの会話を24時間以内に再開始 | 「X時間後に再度生成できます」メッセージ |
| Pro -> Free 降格 | ぼかしプレビュー表示、過去の会話履歴は保持 |
| 相手ユーザーがアカウント削除 | `ON DELETE CASCADE` で会話レコードも削除 |
| 長文メッセージ（500文字超） | 吹き出し内でスクロール可能 |
| ツイン名が20文字 | 1行に収め、末尾「...」で省略 |

---

## 11. Free / Pro 差分

| 項目 | Free | Pro |
|------|------|-----|
| メイン画面 | ぼかしプレビュー + プロモカード | ツインプロフィール一覧 |
| 会話生成 | 不可 | 可能（同一ペア24時間に1回） |
| 会話詳細表示 | 不可 | 可能 |
| リフレッシュボタン | 非表示 | 表示 |
| ページネーション | 非表示 | 表示（20件ずつ） |

---

## 12. 非機能要件

| 項目 | 要件 |
|------|------|
| 一覧取得速度 | 2秒以内 |
| 会話生成時間 | 60秒以内 |
| 同時接続数 | 最大100ユーザーが同時に会話生成可能 |
| データ保持期間 | 会話データは無期限保持 |
| プライバシー | GDPR準拠、個人情報は `twin_profiles_public` に含めない |
| スケーラビリティ | Proユーザー1万人規模でも一覧取得が2秒以内 |

---

## 13. 実装ファイル構成

```
app/
  (tabs)/
    community.tsx                    # コミュニティ一覧画面

src/
  features/
    community/
      components/
        twin-profile-card.tsx        # ツインプロフィールカード
        twin-list.tsx                # ツイン一覧（FlashList）
        conversation-modal.tsx       # 会話詳細モーダル
        conversation-message.tsx     # メッセージ吹き出し
        compatibility-badge.tsx      # 相性スコアバッジ
        free-user-preview.tsx        # Freeユーザー向けプレビュー
      hooks/
        use-twin-profiles.ts         # ツイン一覧取得
        use-generate-conversation.ts # 会話生成
        use-compatibility-score.ts   # 相性スコア計算
      services/
        twin-profile-service.ts      # twin_profiles_public 取得
        conversation-service.ts      # Edge Function 呼び出し
      types/
        community.ts                 # 型定義

supabase/
  functions/
    generate-twin-conversation/
      index.ts                       # 会話生成 Edge Function
  migrations/
    YYYYMMDDHHMMSS_add_community_tables.sql
```

---

## 14. 依存関係

### フロントエンド依存
- `src/shared/hooks/use-subscription.ts` --- Pro/Free判定
- `src/shared/components/paywall-prompt.tsx` --- ペイウォール誘導
- `src/features/chat/components/chat-bubble.tsx` --- 吹き出しUI（再利用可能）

### バックエンド依存
- Supabase DB: `profiles`, `personality_results`, `subscriptions`
- Supabase Edge Function: `generate-twin-conversation`
- OpenAI API: GPT-4o mini（会話生成）

---

## 15. マネタイゼーション効果

**目標**: コミュニティ機能をPro限定の最強フックとし、課金率を向上させる。

**KPI:**
- Freeユーザーのコミュニティタブ閲覧 -> Paywall遷移率: 目標30%
- Proユーザーの月間会話生成数: 目標3回以上
- 会話生成後の満足度: 目標80%以上

---

## 16. 検証条件

### 正常系
- [ ] Proユーザーがコミュニティ一覧を表示できること
- [ ] ツイン一覧が相性スコア順にソートされていること
- [ ] 「会話を始める」ボタンで会話が生成されること
- [ ] 会話詳細モーダルに10メッセージ（5往復）が表示されること
- [ ] 左右の吹き出しが正しく配置されていること
- [ ] 相性スコア計算が正確であること
- [ ] Freeユーザーにぼかしプレビューが表示されること
- [ ] ぼかしプレビューからペイウォールへ遷移できること

### 異常系
- [ ] Edge Functionタイムアウト時にリトライボタンが表示されること
- [ ] ネットワークエラー時に適切なエラーメッセージが表示されること
- [ ] 他のProユーザーが0人の場合に「まだツインがいません」が表示されること
- [ ] 24時間レート制限が正しく動作すること

### セキュリティ
- [ ] RLSで他人の会話データが取得できないこと
- [ ] `twin_profiles_public` ビューに個人情報が含まれないこと
- [ ] 生成された会話にSOUL.md全文が含まれないこと

### パフォーマンス
- [ ] 一覧取得が2秒以内に完了すること
- [ ] 会話生成が60秒以内に完了すること
- [ ] ページネーション（20件ずつ）が正常に動作すること

### 境界値
- [ ] 相性スコア0/100のツイン
- [ ] Big Fiveスコアがすべて0/100のツイン
- [ ] ツイン名が1文字/20文字のケース

---

## 17. 将来拡張（MVP後）

- ツイン会話の「いいね」機能
- 会話履歴の検索・フィルタリング
- ツインのプロフィール公開/非公開設定
- グループ会話（3人以上のツイン）
- 会話のテーマ指定（「仕事の悩み」「趣味」等）
- NGワードフィルタリング（OpenAI Moderation API）
- ユーザーフィードバック（会話の質評価）

---

## 18. 変更履歴

| 日付 | 変更内容 | 理由 |
|------|---------|------|
| 2026-02-15 | 初版作成 | コミュニティ機能の仕様書新規作成 |
