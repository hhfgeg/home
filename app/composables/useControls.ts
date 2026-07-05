// ============================================================
// 云中书作品廊 - 输入控制管理
// ============================================================

import type { ControlsState } from '~/types/gallery'

interface ControlCallbacks {
  onRotate: (dx: number, dy: number, sensitivity: number) => void
  onMove: (direction: { x: number; z: number }, speed: number, delta: number) => void
  onUpdateRotation: () => void
}

/**
 * 键盘 + 鼠标 + 触摸控制
 */
export function useControls(callbacks: Ref<ControlCallbacks | null>) {
  const state = reactive<ControlsState>({
    isLocked: false,
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    sensitivity: 0.6,
    speed: 6.0,
  })

  // 触摸
  let touchStartX = 0
  let touchStartY = 0
  let isTouching = false
  let lastTouchTime = 0
  let touchMoveAccum = { x: 0, y: 0 }

  // 鼠标拖拽旋转
  let isDragging = false
  let lastMouseX = 0
  let lastMouseY = 0

  // 键盘状态追踪
  const keys = new Set<string>()

  function setupEvents() {
    // 键盘
    const onKeyDown = (e: KeyboardEvent) => {
      keys.add(e.code)
      updateMoveState()
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.code)
      updateMoveState()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    // 触摸
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // 双指：开始旋转
        isTouching = true
        touchStartX = e.touches[0].clientX
        touchStartY = e.touches[0].clientY
        lastTouchTime = performance.now()
        touchMoveAccum = { x: 0, y: 0 }
      } else if (e.touches.length === 1) {
        // 单指：保存起始位置（可能是旋转的开始）
        touchStartX = e.touches[0].clientX
        touchStartY = e.touches[0].clientY
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isTouching) {
        const dx = e.touches[0].clientX - touchStartX
        const dy = e.touches[0].clientY - touchStartY
        callbacks.value?.onRotate(dx, dy, state.sensitivity)
        touchStartX = e.touches[0].clientX
        touchStartY = e.touches[0].clientY
        callbacks.value?.onUpdateRotation()
        e.preventDefault()
      } else if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - lastMouseX
        const dy = e.touches[0].clientY - lastMouseY
        callbacks.value?.onRotate(dx, dy, state.sensitivity)
        lastMouseX = e.touches[0].clientX
        lastMouseY = e.touches[0].clientY
        callbacks.value?.onUpdateRotation()
      }
    }
    const onTouchEnd = () => {
      isTouching = false
      if (isDragging) {
        isDragging = false
      }
    }
    window.addEventListener('touchstart', onTouchStart, { passive: false })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)

    // 鼠标拖拽旋转
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDragging = true
        lastMouseX = e.clientX
        lastMouseY = e.clientY
      }
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const dx = e.clientX - lastMouseX
      const dy = e.clientY - lastMouseY
      callbacks.value?.onRotate(dx, dy, state.sensitivity)
      lastMouseX = e.clientX
      lastMouseY = e.clientY
      callbacks.value?.onUpdateRotation()
    }
    const onMouseUp = () => {
      isDragging = false
    }
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    // 滚轮缩放（调节 FOV）
    const onWheel = (e: WheelEvent) => {
      // 滚轮用于前进/后退
      const direction = e.deltaY < 0 ? 1 : -1
      callbacks.value?.onMove(
        { x: 0, z: direction },
        state.speed * 2,
        0.16
      )
    }
    window.addEventListener('wheel', onWheel, { passive: true })

    // 移动端虚拟摇杆
    setupMobileControls()

    // 清理
    const cleanup = () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('wheel', onWheel)
    }

    return cleanup
  }

  function setupMobileControls() {
    // 移动端虚拟摇杆通过组件界面处理
    // 这里提供 API 供移动端按钮调用
  }

  function updateMoveState() {
    state.moveForward = keys.has('KeyW') || keys.has('ArrowUp')
    state.moveBackward = keys.has('KeyS') || keys.has('ArrowDown')
    state.moveLeft = keys.has('KeyA') || keys.has('ArrowLeft')
    state.moveRight = keys.has('KeyD') || keys.has('ArrowRight')
  }

  /** 每帧更新移动 */
  function updateMovement(delta: number) {
    const direction = {
      x: (state.moveLeft ? -1 : 0) + (state.moveRight ? 1 : 0),
      z: (state.moveForward ? 1 : 0) + (state.moveBackward ? -1 : 0),
    }
    if (direction.x !== 0 || direction.z !== 0) {
      callbacks.value?.onMove(direction, state.speed, delta)
    }
  }

  /** 虚拟移动（移动端按钮） */
  function virtualMove(direction: 'up' | 'down' | 'left' | 'right', active: boolean) {
    if (direction === 'up') state.moveForward = active
    if (direction === 'down') state.moveBackward = active
    if (direction === 'left') state.moveLeft = active
    if (direction === 'right') state.moveRight = active
  }

  /** 设置灵敏度 */
  function setSensitivity(value: number) {
    state.sensitivity = Math.max(0.1, Math.min(2.0, value))
  }

  /** 判断是否移动端 */
  function isMobile(): boolean {
    return window.matchMedia('(max-width: 768px)').matches
  }

  return {
    state,
    setupEvents,
    updateMovement,
    virtualMove,
    setSensitivity,
    isMobile,
  }
}
