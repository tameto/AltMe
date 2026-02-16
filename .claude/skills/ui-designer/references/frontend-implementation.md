# Frontend Implementation -- デザイン→コード変換スキル

> 元ソース: [mae616/design-skills/skills/frontend-implementation](https://github.com/mae616/design-skills/tree/main/skills/frontend-implementation)

## スキル概要

```yaml
name: frontend-implementation
description: Translate designs and UI requirements into robust, extensible implementations.
tags: frontend, implementation, design-to-code, responsive, css, layout
```

## When to Apply

このスキルは以下の場面で適用する:
- UI実装、デザインから実装、Figmaから実装、コンポーネント実装、スタイル調整、レスポンシブ対応、UIの崩れ修正
- デザインツールの出力 (Figma/Pencil/Canva/スケッチ) をコードに変換するとき

## Core Principles

- **Goal is not pixel-perfect copying, but maintaining ratios, alignment, resilience, and consistency.**
- **Translate, don't transcribe.** デザインツールの値 (px) は参考値であり、実装ではスケール・比率・構造を使う。
- **Fixed values are exceptions.** 固定値を使う場合は理由を明確にする (仕様要件、メディア、タップターゲット等)。

## Design Philosophy (Decision Rules)

1. **UI is a set of constraints, not a picture.** 状態 (loading/error/empty/disabled) を含めて初めて完成。
2. **Don't create alignment with margin tweaks.** 構造 (flex/grid) と `gap` で揃える。
3. **Avoid fixed heights.** まず `min/max/overflow` を検討。
4. **Typography is role-based.** 値のコピーで増殖させない。
5. **Handle exceptions upfront.** 長文、0件、失敗、遅延 -- 後付けにしない。
6. **Articulate design intent first** (何を強調し、視線をどう誘導するか)、その後に構造を作る。
7. **Width follows the viewport.** 画面幅に追従する (SCALE/FILL); 左から単にクロップしない。

## Translation Process (Design Tool -> Code)

### Step 1: Read Intent Before Numbers

数値の前に意図を読む:

- **Purpose**: この画面でユーザーが最初に理解/操作すべきことは何か
- **Visual flow**: 最初→次→最後に見るもの
- **Emphasis**: ヒーロー / サポート / 背景要素
- **Hierarchy**: 親子関係、グルーピング
- **Stretch/state intent**: Auto Layout / Constraints / Variants
- **Spacing rules**: gap/padding のパターン
- **Alignment**: 何が何に揃っているか
- **Variable elements**: テキスト長、リスト数、画像比率、入力値

### Step 2: Convert to Implementation

- px -> **スケールに丸める** (4/8/12/16/24/32/40/48)
- font-size -> **ロールにマッピング** (heading/body/caption)
- ローカルなマージン調整 -> **レイアウト構造に変換** (flex/grid/gap、親子の責務を明確化)
- 固定 width/height -> **制約に変換** (min/max, wrap, ellipsis, overflow)
- 幅のデザイン -> **背景/コンテナ/コンテンツの責務を分離**

### Step 3: Alignment Decisions

**揃えるべき場合:**
- 繰り返し要素 (カード/リスト/フォーム) -- 比較のため
- メインカラム (本文/プライマリ入力/CTA) -- 明確な視覚パスのため
- 混乱を減らす (管理画面、設定画面、入力が多い画面)

**崩してよい場合:**
- ヒーロー要素を意図的にフロートさせる
- セクション境界を強調する
- メディア/装飾がフォーカスの場合 (ただしレジリエンスを確保)

**崩す場合のルール:**
- 最低1つのベースラインを維持
- オフセットパターンは1-2に制限
- 狭いビューポートでは揃えを優先

### Step 4: Preserve Width Distribution (Weights)

- **Width distribution IS visual guidance.** カラム比率 (primary/secondary/tertiary) は意図的。
- **Don't accidentally equalize.** 全てに `flex: 1` を適用すると、サポート要素がヒーローと同等になる。
- **Separate baseline alignment from width distribution.** 両者は異なりうる。

## Implementation Guidelines

### Typography
- `rem` (or `clamp()`) を使う。`em` は親サイズとの相対関係がある場合のみ。
- `line-height` はユニットレス (例: 1.5-1.7)。
- 本文の可読性: `max-width: 60ch` を目安に。

### Spacing
- スケールに丸める (端数は避ける)。
- 子要素にマージンをばら撒くより、親の `gap/padding` を優先。

### Proportions
- 正確な数値ではなく比率で外観を維持 (カラム幅比率、スペーシングステップ、タイプスケール)。
- 固定幅より max-width + スペーシングルールを優先。

### Layout
- 1次元: flex。2次元: grid。スペーシング: gap。
- `position: absolute` はオーバーレイ/装飾で明確な目的がある場合のみ。
- 画像: デフォルトでアスペクト比を維持; 必要に応じて `aspect-ratio` を使用。

### Fixed Values (例外)
- アイコン、サムネイル、タップターゲット、仕様で定義されたヘッダー高さ等。
- 崩れ防止でも、固定にする前に `min/max` を検討。

## States and Resilience (必須)

以下の状態を含むこと: default / hover / active / focus / disabled / loading / error / empty

長文、0件、ネットワーク障害、遅延への対処は最初から行う -- 後付けにしない。

## Output Format (この順序で出力)

1. **Purpose** (このUIが達成すること)
2. **Prerequisites** (デザイン入力の種類、既存の規約、制約)
3. **Translation results** (ヒエラルキー、揃え、スペーシングルール、可変要素)
4. **Implementation approach** (レイアウト構造、スケール、例外条件)
5. **State design** (default/hover/active/focus/disabled/loading/error/empty)
6. **Checklist self-assessment** (OK / needs work)

## Checklist

- [ ] Has empty / loading / error states
- [ ] Has disabled conditions (prevent double-submit, invalid states)
- [ ] Doesn't break on long text (wrap/ellipsis/max-width/overflow)
- [ ] Has keyboard operation and visible focus
- [ ] Doesn't break on narrow/mobile viewports
- [ ] Spacing, typography, colors follow conventions (tokens/scale)

## Common Pitfalls

- デザインデータからピクセルパーフェクトにコピーし、エッジ状態やレスポンシブで崩れる
- マージン調整が増殖し、メンテナンス不能になる
- 「見た目の一致」を優先し、状態 (loading/error/empty) が後回しになる

---

## AltMe への適用ガイド

### React Native 固有のスタイリング

React Native では CSS Grid は使えないため、以下のパターンを使う:

```tsx
// Flex レイアウト (1次元)
<View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
  <Avatar size={40} />
  <View style={{ flex: 1 }}>
    <Text style={typography.body}>{message}</Text>
  </View>
</View>

// スペーシングスケールの適用
<View style={{ padding: spacing.lg, gap: spacing.md }}>
  <Text style={typography.heading}>セクションタイトル</Text>
  <Text style={typography.body}>本文コンテンツ</Text>
</View>

// 固定値の例外: タップターゲット
<Pressable style={{ minHeight: 44, minWidth: 44, justifyContent: 'center' }}>
  <Text>ボタン</Text>
</Pressable>
```

### スペーシングスケール (AltMe)

```
4 (xs) / 8 (sm) / 12 (md) / 16 (lg) / 24 (xl) / 32 (xxl) / 40 (xxxl) / 48 (huge)
```

全てのスペーシング値はこのスケールから選択する。デザインツールの端数値はスケールに丸める。

### レスポンシブ対応

React Native (Expo) ではビューポート幅に応じた分岐:
- `useWindowDimensions()` でビューポートサイズを取得
- タブレット対応が必要な場合は `flex` 比率で調整
- 基本はモバイルファースト (AltMe はモバイルアプリ)

### 状態マシンパターン (推奨)

```tsx
type ScreenState = 'loading' | 'empty' | 'data' | 'error';

const ChatScreen = () => {
  const [state, setState] = useState<ScreenState>('loading');

  switch (state) {
    case 'loading': return <ChatSkeleton />;
    case 'empty':   return <EmptyChat onStart={handleStart} />;
    case 'error':   return <ErrorView onRetry={handleRetry} />;
    case 'data':    return <ChatList messages={messages} />;
  }
};
```
