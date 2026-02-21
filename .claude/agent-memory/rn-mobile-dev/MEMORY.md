# rn-mobile-dev エージェントメモリ

## プロジェクト構造パターン

### Feature Module ディレクトリ構成
- `src/features/{feature}/hooks/` — UIロジックフック置き場
- `src/features/{feature}/stores/` — Zustand ストア
- `app/(tabs)/` — 薄いUIレイヤー（StyleSheet残す、ロジックはhooksへ）

### ロジック抽出パターン
- `app/` の画面ファイルが大きくなったらhooksに抽出
- 抽出したhookはnamed exportのみ（`export function useXxx()`）
- 型定義もhookファイルからexportする（例: `export type DisplayMessage`）
- FlatList の ref は hook 内で `useRef<FlatList>(null)` として管理し返り値に含める

### 完了時チェック
- `npx tsc --noEmit` で型チェック必須
- ハードコードした定数は `src/config/constants.ts` の定数に戻す

## 共有型の場所
- OpenClaw関連: `src/shared/types/openclaw.ts`
- Subscription関連: `src/shared/types/subscription.ts`

## サービス層
- Community API: `src/services/community/client.ts`（listCommunities等）
- OpenClaw接続: `src/services/openclaw/client.ts`, `websocket-client.ts`, `connection-manager.ts`

## テストパターン (expo-av フック)

### jest.mock ファクトリ内でのコールバック保存
```typescript
jest.mock('expo-av', () => {
  const soundInstance: { stopAsync: jest.Mock; _onPlaybackStatusUpdate?: Function } = {
    stopAsync: jest.fn(),
    _onPlaybackStatusUpdate: undefined,
  };
  return {
    Audio: {
      Sound: {
        createAsync: jest.fn().mockImplementation((_src, _opts, cb) => {
          soundInstance._onPlaybackStatusUpdate = cb;
          return Promise.resolve({ sound: soundInstance });
        }),
        _mockSoundInstance: soundInstance,
      },
    },
  };
});
```

### act() の分離ルール
- 複数の非同期 hook 操作を同一 `act()` 内で実行すると、中間状態 (setIsPlaying等) が見えないことがある
- 状態変化を検証する場合は操作ごとに独立した `act()` を使う:
  ```typescript
  await act(async () => { await startRecording(); await stopRecording(); });
  await act(async () => { await playPreview(); }); // 別 act で isPlaying チェック
  expect(result.current.isPlaying).toBe(true);
  ```

### テストライブラリ
- `@testing-library/react-hooks` は未インストール
- `@testing-library/react-native` の `renderHook, act` を使う
