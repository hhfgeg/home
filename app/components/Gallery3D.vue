<template>
  <div class="gallery-3d-wrapper" ref="wrapperRef">
    <!-- HUD overlay -->
    <div class="gallery-hud" v-if="entered">
      <!-- Focus mode hint -->
      <div class="hud-controls-hint" v-if="focused">
        <span class="hud-icon">🔍</span>
        <span class="hud-text">正在查看：</span>
        <span class="hud-focus-name">{{ focusedWorkName }}</span>
        <span class="hud-sep">·</span>
        <span class="hud-text">点击任意处或 ESC 返回</span>
      </div>
      <!-- Normal controls -->
      <div class="hud-controls-hint" v-else>
        <span class="hud-key">W</span><span class="hud-key">A</span><span class="hud-key">S</span><span class="hud-key">D</span>
        <span class="hud-text">移动</span>
        <span class="hud-sep">·</span>
        <span class="hud-icon">👆</span>
        <span class="hud-text">点击地面</span>
        <span class="hud-sep">·</span>
        <span class="hud-icon">🖱</span>
        <span class="hud-text">右键旋转</span>
        <span class="hud-btn" @click.stop="showSigModal = true">🖊 签名</span>
        <span class="hud-btn" @click="doReset">↺ 复位</span>
      </div>
    </div>

    <!-- Signature input modal -->
    <SignatureInput
      v-if="showSigModal"
      @submit="onSigSubmit"
      @close="showSigModal = false"
    />

    <!-- Entry overlay -->
    <Transition name="entry-fade">
      <div class="gallery-entry" v-if="!entered" @click="doEnter">
        <div class="entry-content">
          <div class="entry-icon">🏛️</div>
          <h2 class="entry-title">云中书作品廊</h2>
          <p class="entry-subtitle">点击进入3D画廊空间</p>
          <div class="entry-hint">
            <span class="hint-icon">👆</span>
            <span>WASD移动 · 点击地面移动 · 右键旋转视角 · 滚轮缩放 · 点击作品聚焦</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Canvas container -->
    <div class="gallery-canvas" ref="canvasRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useGallery3D } from '~/composables/useGallery3D'
import type { WorkItem, SignatureItem } from '~/composables/useGallery3D'
import SignatureInput from '~/components/SignatureInput.vue'

const props = defineProps<{
  works: WorkItem[]
  signatures: SignatureItem[]
  author?: { penName: string; bio: string; tags: string[]; contact: any }
}>()

const emit = defineEmits<{
  'add-signature': [sig: { name: string; comment: string; signatureDataUrl: string }]
}>()

const wrapperRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLElement | null>(null)
const entered = ref(false)
const focused = ref(false)
const focusedWorkName = ref('')
const showSigModal = ref(false)

let galleryCleanup: (() => void) | null = null
let galleryEnterFn: (() => void) | null = null
let galleryResetFn: (() => void) | null = null
let checkFocus: (() => boolean) | null = null
let getFocusedWork: (() => WorkItem | null) | null = null

let focusInterval: ReturnType<typeof setInterval> | null = null

function onSigSubmit(sig: { name: string; comment: string; signatureDataUrl: string }) {
  emit('add-signature', sig)
  showSigModal.value = false
}

function doEnter() {
  entered.value = true
  galleryEnterFn?.()
}

function doReset() {
  galleryResetFn?.()
}

function initGallery() {
  const { init, cleanup, addSignatureToWall, enterGallery, resetCamera, isFocused: getIsFocused, getFocusedWork: _getFocusedWork } = useGallery3D(
    canvasRef,
    props.works,
    () => {},
    ref(props.signatures),
    props.author
  )
  checkFocus = getIsFocused
  getFocusedWork = _getFocusedWork
  galleryCleanup = cleanup
  galleryEnterFn = enterGallery
  galleryResetFn = resetCamera
  init()

  // Poll focus state for HUD
  focusInterval = setInterval(() => {
    const f = checkFocus?.()
    focused.value = !!f
    if (f) {
      const w = getFocusedWork?.()
      focusedWorkName.value = w?.name ?? ''
    }
  }, 100)

  // Watch for new signatures
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
}

onMounted(() => {
  initGallery()
})

onUnmounted(() => {
  if (focusInterval) clearInterval(focusInterval)
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

.hud-btn {
  cursor: pointer;
  background: rgba(135, 206, 235, 0.15);
  border: 1px solid rgba(135, 206, 235, 0.25);
  border-radius: 14px;
  padding: 4px 14px;
  font-size: 13px;
  color: #5a8a9e;
  transition: all 0.2s;
  pointer-events: auto;
}
.hud-btn:hover {
  background: rgba(135, 206, 235, 0.25);
  border-color: rgba(135, 206, 235, 0.4);
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

/* Entry transition */
.entry-fade-leave-active {
  transition: opacity 0.6s ease;
}
.entry-fade-leave-to {
  opacity: 0;
  pointer-events: none;
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
