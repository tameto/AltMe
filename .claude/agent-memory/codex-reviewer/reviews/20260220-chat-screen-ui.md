# Code Review: 20260220-chat-screen-ui

Date: 2026-02-20
Reviewer: Claude (code-reviewer)
Branch: 20260220-chat-screen-ui
Base: main
Scope: Chat screen UI redesign — topic chips, date separators, AI labels, translate link, remaining counter, header redesign

## Files Reviewed

- app/(tabs)/index.tsx (−204/+187 lines)
- src/features/chat/hooks/use-chat.ts (+42)
- src/features/chat/hooks/use-topics.ts (new)
- src/features/chat/components/chat-bubble.tsx (new)
- src/features/chat/components/chat-header.tsx (new)
- src/features/chat/components/date-separator.tsx (new)
- src/features/chat/components/topic-chips-row.tsx (new)
- src/features/chat/components/remaining-counter.tsx (new)
- src/shared/types/chat.ts (+11)
- src/config/constants.ts (+7)
- src/shared/i18n/locales/ja.json + en.json (+12 each)
- supabase/functions/chat/index.ts (+5)
- supabase/migrations/20260220000007_chat_topics_integration.sql (new)

---

## Critical（必ず修正）

### C1: displayItems の useMemo が displayData に依存しているが displayData は毎レンダーで再生成される

**ファイル**: `src/features/chat/hooks/use-chat.ts` 行 418-449

displayData はフックボディ内でインライン生成されている（useMemo なし）。
そのため streamingText が変化するたびに displayData の参照が変わり、
displayItems の useMemo が毎回再実行される。ストリーミング中はこれが高頻度で起きる。

```ts
// 現在（行 418-425）: 毎レンダーで新しい参照
const displayData: DisplayMessage[] = streamingText
  ? [...messages, { id: 'streaming', ... }]
  : messages;

// displayItems の useMemo はこれに依存
const displayItems = useMemo(() => { ... }, [displayData]);
// → streamingText が 1文字変わるたびにフル再計算
```

修正: displayData も useMemo でメモ化する。

```ts
const displayData = useMemo<DisplayMessage[]>(() => {
  if (!streamingText) return messages;
  return [...messages, {
    id: 'streaming',
    role: 'assistant',
    content: streamingText,
    createdAt: new Date().toISOString(),
  }];
}, [messages, streamingText]);
```

---

### C2: date-separator の id 衝突 — 同日に複数のトピック切替で重複 key

**ファイル**: `src/features/chat/hooks/use-chat.ts` 行 437-440

date-separator の id は `date-${dateStr}` 形式（例: `date-2026-02-20`）。
しかしトピックが変わると messages が入れ替わるのに、同日付の separator id は変わらない。
React の FlatList は keyExtractor の安定性を前提とするため問題は軽微だが、
より根本的な問題として、**streamingText が変化するたびに streaming メッセージの
`createdAt: new Date().toISOString()` が更新される**ため、UTC+9 環境で日付跨ぎ時刻に
streaming が起きると、一度生成された separator のあとに別の separator が挿入される可能性がある。

修正案: streaming メッセージの createdAt を固定する。

```ts
// sendViaEdgeFunction / sendViaWebSocket でストリーミング開始時に
// タイムスタンプを固定してから使う
const streamingStartTime = useRef<string>('');

// handleSend 内:
streamingStartTime.current = new Date().toISOString();

// displayData 構築時:
{ id: 'streaming', role: 'assistant', content: streamingText,
  createdAt: streamingStartTime.current }
```

---

## Warning（修正推奨）

### W1: useTopics の AsyncStorage 読み取りと Supabase 読み取りが競合状態を持つ

**ファイル**: `src/features/chat/hooks/use-topics.ts` 行 32-68

2つの useEffect が独立して走る:
1. AsyncStorage から activeTopic を復元（非同期）
2. Supabase から topics リストを取得（非同期）

user が undefined の場合、effect 2 は即座に setIsLoading(false) で終了するが、
後で user が設定されても effect は再実行されない（依存配列が [user?.id] のみ）。
user が undefined → defined に変化するシナリオ（ゲストログイン後の認証完了）では
topics が DEFAULT_TOPICS のままになる。

また AsyncStorage 読み取りの Promise に対して catch がない（.then のみ）。
読み取りエラー時にサイレント失敗する。

修正:
```ts
AsyncStorage.getItem(ACTIVE_TOPIC_KEY)
  .then((stored) => {
    if (stored && ['daily', 'work', 'reflection', 'consultation'].includes(stored)) {
      setActiveTopicState(stored as ChatTopicKey);
    }
  })
  .catch(() => {/* ignore - use default */});
```

### W2: RemainingCounter が KeyboardAvoidingView の内側にある

**ファイル**: `app/(tabs)/index.tsx` 行 190-196

```tsx
<KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={90}>
  <View style={styles.inputContainer}>...</View>
  {!isPro ? <RemainingCounter ... /> : null}  {/* ← ここ */}
</KeyboardAvoidingView>
```

RemainingCounter は入力欄の下に表示される想定だが、
KeyboardAvoidingView の内側に入っているため、キーボード表示時に
カウンターごと押し上げられ、入力欄と一緒に浮いた状態になる。
カウンターはキーボードとは無関係に固定位置に置くか、
SafeAreaView 内・KeyboardAvoidingView 外に移動させるべき。

修正:
```tsx
<KeyboardAvoidingView ...>
  <View style={styles.inputContainer}>...</View>
</KeyboardAvoidingView>
{!isPro ? (
  <RemainingCounter
    remaining={Math.max(0, FREE_DAILY_LIMIT - todayUserCount)}
    total={FREE_DAILY_LIMIT}
  />
) : null}
```

### W3: date-separator の日付フォーマットがハードコードされた 'ja-JP' ロケール

**ファイル**: `src/features/chat/components/date-separator.tsx` 行 10-17

```ts
const formatted = new Intl.DateTimeFormat('ja-JP', { ... }).format(new Date(date));
```

i18n 対応アプリで UI ロケールを無視して 'ja-JP' 固定にしている。
英語ユーザーには「2月15日（土）」と表示される。
useTranslation の i18n.language を参照するか、
日付フォーマット文字列を i18n キーとして管理すべき。

簡易修正:
```ts
import { useTranslation } from 'react-i18next';
const { i18n } = useTranslation();
const formatted = new Intl.DateTimeFormat(i18n.language, { ... }).format(new Date(date));
```

### W4: migration の handle_new_profile が前バージョンと整合しているか不明確

**ファイル**: `supabase/migrations/20260220000007_chat_topics_integration.sql` 行 24-36

CREATE OR REPLACE で関数を上書きしているが、前バージョン（20260215000002 で定義）と
全く同じ subscriptions + credits INSERT を含んでいる。
将来の migration でこの関数をまた上書きする際に、
chat_topics INSERT を含めなければならないことをコメントで明示すべき。

また、既存ユーザーへのバックフィル（step 4）は
`profiles` テーブルを全件スキャンしており、ユーザー数が増えると遅い。
バッチ処理やインデックスを活用する方式を検討すること
（現状の WHERE NOT EXISTS は許容範囲内だが、規模によっては問題になる）。

### W5: topic_id のバリデーションが Edge Function 側で行われていない

**ファイル**: `supabase/functions/chat/index.ts` 行 27-28

```ts
const topicId = typeof topic_id === 'string' ? topic_id : 'daily';
```

型チェックのみで、値が有効なトピックキーかチェックしていない。
悪意あるクライアントが任意の文字列を topic_id として送信できる。
DB 側には topic_id TEXT（制約なし）なので、不正な値がそのまま保存される。

修正:
```ts
const VALID_TOPIC_IDS = ['daily', 'work', 'reflection', 'consultation'] as const;
const topicId = VALID_TOPIC_IDS.includes(topic_id) ? topic_id : 'daily';
```

---

## Info（検討事項）

### I1: TopicChipsRow が ScrollView を使っているが accessibilityRole がない

`Pressable` の `accessibilityRole="button"` と `accessibilityLabel` がない。
各チップにラベルを付けることでスクリーンリーダー対応になる。

### I2: useTopics の isLoading を ChatScreen が使っていない

`useTopics` は `isLoading` を返しているが `index.tsx` では destructure していない。
トピック読み込み中は TopicChipsRow が DEFAULT_TOPICS をそのまま表示してしまう（問題は軽微）。

### I3: ChatBubble の id prop (_id) が使われていない

```ts
export function ChatBubble({ id: _id, ... })
```

`id` はコンポーネント内部で未使用。FlatList の keyExtractor は親側で処理しているので
prop 自体を削除できる。

### I4: todayUserCount のカウントがトピックをまたいだ合計

`use-chat.ts` 行 129-135 の todayUserCount クエリに `.eq('topic_id', activeTopic)` がない。
つまり全トピックの合計メッセージ数で制限判定している。
仕様書（specs/features/chat.md）と照合して、制限がトピック横断か、
トピック個別かを確認すること。

---

## 統計

- 総指摘数: 10件（検証済み）
- Critical: 2件
- Warning: 5件
- Info: 3件
- TypeScript: エラーなし（npx tsc --noEmit 通過）
