# Research: V4 Dark Premium UI 実装

## R-1: Glassmorphism 実装パターン（React Native）

### Decision: expo-blur + expo-linear-gradient を追加インストール

### Rationale
- デザインファイルは半透明背景 + ボーダー + ぼかしを多用（`#FFFFFF12`, `#FFFFFF4D` 等）
- React Native には CSS `backdrop-filter: blur()` が存在しない
- `expo-blur` の `BlurView` は Expo SDK 54 でネイティブサポート済み
- ゴールド CTA のグラデーション（`#E8C567 → #C9A033 → #A07B1A`）には `expo-linear-gradient` が必要

### Alternatives Considered
- **Semi-transparent View only（blur なし）**: ぼかし効果なしでも glassmorphism 風の外観は可能。パフォーマンスは最良。ただしデザインの再現度は低下
- **@react-native-community/blur**: Expo managed workflow では prebuild が必要
- **react-native-skia**: 高機能だが学習コスト・バンドルサイズが過大

### Implementation Notes
- `BlurView` は `intensity` prop で blur 強度を制御（推奨: 16-20）
- Android では `BlurView` のパフォーマンスが iOS より低い → `experimentalBlurMethod="dimezisBlurView"` を検討
- フォールバック: blur が効かない環境では `rgba(30, 41, 59, 0.8)` の半透明背景をフォールバック

---

## R-2: Outfit フォント設定

### Decision: expo-font + @expo-google-fonts/outfit で Outfit Regular/Medium/SemiBold/Bold を追加

### Rationale
- 現在プロジェクトに Outfit フォントは未設定（FontAwesome のみロード中）
- デザインファイルは全テキストに Outfit を指定
- `@expo-google-fonts/outfit` パッケージで全ウェイトを一括取得可能

### Alternatives Considered
- **Google Fonts CDN からランタイムロード**: オフライン対応不可、初回描画遅延
- **手動フォントファイル追加**: 管理コストが高い
- **システムフォントのみ**: デザイン再現度が大幅に低下

### Implementation Notes
- `app/_layout.tsx` の `useFonts` に Outfit ウェイトを追加
- 日本語テキストは Outfit に含まれないため、システムフォント（Hiragino Sans）にフォールバック
- フォントロード中はスプラッシュ画面を維持（SplashScreen.preventAutoHideAsync）

---

## R-3: Cosmic 背景画像

### Decision: AI生成画像を `assets/images/cosmic-bg.png` として追加 + ImageBackground コンポーネント

### Rationale
- 現在プロジェクトに宇宙的背景画像アセットは存在しない
- デザインファイルの Landing/Login/Chat 等は全画面に cosmic 背景を使用
- 共通の `CosmicBackground` コンポーネントで全画面に適用

### Alternatives Considered
- **CSS グラデーションのみ**: 宇宙的な雰囲気が再現できない
- **Lottie アニメーション**: パフォーマンスへの影響が大きい
- **各画面に個別背景**: 重複コード・一貫性の欠如

### Implementation Notes
- `src/shared/components/cosmic-background.tsx` を作成
- `ImageBackground` + `View`（overlay `#0F172ACC`）で構成
- 画像読み込み遅延時は `#0F172A` ソリッド背景をフォールバック表示
- 画像サイズ: 1170x2532px (iPhone 14 Pro Max @3x) を推奨、resizeMode: "cover"

---

## R-4: カスタムタブバー

### Decision: Expo Router の Tabs tabBar prop でカスタムタブバーコンポーネントを実装

### Rationale
- デザインファイルのタブバー: ダーク背景 `#0F172AEE`、アクティブ=シアン `#00D4FF`/`#7DD3FC`、非アクティブ=`#64748B`
- 現在の Feather アイコンは lucide と互換性が高い（message-circle, users, bot, user 等）
- デフォルトの Expo Router タブバーでは背景透明度やスタイルのカスタマイズに限界がある

### Alternatives Considered
- **デフォルトタブバーのスタイル上書きのみ**: `tabBarStyle` で大部分は対応可能だが、透明度や backdrop blur は制限あり
- **lucide-react-native に切り替え**: アイコンの統一性は向上するが、追加依存が増える
- **react-native-tab-view**: Expo Router との統合が複雑

### Implementation Notes
- まずは `tabBarStyle` + `tabBarActiveTintColor`/`tabBarInactiveTintColor` でスタイル適用を試みる
- カスタムタブバーが必要な場合のみ `tabBar` prop でカスタムコンポーネントを作成
- Feather アイコンセットは lucide と同名のアイコンが多く、まずは Feather を維持

---

## R-5: 既存コードパターン分析

### Findings

| 項目 | 現状 | V4 対応 |
|------|------|---------|
| UI ライブラリ | Pure RN + FontAwesome | 変更なし |
| テーマシステム | `src/config/theme.ts` (V4 トークン適用済み) | 追加トークン（glassmorphism, gold gradient）が必要 |
| 共有コンポーネント | `GuestPromptOverlay` のみ | `CosmicBackground`, `GlassCard`, `GoldButton` 追加 |
| フォント | FontAwesome のみ | + Outfit (4 weights) |
| 背景画像 | なし | cosmic-bg.png 追加 |
| グラデーション | なし（expo-linear-gradient 未インストール） | expo-linear-gradient 追加 |
| ブラー | なし（expo-blur 未インストール） | expo-blur 追加 |
| アイコン | Feather (tab) + FontAwesome (UI) | Feather 維持、lucide 風のアイコン名はそのまま対応 |
| 画面レイアウト | SafeAreaView > View > Content | SafeAreaView > CosmicBackground > Content |
| スタイル | StyleSheet.create + theme tokens | 同パターン維持 |

### Screen File Structure

```
app/
├── (auth)/login.tsx           # Landing + Login (2画面を1ファイルで state 切替)
├── (onboarding)/
│   ├── welcome.tsx
│   ├── personality-quiz.tsx
│   ├── result.tsx
│   ├── choose-avatar.tsx
│   ├── choose-tone.tsx
│   └── meet-twin.tsx
├── (paywall)/index.tsx
├── (tabs)/
│   ├── _layout.tsx            # カスタムタブバー
│   ├── index.tsx              # Chat (Free/Pro/Attach は state で切替)
│   ├── community.tsx
│   ├── twin.tsx               # MyAgent
│   └── settings.tsx           # MyPage
├── subscription-manage.tsx     # Modal
├── twin-conversation-detail.tsx # Modal
├── account-delete-confirm.tsx  # Modal
└── community-create.tsx        # Sub-screen
```

### Feature Store Files
- `src/features/auth/stores/auth-store.ts`
- `src/features/onboarding/stores/onboarding-store.ts`
- 他の feature ディレクトリには store/component なし（UI は全て `app/` 配下に直接実装）

---

## R-6: 新規パッケージ依存

### 必要なパッケージ追加

| パッケージ | バージョン | 用途 |
|-----------|----------|------|
| `expo-blur` | ^14.x | Glassmorphism blur 効果 |
| `expo-linear-gradient` | ^14.x | ゴールド CTA グラデーション |
| `@expo-google-fonts/outfit` | ^0.x | Outfit フォント |

### インストールコマンド
```bash
npx expo install expo-blur expo-linear-gradient @expo-google-fonts/outfit
```

---

## R-7: Constitution Check

### 原則1: Spec-First ✅
- spec.md に 19画面の FR/AC を完全定義済み

### 原則2: Mobile-First UX ✅
- 44pt タップターゲット、WCAG 2.1 AA コントラスト比を FR で定義

### 原則3: Type-Safe Contracts ✅
- UI 変更のみ、型定義の変更なし

### 原則4: Security by Default ✅
- UI リファクタのみ、セキュリティ影響なし

### 原則5: Simplicity / YAGNI ✅
- 共有コンポーネント（CosmicBackground, GlassCard, GoldButton）は全画面で再利用
- 不必要な抽象化は避ける

### Gate Check
- Constitution 違反: 0件 → PASS
