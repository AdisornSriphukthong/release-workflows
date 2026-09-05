import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // The site is served from https://<user>.github.io/release-workflows/, not
  // from a domain root, so every built asset URL needs that prefix. Without it
  // the bundle is requested at /assets/… and the page renders blank.
  base: '/release-workflows/',
  plugins: [react()],
})
