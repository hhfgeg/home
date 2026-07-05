<template>
  <Transition name="modal">
    <div class="signature-modal-overlay" @click.self="$emit('close')">
      <div class="signature-modal" @click.stop>
        <button class="modal-close" @click="$emit('close')">✕</button>

        <h3 class="modal-title">留下你的签名</h3>

        <!-- Signature canvas -->
        <div class="canvas-section">
          <label class="canvas-label">手写签名</label>
          <div class="canvas-wrapper">
            <canvas
              ref="canvasRef"
              class="signature-canvas"
              @mousedown="startDrawing"
              @mousemove="draw"
              @mouseup="stopDrawing"
              @mouseleave="stopDrawing"
              @touchstart.prevent="startDrawingTouch"
              @touchmove.prevent="drawTouch"
              @touchend="stopDrawing"
            ></canvas>
            <div class="canvas-hint" v-if="!hasDrawn">
              在此处手写签名
            </div>
          </div>
          <div class="canvas-actions">
            <button class="btn-clear" @click="clearCanvas">清除</button>
          </div>
        </div>

        <!-- Name input -->
        <div class="form-group">
          <label class="form-label">你的名字</label>
          <input
            v-model="name"
            type="text"
            class="form-input"
            placeholder="输入你的名字或昵称"
            maxlength="20"
          />
        </div>

        <!-- Comment input -->
        <div class="form-group">
          <label class="form-label">留言</label>
          <textarea
            v-model="comment"
            class="form-textarea"
            placeholder="写下你想说的话..."
            maxlength="200"
            rows="3"
          ></textarea>
          <span class="form-count">{{ comment.length }}/200</span>
        </div>

        <!-- Submit -->
        <div class="modal-actions">
          <button
            class="btn-submit"
            :disabled="!name.trim() || !hasDrawn"
            @click="submitSignature"
          >
            提交签名
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const emit = defineEmits<{
  submit: [sig: { name: string; comment: string; signatureDataUrl: string }]
  close: []
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const name = ref('')
const comment = ref('')
const hasDrawn = ref(false)

let ctx: CanvasRenderingContext2D | null = null
let isDrawing = false
let lastX = 0
let lastY = 0

onMounted(() => {
  nextTick(() => {
    if (canvasRef.value) {
      const canvas = canvasRef.value
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * 2
      canvas.height = rect.height * 2
      ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(2, 2)
        ctx.strokeStyle = '#4a4550'
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
      }
    }
  })

  // Handle ESC
  function keydown(e: KeyboardEvent) {
    if (e.key === 'Escape') emit('close')
  }
  document.addEventListener('keydown', keydown)
  onUnmounted(() => document.removeEventListener('keydown', keydown))
})

function getCanvasPos(e: MouseEvent | Touch): { x: number; y: number } {
  if (!canvasRef.value) return { x: 0, y: 0 }
  const rect = canvasRef.value.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left) * (canvasRef.value.width / 2 / rect.width),
    y: (e.clientY - rect.top) * (canvasRef.value.height / 2 / rect.height)
  }
}

function startDrawing(e: MouseEvent) {
  isDrawing = true
  hasDrawn.value = true
  const pos = getCanvasPos(e)
  lastX = pos.x
  lastY = pos.y
}

function startDrawingTouch(e: TouchEvent) {
  isDrawing = true
  hasDrawn.value = true
  const pos = getCanvasPos(e.touches[0])
  lastX = pos.x
  lastY = pos.y
}

function draw(e: MouseEvent) {
  if (!isDrawing || !ctx) return
  const pos = getCanvasPos(e)
  ctx.beginPath()
  ctx.moveTo(lastX, lastY)
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()
  lastX = pos.x
  lastY = pos.y
}

function drawTouch(e: TouchEvent) {
  if (!isDrawing || !ctx) return
  const pos = getCanvasPos(e.touches[0])
  ctx.beginPath()
  ctx.moveTo(lastX, lastY)
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()
  lastX = pos.x
  lastY = pos.y
}

function stopDrawing() {
  isDrawing = false
}

function clearCanvas() {
  if (!ctx || !canvasRef.value) return
  const canvas = canvasRef.value
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#4a4550'
  hasDrawn.value = false
}

function submitSignature() {
  if (!name.value.trim() || !hasDrawn.value) return

  const dataUrl = canvasRef.value?.toDataURL('image/png') || ''
  emit('submit', {
    name: name.value.trim(),
    comment: comment.value.trim(),
    signatureDataUrl: dataUrl
  })
}
</script>

<style scoped>
.signature-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.signature-modal {
  position: relative;
  background: #fff;
  border-radius: 24px;
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 36px 32px 28px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.modal-close {
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

.modal-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
}

.modal-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 22px;
  font-weight: 300;
  color: #3a3540;
  margin: 0 0 28px;
  text-align: center;
  letter-spacing: 2px;
}

/* Canvas */
.canvas-section {
  margin-bottom: 20px;
}

.canvas-label,
.form-label {
  display: block;
  font-size: 13px;
  color: #888;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.canvas-wrapper {
  position: relative;
  background: #fafaf5;
  border: 1px solid #e0dcd5;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 10px;
}

.signature-canvas {
  width: 100%;
  height: 140px;
  display: block;
  cursor: crosshair;
  background: #fafaf5;
}

.canvas-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ccc;
  font-size: 16px;
  pointer-events: none;
  letter-spacing: 2px;
}

.canvas-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-clear {
  font-size: 13px;
  color: #aaa;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-clear:hover {
  color: #e88;
  background: rgba(255, 0, 0, 0.05);
}

/* Form */
.form-group {
  margin-bottom: 20px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0dcd5;
  border-radius: 12px;
  font-size: 15px;
  color: #4a4550;
  background: #fafaf5;
  outline: none;
  transition: all 0.3s;
  font-family: inherit;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #b8dff0;
  box-shadow: 0 0 0 3px rgba(135, 206, 235, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-count {
  display: block;
  text-align: right;
  font-size: 12px;
  color: #ccc;
  margin-top: 4px;
}

/* Submit */
.modal-actions {
  margin-top: 24px;
  text-align: center;
}

.btn-submit {
  width: 100%;
  padding: 14px 32px;
  border-radius: 14px;
  border: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  background: linear-gradient(135deg, #87ceeb, #add8e6);
  color: #fff;
  letter-spacing: 1px;
  transition: all 0.3s;
  box-shadow: 0 4px 16px rgba(135, 206, 235, 0.25);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(135, 206, 235, 0.35);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Transitions */
.modal-enter-active {
  transition: opacity 0.3s ease;
}
.modal-enter-active .signature-modal {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
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
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
.modal-leave-to {
  opacity: 0;
}
.modal-leave-to .signature-modal {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}

@media (max-width: 768px) {
  .signature-modal {
    padding: 28px 20px 24px;
  }
}
</style>
