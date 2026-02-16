# AgentTeam 構成パターン集

プロジェクトの規模・特性に応じた典型的なAgent分割パターン。
これらをベースに、プロジェクト固有の要件を加味してカスタマイズする。

## パターン1：機能分割型（3〜5 Agent）

各Agentが1つ以上の features/ ディレクトリを担当。最もシンプルで汎用的。

```
Agent A: 認証 + ユーザー管理  → features/auth/
Agent B: コア機能             → features/[core]/
Agent C: 課金                → features/subscription/
Agent D: UI シェル            → shared/components/, app/
```

**向いているケース：**
- features/ 間の依存が少ない
- 各機能が比較的独立している
- 中規模プロジェクト（5〜15画面）

**注意点：**
- shared/ の変更がボトルネックになりやすい
- Agent D（UIシェル）が他の全Agentのブロッカーになりがち

---

## パターン2：レイヤー分割型（3 Agent）

フロントエンド / バックエンド連携 / 横断機能で分割。

```
Agent A: 画面実装（全features/のUI部分）
Agent B: ロジック + API連携（services/, hooks）
Agent C: 課金 + アナリティクス（横断的な関心事）
```

**向いているケース：**
- UIとロジックが明確に分離できる
- 少人数で効率よく回したい
- バックエンド連携が複雑

**注意点：**
- Agent A と B の境界が曖昧になりがち
- コンフリクトが発生しやすい

---

## パターン3：フェーズ分割型（3〜4 Agent）

ユーザーフローのフェーズごとに分割。

```
Agent A: オンボーディング + 認証  → (auth)/, (onboarding)/
Agent B: メイン体験              → (tabs)/, features/[core]/
Agent C: 課金 + 設定             → (paywall)/, features/subscription/, features/settings/
Agent D: 基盤（任意）            → shared/, services/, config/
```

**向いているケース：**
- ユーザーフローが明確（オンボーディング→メイン→課金）
- 各フェーズが独立して動作テスト可能
- 課金アプリ（特にDay 0 Revenue重視の場合）

**注意点：**
- フェーズ間の遷移部分で調整が必要
- Agent D がいない場合、shared/ の管理が分散する

---

## パターン4：コア+サポート型（2〜3 Agent）

メインの価値を作るAgentと、それ以外に分ける最小構成。

```
Agent A: コア機能 + UI（アプリの主要価値）
Agent B: 課金 + 認証 + 基盤（コアを支えるインフラ）
```

**向いているケース：**
- 小規模プロジェクト（5画面以下）
- 素早くMVPを出したい
- Agent間調整のオーバーヘッドを最小化したい

**注意点：**
- 並列度が低い（最大2 Agent）
- Agent B の範囲が広くなりすぎる可能性

---

## パターン5：スペシャリスト型（4〜6 Agent）

各Agentが専門領域を持つ。大規模プロジェクト向け。

```
Agent A: 認証 + ユーザー管理
Agent B: コア機能1
Agent C: コア機能2
Agent D: 課金（RevenueCat専任）
Agent E: UIシェル + デザインシステム
Agent F: アナリティクス + イベントトラッキング
```

**向いているケース：**
- 大規模プロジェクト（15画面以上）
- コア機能が複数あり、それぞれ複雑
- 課金ロジックが複雑（複数プラン、A/Bテスト多数）

**注意点：**
- Agent間の依存関係管理が複雑
- shared interface の設計に時間がかかる
- オーバーヘッドが大きい

---

## 構成を選ぶ判断基準

| 基準 | 少Agent推奨（2-3） | 多Agent推奨（4-6） |
|------|-------------------|-------------------|
| 画面数 | 5以下 | 10以上 |
| コア機能の数 | 1-2 | 3以上 |
| features/間の依存 | 高い | 低い |
| 開発速度の優先度 | 高い（調整コスト削減） | 中程度 |
| 課金の複雑さ | シンプル | 複数プラン・実験多数 |

## 課金Agent独立の判断基準

以下のうち2つ以上該当する場合、課金を独立Agentにすることを推奨：
- RevenueCat Experiments を積極的に使う予定
- Offering が2つ以上ある
- ペイウォールUIを複数パターン用意する
- Webhook でサーバーサイド検証を行う
- 解約防止フローが複雑

1つ以下の場合、コア機能Agentに統合しても問題ない。

## shared interface の設計原則

Agent間の契約として、以下を Phase 0 で先に定義する：
- `shared/types/user.ts` — ユーザー型定義
- `shared/types/subscription.ts` — 課金状態の型定義
- `shared/types/navigation.ts` — ナビゲーションパラメータ
- `shared/hooks/useAuth.ts` — 認証hookのインターフェース
- `shared/hooks/useSubscription.ts` — 課金状態hookのインターフェース

これらの型定義は Phase 0 で合意し、以降は変更に全Agent の承認が必要。
