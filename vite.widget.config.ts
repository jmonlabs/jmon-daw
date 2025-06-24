import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
  build: {
    lib: {
      entry: 'src/widget/index.ts',
      name: 'SolidDAW',
      fileName: (format) => `solid-daw.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: [],
      output: {
        exports: 'named',
        globals: {
          // Define any global dependencies here
        }
      }
    },
    target: 'esnext',
    sourcemap: true,
    minify: 'terser'
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});