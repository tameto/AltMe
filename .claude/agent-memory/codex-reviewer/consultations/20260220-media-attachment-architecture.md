# Codex Consultation 結果: メディア添付パネル アーキテクチャ設計

**日時**: 2026-02-20
**モデル**: gpt-5.3-codex
**テーマ**: chat 画面のメディア添付パネル実装設計

---

## Codex の推奨まとめ

### Q1: 状態管理アプローチ → 推奨: C + B の組み合わせ

**推奨**: Zustand chatStore（C案）+ use-media-attachment.ts でラップ（B案）の組み合わせ

- 仕様書の `chatStore.sendMessage(content, attachments?)` シグネチャ（specs/features/chat.md:671）と整合
- 入力欄/添付パネル/送信ロジックの共有状態を一元化できる
- store を薄いドメイン hook でラップしてテスト性を確保

**A案（use-chat.ts 統合）を避ける理由**:
- すでに責務が重い use-chat.ts（現状 435 行）がさらに肥大化
- `attachmentUploadProgress: number` の単一値管理は複数添付時に破綻

### Q2: アップロードタイミング → 推奨: B（選択直後アップロード）

**推奨**: メディア選択直後にアップロード開始

**孤児ファイル対策（必須）**:
- 破棄時に即 `remove` 呼び出し
- `status: 'uploaded_not_sent'` 状態を保持して TTL で定期削除
- 送信成功時に `attached` へ遷移
- アプリクラッシュ対策でサーバー側クリーンアップジョブを必須化

### Q3: 音声録音設計 → 推奨: use-audio-recording.ts 専用 hook

**推奨**: `use-audio-recording.ts` として専用 hook に分離し、`use-media-attachment.ts` が compose する

**expo-av リソースリーク防止の必須 cleanup**:
```typescript
useEffect(() => {
  return () => {
    const rec = recordingRef.current;
    recordingRef.current = null; // 先に null にして二重解放防止
    if (!rec) return;
    void (async () => {
      try { rec.setOnRecordingStatusUpdate(null); } catch {}
      try { await rec.stopAndUnloadAsync(); } catch {}
    })();
  };
}, []);
```

### Q4: ファイルパス設計 → 推奨: A（UUID 先行生成）

**推奨**: クライアントで UUID を事前生成し、アップロード時と chat_messages INSERT 時の両方に同じ UUID を使用

**重要な確認事項**: Supabase Storage には `move` API が存在する（検証済み）
- ただし A 案の方がシンプルで失敗点が少ないため推奨
- B 案（temp パス）は「サーバー側がIDを必ず採番したい」場合のみ

**実装コード例**:
```typescript
// chat-store.ts の draftMessageId 管理
const ensureDraftMessageId = (get: () => ChatState, set: (v: Partial<ChatState>) => void) => {
  const existing = get().draftMessageId;
  if (existing) return existing;
  const id = crypto.randomUUID();
  set({ draftMessageId: id });
  return id;
};

// アップロード時
const messageId = ensureDraftMessageId(get, set);
const storagePath = `${userId}/${messageId}/${pending.id}-${pending.fileName}`;
await supabase.storage.from('chat-media').upload(storagePath, arrayBuffer, {
  contentType: pending.mimeType,
  upsert: false,
});
```

### Q5: WebSocket 添付連携 → 推奨: a（attachments フィールド追加）

**推奨**: `WsMessagePayloadV2` に `metadata.attachments` フィールドを追加

```typescript
type WsMessagePayloadV2 = {
  type: 'message';
  sessionId: string;
  content: string;
  metadata?: {
    clientMessageId: string;
    attachments?: ChatAttachment[];
  };
};
```

- 将来のツール連携・モデレーション・監査に拡張しやすい
- capability negotiation を導入し、未対応 Gateway では一時フォールバック

---

## アンチパターン（実装時に避けるべき点）

1. `attachmentUploadProgress: number` の単一値管理（複数添付時に破綻）→ 添付ごとの `progress: number` を持つ
2. URL だけで孤児判定しない → `storage_path` を保存して削除対象を厳密化
3. 添付 URL を本文文字列に埋め込まない（`content` フィールドに URL を混在させない）
4. 録音インスタンスを複数同時作成しない
5. `stopAndUnloadAsync()` を unmount/discard で呼ばない実装は避ける
6. WebSocket と Edge Function で添付フォーマットを別仕様にしない（同じ `ChatAttachment` 型を使う）
7. 送信時に `status: 'uploading'` の添付が残っているのに送信開始するレース条件

---

## PendingAttachment 型定義

```typescript
type PendingAttachment = {
  id: string;
  localUri: string;
  type: 'image' | 'video' | 'audio' | 'file';
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'queued' | 'uploading' | 'uploaded' | 'failed';
  progress: number; // 0..1
  storagePath?: string;    // アップロード後のストレージパス
  uploaded?: ChatAttachment; // アップロード完了後のメタデータ
  error?: string;
};
```

---

## Claude の見解・補足

### Supabase Storage move API の確認
Codex の指摘「Supabase Storage には move API が存在する」を検証済み。
- `/node_modules/@supabase/storage-js/dist/index.cjs:796` に `async move(fromPath, toPath, options)` が存在
- 公式ドキュメントも確認: https://supabase.com/docs/reference/javascript/storage-from-move
- ただし「move API があるから B 案を使え」ではなく、A 案（UUID 先行生成）の方がシンプルなため A 案推奨（Codex と同意見）

### 両モデルが一致した点（高信頼度）
- Zustand chatStore + 専用 hook の分離が最適（specs との整合性も高い）
- 選択直後アップロード（B案）で孤児ファイル対策を施す
- expo-av の cleanup は `recordingRef.current = null` を先に行う
- UUID 先行生成（A案）でファイルパス問題を解決
- WebSocket には `metadata.attachments` フィールドを追加

### 追加検討事項
- `crypto.randomUUID()` は React Native で利用可能だが、`expo-crypto` の `randomUUID()` の方が確実
- ArrayBuffer への変換（Supabase Storage の React Native upload 制約）に注意
- `supabase.storage.from('chat-media').upload()` は React Native では `ArrayBuffer` で渡す必要あり

---

## 参照
- `src/features/chat/hooks/use-chat.ts`
- `src/services/openclaw/websocket-client.ts`
- `src/shared/types/openclaw.ts`
- `specs/features/chat.md`
- `specs/api/database.md`（chat_attachments テーブル定義）
