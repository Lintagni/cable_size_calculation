import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: { preset: 'default' },
  preset: {
    ...minimal2023Preset,
    maskable: {
      sizes: [512],
      padding: 0.1,
      resizeOptions: { background: '#1a1625' },
    },
    apple: {
      sizes: [180],
      padding: 0.1,
      resizeOptions: { background: '#1a1625' },
    },
  },
  images: ['public/logo.svg'],
})
