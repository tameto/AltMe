# Codex Consultation: DigitalOcean → Cloudflare Containers 移行

日時: 2026-02-20
モデル: gpt-5.3-codex
テーマ: OpenClaw インフラ移行アーキテクチャ設計

---

## Codex の推奨サマリー（全7問）

### Q1: SOUL.md 永続化 → KV（実行時）+ Supabase（正本）の二層設計

- **推奨**: KV をコンテナ起動時のキャッシュとして使い、Supabase `openclaw_instances.soul_md` を正本として維持する
- R2 は 500B には過剰、D1 は単体用途に運用コスト過多
- `soul_version` 付きキー (`soul:{userId}:v{n}`) で最終的一貫性の問題を回避

### Q2: WebSocket ルーティング → Worker プロキシは妥当

- Container はリクエストが Worker 経由前提（直接公開は不可）
- ストリーミング 10-30 秒は問題なし
- 追加レイテンシは数ms〜数十ms 級

### Q3: 認証フロー → A（Worker 検証）+ チケット方式

- B（素通し）は未認証接続で起動コストが発生するリスク
- C（Supabase JWT）は将来最適だが現時点では変更範囲が広い
- **チケット方式**: `/ws-ticket` を事前発行（TTL 30-60秒、使い切り）→ URL/ヘッダで検証
- Container 側の gateway_token 検証は残す（二重防御）

### Q4: プロビジョニング概念変更 → 理解は正しい

- 「VM作成」→「ルーティングID作成＋設定保存＋必要時起動」
- 廃止候補: `droplet_id`, `ip_address`, `droplet_size`
- status を二軸分離:
  - `desired_state`: `active | suspended | deleting`
  - `runtime_state`: `cold | waking | healthy | sleeping | stopping | error`

### Q5: コールドスタート → sleepAfter 10分（初期値）

- prefetch: Proユーザー＆最近チャット利用時のみ
- UX: `waking` 状態を明示、8秒超で「時間がかかっています」
- 最初の送信はローカルキューして接続後自動送信

### Q6: Edge Functions の役割変化

| Function | 変更内容 |
|---------|---------|
| provision | DO API削除 → KV書き込み + DB更新 |
| health-check | WS疎通 → Container onStart/onStop イベント駆動 |
| destroy | Droplet削除 → desired_state='suspended' |
| update-soul-md | SSH不要 → soul_version++ + KV書込 |
| restart | DO API → stop()/destroy() + startAndWaitForPorts() |

見落としやすい追加コンポーネント:
- Worker 管理 API (`/admin/start|stop|state`)
- WS 接続チケット発行 API
- ライフサイクルイベント集約（Queue or webhook）
- 再整合 Cron（イベント取りこぼし対策）

### Q7: 移行戦略 → 段階的カナリア

1. CF用カラム追加（既存カラム即削除しない）
2. SOUL.md dual-write（Supabase正本 + KV配布）
3. CF Worker/Container 実装（既存 WS プロトコル互換維持）
4. 認証チケット方式導入
5. 内部ユーザーで `provider='cf'` カナリア
6. 1週間計測
7. 新規ユーザーを全員CF
8. 既存ユーザーを順次移行
9. DO処理停止
10. 旧カラム削除・整理

### 総合評価: CF移行推奨

- DO継続: 立ち上げ速度は速いが固定費と運用負債が重い
- CF移行: 初期移行コストはあるが成長フェーズには合理的

---

## Claude の補足・検証メモ

### Q2 Worker コードの注意点
Codex が示した `env.OPENCLAW.getByName(userId).fetch(req)` は Durable Objects のパターン。
実際の Cloudflare Containers API (`@cloudflare/containers` パッケージ) では `Container` クラスを extends した DO から `fetch` を呼ぶ形になる。
基本構造（Worker → Container へ fetch 転送）は正しいが、実装時は公式 examples を参照すること。
参考: https://developers.cloudflare.com/containers/examples/websocket/

### Q3 チケット方式の実装インパクト
現在の `websocket-client.ts` は connect メッセージのペイロードで `gateway_token` を送信している。
チケット方式に変更する場合、クライアント側で事前に `/ws-ticket` エンドポイントを呼んでチケットを取得し、
WebSocket URL のクエリパラメータかヘッダに付与する必要がある。
`WebSocketClientOptions` の `gatewayToken` → `wsTicket` のリネームと、接続 URL の変更が必要。

### Q4 status 二軸分離について
現在の単一 `status` カラムを `desired_state` / `runtime_state` に分割する設計は良い。
ただし RLS ポリシーと `openclaw_instances_public` ビューも合わせて更新が必要。
TypeScript 型 `OpenClawStatus` も `OpenClawDesiredState` / `OpenClawRuntimeState` に分割が必要。

### Q5 sleepAfter 値の注意
Cloudflare Containers の `sleepAfter` の設定単位・デフォルト値は公式ドキュメントで要確認。
10分という値は Codex の推奨だが、CF側のプラットフォーム制限（最小値など）がある可能性がある。

### 合意点（高信頼度）
- KV がSOUL.md の適切なストレージ（Supabase が正本）
- Worker プロキシ設計は正道
- Worker での認証が推奨（未認証起動コスト回避）
- プロビジョニングは「KV書込 + DB更新」に簡素化される
- 段階的移行が推奨（カナリア付き）

### 相違点（追加検討推奨）
- チケット方式の実装コスト: Codex は強く推奨するが、初期フェーズでは B（gateway_token そのまま）でも許容できる可能性がある（ユーザー数が少ないうちは）
