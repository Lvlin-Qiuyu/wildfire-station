// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-01',
  devtools: { enabled: false },
  ssr: true,

  app: {
    baseURL: '/wildfire-station/',
    head: {
      htmlAttrs: { lang: 'zh-CN', 'data-theme': 'light' },
      title: '野火小站',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '野火小站 —— 一个好用的在线工具箱。' },
        { name: 'theme-color', content: '#faf8f5' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/blog', '/contact'],
    },
  },
})
