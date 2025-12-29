import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// You might need to import 'path' if it's not already available
import path from 'path' 

export default defineConfig({
  plugins: [react(),tailwindcss()],
  resolve: {
    alias: {
      // This forces all packages to use the same installed 'react'
      'react': path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    },
  },
})