rectangle-annotation-tool/
├── public/
│   └── test.png                    # アノテーション用サンプル画像
├── src/
│   ├── assets/                     # 静的アセット
│   ├── components/                 # コンポーネント
│   │   ├── AnnotationCanvas.tsx    # キャンバスコンポーネント
│   │   ├── LabelSelector.tsx       # ラベル選択コンポーネント
│   │   ├── ModeSelector.tsx        # モード選択コンポーネント
│   │   ├── Sidebar.tsx             # サイドバーコンポーネント
│   │   ├── ZoomControls.tsx        # ズームコントロールコンポーネント
│   │   └── Legend.tsx              # 凡例コンポーネント
│   ├── contexts/                   # コンテキスト
│   │   └── AnnotationContext.tsx   # アノテーション状態管理コンテキスト
│   ├── hooks/                      # カスタムフック
│   │   ├── useAnnotationState.ts   # アノテーション状態管理フック
│   │   ├── useCanvas.ts            # キャンバス操作フック
│   │   └── useKeyboardShortcuts.ts # キーボードショートカットフック
│   ├── types/                      # 型定義
│   │   └── types.ts                # アプリケーションの型定義
│   ├── App.tsx                     # メインアプリケーションコンポーネント
│   ├── main.tsx                    # エントリーポイント
│   └── index.css                   # グローバルスタイル
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.ts
└── README.md
