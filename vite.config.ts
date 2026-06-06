import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'

// Two modes:
//  - `vite`        -> runs the demo app (index.html) for development
//  - `vite build`  -> builds the library (src/index.ts) into dist/
export default defineConfig({
  plugins: [
    react(),
    dts({ include: ['src'], rollupTypes: true }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WebEditor',
      fileName: 'web-editor',
    },
    rollupOptions: {
      // Don't bundle React into the library — the host app provides it.
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
  },
})
