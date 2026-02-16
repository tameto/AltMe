---
name: design-review
description: |
  デザインレビュー・品質保証ワークフロースキル。
  Pencil .pen ファイルの12+1専門視点レビュー → 修正 → 1画面1レビューノート配置を実行する。
  トリガー: デザインレビュー, UIレビュー, デザイン監査, レビューノート, 品質チェック, デザインQA
---

# Design Review Workflow スキル

> 12+1 専門視点レビュー → 修正 → **1画面1レビューノート** 配置

---

## 核心原則（絶対ルール）

### 原則1: 1画面1レビューノート

**レビューノートは画面ごとに1枚ずつ作成する。サマリーノート1枚にまとめてはいけない。**

```
正しい配置:
masterBoard (vertical)
├── "認証" ラベル
├── Notes: 認証 (horizontal)       ← ノート行
│   └── [A-1 ログイン ノート]       ← 1画面1ノートカード
├── 認証画面行 (horizontal)
│   └── Login (402x874)
├── "OB" ラベル
├── Notes: OB (horizontal)         ← ノート行
│   ├── [O-1 Welcome ノート]       ← 画面の数だけノートカード
│   ├── [O-2 Quiz ノート]
│   ├── [O-3 Result ノート]
│   └── [O-4 Meet Twin ノート]
├── OB画面行 (horizontal)
│   ├── Welcome (402x874)
│   ├── Quiz (402x874)
│   ├── Result (402x874)
│   └── Meet Twin (402x874)
...

間違い:
masterBoard (vertical)
├── 画面行...
├── [全画面サマリーノート1枚]  ← NG: まとめノートは禁止
```

**ノートカードの対応関係**: ノート行内のカード順序 = 画面行内の画面順序。
左から数えて N 番目のノートカード = N 番目の画面に対応。

### 原則2: Pencil MCP はメインプロセス専用

**Pencil MCP ツール（batch_get, batch_design, get_screenshot 等）はメインプロセスのみ使用可能。**
Task ツールで起動したサブエージェントからは Pencil MCP ツールにアクセスできない。

```
メインプロセス（Pencil MCP 使用可）:
  - Phase 0: デザイン構造取得、スクリーンショット取得
  - Phase 2: batch_design で修正適用
  - Phase 3: batch_design でレビューノート配置
  - Phase 4: get_screenshot で検証

サブエージェント（Read/Grep/Glob のみ）:
  - Phase 1: 仕様書の読み込み + 分析レポート作成
  - Phase 2.5: 仕様監査（仕様書ベースのチェック）
```

### 原則3: ノートはマスターボード内部に配置

キャンバスルートに浮遊させない。マスターボードの vertical layout + gap で自動マージン。

---

## 参照ファイル

| ファイル | 内容 | 使用タイミング |
|---------|------|-------------|
| [references/review-prompts.md](references/review-prompts.md) | サブエージェントのプロンプトテンプレート（仕様ベースレビュー） | Phase 1, 2.5 |
| [references/note-placement.md](references/note-placement.md) | ノート配置の Pencil MCP 操作手順 + 失敗パターン | Phase 3 |
| [references/common-fixes.md](references/common-fixes.md) | 頻出修正パターンと Pencil MCP コード例 | Phase 2 |
| [references/design-tokens.md](references/design-tokens.md) | カラー/フォント/間隔の許可値リスト | Phase 1 横断チェック |

---

## ワークフロー全体像

```
Phase 0: 準備（メインプロセス）──────────── 5-10分
  ├── Pencil MCP: デザイン構造取得 + 画面一覧確定
  ├── Pencil MCP: 全画面スクリーンショット取得
  ├── Read: 仕様書全件読み込み
  └── 画面IDマッピング表 + 画面ごとレビューシート作成

Phase 1: レビュー実行 ──────────────────── 15-25分
  ├── メインプロセス: 1画面ずつスクリーンショット確認 + 12視点チェック
  ├── サブエージェント（並列3チーム）: 仕様書ベースのレビュー
  └── 結果統合: 画面ごとに Critical/Warning/Missing/Question/Info 分類

Phase 2: 修正適用（メインプロセス）──────── 15-30分
  ├── Pencil MCP: Critical を batch_design で即修正
  ├── Pencil MCP: Warning（5分以内で修正可能）を修正
  └── Pencil MCP: get_screenshot で修正確認

Phase 2.5: 仕様監査（サブエージェント）──── 10-15分
  ├── 仕様書の AC/画面仕様/フロー vs デザイン照合
  └── 結果を Phase 2 の分類に統合

Phase 3: 1画面1レビューノート配置（メインプロセス）── 15-25分
  ├── Pencil MCP: セクションごとにノート行フレーム作成
  ├── Pencil MCP: Move でノート行を画面行の直前に配置
  ├── Pencil MCP: 画面ごとにノートカード挿入（1画面1カード）
  └── Pencil MCP: get_screenshot で配置検証

Phase 4: 検証 + サマリー ───────────────── 5-10分
  ├── 修正済み画面のスクリーンショット検証
  └── 最終サマリー（画面ごとのステータス一覧）
```

**合計所要時間**: 約65-115分（12画面、仕様書10ファイルの場合）

---

## Phase 0: 準備

### 0-1. デザインファイルの確認
```
mcp__pencil__get_editor_state(include_schema: false)
```

### 0-2. マスターボード構造の取得
```
mcp__pencil__batch_get(filePath: "{file}", nodeIds: ["{masterBoardId}"], readDepth: 2)
```

**記録テンプレート**:
```
masterBoardId: ____
layout: vertical, gap: ____, padding: ____, width: ____
children:
  [0] {id} — タイトル
  [1] {id} — サブタイトル
  [2] {id} — "認証" ラベル
  [3] {id} — 認証画面行 (gap: 30)
  [4] {id} — "OB" ラベル
  [5] {id} — OB画面行 (gap: 30)
  ...
```

### 0-3. 全画面のスクリーンショット取得

**メインプロセスで全画面のスクリーンショットを取得**（サブエージェントでは不可）:
```
mcp__pencil__get_screenshot(filePath: "{file}", nodeId: "{画面1のID}")
mcp__pencil__get_screenshot(filePath: "{file}", nodeId: "{画面2のID}")
...
```

### 0-4. 仕様書の全件読み込み
```
Read: specs/features/auth.md
Read: specs/features/onboarding.md
Read: specs/features/chat.md
Read: specs/features/subscription.md
Read: specs/features/journal.md
Read: specs/features/insights.md
Read: specs/features/settings.md
Read: specs/features/community.md
Read: specs/shared/navigation.md
```

### 0-5. 画面IDマッピング表の作成

```
| # | セクション | 画面コード | 画面名 | ノードID | 仕様書 |
|---|-----------|-----------|--------|---------|--------|
| 1 | 認証 | A-1 | ログイン | {id} | auth.md |
| 2 | OB | O-1 | ウェルカム | {id} | onboarding.md |
| 3 | OB | O-2 | 性格診断 | {id} | onboarding.md |
| ... |
```

### 0-6. 画面ごとレビューシートの初期化

**全画面分の空レビューシートを用意**（これが Phase 3 のノートカード内容になる）:

```
# 画面レビューシート

## A-1 ログイン (nodeId: {id})
- カラー: (未定)
- 指摘:
  - (レビュー後に記入)

## O-1 ウェルカム (nodeId: {id})
- カラー: (未定)
- 指摘:
  - (レビュー後に記入)

...（全画面分）
```

---

## Phase 1: レビュー実行

### 1-1. メインプロセスによる視覚レビュー

**メインプロセスが1画面ずつスクリーンショットを確認し、12視点でチェック。**

各画面について以下のチェックリストを実行:

#### ビジュアル系チェック（スクリーンショットで確認）
- [ ] フォントが統一されているか（Outfit）
- [ ] カラーがDSトークンに準拠しているか
- [ ] コントラスト比 4.5:1 以上か（ダーク背景上のテキストに特に注意）
- [ ] タップターゲット 44pt 以上か
- [ ] アイコンが lucide で統一されているか
- [ ] SafeArea が確保されているか
- [ ] 角丸・間隔が一貫しているか

#### フロー系チェック（画面間の関係を確認）
- [ ] 前後画面への遷移ボタンがあるか
- [ ] 戻るボタンがあるか
- [ ] 現在地がわかるか（タイトル、進捗表示）
- [ ] CTA が明確か

**指摘を画面レビューシートに記録。**

### 1-2. サブエージェントによる仕様ベースレビュー（並列3チーム）

**重要**: サブエージェントは仕様書の読み込みと分析のみ。Pencil MCP は使用不可。

```
Task (同時に3つ):

1. subagent_type: general-purpose
   name: "review-flow"
   run_in_background: true
   prompt: → references/review-prompts.md チーム1（仕様ベース）

2. subagent_type: general-purpose
   name: "review-screens"
   run_in_background: true
   prompt: → references/review-prompts.md チーム2（仕様ベース）

3. subagent_type: general-purpose
   name: "review-consistency"
   run_in_background: true
   prompt: → references/review-prompts.md チーム3（コード/設定ベース）
```

### 1-3. 結果の統合

サブエージェントの結果を画面レビューシートにマージ。**画面ごとに分類**:

```
## A-1 ログイン
- カラー: Yellow (❓がある場合)
- Critical:
  - (なし)
- Warning:
  - 🟡 Apple Sign-In ボタンのHIG準拠確認
- Question:
  - ❓ devLogin は開発モード限定か？
- Info:
  - ✅ ソーシャルログインボタンのレイアウト良好

## O-2 性格診断
- カラー: Blue (UXコメントのみの場合)
- Critical:
  - (なし)
- Info:
  - ✅ 進捗バー表示あり
  - 🔵 選択肢の高さを auto にすると長文対応が向上
```

---

## Phase 2: 修正適用

### 2-1. Critical の修正
メインプロセスで `batch_design` を使って即修正。
修正パターン → `references/common-fixes.md`

### 2-2. Warning の判断
- **5分以内で修正可能** → 即修正、レビューシートを `✅ 修正済み` に更新
- **大きな変更が必要** → レビューシートに `🔵` で記録（ノートカードに反映）

### 2-3. 修正後のスクリーンショット確認
各修正後に `get_screenshot` で確認。

---

## Phase 2.5: 仕様監査

サブエージェントで仕様書 vs デザインの照合。
結果を画面レビューシートに追加。

---

## Phase 3: 1画面1レビューノート配置

**このフェーズが本スキルの核心。全操作はメインプロセスで Pencil MCP を使用。**

### 3-1. 画面レビューシートからノート内容を確定

各画面について:
1. **カラー** = 最も優先度の高い指摘カテゴリの色
   - Yellow (❓) > Purple (🟣) > Blue (🔵) > Green (✅)
2. **タイトル** = `"{画面コード} {画面名}"`
3. **コメント** = プレフィックスアイコン + 内容（最大5行）

### 3-2. ノート行フレームの作成（バッチ1）

セクション数分の horizontal frame をマスターボードに作成:
```javascript
noteAuth=I("{masterBoardId}", {type: "frame", name: "Notes: 認証", layout: "horizontal", gap: 30, width: "fill_container", height: "hug_contents"})
noteOB=I("{masterBoardId}", {type: "frame", name: "Notes: OB", layout: "horizontal", gap: 30, width: "fill_container", height: "hug_contents"})
notePW=I("{masterBoardId}", {type: "frame", name: "Notes: PW", layout: "horizontal", gap: 30, width: "fill_container", height: "hug_contents"})
noteChat=I("{masterBoardId}", {type: "frame", name: "Notes: Chat", layout: "horizontal", gap: 30, width: "fill_container", height: "hug_contents"})
noteEng=I("{masterBoardId}", {type: "frame", name: "Notes: Engagement", layout: "horizontal", gap: 30, width: "fill_container", height: "hug_contents"})
```

### 3-3. ノート行を正しい位置に Move（バッチ2）

**下のセクションから上に向かって Move**（インデックスズレを最小化）:

```javascript
M("{noteEngId}", "{masterBoardId}", {engLabelIndex + 1})
M("{noteChatId}", "{masterBoardId}", {chatLabelIndex + 1})
M("{notePWId}", "{masterBoardId}", {pwLabelIndex + 1})
M("{noteOBId}", "{masterBoardId}", {obLabelIndex + 1})
M("{noteAuthId}", "{masterBoardId}", {authLabelIndex + 1})
```

### 3-4. 画面ごとのノートカード挿入（バッチ3以降）

**1画面 = 1ノートカード。1ノートカード = 3-5操作（frame + title + comments）。**

セクションごとに分割して batch_design を実行:

```javascript
// バッチ3: 認証セクション（1画面 = 3 ops）
note1=I("{noteAuthRowId}", {type: "frame", fill: "#FEF9C3", cornerRadius: [8,8,8,8], padding: [10,12,10,12], layout: "vertical", gap: 4, width: 402})
t1=I(note1, {type: "text", content: "A-1 ログイン", fontSize: 13, fontWeight: "700", fontFamily: "Outfit", textColor: "#854D0E", width: "fill_container"})
c1=I(note1, {type: "text", content: "❓ Apple Sign-In HIG 準拠確認", fontSize: 11, fontFamily: "Outfit", textColor: "#854D0E", width: "fill_container"})
```

```javascript
// バッチ4: OBセクション（4画面 × 3-4 ops = 12-16 ops）
noteO1=I("{noteOBRowId}", {type: "frame", fill: "#DCFCE7", cornerRadius: [8,8,8,8], padding: [10,12,10,12], layout: "vertical", gap: 4, width: 402})
tO1=I(noteO1, {type: "text", content: "O-1 ウェルカム", fontSize: 13, fontWeight: "700", fontFamily: "Outfit", textColor: "#166534", width: "fill_container"})
cO1=I(noteO1, {type: "text", content: "✅ CTA表示・フロー良好", fontSize: 11, fontFamily: "Outfit", textColor: "#166534", width: "fill_container"})

noteO2=I("{noteOBRowId}", {type: "frame", fill: "#DBEAFE", cornerRadius: [8,8,8,8], padding: [10,12,10,12], layout: "vertical", gap: 4, width: 402})
tO2=I(noteO2, {type: "text", content: "O-2 性格診断", fontSize: 13, fontWeight: "700", fontFamily: "Outfit", textColor: "#1E40AF", width: "fill_container"})
cO2a=I(noteO2, {type: "text", content: "✅ 進捗バー表示あり", fontSize: 11, fontFamily: "Outfit", textColor: "#1E40AF", width: "fill_container"})
cO2b=I(noteO2, {type: "text", content: "🔵 選択肢高さを auto に変更推奨", fontSize: 11, fontFamily: "Outfit", textColor: "#1E40AF", width: "fill_container"})
// ... O-3, O-4 も同様
```

### 3-5. バッチ操作の分割ガイドライン

**25操作/バッチの制限を守る。1ノートカード ≈ 3-5操作。**

| バッチ | 操作内容 | 操作数目安 |
|--------|---------|----------|
| 1 | ノート行フレーム作成 | 5 ops（5セクション） |
| 2 | ノート行を Move で正しい位置に | 5 ops |
| 3 | 認証ノートカード（1画面） | 3-5 ops |
| 4 | OBノートカード（4画面） | 12-20 ops |
| 5 | PWノートカード（1画面） | 3-5 ops |
| 6 | Chatノートカード（2画面） | 6-10 ops |
| 7 | Engagementノートカード（4画面） | 12-20 ops |

### 3-6. 配置検証

```
mcp__pencil__get_screenshot(filePath: "{file}", nodeId: "{masterBoardId}")
```

**チェックリスト**:
- [ ] 各画面行の直上にノート行が配置されている
- [ ] ノートカード数 = 画面数（1対1対応）
- [ ] ノートカードの左端と画面の左端が揃っている
- [ ] ノートカード幅（402px）= 画面幅
- [ ] ノートカード間 gap（30px）= 画面間 gap

---

## Phase 4: 検証 + サマリー

### 4-1. 修正済み画面のスクリーンショット検証

### 4-2. 最終サマリー

```
# デザインレビュー完了サマリー

## 対象
- ファイル: {file}
- 画面数: {N}画面
- ノートカード: {N}枚（1画面1枚）

## 画面ごとステータス
| # | 画面 | ノート色 | ステータス |
|---|------|---------|----------|
| 1 | A-1 ログイン | Yellow | ❓ HIG確認待ち |
| 2 | O-1 ウェルカム | Green | ✅ 問題なし |
| 3 | O-2 性格診断 | Blue | 🔵 UX改善推奨 |
| ... |

## カラー分布
- Yellow (❓): {a}枚
- Purple (🟣): {b}枚
- Blue (🔵): {c}枚
- Green (✅): {d}枚

## 人間レビュー待ち（Yellow）
1. A-1 ログイン: Apple Sign-In HIG 準拠確認
2. ...
```

---

## 12+1 レビュー視点

### UX / フロー系（1-4）

| # | 視点 | チェック項目 |
|---|------|-----------|
| 1 | オンボーディングUX | 初回体験8分以内、段階的開示、ステップ目的の明確性、戻る操作、離脱ポイント、進捗表示 |
| 2 | 課金UX | ペイウォールタイミング、価格明確性、CTA視認性、初回限定オファー、復元リンク、トライアル表示、FOMO |
| 3 | ナビゲーション | 遷移の論理性、戻るボタン、現在地表示、モーダル閉じ方 |
| 4 | マイクロインタラクション | ボタン状態定義、ローディング、成功/エラーフィードバック、フォーカス状態 |

### ビジュアル / 一貫性系（5-8）

| # | 視点 | チェック項目 |
|---|------|-----------|
| 5 | ビジュアル一貫性 | フォント統一、カラートークン統一、角丸統一、間隔一貫性、タブバー統一 |
| 6 | レスポンシブ | 長文省略/折り返し、多言語対応、長ユーザー名、空/大量リスト、SafeArea |
| 7 | ダークモード/テーマ | コントラスト比4.5:1以上、ダークUI上テキスト可読性 |
| 8 | アイコン/イラスト | フォントファミリー統一(lucide)、サイズ適切性、カラー適用 |

### ビジネス / プラットフォーム系（9-12）

| # | 視点 | チェック項目 |
|---|------|-----------|
| 9 | Apple審査 | HIG準拠Sign-In、価格明示、復元機能、削除容易性、PP/TOS リンク |
| 10 | アクセシビリティ | WCAG 2.1 AA、VoiceOver対応、コントラスト比、44ptタップターゲット |
| 11 | 競合分析 | 差別化ポイント、業界標準パターン準拠 |
| 12 | コンバージョン | CTA配置、視線誘導（F型/Z型）、ファネルドロップオフ、A/Bテスト候補 |

### 仕様監査（+1）

| # | 視点 | チェック項目 |
|---|------|-----------|
| 13 | 仕様書整合性 | AC対応、画面仕様要素の過不足、フロー遷移の対応、Free/Pro区分の正確性 |

---

## レビューノート仕様

### カラーコードと優先度

| 優先度 | 色 | fill | textColor | 用途 | プレフィックス |
|--------|-----|------|-----------|------|-------------|
| 1 (最高) | Yellow | `#FEF9C3` | `#854D0E` | 人間判断/ビジネス判断 | ❓ |
| 2 | Purple | `#F3E8FF` | `#6B21A8` | プラットフォーム/仕様追記 | 🟣 |
| 3 | Blue | `#DBEAFE` | `#1E40AF` | UXコメント（修正不要） | 🔵 |
| 4 (最低) | Green | `#DCFCE7` | `#166534` | 修正済み/良好 | ✅ |

**ノートカードのカラー決定ルール**:
- カード内に ❓ がある → Yellow
- ❓ なし、🟣 がある → Purple
- 🟣 なし、🔵 がある → Blue
- 全て ✅ → Green

### プレフィックスアイコン

| アイコン | 意味 | 使用例 |
|---------|------|--------|
| ✅ | 修正済み・問題なし | "✅ Big Fiveバー修正済み" |
| ❓ | 人間レビュー待ち | "❓ Apple Sign-In SDK 確認" |
| 🔵 | UXコメント | "🔵 スワイプUI検討の余地" |
| 🟡 | 注意点（軽微） | "🟡 タイムスタンプずれ" |
| 🟣 | プラットフォーム/仕様 | "🟣 Apple審査: 復元ボタン必須" |
| 🚫 | 未作成 | "🚫 Empty State 未作成" |
| 📝 | 仕様書追記必要 | "📝 community.md 追記" |

### ノートカード構造（Pencil batch_design テンプレート）

```javascript
note=I("{noteRowId}", {
  type: "frame",
  fill: "{カラーfill}",
  cornerRadius: [8,8,8,8],
  padding: [10,12,10,12],
  layout: "vertical",
  gap: 4,
  width: 402           // ← 画面幅と一致
})
title=I(note, {
  type: "text",
  content: "{画面コード} {画面名}",
  fontSize: 13,
  fontWeight: "700",
  fontFamily: "Outfit",
  textColor: "{カラーtextColor}",
  width: "fill_container"
})
comment=I(note, {
  type: "text",
  content: "{プレフィックス} {コメント}",
  fontSize: 11,
  fontFamily: "Outfit",
  textColor: "{カラーtextColor}",
  width: "fill_container"
})
```

### 混合カラーノート

1画面に複数カテゴリの指摘がある場合:
- **カード背景** = 最高優先度カテゴリの色
- **各コメント** = プレフィックスアイコンで種別を区別

```javascript
// Yellow カード（❓ があるため最高優先度）
note=I("{noteRowId}", {type: "frame", fill: "#FEF9C3", ...})
t=I(note, {type: "text", content: "O-2 性格診断", ...})
c1=I(note, {type: "text", content: "✅ 進捗バー表示あり", ...})
c2=I(note, {type: "text", content: "❓ 戻るボタン: 診断リセット?", ...})
c3=I(note, {type: "text", content: "🔵 スワイプUIも検討", ...})
```

---

## サブエージェント構成

### 制約の再確認
サブエージェントは Pencil MCP ツールを使用できない。
仕様書（specs/）、コード（src/）、設定ファイルの読み込みと分析のみ。

### チーム分割

| チーム | 名前 | 担当 | 入力 |
|--------|------|------|------|
| 1 | review-flow | フロー系画面の仕様チェック | specs/features/auth.md, onboarding.md, subscription.md |
| 2 | review-screens | 日常画面の仕様チェック | specs/features/chat.md, journal.md, insights.md, settings.md, community.md |
| 3 | review-consistency | コード/設定の整合性チェック | src/config/theme.ts, specs/overview.md, specs/shared/navigation.md |

### 起動方法
```
Task (同時に3つ):
  subagent_type: general-purpose
  run_in_background: true
  prompt: → references/review-prompts.md の対応テンプレート
```

プロンプトテンプレートの置換:
| プレースホルダー | 例 |
|----------------|-----|
| `{specs}` | `specs/features/auth.md, specs/features/onboarding.md` |
| `{screens_info}` | 画面マッピング表（テキスト形式） |

---

## spec-driven-dev パイプラインとの連携

```
spec-driven-dev Step 5: Design → .pen 作成
  ↓
本スキル Phase 0-4: レビュー + 1画面1ノート配置
  ↓
人間レビュー: ❓ 項目の判断
  ↓
spec-driven-dev Step 9: Reconcile → 仕様書同期
```
