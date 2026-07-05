<template>
  <div class="gallery-container" ref="containerRef">
    <!-- 3D 画布 -->
    <div class="canvas-wrapper" ref="canvasContainer"></div>

    <!-- 加载遮罩 -->
    <Transition name="fade">
      <div v-if="!isReady" class="loading-overlay">
        <div class="loading-content">
          <div class="neon-ring"></div>
          <p class="loading-text">云中书作品廊 · 加载中</p>
        </div>
      </div>
    </Transition>

    <!-- HUD 控制提示 -->
    <ControlsHint :is-mobile="isMobile" />

    <!-- 移动端虚拟摇杆 -->
    <MobileControls
      v-if="isMobile"
      @move="handleVirtualMove"
    />

    <!-- 顶栏按钮 -->
    <TopBar
      @about="gallery.toggleAbout()"
      @signature="gallery.openSignatureModal()"
    />

    <!-- 作品详情模态框 -->
    <WorkDetailModal
      :work="gallery.selectedWork.value"
      :visible="gallery.showDetail.value"
      @close="gallery.closeDetail()"
    />

    <!-- 签名输入模态框 -->
    <SignatureModal
      :visible="gallery.showSignatureModal.value"
      :colors="gallery.signatureColors"
      @close="gallery.closeSignatureModal()"
      @submit="handleSignatureSubmit"
    />

    <!-- 关于我面板 -->
    <AboutPanel
      :visible="gallery.showAbout.value"
      @close="gallery.toggleAbout()"
    />

    <!-- 签名评论悬浮提示 -->
    <Transition name="fade">
      <div
        v-if="hoveredSignature"
        class="signature-tooltip"
      >
        <p class="tooltip-name" :style="{ color: hoveredSignature.color }">
          {{ hoveredSignature.name }}
        </p>
        <p class="tooltip-comment">{{ hoveredSignature.comment }}</p>
      </div>
    </Transition>

    <!-- 作品悬浮名称 -->
    <Transition name="fade">
      <div v-if="hoveredWork" class="work-tooltip">
        <p class="work-tooltip-name">{{ hoveredWork.name }}</p>
        <p class="work-tooltip-hint">点击查看详情</p>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Work, Signature } from '~/types/gallery'
import ControlsHint from './ControlsHint.vue'
import MobileControls from './MobileControls.vue'
import TopBar from './TopBar.vue'
import WorkDetailModal from './WorkDetailModal.vue'
import SignatureModal from './SignatureModal.vue'
import AboutPanel from './AboutPanel.vue'

const containerRef = ref<HTMLElement | null>(null)
const canvasContainer = ref<HTMLElement | null>(null)
const gallery = useGallery()
const isMobile = ref(false)

// Three.js 场景
const {
  init,
  dispose,
  onResize,
  rotateCamera,
  moveCamera,
  updateCameraRotation,
  onWorkClicked,
  onSigHover,
  updateSignatureDisplays,
  isReady,
  hoveredWork,
  hoveredSignature,
} = useThreeScene(
  canvasContainer,
  gallery.leftWallWorks,
  gallery.rightWallWorks,
  gallery.signatures,
)

// --- 直接处理输入控制 ---

const moveState = reactive({
  forward: false,
  backward: false,
  left: false,
  right: false,
})

let isDragging = false
let lastMouseX = 0
let lastMouseY = 0
const sensitivity = 0.6
const speed = 6.0
const keys = new Set<string>()

function updateMoveState() {
  moveState.forward = keys.has('KeyW') || keys.has('ArrowUp')
  moveState.backward = keys.has('KeyS') || keys.has('ArrowDown')
  moveState.left = keys.has('KeyA') || keys.has('ArrowLeft')
  moveState.right = keys.has('KeyD') || keys.has('ArrowRight')
}

function onKeyDown(e: KeyboardEvent) {
  keys.add(e.code)
  updateMoveState()
}
function onKeyUp(e: KeyboardEvent) {
  keys.delete(e.code)
  updateMoveState()
}

function onMouseDown(e: MouseEvent) {
  if (e.button === 0) {
    isDragging = true
    lastMouseX = e.clientX
    lastMouseY = e.clientY
  }
}
function onMouseMove(e: MouseEvent) {
  if (!isDragging) return
  const dx = e.clientX - lastMouseX
  const dy = e.clientY - lastMouseY
  rotateCamera(dx, dy, sensitivity)
  lastMouseX = e.clientX
  lastMouseY = e.clientY
  updateCameraRotation()
}
function onMouseUp() {
  isDragging = false
}

function onWheel(e: WheelEvent) {
  const dir = e.deltaY < 0 ? 1 : -1
  moveCamera({ x: 0, z: dir }, speed * 2, 0.16)
}

// 移动端触摸
let touchStartX = 0
let touchStartY = 0
let isTouching = false

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    isDragging = true
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
    lastMouseX = touchStartX
    lastMouseY = touchStartY
  }
}
function onTouchMove(e: TouchEvent) {
  if (!isDragging || e.touches.length !== 1) return
  const dx = e.touches[0].clientX - lastMouseX
  const dy = e.touches[0].clientY - lastMouseY
  rotateCamera(dx, dy, sensitivity)
  lastMouseX = e.touches[0].clientX
  lastMouseY = e.touches[0].clientY
  updateCameraRotation()
  e.preventDefault()
}
function onTouchEnd() {
  isDragging = false
}

// 移动端虚拟摇杆
function handleVirtualMove(dir: 'up' | 'down' | 'left' | 'right', active: boolean) {
  if (dir === 'up') moveState.forward = active
  if (dir === 'down') moveState.backward = active
  if (dir === 'left') moveState.left = active
  if (dir === 'right') moveState.right = active
}

// 签名处理
function handleSignatureSubmit(name: string, data: string, comment: string) {
  gallery.addSignature(name, data, comment)
  gallery.closeSignatureModal()
  nextTick(() => {
    updateSignatureDisplays()
  })
}

// --- 初始化 ---
function checkMobile() {
  return window.matchMedia('(max-width: 768px)').matches
}

onMounted(async () => {
  isMobile.value = checkMobile()
  await nextTick()
  init()

  // 绑定事件
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('wheel', onWheel, { passive: true })
  window.addEventListener('touchstart', onTouchStart, { passive: false })
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('touchend', onTouchEnd)
  window.addEventListener('resize', onResize)

  // 签名墙点击事件
  window.addEventListener('signature-wall-click', () => {
    gallery.openSignatureModal()
  })

  // 媒体查询
  const mq = window.matchMedia('(max-width: 768px)')
  const handleMQ = () => { isMobile.value = mq.matches; onResize() }
  mq.addEventListener('change', handleMQ)

  // 作品点击回调
  onWorkClicked((work: Work) => {
    gallery.openDetail(work)
  })

  // 每帧移动更新
  const moveLoop = setInterval(() => {
    const direction = {
      x: (moveState.left ? -1 : 0) + (moveState.right ? 1 : 0),
      z: (moveState.forward ? 1 : 0) + (moveState.backward ? -1 : 0),
    }
    if (direction.x !== 0 || direction.z !== 0) {
      moveCamera(direction, speed, 0.016)
    }
    updateCameraRotation()
  }, 16)

  onBeforeUnmount(() => {
    clearInterval(moveLoop)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('mousedown', onMouseDown)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('wheel', onWheel)
  window.removeEventListener('touchstart', onTouchStart)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('signature-wall-click', () => {})
  dispose()
})
</script>

<style scoped>
.gallery-container {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #0a0a14;
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
}

.canvas-wrapper :deep(canvas) {
  display: block;
}

/* 加载遮罩 */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: #0a0a14;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  text-align: center;
}

.neon-ring {
  width: 60px;
  height: 60px;
  margin: 0 auto 20px;
  border: 3px solid transparent;
  border-top-color: #00fff5;
  border-right-color: #b400ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  box-shadow: 0 0 20px rgba(0, 255, 245, 0.3), 0 0 60px rgba(180, 0, 255, 0.15);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #00fff5;
  font-size: 18px;
  letter-spacing: 3px;
  text-shadow: 0 0 10px rgba(0, 255, 245, 0.6);
}

/* 签名评论悬浮提示 */
.signature-tooltip {
  position: fixed;
  transform: translate(-50%, -120%);
  background: rgba(10, 10, 20, 0.95);
  border: 1px solid rgba(0, 255, 245, 0.3);
  border-radius: 8px;
  padding: 10px 16px;
  min-width: 200px;
  max-width: 300px;
  z-index: 100;
  pointer-events: none;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 20px rgba(0, 255, 245, 0.1);
}

.tooltip-name {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
}

.tooltip-comment {
  font-size: 12px;
  color: #aaa;
  line-height: 1.5;
}

/* 作品悬浮提示 */
.work-tooltip {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10, 10, 20, 0.9);
  border: 1px solid rgba(0, 255, 245, 0.2);
  border-radius: 8px;
  padding: 8px 20px;
  z-index: 100;
  pointer-events: none;
  backdrop-filter: blur(10px);
}

.work-tooltip-name {
  color: #00fff5;
  font-size: 16px;
  font-weight: bold;
}

.work-tooltip-hint {
  color: #666;
  font-size: 12px;
  margin-top: 2px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
