<template>
  <div class="mobile-controls">
    <!-- 方向键 -->
    <div class="dpad">
      <button
        class="dpad-btn up"
        @touchstart.prevent="emitMove('up', true)"
        @touchend.prevent="emitMove('up', false)"
        @mousedown.prevent="emitMove('up', true)"
        @mouseup.prevent="emitMove('up', false)"
        @mouseleave="emitMove('up', false)"
      >
        ▲
      </button>
      <button
        class="dpad-btn left"
        @touchstart.prevent="emitMove('left', true)"
        @touchend.prevent="emitMove('left', false)"
        @mousedown.prevent="emitMove('left', true)"
        @mouseup.prevent="emitMove('left', false)"
        @mouseleave="emitMove('left', false)"
      >
        ◀
      </button>
      <button
        class="dpad-btn right"
        @touchstart.prevent="emitMove('right', true)"
        @touchend.prevent="emitMove('right', false)"
        @mousedown.prevent="emitMove('right', true)"
        @mouseup.prevent="emitMove('right', false)"
        @mouseleave="emitMove('right', false)"
      >
        ▶
      </button>
      <button
        class="dpad-btn down"
        @touchstart.prevent="emitMove('down', true)"
        @touchend.prevent="emitMove('down', false)"
        @mousedown.prevent="emitMove('down', true)"
        @mouseup.prevent="emitMove('down', false)"
        @mouseleave="emitMove('down', false)"
      >
        ▼
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  move: [direction: 'up' | 'down' | 'left' | 'right', active: boolean]
}>()

function emitMove(dir: 'up' | 'down' | 'left' | 'right', active: boolean) {
  emit('move', dir, active)
}
</script>

<style scoped>
.mobile-controls {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 50;
}

.dpad {
  display: grid;
  grid-template-areas:
    '.    up   .'
    'left .    right'
    '.    down .';
  grid-template-columns: 50px 50px 50px;
  grid-template-rows: 50px 50px 50px;
  gap: 4px;
}

.dpad-btn {
  width: 50px;
  height: 50px;
  border: 1px solid rgba(0, 255, 245, 0.3);
  background: rgba(10, 10, 20, 0.7);
  backdrop-filter: blur(8px);
  border-radius: 10px;
  color: #00fff5;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  transition: all 0.15s ease;
}

.dpad-btn:active {
  background: rgba(0, 255, 245, 0.15);
  border-color: rgba(0, 255, 245, 0.6);
  box-shadow: 0 0 15px rgba(0, 255, 245, 0.2);
}

.up { grid-area: up; }
.down { grid-area: down; }
.left { grid-area: left; }
.right { grid-area: right; }
</style>
