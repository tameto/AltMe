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
- 2026-02-21: オンボーディング UX 5テーマ（フロー最適化/Meet Twin段階型/プログレスインジケータ/口調バッチ生成/ゲーミフィケーション）相談完了

## オンボーディング UX 確定方針（2026-02-21 Codex+Claude合意）
- Meet Twin: `phase: 'name' | 'chat'` の段階型（同一画面内切り替え）。一体型は非推奨
- プログレス: セグメントバー + 補助テキスト（N/6）。共通コンポーネント化必須
  - 非アクティブ: #334155 / アクティブ: #7DD3FC / 完了時: #E8C567 薄グロー
- Avatar グリッド: width >= 768 → 6列 / width >= 420 → 5列 / mobile → 4列（現状の5固定は低視認）
- 口調プレビュー: 1回バッチ生成（tone-preview-batch）でキャッシュ。毎タップ API は非推奨
- ハプティクス: expo-haptics selectionAsync + Reanimated withSequence（実装コスト最小・効果最大）

## 発見済み実装ギャップ
- meet-twin.tsx:45 — 名前設定フェーズなし（仕様書 AC-5 と乖離）
- choose-avatar.tsx:72 / choose-tone.tsx:45 — ステップ番号ハードコード
- personality-quiz.tsx — ハプティクス未実装
- choose-avatar.tsx:60 — numColumns=5 固定（モバイルで視認性低下）
