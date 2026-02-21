# codex-reviewer MEMORY

## Zustand 5.x テストパターン（検証済み）
- `useStore.getInitialState()` は Zustand 5.0.11 の vanilla.d.ts に存在することを確認済み
- `useStore.setState(initialState, true)` で beforeEach リセット（replace=true で完全復元）
- Zustand ストアは `renderHook` を使わず `getState()` 直叩きが最も安定

## Analytics SDK比較（2026-02-20 調査）
- PostHog を推奨: RevenueCat公式連携あり、defaultOptIn:false でGDPR対応容易、自己ホスト可
- Mixpanel 40.2MB（npm unpacked）はネイティブモジュール含む公表値。実バンドルへの影響は小さい可能性あり（要検証）
- Amplitude: Expo Go 非対応の記載あり（開発時注意）

## コンサルテーション実績
- 2026-02-20: TDD設計 / Community Feature アーキテクチャ / Analytics SDK選定の3テーマ並列相談完了
