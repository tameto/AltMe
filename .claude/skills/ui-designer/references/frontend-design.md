# Anthropic Frontend Design Skill

> Source: https://github.com/anthropics/skills/tree/main/skills/frontend-design

独自性のある、プロダクション品質のフロントエンドインターフェースを構築するためのガイド。
ジェネリックな「AI スロップ」的美学を避け、意図的なデザイン選択を重視する。

---

## Design Thinking Process

コーディング前に、文脈を理解し、大胆な美的方向性にコミットする:

### 1. 目的特定 (Purpose)
- このインターフェースはどんな問題を解決するか?
- 誰が使うのか?

### 2. 美的方向性選択 (Tone)
極端な方向性を1つ選び、徹底的に実行する:

| 方向性 | 特徴 |
|--------|------|
| Brutally Minimal | 極限まで削ぎ落としたミニマリズム |
| Maximalist Chaos | 情報過密で刺激的な表現 |
| Retro-Futuristic | レトロとフューチャーの融合 |
| Organic/Natural | 自然でオーガニックな雰囲気 |
| Luxury/Refined | 高級感と洗練 |
| Playful/Toy-like | 遊び心のあるデザイン |
| Editorial/Magazine | 雑誌のようなレイアウト |
| Brutalist/Raw | 生々しいブルータリズム |
| Art Deco/Geometric | 幾何学的装飾 |
| Soft/Pastel | 柔らかいパステル調 |
| Industrial/Utilitarian | 工業的・実用的 |

### 3. 制約認識 (Constraints)
- 技術的要件（フレームワーク、パフォーマンス、アクセシビリティ）

### 4. 差別化 (Differentiation)
- 何がこのデザインを忘れられないものにするか?
- ユーザーが覚えている「1つのこと」は何か?

**重要**: 明確なコンセプト方向性を選び、精密に実行する。大胆なマキシマリズムも洗練されたミニマリズムも両方機能する — 鍵は意図性であり、強度ではない。

---

## Typography

### フォント選択ルール
- **美しく、ユニークで、興味深いフォントを選ぶ**
- 汎用フォント（Arial, Inter, Roboto, system fonts）は避ける
- 特徴的なディスプレイフォントと洗練されたボディフォントをペアリング
- 予想外で個性のあるフォントの組み合わせを追求
- 同じフォント（例: Space Grotesk）への収束を避ける — 毎回異なる選択を

### AltMe向け推奨
React Native / Expo では Google Fonts（@expo-google-fonts）を活用:
- ディスプレイ: 個性的なフォント（プロジェクトの方向性に合わせて選択）
- ボディ: 可読性の高いフォント
- 既存テーマの定義を尊重しつつ、画面ごとの方向性に合わせて調整

---

## Color Schemes

### CSS変数でのカラー管理
- 一貫性のあるカラースキームにコミット
- CSS変数（React Nativeの場合はテーマ定数）で管理
- **支配的なカラー + シャープなアクセント** > 臆病で均等配分されたパレット

### アンチパターン: 避けるべき配色
- 白背景に紫グラデーション（クリシェ）
- AI生成デザインの定番カラー
- 文脈を無視した汎用パレット

### AltMe向け
```typescript
// AltMe既存パレットを活用しつつ、画面の目的に応じてアクセントを変える
// メイン: #6C63FF (紫) → 大胆なアクセントとして使用
// セカンダリ: #4ECDC4 (ティール) → 補助的なアクセント
// 単調にならないよう、グラデーションやレイヤーで深みを出す
```

---

## Motion & Animation

### 原則
- **ハイインパクトな瞬間に集中**: 分散したマイクロインタラクションより、よく演出されたページロード + スタガードリビール（animation-delay）の方がデライトを生む
- スクロールトリガーとサプライズのあるホバーステートを活用
- CSSのみのソリューションを優先（HTMLの場合）
- React/React Native では Motion ライブラリを活用

### 実装のポイント
- `animation-delay` でスタガード効果
- スクロールトリガーによるリビールアニメーション
- ホバー時のサプライズ演出
- パフォーマンス: `transform` と `opacity` のみ使用

### AltMe向け React Native 実装
```tsx
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';

// スタガードリビール
{items.map((item, index) => (
  <Animated.View
    key={item.id}
    entering={FadeInDown.delay(index * 100).springify()}
  >
    <ItemCard item={item} />
  </Animated.View>
))}
```

---

## Spatial Composition

### 非従来型レイアウト
- **非対称**: 完全な対称を避ける
- **オーバーラップ**: 要素同士の重なりで奥行き
- **対角線フロー**: 対角方向の視線誘導
- **グリッドブレイク**: グリッドを意図的に壊す要素
- **ネガティブスペース**: 贅沢な余白、または制御された密度

### AltMe向け
- チャット画面: 非対称な吹き出しレイアウト
- オンボーディング: 大胆なネガティブスペース活用
- ダッシュボード: Bento Grid レイアウトの検討

---

## Visual Depth

### 背景と視覚的ディテール
単色背景にデフォルトせず、雰囲気と深みを作る:

| テクニック | 説明 |
|-----------|------|
| Gradient Meshes | メッシュグラデーション |
| Noise Textures | ノイズテクスチャ |
| Geometric Patterns | 幾何学パターン |
| Layered Transparencies | 透明度のレイヤー |
| Dramatic Shadows | ドラマチックなシャドウ |
| Decorative Borders | 装飾的なボーダー |
| Grain Overlays | グレインオーバーレイ |

### AltMe向け実装例
```tsx
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// 背景にグラデーションメッシュ風効果
<LinearGradient
  colors={['#6C63FF', '#4ECDC4', '#F8F9FA']}
  locations={[0, 0.5, 1]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.backgroundGradient}
/>

// カード上のブラー効果（グラスモーフィズム風）
<BlurView intensity={80} tint="light" style={styles.glassCard}>
  {/* Card content */}
</BlurView>
```

---

## Anti-Patterns: 避けるべきジェネリックなデザイン

### 絶対に使わない
1. **汎用フォント**: Inter, Roboto, Arial, system fonts
2. **クリシェ配色**: 白背景に紫グラデーション
3. **予測可能なレイアウト**: Cookie-cutter のカード並び
4. **文脈無視のデザイン**: どのプロジェクトでも同じに見えるUI
5. **収束するフォント選択**: Space Grotesk など同じフォントへの偏り

### 代わりに
- 創造的に解釈し、文脈に合った予想外の選択をする
- ライトテーマとダークテーマを使い分ける
- 毎回異なるフォント、異なる美的方向性を採用
- デザインは文脈のために本当に設計されたと感じられるべき

---

## 実装品質基準

### コード品質
- プロダクショングレードで機能する
- 視覚的にストライキングで記憶に残る
- 明確な美的視点を持ち一貫している
- あらゆるディテールが綿密にリファインされている

### 複雑さとビジョンのマッチング
- **マキシマリストデザイン**: 精巧なコード、広範なアニメーション、効果
- **ミニマリスト / 洗練されたデザイン**: 抑制、精密さ、スペーシング・タイポグラフィ・微細なディテールへの注意
- エレガンスはビジョンをうまく実行することから生まれる

---

## AltMe プロジェクトへの適用

### 推奨美的方向性
AltMe（AIツインアプリ）に適した方向性:
- **Luxury/Refined + Soft/Pastel**: 信頼感と親しみやすさの両立
- メイン紫（#6C63FF）をアクセントとして大胆に使いつつ、全体はソフトな印象
- ダークモードでは深みのある背景 + 鮮やかなアクセント

### React Native / Expo 固有の注意点
- Web CSS のテクニック（CSS変数、@keyframes）は直接使えない
- `react-native-reanimated` + `expo-linear-gradient` + `expo-blur` で同等の効果を実現
- `StyleSheet.create` でパフォーマンスを維持
- `prefers-reduced-motion` は `AccessibilityInfo.isReduceMotionEnabled()` で対応
