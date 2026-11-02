import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Keep the heavy 3D stack in its own lazily loaded chunks.
        // Shared eager deps get their own chunk; otherwise Rollup hoists react into the lazy r3f
        // chunk and the entry would statically import (and preload) the whole 3D stack.
        manualChunks(id) {
          if (id.includes('vite/preload-helper') || id.includes('commonjsHelpers')) return 'vendor'
          if (/node_modules\/(react|react-dom|scheduler|zustand|gsap|lenis|use-sync-external-store)\//.test(id)) return 'vendor'
          if (id.includes('node_modules/three/')) return 'three'
          if (id.includes('postprocessing') || id.includes('@react-three')) return 'r3f'
          return undefined
        },
      },
    },
  },
})
