# Tasks: V4 Dark Premium UI 実装

**Input**: `.sdd/specs/20260216-v4-dark-ui/` design documents
**Prerequisites**: plan.md (required), spec.md (required), research.md

## Agent Team Execution Model

This task list is executed by the `/sdd-implement` command as an Agent Team.

**Execution flow:**
1. Leader creates team via TeamCreate
2. Each task registered via TaskCreate (dependencies expressed with `blockedBy`)
3. Parallel tasks within each Phase are spawned as teammates
4. Quality gate at each Phase Checkpoint
5. All Phases complete -> TeamDelete -> `/compact`

## Task Notation

```markdown
### T001: Task Title
- **agent**: rn-mobile-dev | general-purpose | Bash | code-reviewer | doc-updater
- **story**: US1 | shared | polish
- **parallel**: yes | no
- **blockedBy**: [] | [T001, T002]
- **files**: target file paths (multiple OK)
- **acceptance**: completion criteria

Detailed description enabling an independent agent to complete the task from this alone.
```

---

## Phase 1: Setup

**Purpose**: Install dependencies and prepare project for V4 Dark Premium implementation
**Checkpoint**: Dependencies installed, `tsc --noEmit` passes

### T001: Install new dependencies (expo-blur, expo-linear-gradient, Outfit font)
- **agent**: Bash
- **story**: shared
- **parallel**: no
- **blockedBy**: []
- **files**: package.json
- **acceptance**: `npx expo install` succeeds, no version conflicts

Run the following command:
```bash
npx expo install expo-blur expo-linear-gradient @expo-google-fonts/outfit
```

These packages enable:
- `expo-blur`: `BlurView` for glassmorphism cards/bubbles (intensity prop, tint="dark")
- `expo-linear-gradient`: `LinearGradient` for gold CTA buttons and send button gradients
- `@expo-google-fonts/outfit`: Outfit font in Regular(400), Medium(500), SemiBold(600), Bold(700)

Verify: `tsc --noEmit` after install.

### T002: Configure Outfit font loading in root layout
- **agent**: rn-mobile-dev
- **story**: shared
- **parallel**: no
- **blockedBy**: [T001]
- **files**: app/_layout.tsx
- **acceptance**: App launches with Outfit fonts loaded, SplashScreen hides after font load

Edit `app/_layout.tsx`:
1. Import from `@expo-google-fonts/outfit`: `Outfit_400Regular`, `Outfit_500Medium`, `Outfit_600SemiBold`, `Outfit_700Bold`
2. Add these to the existing `useFonts` call (merge with `FontAwesome.font`)
3. Ensure `SplashScreen.preventAutoHideAsync()` is called before fonts load
4. Call `SplashScreen.hideAsync()` after fonts are loaded

**Existing pattern**: The file already uses `useFonts` with `FontAwesome.font`. Merge the Outfit fonts into the same call.

**AltMe convention**: `app/_layout.tsx` uses `export default` (Expo Router exception). Keep all existing navigation logic intact.

### T003: Extend theme tokens with glassmorphism, gold gradient, and tab bar constants
- **agent**: rn-mobile-dev
- **story**: shared
- **parallel**: no
- **blockedBy**: [T001]
- **files**: src/config/theme.ts
- **acceptance**: `tsc --noEmit` passes, existing imports unaffected

Add the following named exports to `src/config/theme.ts` (append after existing exports):

```typescript
export const glassmorphism = {
  card: { bg: '#FFFFFF12', border: '#FFFFFF25', blur: 16 },
  bubble: {
    ai: { bg: '#FFFFFF4D', border: '#FFFFFF15' },
    user: { bg: '#7DD3FC4D', border: '#7DD3FC30' },
  },
  input: { bg: '#FFFFFF0D', border: '#FFFFFF15' },
} as const;

export const goldGradient = {
  colors: ['#E8C567', '#C9A033', '#A07B1A'] as const,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 0 },
} as const;

export const sendGradient = {
  colors: ['#7DD3FC', '#38BDF8'] as const,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
} as const;

export const tabBarColors = {
  background: '#0F172AEE',
  active: '#00D4FF',
  inactive: '#64748B',
  border: '#FFFFFF15',
} as const;

export const fontFamily = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semiBold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
} as const;
```

**Reference**: plan.md "Design Token Reference" section for exact hex values extracted from .pen file.

**Phase 1 Checkpoint**: `tsc --noEmit`

---

## Phase 2: Foundational (Blocking)

**Purpose**: Create shared UI components and configure tab bar. All user story work depends on this.
**Checkpoint**: Shared components compile, tab bar styled, `tsc --noEmit && npx jest --passWithNoTests`

**CRITICAL**: No user story work may begin until this Phase completes.

### T004: Create CosmicBackground shared component
- **agent**: rn-mobile-dev
- **story**: shared
- **parallel**: yes
- **blockedBy**: [T003]
- **files**: src/shared/components/cosmic-background.tsx, assets/images/cosmic-bg.png
- **acceptance**: Component renders cosmic background with overlay, fallback color works

Create `src/shared/components/cosmic-background.tsx`:

```typescript
// Named export (AltMe convention)
export function CosmicBackground({ children, overlayOpacity = 0.8 }: Props)
```

**Implementation**:
- Use `ImageBackground` from `react-native` with `source={require('@/assets/images/cosmic-bg.png')}`
- Overlay: `View` with `backgroundColor: '#0F172A'` + opacity from prop (default `#0F172ACC` = 80%)
- `resizeMode="cover"` for full bleed
- Fallback: Set `backgroundColor: '#0F172A'` on the ImageBackground `style` so it shows while image loads
- Wrap with `React.memo` (static content, rarely re-renders)
- `style` prop for flex customization

**For the cosmic background image**: Create a simple dark starfield image. If AI generation is unavailable, create a minimal placeholder (solid `#0F172A` with subtle gradient/noise). The key is having the file exist at `assets/images/cosmic-bg.png`.

**AltMe conventions**: Named export, kebab-case filename, 1 file = 1 component.

### T005: Create GlassCard and GoldButton shared components
- **agent**: rn-mobile-dev
- **story**: shared
- **parallel**: yes
- **blockedBy**: [T003]
- **files**: src/shared/components/glass-card.tsx, src/shared/components/gold-button.tsx
- **acceptance**: Both components render correctly, TypeScript types exported

**GlassCard** (`src/shared/components/glass-card.tsx`):
```typescript
export function GlassCard({ children, variant = 'card', style }: Props)
```
- Import `BlurView` from `expo-blur`
- `variant` prop: `'card'` | `'bubble-ai'` | `'bubble-user'` | `'input'`
- Each variant uses different bg/border from `glassmorphism` tokens in theme.ts
- Parent `View` with `overflow: 'hidden'` + `borderRadius` (required for BlurView on Android)
- `BlurView` with `intensity={glassmorphism.card.blur}` (16), `tint="dark"`
- Inner `View` with semi-transparent `backgroundColor` as fallback
- `borderWidth: 1`, `borderColor` from variant tokens
- Android: Add `experimentalBlurMethod="dimezisBlurView"` prop

**GoldButton** (`src/shared/components/gold-button.tsx`):
```typescript
export function GoldButton({ title, onPress, disabled, loading, style }: Props)
```
- Import `LinearGradient` from `expo-linear-gradient`
- Use `goldGradient` tokens from theme.ts: `colors={goldGradient.colors}`, `start`/`end`
- Height: 54px, `borderRadius: 22`
- Text: `color: '#0F172A'` (textInverse), Outfit_700Bold, fontSize 18
- Disabled state: `opacity: 0.6`
- Loading state: `ActivityIndicator` replacing text
- Wrap in `Pressable` for press handling

**Reference**: plan.md "Design Token Reference" → Gold CTA Gradient section.

### T006: Update tab bar styling for V4 Dark Premium
- **agent**: rn-mobile-dev
- **story**: shared
- **parallel**: yes
- **blockedBy**: [T003]
- **files**: app/(tabs)/_layout.tsx
- **acceptance**: Tab bar has dark background, cyan active color, correct icons

Edit `app/(tabs)/_layout.tsx`:

1. Import `tabBarColors` from `@/src/config/theme`
2. Update `screenOptions` in `<Tabs>`:
   ```typescript
   tabBarActiveTintColor: tabBarColors.active,     // '#00D4FF'
   tabBarInactiveTintColor: tabBarColors.inactive,  // '#64748B'
   tabBarStyle: {
     backgroundColor: tabBarColors.background,       // '#0F172AEE'
     borderTopColor: tabBarColors.border,             // '#FFFFFF15'
     borderTopWidth: 1,
     elevation: 0,                                    // Remove Android shadow
   },
   ```
3. Tab icons remain Feather: `message-circle`, `users`, `cpu` (or `bot`), `user`
4. Keep `headerShown: false` on all tabs

**Existing code**: Currently uses `tabBarActiveTintColor: colors.primary`. Update to use new `tabBarColors`.

**Phase 2 Checkpoint**: `tsc --noEmit && npx jest --passWithNoTests`

---

## Phase 3: US1 — Auth 画面のプレミアムランディング体験 (P1)

**Goal**: ランディング→ログイン画面を V4 Dark Premium デザインに更新
**Independent Test**: ランディング画面を開き、cosmic背景・glassmorphismカード・ゴールドCTA・Auth ボタンが正しく表示されること

### T010: Refactor Landing + Login screen to V4 Dark Premium
- **agent**: rn-mobile-dev
- **story**: US1
- **parallel**: yes
- **blockedBy**: [T004, T005, T006]
- **files**: app/(auth)/login.tsx
- **acceptance**: Landing/Login 両状態がデザインノード YKJ8P/ISa7t と視覚的に一致

**This is a single task because Landing and Login share the same file** (`app/(auth)/login.tsx`). The current implementation likely uses state to toggle between Landing and Login views.

**Landing 状態 (Design Node: YKJ8P)**:
- Wrap entire screen in `<CosmicBackground>`
- Logo: `<Text>` with `fontFamily: 'Outfit_400Regular'`, `fontSize: 52`, `fontWeight: '200'`, `color: '#F8FAFC'`, content "AltMe"
- Tagline: `color: '#94A3B8'`, `fontSize: 16`
- 3 Feature Cards: Use `<GlassCard variant="card">` with:
  - `fill: '#FFFFFF12'`, `stroke: '#FFFFFF25' 1px`, `cornerRadius: 16`, `padding: [16, 20]`
  - Each card: Feather icon + title + description text
- CTA: `<GoldButton title={t('auth.startLogin')}/>` — gradient `#E8C567→#C9A033→#A07B1A`, height 54, cornerRadius 22
- Guest link: `<Pressable>` text `color: '#94A3B8'`, `fontSize: 14`, underline
- Legal row: 利用規約 | プライバシーポリシー, `color: '#64748B'`, `fontSize: 12`

**Login 状態 (Design Node: ISa7t)**:
- Same `<CosmicBackground>`
- Same logo
- Apple Sign-In button: `backgroundColor: '#000000'`, white text, lucide/FontAwesome apple icon, height 54, cornerRadius 14. **Apple HIG: #000000 is hardcoded, NOT from theme**
- Google Sign-In button: `backgroundColor: '#FFFFFF'`, `borderColor: '#7DD3FC80'`, `borderWidth: 1`, `color: '#1F1F1F'` text, `google-g-icon.png`, height 54, cornerRadius 14
- Legal row (same as Landing)

**Existing patterns**: Read current `app/(auth)/login.tsx` to understand existing state management and navigation. Preserve all `useAuthStore` calls, `handleAppleSignIn`, `handleGoogleSignIn`, `enterGuestMode` logic. Only change JSX structure and StyleSheet.

**AltMe conventions**: `export default` for Expo Router screen file. Use `useTranslation()` for all user-facing text.

---

## Phase 4: US2 — チャット画面のダークプレミアム体験 (P1)

**Goal**: チャット画面（Free/Pro/Attach）を V4 Dark Premium に更新
**Independent Test**: チャット画面でメッセージ送受信し、バブル・タグ・入力バーがデザイン通りに表示

### T020: Refactor Chat screen styles to V4 Dark Premium
- **agent**: rn-mobile-dev
- **story**: US2
- **parallel**: yes
- **blockedBy**: [T004, T005, T006]
- **files**: app/(tabs)/index.tsx
- **acceptance**: Chat Free/Pro/Attach がデザインノード vVQxs/WGNcl/lmaHb と視覚的に一致

**This is a single large task because all Chat variants are in one file** (`app/(tabs)/index.tsx`).

**全体レイアウト**:
- Wrap in `<CosmicBackground>` (overlay `#0F172ACC`)
- `<SafeAreaView>` inside CosmicBackground, `backgroundColor: 'transparent'`

**ヘッダー**:
- 左: Bot avatar (36px circle, `borderColor: colors.primary` 2px, placeholder image) + "AltMe" text (Outfit Bold) + green dot `#34D399` "Online"
- 右 (Free only): Badge "3/3" with `backgroundColor: colors.primary`, `color: '#0F172A'`, cornerRadius full

**カテゴリタグ行** (horizontal ScrollView):
- Active tag: `color: '#7DD3FC'`, `backgroundColor: '#7DD3FC20'`, `borderRadius: 9999`
- Inactive tag: `color: '#FFFFFF80'`, `backgroundColor: '#FFFFFF10'`, `borderRadius: 9999`
- Horizontal padding, gap 8

**日付セパレータ**: `color: '#FFFFFF40'`, `textAlign: 'center'`, `fontSize: 12`

**メッセージバブル**:
- AI (left): Use `<GlassCard variant="bubble-ai">` or inline styles:
  - `backgroundColor: '#FFFFFF4D'`, `borderColor: '#FFFFFF15'`, `borderWidth: 1`
  - `borderRadius: [4, 16, 16, 16]` (topLeft=4, others=16, i.e. `borderTopLeftRadius: 4, borderTopRightRadius: 16, borderBottomRightRadius: 16, borderBottomLeftRadius: 16`)
  - AI avatar on left
- User (right):
  - `backgroundColor: '#7DD3FC4D'`, `borderColor: '#7DD3FC30'`, `borderWidth: 1`
  - `borderRadius: [16, 4, 16, 16]` (topRight=4, others=16)

**入力バー**:
- Container: `backgroundColor: '#FFFFFF0D'`, `borderColor: '#FFFFFF15'`, `borderWidth: 1`, `borderRadius: 9999`
- TextInput: `color: '#F8FAFC'`, `placeholderTextColor: '#64748B'`
- Send button: `LinearGradient` with `colors: ['#7DD3FC', '#38BDF8']`, circular, Feather `send` icon white

**Pro 差分**: Hide remaining count badge, show WebSocket connection indicator
**Attach 差分**: Show attachment preview area (design node lmaHb)

**Preserve all existing logic**: FlatList, message sending, streaming, WebSocket, edge function calls. Only modify JSX structure and styles.

---

## Phase 5: US3 — メインタブ画面 (P1)

**Goal**: Community / MyAgent / MyPage 3画面を V4 Dark Premium に更新
**Independent Test**: 4タブを順に遷移し各画面のレイアウトがデザインと一致

### T030: Refactor Community screen to V4 Dark Premium
- **agent**: rn-mobile-dev
- **story**: US3
- **parallel**: yes
- **blockedBy**: [T004, T005, T006]
- **files**: app/(tabs)/community.tsx
- **acceptance**: デザインノード sjBQF と視覚的に一致

**Design Node: sjBQF**

- `<CosmicBackground>` + `<SafeAreaView style={{ backgroundColor: 'transparent' }}>`
- Header: "AltMe" text (Outfit Bold 24px, `#F8FAFC`)
- Language switcher: pill toggle JP/EN. Active: `backgroundColor: '#7DD3FC'`, `color: '#0F172A'`. Inactive: `backgroundColor: 'transparent'`, `color: '#F8FAFC'`
- Section header: "人気のコミュニティ" + "+" button (`color: '#7DD3FC'`)
- Community cards (vertical list):
  - `backgroundColor: '#FFFFFF08'`, `borderColor: '#7DD3FC40'`, `borderWidth: 1`, `borderRadius: 16`
  - Thumbnail (48px circle) + community name (Outfit SemiBold) + participant count + conversation count
- Pro upgrade banner: glass background + GoldButton "Proにアップグレード"

**Preserve**: All existing state management, data fetching, navigation logic. Update JSX and StyleSheet only.
**AltMe conventions**: `export default` for Expo Router screen.

### T031: Refactor MyAgent (Twin) screen to V4 Dark Premium
- **agent**: rn-mobile-dev
- **story**: US3
- **parallel**: yes
- **blockedBy**: [T004, T005, T006]
- **files**: app/(tabs)/twin.tsx
- **acceptance**: デザインノード gJe42 と視覚的に一致

**Design Node: gJe42**

- `<CosmicBackground>` + SafeAreaView
- Header: "AltMe" (same as Community)
- Twin avatar: 80px circle, `borderColor: '#7DD3FC'` 3px, cyan glow shadow (`shadowColor: '#7DD3FC'`, `shadowRadius: 16`, `shadowOpacity: 0.4`)
- Below avatar: Twin name (Outfit Bold 24px) + MBTI badge (glass bg `#FFFFFF12`, `borderColor: '#FFFFFF25'`, text `#7DD3FC`) + green online dot
- "パーソナリティ特性" section title (Outfit SemiBold 18px)
- Big Five bars: 5 items, each with label + progress bar (`backgroundColor: '#FFFFFF15'` track, `backgroundColor: '#7DD3FC'` fill)
- "SOUL.md を閲覧" button: ghost style, `borderColor: '#FFFFFF25'`, `color: '#F8FAFC'`

**If GuestPromptOverlay is shown**: It will be updated separately in T080. For now, maintain existing guest check logic.

### T032: Refactor MyPage (Settings) screen to V4 Dark Premium
- **agent**: rn-mobile-dev
- **story**: US3
- **parallel**: yes
- **blockedBy**: [T004, T005, T006]
- **files**: app/(tabs)/settings.tsx
- **acceptance**: デザインノード SM8cv と視覚的に一致

**Design Node: SM8cv**

- `<CosmicBackground>` + SafeAreaView + ScrollView
- Header: "AltMe" (same pattern)
- Profile card: glass background (`#FFFFFF08`), avatar (56px circle), display name (Outfit Bold), email (textSecondary), Gold "Pro" badge (`backgroundColor: '#D4A853'`, text `#0F172A'`)
- Settings list: Each row = Feather icon + label + optional subtitle + chevron-right
  - 通知設定 (bell): no subtitle
  - プライバシー (shield): no subtitle
  - AIツインの設定 (settings): subtitle "MBTI: INFP / OpenClaw: 接続中" (`color: '#94A3B8'`)
  - 言語 (globe): subtitle showing current language
  - ヘルプ (info): no subtitle
  - Row style: `paddingVertical: 16`, `borderBottomColor: '#FFFFFF0A'`, `borderBottomWidth: 1`
- Logout button: `borderColor: '#EF4444'`, `borderWidth: 1`, `borderRadius: 12`, text `color: '#EF4444'`
- "アカウントを削除" link: `color: '#EF4444'`, `fontSize: 14`, bottom of list

**Preserve**: All existing handlers (logout, navigation to sub-screens, guest mode check).

---

## Phase 6: US4 — オンボーディング6画面のプレミアムフロー (P2)

**Goal**: 6画面のオンボーディングフローを V4 Dark Premium に更新
**Independent Test**: Welcome → Quiz → Result → Avatar → Tone → Meet Twin を順に遷移し各画面がデザイン通り

### T040: Refactor Welcome screen (O-1) to V4 Dark Premium
- **agent**: rn-mobile-dev
- **story**: US4
- **parallel**: yes
- **blockedBy**: [T004, T005, T006]
- **files**: app/(onboarding)/welcome.tsx
- **acceptance**: デザインノード dd8YN と視覚的に一致

**Design Node: dd8YN**
- `<CosmicBackground>`
- Robot icon: large centered, cyan outline/tint (`color: '#7DD3FC'`)
- Headline: "もう一人の自分を作ろう" — Outfit Bold 32px, `#F8FAFC`, centered
- Description: Outfit Regular 16px, `#94A3B8`, centered
- CTA: `<GoldButton title="始める" />` — full width with horizontal padding
- Time note: "約3分で完了します" — Outfit Regular 14px, `#64748B`

### T041: Refactor Personality Quiz screen (O-2) to V4 Dark Premium
- **agent**: rn-mobile-dev
- **story**: US4
- **parallel**: yes
- **blockedBy**: [T004, T005, T006]
- **files**: app/(onboarding)/personality-quiz.tsx
- **acceptance**: デザインノード QOkUh と視覚的に一致

**Design Node: QOkUh**
- `<CosmicBackground>`
- Header: back arrow (← Feather `arrow-left`, `#F8FAFC`) + "性格診断 2/6" (Outfit SemiBold) + close button
- Question number: "Q2" — Outfit Bold, `color: '#7DD3FC'`, large (32px)
- Question text: Outfit Regular 18px, `#F8FAFC`
- 4 option cards:
  - **Selected**: `backgroundColor: '#FFFFFF'`, `color: '#0F172A'` (dark text on white), `borderRadius: 12`
  - **Unselected**: `backgroundColor: '#FFFFFF12'`, `borderColor: '#FFFFFF25'`, `color: '#F8FAFC'`, `borderRadius: 12`
  - Each card: "A." prefix + option text, padding [16, 20]
- Progress bar: `backgroundColor: '#FFFFFF15'` track, `backgroundColor: '#7DD3FC'` fill, `borderRadius: full`

**Preserve**: All existing animation (Animated.View fade), question logic, answer handling.

### T042: Refactor Result screen (O-3) to V4 Dark Premium
- **agent**: rn-mobile-dev
- **story**: US4
- **parallel**: yes
- **blockedBy**: [T004, T005, T006]
- **files**: app/(onboarding)/result.tsx
- **acceptance**: デザインノード pM32A と視覚的に一致

**Design Node: pM32A**
- `<CosmicBackground>`
- Big Five bar graph or radar chart (cyan `#7DD3FC` bars)
- MBTI result display
- Personality description text
- Next CTA: GoldButton

### T043: Refactor Choose Avatar screen (O-4) to V4 Dark Premium
- **agent**: rn-mobile-dev
- **story**: US4
- **parallel**: yes
- **blockedBy**: [T004, T005, T006]
- **files**: app/(onboarding)/choose-avatar.tsx
- **acceptance**: デザインノード 5hGKw と視覚的に一致

**Design Node: 5hGKw**
- `<CosmicBackground>`
- 6 avatar options in 2x3 grid
- Selected avatar: cyan glow border (`borderColor: '#7DD3FC'`, `shadowColor: '#7DD3FC'`)
- Unselected: `borderColor: '#FFFFFF25'`
- Progress "4/6"

### T044: Refactor Choose Tone screen (O-5) to V4 Dark Premium
- **agent**: rn-mobile-dev
- **story**: US4
- **parallel**: yes
- **blockedBy**: [T004, T005, T006]
- **files**: app/(onboarding)/choose-tone.tsx
- **acceptance**: デザインノード mBkcg と視覚的に一致

**Design Node: mBkcg**
- `<CosmicBackground>`
- 5 tone option cards (glass bg)
- Selected: white bg + dark text
- Progress "5/6"

### T045: Refactor Meet Twin screen (O-6) to V4 Dark Premium
- **agent**: rn-mobile-dev
- **story**: US4
- **parallel**: yes
- **blockedBy**: [T004, T005, T006]
- **files**: app/(onboarding)/meet-twin.tsx
- **acceptance**: デザインノード lRd5O と視覚的に一致

**Design Node: lRd5O**
- `<CosmicBackground>`
- Twin name input field (glass bg)
- Chat preview bubbles
- Completion CTA: GoldButton

**Phase 6 Checkpoint**: `tsc --noEmit && npx jest --passWithNoTests`

---

## Phase 7: US5 — Paywall のプレミアム課金体験 (P2)

**Goal**: ペイウォール画面を V4 Dark Premium に更新
**Independent Test**: ペイウォール画面で3プラン・カウントダウン・CTA・復元リンクが正しく表示

### T050: Refactor Paywall screen to V4 Dark Premium
- **agent**: rn-mobile-dev
- **story**: US5
- **parallel**: yes
- **blockedBy**: [T004, T005, T006]
- **files**: app/(paywall)/index.tsx
- **acceptance**: デザインノード BWcG9 と視覚的に一致

**Design Node: BWcG9**

- `<CosmicBackground>` + SafeAreaView + ScrollView
- Close button: top-left, "×" `color: '#94A3B8'`
- Crown icon: gold (`#D4A853`), centered, large
- Title: "Proにアップグレード" — Outfit Bold 28px, `#F8FAFC`
- Countdown (when intro offer active): "初回限定 残り HH:MM:SS" — `color: '#EF4444'`, tabular-nums
- Checklist (6 items): cyan check icon (`#7DD3FC`) + feature text (`#F8FAFC`)
- 3 Plan cards (glass bg):
  - Intro annual (when available): glass bg + "初回限定" badge (`backgroundColor: '#7DD3FC'`, `color: '#0F172A'`) + price + discount
  - Annual: glass bg + radio button + "年額 ¥39,800" + per-month breakdown
  - Monthly: glass bg + radio button + "月額 ¥4,980"
  - Selected card: `borderColor: '#7DD3FC'`, `backgroundColor: '#7DD3FC0A'`
  - Unselected: `borderColor: '#334155'`
- CTA: `<GoldButton title="3日間無料で始める" />`
- Restore link: `color: '#94A3B8'`, underline
- Legal row: 利用規約 | プライバシーポリシー

**Preserve**: ALL existing purchase logic (`handlePurchase`, `handleRestore`, `getSelectedPackage`, countdown timer, intro offer check). Only update JSX and StyleSheet.

**Reference**: Read current `app/(paywall)/index.tsx` (528 lines). The existing file has comprehensive plan selection, countdown, and purchase flows.

---

## Phase 8: US6 + US7 — モーダル + サブ画面 (P3)

**Goal**: 3モーダル + 1サブ画面を V4 Dark Premium に更新
**Independent Test**: 各モーダルを開きレイアウトがデザインと一致

### T060: Refactor Subscription Manage modal to V4 Dark Premium
- **agent**: rn-mobile-dev
- **story**: US6
- **parallel**: yes
- **blockedBy**: [T004, T005, T006]
- **files**: app/subscription-manage.tsx
- **acceptance**: デザインノード 5T9Fp と視覚的に一致

**Design Node: 5T9Fp**
- `<CosmicBackground>` or dark solid background (`#0F172A`)
- Current plan info card (glass bg)
- Billing history section
- Plan change / payment method links
- Red cancel subscription link (`color: '#EF4444'`)

### T061: Refactor Twin Conversation Detail modal to V4 Dark Premium
- **agent**: rn-mobile-dev
- **story**: US6
- **parallel**: yes
- **blockedBy**: [T004, T005, T006]
- **files**: app/twin-conversation-detail.tsx
- **acceptance**: デザインノード XUmoI と視覚的に一致

**Design Node: XUmoI**
- Dark background
- Chat bubble format: two AI twins conversing
- Use same bubble styles as Chat screen (glass bg)

### T062: Refactor Account Delete Confirm modal to V4 Dark Premium
- **agent**: rn-mobile-dev
- **story**: US6
- **parallel**: yes
- **blockedBy**: [T004, T005, T006]
- **files**: app/account-delete-confirm.tsx
- **acceptance**: デザインノード MksMO と視覚的に一致

**Design Node: MksMO**
- Dark background
- Red warning icon/text (`#EF4444`)
- Data deletion list
- Confirmation text input (glass bg input field)
- Red delete button: `backgroundColor: '#EF4444'`, `color: '#FFFFFF'`

### T070: Refactor Community Create sub-screen to V4 Dark Premium
- **agent**: rn-mobile-dev
- **story**: US7
- **parallel**: yes
- **blockedBy**: [T004, T005, T006]
- **files**: app/community-create.tsx
- **acceptance**: デザインノード Nuczj と視覚的に一致

**Design Node: Nuczj**
- `<CosmicBackground>` or dark solid
- Form fields: name input, description input (glass bg)
- Language chip selector: active=`#7DD3FC`, inactive=glass
- Category chip selector
- CTA: `<GoldButton title="作成" />`

**Phase 8 Checkpoint**: `tsc --noEmit && npx jest --passWithNoTests`

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Quality assurance and finalization across all stories

### T080: Update GuestPromptOverlay to V4 Dark Premium
- **agent**: rn-mobile-dev
- **story**: polish
- **parallel**: yes
- **blockedBy**: [T010, T020, T030, T031, T032]
- **files**: src/shared/components/guest-prompt-overlay.tsx
- **acceptance**: Overlay matches dark premium aesthetic, Apple/Google buttons brand-compliant

Update `src/shared/components/guest-prompt-overlay.tsx`:
- Background: `backgroundColor: colors.background` (already correct) or use CosmicBackground
- Feature list: Update icon colors to `#64748B` → `#7DD3FC`
- Feature labels: Use `color: '#94A3B8'`
- Apple button: Keep `#000000` bg (Apple HIG)
- Google button: Update to `backgroundColor: '#FFFFFF'`, `borderColor: '#7DD3FC80'`
- Title/subtitle: Use Outfit font family

### T081: Code quality check (tsc + jest)
- **agent**: Bash
- **story**: polish
- **parallel**: yes
- **blockedBy**: [T010, T020, T030, T031, T032, T040, T041, T042, T043, T044, T045, T050, T060, T061, T062, T070, T080]
- **files**: -
- **acceptance**: `tsc --noEmit` passes, `npx jest --passWithNoTests` passes

```bash
tsc --noEmit && npx jest --passWithNoTests
```

### T082: Code review across all changed files
- **agent**: code-reviewer
- **story**: polish
- **parallel**: yes
- **blockedBy**: [T081]
- **files**: all changed files
- **acceptance**: No Critical/High issues, code follows AltMe conventions

Review all changed files for:
- Consistent use of theme tokens (no hardcoded colors that should be tokens)
- Proper use of shared components (CosmicBackground, GlassCard, GoldButton)
- AltMe conventions: named exports, kebab-case, 1 file = 1 component
- No unused imports or styles
- Accessibility: 44pt touch targets, WCAG 2.1 AA contrast

### T083: Spec reconciliation
- **agent**: doc-updater
- **story**: polish
- **parallel**: yes
- **blockedBy**: [T081]
- **files**: specs/
- **acceptance**: Existing specs reflect V4 Dark Premium implementation

Check if any existing specs need updates:
- `specs/shared/navigation.md`: Tab bar style change
- `specs/features/auth.md`: Landing screen layout change
- Add any design token references if missing

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup: T001-T003)
    ↓
Phase 2 (Foundational: T004-T006) ← BLOCKING
    ↓
Phase 3 (US1: Auth T010)        ← parallel across phases
Phase 4 (US2: Chat T020)        ← parallel across phases
Phase 5 (US3: Tabs T030-T032)   ← parallel across phases
Phase 6 (US4: OB T040-T045)     ← parallel across phases
    ↓ (after Phase 3-6 complete)
Phase 7 (US5: Paywall T050)     ← parallel across phases
Phase 8 (US6+7: Modals T060-T062, Sub T070) ← parallel
    ↓
Phase N (Polish: T080-T083)
```

### Agent Team Execution Strategy

**Default (--team):**
1. Leader executes Phase 1-2 directly (T001 → T002 → T003 → T004 + T005 + T006 parallel)
2. Phase 3-6: Spawn 4 teammates simultaneously:
   - `us1-impl` (rn-mobile-dev): T010
   - `us2-impl` (rn-mobile-dev): T020
   - `us3-impl` (rn-mobile-dev): T030, T031, T032
   - `us4-impl` (rn-mobile-dev): T040, T041, T042, T043, T044, T045
3. Phase 7-8: Spawn 4 teammates:
   - `us5-impl` (rn-mobile-dev): T050
   - `us6-impl` (rn-mobile-dev): T060, T061, T062
   - `us7-impl` (rn-mobile-dev): T070
   - Leader: T080
4. Phase N: Leader runs T081, spawns T082 + T083 in parallel
5. Quality gate at each Phase Checkpoint

### File Conflict Prevention

| File | Tasks | Strategy |
|------|-------|----------|
| `app/(auth)/login.tsx` | T010 only | No conflict (single task) |
| `app/(tabs)/index.tsx` | T020 only | No conflict (single task) |
| `app/(tabs)/community.tsx` | T030 only | No conflict |
| `app/(tabs)/twin.tsx` | T031 only | No conflict |
| `app/(tabs)/settings.tsx` | T032 only | No conflict |
| `app/(onboarding)/*.tsx` | T040-T045 (separate files) | No conflict |
| `src/config/theme.ts` | T003 only (Phase 1) | Completed before US work |
| `src/shared/components/` | T004, T005 (Phase 2) + T080 (Phase N) | Phase separation prevents conflict |
| `app/(tabs)/_layout.tsx` | T006 only (Phase 2) | Completed before US work |

---

## Summary

| Metric | Value |
|--------|-------|
| Total tasks | 24 |
| Phase 1 (Setup) | 3 tasks |
| Phase 2 (Foundational) | 3 tasks |
| Phase 3-6 (P1 US1-US4) | 10 tasks |
| Phase 7-8 (P2-P3 US5-US7) | 5 tasks |
| Phase N (Polish) | 4 tasks |
| Parallelizable | 19 tasks (79%) |
| Max concurrent teammates | 4 (Phase 3-6) |
| File conflicts | 0 (by design) |

---

## Notes

- `parallel: yes` = different files, no inter-task dependencies
- `story` label ensures traceability to user stories
- Quality gate (`tsc --noEmit && npx jest`) at each Checkpoint
- All screen tasks are **style/layout only** — preserve existing business logic
- Run `/compact` after Agent Team completion

---

## Execution Results (2026-02-16)

### Phase Completion Status

| Phase | Tasks | Status | Agent | Notes |
|-------|-------|--------|-------|-------|
| Phase 1 | T001, T002, T003 | completed | leader | tsc PASS |
| Phase 2 | T004, T005, T006 | completed | leader | tsc PASS, jest PASS |
| Phase 3 (US1) | T010 | completed | us1-auth-impl | tsc PASS |
| Phase 4 (US2) | T020 | completed | us2-chat-impl | tsc PASS |
| Phase 5 (US3) | T030, T031, T032 | completed | us3-tabs-impl | tsc PASS |
| Phase 6 (US4) | T040-T045 | completed | us4-onboarding-impl | tsc PASS |
| Phase 7 (US5) | T050 | completed | us5-paywall-impl | tsc PASS |
| Phase 8 (US6+7) | T060-T062, T070 | completed | us6-modals-impl, us7-community-create | tsc PASS |
| Phase N | T080 | completed | leader | tsc PASS |
| Phase N | T081 | completed | leader | tsc PASS, jest PASS (5 suites, 48 tests) |
| Phase N | T082 | completed | code-reviewer | Background agent |
| Phase N | T083 | completed | doc-updater | Background agent |

### Quality Gates

| Checkpoint | tsc --noEmit | jest | Notes |
|------------|:---:|:---:|-------|
| Phase 1 | PASS | - | |
| Phase 2 | PASS | PASS | |
| Phase 3-6 | PASS | - | |
| Phase 7-8 | PASS | - | |
| Phase N (T081) | PASS | PASS | 5 suites, 48 tests, 0 failures |

### Additional Fixes During Implementation

- `app/subscription-manage.tsx`: Fixed `nextRenewalDate` → `expiresAt` (pre-existing TS error, fixed by us6-modals-impl)
- `app/(tabs)/twin.tsx`: Fixed `user?.personalityTraits?.mbti` → `user?.mbtiType` (fixed by us3-tabs-impl)
- `src/shared/i18n/locales/ja.json`: Added `unlimitedChat` translation key (by us5-paywall-impl)

### Agent Team Summary

- **Total agents spawned**: 7 teammates + leader
- **Max concurrent**: 4 (Phase 3-6)
- **File conflicts**: 0
- **All 24 tasks completed successfully**
