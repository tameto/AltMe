# UI Designer -- 画面設計スキル

> 元ソース: [mae616/design-skills/skills/ui-designer](https://github.com/mae616/design-skills/tree/main/skills/ui-designer)

## スキル概要

```yaml
name: ui-designer
description: Design UI as information architecture + interaction + visual tone, then translate into implementable specs.
tags: ui, design, components, design-system, information-architecture
```

## When to Apply

このスキルは以下の場面で適用する:
- UI/画面設計、コンポーネント設計、情報設計、デザインシステム、ビジュアルヒエラルキー、レイアウト構造、トーン&マナー
- 画面設計、UI方針、コンポーネント設計、情報設計、トーン&マナー、デザインシステム、画面の骨格
- デザインファイルやデザイン関連のコマンドを扱う場合

## Core Principles

- **UI is not art, it's decision support.** ユーザーが目標を最速で達成できるよう支援する。
- **Systematize repetition.** 繰り返し出現するUIパターンはコンポーネント化し、トークンで不一致を防ぐ。
- **Specs include states.** 完全な仕様には loading, error, empty, disabled の状態が含まれる。

## Design Philosophy (Decision Rules)

1. **Prioritize first.** ユーザーが最初に見るべきものと、後から見せるものを決める。
2. **Don't cram everything.** プログレッシブ・ディスクロージャで段階的に情報を開示する。
3. **Always define states.** Normal / loading / empty / error / no-permission は必ず定義する。
4. **Enforce consistency through rules.** コンポーネント、トークン、スペーシング、タイポグラフィでコヒーレンスを確保。
5. **Leave no ambiguity for implementers.** 仕様は曖昧な散文ではなく、正確に記述する。

## Initial Questions to Clarify

画面設計に取りかかる前に必ず確認する:

- **画面の目標は?** (何をもって成功とするか)
- **主要ユーザーは?** (ペルソナ / 利用コンテキスト)
- **主要アクションは?**
- **エッジケースは?** (Empty / error / permission / slow network)
- **再利用スコープは?** (画面固有 or 横断的)

## Output Format (この順序で出力)

1. **画面の目的 / 成功基準**
2. **情報アーキテクチャ** (優先度、構造)
3. **コンポーネント提案** (責務、props、状態)
4. **トークン / スタイルガイドライン** (色、スペーシング、タイポグラフィ)
5. **エッジ状態の仕様** (empty / error / loading)
6. **ネクストアクション** (プロトタイプ → 実装)

## Common Pitfalls

- エッジ状態が未定義のまま放置され、場当たり的な実装になる
- トークンに反映されないビジュアルの不一致が、マジックナンバーとして増殖する
- 画面の目的が不明確なまま要素が膨らむ

---

## AltMe への適用ガイド

### 情報アーキテクチャ -- AltMe の画面例

| 画面 | プライマリコンテンツ | セカンダリコンテンツ | 主要アクション |
|------|---------------------|---------------------|---------------|
| チャット | メッセージ一覧 | AI Twin ステータス | メッセージ送信 |
| オンボーディング | 質問 (1画面1質問) | 進捗インジケータ | 回答入力 → 次へ |
| 設定 | 設定項目リスト | アカウント情報 | 設定変更 |
| 課金画面 | プラン比較 | 特典説明 | プラン選択 → 購入 |
| 履歴 | 過去のチャット一覧 | 日付・タグ | チャット選択 |

### ビジュアルヒエラルキー -- AltMe のデザイントークン

AltMe のデザインシステム(紫→青グラデーション、ミニマルデザイン)に準拠:

```typescript
// カラートークン (src/config/theme.ts)
const colors = {
  primary: '#6C63FF',     // メインアクション、CTAボタン
  secondary: '#4ECDC4',   // セカンダリアクション
  background: '#FFFFFF',  // 背景
  surface: '#F8F9FA',     // カード・セクション背景
  text: '#1A1A2E',        // メインテキスト
  textSecondary: '#6B7280', // 補助テキスト
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
};

// スペーシングスケール
const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 40, huge: 48 };

// タイポグラフィロール
const typography = {
  display:  { size: 32, weight: 'Bold',      use: 'ウェルカム画面' },
  heading:  { size: 24, weight: 'SemiBold',  use: 'セクションタイトル' },
  title:    { size: 20, weight: 'SemiBold',  use: '画面タイトル' },
  body:     { size: 16, weight: 'Regular',   use: '本文' },
  caption:  { size: 14, weight: 'Regular',   use: '補助テキスト' },
  small:    { size: 12, weight: 'Regular',   use: 'タイムスタンプ' },
};
```

### 状態マトリクス -- AltMe 全画面で定義必須

| 状態 | 説明 | 視覚表現 |
|------|------|---------|
| Default | 初期状態 | 通常表示 |
| Loading | データ読み込み中 | スケルトン / スピナー |
| Empty | データなし | イラスト + CTA |
| Error | エラー発生 | エラーメッセージ + リトライボタン |
| Disabled | 操作不可 | 透明度50% |
| Pressed | 押下中 | scale(0.97) + opacity(0.8) |
| No-Auth | ログイン必要 | ログインCTA |

### グリッドシステム

AltMe はモバイルファーストのため:
- 基本グリッド: 4px ベースグリッド
- コンテンツマージン: 左右 16px (spacing.lg)
- カード間ギャップ: 12px (spacing.md)
- セクション間ギャップ: 24px (spacing.xl)
