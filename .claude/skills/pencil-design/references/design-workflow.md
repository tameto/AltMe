# デザインワークフロー

> AltMe における仕様書 → デザイン → コードのパイプライン

## 全体フロー

```
仕様書 (specs/)          → Pencil デザイン (designs/)      → コード (src/)
  │                            │                               │
  ├── features/*.md            ├── components.pen              ├── shared/components/
  ├── screens/*.md             ├── onboarding.pen              ├── features/*/
  └── api/*.md                 ├── chat.pen                    └── app/*/
                               ├── journal.pen
                               ├── settings.pen
                               ├── paywall.pen
                               └── variables.pen
```

## Step 1: 仕様書からデザインへ

### インプット
- `specs/screens/*.md` — 画面仕様書（情報アーキテクチャ、状態遷移、コンポーネント構成）
- `specs/features/*.md` — 機能仕様書（ユーザーストーリー、受け入れ条件）
- `specs/shared/navigation.md` — ナビゲーション構造

### プロセス
1. 仕様書から画面の構成要素を抽出
2. 情報の優先順位に従ってレイアウトを設計
3. デザインシステムのトークンとコンポーネントを適用
4. 各状態（Default/Loading/Empty/Error/Disabled）をデザイン

### チェックリスト
- [ ] 仕様書の全要素がデザインに含まれているか
- [ ] 全状態がデザインされているか
- [ ] デザインシステムのトークンを使用しているか
- [ ] アクセシビリティ要件を満たしているか（コントラスト比、タップサイズ）
- [ ] ナビゲーション遷移が仕様書と一致しているか

## Step 2: デザインファイルの作成

### ファイル構成
```
designs/
├── variables.pen        # デザイントークン定義（最初に作成）
├── components.pen       # 共通コンポーネント（Button, Input, Card 等）
├── onboarding.pen       # オンボーディング画面群
├── chat.pen             # チャット画面
├── journal.pen          # 日記画面
├── settings.pen         # 設定画面
└── paywall.pen          # ペイウォール画面
```

### 作成順序
1. **variables.pen** — デザイントークン定義
2. **components.pen** — 共通コンポーネント定義（`reusable: true`）
3. **各画面.pen** — コンポーネントを `Ref` で参照して画面構築

### デザイントークン（variables.pen）
```json
{
  "variables": [
    { "name": "primary", "type": "color", "values": [
      { "theme": "light", "value": "#6C63FF" },
      { "theme": "dark", "value": "#8B83FF" }
    ]},
    { "name": "secondary", "type": "color", "values": [
      { "theme": "light", "value": "#4ECDC4" },
      { "theme": "dark", "value": "#6EE7DE" }
    ]},
    { "name": "background", "type": "color", "values": [
      { "theme": "light", "value": "#FFFFFF" },
      { "theme": "dark", "value": "#1A1A2E" }
    ]},
    { "name": "surface", "type": "color", "values": [
      { "theme": "light", "value": "#F8F9FA" },
      { "theme": "dark", "value": "#2D2D44" }
    ]},
    { "name": "text", "type": "color", "values": [
      { "theme": "light", "value": "#1A1A2E" },
      { "theme": "dark", "value": "#F8F9FA" }
    ]},
    { "name": "textSecondary", "type": "color", "values": [
      { "theme": "light", "value": "#6B7280" },
      { "theme": "dark", "value": "#9CA3AF" }
    ]},
    { "name": "error", "type": "color", "values": [{ "value": "#EF4444" }] },
    { "name": "success", "type": "color", "values": [{ "value": "#10B981" }] },
    { "name": "warning", "type": "color", "values": [{ "value": "#F59E0B" }] },
    { "name": "spacing-xs", "type": "number", "values": [{ "value": 4 }] },
    { "name": "spacing-sm", "type": "number", "values": [{ "value": 8 }] },
    { "name": "spacing-md", "type": "number", "values": [{ "value": 12 }] },
    { "name": "spacing-lg", "type": "number", "values": [{ "value": 16 }] },
    { "name": "spacing-xl", "type": "number", "values": [{ "value": 24 }] },
    { "name": "spacing-xxl", "type": "number", "values": [{ "value": 32 }] }
  ]
}
```

### 共通コンポーネント例（components.pen）

#### Button コンポーネント
```json
{
  "id": "btn-primary",
  "type": "Frame",
  "name": "Button/Primary",
  "reusable": true,
  "layout": "horizontal",
  "justifyContent": "center",
  "alignItems": "center",
  "gap": 8,
  "padding": [14, 24],
  "fill": "var:primary",
  "cornerRadius": 12,
  "widthSizing": "fill",
  "children": [
    {
      "id": "btn-primary-label",
      "type": "Text",
      "content": "Button",
      "fontSize": 16,
      "fontWeight": 600,
      "fill": "#FFFFFF"
    }
  ]
}
```

#### Input コンポーネント
```json
{
  "id": "input-default",
  "type": "Frame",
  "name": "Input/Default",
  "reusable": true,
  "layout": "vertical",
  "gap": 6,
  "widthSizing": "fill",
  "children": [
    {
      "id": "input-label",
      "type": "Text",
      "content": "Label",
      "fontSize": 14,
      "fontWeight": 500,
      "fill": "var:text"
    },
    {
      "id": "input-field",
      "type": "Frame",
      "layout": "horizontal",
      "padding": [12, 16],
      "fill": "var:surface",
      "cornerRadius": 8,
      "stroke": "#E5E7EB",
      "strokeThickness": 1,
      "widthSizing": "fill",
      "children": [
        {
          "id": "input-placeholder",
          "type": "Text",
          "content": "Placeholder",
          "fontSize": 16,
          "fill": "var:textSecondary"
        }
      ]
    }
  ]
}
```

## Step 3: デザイン → コード変換

### 変換プロセス
1. Pencil 内で `Cmd/Ctrl + K` → コード生成プロンプト
2. AI がデザインから React Native コンポーネントを生成
3. 生成されたコードを `src/` 配下に配置
4. 手動で状態管理・データバインディングを追加

### 変換ルール
| Pencil | React Native |
|--------|-------------|
| `Frame (layout: vertical)` | `<View style={{ flexDirection: 'column' }}>` |
| `Frame (layout: horizontal)` | `<View style={{ flexDirection: 'row' }}>` |
| `Text` | `<Text>` |
| `Rectangle (cornerRadius)` | `<View style={{ borderRadius }}>` |
| `IconFont` | `<MaterialIcons>` |
| `Ref` | カスタムコンポーネントの使用 |
| `var:primary` | `theme.colors.primary` |

### コード配置
```
Pencil コンポーネント → src/shared/components/
  Button/Primary      → button.tsx
  Input/Default       → text-input.tsx
  Card                → card.tsx

Pencil 画面          → app/(tabs)/ or app/(auth)/ etc.
  Login Screen        → app/(auth)/login.tsx
  Chat Screen         → app/(tabs)/index.tsx
```

## Step 4: Figma からのインポート

### 手順
1. Figma でフレームを選択 → `Cmd/Ctrl + C` でコピー
2. Pencil エディタにペースト（`Cmd/Ctrl + V`）
3. 自動的に `.pen` 形式に変換
4. 画像は手動で再インポートが必要

### 注意点
- Figma のオートレイアウトは Pencil のレイアウトに変換される
- コンポーネントのインスタンス関係は保持されない（フラット化される）
- テキストスタイルは個別プロパティに展開される
- バリアントは個別コンポーネントとしてインポートされる

## Step 5: デザインレビュー

### レビューチェックリスト

#### ビジュアル
- [ ] カラーがデザイントークンを使用しているか
- [ ] フォントサイズがタイポグラフィスケールに準拠しているか
- [ ] スペーシングがスケールに準拠しているか（4/8/12/16/24/32）
- [ ] アイコンサイズが統一されているか
- [ ] シャドウ・角丸が統一されているか

#### レイアウト
- [ ] レスポンシブ対応（iPhone SE〜iPhone 15 Pro Max）
- [ ] セーフエリアが考慮されているか
- [ ] スクロール可能な領域が正しく設定されているか
- [ ] キーボード表示時のレイアウト

#### アクセシビリティ
- [ ] コントラスト比 4.5:1 以上
- [ ] タップターゲット 44pt 以上
- [ ] テキストの最小サイズ 12pt
- [ ] カラーだけに依存しない情報表示

#### 状態網羅
- [ ] Default 状態
- [ ] Loading 状態
- [ ] Empty 状態
- [ ] Error 状態
- [ ] Disabled 状態（該当する場合）

## Step 6: Reconcile（実装後の同期）

実装完了後、デザインと実装の差分を検出して同期する。

### デザイン → コード差分
- デザイン上のスペーシング・カラーが実装と一致しているか
- コンポーネント構成がデザイン通りか
- 新しく追加されたUI要素がデザインに反映されているか

### コード → デザイン更新
- 実装時に追加された状態をデザインに反映
- パフォーマンス上の理由でUIを変更した場合、デザインも更新
- A/Bテスト用のバリエーションをデザインに追加

### 仕様書更新
- デザイン変更に伴う仕様書の更新
- `specs/screens/*.md` にデザインファイルパスを追記
