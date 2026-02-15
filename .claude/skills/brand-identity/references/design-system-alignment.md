# デザインシステム整合 ワークフロー詳細

> ブランドアイデンティティ（ロゴ・背景・テキスト）からデザインシステム変数への
> マッピングと一括更新の完全手順。

---

## 全体フロー

```
Step 1: 現行DS変数の取得 + 分析
Step 2: ブランド要素の抽出
Step 3: マッピングテーブル作成
Step 4: 変数の一括更新（set_variables）
Step 5: コンポーネント横断プロパティ置換（replace_all_matching_properties）
Step 6: スクリーンショット検証
Step 7: design-tokens.md の更新
```

---

## Step 1: 現行DS変数の取得

```
mcp__pencil__get_variables(filePath: "{file}")
```

### 取得結果の分析ポイント
| カテゴリ | チェック項目 |
|---------|------------|
| カラー | --primary, --background, --foreground, --accent |
| テーマ | Light/Dark モードの対応 |
| フォント | --font-primary, --font-secondary |
| 角丸 | --radius-m, --radius-pill |
| 影 | --shadow-subtle |

### 変数のテーマ構造を理解
```json
{
  "--primary": {
    "type": "color",
    "value": [
      {"value": "#7C3AED"},                    // Light モード
      {"theme": {"Mode": "Dark"}, "value": "#9461FB"}  // Dark モード
    ]
  }
}
```

---

## Step 2: ブランド要素の抽出

Phase 1-3 で確定した要素をまとめる:

### ブランドカラーパレット（例: AltMe）
| 役割 | 色 | 出典 |
|------|------|------|
| ブランドゴールド | #D4A853 | ロゴのパーティクルリング |
| ブランドティール | #7DD3FC | ロゴのセカンダリカラー |
| ダークネイビー | #0F172A | 背景画像の基調色 |
| ディープスレート | #1E293B | カード/UI要素のダーク背景 |
| ウォームホワイト | #F8FAFC | テキスト基本色 |
| ミュートシルバー | #94A3B8 | セカンダリテキスト |

### タイポグラフィ
| 役割 | 値 | 出典 |
|------|------|------|
| プライマリフォント | Outfit | テキストデザインで決定 |
| タイトルウェイト | 300 (Light) | テキストデザインで決定 |
| 本文ウェイト | 400 (Regular) | 標準 |
| レタースペーシング | 2-3 (タイトル) | テキストデザインで決定 |

---

## Step 3: マッピングテーブル作成

### カラーマッピング

| DS変数 | 旧値 (Light) | 旧値 (Dark) | 新値 (Light) | 新値 (Dark) | 根拠 |
|--------|------------|------------|-------------|-------------|------|
| `--primary` | #7C3AED | #9461FB | #D4A853 | #FBBF24 | ブランドゴールド |
| `--primary-foreground` | #FFFFFF | #FFFFFF | #0F172A | #0F172A | ダーク背景上のコントラスト |
| `--background` | #F5F4F1 | #111111 | #F8FAFC | #0F172A | ブランドの背景色 |
| `--foreground` | #1A1918 | #FFFFFF | #0F172A | #F8FAFC | ブランドのテキスト色 |
| `--card` | #FFFFFF | #1A1A1A | #FFFFFF | #1E293B | カード背景 |
| `--accent` | #F2F3F0 | #111111 | #FEF3C7 | #1E293B | ゴールド系アクセント |
| `--accent-foreground` | #111111 | #F2F3F0 | #854D0E | #FBBF24 | アクセント上テキスト |
| `--muted` | #F2F3F0 | #2E2E2E | #F1F5F9 | #334155 | ミュート背景 |
| `--muted-foreground` | #666666 | #B8B9B6 | #64748B | #94A3B8 | ミュートテキスト |
| `--border` | #E5E4E1 | #2E2E2E | #E2E8F0 | #334155 | ボーダー色 |
| `--destructive` | #D93C15 | #FF5C33 | #EF4444 | #F87171 | エラー/削除 |
| `--accent-green` | #3D8A5A | - | #22C55E | - | 成功色 |

### フォントマッピング

| DS変数 | 旧値 | 新値 | 根拠 |
|--------|------|------|------|
| `--font-primary` | JetBrains Mono → Outfit | Outfit | ブランドフォント |
| `--font-secondary` | Geist → Outfit | Outfit | 統一 |

### 新規変数（追加）

| 変数名 | 値 | 用途 |
|--------|------|------|
| `--brand-gold` | #D4A853 | ブランドゴールド（直接参照用） |
| `--brand-teal` | #7DD3FC | ブランドティール |
| `--brand-navy` | #0F172A | ブランドネイビー |

---

## Step 4: 変数の一括更新

```
mcp__pencil__set_variables(
  filePath: "{file}",
  variables: {
    "--primary": {
      "type": "color",
      "value": [
        {"value": "#D4A853"},
        {"theme": {"Mode": "Dark"}, "value": "#FBBF24"}
      ]
    },
    "--primary-foreground": {
      "type": "color",
      "value": [
        {"value": "#0F172A"},
        {"theme": {"Mode": "Dark"}, "value": "#0F172A"}
      ]
    },
    "--background": {
      "type": "color",
      "value": [
        {"value": "#F8FAFC"},
        {"theme": {"Mode": "Dark"}, "value": "#0F172A"}
      ]
    },
    "--foreground": {
      "type": "color",
      "value": [
        {"value": "#0F172A"},
        {"theme": {"Mode": "Dark"}, "value": "#F8FAFC"}
      ]
    },
    "--font-primary": {
      "type": "string",
      "value": "Outfit"
    },
    "--font-secondary": {
      "type": "string",
      "value": "Outfit"
    },
    "--brand-gold": {
      "type": "color",
      "value": "#D4A853"
    },
    "--brand-teal": {
      "type": "color",
      "value": "#7DD3FC"
    },
    "--brand-navy": {
      "type": "color",
      "value": "#0F172A"
    }
  }
)
```

### 注意: テーマ軸の自動登録
存在しないテーマ軸（例: `{"Mode": "Dark"}`）は自動的に登録される。
既存のテーマ構造を壊さないよう、`replace: false`（デフォルト）でマージする。

---

## Step 5: コンポーネント横断プロパティ置換

### 全コンポーネントIDの取得
```
mcp__pencil__batch_get(
  filePath: "{file}",
  patterns: [{reusable: true}],
  searchDepth: 1
)
```

### フォント一括置換
```
mcp__pencil__replace_all_matching_properties(
  filePath: "{file}",
  parents: ["{全コンポーネントIDの配列}"],
  properties: {
    fontFamily: [
      {from: "JetBrains Mono", to: "Outfit"},
      {from: "Geist", to: "Outfit"},
      {from: "Inter", to: "Outfit"}
    ]
  }
)
```

### カラー置換
```
mcp__pencil__replace_all_matching_properties(
  filePath: "{file}",
  parents: ["{全コンポーネントIDの配列}"],
  properties: {
    fillColor: [
      {from: "#7C3AED", to: "#D4A853"},
      {from: "#9461FB", to: "#FBBF24"}
    ],
    textColor: [
      {from: "#1A1918", to: "#0F172A"},
      {from: "#6D6C6A", to: "#64748B"}
    ]
  }
)
```

### search_all_unique_properties で置換漏れを確認
```
mcp__pencil__search_all_unique_properties(
  filePath: "{file}",
  parents: ["{全コンポーネントIDの配列}"],
  properties: ["fontFamily", "fillColor", "textColor"]
)
```

旧値が残っていれば追加で replace_all_matching_properties を実行。

---

## Step 6: スクリーンショット検証

### 検証対象コンポーネント（優先順位）
1. **Button** — primary, secondary, destructive, outline, ghost
2. **Card** — 背景色、テキスト色、ボーダー
3. **Input** — ボーダー、プレースホルダー色
4. **Modal** — オーバーレイ、カード背景
5. **Alert** — 各種状態（info, warning, error, success）
6. **Tabs** — アクティブ/非アクティブ色

```
mcp__pencil__get_screenshot(filePath: "{file}", nodeId: "{buttonComponentId}")
mcp__pencil__get_screenshot(filePath: "{file}", nodeId: "{cardComponentId}")
```

### 視覚的チェックリスト
- [ ] Primary ボタンの色がブランドカラーに変更されている
- [ ] テキスト色がブランドフォントに変更されている
- [ ] コントラスト比が十分（4.5:1以上）
- [ ] ダークモードでもコンポーネントが正しく表示される
- [ ] アクセントカラーが統一されている

---

## Step 7: design-tokens.md の更新

既存の `design-tokens.md` を更新して仕様書と実装を同期:

### 更新箇所
1. カラーパレット（背景色、テキスト色、アクセント色）
2. タイポグラフィ（fontFamily、fontWeight スケール）
3. 新規追加トークン（brand-gold, brand-teal, brand-navy）

### テンプレート
```markdown
## カラーパレット

### ブランドカラー
| トークン名 | 値 | 用途 |
|-----------|------|------|
| Brand Gold | `#D4A853` | アクセント、CTA、プレミアム要素 |
| Brand Teal | `#7DD3FC` | セカンダリアクセント、リンク |
| Brand Navy | `#0F172A` | ヘッダー、ダーク背景 |

### 背景色 (fillColor)
...（既存テーブルを更新）

### テキスト色 (textColor)
...（既存テーブルを更新）
```

---

## トラブルシューティング

### Q: set_variables で既存の変数が消えた
**A:** `replace: true` を使った可能性。`replace: false`（デフォルト）でマージモードを使う。

### Q: replace_all_matching_properties が効かない
**A:**
1. 親IDの配列に全対象が含まれているか確認
2. `from` の値が完全一致しているか確認（大文字小文字、スペース）
3. 変数参照（$--primary 等）はプロパティ値として直接一致しない

### Q: コンポーネントが変数参照を使っている場合
**A:** 変数参照 (`$--primary` 等) を使っているコンポーネントは、
`set_variables` で変数値を更新すれば自動的に反映される。
`replace_all_matching_properties` は不要。

### Q: ダークモードの確認方法
**A:** `get_variables` で取得したテーマ定義を確認。
Pencil のエディタ内でテーマを切り替えてスクリーンショットを取得。
