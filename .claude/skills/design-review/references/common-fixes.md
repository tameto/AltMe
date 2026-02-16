# よくある修正パターン集

> デザインレビューで頻出する問題と、Pencil MCP での具体的な修正方法。
> 実際のレビューセッションで検出・修正したパターンを蓄積する。

---

## カテゴリ1: ビジュアル一貫性

### 1-1. Big Five パーソナリティバーの向き

**問題**: 性格診断結果で Big Five のバーが縦向き（vertical bar chart）になっていた
**あるべき姿**: 横向きバー（horizontal bar chart）が一般的。特にモバイルでは横幅が限られるため横バーが適切。

**修正方法**:
```javascript
// 各バーの layout を horizontal に変更
U("{barContainerId}", {layout: "horizontal", gap: 8})
// バーの width を固定、height を fill_container に
U("{barId}", {width: 120, height: 8})
```

### 1-2. メッセージ数の不一致

**問題**: チャット画面のメッセージ数が仕様と異なる（Free版で3往復=6メッセージだが、デザインでは4つしかない）
**あるべき姿**: Free版 = 6メッセージ（3ユーザー + 3AI）、Pro版 = 10+メッセージ

**修正方法**: 不足メッセージを追加
```javascript
// ユーザーメッセージ（右寄せ）
wrapper=I("{chatBody}", {type: "frame", layout: "vertical", crossAxisAlignment: "end", width: "fill_container"})
bubble=I(wrapper, {type: "frame", fill: "#F59E0B", cornerRadius: [16,16,4,16], padding: [10,14,10,14], maxWidth: 280})
text=I(bubble, {type: "text", content: "メッセージ内容", fontSize: 14, fontFamily: "Outfit", textColor: "#FFFFFF"})

// AIメッセージ（Slack風: アバター + 名前 + タイムスタンプ + テキスト）
msgGroup=I("{chatBody}", {type: "frame", layout: "horizontal", gap: 10, width: "fill_container"})
avatar=I(msgGroup, {type: "frame", fill: "#F59E0B", cornerRadius: [20,20,20,20], width: 32, height: 32})
avatarIcon=I(avatar, {type: "icon_font", iconFontFamily: "lucide", iconFontName: "bot", fontSize: 16, textColor: "#0F172A"})
content=I(msgGroup, {type: "frame", layout: "vertical", gap: 2, width: "fill_container"})
nameRow=I(content, {type: "frame", layout: "horizontal", gap: 6})
name=I(nameRow, {type: "text", content: "ツイン名", fontSize: 13, fontWeight: "600", fontFamily: "Outfit", textColor: "#0F172A"})
time=I(nameRow, {type: "text", content: "12:34", fontSize: 11, fontFamily: "Outfit", textColor: "#94A3B8"})
msgText=I(content, {type: "text", content: "AIの応答テキスト", fontSize: 14, fontFamily: "Outfit", textColor: "#334155", width: "fill_container"})
```

### 1-3. アイコンフォント未設定

**問題**: `icon_font` ノードの `iconFontName` が空文字列（レンダリング時に何も表示されない）
**Critical度**: High — ユーザーに見えないアイコンになる

**修正方法**:
```javascript
U("{iconNodeId}", {iconFontName: "message-circle"})  // 適切なlucideアイコン名を設定
```

**よく使うアイコン名（lucide）**:
| 用途 | iconFontName |
|------|-------------|
| チャット | message-circle |
| コミュニティ | users |
| 設定 | settings |
| ホーム | home |
| 日記 | book-open |
| 洞察 | bar-chart-3 |
| 戻る | chevron-left |
| 閉じる | x |
| 送信 | send |
| 編集 | edit-3 |
| 削除 | trash-2 |
| 検索 | search |
| 通知 | bell |
| 星 | star |
| ハート | heart |
| シェア | share-2 |
| ロック | lock |
| Crown (Pro) | crown |
| 外部リンク | external-link |
| 復元 | rotate-ccw |
| アラート | alert-triangle |
| チェック | check |
| 情報 | info |

### 1-4. タブバーアイコンの不一致

**問題**: タブバーのアイコンが `iconFontFamily: "Material Symbols Rounded"` で設定されていた
**あるべき姿**: アプリ全体で `iconFontFamily: "lucide"` に統一

**修正方法**:
```javascript
U("{tabIconId}", {iconFontFamily: "lucide", iconFontName: "message-circle"})
```

---

## カテゴリ2: テキスト視認性

### 2-1. ダーク背景上の薄いテキスト

**問題**: ダークヘッダー（#0F172A / #1E293B）上のテキストが `#94A3B8`（Muted）で視認性が低い
**WCAG要件**: 4.5:1 以上のコントラスト比が必要

**コントラスト比参考値**:
| 背景 | テキスト | コントラスト比 | 判定 |
|------|---------|-------------|------|
| #0F172A | #FFFFFF | 17.4:1 | ◎ |
| #0F172A | #F8FAFC | 16.8:1 | ◎ |
| #0F172A | #CBD5E1 | 8.9:1 | ◎ |
| #0F172A | #94A3B8 | 5.1:1 | ○ (ギリギリ) |
| #0F172A | #64748B | 3.4:1 | × (不合格) |
| #1E293B | #94A3B8 | 4.1:1 | × (不合格) |
| #F8FAFC | #0F172A | 16.8:1 | ◎ |
| #F8FAFC | #64748B | 4.9:1 | ○ |
| #F8FAFC | #94A3B8 | 3.3:1 | × |

**修正方法**: ダーク背景上のテキストは最低 `#CBD5E1` 以上の明るさにする
```javascript
U("{textNodeId}", {textColor: "#CBD5E1"})  // #94A3B8 → #CBD5E1
```

### 2-2. 小さすぎるテキスト

**問題**: キャプションやタイムスタンプが 10px 以下
**基準**: iOS HIG では最小11pt推奨

**修正方法**:
```javascript
U("{textNodeId}", {fontSize: 11})  // 最低11px
```

---

## カテゴリ3: レイアウト/構造

### 3-1. SafeArea の不足

**問題**: 画面最下部のコンテンツがタブバーと重なる、またはノッチ領域にコンテンツが入る

**確認ポイント**:
- 画面上部: ステータスバー分 (44-50px) のパディング
- 画面下部: ホームインジケーター分 (34px) + タブバー高 (60-80px)

**修正方法**: 画面最外フレームの padding を調整
```javascript
U("{screenBodyId}", {padding: [50, 0, 34, 0]})  // 上:50, 右:0, 下:34, 左:0
```

### 3-2. タップターゲットが小さすぎる

**問題**: ボタンやアイコンのサイズが44pt未満
**Apple HIG要件**: 最小44×44pt

**よくある違反箇所**:
- ヘッダーの戻る/閉じるアイコン
- テキストリンク（「購入を復元」「プライバシーポリシー」）
- タブバーアイコン

**修正方法**:
```javascript
U("{buttonFrameId}", {width: 44, height: 44})
// アイコン自体は小さくても、タップ領域（親フレーム）を44以上に
```

### 3-3. 画面間の遷移ボタン欠如

**問題**: 仕様書のフロー図にある遷移だが、トリガーとなるボタンがデザインに存在しない

**よくある例**:
- オンボーディング最終画面 → ペイウォール への遷移ボタン
- 設定画面 → アカウント削除 への導線
- チャット画面 → ツイン情報 への導線

**修正方法**: 適切なUIパターンでボタンを追加
```javascript
// ヘッダーにアクションアイコン追加
actionBtn=I("{headerRow}", {type: "frame", width: 44, height: 44, crossAxisAlignment: "center", mainAxisAlignment: "center"})
icon=I(actionBtn, {type: "icon_font", iconFontFamily: "lucide", iconFontName: "info", fontSize: 20, textColor: "#F8FAFC"})
```

---

## カテゴリ4: Apple 審査対応

### 4-1. 「購入を復元」リンク欠如

**問題**: ペイウォール画面に「Restore Purchases」ボタンがない
**Critical度**: Critical — Apple 審査でリジェクトされる

**修正方法**:
```javascript
restoreLink=I("{paywallFooter}", {
  type: "text",
  content: "購入を復元",
  fontSize: 13,
  fontFamily: "Outfit",
  textColor: "#64748B",
  textDecoration: "underline"
})
```

### 4-2. Apple Sign-In ボタンの HIG 非準拠

**問題**: Apple Sign-In ボタンのスタイルが HIG に従っていない
**要件**: 黒地に白ロゴ、角丸、高さ44pt以上、Appleロゴは SF Symbols を使用

**修正方法**:
```javascript
U("{appleButtonId}", {
  fill: "#000000",
  cornerRadius: [12, 12, 12, 12],
  height: 50,
  width: "fill_container"
})
U("{appleButtonText}", {textColor: "#FFFFFF", fontWeight: "600"})
```

### 4-3. サブスクリプション価格の不明確表示

**問題**: 月額/年額の表示が曖昧、トライアル条件が読みにくい
**要件**: 価格、課金周期、トライアル期間、自動更新の事実を明確に表示

**修正方法**: 価格テキストを再構成
```javascript
U("{priceTextId}", {content: "¥4,980/月"})
U("{trialTextId}", {content: "3日間の無料トライアル後に課金されます。いつでもキャンセル可能。"})
```

---

## カテゴリ5: 仕様書との不整合

### 5-1. 仕様にある画面が未作成

**問題**: 仕様書に定義された画面がデザインファイルに存在しない

**対応**:
1. Missing として仕様監査レポートに記録
2. 画面の重要度を判断（MVP必須 / Phase 2 / Nice to have）
3. MVP必須なら即作成、それ以外はノートに記録

### 5-2. 仕様にない画面がデザインに存在

**問題**: デザインにあるが仕様書に記載されていない画面やコンポーネント

**対応**:
1. Extra として仕様監査レポートに記録
2. 有用な追加であれば仕様書に追記（🟣 ノート）
3. 不要であれば削除検討

### 5-3. Free/Pro の機能出し分けが仕様と異なる

**問題**: 仕様書で Free 版に含まれる機能が Pro 限定になっている（またはその逆）

**確認ポイント**:
- チャット回数制限: Free=3回/日、Pro=無制限
- 日記機能: Free=なし、Pro=あり
- 感情トラッキング: Free=なし、Pro=あり
- コミュニティ: Free=閲覧のみ、Pro=参加可能

---

## カテゴリ6: Pencil 固有の問題

### 6-1. icon_font ノードの iconFontName 未設定

**検出方法**: batch_get で icon_font ノードを検索し、iconFontName が空文字列のものを検出
```
mcp__pencil__batch_get:
  patterns: [{type: "icon_font"}]
  searchDepth: 10
  parentId: "{masterBoardId}"
```

### 6-2. テキストノードの width 未設定による折り返し不全

**問題**: テキストノードに `width: "fill_container"` が設定されておらず、長文が画面外にはみ出す

**修正方法**:
```javascript
U("{textNodeId}", {width: "fill_container"})
```

### 6-3. ref ノードのインスタンスが壊れている

**問題**: コンポーネントの ref 先が削除されて、インスタンスが空になっている

**確認方法**: `resolveInstances: true` で batch_get し、中身が空のものを検出

---

## レビュー時の修正判断フローチャート

```
問題検出
  ├── Critical（構造/機能問題）
  │   ├── 修正方法が明確 → 即修正 + Green ノート
  │   └── 修正方法が不明 → Yellow ノート（人間判断）
  ├── Warning（改善推奨）
  │   ├── 5分以内で修正可能 → 即修正 + Green ノート
  │   └── 大きな変更が必要 → Blue ノート（UXコメント）
  ├── Missing（仕様にあるがデザインにない）
  │   ├── MVP必須 → 画面作成 + Green ノート
  │   └── Phase 2 以降 → Purple ノート
  ├── Extra（デザインにあるが仕様にない）
  │   └── Purple ノート（仕様追記推奨）
  └── Info（参考情報）
      └── Blue ノート
```
