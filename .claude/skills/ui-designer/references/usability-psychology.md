# Usability Psychologist -- ユーザビリティ/認知心理学スキル

> 元ソース: [mae616/design-skills/skills/usability-psychologist](https://github.com/mae616/design-skills/tree/main/skills/usability-psychologist)

## スキル概要

```yaml
name: usability-psychologist
description: Evaluate UI/flows from cognitive load, error prevention, and accessibility perspectives.
tags: usability, ux, cognitive-load, error-prevention, accessibility, user-testing
```

## When to Apply

このスキルは以下の場面で適用する:
- "hard to use", "high drop-off", "difficult input", "confusing", "accessibility issues", "too many errors"
- 使いにくい、離脱が多い、入力が難しい、迷う、アクセシビリティ、エラーが多い
- UIデザインレビュー、フォーム、オンボーディング、設定画面の作業時

## Core Principles

- **Usability is cost, not preference.** 混乱、記憶負担、操作数、エラー率を減らす。
- **Cognitive load.** ワーキングメモリを過負荷にしない (選択肢を減らす、段階化する、文脈を維持する)。
- **Accessibility.** 最低基準 (キーボード操作、フォーカス、コントラスト、alt テキスト) を絶対に妥協しない。

## Design Philosophy (Decision Rules)

1. **Don't break the user's current context.** 突然の画面遷移、情報の消失、モーダルの乱用を避ける。
2. **Prevent errors.** 入力制約、即時フィードバック、適切なデフォルト値を使う。
3. **Don't make users memorize.** 見せる、選ばせない (recognition over recall)。
4. **Keep operations consistent.** 同じものは同じように振る舞う。
5. **Accessibility is not an afterthought.** 仕様段階からアクセシビリティを含める。

## Initial Questions to Clarify

- **どこで失敗が起きているか?** (ステップ / 画面 / 操作)
- **何ができないか?** (理解 / 判断 / 操作 / 入力 / 待機)
- **誰が困っているか?** (初心者 / エキスパート / 支援技術ユーザー / 低速接続)
- **成功の定義は?** (完了率、時間、エラー率、満足度)

## Output Format (この順序で出力)

1. **Problem summary** (観察、事実、仮説)
2. **Cause hypotheses** (認知負荷、手がかり不足、フィードバック不足、不一致 等)
3. **Improvement proposals** (優先度付き)
4. **Accessibility check** (最低限)
5. **Validation plan** (メトリクス、ユーザーテスト、A/B 等)

## Minimum Accessibility Checklist

- [ ] 主要操作がキーボードのみで完了可能
- [ ] フォーカスが可視
- [ ] コントラストが十分
- [ ] フォームにラベルとエラー説明がある
- [ ] 画像にalt テキスト (必要な場合)

## Common Pitfalls

- 「ユーザーは慣れる」と仮定し、初回の混乱を無視する
- エラーメッセージが抽象的すぎて次のアクションを導けない
- アクセシビリティを最後に追加し、体験を壊す

---

## AltMe への適用ガイド

### ニールセンの10ヒューリスティック -- AltMe への適用

| # | ヒューリスティック | AltMe での具体例 |
|---|-------------------|-----------------|
| 1 | **Visibility of system status** | AI思考中のインジケータ、メッセージ送信中のステータス、プロビジョニング進捗 |
| 2 | **Match between system and real world** | 「ツイン」「もう一人の自分」等のメタファー、専門用語を避ける |
| 3 | **User control and freedom** | メッセージの取り消し、オンボーディングのスキップ/戻る |
| 4 | **Consistency and standards** | 全画面で同じナビゲーション、同じボタンスタイル、同じエラー表示 |
| 5 | **Error prevention** | 課金前の確認ダイアログ、不完全なオンボーディングの警告 |
| 6 | **Recognition rather than recall** | 過去のチャット履歴、最近使った機能の表示 |
| 7 | **Flexibility and efficiency** | ショートカット、テンプレートメッセージ |
| 8 | **Aesthetic and minimalist design** | 1画面1目的、不要な装飾の排除 (AltMe のミニマルデザイン) |
| 9 | **Help users recover from errors** | 具体的なエラーメッセージ + リトライボタン + サポートへのリンク |
| 10 | **Help and documentation** | オンボーディングツアー、ヘルプセンター |

### 認知負荷理論 -- AltMe の設計指針

#### 内在的負荷 (Intrinsic Load)
タスク自体の複雑さ。減らすには:
- オンボーディング: **1画面1質問** (AltMe 方針)
- 課金画面: プラン比較を表形式で視覚化
- 設定: カテゴリごとにグループ化

#### 外在的負荷 (Extraneous Load)
UIデザインが生む不要な負荷。減らすには:
- 視覚的ノイズの排除 (ミニマルデザイン)
- 一貫したレイアウトパターン
- 明確なビジュアルヒエラルキー

#### 本質的負荷 (Germane Load)
学習に使われる有用な負荷。高めるには:
- AI ツインのパーソナリティを段階的に開示
- 成功体験のフィードバック (タスク完了時の演出)

### Fitts' Law -- タップターゲット設計

```
Movement Time = a + b * log2(Distance / Width + 1)
```

実践的な指針:
- **頻繁に使うアクション (送信ボタン)**: 大きく、画面端の到達しやすい位置に
- **危険なアクション (削除)**: 小さく、プライマリアクションから離して配置
- **タップターゲット最小サイズ**: 44x44pt
- **CTA ボタン**: 画面幅いっぱい (横マージン 16px) が望ましい

### ゲシュタルト原則 -- AltMe のUI設計

| 原則 | 説明 | AltMe での適用例 |
|------|------|-----------------|
| **近接 (Proximity)** | 近い要素はグループとして知覚 | 設定項目のセクション分割、チャットのメッセージグルーピング |
| **類似 (Similarity)** | 似た外見の要素は関連と知覚 | 同じスタイルのカード、一貫したボタンスタイル |
| **閉合 (Closure)** | 不完全な形を補完して知覚 | カード型UI、セクション枠 |
| **連続 (Continuity)** | 連続したパスを追跡 | オンボーディングの進捗バー、ステップインジケータ |
| **図と地 (Figure/Ground)** | 前景と背景を区別 | モーダルのオーバーレイ、カードの影 |
| **共通運命 (Common Fate)** | 一緒に動くものはグループ | スワイプで一括削除 |

### UXリサーチ手法 -- AltMe の検証に使えるもの

| 手法 | いつ使うか | AltMe での活用 |
|------|-----------|---------------|
| **ユーザビリティテスト** | プロトタイプ段階 | オンボーディングフロー、チャットUI |
| **A/Bテスト** | リリース後 | 課金画面のコンバージョン最適化 |
| **ヒートマップ分析** | リリース後 | タップ位置、スクロール深度 |
| **ファネル分析** | リリース後 | オンボーディング完了率、課金転換率 |
| **NPS/CSAT** | 定期的 | ユーザー満足度の追跡 |
| **インタビュー** | 企画/改善段階 | ペルソナ検証、課題発見 |

### エラー予防チェックリスト (AltMe 固有)

- [ ] オンボーディング: 入力バリデーションがリアルタイム
- [ ] チャット: 空メッセージの送信が無効化
- [ ] 課金: 二重購入の防止
- [ ] 設定: 破壊的変更 (アカウント削除等) に確認ダイアログ
- [ ] ネットワーク: オフライン時の操作制限と明確なフィードバック
- [ ] プロビジョニング: 進行中にアプリを閉じても安全
