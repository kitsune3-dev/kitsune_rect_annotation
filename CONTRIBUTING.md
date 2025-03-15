プロジェクト参加手順
===

## 開発環境構築

Ubuntu 24.04 LTSを前提にしています

```
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 新規作成

```
npm create vite@latest rectangle-annotation-tool -- --template react-ts
cd rectangle-annotation-tool
npm install
npm install classnames

```

Tailwind CSSのインストール
```
npm install -D tailwindcss postcss autoprefixer
```

`npx tailwindcss init -p` でエラーになるため代替手段
```
# tailwind.config.jsを作成
cat > tailwind.config.js << 'EOL'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOL

# postcss.config.jsを作成
cat > postcss.config.js << 'EOL'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOL

# src/index.cssにTailwindのディレクティブを追加
cat > src/index.css << 'EOL'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOL
```

## 開発サーバーを起動

```
npm run dev
```

## ビルド