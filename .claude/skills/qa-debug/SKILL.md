---
name: qa-debug
description: |
  QA・デバッグの専門サブエージェント。
  React Native バグ検出、パフォーマンス分析、テスト設計、ログ解析、E2Eテスト実行を担当。
  React hooks アンチパターン検出、Agent Teams 統合後のクロスバウンダリバグ検出に特化。
  トリガー: バグ, デバッグ, テスト, パフォーマンス, ログ解析, E2E, QA, クラッシュ
---

# QA/Debug Sub-Agent

QA・デバッグの専門サブエージェント。
React Native / Expo アプリのバグ検出からE2Eテストまで、品質保証の全工程を担当。

## コア能力

### 1. React Hooks アンチパターン検出
### 2. パフォーマンスプロファイリング
### 3. クロスバウンダリバグ検出（Agent Teams 統合後）
### 4. ログ解析・エラー分類
### 5. テスト設計・実行
### 6. iOS シミュレータ検証

## 1. React Hooks アンチパターン検出

### useEffect 無限ループ

**パターン A: state を deps に入れつつ effect 内で更新**
```tsx
// BUG: 無限ループ
const [count, setCount] = useState(0);
useEffect(() => {
  setCount(count + 1); // count が変わる → effect 再実行 → 無限
}, [count]);

// FIX: useRef で安定化
const countRef = useRef(0);
useEffect(() => {
  countRef.current += 1;
}, []);
```

**パターン B: オブジェクト/配列の deps**
```tsx
// BUG: 毎レンダーで新オブジェクト → effect 再実行
useEffect(() => { ... }, [{ key: value }]);

// FIX: プリミティブ値を deps に
useEffect(() => { ... }, [value]);
```

**パターン C: useCallback の deps に state 配列**
```tsx
// BUG: messages が変わるたびに新しい関数 → 依存する effect も再実行
const send = useCallback(() => {
  setMessages([...messages, newMsg]);
}, [messages]);

// FIX: prev パターン
const send = useCallback(() => {
  setMessages(prev => [...prev, newMsg]);
}, []);
```

### メモリリーク

```tsx
// BUG: コンポーネントアンマウント後に state 更新
useEffect(() => {
  fetchData().then(data => setData(data)); // アンマウント後も実行される
}, []);

// FIX: クリーンアップ
useEffect(() => {
  let mounted = true;
  fetchData().then(data => {
    if (mounted) setData(data);
  });
  return () => { mounted = false; };
}, []);
```

### Stale Closure

```tsx
// BUG: handler 内で古い state を参照
const [count, setCount] = useState(0);
const handler = useCallback(() => {
  console.log(count); // 常に初回レンダー時の値
}, []);

// FIX: deps に含める or useRef
const handler = useCallback(() => {
  console.log(count);
}, [count]);
```

## 2. パフォーマンスプロファイリング

### チェック項目

```
[ ] 不要な再レンダリングがないか（React DevTools Profiler）
[ ] リストのスクロールが 60fps を維持しているか
[ ] アニメーションが UI スレッドで実行されているか
[ ] メモリ使用量が増加し続けていないか（リーク）
[ ] バンドルサイズが適切か
[ ] 初回ロード時間が 3 秒以内か
```

### React Native パフォーマンス指標

| 指標 | 目標値 | 計測方法 |
|------|--------|---------|
| JS FPS | 60fps | Performance Monitor |
| UI FPS | 60fps | Performance Monitor |
| TTI | < 3s | カスタムマーカー |
| メモリ | < 200MB | Xcode Instruments |
| バンドルサイズ | < 5MB | Metro |
| リスト スクロール | 60fps | 手動テスト |

### 頻出パフォーマンス問題

1. **過剰再レンダリング**: Zustand の購読範囲が広すぎる
   ```tsx
   // BAD: store全体を購読
   const store = useStore();
   // GOOD: 必要な値のみ
   const name = useStore(s => s.user?.name);
   ```

2. **リスト仮想化なし**: ScrollView + .map() の使用
3. **重い画像**: 未圧縮画像のロード
4. **同期処理**: メインスレッドでの重い計算
5. **過剰なアニメーション**: layout property のアニメーション

## 3. クロスバウンダリバグ検出

Agent Teams で並列開発した場合に発生しやすいバグ:

### 型の不整合
```
Agent A が shared/types/user.ts の UserProfile に field を追加
Agent B が古い型定義でコードを書いている
→ ランタイムで undefined アクセス
```

**検出方法**: `npx tsc --noEmit` で型チェック

### import パスの競合
```
Agent A: src/shared/hooks/use-user.ts (新規作成)
Agent B: src/shared/hooks/useUser.ts (同名で別ファイル作成)
→ macOS では case-insensitive なのでインポート解決が曖昧
```

**検出方法**: ファイル名の重複チェック（case-insensitive）

### 状態管理の競合
```
Agent A: useStore.getState().setUser(profile)
Agent B: useStore.getState().setUser(null) // 別のタイミングでリセット
→ 競合条件でユーザーが消える
```

**検出方法**: store の `set()` 呼び出し箇所を全て洗い出し、タイミングを検証

### Supabase マイグレーションの競合
```
Agent A: 20240101_add_mood_column.sql
Agent B: 20240101_add_journal_table.sql
→ タイムスタンプ重複で適用順序が不定
```

**検出方法**: マイグレーションファイル名の一意性チェック

## 4. ログ解析・エラー分類

### エラー重要度分類

| レベル | 基準 | 例 | 対応 |
|--------|------|------|------|
| CRITICAL | アプリクラッシュ | `Text strings must be rendered within a <Text> component` | 即時修正 |
| HIGH | 機能不全 | `Not authenticated` | 24h以内 |
| MEDIUM | 機能劣化 | `Failed to load mood data` | 次スプリント |
| LOW | 表示問題 | `CoreGraphics NaN` | バックログ |
| INFO | 想定内 | `Missing environment variable` | 設定確認 |

### iOS シミュレータログの読み方

```
[React]     → React Native ランタイムログ
[CoreGraphics] → iOS レンダリングエンジン（多くは無害）
[TextInputUI]  → キーボード入力関連（多くは無害）
WARN        → 警告（動作に影響しない場合が多い）
ERROR       → エラー（調査必要）
```

### 頻出エラーパターン

| エラーメッセージ | 原因 | 対処 |
|---------------|------|------|
| `Cannot find native module` | Pod 未インストール | `cd ios && pod install` |
| `invalid input syntax for type uuid` | UUID 形式不正 | 正しい UUID フォーマットに修正 |
| `Not authenticated` | セッション切れ or 未ログイン | Auth フロー確認 |
| `Database error saving new user` | DB トリガー/制約エラー | マイグレーション確認 |
| `window is not defined` | SSR 環境で Web API 使用 | `expo run:ios` を使用 |
| `FunctionsFetchError` | Edge Function 未起動 | `supabase start` 確認 |

## 5. テスト設計

### テストピラミッド（AltMe 向け）

```
        /  E2E  \         ← 課金フロー、オンボーディング全体
       /  統合   \        ← Edge Function + DB、Auth フロー
      /  ユニット  \      ← hooks、utils、store
```

### ユニットテスト対象

```
src/shared/hooks/     → 全 hooks
src/shared/utils/     → 全ユーティリティ
src/features/*/stores/ → 全 store
src/services/*/       → API クライアント（モック使用）
```

### 統合テスト対象

```
supabase/functions/   → Edge Functions（Deno テスト）
マイグレーション      → DB スキーマの整合性
Auth フロー          → サインイン→プロファイル取得→セッション管理
```

### E2E テスト対象

```
オンボーディングフロー:  起動 → 質問5問 → 結果表示 → AI チャット → ペイウォール
課金フロー:            ペイウォール表示 → プラン選択 → 購入 → Entitlement 確認
コアループ:            チャット送信 → AI応答 → 履歴保存 → 再表示
```

## 6. デバッグワークフロー

```
1. エラーログ収集（シミュレータ or Crash Report）
2. エラー分類（CRITICAL/HIGH/MEDIUM/LOW/INFO）
3. 再現手順の確立
4. 原因特定
   a. スタックトレースからファイル・行を特定
   b. 関連する state/props を確認
   c. ネットワークリクエストを確認
   d. DB クエリ結果を確認
5. 修正実装
6. 修正確認（同じ再現手順で発生しないこと）
7. リグレッションテスト（関連機能が壊れていないこと）
```

## 実行コマンド

```bash
# TypeScript 型チェック
npx tsc --noEmit

# テスト実行
npx jest

# テスト（特定ファイル）
npx jest --testPathPattern="auth"

# テスト（カバレッジ）
npx jest --coverage

# iOS ビルド + 実行
npx expo run:ios

# Supabase ローカル起動
supabase start

# npm 脆弱性チェック
npm audit
```
