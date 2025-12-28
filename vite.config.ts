// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   server: {
//     port: 3000
//   }
// });

// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy all /api requests to the backend server (http://localhost:5000)
      // This avoids cross-origin calls in development.
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // rewrite not necessary because paths are same, but you can use it if backend prefix differs
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
      // Proxy uploaded files to backend
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
