# Pencil MCP ツール詳細

> Source: https://docs.pencil.dev/for-developers/ai-integration

## 概要

Pencil は MCP（Model Context Protocol）サーバーとして動作し、AI エージェントにデザイン操作ツールを提供する。
Claude Code から直接デザインファイルを操作・分析できる。

## セットアップ

### Claude Code 統合
```json
// .mcp.json
{
  "mcpServers": {
    "pencil": {
      "command": "npx",
      "args": ["-y", "@nicepkg/pencil-mcp"]
    }
  }
}
```

### VS Code / Cursor 統合
Pencil 拡張機能をインストールすると、MCP サーバーが自動的に利用可能になる。

## ツール一覧

### 1. batch_design（操作）

要素の作成・修正・削除をバッチ処理する。複数操作を1回の呼び出しで実行できる。

#### 操作タイプ

| 操作 | 説明 |
|------|------|
| `create` | 新しい要素を作成 |
| `update` | 既存要素のプロパティを変更 |
| `delete` | 要素を削除 |

#### 使用例：画面の作成
```json
{
  "operations": [
    {
      "action": "create",
      "parentId": "root",
      "node": {
        "id": "login-frame",
        "type": "Frame",
        "name": "Login Screen",
        "width": 390,
        "height": 844,
        "layout": "vertical",
        "gap": 16,
        "padding": [60, 24, 24, 24],
        "fill": "#FFFFFF",
        "children": []
      }
    },
    {
      "action": "create",
      "parentId": "login-frame",
      "node": {
        "id": "login-title",
        "type": "Text",
        "content": "Welcome Back",
        "fontSize": 32,
        "fontWeight": 700,
        "fill": "#1A1A2E"
      }
    }
  ]
}
```

#### 使用例：プロパティ変更
```json
{
  "operations": [
    {
      "action": "update",
      "id": "login-frame",
      "properties": {
        "fill": "#F8F9FA",
        "gap": 24
      }
    }
  ]
}
```

#### 使用例：要素削除
```json
{
  "operations": [
    {
      "action": "delete",
      "id": "old-element"
    }
  ]
}
```

### 2. batch_get（読取）

デザイン構造を読み取る。指定したノードのプロパティと子要素を返す。

#### 使用例
```json
{
  "ids": ["login-frame"],
  "includeChildren": true,
  "depth": 3
}
```

#### レスポンス例
```json
{
  "nodes": [
    {
      "id": "login-frame",
      "type": "Frame",
      "name": "Login Screen",
      "width": 390,
      "height": 844,
      "children": [
        {
          "id": "login-title",
          "type": "Text",
          "content": "Welcome Back"
        }
      ]
    }
  ]
}
```

### 3. get_screenshot（分析）

デザインのプレビュー画像を取得する。現在のデザインの見た目を確認するために使用。

#### 使用例
```json
{
  "frameId": "login-frame",
  "scale": 2,
  "format": "png"
}
```

#### ユースケース
- デザイン変更後のビジュアル確認
- ユーザーへのデザインプレビュー提示
- レイアウト崩れの検出

### 4. snapshot_layout（分析）

レイアウト構造を検査する。要素の実際の配置位置、計算済みサイズ、マージン/パディングを返す。

#### 使用例
```json
{
  "frameId": "login-frame"
}
```

#### レスポンスに含まれる情報
- 各要素の計算済み座標 (x, y)
- 計算済みサイズ (width, height)
- レイアウトモード（vertical/horizontal/none）
- ギャップ・パディングの適用結果

### 5. get_editor_state（分析）

エディタの現在のコンテキスト情報を取得する。

#### 返される情報
- 開いているファイルのパス
- 選択中の要素ID
- 現在のズームレベル
- アクティブなテーマ
- 利用可能なコンポーネント一覧

#### ユースケース
- ユーザーが何を選択しているか確認
- 操作対象の特定
- 利用可能なコンポーネントの把握

### 6. get_variables（変数）

デザイントークン/テーマの現在値を取得する。

#### 使用例
```json
{
  "names": ["primary", "background", "spacing-md"]
}
```

#### レスポンス例
```json
{
  "variables": [
    {
      "name": "primary",
      "type": "color",
      "values": [
        { "theme": "light", "value": "#6C63FF" },
        { "theme": "dark", "value": "#8B83FF" }
      ]
    }
  ]
}
```

### 7. set_variables（変数）

デザイントークン/テーマの値を設定・更新する。

#### 使用例
```json
{
  "variables": [
    {
      "name": "primary",
      "type": "color",
      "values": [
        { "theme": "light", "value": "#6C63FF" },
        { "theme": "dark", "value": "#8B83FF" }
      ]
    },
    {
      "name": "spacing-lg",
      "type": "number",
      "values": [{ "value": 16 }]
    }
  ]
}
```

## AI プロンプトのベストプラクティス

### 具体的に指示する
```
NG: 「もっと良くして」
OK: 「パディングを16pxに増やして背景色を#6C63FFに変更」
```

### コンテキストを提供する
```
OK: 「ログインフォームを作成。メール入力、パスワード入力、
     ログインボタン、パスワード忘れリンクを含む。
     プライマリカラー #6C63FF、角丸8px」
```

### 既存コンポーネントを再利用する
```
OK: 「デザインシステムの Button コンポーネントを使って、
     ラベルを "Sign In" に変更」
```

### 段階的に進める
```
1. 「ログイン画面のフレーム構造を作成」
2. 「フォーム要素を追加」
3. 「スタイリングを調整」
4. 「ダークモード用の変数を設定」
```

### デザイントークンを活用する
```
OK: 「プライマリカラーは var:primary を使用。
     フォントサイズは heading (24px) で」
```

## トラブルシューティング

### MCP 接続エラー
1. Pencil 拡張機能が起動しているか確認
2. `.mcp.json` の設定を確認
3. `npx @nicepkg/pencil-mcp` が正常に実行できるか確認

### 要素が見つからない
- `batch_get` で現在のデザイン構造を確認
- `get_editor_state` で開いているファイルを確認
- ID のスペルミスを確認

### レイアウトが崩れる
- `snapshot_layout` で実際の配置を確認
- `layout` プロパティ（vertical/horizontal/none）を確認
- `sizing`（fixed/hug/fill）の設定を確認
- 親要素のサイズ制約を確認

### 変数が反映されない
- `get_variables` で現在値を確認
- 変数名が正しいか確認（`var:primary` 形式）
- テーマ切り替えが正しくされているか確認

## AltMe での典型的なワークフロー

### 1. 新画面のデザイン
```
get_editor_state → 現在の状態を確認
  ↓
get_variables → デザイントークンを確認
  ↓
batch_design (create) → フレーム構造を作成
  ↓
batch_design (create) → 子要素を追加
  ↓
get_screenshot → プレビューで確認
  ↓
batch_design (update) → 調整
```

### 2. 既存画面の修正
```
batch_get → 現在の構造を読み取り
  ↓
snapshot_layout → レイアウトを確認
  ↓
batch_design (update) → プロパティ変更
  ↓
get_screenshot → 変更結果を確認
```

### 3. デザイントークンの設定
```
get_variables → 現在のトークンを確認
  ↓
set_variables → 新しいトークンを設定
  ↓
batch_design (update) → 変数参照に切り替え
```
