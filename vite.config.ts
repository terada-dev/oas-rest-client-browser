import { resolve } from 'path'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    lib: {
      // ライブラリのエントリーポイントを指定
      entry: resolve(import.meta.dirname, 'src/main.ts'),
      // グローバル変数として読み込まれた際のライブラリ名
      name: 'OasRestClientFrontend',
      // 出力されるファイル名のベース
      fileName: 'oas-rest-client-frontend',
      // 出力するモジュール形式（ES Module と CommonJS）
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      // ライブラリ内にバンドルせず、利用側に用意してもらう依存関係（ある場合）
      external: ['axios', 'zod'],
      output: {
        globals: {}
      }
    }
  },
  resolve: {
    alias: {
      '#': path.resolve(import.meta.dirname, './src')
    }
  }
})
