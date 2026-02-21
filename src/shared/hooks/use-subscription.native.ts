// Native version: delegates to RevenueCat client
// This is the original use-subscription.ts logic, now platform-specific.
// NOTE: explicit .ts extension to avoid circular resolution in Jest (native preset picks .native.ts first)
// @ts-expect-error TS5097 - explicit .ts extension required to avoid circular Metro resolution (.native.ts → .ts)
export { useSubscription, useIsPro } from './use-subscription.ts'; // eslint-disable-line
