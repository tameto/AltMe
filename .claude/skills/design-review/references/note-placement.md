# レビューノート配置 — Pencil MCP 操作手順書

> レビューノートをマスターボード内に正確に配置するための具体的な操作手順。
> 失敗パターンと対処法を含む。

---

## 前提知識

### なぜマスターボード内部に配置するのか

レビューノートは**キャンバスルートに浮遊させてはいけない**。

理由:
1. キャンバスルートに配置すると、マスターボードのレイアウト（vertical layout + gap）と独立してしまい、画面要素と重なる
2. マスターボード内部に配置すれば、`gap` プロパティで自動的にマージンが確保される
3. マスターボードのリサイズや移動に追従する

### 失敗パターン（実際に発生したもの）

| # | 失敗 | 原因 | 対処 |
|---|------|------|------|
| 1 | ノートが画面と重なる | キャンバスルートに配置し、y座標を画面の上に設定した | マスターボード内部に Insert する |
| 2 | ノートが画面から遠い | 右側（x:2810等）に配置して回避した | マスターボード内部の正しいインデックスに配置 |
| 3 | ノートと画面の横位置がずれる | ノート幅・gap が画面行と異なっていた | ノート幅=画面幅、gap=画面行gap に統一 |
| 4 | Move のバインディング解決失敗 | `M("nodeId", bindingName, index)` の parent に未解決のバインディングを使用 | Insert 後に別の batch_design コールで Move する |

---

## 操作手順

### Step 1: マスターボード構造の把握

```
mcp__pencil__batch_get:
  filePath: "{file}"
  nodeIds: ["{masterBoardId}"]
  readDepth: 2
```

取得結果から以下を記録:
- マスターボードの `id`, `layout`, `gap`, `padding`, `width`
- 子ノードの順序（セクションラベル → 画面行 の繰り返し）
- 各画面行の `gap`, 画面の `width`

**記録例:**
```
masterBoard: pGcAZ (layout: vertical, gap: 40, padding: 40, width: 2800)
children (順序):
  [0] oas1T — タイトル
  [1] Rfaex — サブタイトル
  [2] g4LNL — "認証" ラベル
  [3] SzeXM — 認証画面行 (gap: 30)
  [4] oRLTd — "オンボーディング" ラベル
  [5] FbMty — OB画面行 (gap: 30)
  [6] TUc3q — "ペイウォール" ラベル
  [7] 6Dk1q — PW画面行 (gap: 30)
  ...
```

### Step 2: 挿入位置の計算

ノート行は**セクションラベルの直後、画面行の直前**に挿入する。

```
[ラベル]  ← index N
[ノート行] ← 新規挿入 (index N+1)
[画面行]  ← 元の index N+1 → N+2 にズレる
```

**重要**: 挿入するたびにインデックスがズレるので、**上から順に挿入する**か、**全ノート行を一度に挿入してから Move で並べ替える**。

### Step 3: ノート行フレームの作成

各セクションに1つずつ horizontal frame を作成:

```javascript
// batch_design 操作（1セクション分）
noteRow=I("{masterBoardId}", {
  type: "frame",
  name: "Notes: {セクション名}",
  layout: "horizontal",
  gap: 30,           // ← 画面行の gap と同じ値
  width: "fill_container",
  height: "hug_contents"
})
```

**重要な値:**
- `gap`: 画面行の gap と完全一致させる（例: 30）
- `width`: `"fill_container"` でマスターボード幅に合わせる
- `layout`: `"horizontal"` で横並び

### Step 4: ノート行を正しい位置に移動

Insert はデフォルトで末尾に追加されるため、Move で正しい位置に移動:

```javascript
// 別の batch_design コールで実行（バインディング解決の問題を回避）
M("{noteRowId}", "{masterBoardId}", {targetIndex})
```

**targetIndex の算出:**
- 挿入前の子リストでラベルが index N にある場合、ノート行は index N+1 に移動
- 上から順に移動すると、先に移動したものがインデックスを押し下げるため注意
- **推奨**: 下のセクションから上に向かって移動する（インデックスのズレを最小化）

### Step 5: 個別ノートカードの挿入

各ノート行に、対応する画面の数だけノートカードを挿入:

```javascript
// batch_design 操作
note1=I("{noteRowId}", {
  type: "frame",
  name: "Note: {画面名}",
  fill: "#FEF9C3",        // カラーコードに応じた背景色
  cornerRadius: [8, 8, 8, 8],
  padding: [10, 12, 10, 12],  // 上右下左
  layout: "vertical",
  gap: 4,
  width: 402               // ← 画面幅と完全一致
})

// ノートカード内にテキストを追加
title1=I(note1, {
  type: "text",
  content: "{画面名}",
  fontSize: 13,
  fontWeight: "700",
  fontFamily: "Outfit",
  textColor: "#854D0E",    // カラーコードに応じたテキスト色
  width: "fill_container"
})

comment1=I(note1, {
  type: "text",
  content: "{プレフィックス} {コメント内容}",
  fontSize: 11,
  fontFamily: "Outfit",
  textColor: "#854D0E",
  width: "fill_container"
})
```

### Step 6: 配置検証

```
mcp__pencil__get_screenshot:
  filePath: "{file}"
  nodeId: "{masterBoardId}"
```

確認ポイント:
- [ ] ノート行が各画面行の直上に配置されている
- [ ] ノートと画面の横位置（左端）が揃っている
- [ ] ノート幅が画面幅と一致している
- [ ] ノート間の gap が画面間の gap と一致している
- [ ] マスターボードの gap (40px) でノート行と画面行の間に適切なマージンがある

---

## カラーコード別のノートカード作成

### Yellow（人間判断待ち）
```javascript
note=I("{noteRowId}", {
  type: "frame", fill: "#FEF9C3", cornerRadius: [8,8,8,8],
  padding: [10,12,10,12], layout: "vertical", gap: 4, width: 402
})
title=I(note, {type: "text", content: "{画面名}", fontSize: 13, fontWeight: "700", fontFamily: "Outfit", textColor: "#854D0E", width: "fill_container"})
comment=I(note, {type: "text", content: "...", fontSize: 11, fontFamily: "Outfit", textColor: "#854D0E", width: "fill_container"})
```

### Blue（UXコメント）
```javascript
note=I("{noteRowId}", {
  type: "frame", fill: "#DBEAFE", cornerRadius: [8,8,8,8],
  padding: [10,12,10,12], layout: "vertical", gap: 4, width: 402
})
title=I(note, {type: "text", content: "{画面名}", fontSize: 13, fontWeight: "700", fontFamily: "Outfit", textColor: "#1E40AF", width: "fill_container"})
comment=I(note, {type: "text", content: "...", fontSize: 11, fontFamily: "Outfit", textColor: "#1E40AF", width: "fill_container"})
```

### Green（修正済み/良好）
```javascript
note=I("{noteRowId}", {
  type: "frame", fill: "#DCFCE7", cornerRadius: [8,8,8,8],
  padding: [10,12,10,12], layout: "vertical", gap: 4, width: 402
})
title=I(note, {type: "text", content: "{画面名}", fontSize: 13, fontWeight: "700", fontFamily: "Outfit", textColor: "#166534", width: "fill_container"})
comment=I(note, {type: "text", content: "...", fontSize: 11, fontFamily: "Outfit", textColor: "#166534", width: "fill_container"})
```

### Purple（プラットフォーム/仕様）
```javascript
note=I("{noteRowId}", {
  type: "frame", fill: "#F3E8FF", cornerRadius: [8,8,8,8],
  padding: [10,12,10,12], layout: "vertical", gap: 4, width: 402
})
title=I(note, {type: "text", content: "{画面名}", fontSize: 13, fontWeight: "700", fontFamily: "Outfit", textColor: "#6B21A8", width: "fill_container"})
comment=I(note, {type: "text", content: "...", fontSize: 11, fontFamily: "Outfit", textColor: "#6B21A8", width: "fill_container"})
```

---

## 混合カラーノート（1枚のノートに複数カテゴリ）

1つの画面に対して複数カテゴリの指摘がある場合、**最も優先度の高いカテゴリの色**をカード背景にし、各コメントにプレフィックスアイコンで区別:

```javascript
note=I("{noteRowId}", {
  type: "frame", fill: "#FEF9C3", cornerRadius: [8,8,8,8],
  padding: [10,12,10,12], layout: "vertical", gap: 4, width: 402
})
title=I(note, {type: "text", content: "O-2 性格診断", fontSize: 13, fontWeight: "700", fontFamily: "Outfit", textColor: "#854D0E", width: "fill_container"})
c1=I(note, {type: "text", content: "✅ Big Fiveバー → 水平バーに修正済み", fontSize: 11, fontFamily: "Outfit", textColor: "#854D0E", width: "fill_container"})
c2=I(note, {type: "text", content: "❓ 戻るボタン: 診断リセット or 回答修正?", fontSize: 11, fontFamily: "Outfit", textColor: "#854D0E", width: "fill_container"})
c3=I(note, {type: "text", content: "🔵 質問UIをカード式スワイプに変更検討", fontSize: 11, fontFamily: "Outfit", textColor: "#854D0E", width: "fill_container"})
```

優先度順: Yellow（❓判断待ち） > Purple（🟣プラットフォーム） > Blue（🔵 UX） > Green（✅良好）

---

## バッチ操作の分割ガイドライン

### 25操作制限への対応

Pencil の batch_design は1回あたり最大25操作。ノート行+カード作成は操作数が多いため分割が必要。

**1ノートカード = 3操作**（frame + title + comment × N）

推奨分割:
1. **第1バッチ**: 全ノート行フレームの作成（5セクション = 5操作）
2. **第2バッチ**: ノート行の位置移動（5操作）
3. **第3バッチ以降**: 各ノート行にカードを挿入（1行あたり1バッチ）

### 例: 5セクション × 2-6画面

```
バッチ1: ノート行5つを作成 (5 ops)
バッチ2: 全ノート行を正しい位置に Move (5 ops)
バッチ3: 認証セクション (1画面 × 3ops = 3 ops)
バッチ4: OBセクション (4画面 × 3ops = 12 ops)
バッチ5: PWセクション (1画面 × 3ops = 3 ops)
バッチ6: タブ行1 (2画面 × 4ops = 8 ops)
バッチ7: タブ行2 (4画面 × 4ops = 16 ops)
バッチ8: モーダル行 (3画面 × 3ops = 9 ops)
```

---

## トラブルシューティング

### Q: Move 操作でバインディングが解決されない
**A**: Insert と Move を同じ batch_design 内で実行すると、Move の parent パラメータでバインディングが見つからないことがある。**別の batch_design コールに分ける**。

### Q: ノートが画面と重なって表示される
**A**: ノートがキャンバスルートに配置されていないか確認。`batch_get` でノートの parent が masterBoardId であることを確認。

### Q: ノート行の幅が画面行と合わない
**A**: ノート行の `width: "fill_container"` を確認。個別ノートカードの `width` が画面の width と一致しているか確認。

### Q: 挿入後にインデックスがずれる
**A**: **下のセクションから上に向かって** Move する。または全ノート行を一度に Insert してから、snapshot_layout で現在位置を確認し、Move で調整。
