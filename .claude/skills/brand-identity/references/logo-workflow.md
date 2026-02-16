# ロゴデザイン ワークフロー詳細

> AI画像生成を使ったロゴの反復的な作成・洗練・最終化の完全手順。

---

## 全体フロー

```
Step 1: コンセプト定義 + キーワード抽出
Step 2: R1（初回候補5個生成）
Step 3: ユーザーフィードバック → R2（方向性絞り込み）
Step 4: R3-R4（詳細調整・最終候補）
Step 5: 文字なし版作成（Clip技法）
Step 6: アイコンサイズ作成（80px）
Step 7: 決定バッジ + 記録
```

通常 **3-4ラウンド** で収束。各ラウンドで5候補を生成し、ユーザーの方向性を反映して次ラウンドに進む。

---

## Step 1: コンセプト定義

### ヒアリング項目
| 項目 | 例 |
|------|-----|
| アプリ名 | AltMe |
| コンセプト | もう一人の自分、AIツイン |
| ブランドの雰囲気 | 未来的、知的、温かみ |
| 色の方向性 | ダーク + ゴールド/ティール |
| 避けたいもの | カートゥーン風、チープ感 |
| 参考アプリ/ブランド | Notion, Linear, Raycast |

### キーワード抽出テンプレート
```
美学キーワード: [neural, particle, topology, golden, teal, dark navy]
形状キーワード: [ring, circular, interconnected, symmetry, twin]
スタイルキーワード: [minimalist, premium, futuristic, elegant]
```

---

## Step 2: R1（初回候補生成）

### 比較ボード作成
```javascript
// マスターボード内にセクション作成
label1=I("{masterBoardId}", {type: "text", content: "Logo R1: Initial Concepts", fontSize: 20, fontWeight: "700", fontFamily: "Outfit", textColor: "#0F172A"})
row1=I("{masterBoardId}", {type: "frame", name: "Logo R1 Row", layout: "horizontal", gap: 30, width: "fill_container"})
```

### 5候補の生成
```javascript
// 候補A: 抽象的パーティクル
a=I(row1, {type: "frame", name: "R1-A", width: 160, height: 160, cornerRadius: [20,20,20,20], clip: true})
G(a, "ai", "minimalist app logo, golden particle ring on dark navy background, futuristic, premium feel")

// 候補B: ニューラルネットワーク
b=I(row1, {type: "frame", name: "R1-B", width: 160, height: 160, cornerRadius: [20,20,20,20], clip: true})
G(b, "ai", "neural network logo, interconnected nodes forming letter A, teal and gold, dark background")

// 候補C: 幾何学
c=I(row1, {type: "frame", name: "R1-C", width: 160, height: 160, cornerRadius: [20,20,20,20], clip: true})
G(c, "ai", "geometric twin symbol, two mirrored shapes, minimalist, navy and gold gradient")

// 候補D: トポロジー
d=I(row1, {type: "frame", name: "R1-D", width: 160, height: 160, cornerRadius: [20,20,20,20], clip: true})
G(d, "ai", "topology mesh logo, organic flowing lines, dark space, gold particles")

// 候補E: タイポグラフィック
e=I(row1, {type: "frame", name: "R1-E", width: 160, height: 160, cornerRadius: [20,20,20,20], clip: true})
G(e, "ai", "typographic logo 'AltMe', elegant thin font with particle effects, dark background, gold accents")
```

### プロンプト設計のベストプラクティス

**効果的なプロンプト構造:**
```
[主題] + [スタイル] + [色] + [背景] + [感覚]
```

**良いプロンプト例:**
- `"minimalist app logo, golden particle ring floating in dark space, premium, elegant"`
- `"neural topology network forming circular shape, teal and gold nodes, dark navy, futuristic"`

**悪いプロンプト例:**
- `"make a cool logo"` → 具体性がなさすぎる
- `"logo with the letters A-l-t-M-e in gold comic sans with rainbow background"` → 具体的すぎて創造性が失われる

### AI生成の非決定性への対処
- **同じプロンプトでも毎回異なる結果が出る** — これは仕様であり、バグではない
- 気に入った結果が出たら、その画像ファイルパスを記録しておく
- `./images/generated-{timestamp}.png` 形式で自動保存される
- 同じ画像を再利用するには、ファイルパスからの fills 設定を使う

---

## Step 3: フィードバック → R2

### フィードバックの受け取り方
ユーザーが候補を見て返すフィードバックの典型パターン:

| フィードバック | 次のアクション |
|-------------|-------------|
| 「R1-Dが良い」 | R1-Dのスタイルを5バリエーション展開 |
| 「もっとシンプルに」 | 要素を減らしたプロンプトで再生成 |
| 「色はいいがフォームが違う」 | 同色系で別形状を探索 |
| 「全部違う」 | コンセプトを再確認、方向転換 |

### R2 セクション作成
```javascript
label2=I("{masterBoardId}", {type: "text", content: "Logo R2: R1-D style variants (particle + topology)", fontSize: 20, fontWeight: "700", fontFamily: "Outfit", textColor: "#0F172A"})
row2=I("{masterBoardId}", {type: "frame", name: "Logo R2 Row", layout: "horizontal", gap: 30, width: "fill_container"})
// R1-Dのスタイルを基に5バリエーション生成
```

---

## Step 4: R3-R4（最終調整）

### 収束のサイン
- ユーザーが「これの方向で」と明確に指定した
- 微調整レベルのフィードバックになった（「もう少し明るく」等）
- 2つまで絞り込まれた

### R4 での最終候補
最終ラウンドでは、選ばれた候補の微調整バリエーションを生成:
- 色の明るさ調整
- 要素の配置微調整
- テキスト有無のバリエーション

---

## Step 5: 文字なし版の作成（Clip技法）

### 問題
AI生成ロゴにアプリ名テキストが含まれている場合、「文字なし版」が必要だが、
AI再生成では**全く同じリングデザインを再現できない**。

### 解決策: Clip技法
親フレームを `clip: true` + `layout: "none"` に設定し、
オーバーサイズの子フレーム（画像付き）を x/y オフセットで配置して、
テキスト部分を枠外に押し出す。

```javascript
// 160px版の文字なしロゴ
U("{logoFrame160}", {clip: true, layout: "none", width: 160, height: 160})
inner160=I("{logoFrame160}", {type: "frame", width: 200, height: 200, x: -20, y: -12})
// inner160 に決定ロゴ画像を設定（fills でファイルパス指定、または G() で元画像コピー）
```

### サイズ別 Clip パラメータ
| 表示サイズ | 子フレームサイズ | x offset | y offset |
|-----------|--------------|----------|----------|
| 160px | 200x200 | -20 | -12 |
| 80px | 100x100 | -10 | -6 |
| 40px | 50x50 | -5 | -3 |

**比率: 子フレーム = 表示サイズ × 1.25, offset = 表示サイズ × 0.125 / 0.075**

### オフセット調整のコツ
- テキストがロゴの下部にある場合: y を負の値にして上にシフト
- テキストがロゴの右側にある場合: x を負の値にして左にシフト
- スクリーンショットで確認しながら微調整

---

## Step 6: アプリアイコンサイズ

### 必要サイズ
| 用途 | サイズ | 備考 |
|------|--------|------|
| デザインファイル内表示 | 160px | 基本サイズ |
| アプリアイコン（設定等） | 80px | Clip技法の縮小版 |
| ファビコン/小アイコン | 40px | 必要に応じて |
| App Store | 1024px | 最終書き出し時 |

### 80px版の作成
```javascript
U("{iconFrame80}", {clip: true, layout: "none", width: 80, height: 80, cornerRadius: [16,16,16,16]})
inner80=I("{iconFrame80}", {type: "frame", width: 100, height: 100, x: -10, y: -6})
// 同じ画像を適用
```

---

## Step 7: 決定バッジ + 記録

### 決定バッジの配置
```javascript
badge=I("{sectionId}", {type: "frame", fill: "#DCFCE7", cornerRadius: [8,8,8,8], padding: [6,12,6,12], layout: "horizontal", gap: 6})
badgeText=I(badge, {type: "text", content: "★ 決定", fontSize: 13, fontWeight: "600", fontFamily: "Outfit", textColor: "#166534"})
```

### 記録すべき情報
| 項目 | 例 |
|------|-----|
| 決定候補名 | R4-E |
| 画像ファイルパス | `./images/generated-1771119190840.png` |
| 美学キーワード | golden particle ring, neural topology, dark navy |
| フォントスタイル | Outfit, weight 300, letterSpacing 2-3 |
| ブランドカラー | Gold #D4A853, Teal #7DD3FC, Navy #0F172A |

この情報は Phase 2-4 で参照される。

---

## トラブルシューティング

### Q: AI生成画像が期待と違う
**A:** プロンプトを調整する。具体的な色（hex値）、形状、スタイルワードを追加。
複数バリエーションを生成して「最も近いもの」を選び、次ラウンドでさらに調整。

### Q: 決定ロゴと同じデザインの文字なし版が欲しい
**A:** AI再生成では不可能（非決定的）。Clip技法を使用して元画像から文字部分をクロップ。

### Q: 画像生成が真っ白/透明になる
**A:** G() のプロンプトが不適切か、画像サーバーの一時的な問題。再試行し、
fills プロパティを確認して `mode: "cover"` が設定されているか確認。

### Q: ロゴの解像度が低い
**A:** G() で生成される画像はデフォルトで適切な解像度。
App Store 用 1024px 等の高解像度は、最終フェーズで別途生成。
