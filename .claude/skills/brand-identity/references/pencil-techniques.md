# Pencil MCP 技術パターン集

> ブランドアイデンティティ設計で頻出する Pencil MCP 固有の技術パターン。
> 実際のセッションで検出・解決したパターンを蓄積。

---

## パターン1: G() 後の image mode 修正（最重要）

### 問題
`G()` で AI画像を生成した後、画像の表示モードがフレームサイズに合わない。

| デフォルト mode | 動作 | 問題 |
|---------------|------|------|
| `fill` | 画像の自然サイズで表示 | 高さのあるフレームでは上部のみ表示 |
| `stretch` | フレームに引き伸ばし | アスペクト比が崩壊 |

### 解決策
**G() の直後に必ず U() で `mode: "cover"` を設定:**

```javascript
// 画像生成
G("{frameId}", "ai", "{prompt}")

// 必ずセットで実行
U("{frameId}", {fills: [{type: "image", mode: "cover"}]})
```

### mode の種類
| mode | 動作 | 用途 |
|------|------|------|
| `fill` | 自然サイズ、クロップなし | 正方形フレーム |
| `cover` | フレーム全体をカバー | 背景画像（推奨） |
| `stretch` | 引き伸ばし | 非推奨 |
| `fit` | 全体が見えるようフィット | サムネイル |

### バッチ修正テンプレート
5候補を一括修正:
```javascript
U("{v1}", {fills: [{type: "image", mode: "cover"}]})
U("{v2}", {fills: [{type: "image", mode: "cover"}]})
U("{v3}", {fills: [{type: "image", mode: "cover"}]})
U("{v4}", {fills: [{type: "image", mode: "cover"}]})
U("{v5}", {fills: [{type: "image", mode: "cover"}]})
```

---

## パターン2: Clip技法（画像のクロップ）

### 用途
- テキスト入りロゴから文字部分を除去
- 画像の特定部分だけを表示
- 画像の位置を微調整

### 仕組み
```
┌─────────────────┐ ← 親フレーム (clip: true, layout: "none")
│  ┌───────────┐  │
│  │           │  │    ← 子フレーム (oversized, x/y offset)
│  │  [Ring]   │  │       画像はこのフレームに設定
│  │           │  │
│  │  [AltMe]  │← │    ← テキスト部分は親フレームの外に
│  └───────────┘  │
└─────────────────┘
     ↑ 枠外の部分はクリップされる
```

### 実装パターン
```javascript
// Step 1: 親フレームを clip コンテナに変換
U("{parentFrameId}", {
  clip: true,
  layout: "none",    // 重要: auto layout を解除
  width: 160,
  height: 160
})

// Step 2: オーバーサイズの子フレームを挿入
innerFrame=I("{parentFrameId}", {
  type: "frame",
  width: 200,        // 親より大きい
  height: 200,
  x: -20,            // 左にオフセット（テキストの位置に応じて調整）
  y: -12             // 上にオフセット
})

// Step 3: 子フレームに画像を設定
G(innerFrame, "ai", "{prompt}")
// または
U(innerFrame, {fills: [{type: "image", image: "{filePath}", mode: "cover"}]})
```

### サイズ別パラメータ計算式
```
子フレームサイズ = 親フレームサイズ × 1.25
x offset = -(親フレームサイズ × 0.125)
y offset = -(親フレームサイズ × 0.075)
```

| 親サイズ | 子サイズ | x | y |
|---------|--------|-----|-----|
| 160px | 200x200 | -20 | -12 |
| 80px | 100x100 | -10 | -6 |
| 40px | 50x50 | -5 | -3 |
| 120px | 150x150 | -15 | -9 |

**注意:** これらは基本値。テキストの位置・サイズに応じて微調整が必要。
スクリーンショットで確認しながら x/y を調整。

---

## パターン3: テキストノードの色は `fill` を使う

### 問題
Pencil のテキストノードで `textColor` プロパティを設定しても色が反映されない場合がある。

### 解決策
テキストの色は **`fill`** プロパティを使う:

```javascript
// 正しい（色が反映される）
U("{textNodeId}", {fill: "#D4A853"})

// 効かない場合がある
U("{textNodeId}", {textColor: "#D4A853"})
```

### 使い分け
| プロパティ | 対象 | 用途 |
|-----------|------|------|
| `fill` | text ノード | テキストの色を設定 |
| `textColor` | text ノード | 一部のコンテキストでのみ動作 |
| `fill` | frame/rectangle | 背景色を設定 |
| `fillColor` | 検索/置換 | search_all_unique_properties で使用 |

---

## パターン4: 比較ボードのレイアウト

### 基本構造
```javascript
// セクションラベル
label=I("{masterBoardId}", {
  type: "text",
  content: "{Section Title}",
  fontSize: 20,
  fontWeight: "700",
  fontFamily: "Outfit",
  textColor: "#0F172A"
})

// 候補行
row=I("{masterBoardId}", {
  type: "frame",
  name: "{Row Name}",
  layout: "horizontal",
  gap: 30,
  width: "fill_container"
})
```

### 候補フレームのサイズ規約
| 候補タイプ | サイズ | cornerRadius |
|-----------|--------|-------------|
| ロゴ候補 | 160x160 | [20,20,20,20] |
| アプリアイコン | 80x80 | [16,16,16,16] |
| 画面候補 | 402x874 | [0,0,0,0] or [20,20,20,20] |
| カラーサンプル | 200x120 | [8,8,8,8] |
| テキストサンプル | 200x120 | [8,8,8,8] |

### gap の使い分け
| コンテキスト | gap |
|-------------|-----|
| ロゴ候補間 | 30 |
| 画面候補間 | 30 |
| カラーサンプル間 | 16-20 |
| テキストサンプル間 | 16-20 |
| セクション間（マスターボード gap） | 40 |

---

## パターン5: 画面コピーとバリエーション

### Copy (C) を使った画面複製
```javascript
variant=C("{originalScreenId}", "{parentRow}", {
  name: "{バリエーション名}",
  positionDirection: "right",  // 右に配置
  positionPadding: 30          // 30px のマージン
})
```

### 複製後の要素変更
**重要:** Copy 後に descendants を変更する場合、Copy 操作内の `descendants` マップを使う。
別の U() で子ノードIDを指定すると、IDが変わっているため失敗する。

```javascript
// 正しい: descendants マップを使用
variant=C("{screenId}", "{row}", {
  name: "Variant",
  descendants: {
    "{childId}": {fill: "#D4A853"}
  }
})

// 危険: Copy 後の U() は子ノードIDが変わっている可能性
// variant=C(...)
// U(variant+"/childId", {...})  // パスベースなら動作する
```

### resolveInstances で構造確認
Copy 後の内部構造を確認する場合:
```
mcp__pencil__batch_get(
  nodeIds: ["{copiedNodeId}"],
  readDepth: 3,
  resolveInstances: true
)
```

---

## パターン6: 要素の非表示

### width/height を 0 に設定
```javascript
U("{elementId}", {width: 0, height: 0, overflow: "hidden"})
```

### visibility (利用可能な場合)
```javascript
U("{elementId}", {visible: false})
```

### overflow と clip の違い
| プロパティ | 動作 |
|-----------|------|
| `overflow: "hidden"` | 子要素が親の範囲外に出ない |
| `clip: true` | 親フレームの境界で子要素をクリップ |
| `visible: false` | 要素自体を非表示 |

---

## パターン7: 決定バッジ・ノートの標準テンプレート

### 決定バッジ（Green）
```javascript
badge=I("{parentId}", {
  type: "frame",
  fill: "#DCFCE7",
  cornerRadius: [8,8,8,8],
  padding: [6,12,6,12],
  layout: "horizontal",
  gap: 6
})
badgeText=I(badge, {
  type: "text",
  content: "★ {決定内容}",
  fontSize: 13,
  fontWeight: "600",
  fontFamily: "Outfit",
  textColor: "#166534"
})
```

### 情報ノート（Blue）
```javascript
note=I("{parentId}", {
  type: "frame",
  fill: "#DBEAFE",
  cornerRadius: [8,8,8,8],
  padding: [10,12,10,12],
  layout: "vertical",
  gap: 4,
  width: 402
})
noteTitle=I(note, {
  type: "text",
  content: "{ノートタイトル}",
  fontSize: 13,
  fontWeight: "700",
  fontFamily: "Outfit",
  textColor: "#1E40AF"
})
noteBody=I(note, {
  type: "text",
  content: "{ノート内容}",
  fontSize: 11,
  fontFamily: "Outfit",
  textColor: "#1E40AF",
  width: "fill_container"
})
```

### 仕様カード（White/Bordered）
```javascript
spec=I("{parentId}", {
  type: "frame",
  fill: "#F8FAFC",
  cornerRadius: [12,12,12,12],
  padding: [16,20,16,20],
  layout: "vertical",
  gap: 8,
  width: 402,
  stroke: [{color: "#E2E8F0"}],
  strokeThickness: 1
})
```

---

## パターン8: batch_design の操作数管理

### 25操作制限
1回の `batch_design` で最大25操作。

### 操作数の目安
| 操作 | 1つあたりの ops |
|------|---------------|
| 候補フレーム + 画像生成 | 2 ops (I + G) |
| 候補フレーム + 画像生成 + mode修正 | 3 ops (I + G + U) |
| 決定バッジ | 2 ops (I + I) |
| 情報ノート（タイトル+本文） | 3 ops (I + I + I) |
| テキストサンプル（背景+テキスト+ラベル） | 3 ops |

### 推奨分割パターン
```
バッチ1: セクションラベル + 候補行 + 5候補フレーム (7 ops)
バッチ2: 5候補の画像生成 (5 ops)
バッチ3: 5候補の mode 修正 (5 ops)
バッチ4: 決定バッジ + ノート類 (5-10 ops)
```

---

## トラブルシューティング集

### Q: G() で生成された画像が真っ白/透明
**A:** AI画像サーバーの一時的な問題。再度 G() を実行。

### Q: U() で fills を更新したら画像が消えた
**A:** fills 配列全体が置換される。画像の fills を更新する場合は、
image プロパティを含めた完全な fills オブジェクトを指定:
```javascript
U("{id}", {fills: [{type: "image", image: "{path}", mode: "cover"}]})
```

### Q: Copy 後に子ノードの U() が効かない
**A:** Copy で子ノードのIDが変更される。パスベース（`copiedId+"/childName"`）で
アクセスするか、`descendants` マップを Copy 時に指定。

### Q: バインディング名が解決されない
**A:** Insert と Move を同じ batch_design 内で実行すると、
Move の parent パラメータでバインディングが見つからない。
別の batch_design コールに分ける。

### Q: テキストの色が変わらない
**A:** `fill` プロパティを使う（`textColor` ではなく）。
```javascript
U("{textId}", {fill: "#D4A853"})
```

### Q: letterSpacing が反映されない
**A:** テキストノードに直接設定:
```javascript
U("{textId}", {letterSpacing: 3})
```
