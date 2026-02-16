# UI/UX Pro Max - Design Intelligence

> Source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

50+ スタイル、97 カラーパレット、57 フォントペアリング、99 UX ガイドライン、25 チャートタイプを 9 テクノロジースタック横断で提供する包括的デザインインテリジェンスシステム。

---

## Rule Categories by Priority (99 UX Guidelines)

| Priority | Category | Impact | Domain |
|----------|----------|--------|--------|
| 1 | Accessibility | CRITICAL | `ux` |
| 2 | Touch & Interaction | CRITICAL | `ux` |
| 3 | Performance | HIGH | `ux` |
| 4 | Layout & Responsive | HIGH | `ux` |
| 5 | Typography & Color | MEDIUM | `typography`, `color` |
| 6 | Animation | MEDIUM | `ux` |
| 7 | Style Selection | MEDIUM | `style`, `product` |
| 8 | Charts & Data | LOW | `chart` |

---

## 1. Accessibility (CRITICAL)

- `color-contrast` — テキスト最小 4.5:1 コントラスト比
- `focus-states` — インタラクティブ要素に可視フォーカスリング
- `alt-text` — 意味のある画像に説明的 alt テキスト
- `aria-labels` — アイコンのみのボタンに aria-label
- `keyboard-nav` — タブ順序がビジュアル順序と一致
- `form-labels` — label と for 属性の紐付け

## 2. Touch & Interaction (CRITICAL)

- `touch-target-size` — 最小 44x44px タッチターゲット
- `hover-vs-tap` — メインインタラクションに click/tap を使用
- `loading-buttons` — 非同期操作中はボタンを無効化
- `error-feedback` — 問題の近くに明確なエラーメッセージ
- `cursor-pointer` — クリッカブル要素に cursor-pointer

## 3. Performance (HIGH)

- `image-optimization` — WebP, srcset, lazy loading を使用
- `reduced-motion` — prefers-reduced-motion をチェック
- `content-jumping` — 非同期コンテンツのスペースを予約

## 4. Layout & Responsive (HIGH)

- `viewport-meta` — width=device-width initial-scale=1
- `readable-font-size` — モバイルのボディテキスト最小 16px
- `horizontal-scroll` — コンテンツがビューポート幅に収まること
- `z-index-management` — z-index スケール定義（10, 20, 30, 50）

## 5. Typography & Color (MEDIUM)

- `line-height` — ボディテキストに 1.5-1.75 を使用
- `line-length` — 1行 65-75 文字に制限
- `font-pairing` — 見出し/ボディフォントの性格を合わせる

## 6. Animation (MEDIUM)

- `duration-timing` — マイクロインタラクションに 150-300ms
- `transform-performance` — width/height でなく transform/opacity を使用
- `loading-states` — スケルトンスクリーンまたはスピナー

## 7. Style Selection (MEDIUM)

- `style-match` — プロダクトタイプにスタイルを合わせる
- `consistency` — 全ページで同じスタイル
- `no-emoji-icons` — **UI アイコンに絵文字を使わない**、SVG アイコンを使用

## 8. Charts & Data (LOW)

- `chart-type` — データタイプにチャートタイプを合わせる
- `color-guidance` — アクセシブルなカラーパレット使用
- `data-table` — アクセシビリティのためテーブル代替を提供

---

## 50+ Styles

主要スタイル一覧:
- Glassmorphism — ブラー + 透明度で浮遊感
- Claymorphism — 3D の粘土風テクスチャ
- Minimalism — 必要最小限の要素
- Brutalism — 生々しい、ルール無視のデザイン
- Neumorphism — 柔らかい押出/凹み
- Bento Grid — 整理されたグリッドレイアウト
- Skeuomorphism — 実物を模倣したデザイン
- Flat Design — フラットで影のないデザイン
- その他多数（Dark Mode, Retro, Cyberpunk, Art Deco, etc.）

---

## 97 Color Palettes

プロダクトタイプ別に最適なカラーパレットを提供:
- SaaS / E-commerce / Healthcare / Beauty / Fintech / Education / Service 等

---

## 57 Font Pairings

Google Fonts からの推奨ペアリング:
- Elegant / Playful / Professional / Modern / Luxury 等のキーワードで検索可能

---

## 25 Chart Types

データの種類に応じた推奨チャート:
- Trend → Line Chart
- Comparison → Bar Chart
- Timeline → Gantt Chart
- Funnel → Funnel Chart
- Composition → Pie/Donut Chart
- 等

---

## 9 Technology Stacks

| Stack | Focus |
|-------|-------|
| `html-tailwind` | Tailwind utilities, responsive, a11y (DEFAULT) |
| `react` | State, hooks, performance, patterns |
| `nextjs` | SSR, routing, images, API routes |
| `vue` | Composition API, Pinia, Vue Router |
| `svelte` | Runes, stores, SvelteKit |
| `swiftui` | Views, State, Navigation, Animation |
| **`react-native`** | **Components, Navigation, Lists** |
| `flutter` | Widgets, State, Layout, Theming |
| `shadcn` | shadcn/ui components, theming, forms, patterns |

### React Native 固有ガイドライン
- コンポーネント: `View`, `Text`, `Pressable`, `FlatList`, `FlashList`
- ナビゲーション: React Navigation / Expo Router
- リスト: `FlatList` / `FlashList` でのパフォーマンス最適化
- タッチ: 44x44px 最小タッチターゲット
- アニメーション: `react-native-reanimated` を使用

---

## Implementation Workflow（4ステップ）

### Step 1: Analyze User Requirements
- **Product type**: SaaS, e-commerce, portfolio, dashboard, landing page, etc.
- **Style keywords**: minimal, playful, professional, elegant, dark mode, etc.
- **Industry**: healthcare, fintech, gaming, education, etc.
- **Stack**: react-native（AltMe の場合）

### Step 2: Generate Design System (REQUIRED)
常に `--design-system` でスタートし、包括的な推奨を得る:
- パターン、スタイル、カラー、タイポグラフィ、エフェクトを一括生成
- アンチパターンも含む
- **Master + Overrides パターン**: グローバルルール + ページ固有のオーバーライド

### Step 3: Supplement with Detailed Searches
デザインシステム生成後、必要に応じてドメイン検索で詳細を補完:

| Need | Domain | Example |
|------|--------|---------|
| スタイル選択肢 | `style` | glassmorphism dark |
| チャート推奨 | `chart` | real-time dashboard |
| UXベストプラクティス | `ux` | animation accessibility |
| 代替フォント | `typography` | elegant luxury |
| LP構造 | `landing` | hero social-proof |

### Step 4: Stack Guidelines
実装固有のベストプラクティスを取得:
```
react-native: Components, Navigation, Lists
```

---

## Professional Standards Checklist

### Icons & Visual Elements

| Rule | Do | Don't |
|------|----|----- |
| **No emoji icons** | SVG icons (Heroicons, Lucide, Simple Icons) | 絵文字（例: rocket, gear）をUIアイコンとして使用 |
| **Stable hover states** | color/opacity transitions | scale で layout shift を起こす |
| **Correct brand logos** | Simple Icons から公式 SVG | 推測や間違ったロゴパス |
| **Consistent icon sizing** | 固定 viewBox (24x24) + w-6 h-6 | 異なるサイズの混在 |

### Interaction & Cursor

| Rule | Do | Don't |
|------|----|----- |
| **Cursor pointer** | クリッカブル/ホバラブルなカードに `cursor-pointer` | インタラクティブ要素にデフォルトカーソル |
| **Hover feedback** | 視覚的フィードバック（color, shadow, border） | インタラクティブであることの表示なし |
| **Smooth transitions** | `transition-colors duration-200` | 瞬時の変更 or 遅すぎる（>500ms） |

### Light/Dark Mode Contrast

| Rule | Light Mode | Dark Mode |
|------|-----------|-----------|
| **Glass card** | `bg-white/80` 以上 | `bg-white/10` 以下は透明すぎ |
| **Text contrast** | `#0F172A` (slate-900) | 十分なコントラスト確保 |
| **Muted text** | `#475569` (slate-600) 最小 | gray-400 以下は不可 |
| **Border visibility** | `border-gray-200` | `border-white/10` は見えない |

### Layout & Spacing

| Rule | Do | Don't |
|------|----|----- |
| **Floating navbar** | `top-4 left-4 right-4` のスペーシング | `top-0 left-0 right-0` にべた付き |
| **Content padding** | 固定ナビバーの高さを考慮 | 固定要素の裏にコンテンツが隠れる |
| **Consistent max-width** | 同じ `max-w-6xl` or `max-w-7xl` | 異なるコンテナ幅の混在 |

---

## Pre-Delivery Verification

### Visual Quality
- [ ] 絵文字をアイコンとして使っていない（SVGを使用）
- [ ] 全アイコンが一貫したアイコンセット（Heroicons/Lucide）
- [ ] ブランドロゴが正確（Simple Icons で確認）
- [ ] ホバーステートがレイアウトシフトを起こさない
- [ ] テーマカラーを直接使用

### Interaction
- [ ] 全クリッカブル要素に `cursor-pointer`（React Native では不要）
- [ ] ホバーステートが明確な視覚フィードバック
- [ ] トランジションがスムーズ（150-300ms）
- [ ] フォーカスステートがキーボードナビゲーション用に可視

### Light/Dark Mode
- [ ] ライトモードテキストに十分なコントラスト（4.5:1 最小）
- [ ] Glass/透明要素がライトモードで見える
- [ ] ボーダーが両モードで見える
- [ ] 配信前に両モードをテスト

### Layout
- [ ] フローティング要素にエッジからの適切なスペーシング
- [ ] 固定ナビバー裏にコンテンツが隠れない
- [ ] レスポンシブ: 375px, 768px, 1024px, 1440px
- [ ] モバイルで水平スクロールなし

### Accessibility
- [ ] 全画像に alt テキスト
- [ ] フォーム入力にラベル
- [ ] カラーだけが唯一のインジケータでない
- [ ] `prefers-reduced-motion` を尊重

---

## AltMe プロジェクトへの適用

### 推奨スタイル
- **Minimalism + Glassmorphism**: AI アプリとして先進的かつクリーンな印象
- ダークモード対応必須
- Bento Grid でダッシュボード/履歴画面を整理

### React Native 固有の注意
- SVG アイコン: `react-native-svg` + `lucide-react-native` を使用
- タッチターゲット: `hitSlop` で拡大可能
- z-index 管理: React Native では `zIndex` StyleSheet プロパティ
- アニメーション: 150-300ms を `react-native-reanimated` で実装

### Design System Persistence
AltMe 用の Master Design System を維持:
- `src/config/theme.ts` — グローバルソースオブトゥルース
- 画面ごとのオーバーライドは各 feature 内で管理
