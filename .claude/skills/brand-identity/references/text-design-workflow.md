# テキストデザイン ワークフロー詳細

> アプリ名のタイポグラフィスタイル探索、カラーバリエーション展開の完全手順。

---

## 全体フロー

```
Step 1: フォントスタイル探索（weight / size / spacing）
Step 2: 3背景での視認性確認
Step 3: カラーバリエーション展開（5-10色）
Step 4: ユーザー選定 + 用途決定
Step 5: 仕様カード作成
Step 6: 決定バッジ + 画面への適用
```

---

## Step 1: フォントスタイル探索

### 探索する軸
| 軸 | 範囲 | ロゴとの整合 |
|----|------|------------|
| fontFamily | Outfit, Inter, SF Pro, Poppins | ロゴの雰囲気に合うフォント |
| fontWeight | 300 (Light) ↔ 700 (Bold) | 細い = エレガント、太い = 力強い |
| fontSize | 36 ↔ 64 | 画面サイズと背景との調和 |
| letterSpacing | 0 ↔ 6 | 広い = 洗練、狭い = コンパクト |

### ロゴの美学とフォントスタイルの対応

| ロゴの美学 | 推奨フォントスタイル |
|-----------|------------------|
| Particle / Cosmic | Light (300), wide spacing (2-4), large (48-56) |
| Neural / Tech | Regular (400), moderate spacing (1-2), medium (40-48) |
| Geometric / Bold | SemiBold (600), tight spacing (0-1), medium (36-44) |
| Organic / Flow | Light-Regular (300-400), moderate spacing (1-3), large (44-52) |

### 比較ボード作成
```javascript
// フォントスタイル探索セクション
label=I("{masterBoardId}", {type: "text", content: "Text Design: Font Style Exploration", fontSize: 20, fontWeight: "700", fontFamily: "Outfit", textColor: "#0F172A"})

// 3×3 グリッド（weight × spacing）
row1=I("{masterBoardId}", {type: "frame", layout: "horizontal", gap: 20})

// Weight 300 + Spacing 1
bg1=I(row1, {type: "frame", fill: "#0F172A", width: 200, height: 120, layout: "vertical", mainAxisAlignment: "center", crossAxisAlignment: "center", gap: 4, cornerRadius: [8,8,8,8]})
t1=I(bg1, {type: "text", content: "AltMe", fontSize: 48, fontWeight: "300", fontFamily: "Outfit", fill: "#F8FAFC", letterSpacing: 1})
l1=I(bg1, {type: "text", content: "W300 / LS1", fontSize: 10, fontFamily: "Outfit", fill: "#64748B"})

// Weight 300 + Spacing 3
bg2=I(row1, {type: "frame", fill: "#0F172A", width: 200, height: 120, layout: "vertical", mainAxisAlignment: "center", crossAxisAlignment: "center", gap: 4, cornerRadius: [8,8,8,8]})
t2=I(bg2, {type: "text", content: "AltMe", fontSize: 48, fontWeight: "300", fontFamily: "Outfit", fill: "#F8FAFC", letterSpacing: 3})
l2=I(bg2, {type: "text", content: "W300 / LS3", fontSize: 10, fontFamily: "Outfit", fill: "#64748B"})

// Weight 400 + Spacing 2
bg3=I(row1, {type: "frame", fill: "#0F172A", width: 200, height: 120, layout: "vertical", mainAxisAlignment: "center", crossAxisAlignment: "center", gap: 4, cornerRadius: [8,8,8,8]})
t3=I(bg3, {type: "text", content: "AltMe", fontSize: 48, fontWeight: "400", fontFamily: "Outfit", fill: "#F8FAFC", letterSpacing: 2})
l3=I(bg3, {type: "text", content: "W400 / LS2", fontSize: 10, fontFamily: "Outfit", fill: "#64748B"})
```

---

## Step 2: 3背景での視認性確認

### 必須の3背景
| 背景 | 色 | 目的 |
|------|------|------|
| ダーク | #0F172A | メイン使用（ログイン、ペイウォール） |
| ライト | #F8FAFC | ライトモード画面 |
| アクセント | #F59E0B (Gold) or ブランドカラー | アクセントカラー上の視認性 |

### 3背景セット作成
```javascript
setRow=I("{parentId}", {type: "frame", layout: "horizontal", gap: 16})

// ダーク背景
darkBg=I(setRow, {type: "frame", fill: "#0F172A", width: 200, height: 120, layout: "vertical", mainAxisAlignment: "center", crossAxisAlignment: "center", cornerRadius: [8,8,8,8]})
darkText=I(darkBg, {type: "text", content: "AltMe", fontSize: 48, fontWeight: "300", fontFamily: "Outfit", fill: "{テスト色}", letterSpacing: 2})

// ライト背景
lightBg=I(setRow, {type: "frame", fill: "#F8FAFC", width: 200, height: 120, layout: "vertical", mainAxisAlignment: "center", crossAxisAlignment: "center", cornerRadius: [8,8,8,8], stroke: [{color: "#E2E8F0"}], strokeThickness: 1})
lightText=I(lightBg, {type: "text", content: "AltMe", fontSize: 48, fontWeight: "300", fontFamily: "Outfit", fill: "{テスト色}", letterSpacing: 2})

// アクセント背景
accentBg=I(setRow, {type: "frame", fill: "#F59E0B", width: 200, height: 120, layout: "vertical", mainAxisAlignment: "center", crossAxisAlignment: "center", cornerRadius: [8,8,8,8]})
accentText=I(accentBg, {type: "text", content: "AltMe", fontSize: 48, fontWeight: "300", fontFamily: "Outfit", fill: "{テスト色}", letterSpacing: 2})
```

---

## Step 3: カラーバリエーション展開

### 推奨カラーセット（ロゴ美学別）

#### Particle / Golden 系
| 名前 | 色 | ダーク背景 | ライト背景 |
|------|------|-----------|-----------|
| Gold | #D4A853 | ◎ | ○ |
| White | #F8FAFC | ◎ | × |
| Sky Blue | #7DD3FC | ◎ | △ |
| Warm Gray | #CBD5E1 | ○ | △ |
| Amber | #FBBF24 | ◎ | △ |

#### Neural / Tech 系
| 名前 | 色 | ダーク背景 | ライト背景 |
|------|------|-----------|-----------|
| Cyan | #22D3EE | ◎ | △ |
| White | #F8FAFC | ◎ | × |
| Violet | #A78BFA | ◎ | ○ |
| Emerald | #34D399 | ◎ | △ |
| Silver | #94A3B8 | ○ | △ |

### 10色展開の batch_design パターン
```javascript
// 2行に分けて10色表示
colorRow1=I("{sectionId}", {type: "frame", name: "Colors A-E", layout: "horizontal", gap: 20})
colorRow2=I("{sectionId}", {type: "frame", name: "Colors F-J", layout: "horizontal", gap: 20})

// 各色: 3背景セットを展開
// Color A: Gold (#D4A853)
setA=I(colorRow1, {type: "frame", layout: "vertical", gap: 4})
labelA=I(setA, {type: "text", content: "A: Gold #D4A853", fontSize: 11, fontFamily: "Outfit", textColor: "#64748B"})
bgSetA=I(setA, {type: "frame", layout: "horizontal", gap: 8})
// ... 3背景を追加
```

---

## Step 4: ユーザー選定 + 用途決定

### 典型的な選定結果
```
基本色:    白 (#F8FAFC) — ダーク背景上のデフォルトテキスト
アクセント: ゴールド (#D4A853) — プレミアム感、CTA
情報色:    ブルー (#7DD3FC) — リンク、アクション、セカンダリ
```

### 用途マッピング
| 使用箇所 | 色 | 理由 |
|---------|------|------|
| ログイン画面タイトル | 白 | ダーク背景で最高の視認性 |
| ペイウォール CTA | ゴールド | プレミアム感、注目を集める |
| アプリ内ヘッダー | 白 | 一貫性 |
| セカンダリテキスト | ブルー | 情報の区別 |
| Pro バッジ | ゴールド | プレミアム感 |

---

## Step 5: 仕様カード作成

### テキストデザイン仕様カード
```javascript
specCard=I("{sectionId}", {
  type: "frame", fill: "#F8FAFC", cornerRadius: [12,12,12,12],
  padding: [16,20,16,20], layout: "vertical", gap: 8,
  width: 402, stroke: [{color: "#E2E8F0"}], strokeThickness: 1
})
specTitle=I(specCard, {
  type: "text", content: "Text Design Specification",
  fontSize: 14, fontWeight: "700", fontFamily: "Outfit", textColor: "#0F172A"
})
specBody=I(specCard, {
  type: "text",
  content: "fontFamily: Outfit\nfontWeight: 300 (Light)\nletterSpacing: 2-3\nfontSize: 48-56 (App Title)\nfontSize: 18-20 (Subtitle)\nfontSize: 14-16 (Tagline)\n\nColors:\n  Primary: #F8FAFC (White)\n  Accent: #D4A853 (Gold)\n  Info: #7DD3FC (Blue)",
  fontSize: 12, fontFamily: "Outfit", textColor: "#334155", width: "fill_container"
})
```

---

## Step 6: 決定バッジ + 画面適用

### 決定バッジ
```javascript
badge=I("{sectionId}", {
  type: "frame", fill: "#DCFCE7", cornerRadius: [8,8,8,8],
  padding: [6,12,6,12]
})
badgeText=I(badge, {
  type: "text",
  content: "★ {N}色決定（基本: {基本色名}）",
  fontSize: 13, fontWeight: "600", fontFamily: "Outfit", textColor: "#166534"
})
```

### 画面への適用
```javascript
// ログイン画面のタイトルを更新
U("{appTitleId}", {
  fill: "#F8FAFC",
  fontSize: 52,
  fontWeight: "300",
  letterSpacing: 3
})
U("{subtitleId}", {
  fill: "#94A3B8",
  fontSize: 20,
  fontWeight: "400",
  letterSpacing: 1
})
```

---

## テキストノードの重要な注意点

### `fill` vs `textColor`
Pencil のテキストノードで色を制御する場合:
- **`fill`** を使う（色が反映される）
- `textColor` は無視される場合がある

```javascript
// 正しい
U("{textId}", {fill: "#D4A853"})

// 効かない場合がある
U("{textId}", {textColor: "#D4A853"})
```

### `letterSpacing` の単位
- Pencil の `letterSpacing` はピクセル値
- CSS の `letter-spacing` と同じ概念
- 値が大きいほど文字間が広がる

### サブタイトル/タグラインのスタイル
タイトルと差をつけるため:
- タイトル: fontSize 48-56, fontWeight 300, letterSpacing 2-3
- サブタイトル: fontSize 18-20, fontWeight 400, letterSpacing 0-1
- タグライン: fontSize 14-16, fontWeight 400, fill はタイトルより暗め
