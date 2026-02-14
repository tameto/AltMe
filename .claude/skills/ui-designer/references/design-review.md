# UI/UX Design Review Skill

> Source: https://github.com/rknall/claude-skills/tree/main/ui-design-review
> References: wcag-checklist.md, design-patterns-library.md, testing-resources.md

ウェブサイト・デスクトップアプリケーションの包括的デザインレビューフレームワーク。
アクセシビリティコンプライアンスとベストプラクティスに強力なフォーカス。

---

## Review Dimensions（11 カテゴリ）

### A. Accessibility (WCAG 2.1/2.2 Compliance) — CRITICAL

全インターフェースで必ず徹底的にレビューする最重要領域。

### B. Visual Design & Aesthetics
- ビジュアルヒエラルキーとレイアウト構造
- カラーパレットとカラー理論の適用
- タイポグラフィの選択とヒエラルキー
- ホワイトスペースと密度
- ビジュアルバランスとアラインメント
- ブランドガイドラインとの一貫性

### C. User Experience & Usability
- ユーザーフローのロジックと効率
- 情報アーキテクチャ
- ナビゲーションパターンと明瞭性
- 認知負荷
- エラー予防と回復
- ニールセンの10ヒューリスティック準拠

### D. Responsive Design & Layout
- ブレイクポイント戦略
- モバイルファーストアプローチ
- タッチターゲットサイズ（最小 44x44px）
- コンテンツリフロー

### E. Typography & Readability
- フォント選択とペアリング
- タイプスケールとヒエラルキー
- 行長（45-75文字が最適）
- 行高（ボディテキストに 1.5-1.8）
- フォントサイズ（ボディ最小 16px）

### F. Color & Contrast
- カラーパレットの一貫性
- コントラスト比（WCAG 準拠）
- 色覚異常アクセシビリティ
- ダークモードサポート

### G. Interactive Elements & Components
- ボタンスタイルと状態
- フォームコントロールと入力
- 全状態のデザイン: default, hover, focus, active, disabled, error, success

### H. Navigation & Information Architecture
- プライマリ/セカンダリナビゲーション構造
- ブレッドクラム、検索機能
- ナビゲーション深度（最大3レベル）

### I. Forms & Data Entry
- フォームレイアウトと構造
- ラベル配置（入力の上または左）
- バリデーションアプローチ（インラインが推奨）
- プレースホルダーをラベルとして使わない

### J. Performance & Loading
- 知覚パフォーマンス
- ローディングインジケーター / スケルトンスクリーン
- レイアウトシフトの防止

### K. Content & Microcopy
- ヘッディングの明瞭性
- ボタンラベル（アクション指向）
- エラーメッセージ（会話的で有用）
- エンプティステート

---

## WCAG 2.1/2.2 Accessibility Requirements

### Level A（最低要件）

#### 1.1 Text Alternatives
- [ ] 全画像に適切な alt テキスト
- [ ] 装飾画像に空の alt="" 属性
- [ ] アイコンにアクセシブルラベル
- [ ] 複雑な画像に詳細な説明

#### 1.2 Time-based Media
- [ ] ビデオコンテンツにキャプション
- [ ] オーディオコンテンツにトランスクリプト

#### 1.3 Adaptable
- [ ] セマンティック HTML を正しく使用
- [ ] CSS なしでも論理的なコンテンツ構造
- [ ] フォームラベルがプログラム的に関連付け
- [ ] 感覚特性だけに依存する指示を避ける

#### 1.4 Distinguishable
- [ ] 色だけが情報伝達の唯一の手段でない
- [ ] テキストのコントラスト: 通常テキスト 4.5:1, 大きいテキスト 3:1
- [ ] テキストを 200% まで拡大可能
- [ ] テキスト画像を避ける（ロゴ除く）

#### 2.1 Keyboard Accessible
- [ ] 全機能がキーボードアクセシブル
- [ ] キーボードトラップなし
- [ ] フォーカス順序が論理的
- [ ] フォーカスが常に可視

#### 2.2 Enough Time
- [ ] 時間制限を調整、延長、またはオフにできる
- [ ] 移動するコンテンツを一時停止できる

#### 2.3 Seizures
- [ ] コンテンツが毎秒3回以上フラッシュしない

#### 2.4 Navigable
- [ ] スキップリンクで繰り返しコンテンツをバイパス
- [ ] ページタイトルが説明的でユニーク
- [ ] リンクの目的がコンテキストから明確
- [ ] 複数のナビゲーション方法が存在

#### 2.5 Input Modalities
- [ ] ポインタージェスチャで全機能が動作
- [ ] タッチターゲットが十分なサイズ（最小 44x44px）

#### 3.1 Readable
- [ ] ページ言語が特定（`<html lang="ja">`）

#### 3.2 Predictable
- [ ] フォーカスが予期しない変更をトリガーしない
- [ ] ナビゲーションがページ間で一貫

#### 3.3 Input Assistance
- [ ] フォームエラーが特定され説明される
- [ ] ラベルと指示が提供される
- [ ] 重要なアクションを元に戻す、確認、またはチェックできる

#### 4.1 Compatible
- [ ] HTML が有効で適切にネスト
- [ ] ID がユニーク
- [ ] ARIA 属性が正しく使用
- [ ] ステータスメッセージがフォーカスなしで認識可能

### Level AA（推奨）

- [ ] コントラスト比: 通常テキスト 4.5:1, 大きいテキスト 3:1
- [ ] テキストを支援技術なしで 200% 拡大可能
- [ ] テキスト画像を避ける（カスタマイズ可能な場合を除く）
- [ ] ページを見つける複数の方法が存在
- [ ] 見出しとラベルが説明的
- [ ] フォーカスインジケーターが可視
- [ ] 320px 幅で水平スクロールなしにコンテンツがリフロー
- [ ] 非テキストコントラスト 3:1 以上
- [ ] テキストスペーシングを調整可能
- [ ] ホバー/フォーカスコンテンツが dismissible, hoverable, persistent

### Level AAA（ベストプラクティス）

- [ ] コントラスト比: 通常テキスト 7:1, 大きいテキスト 4.5:1
- [ ] テキスト画像なし
- [ ] テキストスペーシング調整可能
- [ ] 320px でスクロールなしにコンテンツリフロー

---

## Contrast Requirements (Quick Reference)

| Element | AA | AAA |
|---------|-----|-----|
| Normal text | 4.5:1 | 7:1 |
| Large text (18pt+ / 14pt bold+) | 3:1 | 4.5:1 |
| UI components & graphics | 3:1 | — |
| Focus indicators | 3:1 | — |

---

## Keyboard Accessibility

### 基本ナビゲーション
- **Tab**: インタラクティブ要素を前方移動
- **Shift + Tab**: 後方移動
- **Enter**: ボタンとリンクをアクティベート
- **Space**: ボタンアクティベート、チェックボックストグル
- **Arrow keys**: コンポーネント内ナビゲーション（メニュー、タブ）
- **Escape**: モーダル、ドロップダウン、メニューを閉じる

### テスト手順
1. マウスを使わずにページ全体を Tab で移動
2. フォーカスインジケーターが可視であることを確認
3. 論理的なタブ順序を確認
4. 全インタラクティブ要素に到達可能
5. キーボードトラップがないことを確認
6. カスタムコンポーネント（モーダル、ドロップダウン）をテスト

---

## ARIA 使用ルール

### 基本原則
1. **セマンティック HTML ファースト** — ネイティブ要素が最優先
2. **ARIA は補助的** — セマンティック HTML で不十分な場合のみ
3. **必須 ARIA パターン**:
   - `aria-label` — アイコンのみのボタン
   - `aria-expanded` — 開閉可能な要素の状態
   - `aria-controls` — 制御対象の関連付け
   - `aria-current="page"` — 現在のページ
   - `aria-live` — 動的コンテンツの通知
   - `role="dialog"` + `aria-modal="true"` — モーダル
   - `role="alert"` — 緊急メッセージ
   - `role="status"` — 非緊急ステータス

### React Native 固有の ARIA
```tsx
// ボタン
<Pressable
  accessibilityRole="button"
  accessibilityLabel="メッセージを送信"
  accessibilityState={{ disabled: isLoading }}
>
  <SendIcon />
</Pressable>

// トグルスイッチ
<Switch
  accessibilityRole="switch"
  accessibilityLabel="通知を有効にする"
  accessibilityState={{ checked: isEnabled }}
/>

// ライブリージョン（動的更新）
<View accessibilityLiveRegion="polite">
  <Text>{statusMessage}</Text>
</View>

// モーダル
<Modal>
  <View accessibilityViewIsModal={true}>
    <Text accessibilityRole="header">確認</Text>
    {/* Modal content */}
  </View>
</Modal>
```

---

## Accessible Design Patterns Library

### Skip Links
```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```
- ページ最初のフォーカス可能要素
- キーボードフォーカスで可視

### Responsive Navigation Menu
- `aria-expanded` でメニュー状態表示
- `aria-current="page"` で現在ページ
- Escape でメニュー閉じ + フォーカスをトグルボタンに戻す

### Accessible Form Input
- `label` と `input` を `for`/`id` で明示的に関連付け
- `autocomplete` 属性でオートフィル
- `aria-describedby` でヒントとエラーテキストをリンク
- `aria-invalid` でバリデーション失敗時
- エラーメッセージに `role="alert"`

### Modal Dialog
- `role="dialog"` + `aria-modal="true"`
- `aria-labelledby` でダイアログタイトルを参照
- モーダル内でフォーカストラップ
- Escape で閉じ
- 閉じた後フォーカスをトリガーに戻す

### Loading Button
- `aria-busy` でローディング状態表示
- ボタンテキストが現在の状態を説明
- ローディング中はボタン無効化

### Accordion
- ボタンがヘディングテキストをラップ
- `aria-expanded` で状態表示
- `aria-controls` でパネルにリンク
- パネルに `role="region"` + `aria-labelledby`

---

## Deliverables Structure（レビューレポートフォーマット）

### 1. Executive Summary
- 全体的なデザイン評価（1-3パラグラフ）
- 特定された主な強み
- 即座の対応が必要な重大な問題
- アクセシビリティコンプライアンスレベル（A, AA, AAA）
- 全体的なデザイン成熟度スコア

### 2. Accessibility Analysis（優先セクション）

**WCAG Compliance Summary:**
- Level A: X violations found
- Level AA: X violations found
- Level AAA: X recommendations

**Critical Accessibility Issues:**
- HIGH: アクセスを阻止する問題（WCAG リファレンス付き）
- MEDIUM: アクセスを妨げる問題
- LOW: アクセスを向上させる改善

**Detailed Findings（各問題ごと）:**
- WCAG criterion violated（例: "1.4.3 Contrast (Minimum)"）
- Severity: Critical/High/Medium/Low
- 問題の説明
- User impact（影響を受けるユーザー）
- 修正方法（具体的でアクション可能なステップ）
- 修正確認のテスト方法

### 3. Visual Design Assessment
- Strengths / Concerns (HIGH/MEDIUM/LOW) / Recommendations

### 4. UX & Usability Assessment
- Strengths / Concerns (HIGH/MEDIUM/LOW) / Recommendations

### 5. Responsive Design Assessment
- 各ブレイクポイントでの問題
- モバイル固有の問題
- デスクトップ固有の問題

### 6. Component & Pattern Review
- 不整合、欠落状態、パターン違反

---

## Priority Classification

| Level | Definition | Examples |
|-------|-----------|---------|
| **CRITICAL** | コア機能へのアクセスを阻止 | WCAG Level A 違反, キーボード/スクリーンリーダーの完全ブロック |
| **HIGH** | UXを著しく損なう | WCAG Level AA 違反, 主要なユーザビリティ問題, 不十分なモバイル体験 |
| **MEDIUM** | 摩擦があるが回避策あり | WCAG Level AAA 推奨, ビジュアル不整合, マイナーなユーザビリティ問題 |
| **LOW** | 磨きと改善 | エッジケース, 美的改善, 将来の強化 |

---

## Testing Resources

### Automated Accessibility Testing

| Tool | Platform | Cost | Best For |
|------|----------|------|----------|
| axe DevTools | Browser Extension | Free/Paid | 包括的スキャン |
| WAVE | Browser Extension | Free | ビジュアルフィードバック |
| Lighthouse | Chrome DevTools | Free | CI/CD 統合 |
| Pa11y | Node.js CLI | Free | バルクテスト |
| axe-core | Node.js Library | Free | 統合テスト |

### Screen Readers

| Tool | Platform | Cost |
|------|----------|------|
| NVDA | Windows | Free |
| JAWS | Windows | Paid |
| VoiceOver | macOS / iOS | Built-in |
| TalkBack | Android | Built-in |

### Color & Contrast Tools

| Tool | Type | Best For |
|------|------|----------|
| WebAIM Contrast Checker | Web | クイックチェック |
| Stark | Figma/Sketch/Chrome | デザインワークフロー |
| Colour Contrast Analyser | Desktop App | ピクセルパーフェクトテスト |
| Color Oracle | Desktop App | 色覚異常リアルタイムシミュレーション |
| Sim Daltonism | macOS / iOS | ライブプレビュー |

### Usability Testing Platforms

| Tool | Best For |
|------|----------|
| UserTesting.com | 実ユーザーテスト |
| Maze | プロトタイプテスト |
| Hotjar | ヒートマップ / セッションレコーディング |
| FullStory | セッションリプレイ / エラートラッキング |

### Testing Checklist（時間別）

| Test Type | Time | Tools |
|-----------|------|-------|
| Automated Testing | 15 min | axe DevTools, WAVE, Lighthouse |
| Manual Keyboard Testing | 15 min | Tab/Enter/Escape |
| Screen Reader Testing | 30 min | NVDA/JAWS/VoiceOver |
| Visual Testing | 15 min | Contrast checker, Color blindness sim |
| Mobile Testing | 15 min | 実デバイス、タッチターゲット確認 |

---

## Nielsen's 10 Usability Heuristics (Review Reference)

1. **Visibility of system status** — システム状態の可視性
2. **Match between system and real world** — 現実世界との一致
3. **User control and freedom** — ユーザーのコントロールと自由
4. **Consistency and standards** — 一貫性と標準
5. **Error prevention** — エラーの予防
6. **Recognition rather than recall** — 記憶よりも認識
7. **Flexibility and efficiency of use** — 柔軟性と効率
8. **Aesthetic and minimalist design** — 美的でミニマルなデザイン
9. **Help users recognize and recover from errors** — エラー認識と回復の支援
10. **Help and documentation** — ヘルプとドキュメント

---

## AltMe プロジェクトへの適用

### React Native 固有のアクセシビリティチェック
- [ ] `accessibilityRole` が全インタラクティブ要素に設定
- [ ] `accessibilityLabel` がアイコンボタンに設定
- [ ] `accessibilityState` で disabled/checked/selected を表現
- [ ] `accessibilityHint` で複雑なアクションに説明追加
- [ ] `accessibilityLiveRegion` で動的更新を通知
- [ ] `accessibilityViewIsModal` でモーダル内フォーカス制御
- [ ] タッチターゲット 44x44px 以上（`hitSlop` で拡大可能）
- [ ] `AccessibilityInfo.isReduceMotionEnabled()` でアニメーション制御

### 課金フローのレビュー重点項目
- [ ] ペイウォール画面: 価格の可読性、CTA ボタンの明瞭性
- [ ] 復元ボタン: Apple ガイドライン準拠で目立つ配置
- [ ] トライアル終了通知: 誤解を招かない表現
- [ ] 解約フロー: 操作の一貫性と明確な確認

### デザインレビュー実施タイミング
- 新画面設計完了後
- ペイウォール/課金UI変更時
- アクセシビリティ改善スプリント
- リリース前の最終チェック
