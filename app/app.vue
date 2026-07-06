<template>
  <div class="app">
    <NavigationBar />

    <main>
      <section id="gallery" class="app-gallery">
        <Gallery3D
          :works="worksData.works"
          :signatures="signatures"
          :author="worksData.author"
          @add-signature="onAddSignature"
        />
        <!-- Scroll hint -->
        <div class="scroll-hint" v-if="showScrollHint">
          <div class="scroll-arrow">↓</div>
          <span>向下滚动查看更多</span>
        </div>
      </section>

      <SignatureWall :signatures="signatures" @add-signature="onAddSignature" />

      <AboutSection :author="worksData.author" />

      <footer class="app-footer">
        <p class="footer-text">云中书 · 在云中书写</p>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import NavigationBar from '~/components/NavigationBar.vue'
import Gallery3D from '~/components/Gallery3D.vue'
import SignatureWall from '~/components/SignatureWall.vue'
import AboutSection from '~/components/AboutSection.vue'
import type { SignatureItem } from '~/composables/useGallery3D'

import worksJson from '~/data/works.json'
const worksData = worksJson
const signatures = ref<SignatureItem[]>(loadSignatures())
const showScrollHint = ref(true)

onMounted(() => {
  const onScroll = () => {
    showScrollHint.value = window.scrollY < 100
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onUnmounted(() => window.removeEventListener('scroll', onScroll))
})

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
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

.app-gallery {
  height: 100vh;
  position: relative;
}

/* Scroll hint */
.scroll-hint {
  position: absolute;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #aaa;
  font-size: 13px;
  letter-spacing: 1px;
  animation: floatUpDown 2s ease-in-out infinite;
  z-index: 5;
  pointer-events: none;
}

.scroll-arrow {
  font-size: 24px;
  animation: bounce 1.5s ease-in-out infinite;
}

@keyframes floatUpDown {
  0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.6; }
  50% { transform: translateX(-50%) translateY(-8px); opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}

.app-footer {
  text-align: center;
  padding: 20px;
  font-size: 14px;
  color: #999;
  background: #faf8f5;
  border-top: 1px solid #efe9db;
}

.footer-text {
  margin: 0;
  letter-spacing: 1px;
}
</style>
