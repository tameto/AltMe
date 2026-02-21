# Codex Review 結果: chat-media-attach

## レビュー設定
- モデル: gpt-5.3-codex
- 方式: codex exec review --base main + codex exec (focus x3)
- 対象: 42 files, +5889/-100 lines
- ブランチ: 20260220-chat-media-attach
- 日時: 2026-02-20

---

## Critical（必ず修正）

### [C-1] 送信後に添付ファイルを自己削除してしまう
**ファイル**: `app/(tabs)/index.tsx:148-149`

`handleSendAll()` が送信後に `mediaPicker.clearAllUploads()` を呼び出しているが、
`clearAllUploads()` はcompleted状態の全Storageオブジェクトを `deleteMedia()` で削除する。
これにより、送信済みメッセージに紐づくファイルが即座に削除され、添付URLが無効化される。

**修正案**:
```ts
// use-media-picker.ts に送信後用のリセット関数を追加
const resetUploads = useCallback(() => {
  setStoragePaths({});
  setUploads([]);
}, []);

// app/(tabs)/index.tsx
await handleSendWithMedia(completedAttachments);
mediaPicker.resetUploads(); // 削除せずstateのみクリア
// clearAllUploads はキャンセル時のみ使用
```

### [C-2] WebSocket経路で添付ファイルが永続化されない（Pro ユーザー影響）
**ファイル**: `src/features/chat/hooks/use-chat.ts:279-287`

`sendViaWebSocket()` は `_attachments` 引数を受け取るが完全に未使用。
`client.sendMessage(text)` でテキストのみ送信。
Pro(WebSocket)モード時、添付情報がSupabase `chat_attachments` テーブルに保存されず、
AIコンテキストにも渡らない。リロード後に添付が消える。

**修正案（暫定）**:
```ts
// use-chat.ts sendViaWebSocket 内
if (attachments && attachments.length > 0) {
  // WebSocket は添付非対応のため Edge Function にフォールバック
  return false;
}
```

**修正案（本命）**:
- `WsOutgoingMessage` 型に `metadata.attachments` を追加
- `OpenClawWebSocketClient.sendMessage` を拡張
- サーバー側で `chat_attachments` 保存を担当

### [C-3] Edge Function が添付のみ（テキストなし）送信を拒否する
**ファイル**: `supabase/functions/chat/index.ts:30-34`

クライアント側 `handleSendWithMedia` は `text` が空でも `attachments.length > 0` なら送信可能だが、
Edge Function は `!message || typeof message !== 'string'` で空文字を拒否する。
添付のみ送信すると `message_required` エラーが返る。

**修正案**:
```ts
// Edge Function
const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
if (!hasAttachments && (!message || typeof message !== 'string')) {
  return error400('message_required');
}
const text = message ?? '';
// 以降 text を使用（空文字許容）
```

### [C-4] privateバケットで getPublicUrl を使用（URL無効化リスク）
**ファイル**: `src/features/chat/services/media-upload.ts:85-89`, `supabase/migrations/20260220000006_chat_attachments.sql:44`

`chat-media` バケットは `public: false` で作成されているが、
`getPublicUrl()` でURLを取得して `chat_attachments.url` に保存している。
private bucket の public URL は認証なしでアクセスできないため、
実装としては機能しない（画像が表示されない、ファイルが開けない）。

**修正案**:
```ts
// media-upload.ts
// uploadMedia の戻り値を url ではなく storagePath に変更
return { storagePath: data.path };

// 表示時は短TTL署名URL生成（例: 5分）
const { data } = await supabase.storage
  .from('chat-media')
  .createSignedUrl(storagePath, 60 * 5);
```

---

## Important（修正推奨）

### [I-1] stopRecording 後に recordingUri=null のまま state='preview' になる経路
**ファイル**: `src/features/chat/hooks/use-audio-recorder.ts:113-119`

`stopRecording()` は `uri` が null の場合でも必ず `setState('preview')` に遷移する。
recording開始直後に即停止した場合など、`recordingUri=null` のまま preview UIが表示される。
その後 `sendRecording()` を呼んでも null チェックで `return null` になり、
送信ボタンが応答しないUX障害が発生する。

**修正案**:
```ts
const stopRecording = useCallback(async (): Promise<void> => {
  const uri = await stopRecordingInternal();
  if (!uri) {
    setState('idle'); // nullのときはidle に戻す
    return;
  }
  setRecordingUri(uri);
  setState('preview');
}, [stopRecordingInternal]);
```

### [I-2] AudioRecorderUI に録音前の状態が渡らない（UI不整合）
**ファイル**: `app/(tabs)/index.tsx:298`

```tsx
state={audioRecorder.state === 'idle' || audioRecorder.state === 'paused' ? 'recording' : audioRecorder.state}
```

`audioRecorder.state === 'idle'` を `'recording'` に変換しているため、
`isRecording=true` で表示された際に録音未開始でも停止/キャンセルボタンが表示される。
`AudioRecorderUI` の `state` 型は `'idle' | 'recording' | 'preview'` を受け取るため、
`idle` をそのまま渡す方が正しい（または `AudioRecorderUI` に `onStart` を表示する idle 状態を追加）。

### [I-3] Edge Function の attachments 入力検証不足
**ファイル**: `supabase/functions/chat/index.ts:116-138`

`attachments` 配列の `type/url/fileName/fileSize/mimeType` がサーバー側で全く検証されない。
クライアント改ざんにより任意のデータをDBに保存可能。特に URL フィールドに外部ドメインや
危険なスキーム（`javascript:` 等）を混入できる。

**修正案**:
```ts
const VALID_TYPES = new Set(['image', 'video', 'audio', 'file']);
const SUPABASE_STORAGE_PREFIX = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/`;

function validateAttachment(a: unknown): boolean {
  if (!a || typeof a !== 'object') return false;
  const att = a as Record<string, unknown>;
  if (!VALID_TYPES.has(att.type as string)) return false;
  if (typeof att.url !== 'string' || !att.url.startsWith(SUPABASE_STORAGE_PREFIX)) return false;
  if (typeof att.fileName !== 'string' || att.fileName.length > 255) return false;
  if (typeof att.fileSize !== 'number' || att.fileSize <= 0) return false;
  return true;
}
// attachments 処理前に全件検証
```

### [I-4] validateFile が fileSize=0 を通過してしまう
**ファイル**: `src/features/chat/services/media-upload.ts:29-41`

`fileSize > maxSize` のチェックのみで、0バイトを許可している。
`app/(tabs)/index.tsx:105` でrecentAssetの fileSize を `0` にハードコードしており、
音声録音でも `use-audio-recorder.ts:152` で `const fileSize = 0` としているため、
ファイルサイズ検証が完全に無効化されている。

**修正案**:
```ts
// media-upload.ts
if (!Number.isFinite(file.fileSize) || file.fileSize <= 0) {
  return { valid: false, error: 'invalidFileSize' };
}

// 録音後のサイズ取得
import * as FileSystem from 'expo-file-system';
const info = await FileSystem.getInfoAsync(recordingUri, { size: true });
const fileSize = info.exists ? (info.size ?? 0) : 0;

// recent asset のサイズ取得
const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
const fileSize = assetInfo.fileSize ?? 0;
```

### [I-5] 複数の AudioAttachment が同時再生できてしまう
**ファイル**: `src/features/chat/components/message-media.tsx:123-186`

各 `AudioAttachment` コンポーネントが独立した `soundRef` を持ち、
再生開始時に他インスタンスを停止する仕組みがない。
複数の音声メッセージが存在する会話では同時再生が発生する。

**修正案**: モジュールスコープのグローバル再生コントローラを導入。
```ts
// message-media.tsx (module scope)
let _activeSound: Audio.Sound | null = null;
let _activeOwner: string | null = null;

async function stopGlobalActiveSound() {
  const s = _activeSound;
  _activeSound = null;
  _activeOwner = null;
  if (!s) return;
  await s.stopAsync().catch(() => {});
  await s.unloadAsync().catch(() => {});
}
```

### [I-6] アンマウント中の並列アップロード完了で setState が走る
**ファイル**: `src/features/chat/hooks/use-media-picker.ts:74-108`

`uploadAsset()` の非同期完了後に常に `setUploads/setStoragePaths` を更新する。
コンポーネントアンマウント後や `clearAllUploads/removeUpload` 呼び出し後に
遅延完了した場合、state競合・孤児ファイルが Storageに残る問題が発生する。

**修正案**:
```ts
const isMountedRef = useRef(true);
const cancelledIdsRef = useRef(new Set<string>());
useEffect(() => () => { isMountedRef.current = false; }, []);
// uploadAsset 内の setState 前に確認
if (!isMountedRef.current || cancelledIdsRef.current.has(id)) {
  // 成功していれば孤児ファイルを削除
  deleteMedia(result.storagePath).catch(() => {});
  return;
}
// removeUpload/clearAllUploads で cancelledIdsRef.current.add(id)
```

---

## Minor（検討事項）

### [M-1] stopPreview() が Audio.Sound を unload していない
**ファイル**: `src/features/chat/hooks/use-audio-recorder.ts:223-229`

`stopPreview()` は `sound.stopAsync()` のみで `unloadAsync()` せず、`soundRef` も null化しない。
また `sendRecording()` が再生中の Sound を停止せずアップロードに進む。

```ts
const stopPreview = useCallback(async (): Promise<void> => {
  const sound = soundRef.current;
  soundRef.current = null; // null-first
  if (sound) {
    await sound.stopAsync().catch(() => {});
    await sound.unloadAsync().catch(() => {});
  }
  setIsPlaying(false);
}, []);
```

### [M-2] loadHistory の添付紐付けが O(n*m)
**ファイル**: `src/features/chat/hooks/use-chat.ts:106-128`

`data.reverse().map()` 内で毎回 `attachmentsData?.filter()` を実行（O(n*m)）。
メッセージ数が増えると遅くなる。

```ts
const grouped = new Map<string, ChatAttachment[]>();
for (const a of attachmentsData ?? []) {
  const list = grouped.get(a.message_id) ?? [];
  list.push(/* 変換処理 */);
  grouped.set(a.message_id, list);
}
const mapped = data.reverse().map((m) => ({
  ...m,
  attachments: grouped.get(m.id),
}));
```

### [M-3] AttachmentPanel の FlatList に getItemLayout がない
**ファイル**: `src/features/chat/components/attachment-panel.tsx:84-91`

固定サイズ（72px）の横スクロールリストだが `getItemLayout` がない。
小さなリストなので致命的ではないが、追加コストが低い最適化。

```ts
const ITEM_SPAN = THUMBNAIL_SIZE + spacing.sm; // spacing.sm = 8px
const getItemLayout = (_: unknown, index: number) => ({
  length: THUMBNAIL_SIZE,
  offset: ITEM_SPAN * index,
  index,
});
```

---

## アーキテクチャ評価

### 全体品質: ★★★☆☆（3/5）

**良い点**:
- expo-av の null-first パターンは `use-audio-recorder.ts` の Recording 側で正しく実装されている
- RLS ポリシー（`chat_attachments` / `storage.objects`）は適切に設計されている
- hooks 間の責務分離（use-audio-recorder / use-media-picker / use-chat）は明確
- テストカバレッジが充実している（546行のaudioテスト、585行のpickerテスト）

**問題点**:
- **[C-1][C-4]** という2つのCriticalバグが「送信→即削除」「URLが機能しない」の組み合わせで、
  メディア添付機能がほぼ動作しない状態
- **[C-2]** WebSocket（Pro）経路での添付が完全に機能しない
- **[C-3]** 添付のみ送信が Edge Function で拒否される
- private bucket + publicUrl という設計矛盾は早期に signed URL アーキテクチャに移行推奨

### マージ判定: 要修正（Critical 4件を解消後にマージ可）

---

## 除外した指摘（hallucination/誤検出）

- なし（全指摘をコード読んで検証済み）

---

## 統計
- 総指摘数: 13件（検証済み）
- Critical: 4件
- Important: 6件
- Minor: 3件
- 除外: 0件
