# 認証情報管理パターン

> Source: digitalocean-labs/do-app-platform-skills — shared/credential-patterns.md

## 4段階の優先順位

認証情報はセキュリティの高い順に以下の4段階で管理する。

### 段階1: 環境変数 / Supabase Vault（最推奨）

暗号化されて保存され、環境ごとに分離される。AI アシスタントや開発者に値が見えない。

**ユースケース**: API トークン、DB パスワード、JWT シークレット

```bash
# Supabase Edge Function の環境変数に設定
supabase secrets set DO_API_TOKEN=dop_v1_xxx...
supabase secrets set OPENCLAW_API_KEY=sk-xxx...
```

```sql
-- Supabase Vault でシークレット管理（より安全）
SELECT vault.create_secret('do_api_token', 'dop_v1_xxx...');

-- Edge Function から取得
SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'do_api_token';
```

**AltMe での適用**:
- `DO_API_TOKEN`: Supabase Edge Function の環境変数に設定。Droplet プロビジョニングに使用
- `SUPABASE_SERVICE_ROLE_KEY`: Edge Function 内から DB 操作に使用

### 段階2: Bindable Variables（DO Managed Services 用）

DigitalOcean App Platform が自動的に値を注入。パスワードは人間の目に触れない。

**ユースケース**: Managed Database の接続情報

```yaml
# App Platform の app spec 例（参考）
databases:
  - name: db
    engine: PG
    production: true
    cluster_name: altme-db

services:
  - name: api
    envs:
      - key: DATABASE_URL
        scope: RUN_TIME
        value: ${db.DATABASE_URL}  # 自動解決される
```

**AltMe での適用**:
- AltMe は App Platform ではなく Droplet ベースのため、Bindable Variables は直接使わない
- 代わりに Supabase の接続情報は Edge Function の環境変数で管理

### 段階3: 一時的な認証情報（Ephemeral）

ランタイム時に生成し、即座に使用して破棄する。ログに残さない。

**ユースケース**: SSH キー、ワンタイムトークン、一時的なパスワード

```typescript
// Droplet プロビジョニング時の一時パスワード生成
import { randomBytes } from 'crypto';

const generateTempPassword = (): string => {
  return randomBytes(32).toString('base64url'); // 32+ 文字
};

// cloud-init で設定 → 初期セットアップ後に削除
const cloudInit = `
#cloud-config
runcmd:
  - echo "OPENCLAW_ADMIN_PASS=${generateTempPassword()}" > /tmp/init-creds
  - # 初期設定スクリプト実行
  - /opt/setup.sh
  - # 一時ファイル削除
  - shred -u /tmp/init-creds
`;
```

**AltMe での適用**:
- Droplet 作成時の初期セットアップ用一時認証情報
- OpenClaw インスタンスの初回設定パスワード

### 段階4: ユーザー管理（External）

外部サービスの認証情報をユーザーが自分で管理。

**ユースケース**: サードパーティ API キー

```typescript
// ユーザーが設定した OpenClaw API キーを Vault に保存
const storeUserApiKey = async (userId: string, apiKey: string) => {
  const { error } = await supabase
    .from('user_secrets')
    .upsert({
      user_id: userId,
      key_name: 'openclaw_api_key',
      encrypted_value: apiKey, // Supabase の行レベルセキュリティで保護
    });
};
```

**AltMe での適用**:
- ユーザーが将来的に連携する外部サービスの API キー（Gmail, Slack 等）

## AltMe プロジェクトでの認証情報マッピング

| 認証情報 | 段階 | 保存先 | 用途 |
|---------|------|--------|------|
| `DO_API_TOKEN` | 1 | Supabase Edge Function env | Droplet 作成・管理 |
| `SUPABASE_SERVICE_ROLE_KEY` | 1 | Supabase Edge Function env | DB 操作（サーバーサイド） |
| `SUPABASE_ANON_KEY` | 1 | アプリ埋め込み（公開可） | クライアント側 Supabase アクセス |
| `REVENUECAT_API_KEY` | 1 | アプリ埋め込み（公開可） | 課金 SDK 初期化 |
| `REVENUECAT_WEBHOOK_SECRET` | 1 | Supabase Edge Function env | Webhook 検証 |
| Droplet SSH キー | 3 | 一時使用 → 破棄 | 初期プロビジョニング |
| OpenClaw admin パスワード | 3 | 生成 → Docker secret → 非表示 | インスタンス管理 |
| ユーザー連携 API キー | 4 | Supabase Vault (per user) | 外部サービス連携 |

## セキュリティベストプラクティス

### 必須ルール

1. **コードにハードコード禁止**: 認証情報を直接ソースコードに書かない
2. **Git コミット禁止**: `.env` ファイルは `.gitignore` に含める
3. **ログ出力禁止**: 認証情報をログに出力しない（マスクする）
4. **最小権限**: 各トークンに必要最小限の権限のみ付与

### パスワード要件

```typescript
// 強力なパスワード生成（32文字以上）
import { randomBytes } from 'crypto';

const generateSecurePassword = (length: number = 32): string => {
  return randomBytes(length).toString('base64url');
};
```

### 環境分離

```
開発環境: .env.local（ローカルのみ、Git管理外）
ステージング: Supabase staging プロジェクトの env
本番環境: Supabase production プロジェクトの env
```

### 認証情報のローテーション

```bash
# DO API トークンのローテーション
# 1. 新しいトークンを DigitalOcean Console で生成
# 2. Supabase Edge Function の環境変数を更新
supabase secrets set DO_API_TOKEN=dop_v1_new_token...
# 3. Edge Function を再デプロイ
supabase functions deploy provision-droplet
# 4. 古いトークンを DigitalOcean Console で無効化
```

### デバッグ時の安全な確認方法

```bash
# 値を表示せずに認証情報の存在を確認
echo "DO_API_TOKEN is ${DO_API_TOKEN:+set}" # "set" or 空文字
echo "DO_API_TOKEN length: ${#DO_API_TOKEN}"

# 最初の4文字のみ表示（本番では避ける）
echo "DO_API_TOKEN: ${DO_API_TOKEN:0:4}..."
```
