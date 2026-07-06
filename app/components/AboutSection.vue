<template>
  <section id="about" class="about-section">
    <div class="about-container">
      <div class="section-header">
        <span class="section-tag">关于我</span>
        <h2 class="section-title">在云端书写</h2>
        <p class="section-subtitle">一个AI时代的探索者、创作者与思考者</p>
      </div>

      <div class="about-content">
        <!-- Avatar & pen name -->
        <div class="about-hero" data-animate>
          <div class="avatar-ring">
            <div class="avatar-placeholder">{{ displayAuthor.penName.charAt(0) }}</div>
          </div>
          <h3 class="pen-name">{{ displayAuthor.penName }}</h3>
          <div class="author-tags">
            <span v-for="tag in displayAuthor.tags" :key="tag" class="tag-pill">{{ tag }}</span>
          </div>
        </div>

        <!-- Bio -->
        <div class="about-bio" data-animate>
          <p class="bio-text">{{ displayAuthor.bio }}</p>
        </div>

        <!-- Experience / timeline -->
        <div class="about-timeline" data-animate>
          <h3 class="timeline-title">AI 探索之路</h3>
          <div class="timeline-items">
            <div class="timeline-item" v-for="(milestone, idx) in milestones" :key="idx"
              :style="{ animationDelay: idx * 0.15 + 's' }">
              <div class="timeline-dot"></div>
              <div class="timeline-card">
                <span class="timeline-year">{{ milestone.year }}</span>
                <h4 class="timeline-heading">{{ milestone.title }}</h4>
                <p class="timeline-desc">{{ milestone.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Decorative cloud shapes -->
    <div class="cloud-decor cloud-1"></div>
    <div class="cloud-decor cloud-2"></div>
    <div class="cloud-decor cloud-3"></div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface AuthorData {
  penName: string
  bio: string
  tags: string[]
  contact?: { email?: string; github?: string; twitter?: string; website?: string }
}

const props = defineProps<{
  author?: AuthorData
}>()

const displayAuthor = computed(() => ({
  penName: props.author?.penName || '云中书',
  bio: props.author?.bio || '在AI与人类创造力的边界探索，用代码与文字构建通往未来的桥梁。致力于研究AI如何重塑创作方式，以及人机协作的无限可能。',
  tags: props.author?.tags?.length ? props.author.tags : ['AI探索者', '创意工程师', '数字叙事者'],
}))

const milestones = [
  {
    year: '2022',
    title: '初探AI创作',
    desc: '开始使用GPT模型进行诗歌与故事创作实验，发现语言模型在中文创意写作中的巨大潜力。'
  },
  {
    year: '2023',
    title: '多模态探索',
    desc: '深入研究扩散模型与图像生成技术，将AI视觉创作与传统文学结合，开启跨媒介创作之旅。'
  },
  {
    year: '2024',
    title: '3D与空间计算',
    desc: '将AI能力拓展到3D空间，开始构建沉浸式的数据可视化和交互体验项目。'
  },
  {
    year: '2025',
    title: '创作伙伴系统',
    desc: '提出"AI创作伙伴"理念，构建能与人类协作者进行深度创意对话的智能系统。'
  }
]
</script>

<style scoped>
.about-section {
  position: relative;
  padding: 120px 24px;
  background: linear-gradient(180deg, #faf8f5 0%, #f0ebe0 50%, #faf8f5 100%);
  overflow: hidden;
}

.about-container {
  max-width: 900px;
  margin: 0 auto;
}

/* Section header */
.section-header {
  text-align: center;
  margin-bottom: 64px;
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

/* Hero */
.about-hero {
  text-align: center;
  margin-bottom: 48px;
  animation: fadeInUp 0.8s ease;
}

.avatar-ring {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #b8dff0, #87ceeb, #add8e6);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 8px 32px rgba(135, 206, 235, 0.25);
}

.avatar-placeholder {
  font-family: 'Noto Serif SC', serif;
  font-size: 48px;
  color: #fff;
  font-weight: 300;
}

.pen-name {
  font-family: 'Noto Serif SC', serif;
  font-size: 28px;
  font-weight: 300;
  color: #3a3540;
  margin: 0 0 16px;
  letter-spacing: 4px;
}

.author-tags {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.tag-pill {
  font-size: 13px;
  color: #7a9eac;
  background: rgba(135, 206, 235, 0.12);
  padding: 6px 18px;
  border-radius: 20px;
  letter-spacing: 1px;
}

/* Bio */
.about-bio {
  margin-bottom: 64px;
  animation: fadeInUp 0.8s ease 0.15s both;
}

.bio-text {
  font-size: 17px;
  line-height: 1.9;
  color: #5a5560;
  text-align: center;
  max-width: 650px;
  margin: 0 auto;
}

/* Timeline */
.about-timeline {
  animation: fadeInUp 0.8s ease 0.3s both;
}

.timeline-title {
  text-align: center;
  font-family: 'Noto Serif SC', serif;
  font-size: 24px;
  font-weight: 300;
  color: #3a3540;
  margin: 0 0 40px;
  letter-spacing: 2px;
}

.timeline-items {
  position: relative;
  padding-left: 0;
}

.timeline-items::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(180deg, transparent, #d0c8b8, #d0c8b8, transparent);
  transform: translateX(-50%);
}

.timeline-item {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
  animation: fadeInUp 0.6s ease both;
}

.timeline-item:nth-child(odd) .timeline-card {
  margin-right: calc(50% + 30px);
}

.timeline-item:nth-child(even) .timeline-card {
  margin-left: calc(50% + 30px);
}

.timeline-dot {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #87ceeb, #b8dff0);
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(135, 206, 235, 0.3);
  z-index: 1;
  top: 8px;
}

.timeline-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px 24px;
  width: 100%;
  max-width: 340px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(200, 190, 175, 0.2);
  transition: transform 0.3s, box-shadow 0.3s;
}

.timeline-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

.timeline-year {
  font-size: 13px;
  color: #87ceeb;
  font-weight: 600;
  letter-spacing: 2px;
}

.timeline-heading {
  font-size: 18px;
  color: #3a3540;
  margin: 6px 0 8px;
  font-weight: 500;
}

.timeline-desc {
  font-size: 14px;
  color: #888;
  line-height: 1.7;
  margin: 0;
}

/* Cloud decorations */
.cloud-decor {
  position: absolute;
  background: radial-gradient(ellipse, rgba(255, 255, 255, 0.6) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.cloud-1 {
  width: 400px;
  height: 160px;
  top: 60px;
  right: -100px;
  animation: cloudDrift 20s linear infinite;
}

.cloud-2 {
  width: 300px;
  height: 120px;
  bottom: 120px;
  left: -80px;
  animation: cloudDrift 25s linear infinite reverse;
}

.cloud-3 {
  width: 200px;
  height: 80px;
  top: 50%;
  right: 5%;
  animation: cloudDrift 18s linear infinite;
}

@keyframes cloudDrift {
  0% { transform: translateX(0); }
  50% { transform: translateX(30px); }
  100% { transform: translateX(0); }
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

/* Responsive */
@media (max-width: 768px) {
  .about-section {
    padding: 80px 20px;
  }

  .section-title {
    font-size: 30px;
  }

  .timeline-items::before {
    left: 20px;
  }

  .timeline-item:nth-child(odd) .timeline-card,
  .timeline-item:nth-child(even) .timeline-card {
    margin-left: 50px;
    margin-right: 0;
  }

  .timeline-dot {
    left: 20px;
  }

  .timeline-card {
    max-width: 100%;
  }
}
</style>
