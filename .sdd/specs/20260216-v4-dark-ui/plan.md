# Implementation Plan: V4 Dark Premium UI

**Feature Branch**: `20260216-v4-dark-ui`
**Spec**: `.sdd/specs/20260216-v4-dark-ui/spec.md`
**Research**: `.sdd/specs/20260216-v4-dark-ui/research.md`

---

## Technical Context

| 項目 | 値 |
|------|-----|
| Language | TypeScript 5.x (strict mode) |
| Framework | React Native (Expo SDK 54) + Expo Router v3 |
| State Management | Zustand 5.x |
| Design Tool | Pencil MCP (.pen files) |
| Target | iOS 16+ / Android 13+ |

### 新規依存パッケージ
- `expo-blur` — glassmorphism の blur 効果
- `expo-linear-gradient` — ゴールド CTA グラデーション
- `@expo-google-fonts/outfit` — Outfit フォント (Regular/Medium/SemiBold/Bold)

---

## Constitution Check

| 原則 | 判定 | 備考 |
|------|------|------|
| Spec-First | PASS | spec.md に 19画面の FR/AC を定義済み |
| Mobile-First UX | PASS | 44pt タップターゲット、WCAG AA 定義済み |
| Type-Safe Contracts | PASS | UI変更のみ、型変更なし |
| Security by Default | PASS | セキュリティ影響なし |
| Simplicity / YAGNI | PASS | 共有コンポーネント3つのみ追加 |

**Gate Result**: PASS — 実装に進行可能

---

## Phase 0: 基盤セットアップ

### T001: 新規パッケージインストール
- **Agent**: Leader
- **Files**: `package.json`
- **Action**: `npx expo install expo-blur expo-linear-gradient @expo-google-fonts/outfit`
- **Acceptance**: `tsc --noEmit` パス

### T002: Outfit フォントロード設定
- **Agent**: Leader
- **Files**: `app/_layout.tsx`
- **Action**:
  - `@expo-google-fonts/outfit` から `Outfit_400Regular`, `Outfit_500Medium`, `Outfit_600SemiBold`, `Outfit_700Bold` をインポート
  - `useFonts` に追加
  - SplashScreen.preventAutoHideAsync でフォントロード待機
- **Acceptance**: フォントロード完了後にアプリが正常起動

### T003: テーマトークン拡張
- **Agent**: Leader
- **Files**: `src/config/theme.ts`
- **Action**:
  - glassmorphism 共通値を追加:
    ```typescript
    export const glassmorphism = {
      card: { bg: '#FFFFFF12', border: '#FFFFFF25', blur: 16 },
      bubble: { ai: { bg: '#FFFFFF4D', border: '#FFFFFF15' }, user: { bg: '#7DD3FC4D', border: '#7DD3FC30' } },
      input: { bg: '#FFFFFF0D', border: '#FFFFFF15' },
    } as const;

    export const goldGradient = {
      colors: ['#E8C567', '#C9A033', '#A07B1A'] as const,
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    } as const;

    export const tabBarColors = {
      background: '#0F172AEE',
      active: '#00D4FF',
      inactive: '#64748B',
    } as const;
    ```
- **Acceptance**: 型チェックパス、既存のインポートに影響なし

### T004: Cosmic 背景画像アセット追加
- **Agent**: Leader
- **Files**: `assets/images/cosmic-bg.png`
- **Action**: AI生成 or ストック画像で宇宙的背景を追加（1170x2532px @3x推奨）
- **Note**: .pen ファイルの画面背景を参考にトーンを合わせる

### T005: 共有 UI コンポーネント作成（3つ）
- **Agent**: Leader
- **Files**:
  - `src/shared/components/cosmic-background.tsx`
  - `src/shared/components/glass-card.tsx`
  - `src/shared/components/gold-button.tsx`
- **Action**:
  - **CosmicBackground**: `ImageBackground`（cosmic-bg.png）+ overlay `View`（`#0F172ACC`）。フォールバック背景色 `#0F172A`。children をラップ
  - **GlassCard**: `BlurView`（intensity=16）+ 半透明背景 + 1px ボーダー。`variant` prop で card/bubble/input のスタイルを切替
  - **GoldButton**: `LinearGradient` でゴールドグラデーション + 高さ 52px + borderRadius 12。`title`, `onPress`, `disabled`, `loading` props
- **Acceptance**: 各コンポーネントが単体で描画確認可能

### T006: カスタムタブバースタイル更新
- **Agent**: Leader
- **Files**: `app/(tabs)/_layout.tsx`
- **Action**:
  - `tabBarStyle`: `backgroundColor: '#0F172AEE'`, `borderTopColor: '#FFFFFF15'`, `borderTopWidth: 1`
  - `tabBarActiveTintColor`: `'#00D4FF'`
  - `tabBarInactiveTintColor`: `'#64748B'`
  - タブアイコン: Feather の `message-circle`, `users`, `cpu` → `bot` (または維持), `user` を使用
- **Acceptance**: タブバーがダークデザインに一致

**Phase 0 Checkpoint**: `tsc --noEmit && npx jest --passWithNoTests`

---

## Phase 1: Auth + Chat 画面（US1 + US2, P1）

### T010: Landing 画面 (A-0) リファクタ
- **Agent**: rn-mobile-dev (us1-impl)
- **Story**: US1
- **Files**: `app/(auth)/login.tsx`
- **Design Node**: YKJ8P
- **Action**:
  - Landing 状態のUI を V4 Dark Premium に更新:
    - CosmicBackground ラップ
    - 「AltMe」ロゴ: Outfit 52px weight 200, `#F8FAFC`
    - 「もう一人の自分、AIツイン」タグライン
    - 3つの GlassCard フィーチャーカード（lucide アイコン + テキスト）
    - GoldButton CTA「ログインして始める」
    - ゲストリンク「まずは見てみる →」
    - 法的リンク行（利用規約 | プライバシーポリシー）
  - **Design Details**:
    - Feature cards: `fill:#FFFFFF12`, `stroke:#FFFFFF25 1px`, cornerRadius 16, padding [16,20]
    - Gold CTA: gradient `#E8C567→#C9A033→#A07B1A`, height 54, cornerRadius 22
    - Guest link: `#94A3B8`, fontSize 14
- **Acceptance**: スクリーンショットがデザインノード YKJ8P と一致

### T011: Login 画面 (A-1) リファクタ
- **Agent**: rn-mobile-dev (us1-impl)
- **Story**: US1
- **Files**: `app/(auth)/login.tsx`
- **Design Node**: ISa7t
- **Action**:
  - Login 状態のUI を V4 Dark Premium に更新:
    - CosmicBackground ラップ（Landing と共有）
    - 「AltMe」ロゴ（Landing と同じ）
    - Apple Sign-In: `#000000` bg, 白テキスト, lucide apple アイコン, height 54, cornerRadius 14
    - Google Sign-In: `#FFFFFF` bg, `#7DD3FC80` ストローク, 黒テキスト, google-g-icon.png, height 54, cornerRadius 14
    - 法的リンク行
  - **Apple HIG**: Apple ボタンは `#000000` ハードコード（テーマ依存不可）
- **Acceptance**: Apple/Google ボタンがブランドガイドライン準拠

### T020: Chat Free 画面 (T-1) リファクタ
- **Agent**: rn-mobile-dev (us2-impl)
- **Story**: US2
- **Files**: `app/(tabs)/index.tsx`
- **Design Node**: vVQxs
- **Action**:
  - 全体: CosmicBackground + overlay `#0F172ACC`
  - ヘッダー: 左=ボットアバター(36px円形, primary border) + "AltMe" + 緑ドット "Online", 右=残回数バッジ "3/3" (primary bg)
  - カテゴリタグ行: アクティブ=`#7DD3FC` text + `#7DD3FC20` bg, 非アクティブ=`#FFFFFF80` text + `#FFFFFF10` bg, cornerRadius full
  - 日付セパレータ: `#FFFFFF40` テキスト中央寄せ
  - AI バブル: 左寄せ, `#FFFFFF4D` bg, `#FFFFFF15` stroke 1px, cornerRadius [4,16,16,16], アバター付き
  - ユーザーバブル: 右寄せ, `#7DD3FC4D` bg, `#7DD3FC30` stroke 1px, cornerRadius [16,4,16,16]
  - 入力バー: `#FFFFFF0D` bg, `#FFFFFF15` stroke 1px, cornerRadius full, 送信ボタン=gradient `#7DD3FC→#38BDF8`
- **Acceptance**: バブルスタイル・タグ・入力バーがデザインノード vVQxs と一致

### T021: Chat Pro / Attach 画面差分
- **Agent**: rn-mobile-dev (us2-impl)
- **Story**: US2
- **Files**: `app/(tabs)/index.tsx`
- **Design Nodes**: WGNcl, lmaHb
- **Action**:
  - Pro: 残回数バッジ非表示、WebSocket 接続インジケータ表示
  - Attach: 添付UI（画像プレビュー + 送信）— デザインノード lmaHb を参照
- **Acceptance**: Free/Pro/Attach 各モードの表示切替が正常

---

## Phase 2: Tabs 画面 + Onboarding（US3 + US4, P1-P2）

### T030: Community 画面 (S-1) リファクタ
- **Agent**: rn-mobile-dev (us3-impl)
- **Story**: US3
- **Files**: `app/(tabs)/community.tsx`
- **Design Node**: sjBQF
- **Action**:
  - CosmicBackground + overlay
  - ヘッダー: "AltMe" テキスト
  - 言語スイッチャー: JP/EN ピルトグル (active=`#7DD3FC` bg, inactive=transparent)
  - 「人気のコミュニティ +」セクションヘッダー
  - コミュニティカード: `#FFFFFF08` bg, `#7DD3FC40` stroke 1px, cornerRadius 16, サムネイル + 名前 + 参加人数 + 会話数
  - Pro バナー: glassmorphism bg, GoldButton「Proにアップグレード」
  - タブバー
- **Acceptance**: デザインノード sjBQF と一致

### T031: MyAgent 画面 (S-2) リファクタ
- **Agent**: rn-mobile-dev (us3-impl)
- **Story**: US3
- **Files**: `app/(tabs)/twin.tsx`
- **Design Node**: gJe42
- **Action**:
  - CosmicBackground + overlay
  - ツインアバター: 80px円形 + シアングロー (shadow)
  - ツイン名 + MBTI バッジ（glass bg）+ オンラインインジケータ
  - 「パーソナリティ特性」セクション: Big Five 5項目、シアンプログレスバー（`#7DD3FC`）
  - 「SOUL.md を閲覧」ボタン
- **Acceptance**: デザインノード gJe42 と一致

### T032: MyPage 画面 (S-3) リファクタ
- **Agent**: rn-mobile-dev (us3-impl)
- **Story**: US3
- **Files**: `app/(tabs)/settings.tsx`
- **Design Node**: SM8cv
- **Action**:
  - CosmicBackground + overlay
  - ユーザー情報カード: アバター + 表示名 + メール + ゴールド Proバッジ
  - 設定リスト: アイコン (lucide/Feather) + ラベル + サブテキスト + シェブロン
    - 通知設定 (bell)
    - プライバシー (shield)
    - AIツインの設定 (settings, "MBTI: INFP", "OpenClaw: 接続中")
    - 言語 (globe)
    - ヘルプ (info)
  - ログアウトボタン: `#EF4444` ボーダー
  - 「アカウントを削除」リンク: `#EF4444` テキスト
- **Acceptance**: デザインノード SM8cv と一致

### T040: Welcome 画面 (O-1) リファクタ
- **Agent**: rn-mobile-dev (us4-impl)
- **Story**: US4
- **Files**: `app/(onboarding)/welcome.tsx`
- **Design Node**: dd8YN
- **Action**:
  - CosmicBackground
  - ロボットアイコン（シアン輪郭）
  - 「もう一人の自分を作ろう」見出し (Outfit 32px Bold)
  - 説明文
  - GoldButton「始める」
  - 「約3分で完了します」注記 (textSecondary)

### T041: Personality Quiz 画面 (O-2) リファクタ
- **Agent**: rn-mobile-dev (us4-impl)
- **Story**: US4
- **Files**: `app/(onboarding)/personality-quiz.tsx`
- **Design Node**: QOkUh
- **Action**:
  - CosmicBackground
  - 「← 性格診断 N/6」ヘッダー
  - シアン質問番号「Q2」
  - 質問テキスト
  - 4択カード: 選択済み=白bg黒テキスト, 未選択=glass bg白テキスト
  - 進捗バー: シアン

### T042: Result 画面 (O-3) リファクタ
- **Agent**: rn-mobile-dev (us4-impl)
- **Story**: US4
- **Files**: `app/(onboarding)/result.tsx`
- **Design Node**: pM32A

### T043: Choose Avatar 画面 (O-4) リファクタ
- **Agent**: rn-mobile-dev (us4-impl)
- **Story**: US4
- **Files**: `app/(onboarding)/choose-avatar.tsx`
- **Design Node**: 5hGKw

### T044: Choose Tone 画面 (O-5) リファクタ
- **Agent**: rn-mobile-dev (us4-impl)
- **Story**: US4
- **Files**: `app/(onboarding)/choose-tone.tsx`
- **Design Node**: mBkcg

### T045: Meet Twin 画面 (O-6) リファクタ
- **Agent**: rn-mobile-dev (us4-impl)
- **Story**: US4
- **Files**: `app/(onboarding)/meet-twin.tsx`
- **Design Node**: lRd5O

---

## Phase 3: Paywall + Modals + Sub（US5 + US6 + US7, P2-P3）

### T050: Paywall 画面 (P-1) リファクタ
- **Agent**: rn-mobile-dev (us5-impl)
- **Story**: US5
- **Files**: `app/(paywall)/index.tsx`
- **Design Node**: BWcG9
- **Action**:
  - CosmicBackground
  - 王冠アイコン（ゴールド）
  - 「Pro にアップグレード」タイトル
  - カウントダウンタイマー（既存ロジック維持、スタイルのみ更新）
  - 6項目チェックリスト（シアンチェック + 白テキスト）
  - 3プランカード: glassmorphism + ラジオボタン + 価格
  - GoldButton CTA「3日間無料で始める」
  - 復元リンク + 法的リンク

### T060: Subscription Manage モーダル (M-1) リファクタ
- **Agent**: rn-mobile-dev (us6-impl)
- **Story**: US6
- **Files**: `app/subscription-manage.tsx`
- **Design Node**: 5T9Fp

### T061: Twin Conversation モーダル (M-2) リファクタ
- **Agent**: rn-mobile-dev (us6-impl)
- **Story**: US6
- **Files**: `app/twin-conversation-detail.tsx`
- **Design Node**: XUmoI

### T062: Account Delete モーダル (M-3) リファクタ
- **Agent**: rn-mobile-dev (us6-impl)
- **Story**: US6
- **Files**: `app/account-delete-confirm.tsx`
- **Design Node**: MksMO

### T070: Community Create サブ画面 (Sub-1) リファクタ
- **Agent**: rn-mobile-dev (us7-impl)
- **Story**: US7
- **Files**: `app/community-create.tsx`
- **Design Node**: Nuczj

---

## Phase N: ポリッシュ + QA

### T080: GuestPromptOverlay ダークテーマ対応
- **Agent**: Leader
- **Files**: `src/shared/components/guest-prompt-overlay.tsx`
- **Action**: V4 Dark Premium カラートークンに更新

### T081: 全画面スクリーンショット検証
- **Agent**: design-reviewer
- **Action**: 19画面のスクリーンショットをデザインノードと比較

### T082: TypeScript 型チェック + テスト
- **Agent**: Leader
- **Action**: `tsc --noEmit && npx jest --passWithNoTests`

### T083: i18n レイアウト確認
- **Agent**: Leader
- **Action**: 日本語/英語/韓国語で各画面のレイアウト崩れがないことを確認

---

## 実行計画: Agent Team 構成

### Phase 0: Leader 直接実行
T001 → T002 → T003 → T004 → T005 → T006 を順次実行。
**Checkpoint**: `tsc --noEmit`

### Phase 1: 並列実行（2 チーム）
| Team | Agent Type | Tasks | Story |
|------|-----------|-------|-------|
| us1-impl | rn-mobile-dev | T010, T011 | US1 (Auth) |
| us2-impl | rn-mobile-dev | T020, T021 | US2 (Chat) |

**Checkpoint**: `tsc --noEmit && npx jest --passWithNoTests`

### Phase 2: 並列実行（2 チーム）
| Team | Agent Type | Tasks | Story |
|------|-----------|-------|-------|
| us3-impl | rn-mobile-dev | T030, T031, T032 | US3 (Tabs) |
| us4-impl | rn-mobile-dev | T040-T045 | US4 (OB) |

**Checkpoint**: `tsc --noEmit && npx jest --passWithNoTests`

### Phase 3: 並列実行（3 チーム）
| Team | Agent Type | Tasks | Story |
|------|-----------|-------|-------|
| us5-impl | rn-mobile-dev | T050 | US5 (Paywall) |
| us6-impl | rn-mobile-dev | T060-T062 | US6 (Modals) |
| us7-impl | rn-mobile-dev | T070 | US7 (Sub) |

**Checkpoint**: `tsc --noEmit && npx jest --passWithNoTests`

### Phase N: Leader + Specialists
T080 → T081 → T082 → T083

---

## Cross-references

| 既存仕様書 | 影響 |
|-----------|------|
| specs/features/auth.md | UI変更のみ、ロジック影響なし |
| specs/features/chat.md | UI変更のみ、ロジック影響なし |
| specs/features/onboarding.md | UI変更のみ、ロジック影響なし |
| specs/features/subscription.md | UI変更のみ、ロジック影響なし |
| specs/features/community.md | UI変更のみ、ロジック影響なし |
| specs/features/settings.md | UI変更のみ、ロジック影響なし |
| specs/shared/navigation.md | タブバースタイル更新のみ |
| specs/api/database.md | 変更なし |
| specs/api/external-services.md | 変更なし |

---

## Design Token Reference（.pen ファイルから抽出）

### Gold CTA Gradient
```
colors: [{color:"#E8C567",position:0}, {color:"#C9A033",position:0.5}, {color:"#A07B1A",position:1}]
rotation: 90 (horizontal)
height: 54, cornerRadius: 22
```

### Chat Bubble Styles
```
AI (left):   bg=#FFFFFF4D, stroke=#FFFFFF15 1px, radius=[4,16,16,16]
User (right): bg=#7DD3FC4D, stroke=#7DD3FC30 1px, radius=[16,4,16,16]
```

### Tab Bar
```
bg: #0F172AEE, active: #00D4FF, inactive: #64748B
icons: message-circle, users, bot, user (Feather/lucide compatible)
```

### Topic Tags
```
active:   text=#7DD3FC, bg=#7DD3FC20, cornerRadius=full
inactive: text=#FFFFFF80, bg=#FFFFFF10, cornerRadius=full
```

### Send Button Gradient
```
colors: [{color:"#7DD3FC",position:0}, {color:"#38BDF8",position:1}]
rotation: 135
```
