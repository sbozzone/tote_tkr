import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''
const isUserPagesRepository = repositoryName.endsWith('.github.io')
const githubPagesBase =
  process.env.GITHUB_ACTIONS && repositoryName
    ? isUserPagesRepository
      ? '/'
      : `/${repositoryName}/`
    : '/'

const base = process.env.VITE_BASE_PATH ?? githubPagesBase

// https://vite.dev/config/
export default defineConfig({
  base,
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/database', 'firebase/storage'],
          scanner: ['html5-qrcode'],
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
})
