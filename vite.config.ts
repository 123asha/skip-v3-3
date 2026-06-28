import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  // Default base is the GitHub Pages sub-path (used by the live preview).
  // For the root-domain production build (skip.design) run with VITE_BASE=/
  // (see the "build:beget" npm script) so assets resolve from the domain root.
  base: process.env.VITE_BASE ?? '/skip-design/',
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // Broaden browser support — transpile down so older Safari doesn't choke on
  // newer syntax and white-screen at module load.
  build: {
    target: ['es2018', 'safari12'],
  },
})
