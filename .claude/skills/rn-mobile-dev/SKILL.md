---
name: rn-mobile-dev
description: |
  React Native / Expo モバイルアプリ開発の専門サブエージェント。
  コンポーネント実装、パフォーマンス最適化、ナビゲーション設計、アニメーション実装を担当する。
  vercel-react-native-skills の36ルールを内蔵。
  トリガー: React Nativeコンポーネント実装、Expoモジュール統合、パフォーマンス改善、UI実装
---

# React Native Mobile Dev Sub-Agent

React Native (Expo) アプリケーション開発の専門サブエージェント。
vercel-labs/agent-skills の react-native-skills を内蔵し、クラッシュ防止・パフォーマンス最適化・モダンUI実装を自動適用する。

## 使い方

このスキルは以下のように呼び出される：
1. Agent Teamsのメンバーとして自動的にアクティベート
2. `/rn-mobile-dev` で直接呼び出し
3. React Native関連の実装タスクで自動トリガー

## コア能力

### 1. クラッシュ防止 (CRITICAL)
- テキストは必ず `<Text>` コンポーネント内に配置
- `{value && <Component />}` で value が `0` や `""` になる場合は三項演算子を使用
- 詳細: `references/rn-rules.md` の CRITICAL セクション

### 2. リストパフォーマンス (HIGH)
- `ScrollView` + `.map()` は禁止。常に FlashList または LegendList を使用
- `renderItem` 内でインラインオブジェクト/コールバック生成禁止
- リストアイテムは軽量に（クエリ、重いhooks、Context禁止）
- Zustand セレクタでピンポイント購読
- 詳細: `references/rn-rules.md` の LIST PERFORMANCE セクション

### 3. アニメーション (HIGH)
- GPU アクセラレーション対象のみアニメーション（`transform`, `opacity`）
- `width`, `height`, `top`, `left`, `margin`, `padding` のアニメーション禁止
- `GestureDetector` + `Gesture.Tap()` + shared values でプレスアニメーション（UIスレッド実行）
- `useDerivedValue` > `useAnimatedReaction`

### 4. ナビゲーション (HIGH)
- Expo Router の native stack (`<Stack />`) を使用
- ネイティブタブには `NativeTabs` (expo-router/unstable-native-tabs) を使用
- JS ベースの `@react-navigation/stack` や `@react-navigation/bottom-tabs` は禁止

### 5. 状態管理 (MEDIUM)
- 冗長な state 禁止。props/state から派生値を計算
- `setState(prev => ...)` ディスパッチパターンで前の状態に依存する更新
- `undefined` 初期状態 + `??` でリアクティブフォールバック

### 6. モダン UI (MEDIUM)
- `expo-image` を RN `Image` の代わりに使用
- `Pressable` を `TouchableOpacity` の代わりに使用
- `borderCurve: 'continuous'` でiOS風角丸
- `gap` でスペーシング（margin不要）
- ネイティブ `<Modal presentationStyle="formSheet">` を使用
- `contentInsetAdjustmentBehavior="automatic"` で SafeArea 処理

### 7. React Compiler 互換性 (MEDIUM)
- hooks から関数を早期分割代入
- Reanimated shared values は `.get()` / `.set()` を使用（`.value` ではない）

## 実装チェックリスト

コードレビュー時に必ず確認：

```
[ ] テキストが <Text> 内にあるか
[ ] falsy && パターンがないか（0, "", null に注意）
[ ] リストは FlashList/LegendList を使っているか
[ ] renderItem でインラインオブジェクト生成していないか
[ ] アニメーションは transform/opacity のみか
[ ] ナビゲーションは native stack を使っているか
[ ] expo-image を使っているか
[ ] Pressable を使っているか
[ ] useState の乱用がないか（派生値は計算で）
[ ] contentInsetAdjustmentBehavior="automatic" を使っているか
```

## AltMe プロジェクト固有ルール

- 状態管理: Zustand（セレクタで最小購読）
- ルーティング: Expo Router（app/ ディレクトリ）
- スタイリング: StyleSheet.create + テーマ定数
- コンポーネント: named export のみ（export default は Expo Router 画面ファイルのみ例外）
- ファイル名: kebab-case

## 参照

- `references/rn-rules.md` -- 38ルール概要（vercel-react-native-skills ベース）
- `references/rules-critical.md` -- CRITICAL: クラッシュ防止 + 参照安定性 (4ルール、完全コード例付き)
- `references/rules-high.md` -- HIGH: パフォーマンス・品質 (15ルール、完全コード例付き)
- `references/rules-medium.md` -- MEDIUM: コード品質・保守性 (12ルール、完全コード例付き)
- `references/rules-low.md` -- LOW: ベストプラクティス (5ルール、完全コード例付き)
- 公式ドキュメント: React Native, Expo, Reanimated, Gesture Handler
