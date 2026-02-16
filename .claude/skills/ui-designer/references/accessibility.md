# Accessibility Engineer -- アクセシビリティスキル

> 元ソース: [mae616/design-skills/skills/accessibility-engineer](https://github.com/mae616/design-skills/tree/main/skills/accessibility-engineer)

## スキル概要

```yaml
name: accessibility-engineer
description: Apply semantic HTML/JSX and WAI-ARIA correctly and minimally.
tags: accessibility, a11y, aria, semantic-html, screen-reader, keyboard
```

## When to Apply

このスキルは以下の場面で適用する:
- アクセシビリティ、a11y、WAI-ARIA、スクリーンリーダー対応、セマンティックHTML、キーボードナビゲーション、フォーカス管理
- アクセシビリティ対応、WAI-ARIA、スクリーンリーダー対応、セマンティックHTML、キーボード操作、フォーカス管理
- **全てのUI実装に対して** (他のスキルと併用して適用すべき)

## Core Principles (Most Important)

- **Native elements first.** ARIA に手を出す前に、適切なHTML要素 (`button`, `a`, `label`, `input` 等) で解決する。
- **ARIA is minimal.** `role`/`aria-*` を「アクセシブルに見せる」ために追加しない。実際の要件がある場合のみ追加。
- **Operable = Communicable.** 視覚だけでなく、支援技術がstate、name、purposeを受け取れること。これがDone の定義。
- **Keyboard is the baseline.** マウスのみのUIは不完全。フォーカス移動と操作を最初にデザインする。

## Implementation Rules

### 1) Semantic Structure

- 見出し順序を維持 (`h1` -> `h2` -> ...)。スタイリングのためにレベルをスキップしない。
- メイン領域にランドマークを作成 (`header`, `nav`, `main`, `footer`, 必要に応じて `aside`)。
- リストには `ul/ol/li`、定義には `dl/dt/dd` を使う -- `div` で代用しない。

### 2) Accessible Names

- ボタン、リンク、入力には「名前」が必要 (スクリーンリーダーが読むラベル)。
  - 優先: **可視テキスト**
  - フォールバック: `aria-label` (可視テキストが不可能な場合)
  - 合成: `aria-labelledby` (既存要素を参照)
- アイコンのみのボタン/リンクには **必ず** 名前を付ける (例: "検索", "閉じる")。

### 3) Forms (必須)

- `label` と `input` を関連付ける (`for`/`id`)。placeholder をラベルの代わりにしない。
- 必須/任意、エラー、ヒントを機械可読にする (例: ヘルパーテキストに `aria-describedby`)。
- エラーは次の3点を説明する: **何が間違いか、なぜか、どう修正するか。**

### 4) States and Announcements (Dynamic UI)

- まずネイティブの `disabled` 属性を使う (`button disabled` 等)。
- トグルには `aria-pressed` / `aria-expanded` を使うが、ネイティブ要素で十分な場合のみ。
- 非同期の完了/失敗通知に `aria-live` を使う -- ただし乱用しない。

### 5) Keyboard Operation and Focus

- DOM順序でタブシーケンスが論理的になるようにデザインする。`tabindex` で強制リオーダーしない。
- `tabindex="0"`: フォーカス可能にするための最小限の使用。
- `tabindex="-1"`: プログラム的なフォーカス移動のためだけに使用。
- 可視フォーカスを常に維持 (`focus-visible`)。絶対に隠さない。
- ダイアログ/モーダル: オープン時のフォーカス先とクローズ時の戻り先を定義。必要に応じてフォーカストラップを実装。

### 6) Images and Media

- `alt` は目的に基づいて記述 (装飾画像は `alt=""`)。
- 動画/音声: コントロール (再生/停止) と代替手段 (字幕/トランスクリプト) を確認。不明なら質問する。

## Anti-Patterns (これは絶対にしない)

- `div` に `onClick` を付けてボタンとして使う (キーボード/ロールが壊れる)
- `role="button"` を回避策として使う (ネイティブ `button` を使う)
- 全てに `aria-label` を追加する (可視ラベルがある場合、二重読み上げになる)
- フォーカスリングを削除する (不可視フォーカス = 操作不能)

## Clarification Questions (Don't Assume)

- このUIはキーボードのみで完結する必要があるか? (Yesなら操作ステップを列挙して合意)
- モーダル/ドロワーの場合: オープン時に何にフォーカスが移る? クローズ時は?
- エラーはいつ通知される? 即時? 送信後?
- 動画/音声に字幕やテキスト代替は必要か?

## Output Format (実装向け)

1. **Semantic structure** (ランドマーク、見出し、リスト)
2. **Keyboard operation** (Tab順序、Enter、Space、Escape)
3. **ARIA usage** (必要な箇所のみ、理由付き)
4. **States** (disabled/loading/error) and **announcements** (必要に応じて aria-live)
5. **Accessibility checklist self-assessment** (OK / needs work)

---

## AltMe への適用ガイド

### React Native アクセシビリティ Props

React Native ではHTML要素ではなく `accessibility*` props を使う:

```tsx
// アクセシブルなボタン
<Pressable
  accessibilityRole="button"
  accessibilityLabel="メッセージを送信"
  accessibilityHint="入力したメッセージをAIに送信します"
  accessibilityState={{ disabled: !canSend }}
>
  <SendIcon />
</Pressable>

// アクセシブルなテキスト入力
<TextInput
  accessibilityLabel="メッセージ入力"
  accessibilityHint="AIツインに送るメッセージを入力してください"
  placeholder="メッセージを入力..."
/>

// アクセシブルなリスト
<FlashList
  accessibilityRole="list"
  renderItem={({ item }) => (
    <View accessibilityRole="listitem">
      <Text>{item.content}</Text>
    </View>
  )}
/>

// アクセシブルな画像
<Image
  source={avatarSource}
  accessibilityLabel="ユーザーのプロフィール画像"
/>

// 装飾画像 (スクリーンリーダーでスキップ)
<Image
  source={decorativeImage}
  accessibilityElementsHidden={true}
  importantForAccessibility="no-hide-descendants"
/>

// トグル/スイッチ
<Switch
  accessibilityRole="switch"
  accessibilityLabel="通知を有効にする"
  accessibilityState={{ checked: isEnabled }}
  value={isEnabled}
  onValueChange={setIsEnabled}
/>

// ヘッダー
<Text accessibilityRole="header" style={typography.heading}>
  設定
</Text>
```

### React Native 固有の注意点

| HTML概念 | React Native 対応 |
|---------|-------------------|
| `<button>` | `<Pressable accessibilityRole="button">` |
| `<h1>`-`<h6>` | `<Text accessibilityRole="header">` |
| `<a>` | `<Pressable accessibilityRole="link">` |
| `<img alt="...">` | `<Image accessibilityLabel="...">` |
| `<label>` | `accessibilityLabel` prop |
| `aria-live` | `accessibilityLiveRegion="polite"` |
| `aria-hidden` | `accessibilityElementsHidden={true}` |
| `disabled` | `accessibilityState={{ disabled: true }}` |
| `aria-expanded` | `accessibilityState={{ expanded: true }}` |
| `aria-selected` | `accessibilityState={{ selected: true }}` |
| focus management | `ref.current.focus()` / `AccessibilityInfo` |

### WCAG 2.1 準拠チェックリスト (AltMe 用)

#### Perceivable (知覚可能)
- [ ] テキストのコントラスト比: 通常テキスト 4.5:1 以上、大テキスト 3:1 以上
- [ ] 非テキスト要素のコントラスト比: 3:1 以上
- [ ] 情報が色だけで伝達されていない (色覚異常対応)
- [ ] 画像に適切な `accessibilityLabel`
- [ ] テキストサイズの拡大 (200%) でも使用可能

#### Operable (操作可能)
- [ ] タップターゲット: 最小 44x44pt (Apple HIG)
- [ ] 隣接するタップターゲット間に最低 8pt の間隔
- [ ] VoiceOver/TalkBack で全操作が完了可能
- [ ] フォーカス順序が論理的
- [ ] タイムアウトが必要な場合はユーザーに延長手段を提供

#### Understandable (理解可能)
- [ ] エラーメッセージが具体的 (何が、なぜ、どうすればよいか)
- [ ] ラベルがプレースホルダのみに依存していない
- [ ] 一貫したナビゲーション

#### Robust (堅牢)
- [ ] `accessibilityRole` が適切に設定
- [ ] 動的コンテンツの更新が `accessibilityLiveRegion` で通知
- [ ] 支援技術の最新バージョンで動作確認

### カラーコントラスト検証 (AltMe パレット)

| 組み合わせ | 背景 | テキスト | コントラスト比 | 判定 |
|-----------|------|---------|--------------|------|
| メインテキスト on 白背景 | #FFFFFF | #1A1A2E | ~16.1:1 | OK |
| サブテキスト on 白背景 | #FFFFFF | #6B7280 | ~5.2:1 | OK |
| Primary on 白背景 | #FFFFFF | #6C63FF | ~3.9:1 | 大テキストのみOK |
| エラー on 白背景 | #FFFFFF | #EF4444 | ~3.9:1 | 大テキストのみOK |
| 白テキスト on Primary | #6C63FF | #FFFFFF | ~3.9:1 | 大テキストのみOK |

**注意**: Primary (#6C63FF) を小さなテキストの色として使う場合はコントラスト不足。ボタンの背景色として使い、テキストは白にするのが安全。
