<template>
  <section id="signature-wall" class="signature-section">
    <div class="signature-container">
      <div class="section-header">
        <span class="section-tag">签名墙</span>
        <h2 class="section-title">留下足迹</h2>
        <p class="section-subtitle">在云端写下你的签名与感悟</p>
      </div>

      <!-- Signature wall display (2D fallback / preview) -->
      <div class="signature-board">
        <div v-if="signatures.length === 0" class="signature-empty">
          <div class="empty-icon">🖊️</div>
          <p class="empty-text">还没有签名，来做第一个留下印记的人吧</p>
        </div>

        <div v-else class="signature-grid">
          <div v-for="sig in signatures" :key="sig.id"
            class="signature-card"
            @mouseenter="hoveredSig = sig"
            @mouseleave="hoveredSig = null"
          >
            <img :src="sig.signatureDataUrl" alt="签名" class="signature-img" />
            <span class="signature-name">{{ sig.name }}</span>

            <!-- Hover comment tooltip -->
            <Transition name="tooltip">
              <div v-if="hoveredSig?.id === sig.id && sig.comment" class="signature-tooltip">
                <p class="tooltip-comment">{{ sig.comment }}</p>
                <span class="tooltip-time">{{ formatTime(sig.createdAt) }}</span>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <!-- Write new signature -->
      <div class="signature-write">
        <button class="btn-signature" @click="showModal = true">
          <span class="btn-icon">🖊️</span>
          <span>留下我的签名</span>
        </button>
      </div>
    </div>

    <!-- Signature input modal -->
    <SignatureInput
      v-if="showModal"
      @submit="onSignatureSubmit"
      @close="showModal = false"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { SignatureItem } from '~/composables/useGallery3D'
import SignatureInput from './SignatureInput.vue'

const props = defineProps<{
  signatures: SignatureItem[]
}>()

const emit = defineEmits<{
  'add-signature': [sig: Omit<SignatureItem, 'id' | 'createdAt' | 'position'>]
}>()

const showModal = ref(false)
const hoveredSig = ref<SignatureItem | null>(null)

function onSignatureSubmit(sig: { name: string; comment: string; signatureDataUrl: string }) {
  emit('add-signature', sig)
  showModal.value = false
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.signature-section {
  padding: 100px 24px;
  background: linear-gradient(180deg, #f5f0eb 0%, #faf8f5 50%, #f0ebe0 100%);
  position: relative;
}

.signature-container {
  max-width: 800px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 48px;
}

.section-tag {
  display: inline-block;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 4px;
  color: #a0b8c8;
  background: rgba(160, 184, 200, 0.1);
  padding: 6px 20px;
  border-radius: 20px;
  margin-bottom: 16px;
}

.section-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 40px;
  font-weight: 300;
  color: #3a3540;
  margin: 0 0 12px;
  letter-spacing: 4px;
}

.section-subtitle {
  font-size: 17px;
  color: #999;
  margin: 0;
}

/* Signature board */
.signature-board {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  border: 1px solid rgba(200, 190, 175, 0.2);
  padding: 32px;
  min-height: 200px;
  margin-bottom: 32px;
}

.signature-empty {
  text-align: center;
  padding: 40px 0;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  color: #bbb;
  font-size: 15px;
  margin: 0;
}

.signature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.signature-card {
  position: relative;
  background: #fafaf5;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #efe9db;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  cursor: default;
}

.signature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  border-color: rgba(135, 206, 235, 0.3);
}

.signature-img {
  width: 100%;
  max-height: 60px;
  object-fit: contain;
  opacity: 0.8;
}

.signature-name {
  font-size: 13px;
  color: #777;
  letter-spacing: 1px;
}

.signature-tooltip {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  border-radius: 12px;
  padding: 14px 18px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  border: 1px solid #efe9db;
  min-width: 200px;
  z-index: 10;
  text-align: center;
}

.signature-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 8px solid transparent;
  border-top-color: #fff;
}

.tooltip-comment {
  font-size: 14px;
  color: #555;
  margin: 0 0 8px;
  line-height: 1.6;
}

.tooltip-time {
  font-size: 11px;
  color: #bbb;
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(6px);
}

/* Write button */
.signature-write {
  text-align: center;
}

.btn-signature {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  padding: 14px 32px;
  border-radius: 16px;
  border: 1px solid rgba(135, 206, 235, 0.3);
  background: linear-gradient(135deg, rgba(184, 223, 240, 0.15), rgba(135, 206, 235, 0.08));
  color: #5a8a9e;
  cursor: pointer;
  transition: all 0.3s;
  letter-spacing: 1px;
}

.btn-signature:hover {
  background: linear-gradient(135deg, rgba(184, 223, 240, 0.25), rgba(135, 206, 235, 0.15));
  border-color: rgba(135, 206, 235, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(135, 206, 235, 0.12);
}

.btn-icon {
  font-size: 20px;
}

@media (max-width: 768px) {
  .signature-section {
    padding: 80px 20px;
  }

  .section-title {
    font-size: 30px;
  }

  .signature-board {
    padding: 20px;
  }

  .signature-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}
</style>
