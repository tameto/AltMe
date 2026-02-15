---
name: brand-identity
description: |
  ブランドアイデンティティ設計の専門スキル。
  ロゴ生成・背景画像・テキストデザイン・デザインシステム整合を4フェーズで実行する。
  Pencil MCP を使った AI画像生成の反復ワークフロー、比較ボード作成、決定トラッキングを体系化。
  トリガー: ロゴ, ロゴデザイン, 背景画像, ブランドカラー, ブランディング, デザインシステム整合, テキストデザイン, アプリアイコン, ビジュアルアイデンティティ
---

# Brand Identity Design スキル

> アプリのブランドアイデンティティ（ロゴ・背景・テキスト・デザインシステム）を
> AI画像生成と反復レビューで構築するワークフロー。

## 概要

### このスキルが解決する問題
- AI画像生成は非決定的 — 同じプロンプトでも毎回異なる結果が出る
- ブランド構成要素（ロゴ・背景・テキスト・DS）は相互依存する
- 意思決定の追跡がないと「なぜこのデザインになったか」が失われる

### 6フェーズパイプライン（全体の開発フローにおける位置づけ）
```
[企画・仕様]  monetize-app-plan → spec-driven-dev
    ↓ アプリコンセプト・仕様が確定

[ブランド構築]  brand-identity（本スキル）
  Phase 1: Logo Design（ロゴ生成・反復・決定）
      ↓ ロゴの美学が確定
  Phase 2: Background Design（ロゴ美学に基づく背景画像）
      ↓ 背景が確定
  Phase 3: Text Design（タイポグラフィ・カラーバリエーション）
      ↓ テキストスタイルが確定
  Phase 4: Design System Definition（ブランドに基づくDS定義・5案提示）
      ↓ デザインシステムが確定

[画面設計]  screen-designer（pencil-design + ui-designer）
    ↓ 確定DSに基づいて全画面を設計

[レビュー]  design-reviewer（design-review）
    ↓ 12+1視点でレビュー・修正
```

**重要: ブランド構築（Phase 1-4）は画面設計の前に完了させる。**
ロゴ・背景・テキスト・DSが確定してから画面デザインに進むことで、
手戻りを最小化し、全画面で一貫したブランドを実現する。

### 前提条件
- Pencil MCP サーバーが接続済み
- `.pen` ファイルが開かれている（または新規作成）
- デザインシステム（UIキット）が配置済み（Lunaris, Shadcn 等）
- アプリの概要・コンセプトが明確

---

## Phase 1: Logo Design（ロゴ生成・反復）

### Entry Gate
- [ ] アプリ名とコンセプトが確定
- [ ] ブランドの方向性キーワード（3-5個）

### 実行手順

#### Step 1.1: 比較ボードの準備
マスターボード内にロゴ専用セクションを作成:

```javascript
// セクションラベル
label=I("{masterBoardId}", {type: "text", content: "Logo R1: 初回候補", fontSize: 20, fontWeight: "700", fontFamily: "Outfit", textColor: "#0F172A"})

// 候補行（horizontal frame）
row=I("{masterBoardId}", {type: "frame", name: "Logo R1 Row", layout: "horizontal", gap: 30, width: "fill_container"})
```

#### Step 1.2: AI画像生成（5候補）
各候補をフレーム内に生成:

```javascript
// 候補フレーム（160x160）
c1=I(row, {type: "frame", name: "R1-A", width: 160, height: 160, cornerRadius: [20,20,20,20], clip: true})
G(c1, "ai", "{ブランドキーワードを含むプロンプト}")
```

**プロンプト設計のコツ:**
- 抽象的すぎず具体的すぎず
- スタイルキーワード: `minimalist`, `gradient`, `geometric`, `particle`, `neural`, `topology`
- 色指定: `dark navy`, `gold accent`, `teal highlights`
- 形状指定: `circular`, `ring`, `interconnected nodes`
- 毎候補でプロンプトを少しずつ変えてバリエーションを出す

#### Step 1.3: スクリーンショット検証 + ユーザーフィードバック
```
mcp__pencil__get_screenshot(nodeId: "{row}")
```
ユーザーに候補を提示し、方向性のフィードバックを得る。

#### Step 1.4: 反復ラウンド（R2, R3, R4...）
フィードバックを元に新ラウンドを作成。各ラウンドは独立セクション:
- `Logo R2: {フィードバック反映}` → 新候補5個
- `Logo R3: {さらに絞り込み}` → 新候補5個
- 通常 3-4ラウンドで収束

#### Step 1.5: 文字なし版の作成（Clip技法）
決定したロゴに文字が含まれる場合、Clip技法で文字部分を除去:

```javascript
// 親フレームを clip コンテナに変換
U("{logoFrameId}", {clip: true, layout: "none"})
// オーバーサイズの子フレームを挿入（x/yオフセットで文字を枠外に）
inner=I("{logoFrameId}", {type: "frame", width: 200, height: 200, x: -20, y: -12})
// 元のロゴ画像を子フレームに適用
G(inner, "ai", "{同じプロンプト}")  // または画像fill設定
```

詳細 → `references/logo-workflow.md`

#### Step 1.6: アプリアイコンサイズの作成
80px版を Clip技法の縮小比率で作成:
- 160px版: inner 200x200, offset x:-20, y:-12
- 80px版: inner 100x100, offset x:-10, y:-6

#### Step 1.7: 決定バッジ
```javascript
badge=I("{sectionId}", {type: "frame", fill: "#DCFCE7", cornerRadius: [8,8,8,8], padding: [6,12,6,12]})
text=I(badge, {type: "text", content: "★ 決定: {候補名}", fontSize: 13, fontWeight: "600", fontFamily: "Outfit", textColor: "#166534"})
```

### Exit Gate
- [ ] ロゴ（文字あり/文字なし/アイコンサイズ）が決定
- [ ] 決定バッジが配置済み
- [ ] ブランドの美学キーワードが抽出済み（例: "golden particle ring", "neural topology"）

---

## Phase 2: Background Design（背景画像）

### Entry Gate
- [ ] Phase 1 完了（ロゴの美学が確定）
- [ ] 背景を使用する画面が特定済み（例: ログイン画面）

### 実行手順

#### Step 2.1: 画面テンプレートの複製
背景バリエーション用に元画面を複製:

```javascript
// 5候補分の画面を作成
v1=C("{originalScreenId}", "{masterBoardId}", {name: "BG-A: {説明}", positionDirection: "right"})
v2=C("{originalScreenId}", "{masterBoardId}", {name: "BG-B: {説明}", positionDirection: "right"})
```

#### Step 2.2: ロゴ美学に基づく背景生成

**重要: G() の後は必ず mode を "cover" に変更:**
```javascript
G("{screenBgFrameId}", "ai", "{ロゴの美学キーワード} background, dark, atmospheric, mobile app")
U("{screenBgFrameId}", {fills: [{type: "image", mode: "cover"}]})
```

**プロンプト戦略（ロゴ美学の展開）:**
| ロゴの美学 | 背景プロンプト例 |
|-----------|----------------|
| Particle ring | `floating particles, dark space, golden dots` |
| Neural network | `interconnected neural lines, twin symmetry, dark navy` |
| Geometric | `abstract geometric shapes, subtle gradients` |
| Topology | `topology mesh, node connections, deep blue` |

#### Step 2.3: ロゴ非表示（背景にロゴ不要の場合）
```javascript
U("{logoBoxId}", {width: 0, height: 0, overflow: "hidden"})
U("{spacerId}", {height: 0})
```

#### Step 2.4: スクリーンショット検証 + フィードバック → 反復

#### Step 2.5: 決定バッジ + アニメーション仕様ノート
背景にアニメーションが想定される場合:
```javascript
animNote=I("{sectionId}", {type: "frame", fill: "#DBEAFE", cornerRadius: [8,8,8,8], padding: [10,12,10,12], layout: "vertical", gap: 4, width: 402})
title=I(animNote, {type: "text", content: "Animation Spec", fontSize: 13, fontWeight: "700", fontFamily: "Outfit", textColor: "#1E40AF"})
spec=I(animNote, {type: "text", content: "{アニメーション仕様}", fontSize: 11, fontFamily: "Outfit", textColor: "#1E40AF", width: "fill_container"})
```

詳細 → `references/background-workflow.md`

### Exit Gate
- [ ] 背景画像が決定
- [ ] 元画面に背景が適用済み
- [ ] 決定バッジ配置済み
- [ ] アニメーション仕様（必要な場合）が記録済み

---

## Phase 3: Text Design（テキストデザイン）

### Entry Gate
- [ ] Phase 1-2 完了（ロゴ・背景が確定）
- [ ] テキストの使用箇所が特定済み

### 実行手順

#### Step 3.1: フォントスタイル探索
ロゴの美学に合うフォントウェイト・サイズ・レタースペーシングを探索:

```javascript
// 3つの背景（ダーク/ライト/アクセント）で視認性を確認
darkBg=I(row, {type: "frame", fill: "#0F172A", width: 200, height: 120, layout: "vertical", mainAxisAlignment: "center", crossAxisAlignment: "center"})
text=I(darkBg, {type: "text", content: "AltMe", fontSize: 48, fontWeight: "300", fontFamily: "Outfit", fill: "#F8FAFC", letterSpacing: 2})
```

**探索軸:**
- `fontWeight`: 300 (Light/Elegant) ↔ 700 (Bold/Strong)
- `fontSize`: 36 ↔ 64
- `letterSpacing`: 0 ↔ 4
- `textColor/fill`: ブランドカラーバリエーション

#### Step 3.2: カラーバリエーション展開
決定したフォントスタイルで複数色を展開:

```javascript
// 各色を3背景（ダーク/ライト/アクセント）で表示
// Gold, Blue, White, Teal, Silver, etc.
```

#### Step 3.3: 色の用途決定
```
基本色: 白 (#F8FAFC) — ダーク背景上のメインテキスト
アクセント色: ゴールド (#D4A853) — プレミアム感を出す場面
情報色: ブルー (#7DD3FC) — リンク・アクション
```

#### Step 3.4: 仕様カード作成
```javascript
specCard=I("{sectionId}", {type: "frame", fill: "#F8FAFC", cornerRadius: [12,12,12,12], padding: [16,20,16,20], layout: "vertical", gap: 8, width: 402, stroke: [{color: "#E2E8F0"}], strokeThickness: 1})
specTitle=I(specCard, {type: "text", content: "Text Design Specs", fontSize: 14, fontWeight: "700", fontFamily: "Outfit", textColor: "#0F172A"})
specBody=I(specCard, {type: "text", content: "fontFamily: Outfit\nfontWeight: 300 (Light)\nletterSpacing: 2-3\n...", fontSize: 12, fontFamily: "Outfit", textColor: "#334155", width: "fill_container"})
```

詳細 → `references/text-design-workflow.md`

### Exit Gate
- [ ] フォントスタイル（weight/size/spacing）が決定
- [ ] カラーバリエーション（2-4色）が決定
- [ ] 各色の用途が明記
- [ ] 仕様カードが配置済み
- [ ] 決定バッジ配置済み

---

## Phase 4: Design System Definition（DS定義・5案提示）

### Entry Gate
- [ ] Phase 1-3 全完了（ロゴ・背景・テキストが確定）
- [ ] 現在のデザインシステム変数を `get_variables` で取得済み
- [ ] 既存画面デザイン（参照用）が特定済み

### 実行手順

#### Step 4.1: ブランド要素の整理
Phase 1-3 の決定事項をまとめる:
- ロゴのカラーパレット（Primary, Secondary, Accent）
- 背景の基調色
- テキストのフォント・ウェイト・カラー
- 全体の美学キーワード

#### Step 4.2: 5案の方向性設計
ブランド要素を軸に、5つの異なるDSバリエーションを設計:

| 案 | 方向性 | Primary | Accent | 背景戦略 |
|-----|--------|---------|--------|---------|
| A | Brand Faithful | ロゴのメイン色 | ロゴのサブ色 | ロゴのダーク背景をDS全体に |
| B | Light & Gold | ロゴのメイン色 | 明るいアクセント | ライト背景メイン + ゴールドアクセント |
| C | Dark & Premium | ロゴのメイン色（暗め） | 控えめアクセント | 全面ダーク + プレミアム感 |
| D | Dual Tone | ロゴの2色をバランスよく | 中間色 | ダーク/ライトのハイブリッド |
| E | Minimal Contrast | モノクロベース | ロゴ色をポイント | ミニマルな白黒 + ブランド色差し |

#### Step 4.3: 各案のDS変数セット作成
5案それぞれについて、以下の変数を定義:
- `--primary`, `--primary-foreground`
- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--accent`, `--accent-foreground`
- `--muted`, `--muted-foreground`
- `--border`, `--input`, `--ring`
- `--destructive`
- `--font-primary`, `--font-secondary`
- Light/Dark テーマ対応

#### Step 4.4: 5案のプレビュー画面作成
各案をPencilで視覚化:
- 主要コンポーネント（ボタン、カード、入力フィールド）のプレビュー
- ログイン画面のモックアップ
- ダーク/ライトモード両方

```javascript
// 5案を横並びで比較
previewRow=I("{masterBoardId}", {type: "frame", layout: "horizontal", gap: 30})
// 各案のプレビューカード（画面幅 or 500px幅のサンプルボード）
```

#### Step 4.5: ユーザー選定 → 変数適用
選ばれた案の変数を `set_variables` で適用:
```
mcp__pencil__set_variables(filePath: "{file}", variables: {選択案の変数セット})
```

#### Step 4.6: コンポーネント横断プロパティ置換
```
mcp__pencil__replace_all_matching_properties(...)
```

#### Step 4.7: design-tokens.md 更新

詳細 → `references/design-system-alignment.md`

### Exit Gate
- [ ] 5案が視覚的に比較可能
- [ ] 1案が選定され、DS変数が適用済み
- [ ] 全コンポーネントで新DSが反映確認
- [ ] design-tokens.md が更新済み
- [ ] 決定バッジ + 決定理由が記録済み

---

## 比較ボードのレイアウトパターン

### 標準比較ボード（候補5個）
```
masterBoard (vertical, gap: 40)
├── セクションラベル "Logo R1: 初回候補"
├── 候補行 (horizontal, gap: 30)
│   ├── R1-A (160x160)
│   ├── R1-B (160x160)
│   ├── R1-C (160x160)
│   ├── R1-D (160x160)
│   └── R1-E (160x160)
├── セクションラベル "Logo R2: {フィードバック}"
├── 候補行 (horizontal, gap: 30)
│   └── ...
```

### 画面バリエーション比較（背景候補）
```
masterBoard (vertical, gap: 40)
├── セクションラベル "Background R1"
├── 候補行 (horizontal, gap: 30)
│   ├── Original (402x874)  ← 元画面
│   ├── BG-A (402x874)
│   ├── BG-B (402x874)
│   ├── BG-C (402x874)
│   ├── BG-D (402x874)
│   └── BG-E (402x874)
```

### テキストカラー比較
```
候補行 (horizontal, gap: 20)
├── ダーク背景 (200x120) ← テキスト色の視認性確認
├── ライト背景 (200x120)
└── アクセント背景 (200x120)
```

---

## 反復ラウンドの命名規則

| ラウンド | プレフィックス | 意味 |
|---------|-------------|------|
| R1 | Logo R1 / BG R1 | 初回候補 |
| R2 | Logo R2 / BG R2 | フィードバック反映 |
| R3 | Logo R3 / BG R3 | 絞り込み |
| R4 | Logo R4 / BG R4 | 最終調整 |
| R5, R6 | BG R5 / BG R6 | 追加ラウンド（方向転換時） |

候補の命名: `{Round}-{Letter}` (例: R4-E, R6-E)

---

## 重要な技術パターン

### 1. G() 後の image mode 修正（必須）
AI画像生成後、tall frame では画像がフレーム全体をカバーしない。**毎回 U() で修正が必要:**
```javascript
G("{frameId}", "ai", "{prompt}")
U("{frameId}", {fills: [{type: "image", mode: "cover"}]})
```

### 2. Clip技法（画像のクロップ）
テキスト入りロゴから文字を除去する等:
```javascript
U("{parentFrame}", {clip: true, layout: "none"})
inner=I("{parentFrame}", {type: "frame", width: 200, height: 200, x: -20, y: -12})
// inner に画像を設定
```

### 3. テキストノードの色は `fill` プロパティ
Pencil のテキストノードで色を設定する場合、`textColor` ではなく `fill` を使用。

詳細 → `references/pencil-techniques.md`

---

## 参照

- `references/logo-workflow.md` — ロゴ生成の詳細手順、プロンプト設計、Clip技法
- `references/background-workflow.md` — 背景画像の生成・選定・アニメーション仕様
- `references/text-design-workflow.md` — タイポグラフィ探索・カラーバリエーション
- `references/design-system-alignment.md` — DS変数マッピング・一括更新手順
- `references/pencil-techniques.md` — Pencil MCP 固有の技術パターン集
- `references/decision-tracking.md` — 決定バッジ・履歴ノート・仕様ノート

### 関連スキル
- `pencil-design` — Pencil MCP ツールの基本操作
- `ui-designer` — UI/UXデザイン原則
- `design-review` — デザインレビューワークフロー
