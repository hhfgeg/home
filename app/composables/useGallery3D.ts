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

const ROOM_SIZE = { width: 28, height: 12, depth: 24 }
const CAMERA_HEIGHT = -4.0   // ~1.8m above floor (floor at y=-6)
const MOVE_SPEED = 8
const ROTATION_SENSITIVITY = 0.005
const MIN_FOV = 35
const MAX_FOV = 100

const cardColors = [
  0x6ec6f0, 0xa8d8ea, 0xb8dff0, 0x87ceeb,
  0xadd8e6, 0x9ad0e0, 0x7ec8e3, 0x8dd4e8
]
function getCardColor(index: number): number {
  return cardColors[Math.abs(index) % cardColors.length]!
}

export interface AuthorInfo {
  penName: string
  bio: string
  tags: string[]
  contact: { email?: string; github?: string; twitter?: string; website?: string }
}

export function useGallery3D(
  containerRef: Ref<HTMLElement | null>,
  works: WorkItem[],
  onWorkClick: (work: WorkItem) => void,
  signatures: Ref<SignatureItem[]>,
  author?: AuthorInfo
) {
  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let renderer: THREE.WebGLRenderer
  let clock: THREE.Clock
  let animationId: number = 0
  let raycaster: THREE.Raycaster

  let disposed = false
  let entered = false
  let isRightDragging = false
  let rightDragMoved = false
  let prevMouseX = 0
  let prevMouseY = 0
  let targetPosition: THREE.Vector3 | null = null
  const currentLookTarget = new THREE.Vector3(0, CAMERA_HEIGHT, -ROOM_SIZE.depth / 2)
  let cameraYaw = 0
  let cameraPitch = 0

  type FocusType = 'work' | 'about' | 'signature-wall'
  type FocusState = {
    type: FocusType
    work?: WorkItem
    label?: string
    cardGroup: THREE.Group
    prevPosition: THREE.Vector3
    prevYaw: number; prevPitch: number; prevFov: number
    targetPos: THREE.Vector3
    targetYaw: number; targetPitch: number; targetFov: number
    progress: number
  } | null
  let focusState: FocusState = null
  const FOCUS_SPEED = 2.5
  const RESET_SPEED = 3.0

  // References to special cards
  let aboutGroup: THREE.Group | null = null
  let signatureTitleGroup: THREE.Group | null = null

  // Default camera state for reset (slightly angled to show left+right walls)
  const defaultPosition = new THREE.Vector3(0, CAMERA_HEIGHT, ROOM_SIZE.depth / 2 - 1)
  const defaultYaw = -0.35
  const defaultPitch = 0
  const defaultFov = 70

  // Reset animation state
  type ResetState = {
    prevPosition: THREE.Vector3; prevYaw: number; prevPitch: number; prevFov: number
    targetPos: THREE.Vector3; targetYaw: number; targetPitch: number; targetFov: number
    progress: number
  } | null
  let resetState: ResetState = null

  const keys = { w: false, a: false, s: false, d: false }
  const moveDir = new THREE.Vector3()

  const clickableObjects: THREE.Object3D[] = []
  const workCards: Map<string, THREE.Mesh> = new Map()
  const signatureMeshes: Map<string, THREE.Mesh> = new Map()
  let floorMesh: THREE.Mesh | null = null
  let moveMarker: THREE.Mesh | null = null

  const roomBounds = {
    minX: -ROOM_SIZE.width / 2 + 0.8,
    maxX: ROOM_SIZE.width / 2 - 0.8,
    minZ: -ROOM_SIZE.depth / 2 + 0.8,
    maxZ: ROOM_SIZE.depth / 2 - 0.8
  }

  // ==================================================================
  // INIT
  // ==================================================================
  function init() {
    if (!containerRef.value) return

    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xfafaf7)
    scene.fog = new THREE.Fog(0xfafaf7, 30, 55)

    camera = new THREE.PerspectiveCamera(70, containerRef.value.clientWidth / containerRef.value.clientHeight, 0.1, 100)
    camera.position.set(0, CAMERA_HEIGHT, ROOM_SIZE.depth / 2 - 1)
    // Point slightly left so the about card & signature wall are visible from start
    cameraYaw = -0.35
    camera.lookAt(
      Math.sin(cameraYaw) * 10,
      CAMERA_HEIGHT,
      camera.position.z - Math.cos(cameraYaw) * 10
    )

    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    containerRef.value.appendChild(renderer.domElement)

    raycaster = new THREE.Raycaster()
    raycaster.far = 50
    clock = new THREE.Clock()

    buildRoom()
    buildLighting()
    buildWorks(works)
    if (author) buildAboutCard(author)
    buildSignatureTitle()
    // Load existing signatures
    signatures.value.forEach(s => addSignatureToWall(s))
    buildFloorLabels()  // Guide labels on the floor
    buildMarker()
    setupEvents()
    animate()
  }

  // ==================================================================
  // ROOM — clean white walls
  // ==================================================================
  function buildRoom() {
    const { width, height, depth } = ROOM_SIZE
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf0ede8, roughness: 0.9 })
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xeae5db, roughness: 0.85 })
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xfefefc, roughness: 0.95 })

    // Floor
    const floorGeo = new THREE.PlaneGeometry(width, depth)
    floorMesh = new THREE.Mesh(floorGeo, floorMat)
    floorMesh.rotation.x = -Math.PI / 2
    floorMesh.position.y = -height / 2
    floorMesh.receiveShadow = true
    floorMesh.userData = { type: 'floor' }
    scene.add(floorMesh)

    // Ceiling
    const c = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), ceilingMat)
    c.rotation.x = Math.PI / 2
    c.position.y = height / 2
    scene.add(c)

    // Walls
    const hw = width / 2, hd = depth / 2
    const walls: [number, number, number, number, number, number][] = [
      [0, 0, -hd, width, height, 0],        // back
      [0, 0, hd, width, height, Math.PI],    // front
      [-hw, 0, 0, depth, height, Math.PI / 2],  // left
      [hw, 0, 0, depth, height, -Math.PI / 2],  // right
    ]
    walls.forEach(([x, y, z, w, h, r]) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat)
      mesh.position.set(x, y, z)
      mesh.rotation.y = r
      mesh.receiveShadow = true
      scene.add(mesh)
    })

    // Subtle baseboard
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xe0dbd0, roughness: 0.6 })
    const trimH = 0.25
    walls.forEach(([x, y, z, w, _h, r]) => {
      const trim = new THREE.Mesh(new THREE.BoxGeometry(w, trimH, 0.06), trimMat)
      trim.position.set(x, -height / 2 + trimH / 2, z)
      trim.rotation.y = r
      scene.add(trim)
    })
  }

  // ==================================================================
  // LIGHTING — clean and bright
  // ==================================================================
  function buildLighting() {
    scene.add(new THREE.AmbientLight(0xfffaf5, 2.0))
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe8e0d4, 0.5))

    const dl = new THREE.DirectionalLight(0xfffef9, 1.0)
    dl.position.set(5, ROOM_SIZE.height / 2, 3)
    scene.add(dl)

    const fl = new THREE.DirectionalLight(0xf8f4ff, 0.5)
    fl.position.set(-5, ROOM_SIZE.height / 3, ROOM_SIZE.depth / 2)
    scene.add(fl)

    // Recessed ceiling spots
    for (let px = -ROOM_SIZE.width / 4; px <= ROOM_SIZE.width / 4; px += ROOM_SIZE.width / 2) {
      for (let pz = -ROOM_SIZE.depth / 4; pz <= ROOM_SIZE.depth / 4; pz += ROOM_SIZE.depth / 2) {
        const pl = new THREE.PointLight(0xfffef8, 2, 14, 1.5)
        pl.position.set(px, ROOM_SIZE.height / 2 - 0.4, pz)
        scene.add(pl)
      }
    }
  }

  // ==================================================================
  // MARKER
  // ==================================================================
  function buildMarker() {
    const ringGeo = new THREE.RingGeometry(0.25, 0.35, 32)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x7eb8da, side: THREE.DoubleSide, transparent: true, opacity: 0.5, depthWrite: false })
    moveMarker = new THREE.Mesh(ringGeo, ringMat)
    moveMarker.rotation.x = -Math.PI / 2
    moveMarker.position.y = -ROOM_SIZE.height / 2 + 0.02
    moveMarker.visible = false
    scene.add(moveMarker)
  }

  // ==================================================================
  // WORKS — clear cards on walls
  // ==================================================================
  function buildWorks(works: WorkItem[]) {
    works.forEach((work) => {
      const { group, hitbox } = createWorkCard(work)
      clickableObjects.push(group)
      workCards.set(work.id, hitbox)
    })
  }

  function createWorkCard(work: WorkItem): { group: THREE.Group; hitbox: THREE.Mesh } {
    const { width, depth } = ROOM_SIZE
    const cardW = 4.8
    const cardH = 2.7  // 16:9
    const hoverOffset = 0.15
    const wall = work.position.wall
    const index = work.position.index
    let x = 0, y = 0, z = 0, rotY = 0

    switch (wall) {
      case 0: // Back wall — single row of 3
        z = -depth / 2 + hoverOffset
        x = -width / 3 + index * (width / 3)
        y = 0
        break
      case 1: // Left wall — single row, work at z=6 (about card at z=-6)
        x = -width / 2 + hoverOffset
        z = 6  // right of about card
        y = 0
        rotY = Math.PI / 2
        break
      case 2: // Right wall — single row, works at z=0 and z=8 (sig at z=-8)
        x = width / 2 - hoverOffset
        z = 0 + index * 8  // sig at z=-8, work0 at z=0, work1 at z=8
        y = 0
        rotY = -Math.PI / 2
        break
    }

    const group = new THREE.Group()
    const colorIdx = wall * 3 + index
    const accentColor = getCardColor(colorIdx)
    const accentHex = '#' + new THREE.Color(accentColor).getHexString()

    // === Dark backdrop shadow ===
    const shadow = new THREE.Mesh(
      new THREE.BoxGeometry(cardW + 0.2, cardH + 0.2, 0.03),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.12, depthWrite: false })
    )
    shadow.position.z = -0.04
    group.add(shadow)

    // === Single card face texture (1920x1080, full 16:9) ===
    const fw = 1920, fh = 1080
    const fc = document.createElement('canvas')
    fc.width = fw; fc.height = fh
    const ctx = fc.getContext('2d')!

    // White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, fw, fh)

    // Left accent bar
    const barX = 60
    ctx.fillStyle = accentHex
    ctx.fillRect(barX, 120, 8, fh - 240)

    // Top accent line
    ctx.fillRect(barX + 30, 80, fw - barX - 120, 3)

    // === TITLE ===
    ctx.fillStyle = '#1a1520'
    ctx.font = 'bold 68px "Noto Serif SC", serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(work.name, barX + 40, 140)

    // Category badge
    ctx.font = '28px "Noto Sans SC", sans-serif'
    ctx.fillStyle = '#7a8a9e'
    ctx.fillText(work.category, barX + 40, 230)

    // Divider
    ctx.strokeStyle = accentHex + '60'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(barX + 40, 290)
    ctx.lineTo(barX + 600, 290)
    ctx.stroke()

    // === SUMMARY ===
    ctx.font = '32px "Noto Sans SC", sans-serif'
    ctx.fillStyle = '#444'
    const summaryLines = wrapLines(work.summary, 18)
    summaryLines.slice(0, 3).forEach((line, i) => {
      ctx.fillText(line, barX + 40, 320 + i * 48)
    })

    // === TAGS ===
    const tagY = 650
    ctx.font = '24px "Noto Sans SC", sans-serif'
    let tagX = barX + 40
    work.tags.slice(0, 4).forEach(tag => {
      const metrics = ctx.measureText(tag)
      const tw = metrics.width + 36
      ctx.fillStyle = '#f0f5f9'
      ctx.fillRect(tagX, tagY - 28, tw, 46)
      ctx.strokeStyle = accentHex + '40'
      ctx.lineWidth = 1
      ctx.strokeRect(tagX, tagY - 28, tw, 46)
      ctx.fillStyle = '#5a7a8e'
      ctx.fillText(tag, tagX + 18, tagY - 14)
      tagX += tw + 20
    })

    // === HINT ===
    ctx.font = '20px "Noto Sans SC", sans-serif'
    ctx.fillStyle = '#bbb'
    ctx.textAlign = 'right'
    ctx.fillText('🖱 点击聚焦查看 →', fw - 80, 900)

    // Bottom accent line
    ctx.fillStyle = accentHex
    ctx.fillRect(barX + 30, fh - 83, fw - barX - 120, 3)
    ctx.textAlign = 'left'

    // Apply texture to card face plane
    const cardTex = new THREE.CanvasTexture(fc)
    cardTex.minFilter = THREE.LinearMipmapLinearFilter
    cardTex.magFilter = THREE.LinearFilter
    cardTex.generateMipmaps = true
    cardTex.needsUpdate = true

    const cardGeo = new THREE.PlaneGeometry(cardW, cardH)
    const cardMat = new THREE.MeshBasicMaterial({ map: cardTex, depthWrite: false })
    const cardPlane = new THREE.Mesh(cardGeo, cardMat)
    cardPlane.position.z = 0.03
    group.add(cardPlane)

    group.position.set(x, y, z)
    group.rotation.y = rotY
    group.userData = { type: 'work', workId: work.id, workData: work }
    scene.add(group)

    const hitbox = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.01))
    hitbox.position.copy(group.position)
    hitbox.rotation.copy(group.rotation)
    hitbox.userData = { ...group.userData, group }
    hitbox.visible = false
    scene.add(hitbox)

    return { group, hitbox }
  }

  // ==================================================================
  // ABOUT CARD — left wall, 16:9 landscape
  // ==================================================================
  function buildAboutCard(author: AuthorInfo) {
    const { width } = ROOM_SIZE
    const group = new THREE.Group()
    const cardW = 4.8, cardH = 2.7  // same 16:9 as works

    // Shadow
    group.add(new THREE.Mesh(
      new THREE.BoxGeometry(cardW + 0.15, cardH + 0.15, 0.03),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.1, depthWrite: false })
    ))

    // Body
    group.add(new THREE.Mesh(
      new THREE.BoxGeometry(cardW, cardH, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05 })
    ))

    // Canvas texture — 16:9 landscape
    const fw = 1920, fh = 1080
    const fc = document.createElement('canvas')
    fc.width = fw; fc.height = fh
    const ctx = fc.getContext('2d')!
    // Warm gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, fh)
    bgGrad.addColorStop(0, '#ffffff'); bgGrad.addColorStop(0.6, '#faf8f5'); bgGrad.addColorStop(1, '#f5f0eb')
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, fw, fh)

    const barX = 60

    // Top accent bar with gradient
    const topGrad = ctx.createLinearGradient(barX + 30, 0, fw - barX - 90, 0)
    topGrad.addColorStop(0, '#87ceeb'); topGrad.addColorStop(0.5, '#b8dff0'); topGrad.addColorStop(1, '#87ceeb')
    ctx.fillStyle = topGrad; ctx.fillRect(barX + 30, 70, fw - barX - 120, 4)

    // Left accent bar (thicker)
    ctx.fillStyle = '#87ceeb'; ctx.fillRect(barX, 100, 10, fh - 200)

    // === AVATAR ===
    // Avatar circle
    ctx.fillStyle = '#e8f4f8'
    ctx.beginPath(); ctx.arc(barX + 180, 260, 100, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#87ceeb'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(barX + 180, 260, 100, 0, Math.PI * 2); ctx.stroke()

    // Avatar initial
    ctx.fillStyle = '#87ceeb'
    ctx.font = 'bold 72px "Noto Serif SC", serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(author.penName.charAt(0), barX + 180, 258)

    // === PEN NAME ===
    const nameX = barX + 330
    ctx.fillStyle = '#1a1520'; ctx.font = 'bold 52px "Noto Serif SC", serif'
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'
    ctx.fillText(author.penName, nameX, 168)

    // Subtitle
    ctx.font = '22px "Noto Sans SC", sans-serif'; ctx.fillStyle = '#999'
    ctx.fillText('AI探索者 · 创意工程师 · 数字叙事者', nameX, 240)

    // === DIVIDER ===
    ctx.strokeStyle = '#e0dcd5'; ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(nameX, 320); ctx.lineTo(nameX + 700, 320)
    ctx.stroke()

    // === BIO ===
    ctx.fillStyle = '#555'; ctx.font = '26px "Noto Sans SC", sans-serif'
    const bioText = author.bio
    const bioLines: string[] = []
    let line = ''
    for (const ch of bioText) {
      line += ch
      if (line.length >= 22) { bioLines.push(line); line = '' }
    }
    if (line) bioLines.push(line)
    bioLines.slice(0, 4).forEach((l, i) => {
      ctx.fillText(l, nameX, 350 + i * 42)
    })

    // === TAGS ===
    const tagY = 580
    ctx.font = '22px "Noto Sans SC", sans-serif'
    let tagX = nameX
    author.tags.forEach(tag => {
      const m = ctx.measureText(tag); const tw = m.width + 36
      ctx.fillStyle = '#e8f4f8'; ctx.fillRect(tagX, tagY - 30, tw, 44)
      ctx.strokeStyle = '#87ceeb60'; ctx.lineWidth = 1; ctx.strokeRect(tagX, tagY - 30, tw, 44)
      ctx.fillStyle = '#5a8a9e'; ctx.fillText(tag, tagX + 18, tagY - 14)
      tagX += tw + 16
    })

    // === CONTACT ===
    const contactY = 710
    ctx.font = '20px "Noto Sans SC", sans-serif'; ctx.fillStyle = '#aaa'
    const contacts: string[] = []
    if (author.contact?.email) contacts.push('📧 ' + author.contact.email)
    if (author.contact?.website) contacts.push('🌐 ' + author.contact.website)
    contacts.forEach((c, i) => ctx.fillText(c, nameX, contactY + i * 36))

    // === CLICK HINT ===
    ctx.font = '18px "Noto Sans SC", sans-serif'; ctx.fillStyle = '#ccc'
    ctx.textAlign = 'right'
    ctx.fillText('🖱 点击查看详情 →', fw - 80, 850)

    // Bottom accent
    ctx.fillStyle = '#87ceeb'; ctx.fillRect(barX + 30, fh - 74, fw - barX - 120, 3)
    ctx.textAlign = 'left'

    const tex = new THREE.CanvasTexture(fc)
    tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter
    tex.generateMipmaps = true; tex.needsUpdate = true

    group.add(new THREE.Mesh(
      new THREE.PlaneGeometry(cardW, cardH),
      new THREE.MeshBasicMaterial({ map: tex, depthWrite: false })
    ))

    // Position on left wall, at z=-6 (left column)
    group.position.set(-width / 2 + 0.2, 0, -6)
    group.rotation.y = Math.PI / 2
    group.userData = { type: 'about', clickable: true }
    scene.add(group)
    clickableObjects.push(group)
    aboutGroup = group
  }

  // ==================================================================
  // SIGNATURE WALL TITLE — right wall
  // ==================================================================
  function buildSignatureTitle() {
    const { width } = ROOM_SIZE
    const group = new THREE.Group()
    const cardW = 4.8, cardH = 2.7  // same 16:9 as works

    // Shadow
    group.add(new THREE.Mesh(
      new THREE.BoxGeometry(cardW + 0.15, cardH + 0.15, 0.03),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.1, depthWrite: false })
    ))

    // Body
    group.add(new THREE.Mesh(
      new THREE.BoxGeometry(cardW, cardH, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05 })
    ))

    // Canvas texture — 16:9 landscape
    const fw = 1920, fh = 1080
    const fc = document.createElement('canvas')
    fc.width = fw; fc.height = fh
    const ctx = fc.getContext('2d')!
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, fw, fh)

    const barX = 60
    ctx.fillStyle = '#87ceeb'
    ctx.fillRect(barX, 120, 8, fh - 240)
    ctx.fillRect(barX + 30, 80, fw - barX - 120, 3)

    // Title
    ctx.fillStyle = '#1a1520'
    ctx.font = 'bold 56px "Noto Serif SC", serif'
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'
    ctx.fillText('签名墙', barX + 60, 180)

    ctx.font = '24px "Noto Sans SC", sans-serif'; ctx.fillStyle = '#999'
    ctx.fillText('留下你的足迹与感悟', barX + 60, 280)

    // Pen icon hint
    ctx.font = '48px sans-serif'
    ctx.fillText('🖊️', barX + 60, 400)

    ctx.font = '20px "Noto Sans SC", sans-serif'; ctx.fillStyle = '#bbb'
    ctx.fillText('点击下方「签名」按钮参与', barX + 140, 430)

    // Bottom accent
    ctx.fillStyle = '#87ceeb'; ctx.fillRect(barX + 30, fh - 83, fw - barX - 120, 3)

    const tex = new THREE.CanvasTexture(fc)
    tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter
    tex.generateMipmaps = true; tex.needsUpdate = true

    group.add(new THREE.Mesh(
      new THREE.PlaneGeometry(cardW, cardH),
      new THREE.MeshBasicMaterial({ map: tex, depthWrite: false })
    ))

    // Position on right wall, at z=-8 (leftmost of 3 columns)
    group.position.set(width / 2 - 0.2, 0, -8)
    group.rotation.y = -Math.PI / 2
    group.userData = { type: 'signature-wall', clickable: true }
    scene.add(group)
    clickableObjects.push(group)
    signatureTitleGroup = group
  }

  // ==================================================================
  // FLOOR LABELS — guide markers on the floor
  // ==================================================================
  function buildFloorLabels() {
    const { width, height, depth } = ROOM_SIZE
    const floorY = -height / 2 + 0.03

    function makeLabel(text: string, x: number, z: number, rotZ: number = 0): THREE.Sprite {
      const c = document.createElement('canvas')
      c.width = 512; c.height = 128
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#87ceeb'; ctx.font = 'bold 36px "Noto Sans SC", sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(text, 256, 64)
      ctx.fillStyle = 'rgba(135,206,235,0.15)'
      ctx.fillRect(0, 50, 512, 28)

      const tex = new THREE.CanvasTexture(c)
      tex.minFilter = THREE.LinearFilter
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex, transparent: true, opacity: 0.7, depthWrite: false, depthTest: false
      }))
      sprite.position.set(x, floorY, z)
      sprite.scale.set(6, 1.5, 1)
      sprite.rotation.z = rotZ
      return sprite
    }

    // Left wall — "个人信息 →" pointing right (toward center)
    scene.add(makeLabel('个人信息 →', -width / 2 + 3, -6, -Math.PI / 2))
    // Right wall — "← 签名墙" pointing left (toward center)
    scene.add(makeLabel('← 签名墙', width / 2 - 3, -8, Math.PI / 2))
    // Back wall — "▲ 作品" at center-back
    scene.add(makeLabel('▲ 作品', 0, -depth / 2 + 3))
  }

  // ==================================================================
  function wrapLines(text: string, perLine: number): string[] {
    const chars = text.split('')
    const out: string[] = []
    for (let i = 0; i < Math.ceil(chars.length / perLine); i++) {
      out.push(chars.slice(i * perLine, (i + 1) * perLine).join(''))
    }
    return out
  }

  // ==================================================================
  // EVENTS
  // ==================================================================
  let handlers: Record<string, ((e: any) => void) | null> = {}

  function setupEvents() {
    const dom = renderer.domElement

    // Click
    handlers.click = (e: MouseEvent) => {
      if (disposed || !entered) return
      if (rightDragMoved) { rightDragMoved = false; return }

      raycaster.setFromCamera(new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1), camera)

      // Focus exit
      if (focusState) { exitFocus(); return }

      // Any clickable card → focus
      const hits = raycaster.intersectObjects(clickableObjects, true)
      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0]!.object
        while (obj && (!obj.userData || !obj.userData.type)) obj = obj.parent as THREE.Object3D
        if (obj?.userData?.type === 'work' && obj instanceof THREE.Group) {
          enterFocus('work', obj, obj.userData.workData as WorkItem)
          return
        }
        if (obj?.userData?.type === 'about' && obj instanceof THREE.Group) {
          enterFocus('about', obj, undefined, '个人信息')
          return
        }
        if (obj?.userData?.type === 'signature-wall' && obj instanceof THREE.Group) {
          enterFocus('signature-wall', obj, undefined, '签名墙')
          return
        }
        if (obj?.userData?.type === 'signature') {
          // Click on a signature on the wall → show its content
          const sd = obj.userData.signatureData
          alert(`${sd.name}: ${sd.comment}`)
          return
        }
      }

      // Floor click → move
      if (floorMesh && !focusState) {
        const fhits = raycaster.intersectObject(floorMesh)
        if (fhits.length > 0) {
          const p = fhits[0]!.point
          targetPosition = new THREE.Vector3(
            Math.max(roomBounds.minX, Math.min(roomBounds.maxX, p.x)),
            CAMERA_HEIGHT,
            Math.max(roomBounds.minZ, Math.min(roomBounds.maxZ, p.z))
          )
          if (moveMarker) { moveMarker.position.set(targetPosition.x, -ROOM_SIZE.height / 2 + 0.03, targetPosition.z); moveMarker.visible = true }
        }
      }
    }
    dom.addEventListener('click', handlers.click)

    // Right drag
    handlers.mousedown = (e: MouseEvent) => {
      if (disposed || !entered || e.button !== 2) return
      isRightDragging = true; rightDragMoved = false
      prevMouseX = e.clientX; prevMouseY = e.clientY
    }
    dom.addEventListener('mousedown', handlers.mousedown)

    handlers.mouseup = (e: MouseEvent) => {
      if (e.button === 2) { isRightDragging = false; rightDragMoved = false }
    }
    document.addEventListener('mouseup', handlers.mouseup)

    handlers.mousemove = (e: MouseEvent) => {
      if (!entered || !isRightDragging) return
      const dx = e.clientX - prevMouseX, dy = e.clientY - prevMouseY
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) rightDragMoved = true
      cameraYaw -= dx * ROTATION_SENSITIVITY
      cameraPitch -= dy * ROTATION_SENSITIVITY
      cameraPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, cameraPitch))
      prevMouseX = e.clientX; prevMouseY = e.clientY
    }
    document.addEventListener('mousemove', handlers.mousemove)

    // Wheel zoom
    handlers.wheel = (e: WheelEvent) => {
      if (!entered) return
      e.preventDefault()
      camera.fov = Math.max(MIN_FOV, Math.min(MAX_FOV, camera.fov + e.deltaY * 0.05))
      camera.updateProjectionMatrix()
    }
    dom.addEventListener('wheel', handlers.wheel, { passive: false })

    // Context menu
    handlers.contextmenu = (e: Event) => { if (entered) e.preventDefault() }
    dom.addEventListener('contextmenu', handlers.contextmenu)

    // Keyboard
    handlers.keydown = (e: KeyboardEvent) => {
      if (disposed || !entered) return
      if (e.key === 'Escape' && focusState) { exitFocus(); return }
      switch (e.key.toLowerCase()) { case 'w': keys.w = true; break; case 'a': keys.a = true; break; case 's': keys.s = true; break; case 'd': keys.d = true; break }
    }
    document.addEventListener('keydown', handlers.keydown)

    handlers.keyup = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) { case 'w': keys.w = false; break; case 'a': keys.a = false; break; case 's': keys.s = false; break; case 'd': keys.d = false; break }
    }
    document.addEventListener('keyup', handlers.keyup)

    // Resize
    handlers.resize = () => {
      if (disposed || !containerRef.value) return
      camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
    }
    window.addEventListener('resize', handlers.resize)
  }

  // ==================================================================
  // FOCUS
  // ==================================================================
  function enterFocus(type: FocusType, cardGroup: THREE.Group, work?: WorkItem, label?: string) {
    const cardPos = cardGroup.position.clone()
    const cardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, cardGroup.rotation.y, 0)))
    const targetPos = cardPos.clone().add(cardDir.multiplyScalar(3.0))
    targetPos.y = cardPos.y
    targetPos.x = Math.max(roomBounds.minX, Math.min(roomBounds.maxX, targetPos.x))
    targetPos.z = Math.max(roomBounds.minZ, Math.min(roomBounds.maxZ, targetPos.z))
    const targetYaw = Math.atan2(cardPos.x - targetPos.x, -(cardPos.z - targetPos.z))

    focusState = {
      type, work, label,
      cardGroup,
      prevPosition: camera.position.clone(), prevYaw: cameraYaw, prevPitch: cameraPitch, prevFov: camera.fov,
      targetPos, targetYaw, targetPitch: 0, targetFov: 75, progress: 0
    }
  }

  function exitFocus() {
    if (!focusState) return
    focusState = {
      ...focusState!,
      targetPos: focusState!.prevPosition.clone(), targetYaw: focusState!.prevYaw, targetPitch: focusState!.prevPitch, targetFov: focusState!.prevFov,
      prevPosition: camera.position.clone(), prevYaw: cameraYaw, prevPitch: cameraPitch, prevFov: camera.fov,
      progress: 0
    }
    ;(focusState as any).isExiting = true
  }

  function isFocused() { return focusState !== null && !(focusState as any).isExiting }

  // ==================================================================
  // ANIMATE
  // ==================================================================
  function animate() {
    if (disposed) return
    animationId = requestAnimationFrame(animate)
    const delta = Math.min(clock.getDelta(), 0.1)

    if (entered) {
      // Reset animation (has priority over everything)
      if (resetState) {
        resetState.progress = Math.min(1, resetState.progress + RESET_SPEED * delta)
        const t = ease(resetState.progress)
        camera.position.lerpVectors(resetState.prevPosition, resetState.targetPos, t)
        cameraYaw = lerpAngle(resetState.prevYaw, resetState.targetYaw, t)
        cameraPitch = lerp(resetState.prevPitch, resetState.targetPitch, t)
        camera.fov = lerp(resetState.prevFov, resetState.targetFov, t)
        camera.updateProjectionMatrix()
        keys.w = keys.a = keys.s = keys.d = false
        if (resetState.progress >= 1) resetState = null
      }

      // Focus animation
      if (!resetState && focusState) {
        focusState.progress = Math.min(1, focusState.progress + FOCUS_SPEED * delta)
        const t = ease(focusState.progress)
        camera.position.lerpVectors(focusState.prevPosition, focusState.targetPos, t)
        cameraYaw = lerpAngle(focusState.prevYaw, focusState.targetYaw, t)
        cameraPitch = lerp(focusState.prevPitch, focusState.targetPitch, t)
        camera.fov = lerp(focusState.prevFov, focusState.targetFov, t)
        camera.updateProjectionMatrix()
        if (focusState.progress >= 1) { (focusState as any).isExiting ? focusState = null : focusState.progress = 1 }
        targetPosition = null; if (moveMarker) moveMarker.visible = false
        keys.w = keys.a = keys.s = keys.d = false
      }

      if (!resetState && !focusState) {
        const hasKey = keys.w || keys.a || keys.s || keys.d
        if (hasKey) {
          targetPosition = null; if (moveMarker) moveMarker.visible = false
          const fwd = new THREE.Vector3(Math.sin(cameraYaw), 0, -Math.cos(cameraYaw)).normalize()
          const strafe = new THREE.Vector3(Math.cos(cameraYaw), 0, Math.sin(cameraYaw)).normalize()
          moveDir.set(0, 0, 0)
          if (keys.w) moveDir.add(fwd); if (keys.s) moveDir.sub(fwd)
          if (keys.a) moveDir.sub(strafe); if (keys.d) moveDir.add(strafe)
          moveDir.normalize().multiplyScalar(MOVE_SPEED * delta)
          const np = camera.position.clone().add(moveDir)
          np.x = Math.max(roomBounds.minX, Math.min(roomBounds.maxX, np.x))
          np.z = Math.max(roomBounds.minZ, Math.min(roomBounds.maxZ, np.z))
          np.y = CAMERA_HEIGHT
          camera.position.copy(np)
        } else if (targetPosition) {
          const d = camera.position.distanceTo(targetPosition)
          if (d > 0.05) camera.position.lerp(targetPosition, Math.min(1, MOVE_SPEED * delta / d))
          else { camera.position.copy(targetPosition); targetPosition = null; if (moveMarker) moveMarker.visible = false }
        }
      }

      const lookDir = new THREE.Vector3(Math.sin(cameraYaw) * Math.cos(cameraPitch), Math.sin(cameraPitch), -Math.cos(cameraYaw) * Math.cos(cameraPitch))
      currentLookTarget.copy(camera.position).add(lookDir)
      camera.lookAt(currentLookTarget)
    }

    // Marker pulse
    if (moveMarker?.visible) moveMarker.scale.setScalar(1 + Math.sin(performance.now() * 0.005) * 0.08)

    renderer.render(scene, camera)
  }

  // ==================================================================
  // SIGNATURE WALL
  // ==================================================================
  function addSignatureToWall(sig: SignatureItem) {
    const { width, height } = ROOM_SIZE
    const group = new THREE.Group()

    // Small card on the right wall near the signature title area
    const cardW = 0.45, cardH = 0.6
    const bg = new THREE.Mesh(
      new THREE.PlaneGeometry(cardW, cardH),
      new THREE.MeshBasicMaterial({ color: 0xfafaf5, side: THREE.DoubleSide, depthWrite: false })
    )
    group.add(bg)

    // Name label
    const nameCanvas = document.createElement('canvas')
    nameCanvas.width = 256; nameCanvas.height = 48
    const nctx = nameCanvas.getContext('2d')!
    nctx.fillStyle = '#555'; nctx.font = '18px "Noto Sans SC", sans-serif'
    nctx.textAlign = 'center'; nctx.fillText(sig.name, 128, 32)
    const nameTex = new THREE.CanvasTexture(nameCanvas)
    nameTex.minFilter = THREE.LinearFilter
    const namePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(cardW - 0.06, 0.1),
      new THREE.MeshBasicMaterial({ map: nameTex, transparent: true, depthWrite: false })
    )
    namePlane.position.set(0, -cardH / 2 + 0.08, 0.01)
    group.add(namePlane)

    // Signature image
    const img = new Image()
    img.src = sig.signatureDataUrl
    img.onload = () => {
      const tex = new THREE.CanvasTexture(img as any)
      tex.minFilter = THREE.LinearFilter
      tex.magFilter = THREE.LinearFilter
      bg.material = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false })
    }

    // Spread signatures on the right wall around the signature title (z=-8)
    const zRange = 6  // spread width along Z
    const baseZ = -8
    let sigZ = baseZ + (sig.position.z % zRange) - zRange / 2
    let sigY = sig.position.y
    // Clamp within reasonable range
    sigZ = Math.max(baseZ - zRange / 2, Math.min(baseZ + zRange / 2, sigZ))
    sigY = Math.max(-height / 2 + 2, Math.min(height / 2 - 2, sigY))

    group.position.set(width / 2 - 0.06, sigY, sigZ)
    group.rotation.y = -Math.PI / 2
    bg.userData = { type: 'signature', signatureData: sig }
    scene.add(group)
    clickableObjects.push(bg)
    signatureMeshes.set(sig.id, bg)
    return group
  }

  // ==================================================================
  // UTILITIES
  // ==================================================================
  function ease(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 }
  function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
  function lerpAngle(a: number, b: number, t: number) {
    let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2
    return a + d * t
  }

  // ==================================================================
  // CLEANUP
  // ==================================================================
  function cleanup() {
    disposed = true
    if (animationId) cancelAnimationFrame(animationId)
    const dom = renderer?.domElement
    if (handlers.click && dom) dom.removeEventListener('click', handlers.click)
    if (handlers.mousedown && dom) dom.removeEventListener('mousedown', handlers.mousedown)
    if (handlers.mouseup) document.removeEventListener('mouseup', handlers.mouseup)
    if (handlers.mousemove) document.removeEventListener('mousemove', handlers.mousemove)
    if (handlers.wheel && dom) dom.removeEventListener('wheel', handlers.wheel)
    if (handlers.contextmenu && dom) dom.removeEventListener('contextmenu', handlers.contextmenu)
    if (handlers.keydown) document.removeEventListener('keydown', handlers.keydown)
    if (handlers.keyup) document.removeEventListener('keyup', handlers.keyup)
    if (handlers.resize) window.removeEventListener('resize', handlers.resize)
    handlers = {}
    if (renderer) { renderer.dispose(); if (containerRef.value && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement) }
  }

  function enterGallery() { entered = true }

  function resetCamera() {
    if (!entered) return
    focusState = null
    targetPosition = null
    if (moveMarker) moveMarker.visible = false
    resetState = {
      prevPosition: camera.position.clone(),
      prevYaw: cameraYaw, prevPitch: cameraPitch, prevFov: camera.fov,
      targetPos: defaultPosition.clone(),
      targetYaw: defaultYaw, targetPitch: defaultPitch, targetFov: defaultFov,
      progress: 0
    }
  }

  function isResetting() { return resetState !== null }

  function getFocusInfo(): { type: FocusType | null; label: string } {
    if (!focusState || (focusState as any).isExiting) return { type: null, label: '' }
    if (focusState.type === 'work') return { type: 'work', label: focusState.work?.name ?? '' }
    return { type: focusState.type, label: focusState.label ?? '' }
  }

  return {
    init, cleanup, addSignatureToWall, enterGallery, resetCamera,
    isEntered: () => entered,
    isFocused,
    isResetting,
    getFocusInfo,
    getFocusedWork: () => focusState?.work ?? null
  }
}
