import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 相対パスでアセットにアクセスするように設定
  server: {
    host: '0.0.0.0',
    port: 3000,
    // CORS関連の設定
    cors: true,
    allowedHosts: [
      'ollama.work.kitsune3.net'
    ],
    hmr: {
      overlay: true,
    },
  },
  build: {
    // ビルド時のソースマップを有効化
    sourcemap: true,
  },
  // アセットの処理方法を調整
  assetsInclude: ['**/*.png'],
});