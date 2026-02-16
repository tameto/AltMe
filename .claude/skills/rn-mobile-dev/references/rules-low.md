# Rules - LOW (ベストプラクティス・規約レベル)

スタイル、規約、マイクロ最適化レベルのルール。直接的なパフォーマンス影響は低いが、保守性と一貫性に寄与する。

---

## 1. ui-pressable

**Impact: LOW** -- modern API, more flexible

`TouchableOpacity` / `TouchableHighlight` は使わない。`Pressable` を使用する。

**Incorrect (legacy Touchable components):**

```tsx
import { TouchableOpacity } from 'react-native'

function MyButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Text>Press me</Text>
    </TouchableOpacity>
  )
}
```

**Correct (Pressable):**

```tsx
import { Pressable } from 'react-native'

function MyButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Text>Press me</Text>
    </Pressable>
  )
}
```

**Correct (Pressable from gesture handler for lists):**

```tsx
import { Pressable } from 'react-native-gesture-handler'

function ListItem({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Text>Item</Text>
    </Pressable>
  )
}
```

Use `react-native-gesture-handler` Pressable inside scrollable lists for better gesture coordination, as long as you are using the ScrollView from `react-native-gesture-handler` as well.

**For animated press states (scale, opacity changes):** Use `GestureDetector` with Reanimated shared values instead of Pressable's style callback. See the `animation-gesture-detector-press` rule.

---

## 2. ui-scrollview-content-inset

**Impact: LOW** -- smoother updates, no layout recalculation

動的に変化するスペーシング（キーボード、ツールバー、動的コンテンツ）には `contentInset` を使用する。`contentInset` の変更はレイアウト再計算をトリガーしない。

**Incorrect (padding causes layout recalculation):**

```tsx
function Feed({ bottomOffset }: { bottomOffset: number }) {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: bottomOffset }}>
      {children}
    </ScrollView>
  )
}
// Changing bottomOffset triggers full layout recalculation
```

**Correct (contentInset for dynamic spacing):**

```tsx
function Feed({ bottomOffset }: { bottomOffset: number }) {
  return (
    <ScrollView
      contentInset={{ bottom: bottomOffset }}
      scrollIndicatorInsets={{ bottom: bottomOffset }}
    >
      {children}
    </ScrollView>
  )
}
// Changing bottomOffset only adjusts scroll bounds
```

Use `scrollIndicatorInsets` alongside `contentInset` to keep the scroll indicator aligned. For static spacing that never changes, padding is fine.

---

## 3. imports-design-system-folder

**Impact: LOW** -- enables global changes and easy refactoring

サードパーティの依存をデザインシステムフォルダから再エクスポートする。アプリコードはそこからインポートし、パッケージから直接インポートしない。

**Incorrect (imports directly from package):**

```tsx
import { View, Text } from 'react-native'
import { Button } from '@ui/button'

function Profile() {
  return (
    <View>
      <Text>Hello</Text>
      <Button>Save</Button>
    </View>
  )
}
```

**Correct (imports from design system):**

```tsx
// components/view.tsx
import { View as RNView } from 'react-native'

// ideal: pick the props you will actually use to control implementation
export function View(
  props: Pick<React.ComponentProps<typeof RNView>, 'style' | 'children'>
) {
  return <RNView {...props} />
}
```

```tsx
// components/text.tsx
export { Text } from 'react-native'
```

```tsx
// components/button.tsx
export { Button } from '@ui/button'
```

```tsx
import { View } from '@/components/view'
import { Text } from '@/components/text'
import { Button } from '@/components/button'

function Profile() {
  return (
    <View>
      <Text>Hello</Text>
      <Button>Save</Button>
    </View>
  )
}
```

Start by simply re-exporting. Customize later without changing app code.

> **AltMe 対応**: `src/shared/components/` に相当する。ファイル名は kebab-case で `view.tsx`, `text.tsx` など。

---

## 4. js-hoist-intl

**Impact: LOW-MEDIUM** -- avoids expensive object recreation

`Intl.DateTimeFormat`, `Intl.NumberFormat`, `Intl.RelativeTimeFormat` をレンダリングやループ内で作成しない。インスタンス化のコストが高い。ロケール/オプションが静的な場合はモジュールスコープに巻き上げる。

**Incorrect (new formatter every render):**

```tsx
function Price({ amount }: { amount: number }) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  })
  return <Text>{formatter.format(amount)}</Text>
}
```

**Correct (hoisted to module scope):**

```tsx
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function Price({ amount }: { amount: number }) {
  return <Text>{currencyFormatter.format(amount)}</Text>
}
```

**For dynamic locales, memoize:**

```tsx
const dateFormatter = useMemo(
  () => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }),
  [locale]
)
```

**Common formatters to hoist:**

```tsx
// Module-level formatters
const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })
const timeFormatter = new Intl.DateTimeFormat('en-US', { timeStyle: 'short' })
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent' })
const relativeFormatter = new Intl.RelativeTimeFormat('en-US', {
  numeric: 'auto',
})
```

Creating `Intl` objects is significantly more expensive than `RegExp` or plain objects -- each instantiation parses locale data and builds internal lookup tables.

---

## 5. fonts-config-plugin

**Impact: LOW** -- fonts available at launch, no async loading

`useFonts` や `Font.loadAsync` の代わりに、`expo-font` config plugin でビルド時にフォントを埋め込む。

**Incorrect (async font loading):**

```tsx
import { useFonts } from 'expo-font'
import { Text, View } from 'react-native'

function App() {
  const [fontsLoaded] = useFonts({
    'Geist-Bold': require('./assets/fonts/Geist-Bold.otf'),
  })

  if (!fontsLoaded) {
    return null
  }

  return (
    <View>
      <Text style={{ fontFamily: 'Geist-Bold' }}>Hello</Text>
    </View>
  )
}
```

**Correct (config plugin, fonts embedded at build):**

```json
// app.json
{
  "expo": {
    "plugins": [
      [
        "expo-font",
        {
          "fonts": ["./assets/fonts/Geist-Bold.otf"]
        }
      ]
    ]
  }
}
```

```tsx
import { Text, View } from 'react-native'

function App() {
  // No loading state needed -- font is already available
  return (
    <View>
      <Text style={{ fontFamily: 'Geist-Bold' }}>Hello</Text>
    </View>
  )
}
```

After adding fonts to the config plugin, run `npx expo prebuild` and rebuild the native app.

Reference: [Expo Font Documentation](https://docs.expo.dev/versions/latest/sdk/font/)
