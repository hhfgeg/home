<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-container">
          <button class="close-btn" @click="$emit('close')">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <!-- 作品卡片 -->
          <div v-if="work" class="work-detail">
            <!-- 标题区 -->
            <div class="detail-header">
              <div class="header-glow" :style="{ background: accentColor }"></div>
              <h2 class="detail-name">{{ work.name }}</h2>
              <div class="detail-tags">
                <span
                  v-for="tag in work.tags"
                  :key="tag"
                  class="tag"
                  :style="{ borderColor: accentColor + '66', color: accentColor }"
                >
                  {{ tag }}
                </span>
              </div>
            </div>

            <!-- 媒体区 -->
            <div class="detail-media">
              <!-- 视频 -->
              <div v-if="work.videoUrl" class="video-container">
                <video
                  ref="videoRef"
                  :src="work.videoUrl"
                  class="work-video"
                  controls
                  preload="metadata"
                />
              </div>
              <!-- 缩略图 -->
              <div v-else class="thumbnail-placeholder" :style="{ borderColor: accentColor + '44' }">
                <div class="placeholder-icon" :style="{ color: accentColor }">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- 内容区 -->
            <div class="detail-content">
              <div class="section">
                <h3 class="section-title">
                  <span class="section-line" :style="{ background: accentColor }"></span>
                  作品简介
                </h3>
                <p class="desc-text">{{ work.description }}</p>
              </div>

              <div class="section">
                <h3 class="section-title">
                  <span class="section-line" :style="{ background: accentColor }"></span>
                  创作理念
                </h3>
                <p class="concept-text">{{ work.concept }}</p>
              </div>

              <!-- 链接按钮 -->
              <div class="detail-actions">
                <a
                  :href="work.link"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link-btn"
                  :style="{
                    borderColor: accentColor + '66',
                    color: accentColor,
                    boxShadow: `0 0 20px ${accentColor}22`
                  }"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13V19a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  访问作品
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Work } from '~/types/gallery'
import { computed } from 'vue'

const props = defineProps<{
  work: Work | null
  visible: boolean
}>()

defineEmits<{
  close: []
}>()

const videoRef = ref<HTMLVideoElement | null>(null)

// 根据标签获取强调色
const accentColor = computed(() => {
  if (!props.work || !props.work.tags[0]) return '#00fff5'
  const tag = props.work.tags[0]
  const map: Record<string, string> = {
    NLP: '#00fff5',
    DevTools: '#0066ff',
    AIGC: '#b400ff',
    TTS: '#ff00ff',
    '3D': '#00ff88',
    医疗AI: '#ff6600',
    叙事AI: '#ff0066',
    数据分析: '#ffff00',
  }
  for (const [key, color] of Object.entries(map)) {
    if (tag.includes(key) || key.includes(tag)) return color
  }
  return '#00fff5'
})

// 关闭时暂停视频
watch(() => props.visible, (val) => {
  if (!val && videoRef.value) {
    videoRef.value.pause()
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  padding: 20px;
}

.modal-container {
  position: relative;
  width: 100%;
  max-width: 560px;
  max-height: 85vh;
  overflow-y: auto;
  background: rgba(15, 15, 30, 0.95);
  border: 1px solid rgba(0, 255, 245, 0.15);
  border-radius: 16px;
  box-shadow:
    0 0 40px rgba(0, 255, 245, 0.05),
    0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-container::-webkit-scrollbar {
  width: 4px;
}
.modal-container::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 245, 0.2);
  border-radius: 2px;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: #aaa;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* 内容 */
.work-detail {
  padding: 0;
}

/* 标题区 */
.detail-header {
  position: relative;
  padding: 32px 24px 20px;
  overflow: hidden;
}

.header-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  opacity: 0.6;
}

.detail-name {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 12px;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #fff, v-bind(accentColor));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 4px 12px;
  border: 1px solid;
  border-radius: 20px;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.2);
}

/* 媒体区 */
.detail-media {
  padding: 0 24px;
}

.video-container {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 255, 245, 0.1);
}

.work-video {
  width: 100%;
  display: block;
  border-radius: 12px;
  background: #000;
}

.thumbnail-placeholder {
  aspect-ratio: 16 / 9;
  border: 1px solid;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
}

.placeholder-icon {
  opacity: 0.3;
}

/* 内容区 */
.detail-content {
  padding: 24px;
}

.section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  color: #888;
  margin: 0 0 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-line {
  display: inline-block;
  width: 3px;
  height: 14px;
  border-radius: 2px;
}

.desc-text {
  color: #ccc;
  font-size: 14px;
  line-height: 1.8;
  margin: 0;
}

.concept-text {
  color: #999;
  font-size: 13px;
  line-height: 1.9;
  margin: 0;
}

.detail-actions {
  margin-top: 24px;
}

.link-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border: 1px solid;
  border-radius: 8px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  background: rgba(0, 0, 0, 0.3);
}

.link-btn:hover {
  transform: translateY(-1px);
}

/* 模态框过渡 */
.modal-enter-active {
  transition: opacity 0.3s ease;
}
.modal-enter-active .modal-container {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-leave-active .modal-container {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-enter-from {
  opacity: 0;
}
.modal-enter-from .modal-container {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}
.modal-leave-to {
  opacity: 0;
}
.modal-leave-to .modal-container {
  transform: scale(0.95);
  opacity: 0;
}

@media (max-width: 768px) {
  .modal-container {
    max-width: calc(100vw - 32px);
    max-height: 80vh;
    border-radius: 12px;
  }

  .detail-name {
    font-size: 22px;
  }

  .detail-content {
    padding: 16px;
  }
}
</style>
