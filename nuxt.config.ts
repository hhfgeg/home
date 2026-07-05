// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devServer: {
    port: 8871,
  },
  devtools: { enabled: true },
  app: {
    head: {
      title: '云中书作品廊 - AI与创造的边界',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '以笔名"云中书"为核心的个人主页，展示AI主题作品，在3D画廊中探索创造力的边界。' },
        { property: 'og:title', content: '云中书作品廊' },
        { property: 'og:description', content: '在AI与人类创造力的边界探索' }
      ]
    }
  },
  css: ['assets/css/main.css'],
  vite: {
    optimizeDeps: {
      include: ['three']
    }
  }
})
