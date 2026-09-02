import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { createInquiryHandler } from './server/form-api.ts'

function inquiryApi(): Plugin {
  return {
    name: 'ruike-inquiry-api',
    configureServer(server) {
      server.middlewares.use('/api/project-inquiries', createInquiryHandler())
    },
  }
}

export default defineConfig({
  plugins: [react(), inquiryApi()],
})
