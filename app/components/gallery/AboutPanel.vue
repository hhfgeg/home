<template>
  <Teleport to="body">
    <Transition name="panel">
      <div v-if="visible" class="panel-overlay" @click.self="$emit('close')">
        <div class="about-panel">
          <button class="close-btn" @click="$emit('close')">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <!-- 头像区 -->
          <div class="avatar-section">
            <div class="avatar">
              <div class="avatar-inner">
                <span class="avatar-text">云</span>
              </div>
              <div class="avatar-ring"></div>
            </div>
            <h2 class="author-name">云中书</h2>
            <p class="author-tagline">AI 探索者 · 创意工程师 · 数字诗人</p>
          </div>

          <!-- 分割线 -->
          <div class="divider">
            <span class="divider-dot">✦</span>
          </div>

          <!-- 关于内容 -->
          <div class="about-content">
            <div class="about-section">
              <h3 class="section-heading">
                <span class="heading-icon">📖</span>
                关于云中书
              </h3>
              <p class="about-text">
                你好，我是云中书 —— 一个游走于代码与诗意之间的创作者。我的名字源自"云中谁寄锦书来"，寓意在数字云端传递思想与创意。
              </p>
              <p class="about-text">
                多年深耕人工智能领域，我相信AI不仅是工具，更是拓展人类创造力边界的伙伴。从自然语言处理到计算机视觉，从语音合成到3D生成，我致力于让技术以更有温度的方式服务于创作表达。
              </p>
            </div>

            <div class="about-section">
              <h3 class="section-heading">
                <span class="heading-icon">🔬</span>
                AI 探索之路
              </h3>
              <div class="timeline">
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <span class="timeline-year">2022</span>
                    <p>开始AI应用探索，发布首个基于GPT的文本生成工具</p>
                  </div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <span class="timeline-year">2023</span>
                    <p>深入多模态AI研究，涉足图像生成与语音合成领域</p>
                  </div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <span class="timeline-year">2024</span>
                    <p>构建AI创作工具体系，涵盖文本、图像、语音、3D四大方向</p>
                  </div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <span class="timeline-year">2025</span>
                    <p>探索AI Agent与自主创作系统，推动人机协作新范式</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="about-section">
              <h3 class="section-heading">
                <span class="heading-icon">📬</span>
                联系方式
              </h3>
              <div class="contact-grid">
                <a href="mailto:yunzhongshu@example.com" class="contact-item">
                  <span class="contact-icon">📧</span>
                  <span class="contact-label">Email</span>
                  <span class="contact-value">yunzhongshu@example.com</span>
                </a>
                <a href="https://github.com/yunzhongshu" target="_blank" class="contact-item">
                  <span class="contact-icon">💻</span>
                  <span class="contact-label">GitHub</span>
                  <span class="contact-value">github.com/yunzhongshu</span>
                </a>
                <div class="contact-item">
                  <span class="contact-icon">💬</span>
                  <span class="contact-label">微信</span>
                  <span class="contact-value">yunzhongshu_ai</span>
                </div>
                <div class="contact-item">
                  <span class="contact-icon">🐦</span>
                  <span class="contact-label">Twitter/X</span>
                  <span class="contact-value">@yunzhongshu</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
}>()

defineEmits<{
  close: []
}>()
</script>

<style scoped>
.panel-overlay {
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

.about-panel {
  position: relative;
  width: 100%;
  max-width: 500px;
  max-height: 85vh;
  overflow-y: auto;
  background: rgba(15, 15, 30, 0.95);
  border: 1px solid rgba(0, 255, 245, 0.15);
  border-radius: 16px;
  padding: 32px 28px;
  box-shadow:
    0 0 40px rgba(0, 255, 245, 0.05),
    0 20px 60px rgba(0, 0, 0, 0.5);
}

.about-panel::-webkit-scrollbar {
  width: 4px;
}
.about-panel::-webkit-scrollbar-thumb {
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
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* 头像 */
.avatar-section {
  text-align: center;
  margin-bottom: 24px;
}

.avatar {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
}

.avatar-inner {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0a0a14, #1a1a3e);
  border: 2px solid rgba(0, 255, 245, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.avatar-text {
  font-size: 32px;
  color: #00fff5;
  font-weight: bold;
}

.avatar-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: #00fff5;
  border-right-color: #b400ff;
  animation: avatar-spin 3s linear infinite;
}

@keyframes avatar-spin {
  to { transform: rotate(360deg); }
}

.author-name {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  margin: 0 0 4px;
  letter-spacing: 3px;
}

.author-tagline {
  font-size: 12px;
  color: #666;
  letter-spacing: 2px;
  margin: 0;
}

/* 分割线 */
.divider {
  text-align: center;
  margin: 20px 0;
}

.divider-dot {
  color: #00fff5;
  font-size: 12px;
}

/* 内容 */
.about-content {
  color: #aaa;
}

.about-section {
  margin-bottom: 24px;
}

.section-heading {
  font-size: 15px;
  color: #ccc;
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.heading-icon {
  font-size: 16px;
}

.about-text {
  font-size: 13px;
  line-height: 1.9;
  margin: 0 0 10px;
  color: #999;
}

/* 时间线 */
.timeline {
  padding-left: 8px;
}

.timeline-item {
  display: flex;
  gap: 12px;
  padding-bottom: 16px;
  position: relative;
}

.timeline-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 14px;
  bottom: 0;
  width: 1px;
  background: rgba(0, 255, 245, 0.15);
}

.timeline-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #00fff5;
  margin-top: 5px;
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(0, 255, 245, 0.4);
}

.timeline-content {
  font-size: 13px;
}

.timeline-year {
  font-size: 11px;
  color: #00fff5;
  font-weight: bold;
  letter-spacing: 2px;
}

.timeline-content p {
  margin: 2px 0 0;
  color: #999;
  line-height: 1.6;
}

/* 联系方式 */
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.contact-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 245, 0.08);
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.3s;
}

.contact-item:hover {
  border-color: rgba(0, 255, 245, 0.2);
  background: rgba(0, 255, 245, 0.03);
}

.contact-icon {
  font-size: 18px;
  margin-bottom: 4px;
}

.contact-label {
  font-size: 10px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 2px;
}

.contact-value {
  font-size: 11px;
  color: #aaa;
  word-break: break-all;
}

/* 面板过渡 */
.panel-enter-active {
  transition: opacity 0.3s ease;
}
.panel-enter-active .about-panel {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}
.panel-leave-active {
  transition: opacity 0.2s ease;
}
.panel-leave-active .about-panel {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.panel-enter-from {
  opacity: 0;
}
.panel-enter-from .about-panel {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}
.panel-leave-to {
  opacity: 0;
}
.panel-leave-to .about-panel {
  transform: scale(0.95);
  opacity: 0;
}

@media (max-width: 768px) {
  .about-panel {
    padding: 24px 16px;
    max-height: 85vh;
  }

  .contact-grid {
    grid-template-columns: 1fr;
  }
}
</style>
