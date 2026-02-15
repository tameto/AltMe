# 背景画像デザイン ワークフロー詳細

> ロゴの美学を拡張した背景画像の生成・選定・適用の完全手順。

---

## 全体フロー

```
Step 1: 対象画面の特定 + 元画面の複製
Step 2: ロゴ美学からプロンプト設計
Step 3: バリエーション生成（5候補）
Step 4: image mode 修正（必須）
Step 5: 画面上のUI要素調整（ロゴ非表示等）
Step 6: スクリーンショット検証 + フィードバック
Step 7: 反復（R2, R3...）
Step 8: 決定・適用 + アニメーション仕様
```

---

## Step 1: 対象画面の特定

### 背景画像が必要な典型的画面
| 画面 | 背景の目的 |
|------|-----------|
| ログイン/認証 | ブランド印象の第一接点 |
| スプラッシュ | アプリの世界観 |
| オンボーディング | 没入感 |
| ペイウォール | プレミアム感 |
| エラー/メンテナンス | ブランド一貫性 |

### 元画面の複製（比較ボード用）
```javascript
// セクションラベル
label=I("{masterBoardId}", {type: "text", content: "Background R1: {ロゴ美学キーワード}", fontSize: 20, fontWeight: "700", fontFamily: "Outfit", textColor: "#0F172A"})

// 候補行
row=I("{masterBoardId}", {type: "frame", name: "BG R1 Row", layout: "horizontal", gap: 30, width: "fill_container"})

// オリジナルをコピー
orig=C("{originalScreenId}", row, {name: "Original (Reference)"})
v1=C("{originalScreenId}", row, {name: "R1-A: {説明}"})
v2=C("{originalScreenId}", row, {name: "R1-B: {説明}"})
v3=C("{originalScreenId}", row, {name: "R1-C: {説明}"})
v4=C("{originalScreenId}", row, {name: "R1-D: {説明}"})
v5=C("{originalScreenId}", row, {name: "R1-E: {説明}"})
```

---

## Step 2: プロンプト設計（ロゴ美学の展開）

### ロゴ美学 → 背景への変換マトリクス

| ロゴの特徴 | 背景への展開 | プロンプトキーワード |
|-----------|------------|------------------|
| Particle ring | 浮遊するパーティクル空間 | `floating golden particles, scattered dots, cosmic dust` |
| Neural network | ニューラルネットワークの拡張 | `neural connections, flowing data lines, node network` |
| Twin symmetry | 対称的な双子構造 | `symmetrical twin lines, mirrored patterns, duality` |
| Topology mesh | 有機的なメッシュ | `organic mesh, flowing topology, interconnected web` |
| Golden accent | 金色のハイライト | `golden light trails, warm metallic accents` |
| Dark navy | 深い宇宙感 | `deep dark navy space, subtle star field, atmospheric depth` |

### プロンプトテンプレート
```
"{ロゴの主要要素} extending across dark background, atmospheric, mobile app wallpaper, {色指定}, subtle {動き/テクスチャ}, high quality, 4k"
```

### 5候補のプロンプト分散戦略
各候補で異なるアプローチを試す:

| 候補 | アプローチ | プロンプト例 |
|------|-----------|------------|
| A | ロゴ直接拡張 | ロゴと同じパーティクルリングを全画面に |
| B | 要素分散 | ロゴの構成要素を画面全体に散布 |
| C | 抽象化 | ロゴの色彩・質感だけを抽出 |
| D | 対称性/ツイン | ロゴのツイン要素を画面中央に |
| E | 動的表現 | アニメーション前提の流れるライン |

---

## Step 3: バリエーション生成

```javascript
// 各候補のスクリーンの最下層フレーム（または画面自体）に画像を適用
G(v1, "ai", "golden particle ring floating in dark navy space, cosmic atmosphere, premium mobile wallpaper")
G(v2, "ai", "scattered golden particles and teal dots on dark background, minimalist, elegant")
G(v3, "ai", "abstract topology mesh in dark navy, golden node connections, subtle depth")
G(v4, "ai", "centered particle ring glowing in dark space, golden and teal accents, atmospheric")
G(v5, "ai", "two neural lines meeting in center, twin symmetry, dark navy, gold accents, flowing")
```

---

## Step 4: image mode 修正（必須パターン）

### 問題
`G()` で生成された画像は、デフォルトで `mode: "fill"` または `mode: "stretch"` になる。
- `fill`: 画像の自然サイズで表示（tall フレームでは上部のみ表示される）
- `stretch`: 引き伸ばし（アスペクト比崩壊）
- `cover`: フレーム全体をカバー（**これが正解**）

### 修正パターン
**G() の直後に必ず U() で mode を修正:**
```javascript
G("{frameId}", "ai", "{prompt}")
U("{frameId}", {fills: [{type: "image", mode: "cover"}]})
```

### バッチ修正（複数候補を一括）
```javascript
U(v1, {fills: [{type: "image", mode: "cover"}]})
U(v2, {fills: [{type: "image", mode: "cover"}]})
U(v3, {fills: [{type: "image", mode: "cover"}]})
U(v4, {fills: [{type: "image", mode: "cover"}]})
U(v5, {fills: [{type: "image", mode: "cover"}]})
```

### 注意: mode 変更後に画像が消える場合
まれに fills の更新で画像参照が壊れることがある。その場合は G() で再生成。

---

## Step 5: UI要素の調整

### ロゴ非表示（背景にロゴが含まれる場合）
画面内にロゴボックスが別途ある場合、背景と重複するため非表示にする:
```javascript
U("{logoBoxId}", {width: 0, height: 0, overflow: "hidden"})
U("{spacerAboveLogoId}", {height: 0})
```

### テキストの垂直位置調整
背景画像の構図に合わせてテキスト位置を最適化:
```javascript
// パターン1: padding-top で位置制御（推奨）
U("{screenId}", {padding: [320, 32, 32, 32], mainAxisAlignment: "start"})

// パターン2: mainAxisAlignment で中央寄せ
U("{screenId}", {mainAxisAlignment: "center"})
```

**padding-top アプローチが推奨:**
- 背景画像の焦点位置に合わせて微調整しやすい
- `mainAxisAlignment: "center"` は全要素をグループとして中央寄せするため、
  ボタン群が画面下部から離れすぎる問題が起きやすい

---

## Step 6-7: 検証 + フィードバック + 反復

### スクリーンショット取得
```
mcp__pencil__get_screenshot(nodeId: "{rowId}")
```
候補行全体のスクリーンショットを取得してユーザーに提示。

### 反復ラウンドのパターン

| ラウンド | 典型的なフィードバック | 対応 |
|---------|-------------------|------|
| R1→R2 | 「R1-Eの方向が良い」 | R1-Eのスタイルを5バリエーション展開 |
| R2→R3 | 「もっと暗く」「ラインを細く」 | パラメータ調整 |
| R3 | 「R3-Bで決定」 | 決定処理へ |

### 方向転換時（R5, R6...）
初期コンセプトが合わない場合、ラウンド番号を継続しつつ新アプローチ:
```
R1-R3: パーティクル系 → ユーザー「方向が違う」
R4: 新コンセプト（グラデーション系）で再スタート
R5-R6: 最終調整
```

---

## Step 8: 決定・適用

### 元画面への適用
```javascript
// 決定した候補の画像を元画面に適用
// 方法1: G() で同じプロンプトで再生成（結果が異なる可能性あり）
// 方法2: 決定候補の画像ファイルパスを直接 fills に設定（推奨）
U("{originalScreenBgId}", {
  fills: [{
    type: "image",
    image: "./images/generated-{timestamp}.png",
    mode: "cover"
  }]
})
```

### 決定バッジ
```javascript
badge=I("{sectionId}", {type: "frame", fill: "#DCFCE7", cornerRadius: [8,8,8,8], padding: [6,12,6,12]})
badgeText=I(badge, {type: "text", content: "★ 決定: {候補名} {説明}", fontSize: 13, fontWeight: "600", fontFamily: "Outfit", textColor: "#166534"})
```

### アニメーション仕様ノート（背景アニメーションが想定される場合）
```javascript
animNote=I("{sectionId}", {
  type: "frame", fill: "#DBEAFE", cornerRadius: [8,8,8,8],
  padding: [10,12,10,12], layout: "vertical", gap: 4, width: 402
})
animTitle=I(animNote, {
  type: "text", content: "Animation Spec",
  fontSize: 13, fontWeight: "700", fontFamily: "Outfit", textColor: "#1E40AF"
})
animBody=I(animNote, {
  type: "text",
  content: "Library: react-native-reanimated + @shopify/react-native-skia\nDuration: 4-6s loop\nEasing: Easing.inOut\nElements: ライン = Path + SkiaのShader, パーティクル = Canvas dots\nreduced-motion: 静止画フォールバック",
  fontSize: 11, fontFamily: "Outfit", textColor: "#1E40AF", width: "fill_container"
})
```

### 決定履歴ノート
```javascript
historyNote=I("{sectionId}", {
  type: "frame", fill: "#DCFCE7", cornerRadius: [8,8,8,8],
  padding: [10,12,10,12], layout: "vertical", gap: 4, width: 402
})
historyTitle=I(historyNote, {
  type: "text", content: "Decision History",
  fontSize: 13, fontWeight: "700", fontFamily: "Outfit", textColor: "#166534"
})
historyBody=I(historyNote, {
  type: "text",
  content: "R1-R3: パーティクル系探索 → R4: 方向転換（ニューラル系） → R5: ライン美学\nR6-E 決定理由: 2本のラインがツイン感を表現、アニメーション化のイメージが明確",
  fontSize: 11, fontFamily: "Outfit", textColor: "#166534", width: "fill_container"
})
```

---

## 画像の再利用パターン

### 同じ画像を複数フレームに適用
決定した画像を他の画面（スプラッシュ、ペイウォール等）にも使う場合:

```javascript
// ファイルパスから直接設定
U("{targetFrameId}", {
  fills: [{
    type: "image",
    image: "./images/generated-{timestamp}.png",
    mode: "cover"
  }]
})
```

### 暗さ/明るさの調整
背景画像の上にテキストを載せる場合、オーバーレイで視認性を確保:

```javascript
overlay=I("{screenId}", {
  type: "frame",
  fill: "rgba(0,0,0,0.3)",
  width: "fill_container",
  height: "fill_container",
  position: "absolute",
  x: 0, y: 0
})
```

---

## トラブルシューティング

### Q: 画像が上部しか表示されない
**A:** `mode: "fill"` になっている。`U({fills: [{type: "image", mode: "cover"}]})` で修正。

### Q: 候補画面が元画面と横位置がずれる
**A:** Copy 時に `positionDirection: "right"` を使うか、横並び row 内に Copy する。

### Q: 画像生成が遅い/失敗する
**A:** ネットワーク状態を確認。再試行。プロンプトを短くする（長すぎると失敗しやすい）。

### Q: 決定画像を他の画面にも使いたいが同じ画像が出ない
**A:** AI生成は非決定的。画像ファイルパス (`./images/generated-*.png`) を使って直接 fills に設定。
