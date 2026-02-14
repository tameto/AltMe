# .pen フォーマット技術仕様

> Source: https://docs.pencil.dev/for-developers/the-pen-format

## 概要

`.pen` ファイルは JSON 構造を含み、HTML/SVG ライクなオブジェクトツリーを記述する。
各オブジェクトは一意の `id` と `type` フィールドを持つ。

## ドキュメント構造

```json
{
  "version": 1,
  "variables": [...],
  "children": [
    {
      "id": "unique-id",
      "type": "Frame",
      "name": "Screen Name",
      "width": 390,
      "height": 844,
      "children": [...]
    }
  ]
}
```

## ノードタイプ詳細

### Rectangle
```json
{
  "id": "rect-1",
  "type": "Rectangle",
  "x": 0, "y": 0,
  "width": 200, "height": 100,
  "fill": "#6C63FF",
  "cornerRadius": 8
}
```
- `cornerRadius`: 単一値 or `[topLeft, topRight, bottomRight, bottomLeft]`

### Ellipse
```json
{
  "id": "ellipse-1",
  "type": "Ellipse",
  "x": 0, "y": 0,
  "width": 100, "height": 100,
  "innerRadiusRatio": 0,
  "startAngle": 0,
  "endAngle": 360
}
```

### Frame（最重要 — 画面/セクションのコンテナ）
```json
{
  "id": "frame-1",
  "type": "Frame",
  "name": "Login Screen",
  "width": 390, "height": 844,
  "layout": "vertical",
  "gap": 16,
  "padding": [24, 16, 24, 16],
  "justifyContent": "start",
  "alignItems": "center",
  "fill": "#FFFFFF",
  "children": [...]
}
```

### Text
```json
{
  "id": "text-1",
  "type": "Text",
  "content": "Hello World",
  "fontSize": 24,
  "fontWeight": 600,
  "fontFamily": "Inter",
  "fill": "#1A1A2E",
  "textAlign": "center",
  "lineHeight": 1.4
}
```

### Group
```json
{
  "id": "group-1",
  "type": "Group",
  "layout": "horizontal",
  "gap": 8,
  "children": [...]
}
```

### Path（SVG パス）
```json
{
  "id": "path-1",
  "type": "Path",
  "d": "M10 20 L30 40 Z",
  "fill": "#000000"
}
```

### Ref（コンポーネントインスタンス）
```json
{
  "id": "ref-1",
  "type": "Ref",
  "ref": "button-component-id",
  "descendants": {
    "button-label-id": {
      "content": "Custom Label"
    }
  }
}
```

### IconFont
```json
{
  "id": "icon-1",
  "type": "IconFont",
  "icon": "home",
  "fontSize": 24,
  "fill": "#6B7280"
}
```

## レイアウトプロパティ

```typescript
type Layout = "none" | "vertical" | "horizontal";
type JustifyContent = "start" | "center" | "end" | "space_between" | "space_around";
type AlignItems = "start" | "center" | "end";

// padding は複数形式対応
type Padding = number | [horizontal: number, vertical: number] | [top: number, right: number, bottom: number, left: number];
```

### サイジング
```typescript
type Sizing = "fixed" | "hug" | "fill";
// fixed: 固定サイズ
// hug: 子要素に合わせて縮小
// fill: 親要素いっぱいに拡張
```

## Fill タイプ

### 単色
```json
{ "fill": "#6C63FF" }
```

### グラデーション
```json
{
  "fill": {
    "type": "linear",
    "from": [0, 0],
    "to": [1, 1],
    "stops": [
      { "position": 0, "color": "#6C63FF" },
      { "position": 1, "color": "#4ECDC4" }
    ]
  }
}
```

### 画像
```json
{
  "fill": {
    "type": "image",
    "url": "data:image/png;base64,...",
    "fit": "cover"
  }
}
```

## Stroke プロパティ

```json
{
  "stroke": "#E5E7EB",
  "strokeThickness": 1,
  "strokeAlignment": "inside",
  "strokeJoin": "round",
  "strokeCap": "round"
}
```

- `strokeAlignment`: `"inside"` | `"center"` | `"outside"`
- `strokeThickness`: 単一値 or `[top, right, bottom, left]`

## Effects

### Shadow
```json
{
  "effects": [{
    "type": "shadow",
    "x": 0, "y": 4,
    "blur": 12,
    "spread": 0,
    "color": "rgba(0,0,0,0.1)"
  }]
}
```

### Blur
```json
{
  "effects": [{
    "type": "blur",
    "radius": 8
  }]
}
```

## コンポーネント定義

### メインコンポーネント
```json
{
  "id": "btn-main",
  "type": "Frame",
  "name": "Button",
  "reusable": true,
  "layout": "horizontal",
  "gap": 8,
  "padding": [12, 24],
  "fill": "#6C63FF",
  "cornerRadius": 8,
  "children": [
    {
      "id": "btn-label",
      "type": "Text",
      "content": "Button",
      "fill": "#FFFFFF",
      "fontSize": 16,
      "fontWeight": 600
    }
  ]
}
```

### インスタンス（Ref）
```json
{
  "id": "btn-instance-1",
  "type": "Ref",
  "ref": "btn-main",
  "descendants": {
    "btn-label": {
      "content": "Sign In"
    }
  }
}
```

### スロット
```json
{
  "id": "card-slot",
  "type": "Frame",
  "slot": ["recommended-component-id"],
  "children": [...]
}
```

## 変数定義

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
      "name": "spacing-md",
      "type": "number",
      "values": [
        { "value": 12 }
      ]
    }
  ]
}
```

変数参照: `"fill": "var:primary"`

## 共通プロパティ

全ノードタイプに適用可能:
```typescript
{
  id: string;           // 一意のID
  type: string;         // ノードタイプ
  name?: string;        // 表示名
  x?: number;           // X座標
  y?: number;           // Y座標
  width?: number;       // 幅
  height?: number;      // 高さ
  opacity?: number;     // 不透明度 (0-1)
  rotation?: number;    // 回転角度
  visible?: boolean;    // 表示/非表示
  locked?: boolean;     // ロック状態
}
```
