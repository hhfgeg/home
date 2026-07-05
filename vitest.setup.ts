import { vi } from 'vitest'

// Nuxt auto-imports polyfill for vitest environment
async function setupNuxtImports() {
  const vue = await import('vue')

  // Make Vue reactivity APIs available globally (like Nuxt auto-imports)
  Object.assign(globalThis, {
    ref: vue.ref,
    reactive: vue.reactive,
    computed: vue.computed,
    watch: vue.watch,
    watchEffect: vue.watchEffect,
    nextTick: vue.nextTick,
    onMounted: vue.onMounted,
    onBeforeMount: vue.onBeforeMount,
    onBeforeUnmount: vue.onBeforeUnmount,
    onUnmounted: vue.onUnmounted,
    onActivated: vue.onActivated,
    onDeactivated: vue.onDeactivated,
    useTemplateRef: vue.useTemplateRef,
  })
}

await setupNuxtImports()
