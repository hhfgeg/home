<template>
  <div class="app">
    <NavigationBar />

    <main>
      <!-- Hero / Gallery section -->
      <section id="gallery" class="app-gallery">
        <Gallery3D
          :works="worksData.works"
          :signatures="signatures"
        />
      </section>

      <!-- About section -->
      <AboutSection />

      <!-- Signature wall section -->
      <SignatureWall
        :signatures="signatures"
        @add-signature="onAddSignature"
      />

      <!-- Contact section -->
      <ContactSection />
    </main>

    <footer class="app-footer">
      <p class="footer-text">云中书 · 在云中书写</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import NavigationBar from '~/components/NavigationBar.vue'
import Gallery3D from '~/components/Gallery3D.vue'
import AboutSection from '~/components/AboutSection.vue'
import SignatureWall from '~/components/SignatureWall.vue'
import ContactSection from '~/components/ContactSection.vue'
import type { SignatureItem } from '~/composables/useGallery3D'

// Load works data
import worksJson from '~/data/works.json'

const worksData = worksJson
const signatures = ref<SignatureItem[]>(loadSignatures())

function onAddSignature(sig: { name: string; comment: string; signatureDataUrl: string }) {
  const newSig: SignatureItem = {
    id: `sig-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name: sig.name,
    comment: sig.comment,
    signatureDataUrl: sig.signatureDataUrl,
    createdAt: new Date().toISOString(),
    // Random position on the signature wall (right wall)
    position: {
      x: 0,
      y: -2 + Math.random() * 6,
      z: -5 + Math.random() * 10
    }
  }

  signatures.value.push(newSig)
  saveSignatures(signatures.value)
}

function loadSignatures(): SignatureItem[] {
  if (import.meta.client) {
    try {
      const stored = localStorage.getItem('yunzhongshu-signatures')
      if (stored) return JSON.parse(stored)
    } catch {
      // ignore
    }
  }
  return []
}

function saveSignatures(sigs: SignatureItem[]) {
  if (import.meta.client) {
    try {
      localStorage.setItem('yunzhongshu-signatures', JSON.stringify(sigs))
    } catch {
      // ignore
    }
  }
}

// SEO Meta
useHead({
  title: '云中书作品廊 - AI与创造的边界',
  meta: [
    { name: 'description', content: '以笔名"云中书"为核心的个人主页，展示AI主题作品，在3D画廊中探索创造力的边界。' },
    { name: 'keywords', content: '云中书,AI艺术,生成艺术,人工智能,创意技术,3D画廊' },
    { property: 'og:title', content: '云中书作品廊' },
    { property: 'og:description', content: '在AI与人类创造力的边界探索' },
    { property: 'og:type', content: 'website' }
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
  ]
})
</script>

<style>
/* Global styles are imported via nuxt.config.ts css option */
</style>
