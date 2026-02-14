# React Native Rules (vercel-react-native-skills ベース)

36個のルールを優先度別に整理。各ルールに Incorrect/Correct パターンを記載。

**詳細なコード例（BAD/GOOD パターン省略なし）は各カテゴリファイルを参照:**

- [rules-critical.md](./rules-critical.md) -- CRITICAL: クラッシュ防止 + 参照安定性 + autolinking (4ルール)
- [rules-high.md](./rules-high.md) -- HIGH: リスト仮想化、アニメーション、ナビゲーション、画像、メニュー (15ルール)
- [rules-medium.md](./rules-medium.md) -- MEDIUM: 状態管理、React Compiler、UIパターン、計測、デザインシステム (12ルール)
- [rules-low.md](./rules-low.md) -- LOW: Pressable、contentInset、デザインシステムインポート、Intl巻き上げ、フォント (5ルール)

---

## CRITICAL（違反するとクラッシュ）

### rendering-text-in-text-component
文字列は必ず `<Text>` 内に配置。`<View>` 内の裸の文字列はランタイムクラッシュを引き起こす。

**NG:**
```tsx
<View>Hello World</View>
<View>{user.name}</View>
```

**OK:**
```tsx
<View><Text>Hello World</Text></View>
<View><Text>{user.name}</Text></View>
```

### rendering-no-falsy-and
`{value && <Component />}` で value が `0` や `""` になり得る場合、プロダクションでクラッシュする。

**NG:**
```tsx
{count && <Text>{count} items</Text>}
{name && <Text>{name}</Text>}
```

**OK:**
```tsx
{count > 0 ? <Text>{count} items</Text> : null}
{!!name && <Text>{name}</Text>}
{name != null && <Text>{name}</Text>}
```

---

## HIGH（パフォーマンスに大きく影響）

### list-performance-virtualize
常に FlashList または LegendList を使用。`ScrollView` + `.map()` は禁止。

**NG:**
```tsx
<ScrollView>
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</ScrollView>
```

**OK:**
```tsx
import { FlashList } from '@shopify/flash-list';
<FlashList data={items} renderItem={({ item }) => <ItemCard item={item} />} estimatedItemSize={80} />
```

### list-performance-function-references
リストに渡す前に map/filter しない。安定したオブジェクト参照を維持。

**NG:**
```tsx
const filtered = items.filter(i => i.active);
<FlashList data={filtered} ... />
```

**OK:**
```tsx
// フィルタリングは useMemo で安定化、または FlashList の data に直接渡す
const filtered = useMemo(() => items.filter(i => i.active), [items]);
<FlashList data={filtered} ... />
```

### list-performance-callbacks
コールバックはリストルートで巻き上げ、単一関数インスタンスをアイテムに渡す。

**NG:**
```tsx
renderItem={({ item }) => (
  <Item onPress={() => handlePress(item.id)} />
)}
```

**OK:**
```tsx
const handlePress = useCallback((id: string) => { ... }, []);
renderItem={({ item }) => <Item id={item.id} onPress={handlePress} />}
// Item 内で: onPress(id)
```

### list-performance-inline-objects
`renderItem` 内でインラインオブジェクト生成禁止。プリミティブまたは安定した参照を渡す。

**NG:**
```tsx
renderItem={({ item }) => (
  <Item style={{ marginBottom: 8 }} data={{ title: item.title }} />
)}
```

**OK:**
```tsx
const itemStyle = { marginBottom: 8 };
renderItem={({ item }) => <Item style={itemStyle} title={item.title} />}
```

### list-performance-item-memo
リストアイテムにはプリミティブ props を渡し、`memo()` の比較を効果的に。

### list-performance-item-expensive
アイテムコンポーネントは軽量に。クエリ、重い hooks、Context 禁止。Zustand セレクタを使用。

**NG:**
```tsx
const ListItem = ({ id }) => {
  const data = useQuery(['item', id]); // 各アイテムでクエリ
  const theme = useContext(ThemeContext); // Context 購読
  ...
};
```

**OK:**
```tsx
const ListItem = memo(({ id }) => {
  const title = useStore(s => s.items[id]?.title); // ピンポイント購読
  ...
});
```

### list-performance-images
圧縮済み、適切サイズの画像を読み込む（Retina用に表示サイズの2倍）。

### list-performance-item-types
異種リストでは `getItemType` を使用してリサイクルプールを適切に管理。

### animation-gpu-properties
`transform` と `opacity` のみアニメーション（GPU アクセラレーション対象）。

**NG:**
```tsx
// width, height, top, left, margin, padding のアニメーション
useAnimatedStyle(() => ({ width: width.value, height: height.value }));
```

**OK:**
```tsx
useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }, { translateX: x.value }],
  opacity: opacity.value,
}));
```

### animation-gesture-detector-press
プレスアニメーションは `GestureDetector` + `Gesture.Tap()` + shared values で実装（UIスレッド実行）。

### animation-derived-value
計算アニメーションには `useDerivedValue` を使用（`useAnimatedReaction` より優先）。

### scroll-position-no-state
スクロール位置を `useState` で追跡禁止。Reanimated shared values または refs を使用。

### navigation-native-navigators
Expo Router のネイティブスタック / ネイティブタブを使用。JS ベースのナビゲーターは禁止。

**NG:**
```tsx
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
```

**OK:**
```tsx
// Expo Router の _layout.tsx
import { Stack } from 'expo-router';
export default function Layout() { return <Stack />; }

// ネイティブタブ
import { NativeTabs } from 'expo-router/unstable-native-tabs';
```

---

## MEDIUM（コード品質・保守性に影響）

### react-state-minimize
冗長な state 禁止。props/state から派生値を計算。

**NG:**
```tsx
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [fullName, setFullName] = useState(''); // 冗長
useEffect(() => setFullName(`${firstName} ${lastName}`), [firstName, lastName]);
```

**OK:**
```tsx
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const fullName = `${firstName} ${lastName}`; // 派生値
```

### react-state-dispatcher
次の state が現在の state に依存する場合、`setState(prev => ...)` を使用。

### react-state-fallback
`undefined` 初期状態 + nullish coalescing でリアクティブフォールバック。

```tsx
const [value, setValue] = useState<string | undefined>();
const display = value ?? defaultFromProps;
```

### state-ground-truth
state は実際の状態を表す（例: `pressed`）。派生的な視覚値（例: `scale`）は interpolation で。

### react-compiler-destructure-functions
hooks から関数を早期分割代入。オブジェクトへのドットアクセスはメモ化を壊す。

**NG:**
```tsx
const animation = useAnimation();
animation.start(); // ドットアクセスでメモ化失敗
```

**OK:**
```tsx
const { start } = useAnimation();
start(); // 分割代入で安定
```

### react-compiler-reanimated-shared-values
Reanimated shared values は `.get()` / `.set()` を使用。

### ui-expo-image
RN `Image` の代わりに `expo-image` を使用。blurhash、キャッシュ、priority、contentFit 対応。

```tsx
import { Image } from 'expo-image';
<Image source={uri} placeholder={blurhash} contentFit="cover" transition={200} />
```

### ui-pressable
`TouchableOpacity` / `TouchableHighlight` の代わりに `Pressable` を使用。

### ui-safe-area-scroll
`SafeAreaView` の代わりに `contentInsetAdjustmentBehavior="automatic"` を使用。

### ui-native-modals
ネイティブ `<Modal presentationStyle="formSheet">` を使用。JS ボトムシートライブラリは不要。

### ui-menus
`zeego` でネイティブドロップダウン/コンテキストメニュー。

### ui-styling
モダンスタイリング: `borderCurve: 'continuous'`、`gap`、CSS `boxShadow`、`experimental_backgroundImage`。

### ui-scrollview-content-inset
動的スペーシングには `contentInset` を使用（padding の代わりに）。

### ui-measure-views
同期計測: `useLayoutEffect` + `getBoundingClientRect()`。更新: `onLayout`。

### ui-image-gallery
画像ギャラリー: `@nandorojo/galeria` で共有要素トランジション。

### design-system-compound-components
複合コンポーネントパターン: `Button` / `ButtonText` / `ButtonIcon`。

---

## LOW（ベストプラクティス）

### monorepo-native-deps-in-app
ネイティブ依存はアプリパッケージにインストール（autolinking用）。

### monorepo-single-dependency-versions
モノレポ全体で単一バージョン。syncpack/overrides を使用。

### imports-design-system-folder
サードパーティコンポーネントを design system フォルダから再エクスポート。

### js-hoist-intl
`Intl.DateTimeFormat` / `Intl.NumberFormat` はモジュールスコープに巻き上げ。

### fonts-config-plugin
`expo-font` config plugin でビルド時フォント埋め込み（`useFonts` の非同期ロード不要）。
