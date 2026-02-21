# Codex Consultation: Expo Web Support Strategy
Date: 2026-02-21
Model: gpt-5.3-codex

## 相談概要
expo start --web 対応のためのネイティブモジュール分岐戦略

## 合意点（高信頼度）

### A. SecureStore
- `sessionStorage` を web の第一候補（マーケ/プレビュー用途）
- `localStorage` は「ログイン持続が必要」なら選択肢
- 両方とも XSS リスクは同じ。差は「永続性」のみ
- メモリfallback（Map）でSSR/undefined window に対応

### B. 分岐戦略
全ネイティブモジュールで `.native.ts / .web.ts` ファイル分割が最適
- Metro は拡張子解決が強く、tree-shaking（platform shaking）と相性が良い
- `Platform.OS` チェックは小さい UI 差分のみ（Apple ボタン表示など）
- `dynamic require()` は最小限（CJS は tree-shaking が弱い）

| モジュール | 戦略 |
|---|---|
| expo-secure-store | .native/.web 分割（web 未対応）|
| @react-native-google-signin | .native/.web 分割（web は別 OAuth フロー）|
| expo-apple-authentication | .native/.web 分割（iOS 専用）|
| react-native-purchases | .native/.web 分割（Web Billing 不要なら mock）|
| react-native-onesignal | .native/.web 分割（no-op）|

### C. react-native-web 互換性
- expo-linear-gradient: web 対応済み。ただし `start/end` の角度表現がネイティブと微差あり
- expo-blur: web 対応済みだが既知問題あり（リスト先行描画で更新されない）
- FlashList: web 非対応 → FlatList フォールバックが必要
- Reanimated 4.x: web で動くが UI thread なし、worklet は JS 関数化。重いアニメは落ちやすい

実際のコード確認:
- LinearGradient: gold-button.tsx で使用。expo-linear-gradient は web 対応済みなので変更不要
- Reanimated: 実際の API 呼び出しはゼロ（宣言のみ）→ 現時点で対応不要

### D. RevenueCat web モック
- `download-app` リダイレクト戦略が最適（web は補助チャネル）
- contract.ts で型を共通化し、client.native.ts / client.web.ts で実装を分岐
- `EXPO_PUBLIC_WEB_PAYWALL_MODE` env var で動作切り替え可能に

## Claude の補足見解

### AppState (質問リストにあるが Codex 回答なし)
- `AppState` は `react-native` からの import なので web で動作しない
- `src/services/supabase/client.ts` でモジュールレベルで呼んでいるため、
  client.ts を `.native.ts / .web.ts` に分割するか、
  `Platform.OS === 'web'` で条件分岐が必要
- web 版: `document.addEventListener('visibilitychange', ...)` で代替

### Alert / Linking
- Alert: `src/shared/utils/alert.ts` を作成し、Platform.OS で分岐するのが最適
  - web: `window.confirm()` / `window.alert()`
  - native: `Alert` from react-native
- Linking: `expo-linking` はすでに install 済み（^8.0.11）で web 対応あり
  - URL 開く: expo-linking の `openURL` を使えば web でも動作する（window.open に変換）
  - `openSettings()` は web では no-op になる点に注意

### Codex が触れなかった点
- `detectSessionInUrl: false` は web では `true` にした方が良い可能性がある
  （Supabase OAuth redirect を受け取るため）
- Google OAuth on web は `supabase.auth.signInWithOAuth({ provider: 'google' })` で
  @react-native-google-signin を完全に置き換えられる
