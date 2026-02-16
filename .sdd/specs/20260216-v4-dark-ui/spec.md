# Feature Specification: V4 Dark Premium UI 実装

**Feature Branch**: `20260216-v4-dark-ui`
**Created**: 2026-02-16
**Status**: Draft
**Input**: V4 Dark Premium デザイン実装: PencilDesign-AltMe.pen の V4 Dark Premium Redesign ボード（19画面）を React Native コードに忠実に実装。

## 概要

PencilDesign-AltMe.pen の「V4 Dark Premium Redesign」ボードに定義された19画面のデザインを、既存の React Native コードに忠実に実装する。ダークコスミックテーマ、glassmorphism エフェクト、ゴールドCTA、統一されたタイポグラフィ・カラーシステムを全画面に適用する。

---

## User Scenarios & Testing

### User Story 1 — Auth 画面のプレミアムランディング体験 (Priority: P1)

新規ユーザーがアプリを起動すると、宇宙的なビジュアルとグラスモーフィズムのカード UI でプレミアム感を感じ、すぐにログインまたはゲストブラウズを選択できる。

**Why this priority**: 第一印象がコンバージョンを決定する。ランディング→ログイン画面はすべてのユーザーが最初に見る画面であり、最も高い品質が求められる。

**Independent Test**: ランディング画面を開き、コスミック背景・glassmorphismカード・ゴールドCTA・ゲストリンク・法的リンクが正しく表示されることを確認する。

**Acceptance Scenarios**:

1. **Given** アプリ未認証状態, **When** ランディング画面を開く, **Then** コスミック背景画像の上に「AltMe」ロゴ、タグライン、3つのglassmorphismフィーチャーカード、ゴールドCTAボタン「ログインして始める」、ゲストリンク、法的リンクが表示される
2. **Given** ランディング画面, **When** CTAをタップ, **Then** ログイン画面に遷移し、同じコスミック背景の上にApple/Googleサインインボタンが表示される
3. **Given** ログイン画面, **When** Appleサインインボタンを確認, **Then** 白背景・黒テキスト（Apple HIG準拠）のボタンが表示される
4. **Given** ログイン画面, **When** Googleサインインボタンを確認, **Then** 白背景・灰ボーダー・黒テキスト（Google Brand準拠）のボタンが表示される

---

### User Story 2 — チャット画面のダークプレミアム体験 (Priority: P1)

ユーザーがAIツインとチャットする際、ダークコスミック背景の上にglassmorphismチャットバブルが表示され、カテゴリタグ・日付セパレータ・オンラインインジケータが見やすく配置される。

**Why this priority**: チャットはアプリの中核機能であり、毎日使う画面。ユーザー体験の根幹。

**Independent Test**: チャット画面でメッセージを送受信し、AI側バブル（左、ダークグラス）、ユーザー側バブル（右、プライマリカラー）、カテゴリタグ、入力バーが正しく表示されることを確認する。

**Acceptance Scenarios**:

1. **Given** チャット画面（Free）, **When** 画面を開く, **Then** コスミック背景・ヘッダー（AltMe + オンラインインジケータ + 残回数表示）・カテゴリタグ行・メッセージ一覧・入力バーが表示される
2. **Given** チャット画面, **When** AIメッセージを確認, **Then** 左寄せ・ダークglassmorphism背景・アイコン付き・タイムスタンプのバブルが表示される
3. **Given** チャット画面, **When** ユーザーメッセージを確認, **Then** 右寄せ・プライマリカラー背景のバブルが表示される
4. **Given** チャット画面（Pro）, **When** 画面を開く, **Then** 残回数表示が非表示になり、WebSocket接続インジケータが表示される

---

### User Story 3 — メインタブ画面（Community / MyAgent / MyPage） (Priority: P1)

認証済みユーザーがタブで Community、MyAgent（ツイン情報）、MyPage（設定）を切り替え、一貫したダークプレミアムデザインで各機能を利用できる。

**Why this priority**: タブ画面は日常的に使う主要画面3つ。デザインの一貫性がユーザー体験を左右する。

**Independent Test**: 4タブを順に遷移し、各画面のレイアウト・スタイルがデザインファイルと一致することを確認する。

**Acceptance Scenarios**:

1. **Given** Community タブ, **When** 画面を開く, **Then** 言語スイッチャー（JP/EN）、「人気のコミュニティ+」ヘッダー、glassmorphismコミュニティカード（サムネイル・名前・参加人数・会話数）、Pro解放バナー・ゴールドアップグレードボタンが表示される
2. **Given** MyAgent タブ, **When** 画面を開く, **Then** ツインアバター（グロー付き円形）、ツイン名・MBTI バッジ・オンラインインジケータ、「パーソナリティ特性」セクション（Big Five 5項目のシアンプログレスバー）が表示される
3. **Given** MyPage タブ, **When** 画面を開く, **Then** ユーザー情報カード（名前・メール・ゴールドProバッジ）、設定リスト（アイコン付きリストアイテム・シェブロン）、赤い「アカウントを削除」リンクが表示される
4. **Given** タブバー, **When** 各タブを確認, **Then** チャット・コミュニティ・マイエージェント・マイページの4タブが表示され、アクティブタブがシアンでハイライトされる

---

### User Story 4 — オンボーディング6画面のプレミアムフロー (Priority: P2)

新規登録ユーザーがオンボーディング6画面（Welcome → 性格診断 → 結果 → アバター選択 → 口調選択 → ツイン対面）をダークプレミアムデザインで体験し、スムーズにメイン画面に到達する。

**Why this priority**: 新規ユーザーの離脱を防ぐ重要なフロー。ただし認証画面の後に表示されるため P2。

**Independent Test**: オンボーディング6画面を順に遷移し、各画面のレイアウト・アニメーション・ボタンが正しく表示・動作することを確認する。

**Acceptance Scenarios**:

1. **Given** Welcome画面, **When** 画面を開く, **Then** コスミック背景、ロボットアイコン（シアン輪郭）、「もう一人の自分を作ろう」見出し、説明文、ゴールドCTA「始める」、「約3分で完了します」注記が表示される
2. **Given** 性格診断画面, **When** Q2を表示, **Then** 「← 性格診断 2/6」ヘッダー、シアン「Q2」ラベル、質問テキスト、4択（A-D、選択済み=白背景黒テキスト、未選択=glass透明白テキスト）が表示される
3. **Given** 結果画面, **When** 診断完了後, **Then** Big Five レーダーチャートまたはバーグラフ、MBTI結果、パーソナリティ説明が表示される
4. **Given** アバター選択画面, **When** 画面を開く, **Then** 6つのアバターオプションがグリッド表示され、選択中のアバターにグロー効果が適用される
5. **Given** 口調選択画面, **When** 画面を開く, **Then** 5つの口調オプション（フレンドリー等）がカード形式で表示され、進捗「6/6」が表示される
6. **Given** Meet Twin画面, **When** 画面を開く, **Then** ツイン名入力欄、チャットプレビュー、完了CTAが表示される

---

### User Story 5 — Paywall のプレミアム課金体験 (Priority: P2)

ユーザーが Pro アップグレードを検討する際、洗練されたペイウォール画面で3つのプラン（月額/年額/初回限定）を比較し、ワンタップで購入できる。

**Why this priority**: 直接的な収益に関わる画面。ただし既に機能は実装済みのため、UIリファクタのみ。

**Independent Test**: ペイウォール画面を開き、3プラン・カウントダウン・CTA・復元リンクが正しく表示されることを確認する。

**Acceptance Scenarios**:

1. **Given** ペイウォール画面, **When** 画面を開く, **Then** 王冠アイコン（ゴールド）、「Proにアップグレード」タイトル、カウントダウンタイマー（初回限定時）、チェックリスト（6項目）、3プランカード、ゴールドCTA「3日間無料で始める」、復元リンク、法的リンクが表示される
2. **Given** 3プランカード, **When** 各プランを確認, **Then** 月額¥4,980、年額¥39,800（33%OFF）、初回限定¥29,800（50%OFF）が明確に表示される
3. **Given** 初回限定プラン, **When** カウントダウンが動作中, **Then** 「初回限定 残り HH:MM:SS」がリアルタイムで更新される

---

### User Story 6 — モーダル画面のダークデザイン統一 (Priority: P3)

ユーザーがサブスクリプション管理、ツイン会話詳細、アカウント削除確認のモーダルを開いた際、メイン画面と一貫したダークデザインが適用されている。

**Why this priority**: 補助的な画面であり使用頻度は低いが、デザイン統一のために必要。

**Independent Test**: 各モーダルを開き、レイアウトとスタイルがデザインファイルと一致することを確認する。

**Acceptance Scenarios**:

1. **Given** サブスクリプション管理モーダル, **When** 画面を開く, **Then** 現在のプラン情報カード（glassmorphism）、請求履歴、プラン変更/支払い方法リンク、赤い解約リンクが表示される
2. **Given** ツイン会話詳細モーダル, **When** 画面を開く, **Then** 2体のAIツイン間の会話がチャットバブル形式で表示される
3. **Given** アカウント削除確認モーダル, **When** 画面を開く, **Then** 赤い警告、削除対象データリスト、確認入力フィールド、赤い削除ボタンが表示される

---

### User Story 7 — Community Create サブ画面 (Priority: P3)

Pro ユーザーが新規コミュニティを作成する際、ダークデザインのフォーム画面で言語・カテゴリを選択し作成できる。

**Why this priority**: 特定のProユーザーのみが使用する補助画面。

**Independent Test**: コミュニティ作成画面を開き、フォーム要素が正しく表示されることを確認する。

**Acceptance Scenarios**:

1. **Given** コミュニティ作成画面, **When** 画面を開く, **Then** フォーム（名前入力・説明入力・言語チップ選択・カテゴリチップ選択）、ゴールドCTA「作成」が表示される

---

### Edge Cases

- ゲストモードでタブ画面を表示した場合、GuestPromptOverlay がダークテーマに合わせた配色で表示されるか？
- 長いユーザー名・ツイン名がMyPage/MyAgentで正しく省略されるか？
- 多言語（日本語/英語/韓国語）切り替え時にレイアウトが崩れないか？
- コスミック背景画像の読み込み遅延時、背景色 `#0F172A` がフォールバック表示されるか？
- ダイナミックタイプ（iOS アクセシビリティ文字サイズ変更）でレイアウトが崩れないか？

---

## Requirements

### Functional Requirements

#### デザインシステム共通

- **FR-001**: 全画面で V4 Dark Premium カラートークン（background: `#0F172A`, surface: `#1E293B`, text: `#F8FAFC`, primary: `#7DD3FC`, accent: `#D4A853`）が使用されること
- **FR-002**: 全画面で cosmic 背景画像がフルブリードで表示され、その上に半透明オーバーレイ（`#0F172ACC`）が適用されること
- **FR-003**: カード・バブル等の glassmorphism エフェクトが、半透明背景 + ボーダー + ぼかしで実現されること
- **FR-004**: CTA ボタンはゴールドグラデーション（`#D4A853` 系）で統一されること
- **FR-005**: フォントファミリーは Outfit で統一されること（日本語フォールバックはシステムフォント）
- **FR-006**: タブバーはダーク背景（`#0F172AEE`）に、アクティブタブがシアン（`#00D4FF`）、非アクティブが `#64748B` でハイライトされること
- **FR-007**: 全画面でタップターゲットが最低 44pt を確保すること
- **FR-008**: テキストのコントラスト比が WCAG 2.1 AA（4.5:1以上）を満たすこと

#### Auth 画面（2画面）

- **FR-010**: Landing（A-0）は cosmic 背景フルブリードの上に、ロゴ・タグライン・3つの glassmorphism フィーチャーカード・ゴールドCTA・ゲストリンク・法的リンクを縦スクロール配置すること
- **FR-011**: Login（A-1）は Landing と同じ cosmic 背景の上に、Apple/Google サインインボタンを配置すること
- **FR-012**: Apple サインインボタンは白背景（`#000000` テキスト）、Google サインインボタンは白背景・灰ボーダー（`#747775`）・黒テキスト（`#1F1F1F`）でブランドガイドライン準拠とすること

#### Chat 画面（3画面）

- **FR-020**: Chat Free は cosmic 背景 + オーバーレイの上に、ヘッダー（ロゴ + オンライン状態 + 残回数）、カテゴリタグ行、日付セパレータ、チャットバブル、入力バーを配置すること
- **FR-021**: AI メッセージバブルは左寄せ・ダーク glassmorphism 背景（`#1E293B` 系半透明）、ユーザーメッセージバブルは右寄せ・プライマリカラー背景（`#7DD3FC` 系）とすること
- **FR-022**: Chat Pro は残回数を非表示にし、WebSocket接続インジケータを表示すること
- **FR-023**: Chat Attach は添付ファイル選択UIが表示されること

#### Community / MyAgent / MyPage（3画面）

- **FR-030**: Community は cosmic 背景の上に、言語スイッチャー、コミュニティカード（glassmorphism + サムネイル）、Pro 解放バナー、ゴールドアップグレードボタンを配置すること
- **FR-031**: MyAgent は cosmic 背景の上に、ツインアバター（グロー効果付き円形）、名前・MBTI バッジ・オンライン状態、Big Five パーソナリティバー（シアン `#7DD3FC`）を配置すること
- **FR-032**: MyPage は cosmic 背景の上に、ユーザー情報カード（ゴールド Pro バッジ）、設定リスト（アイコン + シェブロン）、赤いアカウント削除リンクを配置すること

#### Onboarding（6画面）

- **FR-040**: Welcome は cosmic 背景 + ロボットアイコン（シアン輪郭）+ 「もう一人の自分を作ろう」見出し + ゴールドCTA「始める」+ 時間目安を配置すること
- **FR-041**: Personality Quiz は「← 性格診断 N/6」ヘッダー + シアン質問番号 + 4択カード（選択=白背景黒テキスト、未選択=glass 透明白テキスト）を配置すること
- **FR-042**: Result は Big Five バーグラフ + MBTI結果 + パーソナリティ説明を配置すること
- **FR-043**: Choose Avatar は 6つのアバターオプション（グリッド表示、選択中=グロー効果）を配置すること
- **FR-044**: Choose Tone は 5つの口調オプション（カード形式）+ 進捗表示を配置すること
- **FR-045**: Meet Twin はツイン名入力 + チャットプレビュー + 完了CTAを配置すること

#### Paywall（1画面）

- **FR-050**: 王冠アイコン（ゴールド）+ タイトル + カウントダウンタイマー + 6項目チェックリスト + 3プランカード + ゴールドCTA + 復元リンク + 法的リンクを配置すること
- **FR-051**: 3プランカードは月額・年額・初回限定を明確に区分し、割引率を表示すること

#### Modals（3画面）

- **FR-060**: Subscription Manage は glassmorphism プランカード + 請求履歴 + アクションリンク + 赤い解約リンクを配置すること
- **FR-061**: Twin Conversation はダーク背景のチャットバブル形式で AI ツイン間の会話を表示すること
- **FR-062**: Account Delete は赤い警告 + 削除対象データリスト + 確認入力 + 赤い削除ボタンを配置すること

#### Sub-screens（1画面）

- **FR-070**: Community Create はフォーム（名前・説明・言語チップ・カテゴリチップ）+ ゴールドCTAを配置すること

---

## デザインシステム定義

### カラートークン

| Token | Value | 用途 |
|-------|-------|------|
| background | `#0F172A` | 全画面ベース背景 |
| backgroundSecondary | `#131C2E` | セカンダリ背景 |
| surface | `#1E293B` | カード・入力欄背景 |
| primary | `#7DD3FC` | アクティブ要素・リンク・インジケータ |
| primaryLight | `#BAE6FD` | ホバー・ライト |
| accent / gold | `#D4A853` | CTA ボタン・バッジ |
| tabActive | `#00D4FF` | タブバーアクティブ（.pen準拠） |
| tabInactive | `#64748B` | タブバー非アクティブ |
| text | `#F8FAFC` | プライマリテキスト |
| textSecondary | `#94A3B8` | セカンダリテキスト |
| textTertiary | `#64748B` | ターシャリテキスト |
| border | `#334155` | ボーダー |
| success | `#34D399` | 成功・オンライン |
| error | `#EF4444` | エラー・削除 |
| warning | `#F59E0B` | 警告 |

### Glassmorphism エフェクト

- 背景: `rgba(30, 41, 59, 0.6)` （surface + 60% opacity）
- ボーダー: `1px solid rgba(248, 250, 252, 0.1)`
- ぼかし: `blur(16px)`
- 角丸: `borderRadius.md` (12px) 〜 `borderRadius.lg` (16px)

### Cosmic 背景

- 全画面共通の星空/ネビュラ背景画像
- オーバーレイ: `#0F172ACC` (80% opacity)
- フォールバック背景色: `#0F172A`

### ゴールド CTA

- 背景: グラデーション `#E8C567` → `#C9A033` → `#A07B1A`（3-stop、.pen ファイル準拠）
- テキスト: `#0F172A` (textInverse)
- 角丸: 22px
- 高さ: 54px
- フォント: 18px / weight 700

### タイポグラフィ

| 用途 | Size | Weight | Color |
|------|------|--------|-------|
| ヒーロータイトル | 40px (hero) | 700 | text |
| セクションタイトル | 24px (xl) | 700 | text |
| カードタイトル | 18px (lg) | 600 | text |
| 本文 | 16px (md) | 400 | text |
| キャプション | 14px (sm) | 400 | textSecondary |
| ラベル | 12px (xs) | 500 | textTertiary |

---

## 画面-コード対応表

| # | デザイン画面 | Node ID | コードファイル | セクション |
|---|------------|---------|--------------|----------|
| 1 | A-0 Landing v2 | YKJ8P | app/(auth)/login.tsx (Landing部分) | Auth |
| 2 | A-1 Login v2 | ISa7t | app/(auth)/login.tsx (Login部分) | Auth |
| 3 | T-1 Chat Free v2 | vVQxs | app/(tabs)/index.tsx | Chat |
| 4 | T-1 Chat Pro v2 | WGNcl | app/(tabs)/index.tsx | Chat |
| 5 | T-1 Chat Attach v2 | lmaHb | app/(tabs)/index.tsx | Chat |
| 6 | S-1 Community | sjBQF | app/(tabs)/community.tsx | Other |
| 7 | S-2 MyAgent | gJe42 | app/(tabs)/twin.tsx | Other |
| 8 | S-3 MyPage | SM8cv | app/(tabs)/settings.tsx | Other |
| 9 | O-1 Welcome | dd8YN | app/(onboarding)/welcome.tsx | OB |
| 10 | O-2 Personality Quiz | QOkUh | app/(onboarding)/personality-quiz.tsx | OB |
| 11 | O-3 Result | pM32A | app/(onboarding)/result.tsx | OB |
| 12 | O-4 Choose Avatar | 5hGKw | app/(onboarding)/choose-avatar.tsx | OB |
| 13 | O-5 Choose Tone | mBkcg | app/(onboarding)/choose-tone.tsx | OB |
| 14 | O-6 Meet Twin | lRd5O | app/(onboarding)/meet-twin.tsx | OB |
| 15 | P-1 Paywall | BWcG9 | app/(paywall)/index.tsx | Paywall |
| 16 | M-1 Subscription Manage | 5T9Fp | app/subscription-manage.tsx | Modal |
| 17 | M-2 Twin Conversation | XUmoI | app/twin-conversation-detail.tsx | Modal |
| 18 | M-3 Account Delete | MksMO | app/account-delete-confirm.tsx | Modal |
| 19 | Sub-1 Community Create | Nuczj | app/community-create.tsx | Sub |

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: 19画面すべてがデザインファイルのスクリーンショットと視覚的に一致すること（レビュワーによる目視確認で90%以上の要素が一致）
- **SC-002**: 全画面で WCAG 2.1 AA コントラスト比（4.5:1）を満たすこと
- **SC-003**: 全画面でタップターゲット 44pt 以上を確保すること
- **SC-004**: 画面遷移が 300ms 以内で完了すること
- **SC-005**: cosmic 背景画像の読み込みが 1 秒以内、またはフォールバック背景色が即時表示されること
- **SC-006**: 日本語・英語・韓国語の 3 言語でレイアウトが崩れないこと
- **SC-007**: TypeScript 型チェック（`tsc --noEmit`）がエラーなしでパスすること
- **SC-008**: 既存のユニットテストが全パスすること

---

## Assumptions

- cosmic 背景画像は既にデザインファイルに含まれており、React Native の `ImageBackground` またはローカルアセットとして利用可能
- Outfit フォントは既にプロジェクトに組み込み済み（未組み込みの場合は expo-font で追加）
- glassmorphism の `blur` エフェクトは `expo-blur` の `BlurView` で実装
- ゴールドグラデーションは `expo-linear-gradient` の `LinearGradient` で実装
- 既存画面の機能ロジック（状態管理・API呼び出し・ナビゲーション）は変更不要。スタイルとレイアウトのみ更新
- タブバーのアイコンは lucide-react-native を使用

---

## Dependencies

- 既存仕様書: `specs/features/auth.md`, `specs/features/chat.md`, `specs/features/onboarding.md`, `specs/features/subscription.md`, `specs/features/community.md`, `specs/features/settings.md`, `specs/shared/navigation.md`
- デザインファイル: `PencilDesign-AltMe.pen` (V4 Dark Premium Redesign ボード, masterBoard ID: `orLSL`)
- テーマ定義: `src/config/theme.ts` (V4 Dark Premium トークン適用済み)
