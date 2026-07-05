<template>
  <div class="top-bar">
    <div class="brand">
      <span class="brand-icon">✦</span>
      <span class="brand-name">云中书</span>
      <span class="brand-sub">作品廊</span>
    </div>
    <div class="actions">
      <button class="action-btn" @click="$emit('signature')">
        <span class="btn-icon">✍</span>
        <span class="btn-text">签名墙</span>
      </button>
      <button class="action-btn" @click="$emit('about')">
        <span class="btn-icon">📖</span>
        <span class="btn-text">关于我</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  about: []
  signature: []
}>()
</script>

<style scoped>
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  z-index: 60;
  pointer-events: none;
}

.top-bar > * {
  pointer-events: auto;
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.brand-icon {
  font-size: 20px;
  color: #00fff5;
  text-shadow: 0 0 10px rgba(0, 255, 245, 0.6);
}

.brand-name {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  letter-spacing: 2px;
  text-shadow: 0 0 20px rgba(0, 255, 245, 0.3);
  background: linear-gradient(135deg, #fff, #00fff5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-sub {
  font-size: 12px;
  color: #666;
  letter-spacing: 4px;
}

.actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(10, 10, 20, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 255, 245, 0.2);
  border-radius: 8px;
  color: #aaa;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  border-color: rgba(0, 255, 245, 0.5);
  color: #00fff5;
  box-shadow: 0 0 20px rgba(0, 255, 245, 0.1);
}

.btn-icon {
  font-size: 16px;
}

@media (max-width: 768px) {
  .top-bar {
    padding: 12px 16px;
  }

  .brand-name {
    font-size: 16px;
  }

  .brand-sub {
    display: none;
  }

  .action-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  .btn-text {
    display: none;
  }
}
</style>
