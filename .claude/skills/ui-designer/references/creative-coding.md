# Creative Coder -- アニメーション/モーション/インタラクションスキル

> 元ソース: [mae616/design-skills/skills/creative-coder](https://github.com/mae616/design-skills/tree/main/skills/creative-coder)

## スキル概要

```yaml
name: creative-coder
description: Translate motion, interaction, and visual experience into implementable constraints while preserving accessibility and performance.
tags: animation, interaction, motion, micro-ux, transitions, creative
```

## When to Apply

このスキルは以下の場面で適用する:
- アニメーション、インタラクション、モーションデザイン、トランジション、スクロールエフェクト、マイクロUX、没入体験
- アニメーション、インタラクション、表現、演出、マイクロUX、没入感、スクロール、トランジション
- 視覚表現やタイミングベースのUI挙動

## Core Principles

- **Experience is state transitions and timing, not just visuals.** 時間経過に伴う変化をデザインする。
- **Constraints first.** アクセシビリティ (prefers-reduced-motion) とパフォーマンス (GPU負荷、INP/LCP) を尊重。
- **Start minimal.** 小さくプロトタイプし、価値を加えるアニメーションだけを残す。

## Design Philosophy (Decision Rules)

1. **Motion is information, but can also be noise.** 目的を明確にする: 視覚的ガイド、状態変化の理解、喜び (delight)。
2. **Don't animate everything.** 重要な瞬間だけアニメーションする (コントラストを生む)。
3. **Never break a11y.** reduced motion をサポートし、コントラストを維持し、フォーカスと操作性を保持する。
4. **Performance IS the experience.** レイアウト再計算を避ける; 軽量なテクニックを優先。
5. **Make it reversible.** アニメーションはトグル可能な機能として実装する。

## Initial Questions to Clarify

- **ユーザーはこのモーションから何を理解すべきか?** (Purpose)
- **想定環境は?** (モバイル / 低スペック / 低速ネットワーク)
- **何がトリガーか?** (ホバー / クリック / スクロール / ルート変更)
- **reduced motion サポートは必要か?** (Yesなら必須)

## Output Format (この順序で出力)

1. **Purpose** (何の体験目標を達成するか)
2. **Specification** (トリガー、状態、デュレーション、イージング、停止条件)
3. **Implementation approach** (ミニマルから開始 → 必要に応じて拡張)
4. **Accessibility considerations** (reduced motion、フォーカス、操作性)
5. **Performance considerations** (測定ポイント)
6. **Next actions** (プロトタイプ → 統合)

## Checklist

- [ ] モーションの目的を説明できるか? (「かっこいい」だけではNG)
- [ ] `prefers-reduced-motion` を尊重しているか?
- [ ] キーボード/フォーカス操作を妨げていないか?
- [ ] レイアウト再計算を避けているか? (transform/opacity を優先)
- [ ] INP/LCP への悪影響がないか?

## Common Pitfalls

- 全てをアニメーションしすぎて情報密度が下がる
- reduced motion を無視し、不快感や危険を生む
- 重い実装 (スクロールハンドラの乱用) で INP を悪化させる

---

## AltMe への適用ガイド

### React Native アニメーションの選択基準

| ユースケース | 推奨ライブラリ | 理由 |
|-------------|---------------|------|
| 画面遷移 | Expo Router (Stack/Tab) のデフォルト | ネイティブ遷移で十分 |
| マイクロインタラクション | `react-native-reanimated` | 60fps、UIスレッド |
| スプリングアニメーション | `react-native-reanimated` withSpring | 自然な物理感 |
| ジェスチャー連動 | `react-native-gesture-handler` + reanimated | スワイプ、ドラッグ |
| シンプルなフェード/スケール | `Animated` API (RN built-in) | 軽量で十分な場合 |

### アニメーションの時間指針

```typescript
const timing = {
  micro: 150,   // ボタンプレス、トグル
  short: 200,   // フェードイン/アウト
  medium: 300,  // 画面遷移、モーダル
  long: 500,    // 複雑なトランジション (稀に使用)
};

const easing = {
  enter: 'ease-out',     // 画面に入るとき
  exit: 'ease-in',       // 画面から出るとき
  standard: 'ease-in-out', // 状態変化
};
```

### AltMe で必要なアニメーション

1. **チャットメッセージの表示**: フェードイン + スライドアップ (short: 200ms)
2. **送信ボタンのプレス**: scale(0.97) + opacity(0.8) (micro: 150ms)
3. **AI思考中インジケータ**: パルスアニメーション (ループ)
4. **オンボーディングの画面遷移**: スライド (medium: 300ms)
5. **課金画面のプラン切り替え**: クロスフェード (short: 200ms)

### reduced motion 対応 (React Native)

```tsx
import { AccessibilityInfo } from 'react-native';

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const listener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced
    );
    return () => listener.remove();
  }, []);

  return reduced;
};

// 使用例
const animationDuration = useReducedMotion() ? 0 : 200;
```

### パフォーマンス原則

- `useNativeDriver: true` を可能な限り使用 (transform, opacity)
- `useAnimatedStyle` (reanimated) でUIスレッドでアニメーション
- スクロール連動は `useAnimatedScrollHandler` で (JSスレッドを避ける)
- 不要なリレンダーを避ける (`useMemo`, `useCallback`)
