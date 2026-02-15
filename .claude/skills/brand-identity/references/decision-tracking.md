# 意思決定トラッキング パターン集

> ブランドアイデンティティ設計プロセスでの決定事項を
> デザインファイル内に可視化・記録するためのパターン。

---

## なぜ決定トラッキングが必要か

1. **再現性**: 「なぜこのデザインになったか」を後から追跡可能にする
2. **引き継ぎ**: 別のデザイナー/エージェントが途中から参加できる
3. **反復履歴**: どのラウンドで何を試し、何を捨てたかが明確
4. **仕様連携**: 確定事項を仕様書に反映する際のソース

---

## 決定バッジ

### 種類と用途

| バッジ種別 | 背景色 | テキスト色 | 用途 |
|-----------|--------|-----------|------|
| 決定（単純） | #DCFCE7 | #166534 | 単一要素の決定 |
| 決定（詳細） | #DCFCE7 | #166534 | 決定 + 条件/補足 |
| 候補 | #FEF3C7 | #854D0E | まだ決定していない候補 |
| 却下 | #FEE2E2 | #991B1B | 明示的に却下された候補 |

### テンプレート

#### 単純決定バッジ
```javascript
badge=I("{parentId}", {
  type: "frame",
  fill: "#DCFCE7",
  cornerRadius: [8,8,8,8],
  padding: [6,12,6,12],
  layout: "horizontal",
  gap: 6
})
text=I(badge, {
  type: "text",
  content: "★ 決定",
  fontSize: 13,
  fontWeight: "600",
  fontFamily: "Outfit",
  textColor: "#166534"
})
```

#### 詳細決定バッジ
```javascript
badge=I("{parentId}", {
  type: "frame",
  fill: "#DCFCE7",
  cornerRadius: [8,8,8,8],
  padding: [6,12,6,12],
  layout: "horizontal",
  gap: 6
})
text=I(badge, {
  type: "text",
  content: "★ 3色決定（基本: 白）",
  fontSize: 13,
  fontWeight: "600",
  fontFamily: "Outfit",
  textColor: "#166534"
})
```

#### 却下バッジ
```javascript
badge=I("{parentId}", {
  type: "frame",
  fill: "#FEE2E2",
  cornerRadius: [8,8,8,8],
  padding: [6,12,6,12]
})
text=I(badge, {
  type: "text",
  content: "✕ 却下: {理由}",
  fontSize: 13,
  fontWeight: "600",
  fontFamily: "Outfit",
  textColor: "#991B1B"
})
```

---

## 決定履歴ノート

### 用途
複数ラウンドにわたる意思決定の経緯を記録。
デザインの「なぜ」を残す。

### テンプレート
```javascript
histNote=I("{sectionId}", {
  type: "frame",
  fill: "#DCFCE7",
  cornerRadius: [8,8,8,8],
  padding: [10,12,10,12],
  layout: "vertical",
  gap: 4,
  width: 402
})
histTitle=I(histNote, {
  type: "text",
  content: "Decision History",
  fontSize: 13,
  fontWeight: "700",
  fontFamily: "Outfit",
  textColor: "#166534"
})
histBody=I(histNote, {
  type: "text",
  content: "R1: 5候補から particle 系 (R1-D) を選定\nR2: R1-D のバリエーション5個、リング形状を洗練\nR3: テキスト入り版 (R3-A, R3-C) に絞り込み\nR4: 最終調整5候補 → R4-E 決定\n決定理由: パーティクルリングの美しさ + テキストバランス",
  fontSize: 11,
  fontFamily: "Outfit",
  textColor: "#166534",
  width: "fill_container"
})
```

### 書き方のコツ
- 各ラウンドを1行で簡潔に
- 「なぜその候補を選んだか」を明記
- 却下理由も簡潔に記録

---

## アニメーション仕様ノート

### 用途
背景画像やUI要素にアニメーションが想定される場合の
実装仕様を記録。

### テンプレート
```javascript
animNote=I("{sectionId}", {
  type: "frame",
  fill: "#DBEAFE",
  cornerRadius: [8,8,8,8],
  padding: [10,12,10,12],
  layout: "vertical",
  gap: 4,
  width: 402
})
animTitle=I(animNote, {
  type: "text",
  content: "Animation Spec",
  fontSize: 13,
  fontWeight: "700",
  fontFamily: "Outfit",
  textColor: "#1E40AF"
})
animBody=I(animNote, {
  type: "text",
  content: "Library: react-native-reanimated + @shopify/react-native-skia\nType: Continuous loop\nDuration: 4-6s per cycle\nEasing: Easing.inOut(Easing.ease)\nElements:\n  - Twin lines: Skia Path + animated control points\n  - Particles: Canvas dots with random drift\n  - Glow: RadialGradient with animated opacity\nPerformance: useFrameCallback, GPU-accelerated\nreduced-motion: Static fallback image",
  fontSize: 11,
  fontFamily: "Outfit",
  textColor: "#1E40AF",
  width: "fill_container"
})
```

---

## ブランド仕様まとめノート

### 用途
全フェーズ完了後に、確定したブランド要素を1枚にまとめる。

### テンプレート
```javascript
summaryNote=I("{sectionId}", {
  type: "frame",
  fill: "#F8FAFC",
  cornerRadius: [12,12,12,12],
  padding: [16,20,16,20],
  layout: "vertical",
  gap: 12,
  width: "fill_container",
  stroke: [{color: "#E2E8F0"}],
  strokeThickness: 1
})

summaryTitle=I(summaryNote, {
  type: "text",
  content: "Brand Identity Summary",
  fontSize: 16,
  fontWeight: "700",
  fontFamily: "Outfit",
  textColor: "#0F172A"
})

logoSpec=I(summaryNote, {
  type: "text",
  content: "LOGO\n  Style: Golden particle ring on dark navy\n  File: ./images/generated-{timestamp}.png\n  Sizes: 160px (full), 80px (icon), text/no-text variants\n  No-text: Clip technique (200x200 inner, x:-20, y:-12)",
  fontSize: 12,
  fontFamily: "Outfit",
  textColor: "#334155",
  width: "fill_container"
})

bgSpec=I(summaryNote, {
  type: "text",
  content: "BACKGROUND\n  Style: Neural twin lines on dark navy\n  File: ./images/generated-{timestamp}.png\n  Mode: cover\n  Animation: Reanimated + Skia, 4-6s loop",
  fontSize: 12,
  fontFamily: "Outfit",
  textColor: "#334155",
  width: "fill_container"
})

textSpec=I(summaryNote, {
  type: "text",
  content: "TEXT DESIGN\n  Font: Outfit\n  Title: Weight 300, Size 48-56, LS 2-3\n  Colors: White (#F8FAFC), Gold (#D4A853), Blue (#7DD3FC)\n  Default: White on dark backgrounds",
  fontSize: 12,
  fontFamily: "Outfit",
  textColor: "#334155",
  width: "fill_container"
})

dsSpec=I(summaryNote, {
  type: "text",
  content: "DESIGN SYSTEM\n  Primary: #D4A853 (Gold)\n  Background: #F8FAFC / #0F172A (Light/Dark)\n  Font: Outfit (unified)\n  Variables updated: {count} vars via set_variables",
  fontSize: 12,
  fontFamily: "Outfit",
  textColor: "#334155",
  width: "fill_container"
})
```

---

## 配置ルール

### バッジの配置位置
| バッジ | 配置先 |
|--------|--------|
| ロゴ決定バッジ | ロゴセクションの候補行の直後 |
| 背景決定バッジ | 背景セクションの候補行の直後 |
| テキスト決定バッジ | テキストセクションの上部（index 1） |
| ブランドサマリー | マスターボード末尾 |

### ノートの配置位置
| ノート | 配置先 |
|--------|--------|
| 決定履歴 | 決定バッジの直後 |
| アニメーション仕様 | 決定履歴の直後 |
| 仕様カード | テキストセクション内 |

### Move による位置調整
Insert はデフォルトで末尾に追加されるため、適切な位置に Move:
```javascript
// 決定バッジをセクションラベルの直後に移動
M("{badgeId}", "{sectionId}", 1)  // index 1 = ラベルの次
```

---

## セクション命名規則

### ラウンド別セクションラベル
```
Logo R1: Initial Concepts
Logo R2: Particle variants (feedback from R1-D)
Logo R3: Ring refinement
Logo R4: Final candidates
Logo Final: 決定版（文字あり/文字なし/アイコン）
Background R1: Particle backgrounds
Background R2: Neural line variants
Text Design: Font & Color Exploration
Design System: Brand Alignment
```

### 候補の命名
```
{Round}-{Letter}: {短い説明}
例:
R4-E: Golden particle ring with AltMe text
R6-E: Neural twin lines
```
