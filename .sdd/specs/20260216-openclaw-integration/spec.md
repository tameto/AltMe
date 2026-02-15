# Feature Specification: OpenClaw Integration

**Feature Branch**: `20260216-openclaw-integration`
**Created**: 2026-02-16
**Status**: Draft
**Input**: User description: "OpenClaw統合: 課金後のOpenClawインスタンス自動プロビジョニング、WebSocketベースのProチャット、インスタンス管理UI。CLAUDE.mdのタスク#40-#52に定義済み。"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 課金後にAIツインが自動デプロイされる (Priority: P1)

Proプランを購入したユーザーとして、課金完了後に自動的に専用AIツインサーバーが起動し、パーソナライズされたAIとWebSocketで会話できるようになりたい。なぜなら、手動セットアップなしでAIツインを使い始めたいから。

**Why this priority**: これがOpenClaw統合の核心機能。課金→プロビジョニング→チャットの一連のフローが動かなければ、Pro機能の価値が実現しない。MRR獲得の直接ドライバー。

**Independent Test**: RevenueCat Webhook (INITIAL_PURCHASE) を送信し、DigitalOcean Dropletが作成され、OpenClaw Gatewayがport 18789で起動し、WebSocket接続テストが成功することを確認。

**Acceptance Scenarios**:

1. **Given** ユーザーがオンボーディング完了済みでFreeプランである, **When** Paywall画面でProプランを購入しRevenueCat INITIAL_PURCHASE Webhookが発火する, **Then** `openclaw_instances`にstatus='provisioning'でレコードが作成され、DigitalOcean Dropletが自動作成される
2. **Given** Dropletが作成されcloud-initが実行完了した, **When** ヘルスチェックでWebSocket接続テストが成功する, **Then** `openclaw_instances.status`が'running'に更新され、ユーザーのアプリにプッシュ通知が送信される
3. **Given** プロビジョニング中にDigitalOcean APIがエラーを返した, **When** Edge Functionがエラーをキャッチする, **Then** `openclaw_instances.status`が'error'に更新され、`error_message`にエラー内容が記録される
4. **Given** 同一ユーザーに対してWebhookが重複送信された, **When** 2回目の`provision-openclaw`が実行される, **Then** `webhook_events`テーブルの冪等性チェックによりスキップされ、Dropletは1つだけ存在する

---

### User Story 2 - ProユーザーがWebSocketでAIツインとリアルタイム会話する (Priority: P1)

Proプランユーザーとして、専用OpenClawインスタンスとWebSocketで接続し、低遅延・ストリーミングでAIツインと会話したい。なぜなら、Edge Function経由のFreeチャットより高品質な対話体験を得たいから。

**Why this priority**: US-1でデプロイされたインスタンスの価値を直接ユーザーに届ける機能。Proの差別化要因。

**Independent Test**: running状態のOpenClawインスタンスに対してWebSocket接続を確立し、メッセージ送受信（ストリーミング）が正常に動作することを確認。

**Acceptance Scenarios**:

1. **Given** Proユーザーのインスタンスがrunning状態, **When** チャット画面を開く, **Then** WebSocket接続が確立され（`wss://{ip}:18789`）、接続ステータスが「Connected」と表示される
2. **Given** WebSocket接続が確立済み, **When** ユーザーがメッセージを送信する, **Then** OpenClaw GatewayにJSONメッセージが送信され、ストリーミングレスポンス（type: 'chunk'）がリアルタイムで表示される
3. **Given** WebSocket接続が確立済み, **When** ネットワークが一時的に切断される, **Then** 指数バックオフ（1s→2s→4s→8s→16s、最大30s）で自動再接続が試行され、接続ステータスが「Reconnecting...」と表示される
4. **Given** Freeユーザーがチャット画面を開いた, **When** メッセージを送信する, **Then** 従来通りSupabase Edge Function（SSE）経由でレスポンスが返される（WebSocket接続は試行しない）

---

### User Story 3 - SOUL.mdがユーザーの性格に基づいて自動生成される (Priority: P1)

Proプランユーザーとして、オンボーディングで入力した性格診断結果・ツイン名・口調設定に基づいてSOUL.mdが自動生成され、AIツインが自分の性格を反映した応答をしてほしい。なぜなら、パーソナライズされたAIツインこそがAltMeの核心価値だから。

**Why this priority**: SOUL.mdなしではOpenClawインスタンスがデフォルト応答しかできず、差別化できない。

**Independent Test**: オンボーディング完了済みユーザーのプロビジョニング時にSOUL.mdが生成され、OpenClaw Gatewayの応答がSOUL.mdの性格設定を反映していることを確認。

**Acceptance Scenarios**:

1. **Given** ユーザーがオンボーディングで性格診断を完了済み（Big Fiveスコア + サマリー + 口調設定）, **When** プロビジョニングが実行される, **Then** `personality_results`テーブルのデータからSOUL.mdが生成され、Dropletのcloud-initスクリプトに含まれる
2. **Given** SOUL.mdが正常に生成された, **When** OpenClawが起動しユーザーが会話を始める, **Then** AIツインの応答がSOUL.mdに定義された性格・口調を反映する
3. **Given** Proユーザーが設定画面でツイン名・口調・MBTIを変更した, **When** 変更を保存する, **Then** Edge Function `update-soul-md`が呼ばれ、SOUL.mdが再生成・反映され、次のメッセージから新しい設定が適用される

---

### User Story 4 - 解約時にインスタンスが自動停止される (Priority: P2)

解約したユーザーとして、サブスク期間終了後にOpenClawインスタンスが自動停止され、Freeプランに戻りたい。なぜなら、課金していない期間のコストを発生させたくないから。

**Why this priority**: コスト管理と正しいライフサイクル管理はビジネス持続性に直結。ただしUS-1/2/3が先に動く必要がある。

**Independent Test**: RevenueCat EXPIRATION Webhookを送信し、Dropletが削除され、ユーザーのチャットがFreeモード（Edge Function）に切り替わることを確認。

**Acceptance Scenarios**:

1. **Given** Proユーザーのサブスクが期限切れになった, **When** RevenueCat EXPIRATION Webhookが受信される, **Then** `destroy-openclaw` Edge Functionが呼ばれ、Dropletが削除され、`openclaw_instances.status`が'destroying'→'stopped'に更新される
2. **Given** インスタンスが停止された, **When** ユーザーがチャット画面を開く, **Then** WebSocket接続は試行されず、Edge Function（SSE）経由のFreeチャットモードで動作する
3. **Given** 解約→再課金したユーザー, **When** 再度Proプランを購入する, **Then** 新規Dropletが作成され、過去の`soul_md`カラムからSOUL.mdが復元される

---

### User Story 5 - 設定画面でインスタンス状態を確認・管理できる (Priority: P2)

Proユーザーとして、設定画面でAIツインサーバーの状態（起動中・稼働中・エラー等）を確認し、エラー時に再起動したい。なぜなら、AIツインが使えない状態の原因を理解し、自分で解決したいから。

**Why this priority**: ユーザーが自己解決できるUIがないと、エラー時にサポート負荷が増大する。

**Independent Test**: 設定画面でインスタンスステータスがリアルタイム更新され、error状態で再起動ボタンが機能することを確認。

**Acceptance Scenarios**:

1. **Given** Proユーザーが設定画面を開いた, **When** インスタンスがrunning状態, **Then** 緑色バッジ「稼働中」が表示される
2. **Given** Proユーザーが設定画面を開いた, **When** インスタンスがprovisioning状態, **Then** 黄色バッジ「セットアップ中...」+スピナーが表示される
3. **Given** インスタンスがerror状態, **When** 「再起動」ボタンをタップし確認ダイアログで承認する, **Then** `restart-openclaw` Edge Functionが呼ばれ、statusが'provisioning'に変わり再プロビジョニングが開始される
4. **Given** Freeユーザーが設定画面を開いた, **When** インスタンスセクションの表示を確認する, **Then** インスタンス管理セクションは表示されない

---

### User Story 6 - ヘルスチェックが定期的に実行される (Priority: P3)

運営者として、全running状態のOpenClawインスタンスが定期的にヘルスチェックされ、障害を自動検知したい。なぜなら、ユーザーが気づく前に問題を把握したいから。

**Why this priority**: ヘルスチェックは運用品質を高めるが、手動確認でも一時的にカバー可能。

**Independent Test**: pg_cron（5分間隔）でhealth-check-openclaw Edge Functionが実行され、running状態のインスタンスにWebSocket接続テストが行われることを確認。

**Acceptance Scenarios**:

1. **Given** running状態のインスタンスが3つ存在する, **When** ヘルスチェックcronジョブが実行される, **Then** 3つ全てにWebSocket接続テストが実行され、成功したインスタンスの`last_health_check`が更新される
2. **Given** あるインスタンスのヘルスチェックが3回連続失敗した, **When** 4回目のチェック実行前に判定する, **Then** そのインスタンスのstatusが'error'に変更され、ユーザーにプッシュ通知が送信される

---

### Edge Cases

- **DigitalOcean APIレート制限超過**: エラーログ記録 + `error_message`にAPI制限の旨を保存 + 10分後にリトライキューに入れる
- **Droplet作成成功だがcloud-init失敗**: 15分タイムアウトでstatus='error'に変更、ユーザーが設定画面から再試行可能
- **課金トライアル中**: トライアル期間中もDropletを作成し、フルPro体験を提供
- **解約→再課金**: 新規Droplet作成、旧`soul_md`カラムからSOUL.mdを復元
- **同時に複数課金イベント受信**: `webhook_events`テーブルのevent_idでの冪等性チェックと`SELECT ... FOR UPDATE`による排他制御
- **WebSocket接続中にインスタンスが停止**: クライアント側でclose eventを検知し、「AIツインが利用できなくなりました」メッセージ表示
- **プロビジョニング中にアプリを閉じて再開**: statusポーリングにより最新状態を取得して表示
- **gateway_tokenの漏洩防止**: RLSでクライアントから直接参照不可、Edge Functionまたは専用エンドポイント経由でのみ取得
- **短時間の再起動連打（5分以内に3回）**: クールダウン表示で制限

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: システムは、RevenueCat Webhook (INITIAL_PURCHASE/RENEWAL) 受信時にDigitalOcean Dropletを自動作成しなければならない
- **FR-002**: システムは、cloud-initスクリプトでDocker + OpenClaw Gateway + SOUL.mdを自動セットアップしなければならない
- **FR-003**: システムは、SOUL.mdをユーザーの性格診断結果（Big Five）・ツイン名・口調設定から自動生成しなければならない
- **FR-004**: システムは、ProユーザーにWebSocket接続（`wss://{ip}:18789`）を提供し、ストリーミングチャットを実現しなければならない
- **FR-005**: システムは、FreeユーザーにはEdge Function (SSE) 経由のチャットを提供し続けなければならない（Pro/Free自動切り替え）
- **FR-006**: システムは、RevenueCat Webhook (EXPIRATION/CANCELLATION) 受信時にDropletを自動削除しなければならない
- **FR-007**: システムは、running状態のインスタンスに対して5分間隔でWebSocketヘルスチェックを実行しなければならない
- **FR-008**: システムは、3回連続ヘルスチェック失敗でstatus='error'に変更し、ユーザーにプッシュ通知を送信しなければならない
- **FR-009**: Proユーザーは設定画面でインスタンスの状態（provisioning/running/stopped/error）を確認できなければならない
- **FR-010**: Proユーザーはerror状態のインスタンスを設定画面から再起動できなければならない
- **FR-011**: システムは、WebSocket切断時に指数バックオフ（1s→2s→4s→8s→16s、最大30s）で自動再接続を試行しなければならない
- **FR-012**: システムは、Webhook処理の冪等性を保証しなければならない（同一イベントの重複処理をスキップ）
- **FR-013**: システムは、gateway_tokenをクライアントに直接露出させず、Edge Function経由でのみ提供しなければならない
- **FR-014**: Proユーザーが設定画面でツイン名・口調・MBTIを変更した場合、SOUL.mdを再生成し稼働中のインスタンスに反映しなければならない

### Key Entities

- **OpenClawインスタンス (openclaw_instances)**: ユーザーごとに最大1つのDigitalOcean Droplet。状態（provisioning/running/stopped/error/destroying）、IPアドレス、gateway_token、SOUL.mdを保持
- **Webhook Event (webhook_events)**: RevenueCat Webhookの冪等性チェック用。event_id (UNIQUE) で重複検出
- **SOUL.md**: AIツインの性格・ルール定義ファイル。personality_results + profiles (twin_name/speech_tone/mbti_type) から生成
- **WebSocket接続**: クライアント↔OpenClaw Gateway間のリアルタイム双方向通信。認証はgateway_tokenで行う

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 課金完了からOpenClaw Gateway起動（status='running'）まで5分以内に完了する
- **SC-002**: WebSocketチャットのメッセージ送信から最初のストリーミングチャンクを受信するまで2秒以内
- **SC-003**: WebSocket切断後の自動再接続が30秒以内に成功する（ネットワーク復帰後）
- **SC-004**: ヘルスチェックが5分間隔で全runningインスタンスに対して実行される
- **SC-005**: 同一Webhookイベントの重複処理が100%防止される（冪等性保証）
- **SC-006**: 解約→Droplet削除が10分以内に完了する
- **SC-007**: エラー時の再起動が設定画面のワンタップ操作で開始できる
- **SC-008**: Freeユーザーに対してOpenClawインスタンス関連のUI要素が一切表示されない

---

## Assumptions

- DigitalOcean APIの応答時間は通常5秒以内と仮定
- OpenClaw Dockerイメージのpull時間はシンガポールリージョンで2-3分と仮定
- WebSocket接続はTLS (wss://) を使用。初期MVP段階ではport 18789の直接接続を使用し、将来的にCloudflare等のプロキシを検討
- Dropletサイズは`s-1vcpu-1gb`（$6/月）固定。ユーザー数増加時にサイズアップを検討
- SOUL.mdテンプレートは4セクション構成（identity/personality/communication_style/behavioral_guidelines）
- gateway_tokenはUUID v4で生成

---

## Cross-Reference with Existing Specs

| 既存仕様書 | 関連箇所 | 依存関係 |
|-----------|---------|---------|
| specs/features/openclaw-provisioning.md | プロビジョニングフロー、SOUL.md生成、DBスキーマ | 本仕様の基盤。全US共通 |
| specs/features/subscription.md | 課金→プロビジョニング連携、Webhook処理 | US-1, US-4の課金トリガー |
| specs/features/chat.md | Free (SSE) / Pro (WebSocket) 二層チャット | US-2のチャット実装 |
| specs/features/settings.md | AC-4, AC-5: インスタンス状態確認・再起動 | US-5のUI実装 |
| specs/api/database.md | openclaw_instances (#9), webhook_events (#13) | 全USのデータ層 |
| specs/api/external-services.md | 19 Edge Functions、WebSocketプロトコル仕様 | 全USのバックエンド実装 |
| specs/shared/navigation.md | 設定画面のインスタンス管理セクション | US-5のUI配置 |
