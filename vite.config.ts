import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'

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
      external: [
        'react',
        'react-dom',
        'react-dom/server',
        'react/jsx-runtime',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-dom/server': 'ReactDOMServer',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
  },
})
