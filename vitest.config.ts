import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '~': resolve(__dirname, '.'),
      '~/data': resolve(__dirname, 'app', 'data'),
      '~/composables': resolve(__dirname, 'app', 'composables'),
      '~/components': resolve(__dirname, 'app', 'components'),
      '~/assets': resolve(__dirname, 'app', 'assets')
    }
  },
  test: {
    globals: true,
    environment: 'happy-dom'
  }
})
