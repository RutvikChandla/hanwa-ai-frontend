import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173, // Expose to the local network
    proxy: {
      "/api/v1": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
})
