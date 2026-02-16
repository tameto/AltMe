---
name: greenlight
description: >
  Pre-submission compliance scanner for Apple App Store. Use this skill when reviewing
  iOS, macOS, tvOS, watchOS, or visionOS app code (Swift, Objective-C, React Native, Expo)
  to identify potential App Store rejection risks before submission. Triggers on tasks involving
  app review preparation, compliance checking, App Store submission readiness, or when a user
  asks about App Store guidelines.
---

# Greenlight — App Store Pre-Submission Scanner

You are an expert at preparing iOS apps for App Store submission. You have access to the `greenlight` CLI which runs automated compliance checks. Your job is to run the checks, interpret the results, fix every issue, and re-run until the app passes with GREENLIT status.

## Step 1: Run the scan

Run `greenlight preflight` immediately on the project root. Do NOT try to install greenlight — it is already available in PATH. Just run it:

```bash
greenlight preflight .
```

If the user has a built IPA, include it:
```bash
greenlight preflight . --ipa /path/to/build.ipa
```

If `greenlight` is not found, install it:
```bash
# Homebrew (macOS)
brew install revylai/tap/greenlight
```

## Step 2: Read the output and fix every issue

Every finding has a severity, guideline reference, file location, and fix suggestion. Fix them in order:
1. **CRITICAL** — Will be rejected. Must fix.
2. **WARN** — High rejection risk. Should fix.
3. **INFO** — Best practice. Consider fixing.

When fixing issues:
- **Hardcoded secrets** -> Move to environment variables (use `process.env.VAR_NAME` or Expo's `Constants.expoConfig.extra`)
- **External payment for digital goods** -> Replace Stripe/PayPal with StoreKit/IAP for digital content. External payment is only OK for physical goods.
- **Social login without Sign in with Apple** -> Add `expo-apple-authentication` alongside Google/Facebook login
- **Account creation without deletion** -> Add a "Delete Account" option in settings
- **Platform references** -> Remove mentions of "Android", "Google Play", "Windows", etc.
- **Placeholder content** -> Replace "Lorem ipsum", "Coming soon", "TBD" with real content
- **Vague purpose strings** -> Rewrite to explain specifically WHY the app needs the permission
- **Hardcoded IPv4** -> Replace IP addresses with proper hostnames
- **HTTP URLs** -> Change `http://` to `https://`
- **Console logs** -> Remove or gate behind `__DEV__` flag
- **Missing privacy policy** -> Note that this needs to be set in App Store Connect

## Step 3: Re-run and repeat

After fixing issues, re-run the scan:
```bash
greenlight preflight .
```

**Keep looping until the output shows GREENLIT status (zero CRITICAL findings).** Some fixes can introduce new issues (e.g., adding a tracking SDK requires ATT). The scan runs in under 1 second so re-run frequently.

## AltMe-Specific Notes

AltMe uses:
- **RevenueCat SDK** for IAP (no external payment for digital goods)
- **expo-apple-authentication** for Apple Sign-In (already compliant)
- **@react-native-google-signin/google-signin** for Google Sign-In
- **Account deletion** via delete-account Edge Function (Apple guideline 5.1.1)
- **Supabase** as BaaS (API keys in Edge Functions, not client-exposed except anon key)
- **OpenClaw** on DigitalOcean (WebSocket connections to user-specific Droplets)

Key compliance areas to watch:
1. Console.log statements should be gated with `__DEV__`
2. OpenClaw WebSocket URLs use IP addresses (ws://{ip}:18789) — these are dynamic per user, not hardcoded
3. Privacy manifest needs to declare Supabase analytics, RevenueCat, Google Sign-In data usage

## Severity Levels

| Level | Label | Action Required |
|-------|-------|----------------|
| CRITICAL | Will be rejected | **Must fix** before submission |
| WARN | High rejection risk | **Should fix** — strongly recommended |
| INFO | Best practice | **Consider fixing** — improves approval odds |

The goal is always: **zero CRITICAL findings = GREENLIT status.**

## Other CLI Commands

```bash
greenlight codescan .                      # Code-only scan
greenlight privacy .                       # Privacy manifest scan
greenlight ipa /path/to/build.ipa          # Binary inspection
greenlight scan --app-id <ID>              # App Store Connect checks (needs auth)
greenlight guidelines search "privacy"     # Search Apple guidelines
```

## AltMe-Specific False Positives (Known)

以下は Greenlight が検出するが、AltMe では問題ない項目:
- **TextInput の `placeholder` prop** — `placeholder={'メッセージを入力...'}` はUXパターンで正常
- **Edge Function の `console.error`** — Deno サーバーサイドのエラーログで許容
- **Privacy Policy URL** — App Store Connect で設定する項目（app.json では設定不可）
- **`Platform.select` の `default` キー** — 内部プラットフォーム分岐でユーザー非表示

## Automation (自動実行)

Greenlight は以下のタイミングで自動実行される:

### 1. PostToolUse Hook (自動)
`.claude/hooks/greenlight-scan.sh` が以下のタイミングで起動:
- **`git commit` 後**: `greenlight codescan .` を実行、CRITICAL があれば警告表示
- **`gh pr create` 時**: `greenlight preflight .` をフル実行、結果をフィードバック

### 2. sdd-implement Phase N (手動トリガー)
`/sdd-implement` の Phase N (Polish) で以下を実行:
```
1. greenlight preflight . を実行
2. CRITICAL → 即座に修正ループ
3. WARN → 可能な限り修正
4. GREENLIT 達成を確認
```

### 3. 手動実行
`/greenlight` スキルで任意のタイミングでフルスキャン + 修正ループを実行可能。

## About

**Greenlight** is built by [Revyl](https://revyl.com) -- the mobile reliability platform.
