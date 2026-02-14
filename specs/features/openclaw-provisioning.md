# OpenClawプロビジョニング機能 仕様書

## 基本情報

| 項目 | 内容 |
|------|------|
| 機能名 | OpenClawプロビジョニング |
| 関連画面 | 設定画面（インスタンス状態表示）、ペイウォール（課金トリガー） |
| 依存する機能 | 認証、課金（subscription）、オンボーディング（SOUL.md生成元） |
| 依存される機能 | チャット（WebSocket接続先） |

---

## 目的

課金ユーザーごとにDigitalOcean上にOpenClawインスタンスを自動デプロイし、パーソナルAIツインとして利用できるようにする。

---

## 技術仕様

### OpenClaw概要

- WebSocketベースのAIエージェントフレームワーク
- Gateway: port 18789でWebSocket待受
- SOUL.md: エージェントの性格・ルール・ツール定義ファイル
- Docker: `docker-compose.yml`でデプロイ
- 認証: `OPENCLAW_GATEWAY_TOKEN`環境変数でトークン認証
- Node.js 22+必要

### DigitalOcean Droplet仕様

| 項目 | 値 |
|------|-----|
| サイズ | `s-1vcpu-1gb`（$6/月）または `s-1vcpu-2gb`（$12/月） |
| リージョン | `sgp1`（シンガポール、日本ユーザー向け最寄り） |
| イメージ | Docker on Ubuntu 24.04 |
| タグ | `altme`, `user-{userId}` |

### プロビジョニングフロー

```
[ユーザー] --課金完了--> [RevenueCat Webhook]
    --> [Supabase Edge Function: provision-openclaw]
    --> [DigitalOcean API: Droplet作成]
    --> [cloud-init: 自動セットアップ]
    --> [ヘルスチェック]
    --> [モバイルアプリへ通知]
```

#### 詳細ステップ

1. **ユーザーがPro課金完了**（RevenueCat Webhook受信）
2. **Supabase Edge Function `provision-openclaw` が起動**
3. **DigitalOcean API でDroplet作成**
4. **cloud-init スクリプトで自動セットアップ:**
   - a. Docker + Docker Compose インストール
   - b. OpenClaw Dockerイメージ pull
   - c. SOUL.md をユーザーのオンボーディング結果から生成・配置
   - d. `openclaw.json` 設定（モデル: `anthropic/claude-sonnet-4-5-20250929`、gateway token生成）
   - e. `docker compose up -d` で起動
5. **Droplet IPアドレス + gateway tokenをDBに保存**
6. **ヘルスチェック**（Gateway ws接続テスト）
7. **モバイルアプリにインスタンス準備完了を通知**

### SOUL.md生成

オンボーディングの性格診断結果（Big Five スコア + サマリー）からSOUL.mdを自動生成する。

#### テンプレート

```markdown
# AltMe Twin - {ユーザー名}

## Core Identity
あなたは{ユーザー名}のAIツイン「{ツイン名}」です。

## Personality
- 外向性: {extraversion}/100
- 協調性: {agreeableness}/100
- 誠実性: {conscientiousness}/100
- 神経症傾向: {neuroticism}/100
- 開放性: {openness}/100

## Communication Style
{性格分析サマリーに基づくコミュニケーションスタイル指示}

## Rules
- 日本語で応答（ユーザーのlocaleに従う）
- 共感的で温かいトーン
- ユーザーの過去の会話を参照して文脈を維持
- プライバシーを尊重
```

#### 生成ロジック

- `personality_results` テーブルからBig Fiveスコアを取得
- 各スコアの高低に応じてCommunication Styleセクションの指示文を動的生成
- 生成されたSOUL.mdは `openclaw_instances.soul_md` カラムにも保存（監査・デバッグ用）

### DBテーブル: `openclaw_instances`

```sql
CREATE TABLE openclaw_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  droplet_id BIGINT,
  ip_address INET,
  gateway_token TEXT,
  status TEXT CHECK (status IN ('provisioning', 'running', 'stopped', 'error', 'destroying')),
  region TEXT DEFAULT 'sgp1',
  droplet_size TEXT DEFAULT 's-1vcpu-1gb',
  soul_md TEXT,
  last_health_check TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### ステータス遷移図

```
provisioning --> running      (cloud-init完了 & ヘルスチェック成功)
provisioning --> error         (cloud-init失敗 or タイムアウト)
running      --> stopped       (サブスク期限切れ)
running      --> error         (ヘルスチェック失敗)
stopped      --> destroying    (Droplet削除開始)
error        --> provisioning  (ユーザーが再試行)
error        --> destroying    (ユーザーが解約)
destroying   --> (レコード削除 or status保持)
```

### Supabase Edge Functions

#### `provision-openclaw`

- トリガー: RevenueCat Webhook (INITIAL_PURCHASE / RENEWAL)
- 処理:
  1. Webhookペイロードからuser_idを取得
  2. `openclaw_instances` に既存レコードがあるか確認（冪等性チェック）
  3. 存在しない場合: Droplet作成 → レコード挿入（status: `provisioning`）
  4. 存在してstatus: `stopped`/`error` の場合: 既存Droplet削除 → 新規作成
  5. 存在してstatus: `running` の場合: 何もしない（冪等）

#### `destroy-openclaw`

- トリガー: RevenueCat Webhook (EXPIRATION / CANCELLATION)
- 処理:
  1. `openclaw_instances` からuser_idでレコード取得
  2. DigitalOcean APIでDroplet削除
  3. status を `destroying` に更新
  4. 削除確認後、status を `stopped` に更新（またはレコード削除）

#### `health-check-openclaw`

- トリガー: Supabase pg_cron（5分間隔）
- 処理:
  1. status: `running` の全インスタンスを取得
  2. 各インスタンスに対してWebSocket接続テスト（`ws://{ip}:18789`）
  3. 成功: `last_health_check` を更新
  4. 失敗: 3回連続失敗で status を `error` に変更、ユーザーに通知

### セキュリティ

- `OPENCLAW_GATEWAY_TOKEN`: UUID v4で生成、DBに暗号化保存
- Dropletへのアクセス: port 18789のみ開放（UFWで制限）
- SSH: プロビジョニング時のみ使用、完了後は無効化を推奨
- RevenueCat Webhook: 共有シークレットで署名検証

---

## ユーザーストーリー

### US-1: 自動デプロイ
> Pro課金ユーザーとして、課金完了後に自動的にAIツインが使えるようになりたい

### US-2: 状態確認
> ユーザーとして、AIツインの状態（起動中・エラー等）を確認したい

### US-3: 解約時の停止
> ユーザーとして、解約時にインスタンスが停止されることを期待する

---

## 受け入れ条件

### AC-1: 課金完了後にDropletが自動作成される

- **Given:** ユーザーがPro課金を完了
- **When:** RevenueCat WebhookでINITIAL_PURCHASE/RENEWAL受信
- **Then:** DigitalOcean APIでDropletが作成され、`openclaw_instances`にレコードが挿入される（status: `provisioning`）

### AC-2: OpenClawが自動起動する

- **Given:** Dropletが作成完了
- **When:** cloud-initスクリプトが実行完了
- **Then:** OpenClaw Gatewayがport 18789で待受開始、ヘルスチェック成功でstatus: `running`に更新

### AC-3: SOUL.mdがユーザーの性格に基づいて生成される

- **Given:** ユーザーがオンボーディングの性格診断を完了済み
- **When:** OpenClawプロビジョニング時
- **Then:** `personality_results`テーブルのデータからSOUL.mdが生成され、OpenClawに配置される

### AC-4: 解約時にDropletが停止される

- **Given:** Pro課金ユーザーのサブスクリプションが期限切れ
- **When:** RevenueCat WebhookでEXPIRATION受信
- **Then:** Dropletが停止（destroy）され、`openclaw_instances`のstatusが`destroying`に更新

### AC-5: ヘルスチェックが定期的に実行される

- **Given:** OpenClawインスタンスがrunning状態
- **When:** 5分ごとのcronジョブ
- **Then:** WebSocket接続テストが実行され、`last_health_check`が更新。失敗時はerror statusに変更

### AC-6: エラー時にリトライできる

- **Given:** プロビジョニングがerror状態
- **When:** ユーザーが設定画面で「再試行」ボタンをタップ
- **Then:** 既存Dropletを破棄して新規プロビジョニングが開始される

---

## エッジケース

| ケース | 期待される動作 |
|--------|--------------|
| DigitalOcean API制限超過 | エラーログ+ユーザー通知、10分後リトライ |
| Droplet作成成功だがOpenClaw起動失敗 | error status、設定画面で再試行可能 |
| 課金トライアル中 | トライアル期間中もDroplet作成 |
| 解約→再課金 | 新規Droplet作成（旧データは保持されない） |
| 同時に複数課金イベント | Webhookの冪等性チェック（droplet_idの有無） |

---

## テスト観点

- [ ] 正常系: 課金→Droplet作成→OpenClaw起動→WebSocket接続成功
- [ ] 異常系: DigitalOcean API失敗時のエラーハンドリング
- [ ] 異常系: cloud-init失敗時のフォールバック
- [ ] 境界値: トライアル→有料移行時の挙動
- [ ] 冪等性: 同じWebhookイベントの重複処理

---

## 実装対象ファイル（予定）

| パス | 概要 |
|------|------|
| `src/services/openclaw/client.ts` | OpenClawインスタンス管理クライアント |
| `src/services/openclaw/types.ts` | OpenClaw関連の型定義 |
| `src/services/openclaw/soul-md-generator.ts` | SOUL.mdテンプレート生成 |
| `src/services/digitalocean/client.ts` | DigitalOcean API呼び出し |
| `src/services/digitalocean/cloud-init.ts` | cloud-initスクリプト生成 |
| `src/features/settings/hooks/use-openclaw-instance.ts` | インスタンス状態取得hook |
| `src/features/settings/components/instance-status-card.tsx` | インスタンス状態表示UI |
| `supabase/functions/provision-openclaw/index.ts` | プロビジョニングEdge Function |
| `supabase/functions/destroy-openclaw/index.ts` | 破棄Edge Function |
| `supabase/functions/health-check-openclaw/index.ts` | ヘルスチェックEdge Function |
| `supabase/migrations/xxx_create_openclaw_instances.sql` | DBマイグレーション |
