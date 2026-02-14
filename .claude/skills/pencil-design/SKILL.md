---
name: pencil-design
description: |
  Pencil デザインツール統合スキル。
  IDE内で動作するベクターデザインツール Pencil を使用した画面設計、コンポーネント作成、デザイン↔コード同期を担当。
  MCP経由でAIからデザインファイル(.pen)を直接操作できる。
  トリガー: Pencil, .pen, デザイン作成, 画面デザイン, UIデザイン, コンポーネントデザイン, デザイントークン, デザインシステム
---

# Pencil Design Tool スキル

> Pencil: IDE統合型ベクターデザインツール。デザインとコードを同一環境で管理する。

**公式ドキュメント**: https://docs.pencil.dev/

## 概要

Pencil はデザインファイル（`.pen`）をコードと同じリポジトリで管理するベクターデザインツール。
JSON ベースの `.pen` ファイルは Git でバージョン管理でき、MCP サーバー経由で AI がデザインを直接操作できる。

### 主な特徴
- **IDE統合**: VS Code / Cursor 拡張機能、デスクトップアプリ
- **Design as Code**: `.pen` ファイルは JSON ベース、Git diff 可能
- **AI統合**: MCP サーバー経由で Claude Code からデザイン操作
- **コンポーネントシステム**: 再利用可能コンポーネント、インスタンス、スロット
- **変数システム**: デザイントークン（カラー、スペーシング、タイポグラフィ）、テーマ対応
- **デザイン↔コード同期**: React / React Native コード生成
- **UIキット**: Shadcn UI, Halo, Lunaris, Nitro プリセット

## .pen ファイル

### 基本ルール
- ファイル拡張子: `.pen`
- フォーマット: JSON（HTML/SVG ライクなオブジェクトツリー）
- 各オブジェクトに `id`（一意）と `type`（ノード種別）が必須
- Git でバージョン管理可能（テキストベース diff）
- プロジェクト内のコードの隣に配置: `designs/dashboard.pen`, `designs/components.pen`

### ノードタイプ
| タイプ | 説明 |
|--------|------|
| `Rectangle` | 矩形 |
| `Ellipse` | 楕円（円弧パラメータ対応） |
| `Frame` | 子要素を持つ矩形コンテナ（画面/セクション） |
| `Group` | レイアウト対応グループ |
| `Text` | テキストコンテンツ + 書式 |
| `Path` | SVG パスジオメトリ |
| `Line` | 線 |
| `Polygon` | 正多角形 |
| `IconFont` | フォントベースアイコン |
| `Ref` | 再利用可能コンポーネントへの参照（インスタンス） |

### レイアウトプロパティ
```
layout: "none" | "vertical" | "horizontal"
gap: number | variable
padding: number | [horizontal, vertical] | [top, right, bottom, left]
justifyContent: "start" | "center" | "end" | "space_between" | "space_around"
alignItems: "start" | "center" | "end"
```

### グラフィックスプロパティ
- **Fill**: 単色（hex）、グラデーション（linear/radial/angular）、画像、メッシュ
- **Stroke**: alignment（inside/center/outside）、thickness、join/cap
- **Effects**: blur, background_blur, shadow

詳細 → `references/pen-format.md`

## MCP ツール（AI統合）

Pencil は MCP サーバーとして動作し、AI エージェントにデザイン操作ツールを提供する。

### 利用可能なツール

| ツール | 種別 | 説明 |
|--------|------|------|
| `batch_design` | 操作 | 要素の作成・修正・削除（バッチ処理） |
| `batch_get` | 読取 | デザイン構造の読み取り |
| `get_screenshot` | 分析 | デザインのプレビュー画像取得 |
| `snapshot_layout` | 分析 | レイアウト検査 |
| `get_editor_state` | 分析 | エディタのコンテキスト情報取得 |
| `get_variables` | 変数 | デザイントークン/テーマの取得 |
| `set_variables` | 変数 | デザイントークン/テーマの設定 |

### AIプロンプトのベストプラクティス

**具体的に指示する:**
- NG: 「もっと良くして」
- OK: 「パディングを16pxに増やして背景色を#6C63FFに変更」

**コンテキストを提供する:**
- OK: 「ログインフォームを作成（メール、パスワード、チェックボックス、送信ボタン付き）」

**既存システムを参照する:**
- OK: 「デザインシステムのボタンコンポーネントを使用」

**段階的に進める:**
1. 大まかな構造を作成
2. 詳細を追加
3. ポリッシュ

詳細 → `references/mcp-tools.md`

## コンポーネントシステム

### 通常要素 vs 再利用可能コンポーネント
- **通常要素**: 青い枠線。フレーム、シェイプ、テキスト
- **再利用可能コンポーネント**: 紫/マゼンタ枠線。`reusable: true`

### コンポーネント作成
1. 要素を選択
2. `Cmd/Ctrl + Option/Alt + K` でコンポーネント化
3. 紫色のハイライトで確認

### コンポーネント機能
- **メインコンポーネント変更 → 全インスタンス更新**
- `type: "ref"` + `ref: "component_id"` でインスタンス参照
- `descendants` マップで子孫をオーバーライド
- `slot` で拡張ポイントを指定

## 変数（デザイントークン）

### 定義方法
1. **CSS から自動抽出**: AI が `globals.css` から変数を生成
2. **Figma からインポート**: トークンをコピー&ペースト
3. **手動定義**: Pencil 内で直接定義

### 変数の種類
- **カラー**: `primary`, `background`, `text` など
- **スペーシング**: `padding-sm`, `gap-md` など
- **タイポグラフィ**: `font-heading`, `font-body` など

### テーマ対応
ライト/ダークモード等で異なる値を定義可能。切り替え時にデザインが自動適応。

### AltMe デザイントークン（Pencil変数に設定）
```
カラー:
  primary: #6C63FF
  secondary: #4ECDC4
  background: #FFFFFF
  surface: #F8F9FA
  text: #1A1A2E
  textSecondary: #6B7280
  error: #EF4444
  success: #10B981
  warning: #F59E0B

スペーシング:
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32

タイポグラフィ:
  display: 32/Bold
  heading: 24/SemiBold
  title: 20/SemiBold
  body: 16/Regular
  caption: 14/Regular
  small: 12/Regular
```

## UIキット

プリセットのデザインシステム:
| キット | 説明 |
|--------|------|
| **Shadcn UI** | React コンポーネントライブラリ |
| **Halo** | モダンデザインシステム |
| **Lunaris** | 統合デザインフレームワーク |
| **Nitro** | 原則ベースのコンポーネント体系 |

## インポート/エクスポート

### インポート
- **画像**: ドラッグ&ドロップ（PNG, JPEG, SVG）
- **Figma**: フレームをコピー&ペースト（画像は手動再インポート必要）
- **アイコン**: Material Icons 内蔵。Lucide/Heroicons はプロンプトで指定

### エクスポート
- **コード出力**: `Cmd/Ctrl + K` → 「React コード生成」で AI がコード生成
- **画像出力**: フレーム右クリック → PNG/SVG エクスポート

## キーボードショートカット

| ショートカット | 操作 |
|--------------|------|
| `Cmd/Ctrl + K` | AIプロンプトパネル |
| `Cmd/Ctrl + Option/Alt + K` | コンポーネント化 |
| `Cmd/Ctrl + G` | グループ化 |
| `Cmd/Ctrl + Option/Alt + G` | フレーム作成 |
| `Cmd/Ctrl + D` | 複製 |
| `Space + Drag` | パン |
| `Cmd/Ctrl + 0/1/2` | ズーム調整 |
| `Cmd/Ctrl + S` | 保存 |

## AltMe での使い方

### デザインファイルの配置
```
designs/
├── components.pen      # 共通コンポーネント
├── onboarding.pen      # オンボーディング画面
├── chat.pen            # チャット画面
├── journal.pen         # 日記画面
├── settings.pen        # 設定画面
├── paywall.pen         # ペイウォール画面
└── variables.pen       # デザイントークン定義
```

### ワークフロー
```
1. 仕様書（specs/screens/*.md）を参照
  ↓
2. Pencil で画面デザイン作成（.pen）
  ↓
3. AI（MCP）でデザイン操作・調整
  ↓
4. コード生成（React Native コンポーネント）
  ↓
5. 実装に反映 → Reconcile で仕様書更新
```

## 参照

- `references/pen-format.md`: .pen フォーマット技術仕様（ノードタイプ、プロパティ、TypeScript 型定義）
- `references/mcp-tools.md`: MCP ツール詳細（AI統合、プロンプト例、トラブルシューティング）
- `references/design-workflow.md`: デザインワークフロー（仕様書→デザイン→コード、Figma連携、レビュー手順）

### 元ソース
- Pencil 公式ドキュメント: https://docs.pencil.dev/
