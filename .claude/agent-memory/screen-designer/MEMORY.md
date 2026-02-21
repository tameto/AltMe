# screen-designer メモリ

## Pencil MCP ツール

### 課題（2026-02-15）
- Pencil MCP ツールの正しい呼び出し方法を確認中
- MCP Server Instructions では "pencil" プレフィックスなしでツールが記載されているが、実際の呼び出し形式が不明
- team-lead に確認依頼済み

### 試行したツール名（すべて失敗）
- `get_editor_state`
- `pencil.get_editor_state`
- `pencil_get_editor_state`

### 想定される正しいツール名（未確認）
- get_editor_state()
- open_document(filePathOrTemplate)
- batch_get(patterns, nodeIds)
- batch_design(operations)
- get_screenshot()
- get_variables()
- set_variables()

## AltMe デザインシステム

### C Midnight Teal パレット
- Primary: #7DD3FC (Teal) — ボタン、リンク、アクティブ状態
- Gold: #D4A853 — プレミアムバッジ、アップグレードCTA限定
- BG Dark: #0F172A / Light: #F8FAFC
- Card Dark: #1E293B / Light: #FFFFFF
- Text Primary: #F8FAFC (on dark) / #0F172A (on light)
- Text Secondary: #94A3B8 (on dark) / #64748B (on light)
- Font: Outfit (weight 300 titles, 400 body)
- Border: #E2E8F0 (light)
- Destructive: #EF4444

### デザイントークン
- cornerRadius: 16 (cards), 12 (buttons)
- Button padding: [14, 24]
- Screen size: 402 x 874
- Screen clip: true
- Screen cornerRadius: [16,16,16,16]

## 画面構造パターン

### 共通タブバー（全画面下部）
- 背景: #FFFFFF
- 高さ: 80
- 4タブ: Chat / Journal / Insights / Settings
- アクティブ: #7DD3FC
- 非アクティブ: #94A3B8
- 各タブ: アイコン + ラベル

### ヘッダーパターン
- ダークヘッダー: #0F172A 背景、白テキスト
- ライトヘッダー: #F8FAFC 背景、ダークテキスト

### カードパターン
- ライトモード: #FFFFFF 背景、#E2E8F0 ボーダー
- ダークモード: #1E293B 背景

## 実装ルール

### batch_design 操作制限
- 1回の呼び出しで最大25操作まで
- 大きな画面は複数回に分割して実行

### 画像生成フロー
1. G() で画像生成
2. 必ず U() で fills:[{type:"image", mode:"cover"}] を設定

### テキスト色設定
- `fill` プロパティで設定（`textColor` ではない）

### 既存画面参照
- batch_get で nodeIds を指定して構造を確認
