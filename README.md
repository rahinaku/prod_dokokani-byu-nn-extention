# Chrome Extension with TypeScript

TypeScriptで開発されたChrome拡張機能のテンプレートプロジェクトです。

## 機能

- ポップアップUIから現在のタブ情報を表示
- TypeScriptによる型安全な開発
- Webpackによるバンドル
- ESLint + Prettierによるコード品質管理
- Huskyによるpre-commitフック

## 必要な環境

- Node.js (推奨: v16以降)
- pnpm v9.2.0以降

## セットアップ

### 依存パッケージのインストール

```bash
pnpm install
```

## 開発

### 開発モード（ウォッチモード）

```bash
pnpm dev
```

ファイルの変更を監視し、自動的に再ビルドします。

### TypeScriptのコンパイル（ウォッチモード）

```bash
pnpm watch
```

### 本番用ビルド

```bash
pnpm build:prod
```

## コード品質

### リント

```bash
# リントチェック
pnpm lint

# リントエラーの自動修正
pnpm lint:fix
```

### フォーマット

```bash
# フォーマットチェック
pnpm format:check

# フォーマット実行
pnpm format
```

### リント + フォーマット一括実行

```bash
pnpm fix
```

## Chrome拡張機能のインストール

1. Chromeで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. このプロジェクトの `public` フォルダを選択

## プロジェクト構造

```
.
├── public/              # 拡張機能の公開ファイル
│   ├── manifest.json   # 拡張機能のマニフェストファイル
│   ├── popup.html      # ポップアップのHTML
│   ├── popup.js        # コンパイル済みポップアップスクリプト
│   ├── content.js      # コンテンツスクリプト
│   └── background.js   # バックグラウンドスクリプト
├── src/                # TypeScriptソースコード
│   └── popup.ts        # ポップアップのTypeScriptソース
├── package.json        # プロジェクト設定
└── tsconfig.json       # TypeScript設定
```

## 使い方

1. 拡張機能アイコンをクリックしてポップアップを開く
2. 「Action」ボタンをクリックすると現在のタブのタイトルが表示される

## ライセンス

MIT
