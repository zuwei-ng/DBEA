import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-proxy-1': {
        target: 'https://personal-urfnoedc.outsystemscloud.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy-1/, ''),
      },
      '/api-proxy-2': {
        target: 'https://personal-p2jf2c9n.outsystemscloud.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy-2/, ''),
      },
      '/s3-proxy': {
        target: 'https://smuedu-dev.outsystemsenterprise.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/s3-proxy/, ''),
      }
    }
  }
})
