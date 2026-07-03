import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const isProjectPage = Boolean(
  process.env.GITHUB_ACTIONS &&
    repositoryName &&
    !repositoryName.endsWith('.github.io'),
)

// https://vite.dev/config/
export default defineConfig({
  base: isProjectPage ? `/${repositoryName}/` : '/',
  plugins: [vue(), tailwindcss()],
  server: {
    proxy: {
      '/api/data-gov': {
        target: 'https://data.gov.tw',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/data-gov/, ''),
      },
      '/api/dgpa/file': {
        target: 'https://www.dgpa.gov.tw',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dgpa\/file/, '/FileConversion'),
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
