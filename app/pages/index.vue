<template>
  <ThreeGallery />
</template>

<script setup lang="ts">
import ThreeGallery from '~/components/gallery/ThreeGallery.vue'

useHead({
  title: '云中书 · AI 作品廊',
  meta: [
    { name: 'description', content: '云中书的AI作品互动展示廊 - 在三维空间中漫步欣赏AI创作' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0, user-scalable=no' },
  ],
})
</script>
