<template>
  <nav class="navbar" :class="{ 'navbar-scrolled': scrolled }">
    <div class="navbar-inner">
      <div class="navbar-brand">
        <span class="brand-text">云中书</span>
        <span class="brand-sub">作品廊</span>
      </div>

      <div class="navbar-links">
        <a v-for="link in links" :key="link.target"
          :href="link.target"
          class="nav-link"
          @click.prevent="scrollTo(link.target)"
        >
          {{ link.label }}
        </a>
      </div>

      <!-- Mobile menu toggle -->
      <button class="nav-toggle" @click="menuOpen = !menuOpen" aria-label="菜单">
        <span :class="{ 'toggle-bar': true, open: menuOpen }"></span>
        <span :class="{ 'toggle-bar': true, open: menuOpen }"></span>
      </button>
    </div>

    <!-- Mobile menu -->
    <Transition name="slide">
      <div v-if="menuOpen" class="navbar-mobile-menu">
        <a v-for="link in links" :key="link.target"
          :href="link.target"
          class="mobile-link"
          @click.prevent="scrollTo(link.target); menuOpen = false"
        >
          {{ link.label }}
        </a>
      </div>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const scrolled = ref(false)
const menuOpen = ref(false)

const links = [
  { label: '作品廊', target: '#gallery' },
  { label: '签名墙', target: '#signature-wall' },
  { label: '关于我', target: '#about' },
  { label: '联系', target: '#contact' }
]

function scrollTo(target: string) {
  const el = document.querySelector(target)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

function onScroll() {
  scrolled.value = window.scrollY > 50
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  padding: 16px 24px;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.navbar-scrolled {
  background: rgba(250, 248, 245, 0.85);
  backdrop-filter: blur(20px);
  padding: 10px 24px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
}

.navbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-brand {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.brand-text {
  font-family: 'Noto Serif SC', serif;
  font-size: 20px;
  font-weight: 400;
  color: #3a3540;
  letter-spacing: 3px;
}

.brand-sub {
  font-size: 12px;
  color: #bbb;
  letter-spacing: 2px;
}

.navbar-links {
  display: flex;
  gap: 32px;
}

.nav-link {
  font-size: 14px;
  color: #888;
  text-decoration: none;
  letter-spacing: 1px;
  transition: color 0.3s;
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 1px;
  background: #87ceeb;
  transform: scaleX(0);
  transition: transform 0.3s;
}

.nav-link:hover {
  color: #5a5a6e;
}

.nav-link:hover::after {
  transform: scaleX(1);
}

.nav-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.toggle-bar {
  width: 22px;
  height: 1.5px;
  background: #888;
  transition: all 0.3s;
}

.toggle-bar.open:first-child {
  transform: rotate(45deg) translate(4px, 4px);
}

.toggle-bar.open:last-child {
  transform: rotate(-45deg) translate(4px, -5px);
}

.navbar-mobile-menu {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  margin-top: 12px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

.mobile-link {
  padding: 12px 20px;
  font-size: 15px;
  color: #555;
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.2s;
  letter-spacing: 1px;
}

.mobile-link:hover {
  background: rgba(135, 206, 235, 0.06);
  color: #333;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .navbar-links {
    display: none;
  }

  .nav-toggle {
    display: flex;
  }
}
</style>
