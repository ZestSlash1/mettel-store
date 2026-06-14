import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Honor the port `vercel dev` assigns via $PORT; fall back to 5173 for a
    // plain `npm run dev`. Hardcoding 5173 makes `vercel dev` fail with
    // "Failed to detect a server running on port <random>" because Vite would
    // ignore the port Vercel expects it to listen on.
    port: Number(process.env.PORT) || 5173,
    // Don't auto-open a browser. Under `vercel dev` the app is served on the
    // Vercel port (e.g. :3000), not Vite's own port.
    open: false,
  },
})
