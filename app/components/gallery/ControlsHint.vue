<template>
  <div class="controls-hint" :class="{ mobile: isMobile }">
    <!-- 桌面端提示 -->
    <div v-if="!isMobile" class="desktop-hints">
      <div class="hint-group">
        <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
        <span class="hint-label">移动</span>
      </div>
      <div class="hint-group">
        <span class="icon">🖱</span>
        <span class="hint-label">拖拽旋转</span>
      </div>
      <div class="hint-group">
        <span class="icon">🔄</span>
        <span class="hint-label">滚轮进退</span>
      </div>
      <div class="hint-group">
        <span class="icon">👆</span>
        <span class="hint-label">点击作品查看</span>
      </div>
    </div>
    <!-- 移动端提示（简化） -->
    <div v-if="isMobile" class="mobile-hints">
      <span>👆 单指旋转 · 双指缩放 · 点击作品</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isMobile: boolean
}>()
</script>

<style scoped>
.controls-hint {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  pointer-events: none;
}

.desktop-hints {
  display: flex;
  gap: 16px;
  align-items: center;
  background: rgba(10, 10, 20, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 255, 245, 0.15);
  border-radius: 12px;
  padding: 10px 20px;
}

.hint-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  background: rgba(0, 255, 245, 0.1);
  border: 1px solid rgba(0, 255, 245, 0.25);
  border-radius: 4px;
  color: #00fff5;
  font-size: 11px;
  font-family: inherit;
  line-height: 1;
}

.hint-label {
  color: #888;
  font-size: 12px;
  white-space: nowrap;
}

.icon {
  font-size: 16px;
  filter: grayscale(0.5);
}

.mobile-hints {
  background: rgba(10, 10, 20, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 255, 245, 0.15);
  border-radius: 12px;
  padding: 8px 16px;
  color: #888;
  font-size: 12px;
}

.controls-hint.mobile {
  bottom: 110px;
}
</style>
