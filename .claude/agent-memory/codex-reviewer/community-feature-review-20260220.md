# Community Feature Codex Review - 2026-02-20

## レビュー設定
- モデル: gpt-5.3-codex (4フォーカス並列)
- 対象: 12ファイル（migration, service client, Edge Function, components x3, hooks x3, screens x3）
- 検証: 全指摘をコード実読で確認済み

## Critical（必ず修正）

### C-1: isOwnTwin が常に false — Own Twin 表示が機能していない
- ファイル: `app/community/[id].tsx:71`
- 問題: `renderMessage` で `MessageItem` に `isOwnTwin` を渡していない（デフォルト false 固定）
- 修正:
  ```tsx
  // useAuthStore から userId を取得し比較
  const currentUserId = useAuthStore((s) => s.user?.id);
  const renderMessage = useCallback(
    ({ item }: { item: CommunityMessage }) => (
      <MessageItem
        message={item}
        isOwnTwin={Boolean(currentUserId && item.agentUserId === currentUserId)}
      />
    ),
    [currentUserId],
  );
  ```

### C-2: conversation_count トリガーが DELETE 時にデクリメントしない
- ファイル: `supabase/migrations/20260220000008_community_schema_update.sql:91-104`
- 問題: INSERT のみトリガー。メッセージ削除時に conversation_count が減らず、カウントが正確でない
- 修正:
  ```sql
  CREATE OR REPLACE FUNCTION update_community_conversation_count()
  RETURNS TRIGGER AS $$
  BEGIN
    IF TG_OP = 'INSERT' THEN
      UPDATE communities SET conversation_count = conversation_count + 1 WHERE id = NEW.community_id;
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE communities SET conversation_count = GREATEST(conversation_count - 1, 0) WHERE id = OLD.community_id;
      RETURN OLD;
    END IF;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  -- トリガーに AFTER DELETE も追加
  CREATE TRIGGER trg_update_conversation_count
    AFTER INSERT OR DELETE ON community_messages
    FOR EACH ROW EXECUTE FUNCTION update_community_conversation_count();
  ```

### C-3: サムネイルアップロード後に thumbnail_url が更新されない
- ファイル: `app/community-create.tsx:74-78`, `src/services/community/client.ts:228-247`
- 問題: `uploadCommunityThumbnail` が URL を返すが、`community-create.tsx` で戻り値を無視。community.thumbnail_url が null のまま
- 修正:
  ```tsx
  if (thumbnailUri !== null) {
    const uploadedUrl = await uploadCommunityThumbnail(community.id, thumbnailUri);
    // uploadedUrl で community.thumbnail_url を UPDATE する処理を追加
    if (uploadedUrl) {
      await supabase.from('communities').update({ thumbnail_url: uploadedUrl }).eq('id', community.id);
    }
  }
  ```
  または `uploadCommunityThumbnail` 内で自動 UPDATE する設計に変更。

## Warning（修正推奨）

### W-1: N+1クエリ — Edge Function でメンバーごとに profile+personality を個別クエリ
- ファイル: `supabase/functions/generate-community-chat/index.ts:105-123`
- 問題: selectedMemberIds（最大5名）に対してループ内で2クエリずつ発行（最大10クエリ）
- 修正: `IN` クエリで一括取得
  ```ts
  const [profilesRes, personalitiesRes] = await Promise.all([
    supabase.from('profiles').select('id, twin_name, avatar_icon').in('id', selectedMemberIds),
    supabase.from('personality_results').select('user_id, personality_traits, summary').in('user_id', selectedMemberIds),
  ]);
  ```

### W-2: サムネイルアップロードで create 後にエラーが発生してもロールバックしない
- ファイル: `app/community-create.tsx:62-89`
- 問題: `createCommunity` 成功後に `uploadCommunityThumbnail` が失敗しても community は作成されたまま。エラーも表示されない
- 修正: finally ブロックに catch を追加し、upload 失敗時は Alert 表示（community 削除は optional）

### W-3: member_count の負数リスク
- ファイル: `supabase/migrations/20260220000008_community_schema_update.sql:70-86`
- 問題: DELETE 時に member_count - 1 するが、0 以下になる可能性
- 修正: `GREATEST(member_count - 1, 0)` に変更

### W-4: RLS policy `auth.jwt()->>'role'='service_role'` は冗長かつ誤解を招く
- ファイル: `supabase/migrations/20260220000008_community_schema_update.sql:139-152`
- 問題: Supabase では `service_role` キーで作成したクライアントは RLS をバイパスするため、このポリシーは機能的に冗長。しかし「なぜあるか」が不明確でメンテコストになる
- 推奨: コメントを明確化するか削除

### W-5: useCommunities にエラー状態がなく、ネットワークエラーが握りつぶされる
- ファイル: `src/features/community/hooks/use-communities.ts:20-28`
- 問題: `listCommunities` がエラー時も `[]` を返すため、ネットワーク障害時にユーザーへのフィードバックがない
- 修正:
  ```ts
  const [error, setError] = useState<string | null>(null);
  // fetchCommunities 内で try/catch し setError
  ```

### W-6: use-community-membership の join/leave でエラーが呼び出し元に伝播しない
- ファイル: `src/features/community/hooks/use-community-membership.ts:38-60`
- 問題: `success = false` の場合も `setLoading(false)` するだけ。JoinButton 側でエラーを表示できない

## Info（検討事項）

### I-1: formatRelativeTime が日本語ハードコード（i18n 非対応）
- ファイル: `src/features/community/components/message-item.tsx:12-31`
- 問題: `'たった今'`, `'分前'` などが直書き。英語・韓国語ユーザーに対応できない

### I-2: community-card.tsx の `人参加中`・`件の会話` が i18n 非対応
- ファイル: `src/features/community/components/community-card.tsx:39,43`

### I-3: FlatList の ListHeaderComponent が非関数 JSX 要素で毎回再生成
- ファイル: `app/(tabs)/community.tsx:46-87`
- 問題: `ListHeader` が JSX 式（定数代入）。`useCallback` でラップした関数に変更推奨

### I-4: CommunityCard に React.memo がなく一覧再レンダー多発
- ファイル: `src/features/community/components/community-card.tsx`
- 推奨: `export const CommunityCard = React.memo(CommunityCardComponent)`

### I-5: loadMoreMessages の依存配列に messages 全体が入りメモ化が弱い
- ファイル: `src/features/community/hooks/use-community-detail.ts:56-68`
- 推奨: `messages[0]?.createdAt` を useRef で保持するか、functional update で messages[0] 参照を外す

### I-6: community-create.tsx のエラーメッセージが日本語ハードコード
- ファイル: `app/community-create.tsx:82-84`
- 推奨: `t('community.create.errorMessage')` キーに移動

### I-7: select('*') + as CommunityRow[] で型安全性なし
- ファイル: `src/services/community/client.ts` (複数箇所)
- 推奨: 必要列を明示した select に変更（Supabase の型生成も活用）

## 統計
- 総指摘数: 15件（検証済み）
- 除外: 0件（SQLインジェクション・認証バイパスは実際の RLS・コード確認で否定）
- Critical: 3件 / Warning: 6件 / Info: 7件（一部重複削除後）
