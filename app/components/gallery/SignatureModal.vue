<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
        <div class="signature-modal">
          <button class="close-btn" @click="$emit('close')">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <h2 class="modal-title">
            <span class="title-icon">✍</span>
            签名墙 · 留下你的印记
          </h2>

          <!-- 签名画板 -->
          <div class="canvas-section">
            <p class="section-label">手写签名</p>
            <div class="canvas-wrapper">
              <canvas
                ref="signCanvas"
                class="sign-canvas"
                @mousedown="startDrawing"
                @mousemove="draw"
                @mouseup="stopDrawing"
                @mouseleave="stopDrawing"
                @touchstart.prevent="startTouch"
                @touchmove.prevent="drawTouch"
                @touchend.prevent="stopDrawing"
              />
            </div>
            <div class="canvas-actions">
              <button class="small-btn" @click="clearCanvas">清除</button>
              <div class="color-picker">
                <button
                  v-for="color in displayColors"
                  :key="color"
                  class="color-dot"
                  :class="{ active: currentColor === color }"
                  :style="{ background: color }"
                  @click="currentColor = color"
                />
              </div>
            </div>
          </div>

          <!-- 姓名 -->
          <div class="field">
            <label class="field-label">你的名字</label>
            <input
              v-model="name"
              class="input"
              placeholder="请输入笔名或昵称..."
              maxlength="20"
            />
          </div>

          <!-- 留言 -->
          <div class="field">
            <label class="field-label">留言内容</label>
            <textarea
              v-model="comment"
              class="textarea"
              placeholder="写下你想说的话..."
              maxlength="200"
              rows="3"
            />
            <span class="char-count">{{ comment.length }}/200</span>
          </div>

          <!-- 提交 -->
          <button
            class="submit-btn"
            :disabled="!canSubmit"
            @click="handleSubmit"
          >
            留 言
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean
  colors: string[]
}>()

const emit = defineEmits<{
  close: []
  submit: [name: string, signatureData: string, comment: string]
}>()

const signCanvas = ref<HTMLCanvasElement | null>(null)
const name = ref('')
const comment = ref('')
const currentColor = ref('#00fff5')

const displayColors = computed(() => props.colors.slice(0, 6))

const canSubmit = computed(() => {
  return name.value.trim().length > 0 && comment.value.trim().length > 0
})

// 手写签名状态
let isDrawing = false
let ctx: CanvasRenderingContext2D | null = null

function initCanvas() {
  if (!signCanvas.value) return
  const canvas = signCanvas.value
  canvas.width = canvas.clientWidth * 2
  canvas.height = canvas.clientHeight * 2
  ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(2, 2)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = currentColor.value
  }
}

function getPos(e: MouseEvent) {
  if (!signCanvas.value) return { x: 0, y: 0 }
  const rect = signCanvas.value.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }
}

function getTouchPos(e: TouchEvent) {
  if (!signCanvas.value) return { x: 0, y: 0 }
  const rect = signCanvas.value.getBoundingClientRect()
  const touch = e.touches[0]
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  }
}

function startDrawing(e: MouseEvent) {
  isDrawing = true
  const pos = getPos(e)
  ctx?.beginPath()
  ctx?.moveTo(pos.x, pos.y)
}

function draw(e: MouseEvent) {
  if (!isDrawing || !ctx) return
  const pos = getPos(e)
  ctx.strokeStyle = currentColor.value
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()
}

function stopDrawing() {
  isDrawing = false
}

function startTouch(e: TouchEvent) {
  isDrawing = true
  const pos = getTouchPos(e)
  ctx?.beginPath()
  ctx?.moveTo(pos.x, pos.y)
}

function drawTouch(e: TouchEvent) {
  if (!isDrawing || !ctx) return
  const pos = getTouchPos(e)
  ctx.strokeStyle = currentColor.value
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()
}

function clearCanvas() {
  if (!signCanvas.value || !ctx) return
  const canvas = signCanvas.value
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function handleSubmit() {
  if (!canSubmit.value) return

  const signatureData = signCanvas.value?.toDataURL('image/png') || ''
  emit('submit', name.value.trim(), signatureData, comment.value.trim())

  // 重置表单
  name.value = ''
  comment.value = ''
  clearCanvas()
}

// 弹窗打开时初始化画布
watch(() => props.visible, (val) => {
  if (val) {
    nextTick(() => {
      initCanvas()
      clearCanvas()
      name.value = ''
      comment.value = ''
    })
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

.signature-modal {
  position: relative;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  background: rgba(15, 15, 30, 0.95);
  border: 1px solid rgba(0, 255, 245, 0.15);
  border-radius: 16px;
  padding: 28px 24px;
  box-shadow:
    0 0 40px rgba(0, 255, 245, 0.05),
    0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-title {
  font-size: 20px;
  color: #fff;
  margin: 0 0 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 22px;
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
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* 画布区 */
.canvas-section {
  margin-bottom: 20px;
}

.section-label {
  font-size: 13px;
  color: #888;
  margin: 0 0 8px;
}

.canvas-wrapper {
  border: 1px solid rgba(0, 255, 245, 0.2);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.4);
}

.sign-canvas {
  width: 100%;
  height: 160px;
  cursor: crosshair;
  display: block;
  touch-action: none;
}

.canvas-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.small-btn {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.small-btn:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}

.color-picker {
  display: flex;
  gap: 8px;
}

.color-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.color-dot:hover {
  transform: scale(1.15);
}

.color-dot.active {
  border-color: #fff;
  box-shadow: 0 0 10px currentColor;
}

/* 表单 */
.field {
  margin-bottom: 16px;
  position: relative;
}

.field-label {
  display: block;
  font-size: 13px;
  color: #888;
  margin-bottom: 6px;
}

.input,
.textarea {
  width: 100%;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(0, 255, 245, 0.15);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.input:focus,
.textarea:focus {
  border-color: rgba(0, 255, 245, 0.5);
  box-shadow: 0 0 10px rgba(0, 255, 245, 0.05);
}

.textarea {
  resize: none;
}

.char-count {
  position: absolute;
  right: 10px;
  bottom: 8px;
  font-size: 11px;
  color: #555;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  margin-top: 8px;
  background: linear-gradient(135deg, rgba(0, 255, 245, 0.1), rgba(180, 0, 255, 0.1));
  border: 1px solid rgba(0, 255, 245, 0.3);
  border-radius: 10px;
  color: #00fff5;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(0, 255, 245, 0.2), rgba(180, 0, 255, 0.2));
  border-color: rgba(0, 255, 245, 0.6);
  box-shadow: 0 0 30px rgba(0, 255, 245, 0.15);
}

.submit-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 模态过渡 */
.modal-enter-active {
  transition: opacity 0.3s ease;
}
.modal-enter-active .signature-modal {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-leave-active .signature-modal {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-enter-from {
  opacity: 0;
}
.modal-enter-from .signature-modal {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}
.modal-leave-to {
  opacity: 0;
}
.modal-leave-to .signature-modal {
  transform: scale(0.95);
  opacity: 0;
}

@media (max-width: 768px) {
  .signature-modal {
    padding: 24px 16px;
  }
  .sign-canvas {
    height: 120px;
  }
}
</style>
