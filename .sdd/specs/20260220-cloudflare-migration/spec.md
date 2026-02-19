# Cloudflare Containers Migration Spec

## Overview
OpenClaw インフラを DigitalOcean Droplets から Cloudflare Containers に移行する。
ユーザーあたり月額 $6 → $1〜3 (使用量課金) のコスト削減と、自動スケーリング・スリープ機能の獲得が目的。

## Architecture Change

```
Before: App → WebSocket → DO Droplet (常時稼働) → OpenClaw Docker
After:  App → WebSocket → CF Worker (ルーター) → CF Container (オンデマンド) → OpenClaw
```

## Functional Requirements

### FR-1: Cloudflare Worker + Container 構成
- Cloudflare Worker がユーザーID でリクエストをルーティング
- Container はオンデマンド起動（sleepAfter: 10分）
- OpenClaw Docker イメージを Container として実行
- WebSocket プロキシ（Worker → Container）
- SOUL.md は環境変数として Container に注入

### FR-2: SOUL.md 永続化（二層設計）
- 正本: Supabase `openclaw_instances.soul_md` (既存)
- キャッシュ: Cloudflare KV `soul:{userId}` (起動時読込用)
- 更新フロー: Supabase 更新 → KV 書込 → soul_version++

### FR-3: 状態モデル変更
- 現在: `status` 一軸 ('provisioning'|'running'|'stopped'|'error'|'destroying')
- 移行後: `desired_state` + `runtime_state` 二軸
  - desired_state: 'active' | 'suspended' | 'deleting'
  - runtime_state: 'cold' | 'waking' | 'healthy' | 'sleeping' | 'error'

### FR-4: Edge Functions 移行
| Function | Before (DO) | After (CF) |
|----------|------------|------------|
| provision-openclaw | DO API Droplet作成 | KV書込 + DB更新 (秒単位完了) |
| destroy-openclaw | Droplet削除 | desired_state='suspended' + KV削除 |
| health-check-openclaw | DO API + WS疎通 | CF Worker API で状態確認 |
| update-soul-md | DB更新 + restart | KV更新 + soul_version++ |
| restart-openclaw | DO API reboot | Container stop + start |

### FR-5: WebSocket クライアント移行
- 接続先: Droplet IP → CF Worker URL (`wss://{worker-domain}/ws/{userId}`)
- TLS: Cloudflare が自動提供（自己署名証明書不要）
- 認証: gateway_token を connect handshake で送信（既存互換）
- Worker が gateway_token を DB 検証後に Container へ転送

### FR-6: コールドスタート UX
- 'waking' 状態の UI 表示（「ツインを起こしています...」）
- チャット画面遷移時に先行ウェイクアップ
- 8秒超で「時間がかかっています」表示
- 最初のメッセージはローカルキューして接続後自動送信

## Non-Functional Requirements
- コールドスタート: 5秒以内（P95）
- WebSocket レイテンシ: Worker プロキシ追加分 < 50ms
- コスト: ユーザーあたり $3.5/月以下（1日4時間利用想定）
- 既存 WebSocket プロトコル互換（connect/message/agent 型を維持）

## DB Schema Changes

```sql
ALTER TABLE openclaw_instances
  ADD COLUMN infra_provider TEXT NOT NULL DEFAULT 'cloudflare',
  ADD COLUMN container_name TEXT,
  ADD COLUMN desired_state TEXT NOT NULL DEFAULT 'active'
    CHECK (desired_state IN ('active','suspended','deleting')),
  ADD COLUMN runtime_state TEXT NOT NULL DEFAULT 'cold'
    CHECK (runtime_state IN ('cold','waking','healthy','sleeping','error')),
  ADD COLUMN soul_version INT NOT NULL DEFAULT 1,
  ADD COLUMN cf_worker_url TEXT,
  ADD COLUMN last_wake_at TIMESTAMPTZ;
```

## Assumptions
- OpenClaw Docker イメージは linux/amd64 互換
- Cloudflare Workers Paid プラン ($5/月) を使用
- Container インスタンスタイプ: basic (1/4 vCPU, 1 GiB)
- 初期フェーズは gateway_token 認証を維持（チケット方式は将来検討）
- ビッグバン移行（既存ユーザーが少ないため段階的移行は不要）

## Success Criteria
- SC-1: Pro ユーザーが CF Container 経由で OpenClaw と WebSocket チャットできる
- SC-2: コンテナがアイドル10分後に自動スリープし、再アクセスで自動起動する
- SC-3: プロビジョニングが秒単位で完了する（DO の5分以上→数秒）
- SC-4: 既存の WebSocket メッセージプロトコルが完全互換
- SC-5: tsc 0エラー、既存テスト全パス
