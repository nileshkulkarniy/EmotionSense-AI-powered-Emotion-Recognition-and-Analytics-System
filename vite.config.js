import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/video_feed': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/start_camera': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/stop_camera': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/analyze_text': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/analyze_voice_emotion': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/emotion_data': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
})