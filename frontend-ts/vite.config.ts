import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5174,    
    watch: {
      usePolling: true
    }
  },
  build: {
    chunkSizeWarningLimit: 350, 
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'; 
          }
        }
      }
    }
  },
  plugins: [
    visualizer({ filename: 'bundle-analysis.html', open: false })
  ]
});