# ツイン情報画面仕様 — Twin

## 参照仕様: specs/features/insights.md
## デザイン: designs/twin.pen (未作成)

---

## T-3: ツイン情報タブ

### ファイル
`app/(tabs)/twin.tsx`

### 画面目的
ユーザーのAIツインに関する全情報を統合的に表示する。性格データ、気分の推移、SOUL.mdの要約、OpenClawインスタンスの状態を1つの画面で確認できる。データの蓄積を可視化し、AIツインとの関係性の深さを実感させることで解約防止に貢献する。

### 情報アーキテクチャ

#### プライマリコンテンツ（重要度順）
1. **ツイン名 + アバター** — AIツインのアイデンティティ
2. **Big Five性格プロフィール** — 5トレイト棒グラフ + スコア + サマリー
3. **今日の気分** — 5段階絵文字選択UI
4. **週次気分グラフ** — 直近7日間の気分推移
5. **SOUL.mdサマリー（Pro限定）** — AIツインの性格設定
6. **OpenClawステータス（Pro限定）** — インスタンス状態バッジ

#### セカンダリコンテンツ
- 「性格診断をやり直す」リンク
- 「詳細設定」リンク（OpenClaw管理、設定画面へ遷移）

#### アクション
- 気分絵文字タップ → 当日の気分を記録/上書き
- 性格診断やり直しリンク → 確認ダイアログ → オンボーディング遷移
- 詳細設定リンク → 設定画面遷移
- プルダウンリフレッシュ → 全データ再取得

---

## レイアウト構成

```
┌─────────────────────────────────┐
│          SafeArea Top           │
│                                 │
│  ┌─────────────────────────┐   │
│  │  ┌──────┐               │   │
│  │  │[アバター]│ ツイン名     │   │← セクション1: ヘッダー
│  │  └──────┘               │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  性格プロフィール         │   │← セクション2
│  │                         │   │
│  │  開放性        ━━━━━━━━ 80 │   │
│  │  誠実性        ━━━━━━━  65 │   │
│  │  外向性        ━━━━━━━━ 75 │   │
│  │  協調性        ━━━━━━━━ 90 │   │
│  │  神経症傾向     ━━━━━    30 │   │
│  │                         │   │
│  │  サマリー: 創造的で協調的、│   │
│  │  安定した性格特性です     │   │
│  │                         │   │
│  │  MBTI: INTJ (設定済みの場合)│  │
│  │  [MBTIを設定する] (未設定) │   │
│  │                         │   │
│  │  [性格診断をやり直す]    │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  今日の気分              │   │← セクション3
│  │                         │   │
│  │  😄  🙂  😐  😢  😫   │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  気分の推移（直近7日間） │   │← セクション4
│  │                         │   │
│  │      [週次グラフ]        │   │
│  │  月  火  水  木  金  土  日 │   │
│  │  😄  🙂  😐  —  😢  🙂  😄 │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  AIツインの性格 (Pro)    │   │← セクション5
│  │                         │   │
│  │  SOUL.mdサマリーテキスト  │   │
│  │  ・・・                 │   │
│  │                         │   │
│  │  [Proにアップグレード]   │   │← Free表示
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  インスタンス状態 (Pro)  │   │← セクション6
│  │                         │   │
│  │  ステータス: [●稼働中]   │   │
│  │                         │   │
│  │  [詳細設定]             │   │
│  └─────────────────────────┘   │
│                                 │
│          SafeArea Bottom        │
└─────────────────────────────────┘
```

---

## コンポーネント構成

| # | コンポーネント | 種類 | 配置 | 備考 |
|---|--------------|------|------|------|
| 1 | TwinAvatar | Image | ヘッダー左 | 80x80pt 円形（将来実装、現在はプレースホルダー） |
| 2 | TwinName | Text | ヘッダー右 | Display 32pt Bold |
| 3 | PersonalitySection | Card | セクション2 | Big Fiveグラフ + サマリー |
| 4 | BigFiveBar | ProgressBar | セクション2内 | 5トレイト × 棒グラフ |
| 5 | TraitLabel | Text | バー左 | Body 16pt |
| 6 | TraitScore | Text | バー右 | Body 16pt Bold |
| 7 | PersonalitySummary | Text | セクション2下部 | Body 16pt、複数行 |
| 7.5 | MBTIDisplay | Text/TextButton | セクション2内サマリー下 | 設定済み: タイプ名表示（Body 16pt Bold）、未設定: 「MBTIを設定する」リンク（設定画面遷移） |
| 8 | RetakeQuizLink | TextButton | セクション2最下部 | Caption 14pt、下線、Primary色 |
| 9 | MoodSection | Card | セクション3 | 今日の気分記録 |
| 10 | MoodEmoji | Pressable | セクション3内 | 5絵文字、各44x44pt |
| 11 | WeeklyMoodGraph | Card | セクション4 | 週次気分グラフ |
| 12 | MoodChart | LineChart | セクション4内 | 7日間の気分推移 |
| 13 | SoulMdSection | Card | セクション5 | SOUL.mdサマリー（Pro） |
| 14 | SoulMdSummary | Text | セクション5内 | Body 16pt、複数行 |
| 15 | UpgradePrompt | View | セクション5内 | Free表示 + ボタン |
| 16 | InstanceStatusSection | Card | セクション6 | OpenClawステータス（Pro） |
| 17 | StatusBadge | Badge | セクション6内 | 色分けバッジ |
| 18 | SettingsLink | TextButton | セクション6下部 | Caption 14pt、Primary色 |

---

## スペーシング

| 区間 | 間隔 |
|------|------|
| SafeArea上端 → ヘッダー | 24pt |
| ヘッダー → 性格セクション | 24pt |
| セクション間 | 16pt |
| セクション内パディング | 16pt |
| Big Fiveバー間 | 12pt |
| バーラベル → バー | 8pt |
| バー → スコア数値 | 8pt |
| サマリー → やり直しリンク | 16pt |
| 気分絵文字間 | 16pt |
| グラフ → SafeArea下端 | 24pt |

---

## ボタン仕様

| ボタン | 幅 | 高さ | 角丸 | スタイル |
|--------|-----|------|------|---------|
| 性格診断をやり直す | auto（inline） | 24pt | — | テキストリンク、下線、Primary色 |
| Proにアップグレード | fill - 32pt margin | 50pt | 12pt | Primary #6C63FF、白文字 |
| 詳細設定 | auto（inline） | 24pt | — | テキストリンク、Primary色 |
| 気分絵文字 | 44pt | 44pt | 22pt | 透明背景、選択時に Primary背景 |

---

## 状態設計

| 状態 | 表示内容 |
|------|---------|
| **Default (Pro)** | 全セクション表示（性格 + 気分 + グラフ + SOUL.md + ステータス） |
| **Default (Free)** | 性格 + 気分 + グラフ + アップグレードプロンプト |
| **Loading** | スケルトンローディング（各セクション） |
| **Empty (気分未記録)** | 気分セクションに「気分を記録してみよう」誘導メッセージ |
| **Empty (診断未実施)** | オンボーディング画面にリダイレクト |
| **Error** | セクションごとにインラインエラー + リトライボタン |
| **Provisioning (Pro)** | ステータスバッジ「●セットアップ中...」黄色 |
| **Running (Pro)** | ステータスバッジ「●稼働中」緑色 |
| **Stopped (Pro)** | ステータスバッジ「●停止中」グレー |
| **Error (Instance)** | ステータスバッジ「●エラー」赤色 + 「詳細設定」強調 |

---

## セクション詳細

### セクション1: ツイン名ヘッダー

**目的**: AIツインのアイデンティティを視覚化

| 要素 | 仕様 |
|------|------|
| アバター | 80x80pt 円形、将来実装（現在はプレースホルダーアイコン） |
| ツイン名 | `profiles.twin_name`、Display 32pt Bold、Primary色 |
| レイアウト | 横並び、アバター左 + 名前右（vertical center align） |

---

### セクション2: Big Five性格プロフィール

**目的**: 性格診断結果を視覚的に理解する

#### Big Five 5トレイト

| トレイト | 英語 | スコア範囲 | バー色 |
|---------|------|----------|--------|
| 開放性 | Openness | 0-100 | #6C63FF（Primary） |
| 誠実性 | Conscientiousness | 0-100 | #4ECDC4（Secondary） |
| 外向性 | Extraversion | 0-100 | #6C63FF |
| 協調性 | Agreeableness | 0-100 | #4ECDC4 |
| 神経症傾向 | Neuroticism | 0-100 | #F59E0B（Warning、低いほど安定） |

#### バーグラフ仕様
- 横棒グラフ、0-100%
- 左: トレイト名（日本語）
- 中: プログレスバー（fill color + track color）
- 右: スコア数値（"80"）
- 各バーの高さ: 8pt、角丸: 4pt
- アニメーション: 画面表示時に0%から実際のスコアまで（spring, 800ms, stagger 100ms）

#### サマリーテキスト
- `personality_results.summary` を表示
- Body 16pt、複数行、最大5行（それ以上は「さらに読む」で展開）
- 例: 「創造的で協調的、安定した性格特性です。新しいアイデアに開かれており、他者との調和を重視します。」

#### MBTI表示
- データソース: `profiles.mbti_type`（TEXT NULL）
- 設定済み: MBTIタイプ名を表示（例: 「MBTI: INTJ」Body 16pt Bold）
- 未設定: 「MBTIを設定する」テキストリンク → `app/(tabs)/settings.tsx` のMBTI選択セクションに遷移
- MBTIタイプ一覧: INTJ, INTP, ENTJ, ENTP, INFJ, INFP, ENFJ, ENFP, ISTJ, ISFJ, ESTJ, ESFJ, ISTP, ISFP, ESTP, ESFP

#### 「性格診断をやり直す」リンク
- タップ → 確認ダイアログ表示
- ダイアログタイトル: 「性格診断をやり直す」
- ダイアログメッセージ: 「性格診断をやり直すと、AIツインの性格も変わります。よろしいですか？」
- ボタン: 「はい」「いいえ」
- 「はい」タップ → `app/(onboarding)/personality-quiz.tsx` に遷移
- Pro: 診断完了後にSOUL.md自動更新（Edge Function `update-soul-md`）

---

### セクション3: 今日の気分

**目的**: 簡単なタップで当日の気分を記録

#### 5段階気分

| 値 | 絵文字 | 意味 | 色 |
|----|--------|------|-----|
| great | 😄 | とても良い | #10B981（緑） |
| good | 🙂 | 良い | #4ECDC4（青緑） |
| neutral | 😐 | 普通 | #6B7280（グレー） |
| bad | 😢 | 悪い | #F59E0B（黄） |
| terrible | 😫 | とても悪い | #EF4444（赤） |

#### UI仕様
- 5つの絵文字を横並び、等間隔（16pt gap）
- 各絵文字サイズ: 44x44pt（タップターゲット）
- 選択状態: Primary色の円形背景（opacity 0.2） + scale(1.1)
- 未選択状態: 透明背景
- タップ → `mood_records` テーブルに upsert（当日レコード）
- 同日の既存レコードがある場合、選択状態で表示

#### インタラクション
- タップ → 即座に選択状態に変更（楽観的UI更新）
- Supabase保存中 → 微細なスピナー表示（絵文字右上）
- 保存成功 → 週次グラフ即座に更新
- 保存失敗 → 選択状態を元に戻す + エラートースト

---

### セクション4: 週次気分グラフ

**目的**: 直近7日間の気分推移を視覚化

#### グラフ仕様
- 横軸: 日付（月/日、例: "2/10"）
- 縦軸: 気分レベル（5段階: terrible=1, bad=2, neutral=3, good=4, great=5）
- データポイント: 各日の気分を絵文字またはカラードット表示
- 未記録日: グレーアウト「—」表示
- 線グラフまたはバーグラフ（デザイナー選択）
- カラーコード: 気分に応じた色（上表参照）

#### 空状態
- 7日間すべて未記録: 中央に「気分を記録してみよう」メッセージ
- 一部未記録: 記録済みの日のみプロット、未記録日はグレーアウト

#### データソース
- `mood_records` テーブル（Single Source of Truth）
- 直近7日間のレコードを取得（`recorded_at >= CURRENT_DATE - INTERVAL '6 days'`）
- タイムゾーンは `profiles.timezone` 基準

---

### セクション5: AIツインの性格（Pro限定）

**目的**: SOUL.mdから生成されたAIツインの性格設定を表示

#### Proユーザー表示
- セクションタイトル: 「AIツインの性格」
- SOUL.mdサマリーテキスト表示
  - `personality_results.communication_style` の一部を抽出
  - 例: 「あなたのツインは創造的で協調的な性格です。新しいアイデアを歓迎し、共感的なコミュニケーションを好みます。」
- Body 16pt、複数行、最大10行（それ以上はスクロール可能）

#### Freeユーザー表示
- セクションタイトル: 「AIツインの性格」
- ぼかし表示（BlurView intensity: 10）
- 中央にプロンプトカード:
  - 「Proにアップグレードして詳細を見る」見出し
  - 「AIツインの性格設定や会話スタイルを確認できます」説明文
  - 「Proにアップグレード」ボタン → ペイウォール遷移

#### エッジケース
| ケース | 表示内容 |
|--------|---------|
| SOUL.md未生成（Pro） | 「AIツインをセットアップ中...」メッセージ + スピナー |
| SOUL.md取得エラー | 「詳細を取得できませんでした」+ リトライボタン |
| サマリーテキストが長い（500文字超） | 最大10行表示 + スクロール可能 |

---

### セクション6: インスタンス状態（Pro限定）

**目的**: OpenClawインスタンスのステータスをリアルタイム表示

#### ステータスバッジ

| ステータス | バッジテキスト | 色 | アイコン |
|-----------|-------------|-----|---------|
| provisioning | ●セットアップ中... | #F59E0B（黄） | ⏱ |
| running | ●稼働中 | #10B981（緑） | ✓ |
| stopped | ●停止中 | #6B7280（グレー） | ⏸ |
| error | ●エラー | #EF4444（赤） | ⚠ |

#### ポーリング仕様
- 初回表示時に `openclaw_instances` テーブルから取得
- その後30秒ごとにポーリング（Twin Infoタブがアクティブ（フォアグラウンド）の場合のみ）
- タブ切替・バックグラウンド移行時はポーリング停止（バッテリー最適化）
- Edge Function `health-check-openclaw` 呼び出し（ステータス確認）

#### 「詳細設定」リンク
- タップ → `app/(tabs)/settings.tsx` の OpenClawインスタンス管理セクションに遷移
- リンクテキスト: 「詳細設定」
- ステータスが `error` の場合、サブテキスト「（再起動が必要です）」表示

#### Freeユーザー
- このセクション全体を非表示

#### エッジケース
| ケース | 表示内容 |
|--------|---------|
| インスタンス未作成（Pro） | 「インスタンス未作成」グレーバッジ |
| ステータス取得エラー | 最後の既知ステータスをキャッシュ表示 + 「更新に失敗しました」注記（小さいテキスト） |
| ポーリングタイムアウト | エラー注記表示、次回ポーリングで再試行 |

---

## インタラクション

| アクション | 動作 | アニメーション |
|-----------|------|------------|
| 気分絵文字タップ | 当日の気分を記録/上書き | scale(1.1) + 背景フェードイン (200ms) |
| MBTI設定リンクタップ | 設定画面のMBTI選択セクションに遷移 | push transition (300ms) |
| 性格診断やり直しタップ | 確認ダイアログ表示 | ダイアログスライドアップ (300ms) |
| 詳細設定リンクタップ | 設定画面に遷移 | fade out → fade in (300ms) |
| プルダウンリフレッシュ | 全データ再取得 | 標準RefreshControl |
| Big Fiveバー描画 | 0%から実スコアまで | spring animation (800ms, stagger 100ms) |
| ステータスバッジ更新 | 色とテキストのフェード切替 | fade (200ms) |

---

## アクセシビリティ

| 要素 | accessibilityLabel | accessibilityRole | accessibilityHint |
|------|-------------------|-------------------|-------------------|
| 気分絵文字 | "とても良い" / "良い" / "普通" / "悪い" / "とても悪い" | button | "タップして今日の気分を記録します" |
| Big Fiveバー | "開放性、スコア80" | progressbar | — |
| MBTI表示 | "MBTI: INTJ" / "MBTIを設定する" | text / button | 未設定時: "タップして設定画面でMBTIを選択" |
| 性格診断やり直し | "性格診断をやり直す" | button | "タップして性格診断画面に移動します" |
| 詳細設定リンク | "詳細設定" | button | "タップして設定画面に移動します" |
| ステータスバッジ | "インスタンス稼働中" | text | — |
| アップグレードボタン | "Proにアップグレード" | button | "課金画面に移動します" |

---

## Free / Pro 差分

| 項目 | Free | Pro |
|------|------|-----|
| 性格プロフィール | 表示 | 表示 |
| 今日の気分 | 表示 | 表示 |
| 週次気分グラフ | 表示 | 表示 |
| SOUL.mdサマリー | ぼかし + アップグレードプロンプト | 表示 |
| OpenClawステータス | 非表示 | 表示 + 30秒ポーリング |
| 性格診断やり直し | 可能（ただしSOUL.md更新なし） | 可能（SOUL.md自動更新） |

---

## デザインノート

### ビジュアル方針
- **データの可視化**: Big Fiveグラフと週次気分グラフで「自分とAIツインの成長」を視覚化
- **統合ビュー**: 性格・気分・AIツイン性格・インスタンス状態を1画面に統合
- **Pro価値の明示**: SOUL.mdとOpenClawステータスをPro限定で表示、Free体験との差別化

### カラーパレット
- **Primary**: #6C63FF — Big Fiveバー、リンク、アクション
- **Secondary**: #4ECDC4 — Big Fiveバー（交互配色）
- **気分カラー**: great=#10B981, good=#4ECDC4, neutral=#6B7280, bad=#F59E0B, terrible=#EF4444
- **ステータスカラー**: provisioning=#F59E0B, running=#10B981, stopped=#6B7280, error=#EF4444

### Revenue First 判断
- **SOUL.mdのぼかし表示** → Freeユーザーに「何があるか」を示唆、課金欲求喚起
- **OpenClawステータスをPro限定** → インフラコストに見合う価値提供
- **気分トラッキングは無料** → 全ユーザーに価値を提供、解約防止

### プログレッシブ・ディスクロージャ
1. **第1階層**: ツイン名 + Big Fiveグラフ（即座に理解できる）
2. **第2階層**: 気分トラッキング（日々の記録）
3. **第3階層**: 週次グラフ（パターン発見）
4. **第4階層**: SOUL.mdサマリー（Pro、詳細理解）
5. **第5階層**: OpenClawステータス（Pro、技術的詳細）

### エッジケース対応
| ケース | 視覚表現 |
|--------|---------|
| 診断未実施 | オンボーディング画面にリダイレクト（画面表示前） |
| 気分未記録（7日間） | 空状態「気分を記録してみよう」 + イラスト |
| SOUL.md未生成 | 「AIツインをセットアップ中...」 + スピナー |
| インスタンスエラー | 赤色バッジ + 「詳細設定（再起動が必要です）」 |
| 長文サマリー（500文字超） | 最大10行 + スクロール可能 |
| ステータス取得エラー | 最後の既知ステータス + 小さい注記「更新に失敗しました」 |

### アニメーション方針
- **Big Fiveバー**: 0%から実スコアまで spring animation (800ms)、各バーを100msずつ遅延（stagger）
- **気分絵文字選択**: scale(1.1) + 背景フェードイン (200ms)
- **ステータスバッジ更新**: 色とテキストのフェード切替 (200ms)
- **プルダウンリフレッシュ**: 標準RefreshControl
- **セクション出現**: 上から順に fade-in (stagger 50ms)

### パフォーマンス考慮
- Big Fiveグラフはメモ化（`useMemo`）、スコア変更時のみ再描画
- 気分記録はデバウンス（500ms）、連続タップでも最後の選択のみ保存
- ステータスポーリングはタブアクティブ時のみ（バックグラウンド時は停止）
- 週次グラフはキャッシュ（5分TTL）

### 実装ノート（React Native固有）
```tsx
// Big Five棒グラフ
const BigFiveBar = ({ trait, score }: { trait: string; score: number }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: score,
      useNativeDriver: false,
      stiffness: 100,
      damping: 15,
    }).start();
  }, [score]);

  return (
    <View style={styles.barContainer}>
      <Text style={styles.traitLabel}>{trait}</Text>
      <Animated.View
        style={[
          styles.bar,
          { width: animatedValue.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) },
        ]}
      />
      <Text style={styles.scoreText}>{score}</Text>
    </View>
  );
};

// 気分絵文字選択
const MoodEmoji = ({ value, selected, onPress }: MoodEmojiProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onPress(value);
  };

  return (
    <Pressable onPress={handlePress} style={[styles.moodButton, selected && styles.moodButtonSelected]}>
      <Animated.Text style={[styles.moodEmoji, { transform: [{ scale }] }]}>
        {getMoodEmoji(value)}
      </Animated.Text>
    </Pressable>
  );
};

// ステータスポーリング（タブアクティブ時のみ）
const useInstanceStatusPolling = (isPro: boolean, isTabActive: boolean) => {
  const [status, setStatus] = useState<InstanceStatus | null>(null);

  useEffect(() => {
    if (!isPro || !isTabActive) return;

    const fetchStatus = async () => {
      const { data } = await supabase
        .from('openclaw_instances')
        .select('status')
        .eq('user_id', auth.uid())
        .single();
      if (data) setStatus(data.status);
    };

    fetchStatus(); // 初回取得
    const interval = setInterval(fetchStatus, 30000); // 30秒ごと

    return () => clearInterval(interval);
  }, [isPro, isTabActive]);

  return status;
};

// プルダウンリフレッシュ
<ScrollView
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
  }
>
  {/* セクション */}
</ScrollView>
```

### データフロー
```
初回表示:
  ┌─→ personality_results (Big Five)
  ├─→ mood_records (当日 + 直近7日)
  ├─→ profiles (twin_name, mbti_type)
  └─→ openclaw_instances (status) ※Pro

気分記録:
  絵文字タップ → Zustand store更新（楽観的UI）
              → Supabase upsert (mood_records)
              → 成功: 週次グラフ更新
              → 失敗: store巻き戻し + エラートースト

性格診断やり直し:
  リンクタップ → 確認ダイアログ
             → 「はい」→ オンボーディング遷移
             → 診断完了 → personality_results 新規レコード
             → Pro: Edge Function update-soul-md 呼び出し
             → Twin Infoタブに戻る → Big Fiveグラフ更新

ステータスポーリング (Pro):
  30秒ごと (タブアクティブ時のみ)
  → Edge Function health-check-openclaw
  → ステータスバッジ更新
```

---

## 変更履歴

| 日付 | 変更内容 | 理由 | 関連タスク |
|------|---------|------|-----------|
| 2026-02-15 | 新規作成 | ツイン情報画面仕様書作成 | -- |
| 2026-02-15 | セクション2にMBTI表示追加（設定済み: タイプ名表示、未設定: 設定画面リンク）| MBTI入力要件 | T23 |
