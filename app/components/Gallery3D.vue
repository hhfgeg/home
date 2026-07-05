<template>
  <div class="gallery-3d-wrapper" ref="wrapperRef">
    <!-- HUD overlay -->
    <div class="gallery-hud" v-if="isLocked">
      <div class="hud-controls-hint">
        <span class="hud-key">W</span><span class="hud-key">A</span><span class="hud-key">S</span><span class="hud-key">D</span>
        <span class="hud-text">移动</span>
        <span class="hud-sep">|</span>
        <span class="hud-icon">🖱</span>
        <span class="hud-text">视角</span>
        <span class="hud-sep">|</span>
        <span class="hud-text">🖱 点击作品</span>
        <span class="hud-sep">|</span>
        <span class="hud-text">ESC 退出</span>
      </div>
    </div>

    <!-- Entry overlay for non-locked state -->
    <div class="gallery-entry" v-if="!isLocked" @click="enterGallery">
      <div class="entry-content">
        <div class="entry-icon">🏛️</div>
        <h2 class="entry-title">云中书作品廊</h2>
        <p class="entry-subtitle">点击进入3D画廊空间</p>
        <div class="entry-hint">
          <span class="hint-icon">🖱</span>
          <span>点击进入 · 鼠标移动视角 · WASD移动 · 点击作品查看详情</span>
        </div>
      </div>
    </div>

    <!-- Canvas container -->
    <div class="gallery-canvas" ref="canvasRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useGallery3D } from '~/composables/useGallery3D'
import type { WorkItem, SignatureItem } from '~/composables/useGallery3D'

const props = defineProps<{
  works: WorkItem[]
  signatures: SignatureItem[]
}>()

const emit = defineEmits<{
  'work-click': [work: WorkItem]
}>()

const wrapperRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLElement | null>(null)
const isLocked = ref(false)

let galleryCleanup: (() => void) | null = null

function enterGallery() {
  const threeCanvas = canvasRef.value?.querySelector('canvas')
  if (threeCanvas) {
    threeCanvas.requestPointerLock()
  }
}

function initGallery() {
  const { init, cleanup, addSignatureToWall } = useGallery3D(
    canvasRef,
    props.works,
    (work: WorkItem) => {
      document.exitPointerLock()
      emit('work-click', work)
    },
    ref(props.signatures)
  )
  galleryCleanup = cleanup
  init()

  // Watch for new signatures and add them to wall
  watch(
    () => props.signatures.length,
    (newLen, oldLen) => {
      if (newLen > oldLen) {
        const newSig = props.signatures[newLen - 1]
        if (newSig) {
          setTimeout(() => addSignatureToWall(newSig), 100)
        }
      }
    }
  )

  // Monitor pointer lock state for HUD
  function onPointerLockChange() {
    isLocked.value = document.pointerLockElement === canvasRef.value?.querySelector('canvas')
  }
  document.addEventListener('pointerlockchange', onPointerLockChange)

  // Store original cleanup to include removing our listener
  const originalCleanup = galleryCleanup!
  galleryCleanup = () => {
    document.removeEventListener('pointerlockchange', onPointerLockChange)
    originalCleanup()
  }
}

onMounted(() => {
  initGallery()
})

onUnmounted(() => {
  if (galleryCleanup) {
    galleryCleanup()
  }
})
</script>

<style scoped>
.gallery-3d-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #f5f0eb;
}

.gallery-canvas {
  width: 100%;
  height: 100%;
}

/* HUD overlay */
.gallery-hud {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 10px 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.hud-controls-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.hud-key {
  display: inline-block;
  background: #f0ece6;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 2px 8px;
  font-weight: 600;
  font-size: 12px;
  color: #555;
  min-width: 26px;
  text-align: center;
}

.hud-sep {
  color: #ccc;
  margin: 0 4px;
}

.hud-icon {
  font-size: 14px;
}

/* Entry overlay */
.gallery-entry {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, rgba(245, 240, 235, 0.6), rgba(245, 240, 235, 0.95));
  cursor: pointer;
  transition: opacity 0.5s;
}

.entry-content {
  text-align: center;
  animation: floatUp 3s ease-in-out infinite;
}

.entry-icon {
  font-size: 72px;
  margin-bottom: 16px;
  animation: gentlePulse 2s ease-in-out infinite;
}

.entry-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 48px;
  font-weight: 300;
  color: #3a3540;
  margin: 0 0 8px;
  letter-spacing: 6px;
}

.entry-subtitle {
  font-size: 18px;
  color: #999;
  margin: 0 0 40px;
  letter-spacing: 2px;
}

.entry-hint {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 12px 28px;
  color: #888;
  font-size: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

@keyframes floatUp {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes gentlePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@media (max-width: 768px) {
  .entry-title {
    font-size: 32px;
  }
  .entry-subtitle {
    font-size: 15px;
  }
  .entry-hint {
    font-size: 12px;
    padding: 10px 20px;
  }
}
</style>
