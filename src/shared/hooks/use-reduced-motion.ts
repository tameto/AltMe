// Platform-resolved hook:
//   Web:    use-reduced-motion.web.ts    (matchMedia prefers-reduced-motion)
//   Native: use-reduced-motion.native.ts (AccessibilityInfo)
//
// This base file is the fallback (native implementation).
export { useReducedMotion } from './use-reduced-motion.native';
