<template>
  <Transition name="modal">
    <div v-if="work" class="work-detail-overlay" @click.self="close">
      <div class="work-detail-modal" @click.stop>
        <!-- Close button -->
        <button class="detail-close" @click="close" aria-label="关闭">
          <span>✕</span>
        </button>

        <!-- Header -->
        <div class="detail-header">
          <span class="detail-category">{{ work.category }}</span>
          <h2 class="detail-title">{{ work.name }}</h2>
          <p class="detail-summary">{{ work.summary }}</p>
        </div>

        <!-- Content -->
        <div class="detail-body">
          <div class="detail-description">
            <h3 class="detail-subtitle">创作理念</h3>
            <p class="detail-text">{{ work.description }}</p>
          </div>

          <!-- Video section -->
          <div v-if="work.video" class="detail-video">
            <h3 class="detail-subtitle">体验视频</h3>
            <div class="video-container">
              <video :src="work.video" controls class="video-player"></video>
            </div>
          </div>

          <!-- Tags -->
          <div class="detail-tags">
            <span v-for="tag in work.tags" :key="tag" class="detail-tag">{{ tag }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="detail-actions">
          <a v-if="work.link" :href="work.link" target="_blank" rel="noopener" class="btn-primary">
            🔗 访问作品
          </a>
          <button class="btn-secondary" @click="close">
            返回画廊
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import type { WorkItem } from '~/composables/useGallery3D'

const props = defineProps<{
  work: WorkItem | null
}>()

const emit = defineEmits<{
  close: []
}>()

function close() {
  emit('close')
}

// Handle ESC key
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

watch(() => props.work, (val) => {
  // Guard against SSR where document is not available
  if (typeof document === 'undefined') return

  if (val) {
    document.addEventListener('keydown', handleKeydown)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  }
}, { immediate: true })

onUnmounted(() => {
  if (typeof document === 'undefined') return
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.work-detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.work-detail-modal {
  position: relative;
  background: #fff;
  border-radius: 24px;
  max-width: 600px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  padding: 40px 36px 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.detail-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  color: #888;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.detail-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
}

.detail-header {
  text-align: center;
  margin-bottom: 28px;
}

.detail-category {
  display: inline-block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: #87ceeb;
  background: rgba(135, 206, 235, 0.1);
  padding: 4px 14px;
  border-radius: 12px;
  margin-bottom: 12px;
}

.detail-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 28px;
  font-weight: 300;
  color: #3a3540;
  margin: 0 0 10px;
  letter-spacing: 2px;
}

.detail-summary {
  font-size: 15px;
  color: #888;
  margin: 0;
  line-height: 1.7;
}

.detail-body {
  margin-bottom: 28px;
}

.detail-subtitle {
  font-size: 14px;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0 0 12px;
  font-weight: 500;
}

.detail-text {
  font-size: 15px;
  color: #555;
  line-height: 1.9;
  margin: 0 0 20px;
}

.detail-video {
  margin-bottom: 20px;
}

.video-container {
  border-radius: 14px;
  overflow: hidden;
  background: #f5f5f5;
}

.video-player {
  width: 100%;
  display: block;
  border-radius: 14px;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-tag {
  font-size: 12px;
  color: #7a9eac;
  background: rgba(135, 206, 235, 0.08);
  padding: 5px 14px;
  border-radius: 14px;
  letter-spacing: 0.5px;
}

.detail-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-primary {
  flex: 1;
  text-align: center;
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  padding: 12px 24px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #87ceeb, #add8e6);
  color: #fff;
  transition: all 0.3s;
  box-shadow: 0 4px 16px rgba(135, 206, 235, 0.25);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(135, 206, 235, 0.35);
}

.btn-secondary {
  padding: 12px 24px;
  font-size: 15px;
  border-radius: 14px;
  border: 1px solid #e0dcd5;
  background: #fafaf5;
  color: #888;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary:hover {
  background: #f0ede5;
  color: #555;
}

/* Transitions */
.modal-enter-active {
  transition: opacity 0.3s ease;
}
.modal-enter-active .work-detail-modal {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-leave-active .work-detail-modal {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-enter-from {
  opacity: 0;
}
.modal-enter-from .work-detail-modal {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
.modal-leave-to {
  opacity: 0;
}
.modal-leave-to .work-detail-modal {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}

@media (max-width: 768px) {
  .work-detail-modal {
    padding: 28px 24px 24px;
    max-height: 90vh;
  }

  .detail-title {
    font-size: 24px;
  }
}
</style>
