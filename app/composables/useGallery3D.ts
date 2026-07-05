import * as THREE from 'three'
import type { Ref } from 'vue'

export interface WorkItem {
  id: string
  name: string
  summary: string
  description: string
  link: string
  video: string | null
  thumbnail: string
  category: string
  tags: string[]
  position: { wall: number; index: number }
}

export interface SignatureItem {
  id: string
  name: string
  comment: string
  signatureDataUrl: string
  createdAt: string
  position: { x: number; y: number; z: number }
}

const ROOM_SIZE = { width: 20, height: 8, depth: 16 }
const CAMERA_HEIGHT = 3.5
const MOVE_SPEED = 8
const MOUSE_SENSITIVITY = 0.002

// Generate unique cloud-like colors for cards
const cardColors = [
  0x6ec6f0, 0xa8d8ea, 0xb8dff0, 0x87ceeb,
  0xadd8e6, 0x9ad0e0, 0x7ec8e3, 0x8dd4e8
]

function getCardColor(index: number): number {
  return cardColors[index % cardColors.length]
}

export function useGallery3D(
  containerRef: Ref<HTMLElement | null>,
  works: WorkItem[],
  onWorkClick: (work: WorkItem) => void,
  signatures: Ref<SignatureItem[]>
) {
  // Three.js core
  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let renderer: THREE.WebGLRenderer
  let clock: THREE.Clock
  let animationId: number = 0
  let raycaster: THREE.Raycaster

  // Controls state
  let disposed = false
  const keys = { w: false, a: false, s: false, d: false, shift: false }
  let isPointerLocked = false
  let mouseX = 0
  let mouseY = 0
  const euler = new THREE.Euler(0, 0, 0, 'YXZ')
  const direction = new THREE.Vector3()
  const right = new THREE.Vector3()
  const velocity = new THREE.Vector3()

  // Interactive objects
  const clickableObjects: THREE.Object3D[] = []
  const workCards: Map<string, THREE.Mesh> = new Map()
  const signatureMeshes: Map<string, THREE.Mesh> = new Map()

  // Bounds for collision
  const roomBounds = {
    minX: -ROOM_SIZE.width / 2 + 0.5,
    maxX: ROOM_SIZE.width / 2 - 0.5,
    minZ: -ROOM_SIZE.depth / 2 + 0.5,
    maxZ: ROOM_SIZE.depth / 2 - 0.5
  }

  function init() {
    if (!containerRef.value) return

    // Scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf5f0eb)
    scene.fog = new THREE.Fog(0xf5f0eb, 10, 40)

    // Camera
    camera = new THREE.PerspectiveCamera(
      70,
      containerRef.value.clientWidth / containerRef.value.clientHeight,
      0.1,
      100
    )
    camera.position.set(0, CAMERA_HEIGHT, ROOM_SIZE.depth / 2 - 1)
    camera.lookAt(0, CAMERA_HEIGHT - 0.5, 0)

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    containerRef.value.appendChild(renderer.domElement)

    // Raycaster
    raycaster = new THREE.Raycaster()
    raycaster.far = 8

    // Clock
    clock = new THREE.Clock()

    // Build room
    buildRoom()
    buildLighting()
    buildWorks(works)
    buildFloatingParticles()
    buildFloorTexture()

    // Events
    setupEvents()
    animate()
  }

  function buildRoom() {
    const { width, height, depth } = ROOM_SIZE

    // Floor
    const floorGeo = new THREE.PlaneGeometry(width, depth)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xe8e0d4,
      roughness: 0.8,
      metalness: 0.1
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -height / 2
    floor.receiveShadow = true
    scene.add(floor)

    // Ceiling
    const ceilingGeo = new THREE.PlaneGeometry(width, depth)
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0xfafaf5,
      roughness: 0.9
    })
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat)
    ceiling.rotation.x = Math.PI / 2
    ceiling.position.y = height / 2
    ceiling.receiveShadow = true
    scene.add(ceiling)

    // Walls material
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xfaf8f5,
      roughness: 0.95,
      metalness: 0
    })

    // Back wall (z = -depth/2)
    createWall(0, 0, -depth / 2, width, height, 0, wallMat)

    // Front wall (z = +depth/2) - entrance
    createWall(0, 0, depth / 2, width, height, Math.PI, wallMat)

    // Left wall (x = -width/2)
    createWall(-width / 2, 0, 0, depth, height, Math.PI / 2, wallMat)

    // Right wall (x = +width/2) - Signature wall
    createWall(width / 2, 0, 0, depth, height, -Math.PI / 2, wallMat)

    // Room edges / baseboard trim
    addBaseboard()
  }

  function createWall(
    x: number, y: number, z: number,
    w: number, h: number, rotation: number,
    material: THREE.Material
  ) {
    const geo = new THREE.PlaneGeometry(w, h)
    const mesh = new THREE.Mesh(geo, material)
    mesh.position.set(x, y, z)
    mesh.rotation.y = rotation
    mesh.receiveShadow = true
    scene.add(mesh)

    // Add subtle wall panel lines
    const panelGroup = new THREE.Group()
    panelGroup.position.copy(mesh.position)
    panelGroup.rotation.copy(mesh.rotation)

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xe8e3d8 })
    const panelCount = 4
    const panelWidth = w / panelCount
    for (let i = 1; i < panelCount; i++) {
      const lineGeo = new THREE.PlaneGeometry(0.02, h * 0.9)
      const line = new THREE.Mesh(lineGeo, lineMat)
      line.position.set(-w / 2 + i * panelWidth, 0, 0.005)
      panelGroup.add(line)
    }
    scene.add(panelGroup)
  }

  function addBaseboard() {
    const { width, depth, height } = ROOM_SIZE
    const geo = new THREE.BoxGeometry(0.1, 0.3, 1)
    const mat = new THREE.MeshStandardMaterial({ color: 0xd5cec0, roughness: 0.6 })

    // Baseboards along walls
    const halfW = width / 2
    const halfD = depth / 2
    const y = -height / 2 + 0.15

    // Back wall baseboard
    addBaseboardSegment(-halfW, y, -halfD, width, 0, mat)
    // Front wall baseboard
    addBaseboardSegment(-halfW, y, halfD, width, 0, mat)
    // Left wall baseboard
    addBaseboardSegment(-halfW, y, -halfD, depth, Math.PI / 2, mat)
    // Right wall baseboard
    addBaseboardSegment(halfW, y, -halfD, depth, Math.PI / 2, mat)
  }

  function addBaseboardSegment(
    x: number, y: number, z: number,
    length: number, rotation: number, mat: THREE.Material
  ) {
    const geo = new THREE.BoxGeometry(length, 0.3, 0.08)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(x + (rotation === 0 ? length / 2 : 0), y, z + (rotation !== 0 ? length / 2 : 0))
    mesh.rotation.y = rotation
    mesh.receiveShadow = true
    mesh.castShadow = true
    scene.add(mesh)
  }

  function buildLighting() {
    // Ambient light - warm gallery feel
    const ambient = new THREE.AmbientLight(0xfff8f0, 0.7)
    scene.add(ambient)

    // Main directional light (sunlight through ceiling)
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8)
    sunLight.position.set(0, 10, 2)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    sunLight.shadow.camera.near = 0.5
    sunLight.shadow.camera.far = 50
    sunLight.shadow.camera.left = -15
    sunLight.shadow.camera.right = 15
    sunLight.shadow.camera.top = 15
    sunLight.shadow.camera.bottom = -15
    sunLight.shadow.bias = -0.0001
    scene.add(sunLight)

    // Spot lights for gallery highlighting
    const spotPositions = [
      { x: -5, z: -5 }, { x: 5, z: -5 },
      { x: -5, z: 5 }, { x: 5, z: 5 }
    ]
    spotPositions.forEach(pos => {
      const spot = new THREE.SpotLight(0xfff5e6, 3, 15, Math.PI / 5, 0.3, 1)
      spot.position.set(pos.x, ROOM_SIZE.height / 2 - 0.3, pos.z)
      spot.target.position.set(pos.x, 1, pos.z * 0.3)
      spot.castShadow = true
      spot.shadow.mapSize.width = 512
      spot.shadow.mapSize.height = 512
      scene.add(spot)
      scene.add(spot.target)
    })
  }

  function buildWorks(works: WorkItem[]) {
    works.forEach((work, _globalIndex) => {
      const card = createWorkCard(work)
      clickableObjects.push(card)
      workCards.set(work.id, card)
    })
  }

  function createWorkCard(work: WorkItem): THREE.Mesh {
    const { width, depth } = ROOM_SIZE
    const cardW = 2.2
    const cardH = 3.0
    const hoverOffset = 0.15

    // Determine position based on wall
    const wall = work.position.wall
    const index = work.position.index
    const maxCardsPerWall = 3

    let x = 0, y = 1.5, z = 0, rotY = 0

    switch (wall) {
      case 0: // Back wall
        z = -depth / 2 + hoverOffset
        x = -width / 4 + (index % maxCardsPerWall) * (width / 2.5)
        break
      case 1: // Left wall
        x = -width / 2 + hoverOffset
        z = -depth / 4 + (index % maxCardsPerWall) * (depth / 2.5)
        rotY = Math.PI / 2
        break
      case 2: // Right wall
        x = width / 2 - hoverOffset
        z = -depth / 4 + (index % maxCardsPerWall) * (depth / 2.5)
        rotY = -Math.PI / 2
        break
    }

    // Main card group
    const group = new THREE.Group()

    // Card background - clean white frame
    const cardGeo = new THREE.BoxGeometry(cardW, cardH, 0.06)
    const cardMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.05
    })
    const cardBody = new THREE.Mesh(cardGeo, cardMat)
    cardBody.castShadow = true
    cardBody.receiveShadow = true
    cardBody.position.z = -0.03
    group.add(cardBody)

    // Top accent color strip
    const accentGeo = new THREE.BoxGeometry(cardW, 0.08, 0.07)
    const accentMat = new THREE.MeshStandardMaterial({
      color: getCardColor(wall * maxCardsPerWall + index),
      roughness: 0.3,
      emissive: getCardColor(wall * maxCardsPerWall + index),
      emissiveIntensity: 0.2
    })
    const accent = new THREE.Mesh(accentGeo, accentMat)
    accent.position.y = cardH / 2
    accent.position.z = 0
    group.add(accent)

    // Inner light border
    const borderGeo = new THREE.BoxGeometry(cardW - 0.15, cardH - 0.15, 0.01)
    const borderMat = new THREE.MeshStandardMaterial({
      color: getCardColor(wall * maxCardsPerWall + index),
      roughness: 0.5,
      emissive: getCardColor(wall * maxCardsPerWall + index),
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.3
    })
    const border = new THREE.Mesh(borderGeo, borderMat)
    border.position.z = 0.01
    group.add(border)

    // Create text canvas for work name
    const nameCanvas = document.createElement('canvas')
    nameCanvas.width = 512
    nameCanvas.height = 128
    const ctx = nameCanvas.getContext('2d')!
    ctx.fillStyle = '#3a3540'
    ctx.font = 'bold 36px "Noto Serif SC", serif'
    ctx.textAlign = 'center'
    ctx.fillText(work.name, 256, 50)

    ctx.fillStyle = '#888'
    ctx.font = '20px "Noto Sans SC", sans-serif'
    ctx.fillText(work.category, 256, 85)

    const nameTexture = new THREE.CanvasTexture(nameCanvas)
    nameTexture.minFilter = THREE.LinearFilter
    const nameGeo = new THREE.PlaneGeometry(cardW - 0.4, 0.5)
    const nameMat = new THREE.MeshBasicMaterial({
      map: nameTexture,
      transparent: true,
      depthWrite: false
    })
    const namePlane = new THREE.Mesh(nameGeo, nameMat)
    namePlane.position.set(0, 0.5, 0.05)
    group.add(namePlane)

    // Summary text
    const summaryCanvas = document.createElement('canvas')
    summaryCanvas.width = 512
    summaryCanvas.height = 200
    const sctx = summaryCanvas.getContext('2d')!
    sctx.fillStyle = '#666'
    sctx.font = '18px "Noto Sans SC", sans-serif'
    sctx.textAlign = 'center'
    const words = work.summary.split('')
    const charsPerLine = 18
    for (let i = 0; i < Math.ceil(words.length / charsPerLine); i++) {
      const line = words.slice(i * charsPerLine, (i + 1) * charsPerLine).join('')
      sctx.fillText(line, 256, 40 + i * 28)
    }

    const summaryTexture = new THREE.CanvasTexture(summaryCanvas)
    summaryTexture.minFilter = THREE.LinearFilter
    const summaryGeo = new THREE.PlaneGeometry(cardW - 0.5, 0.9)
    const summaryMat = new THREE.MeshBasicMaterial({
      map: summaryTexture,
      transparent: true,
      depthWrite: false
    })
    const summaryPlane = new THREE.Mesh(summaryGeo, summaryMat)
    summaryPlane.position.set(0, -0.5, 0.05)
    group.add(summaryPlane)

    // Hover "click to view" hint
    const hintCanvas = document.createElement('canvas')
    hintCanvas.width = 256
    hintCanvas.height = 64
    const hctx = hintCanvas.getContext('2d')!
    hctx.fillStyle = '#aaa'
    hctx.font = '16px "Noto Sans SC", sans-serif'
    hctx.textAlign = 'center'
    hctx.fillText('🖱 点击查看详情', 128, 35)

    const hintTexture = new THREE.CanvasTexture(hintCanvas)
    hintTexture.minFilter = THREE.LinearFilter
    const hintGeo = new THREE.PlaneGeometry(cardW - 0.8, 0.25)
    const hintMat = new THREE.MeshBasicMaterial({
      map: hintTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.7
    })
    const hintPlane = new THREE.Mesh(hintGeo, hintMat)
    hintPlane.position.set(0, -1.2, 0.05)
    group.add(hintPlane)

    // Tag pills
    const pillGroup = new THREE.Group()
    pillGroup.position.set(0, -0.85, 0.05)
    work.tags.slice(0, 3).forEach((tag, ti) => {
      const pillGeo = new THREE.PlaneGeometry(0.6, 0.14)
      const pillCanvas = document.createElement('canvas')
      pillCanvas.width = 120
      pillCanvas.height = 28
      const pctx = pillCanvas.getContext('2d')!
      pctx.fillStyle = '#e8f4f8'
      pctx.fillRect(0, 0, 120, 28)
      pctx.fillStyle = '#5a8a9e'
      pctx.font = '12px "Noto Sans SC", sans-serif'
      pctx.textAlign = 'center'
      pctx.fillText(tag, 60, 18)
      const pillTexture = new THREE.CanvasTexture(pillCanvas)
      pillTexture.minFilter = THREE.LinearFilter
      const pillMat = new THREE.MeshBasicMaterial({
        map: pillTexture,
        transparent: true,
        depthWrite: false
      })
      const pill = new THREE.Mesh(pillGeo, pillMat)
      pill.position.set((ti - 1) * 0.7, 0, 0)
      pillGroup.add(pill)
    })
    group.add(pillGroup)

    group.position.set(x, y, z)
    group.rotation.y = rotY
    group.userData = {
      type: 'work',
      workId: work.id,
      workData: work
    }

    scene.add(group)

    // Floating animation - add to group for animation
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.01))
    mesh.position.copy(group.position)
    mesh.rotation.copy(group.rotation)
    mesh.userData = group.userData
    mesh.userData.group = group
    mesh.visible = false
    scene.add(mesh)

    return mesh
  }

  function buildFloatingParticles() {
    const particleGeo = new THREE.SphereGeometry(0.04, 8, 8)
    const particleCount = 200

    for (let i = 0; i < particleCount; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.3, 0.7 + Math.random() * 0.3),
        roughness: 0.5,
        transparent: true,
        opacity: 0.5 + Math.random() * 0.4
      })
      const particle = new THREE.Mesh(particleGeo, mat)
      particle.position.set(
        (Math.random() - 0.5) * ROOM_SIZE.width * 0.9,
        (Math.random() - 0.5) * ROOM_SIZE.height * 0.8,
        (Math.random() - 0.5) * ROOM_SIZE.depth * 0.9
      )
      particle.userData = {
        type: 'particle',
        baseY: particle.position.y,
        speed: 0.3 + Math.random() * 0.7,
        offset: Math.random() * Math.PI * 2
      }
      scene.add(particle)
    }
  }

  function buildFloorTexture() {
    // Add reflective floor grid
    const gridHelper = new THREE.PolarGridHelper(ROOM_SIZE.width / 2, 32, 20, 128, 0xd8d0c0, 0xd8d0c0)
    gridHelper.position.y = -ROOM_SIZE.height / 2 + 0.001
    scene.add(gridHelper)
  }

  // Store handlers for cleanup
  let domClickHandler: ((e: MouseEvent) => void) | null = null
  let pointerLockHandler: (() => void) | null = null
  let mouseMoveHandler: ((e: MouseEvent) => void) | null = null
  let keyDownHandler: ((e: KeyboardEvent) => void) | null = null
  let keyUpHandler: ((e: KeyboardEvent) => void) | null = null
  let touchStartHandler: (() => void) | null = null
  let touchMoveHandler: ((e: TouchEvent) => void) | null = null
  let resizeHandler: (() => void) | null = null

  function setupEvents() {
    const dom = renderer.domElement

    // Click to request pointer lock
    domClickHandler = (e: MouseEvent) => {
      if (disposed) return
      if (!isPointerLocked) {
        dom.requestPointerLock()
      } else {
        handleClick(e)
      }
    }
    dom.addEventListener('click', domClickHandler)

    // Pointer lock change
    pointerLockHandler = () => {
      if (disposed) return
      isPointerLocked = document.pointerLockElement === dom
      if (!isPointerLocked) {
        keys.w = keys.a = keys.s = keys.d = false
      }
    }
    document.addEventListener('pointerlockchange', pointerLockHandler)

    // Mouse move (for pointer lock look)
    mouseMoveHandler = (e: MouseEvent) => {
      if (disposed) return
      if (isPointerLocked) {
        mouseX = -e.movementX || 0
        mouseY = -e.movementY || 0
      }
    }
    document.addEventListener('mousemove', mouseMoveHandler)

    // Keyboard
    keyDownHandler = (e: KeyboardEvent) => {
      if (disposed || !isPointerLocked) return
      switch (e.key.toLowerCase()) {
        case 'w': keys.w = true; break
        case 'a': keys.a = true; break
        case 's': keys.s = true; break
        case 'd': keys.d = true; break
        case 'shift': keys.shift = true; break
      }
    }
    document.addEventListener('keydown', keyDownHandler)

    keyUpHandler = (e: KeyboardEvent) => {
      if (disposed) return
      switch (e.key.toLowerCase()) {
        case 'w': keys.w = false; break
        case 'a': keys.a = false; break
        case 's': keys.s = false; break
        case 'd': keys.d = false; break
        case 'shift': keys.shift = false; break
      }
    }
    document.addEventListener('keyup', keyUpHandler)

    // Touch controls for mobile
    let lastTouchX = 0
    let lastTouchY = 0
    touchStartHandler = () => {
      if (disposed) return
      isPointerLocked = true
    }
    dom.addEventListener('touchstart', touchStartHandler)

    touchMoveHandler = (e: TouchEvent) => {
      if (disposed || !isPointerLocked) return
      const touch = e.touches[0]
      mouseX = -(touch.clientX - lastTouchX) * 0.5
      mouseY = -(touch.clientY - lastTouchY) * 0.5
      lastTouchX = touch.clientX
      lastTouchY = touch.clientY
    }
    dom.addEventListener('touchmove', touchMoveHandler)

    // Resize
    resizeHandler = () => {
      if (disposed || !containerRef.value) return
      camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
    }
    window.addEventListener('resize', resizeHandler)
  }

  function handleClick(e: MouseEvent) {
    raycaster.setFromCamera(
      new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      ),
      camera
    )

    const intersects = raycaster.intersectObjects(clickableObjects, true)
    if (intersects.length > 0) {
      let obj = intersects[0].object
      // Traverse up to find userData
      while (obj && (!obj.userData || !obj.userData.type)) {
        obj = obj.parent as THREE.Object3D
      }
      if (obj && obj.userData) {
        if (obj.userData.type === 'work') {
          onWorkClick(obj.userData.workData as WorkItem)
        } else if (obj.userData.type === 'signature') {
          // Show signature comment
          const sig = obj.userData.signatureData as SignatureItem
          alert(`${sig.name}: ${sig.comment}`)
        }
      }
    }
  }

  function updateHoverHighlight() {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
    const intersects = raycaster.intersectObjects(clickableObjects, true)

    // Reset all highlights
    workCards.forEach(card => {
      const group = card.userData.group as THREE.Group
      if (group) {
        group.scale.set(1, 1, 1)
      }
    })

    if (intersects.length > 0) {
      let obj = intersects[0].object
      while (obj && (!obj.userData || !obj.userData.type)) {
        obj = obj.parent as THREE.Object3D
      }
      if (obj?.userData?.type === 'work') {
        const group = obj.userData.group as THREE.Group
        if (group) {
          group.scale.set(1.03, 1.03, 1.03)
        }
      }
    }
  }

  function animate() {
    if (disposed) return
    animationId = requestAnimationFrame(animate)

    const delta = Math.min(clock.getDelta(), 0.1)

    // Player movement
    if (isPointerLocked) {
      // Rotation
      euler.y += mouseX * MOUSE_SENSITIVITY
      euler.x += mouseY * MOUSE_SENSITIVITY
      euler.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, euler.x))
      mouseX = 0
      mouseY = 0

      camera.quaternion.setFromEuler(euler)

      // Movement
      direction.set(0, 0, Number(keys.s) - Number(keys.w))
      right.set(Number(keys.d) - Number(keys.a), 0, 0)

      const speed = MOVE_SPEED * (keys.shift ? 2 : 1) * delta

      velocity.addScaledVector(direction, speed)
      velocity.addScaledVector(right, speed)
      velocity.y = 0

      // Apply movement with collision
      const newPos = camera.position.clone().add(velocity)
      newPos.x = Math.max(roomBounds.minX, Math.min(roomBounds.maxX, newPos.x))
      newPos.z = Math.max(roomBounds.minZ, Math.min(roomBounds.maxZ, newPos.z))
      newPos.y = CAMERA_HEIGHT
      camera.position.copy(newPos)

      velocity.multiplyScalar(0)
    }

    // Animate particles
    scene.children.forEach(child => {
      if (child.userData?.type === 'particle') {
        const t = performance.now() * 0.001
        child.position.y = child.userData.baseY +
          Math.sin(t * child.userData.speed + child.userData.offset) * 0.3
      }
    })

    // Animate work cards (gentle float)
    workCards.forEach(card => {
      const group = card.userData.group as THREE.Group
      if (group) {
        const t = performance.now() * 0.001
        group.position.y += Math.sin(t * 0.5 + group.position.x) * 0.001
      }
    })

    // Update hover
    updateHoverHighlight()

    renderer.render(scene, camera)
  }

  function addSignatureToWall(sig: SignatureItem) {
    // Create a signature plane on the right wall
    const signGroup = new THREE.Group()

    // Small card for signature
    const cardGeo = new THREE.PlaneGeometry(0.35, 0.5)
    const cardMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      side: THREE.DoubleSide
    })
    const card = new THREE.Mesh(cardGeo, cardMat)
    signGroup.add(card)

    // Signature image
    const img = new Image()
    img.src = sig.signatureDataUrl
    img.onload = () => {
      const tex = new THREE.CanvasTexture(img as unknown as HTMLCanvasElement)
      tex.minFilter = THREE.LinearFilter
      card.material = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    }

    // Position on right wall
    const { width } = ROOM_SIZE
    signGroup.position.set(
      width / 2 - 0.06,
      sig.position.y,
      sig.position.z
    )
    signGroup.rotation.y = -Math.PI / 2

    card.userData = {
      type: 'signature',
      signatureData: sig
    }

    scene.add(signGroup)
    clickableObjects.push(card)
    signatureMeshes.set(sig.id, card)

    return signGroup
  }

  function cleanup() {
    disposed = true
    if (animationId) cancelAnimationFrame(animationId)

    // Remove all event listeners using stored references
    const dom = renderer?.domElement
    if (dom && domClickHandler) dom.removeEventListener('click', domClickHandler)
    if (pointerLockHandler) document.removeEventListener('pointerlockchange', pointerLockHandler)
    if (mouseMoveHandler) document.removeEventListener('mousemove', mouseMoveHandler)
    if (keyDownHandler) document.removeEventListener('keydown', keyDownHandler)
    if (keyUpHandler) document.removeEventListener('keyup', keyUpHandler)
    if (dom && touchStartHandler) dom.removeEventListener('touchstart', touchStartHandler)
    if (dom && touchMoveHandler) dom.removeEventListener('touchmove', touchMoveHandler)
    if (resizeHandler) window.removeEventListener('resize', resizeHandler)

    // Dispose Three.js resources
    if (renderer) {
      renderer.dispose()
      if (containerRef.value && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    }

    // Clear references
    domClickHandler = null
    pointerLockHandler = null
    mouseMoveHandler = null
    keyDownHandler = null
    keyUpHandler = null
    touchStartHandler = null
    touchMoveHandler = null
    resizeHandler = null
  }

  return {
    init,
    cleanup,
    addSignatureToWall,
    isPointerLocked
  }
}
