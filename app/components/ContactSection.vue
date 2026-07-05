<template>
  <section id="contact" class="contact-section">
    <div class="contact-container">
      <div class="section-header">
        <span class="section-tag">联系我</span>
        <h2 class="section-title">云端来信</h2>
        <p class="section-subtitle">期待每一个思想的共鸣</p>
      </div>

      <div class="contact-cards">
        <a v-for="item in contactItems" :key="item.label"
          :href="item.href" target="_blank" rel="noopener"
          class="contact-card" :class="{ 'contact-card-disabled': !item.href }">
          <div class="contact-icon">{{ item.icon }}</div>
          <div class="contact-info">
            <span class="contact-label">{{ item.label }}</span>
            <span class="contact-value">{{ item.value }}</span>
          </div>
          <div class="contact-arrow" v-if="item.href">→</div>
        </a>
      </div>

      <!-- Newsletter-like CTA -->
      <div class="contact-cta">
        <div class="cta-cloud">
          <p class="cta-text">如果你也在AI与创造的交叉点上探索</p>
          <p class="cta-text-secondary">欢迎随时交流，一起在云中书写未来</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const contactItems = [
  {
    icon: '✉️',
    label: '邮箱',
    value: 'yunzhongshu@example.com',
    href: 'mailto:yunzhongshu@example.com'
  },
  {
    icon: '🐙',
    label: 'GitHub',
    value: 'github.com/yunzhongshu',
    href: 'https://github.com/yunzhongshu'
  },
  {
    icon: '🐦',
    label: 'Twitter',
    value: '@yunzhongshu',
    href: 'https://twitter.com/yunzhongshu'
  },
  {
    icon: '🌐',
    label: '个人网站',
    value: 'yunzhongshu.dev',
    href: 'https://yunzhongshu.dev'
  },
  {
    icon: '💬',
    label: '作品反馈',
    value: '欢迎来信交流',
    href: null
  }
]
</script>

<style scoped>
.contact-section {
  padding: 100px 24px;
  background: linear-gradient(180deg, #faf8f5 0%, #f5f0eb 100%);
  position: relative;
}

.contact-container {
  max-width: 700px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 56px;
}

.section-tag {
  display: inline-block;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 4px;
  color: #a0b8c8;
  background: rgba(160, 184, 200, 0.1);
  padding: 6px 20px;
  border-radius: 20px;
  margin-bottom: 16px;
}

.section-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 40px;
  font-weight: 300;
  color: #3a3540;
  margin: 0 0 12px;
  letter-spacing: 4px;
}

.section-subtitle {
  font-size: 17px;
  color: #999;
  margin: 0;
}

.contact-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(200, 190, 175, 0.2);
  border-radius: 16px;
  padding: 20px 24px;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  animation: fadeInUp 0.5s ease both;
}

.contact-card:nth-child(1) { animation-delay: 0.1s; }
.contact-card:nth-child(2) { animation-delay: 0.15s; }
.contact-card:nth-child(3) { animation-delay: 0.2s; }
.contact-card:nth-child(4) { animation-delay: 0.25s; }
.contact-card:nth-child(5) { animation-delay: 0.3s; }

.contact-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(135, 206, 235, 0.12);
  border-color: rgba(135, 206, 235, 0.3);
  background: rgba(255, 255, 255, 0.9);
}

.contact-card-disabled {
  cursor: default;
}
.contact-card-disabled:hover {
  transform: none;
  box-shadow: none;
}

.contact-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(184, 223, 240, 0.2), rgba(135, 206, 235, 0.1));
  border-radius: 14px;
  flex-shrink: 0;
}

.contact-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-label {
  font-size: 12px;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.contact-value {
  font-size: 16px;
  color: #4a4550;
  font-weight: 400;
}

.contact-arrow {
  font-size: 20px;
  color: #ccc;
  transition: transform 0.3s;
}

.contact-card:hover .contact-arrow {
  transform: translateX(4px);
  color: #87ceeb;
}

.contact-cta {
  margin-top: 56px;
  text-align: center;
}

.cta-cloud {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 32px;
  border: 1px solid rgba(200, 190, 175, 0.15);
  animation: floatUp 4s ease-in-out infinite;
}

.cta-text {
  font-family: 'Noto Serif SC', serif;
  font-size: 20px;
  color: #4a4550;
  margin: 0 0 8px;
  letter-spacing: 1px;
}

.cta-text-secondary {
  font-size: 15px;
  color: #aaa;
  margin: 0;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes floatUp {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@media (max-width: 768px) {
  .contact-section {
    padding: 80px 20px;
  }

  .section-title {
    font-size: 30px;
  }

  .cta-text {
    font-size: 17px;
  }
}
</style>
