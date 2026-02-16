# Rules - CRITICAL (違反するとクラッシュ / パフォーマンスに重大な影響)

パフォーマンスに重大な影響があるルール、またはランタイムクラッシュを引き起こすルール。

---

## 1. rendering-text-in-text-component

**Impact: CRITICAL** -- prevents runtime crash

文字列は必ず `<Text>` 内にレンダリングする。React Native は `<View>` の直接の子として文字列があるとクラッシュする。

**Incorrect (crashes):**

```tsx
import { View } from 'react-native'

function Greeting({ name }: { name: string }) {
  return <View>Hello, {name}!</View>
}
// Error: Text strings must be rendered within a <Text> component.
```

**Correct:**

```tsx
import { View, Text } from 'react-native'

function Greeting({ name }: { name: string }) {
  return (
    <View>
      <Text>Hello, {name}!</Text>
    </View>
  )
}
```

---

## 2. rendering-no-falsy-and

**Impact: CRITICAL** -- prevents production crash

`{value && <Component />}` で value が空文字列 `""` や `0` になり得る場合、JSX がそれらを `<Text>` 外でレンダリングしようとしてクラッシュする。

**Incorrect (crashes if count is 0 or name is ""):**

```tsx
function Profile({ name, count }: { name: string; count: number }) {
  return (
    <View>
      {name && <Text>{name}</Text>}
      {count && <Text>{count} items</Text>}
    </View>
  )
}
// If name="" or count=0, renders the falsy value -> crash
```

**Correct (ternary with null):**

```tsx
function Profile({ name, count }: { name: string; count: number }) {
  return (
    <View>
      {name ? <Text>{name}</Text> : null}
      {count ? <Text>{count} items</Text> : null}
    </View>
  )
}
```

**Correct (explicit boolean coercion):**

```tsx
function Profile({ name, count }: { name: string; count: number }) {
  return (
    <View>
      {!!name && <Text>{name}</Text>}
      {!!count && <Text>{count} items</Text>}
    </View>
  )
}
```

**Best (early return):**

```tsx
function Profile({ name, count }: { name: string; count: number }) {
  if (!name) return null

  return (
    <View>
      <Text>{name}</Text>
      {count > 0 ? <Text>{count} items</Text> : null}
    </View>
  )
}
```

Early returns are clearest. When using conditionals inline, prefer ternary or explicit boolean checks.

**Lint rule:** Enable `react/jsx-no-leaked-render` from [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/jsx-no-leaked-render.md) to catch this automatically.

---

## 3. list-performance-function-references

**Impact: CRITICAL** -- virtualization relies on reference stability

リストに渡すデータの map/filter を事前に行わない。仮想化はオブジェクト参照の安定性に依存している。新しい参照を作ると、表示中の全アイテムが再レンダリングされる。

**Incorrect (creates new object references on every keystroke):**

```tsx
function DomainSearch() {
  const { keyword, setKeyword } = useKeywordZustandState()
  const { data: tlds } = useTlds()

  // Bad: creates new objects on every render, reparenting the entire list on every keystroke
  const domains = tlds.map((tld) => ({
    domain: `${keyword}.${tld.name}`,
    tld: tld.name,
    price: tld.price,
  }))

  return (
    <>
      <TextInput value={keyword} onChangeText={setKeyword} />
      <LegendList
        data={domains}
        renderItem={({ item }) => <DomainItem item={item} keyword={keyword} />}
      />
    </>
  )
}
```

**Correct (stable references, transform inside items):**

```tsx
const renderItem = ({ item }) => <DomainItem tld={item} />

function DomainSearch() {
  const { data: tlds } = useTlds()

  return (
    <LegendList
      // good: as long as the data is stable, LegendList will not re-render the entire list
      data={tlds}
      renderItem={renderItem}
    />
  )
}

function DomainItem({ tld }: { tld: Tld }) {
  // good: transform within items, and don't pass the dynamic data as a prop
  // good: use a selector function from zustand to receive a stable string back
  const domain = useKeywordZustandState((s) => s.keyword + '.' + tld.name)
  return <Text>{domain}</Text>
}
```

> **AltMe 対応**: Zustand セレクタでピンポイント購読することで、不要な再レンダリングを防止。

**Updating parent array reference:**

新しい配列インスタンスを作成しても、内部のオブジェクト参照が安定していれば OK。

```tsx
// good: creates a new array instance without mutating the inner objects
// good: parent array reference is unaffected by typing and updating "keyword"
const sortedTlds = tlds.toSorted((a, b) => a.name.localeCompare(b.name))

return <LegendList data={sortedTlds} renderItem={renderItem} />
```

**With zustand for dynamic data (avoids parent re-renders):**

```tsx
const useSearchStore = create<{ keyword: string }>(() => ({ keyword: '' }))

function DomainSearch() {
  const { data: tlds } = useTlds()

  return (
    <>
      <SearchInput />
      <LegendList
        data={tlds}
        // if you aren't using React Compiler, wrap renderItem with useCallback
        renderItem={({ item }) => <DomainItem tld={item} />}
      />
    </>
  )
}

function DomainItem({ tld }: { tld: Tld }) {
  // Select only what you need -- component only re-renders when keyword changes
  const keyword = useSearchStore((s) => s.keyword)
  const domain = `${keyword}.${tld.name}`
  return <Text>{domain}</Text>
}
```

**Deriving state within list items based on parent data (avoids parent re-renders):**

```tsx
function DomainItemFavoriteButton({ tld }: { tld: Tld }) {
  const isFavorited = useFavoritesStore((s) => s.favorites.has(tld.id))
  return <TldFavoriteButton isFavorited={isFavorited} />
}
```

Note: if you're using the React Compiler, you can read React Context values directly within list items. Although this is slightly slower than using a Zustand selector in most cases, the effect may be negligible.

---

## 4. monorepo-native-deps-in-app

**Impact: CRITICAL** -- required for autolinking to work

モノレポでは、ネイティブコードを持つパッケージはアプリディレクトリに直接インストールする必要がある。Autolinking はアプリの `node_modules` のみスキャンする。

**Incorrect (native dep in shared package only):**

```
packages/
  ui/
    package.json  # has react-native-reanimated
  app/
    package.json  # missing react-native-reanimated
```

Autolinking fails -- native code not linked.

**Correct (native dep in app directory):**

```
packages/
  ui/
    package.json  # has react-native-reanimated
  app/
    package.json  # also has react-native-reanimated
```

```json
// packages/app/package.json
{
  "dependencies": {
    "react-native-reanimated": "3.16.1"
  }
}
```

Even if the shared package uses the native dependency, the app must also list it for autolinking to detect and link the native code.

---

## 5. hooks-before-conditional-returns

**Impact: CRITICAL** -- prevents hooks order violation (runtime error in development, unpredictable behavior in production)

React の Rules of Hooks: すべての hooks（useState, useEffect, useCallback, useRef, useMemo 等）は、
条件分岐や早期リターンの**前に**宣言する必要がある。hooks の呼び出し順序はレンダリング間で一定でなければならない。

**Incorrect (hooks after early return):**

```tsx
function ChatScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // BAD: この return の後に hooks がある
  if (!isAuthenticated) {
    return <GuestPromptOverlay />;
  }

  const [messages, setMessages] = useState<Message[]>([]); // CRASH!
  const [isLoading, setIsLoading] = useState(false);       // CRASH!

  useEffect(() => {
    loadMessages();
  }, []);

  return <MessageList messages={messages} />;
}
```

**Correct (all hooks before any conditional return):**

```tsx
function ChatScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // GOOD: すべての hooks を先に宣言
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return; // hooks 内の条件は OK
    loadMessages();
  }, [isAuthenticated]);

  // GOOD: hooks の後に条件付きリターン
  if (!isAuthenticated) {
    return <GuestPromptOverlay />;
  }

  return <MessageList messages={messages} />;
}
```

**Key points:**
- hooks 内部の条件分岐（`useEffect` 内の `if (!x) return`）は問題ない
- 問題は**コンポーネントレベル**の `if (...) return` の後に hooks を置くこと
- ゲストガード、認証チェック、ローディング表示などの早期リターンパターンで頻発する
- `eslint-plugin-react-hooks` の `rules-of-hooks` ルールで自動検出可能

**Lint rule:** Enable `react-hooks/rules-of-hooks` from [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) to catch this automatically.

> **AltMe 対応**: `hooks-order-check.sh` PostToolUse hook で自動検出。認証ガード (`if (!isAuthenticated) return`) の配置に特に注意。
