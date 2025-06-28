import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  build: {
    outDir: 'public',
    emptyOutDir: false, // Don't clear the public directory
    sourcemap: mode === 'development' ? 'inline' : false, // Source maps for development
    minify: mode === 'production', // Only minify in production
    rollupOptions: {
      input: {
        dashboard: resolve(__dirname, 'src/client/dashboard.ts'),
        'bot-invite': resolve(__dirname, 'src/client/bot-invite.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        format: 'es', // ES modules format for browser
        globals: {},
        inlineDynamicImports: false,
      },
    },
  },
  server: {
    port: 5173,
    cors: true,
  },
})); 