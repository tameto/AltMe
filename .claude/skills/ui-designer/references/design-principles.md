# デザイン原則詳細 (mae616/design-skills ベース)

> このファイルは5つのデザインスキルの横断的な原則の概要です。
> 各スキルの完全な内容は個別ファイルを参照してください:
>
> - [UI Designer](./ui-design.md) -- 情報設計、ビジュアルヒエラルキー、レイアウト
> - [Frontend Implementation](./frontend-implementation.md) -- デザイン→コード変換、コンポーネント実装
> - [Creative Coder](./creative-coding.md) -- アニメーション、モーション、インタラクション
> - [Accessibility Engineer](./accessibility.md) -- WCAG準拠、スクリーンリーダー対応、a11y
> - [Usability Psychologist](./usability-psychology.md) -- 認知負荷、エラー予防、UXリサーチ

## 4つの普遍的原則

### 1. アドホックよりシステマティック
個別解決ではなく、トークン・コンポーネント・パターンで統一する。

- 色は必ずカラーパレットから選ぶ
- フォントサイズはタイポグラフィスケールから選ぶ
- スペーシングは 4px 刻みのスケールを使う
- 同じ目的のUIは同じコンポーネントを再利用する

### 2. 状態は仕様
Loading / Error / Empty / Disabled は後付けではなく、設計段階で定義する。

**各画面に必須の状態定義:**
```
Default:     通常表示
Loading:     スケルトン or スピナー
Empty:       「まだデータがありません」+ CTA
Error:       エラーメッセージ + リトライボタン
Disabled:    操作不可（条件未達時）
No-Auth:     ログイン必要時の表示
```

### 3. アクセシビリティはデフォルト
実装のどの段階でもアクセシビリティは後付けではなく組み込む。

**最低限のチェック:**
- 主要操作がキーボード/VoiceOverで完了可能
- 可視フォーカス
- 十分なコントラスト（4.5:1以上）
- フォームにラベルとエラー説明
- 画像にalt

### 4. ピクセルより意図
デザインの目的を理解してからコードに変換する。

**変換プロセス:**
1. 意図を読む（目的、視覚的フロー、強調、階層）
2. 実装に変換（px → スケール、font-size → ロール、margin → レイアウト構造）
3. 揃え判断（揃えるべき場所 vs 崩すべき場所）
4. 幅配分/ウェイトを保持

## モバイル固有ガイドライン

### タップターゲット
- 最小 44x44pt（Apple HIG）
- 隣接するタップターゲット間に最低 8pt の間隔

### プログレッシブ・ディスクロージャ
- 一画面に詰め込みすぎない
- 段階的に情報を開示
- AltMe のオンボーディング: 1画面1質問

### 認知負荷の管理
- 選択肢は最大5つ（マジカルナンバー7±2）
- 関連する情報をグループ化
- 視覚的ヒエラルキーで重要度を表現
- アフォーダンスを明確に（ボタンはボタンに見えるように）

### モーションデザイン
- 200-300ms が快適なトランジション時間
- イージング: ease-out（画面に入る時）、ease-in（画面から出る時）
- スプリングアニメーション: 自然な物理感
- 目的のないアニメーションは削除

## コンポーネント設計パターン

### Compound Component パターン
```tsx
// Good: 複合コンポーネント
<Card>
  <CardHeader>
    <CardTitle>タイトル</CardTitle>
  </CardHeader>
  <CardContent>
    <Text>内容</Text>
  </CardContent>
  <CardFooter>
    <Button><ButtonText>アクション</ButtonText></Button>
  </CardFooter>
</Card>

// Bad: props 詰め込み
<Card
  title="タイトル"
  content="内容"
  buttonText="アクション"
  onPress={handlePress}
/>
```

### 状態マシンパターン
```tsx
type ScreenState = 'loading' | 'empty' | 'data' | 'error';

const ChatScreen = () => {
  const [state, setState] = useState<ScreenState>('loading');

  switch (state) {
    case 'loading': return <ChatSkeleton />;
    case 'empty': return <EmptyChat onStart={handleStart} />;
    case 'error': return <ErrorView onRetry={handleRetry} />;
    case 'data': return <ChatList messages={messages} />;
  }
};
```
