import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer plugin (uncomment to analyze bundle size)
    // visualizer({
    //   open: true,
    //   gzipSize: true,
    //   brotliSize: true,
    //   filename: 'dist/stats.html',
    // }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils'),
      '@pages': resolve(__dirname, './src/pages'),
      '@state': resolve(__dirname, './src/state'),
      '@tests': resolve(__dirname, './src/tests'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Generate source maps for debugging (remove in production for smaller bundle)
    sourcemap: false,
    // Minify output
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    // Chunk size warning limit (in kB)
    chunkSizeWarningLimit: 1000,
    // Rollup options for advanced optimization
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'utils-vendor': ['axios', 'zustand'],
        },
        // Naming chunks
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // CSS code splitting
    cssCodeSplit: true,
  },
  // Dependencies to optimize (pre-bundle)
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'zustand',
    ],
    exclude: [
      '@mui/material',
      '@mui/icons-material',
    ],
  },
  // CSS optimization
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  // Performance improvements
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'ignore' },
  },
});
