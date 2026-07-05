// ============================================================
// 云中书作品廊 - Three.js 场景管理（视觉升级版）
// ============================================================

import * as THREE from 'three'
import type { Work, Signature } from '~/types/gallery'

/** 作品在墙上的交互对象 */
export interface WorkInteractive {
  mesh: THREE.Mesh
  work: Work
  labelSprite: THREE.Sprite
  frameGroup: THREE.Group
}

/** 签名墙交互对象 */
export interface SignatureInteractive {
  mesh: THREE.Mesh
  signature: Signature
  commentSprite: THREE.Sprite
}

/** 走廊布局常量 */
const CORRIDOR_LENGTH = 32
const CORRIDOR_WIDTH = 12
const CORRIDOR_HEIGHT = 7

/** 霓虹配色系统 */
const COLORS = {
  background: 0x060612,
  wall: 0x0e0e1e,
  wallDark: 0x0a0a18,
  floor: 0x080818,
  accent1: 0x00fff5, // 青
  accent2: 0xb44aff, // 紫
  accent3: 0x0088ff, // 蓝
  accent4: 0xff3399, // 粉
  accent5: 0x00ff88, // 绿
  gold: 0xffcc44,   // 金
}

export function useThreeScene(
  container: Ref<HTMLElement | null>,
  leftWallWorks: Ref<Work[]>,
  rightWallWorks: Ref<Work[]>,
  signatures: Ref<Signature[]>,
) {
  // --- 核心对象 ---
  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let renderer: THREE.WebGLRenderer
  let clock: THREE.Clock
  let animationId: number = 0

  // --- 交互对象集合 ---
  const workInteractives: WorkInteractive[] = []
  const signatureInteractives: SignatureInteractive[] = []

  // --- 相机状态 ---
  let pitch = 0
  let yaw = 0
  let cameraPosition = new THREE.Vector3(0, 1.75, CORRIDOR_LENGTH / 2 - 1)

  // --- 粒子 ---
  let particles: THREE.Points
  let sparkParticles: THREE.Points

  // --- 射线检测 ---
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  let groundPlane: THREE.Mesh

  // --- 回调 ---
  let onWorkClick: ((work: Work) => void) | null = null
  let onSignatureHover: ((sig: Signature | null) => void) | null = null

  // --- 点击移动 ---
  let targetPosition: THREE.Vector3 | null = null
  let moveIndicator: THREE.Mesh
  let moveIndicatorRing: THREE.Mesh
  let isAutoMoving = false
  const MOVE_SPEED = 8.0

  // --- 装饰元素（动画用） ---
  let lightCones: THREE.Mesh[] = []
  let groundSpots: THREE.Mesh[] = []

  // --- 碰撞检测边界 ---
  const bounds = {
    minX: -CORRIDOR_WIDTH / 2 + 0.7,
    maxX: CORRIDOR_WIDTH / 2 - 0.7,
    minZ: -CORRIDOR_LENGTH / 2 + 1.5,
    maxZ: CORRIDOR_LENGTH / 2 - 1,
  }

  // --- 响应式状态 ---
  const isReady = ref(false)
  const hoveredSignature = ref<Signature | null>(null)
  const hoveredWork = ref<Work | null>(null)
  const cursorStyle = ref<'default' | 'pointer'>('default')

  function init() {
    if (!container.value) {
      console.warn('[云中书] 容器元素未找到，跳过初始化')
      return
    }

    try {
      // --- 场景 ---
      scene = new THREE.Scene()
      scene.background = new THREE.Color(COLORS.background)
      scene.fog = new THREE.FogExp2(COLORS.background, 0.0008)

      // --- 相机 ---
      camera = new THREE.PerspectiveCamera(
        70,
        container.value.clientWidth / container.value.clientHeight,
        0.1,
        120
      )
      camera.position.copy(cameraPosition)
      camera.rotation.order = 'YXZ'

      // --- 渲染器 ---
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(container.value.clientWidth, container.value.clientHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.0
      renderer.outputColorSpace = THREE.SRGBColorSpace
      container.value.appendChild(renderer.domElement)

      // --- 时钟 ---
      clock = new THREE.Clock()

      // --- 构建场景 ---
      buildStarfield()
      buildGalleryStructure()
      buildFloor()
      buildLighting()
      buildLightCones()
      buildPillarSystem()
      buildFloatingParticles()
      buildWorks()
      buildSignatureWall()
      buildMoveIndicator()

      // --- 事件 ---
      setupEvents()

      isReady.value = true

      // --- 开始渲染 ---
      animate()
    } catch (err) {
      console.error('[云中书] 3D 场景初始化失败:', err)
      isReady.value = false
    }
  }

  // ==================== 星空背景 ====================
  function buildStarfield() {
    const count = 2000
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80
      positions[i * 3 + 1] = CORRIDOR_HEIGHT + Math.random() * 30
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80
      sizes[i] = Math.random() * 2 + 0.5
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const mat = new THREE.PointsMaterial({
      size: 0.08,
      color: 0x8899cc,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.7,
    })

    sparkParticles = new THREE.Points(geo, mat)
    scene.add(sparkParticles)
  }

  // ==================== 画廊结构 ====================
  function buildGalleryStructure() {
    // 墙壁材质 - 深色大理石质感
    const wallMat = new THREE.MeshStandardMaterial({
      color: COLORS.wall,
      roughness: 0.55,
      metalness: 0.35,
    })

    // 后墙
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(CORRIDOR_WIDTH, CORRIDOR_HEIGHT),
      wallMat
    )
    backWall.position.set(0, CORRIDOR_HEIGHT / 2, -CORRIDOR_LENGTH / 2)
    backWall.receiveShadow = true
    backWall.name = 'back-wall'
    scene.add(backWall)

    // 左墙
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(CORRIDOR_LENGTH, CORRIDOR_HEIGHT),
      wallMat
    )
    leftWall.position.set(-CORRIDOR_WIDTH / 2, CORRIDOR_HEIGHT / 2, 0)
    leftWall.rotation.y = Math.PI / 2
    leftWall.receiveShadow = true
    scene.add(leftWall)

    // 右墙
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(CORRIDOR_LENGTH, CORRIDOR_HEIGHT),
      wallMat
    )
    rightWall.position.set(CORRIDOR_WIDTH / 2, CORRIDOR_HEIGHT / 2, 0)
    rightWall.rotation.y = -Math.PI / 2
    rightWall.receiveShadow = true
    scene.add(rightWall)

    // 墙面霓虹装饰线
    buildWallNeonLines()
  }

  // ==================== 墙面霓虹装饰线 ====================
  function buildWallNeonLines() {
    const lineMat = new THREE.MeshBasicMaterial({
      color: COLORS.accent1,
      transparent: true,
      opacity: 0.25,
    })

    const createLine = (x: number, z: number, rotY: number) => {
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(0.02, CORRIDOR_HEIGHT - 1),
        lineMat
      )
      line.position.set(x, CORRIDOR_HEIGHT / 2, z)
      line.rotation.y = rotY
      scene.add(line)
    }

    // 墙面垂直装饰线（等间距）
    for (let i = 1; i < 7; i++) {
      const z = -CORRIDOR_LENGTH / 2 + (i * CORRIDOR_LENGTH) / 7
      createLine(-CORRIDOR_WIDTH / 2 + 0.02, z, Math.PI / 2)
      createLine(CORRIDOR_WIDTH / 2 - 0.02, z, -Math.PI / 2)
    }

    // 顶部水平装饰线
    const topLineMat = new THREE.MeshBasicMaterial({
      color: COLORS.accent2,
      transparent: true,
      opacity: 0.3,
    })

    ;[-1, 1].forEach((side) => {
      const topLine = new THREE.Mesh(
        new THREE.PlaneGeometry(CORRIDOR_LENGTH, 0.015),
        topLineMat
      )
      topLine.position.set(side * (CORRIDOR_WIDTH / 2 - 0.01), CORRIDOR_HEIGHT - 0.4, 0)
      topLine.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2
      scene.add(topLine)
    })
  }

  // ==================== 柱子系统 ====================
  function buildPillarSystem() {
    const pillarCount = 8

    for (let i = 0; i < pillarCount; i++) {
      const z = -CORRIDOR_LENGTH / 2 + 1 + (i * (CORRIDOR_LENGTH - 2)) / (pillarCount - 1)

      ;[-1, 1].forEach((side) => {
        const x = side * (CORRIDOR_WIDTH / 2 - 0.5)

        // 柱身 - 暗色金属
        const pillarGeo = new THREE.CylinderGeometry(0.12, 0.14, CORRIDOR_HEIGHT - 0.5, 16)
        const pillarMat = new THREE.MeshStandardMaterial({
          color: 0x1a1a30,
          roughness: 0.3,
          metalness: 0.8,
        })
        const pillar = new THREE.Mesh(pillarGeo, pillarMat)
        pillar.position.set(x, (CORRIDOR_HEIGHT - 0.5) / 2, z)
        pillar.castShadow = true
        pillar.receiveShadow = true
        scene.add(pillar)

        // 柱顶 - 发光晶体
        const crystalGeo = new THREE.OctahedronGeometry(0.2, 0)
        const neonColors = [COLORS.accent1, COLORS.accent2, COLORS.accent3, COLORS.accent4]
        const crystalColor = neonColors[i % neonColors.length]
        const crystalMat = new THREE.MeshStandardMaterial({
          color: crystalColor,
          emissive: crystalColor,
          emissiveIntensity: 1.2,
          roughness: 0.15,
          metalness: 0.1,
          transparent: true,
          opacity: 0.85,
        })
        const crystal = new THREE.Mesh(crystalGeo, crystalMat)
        crystal.position.set(x, CORRIDOR_HEIGHT - 0.35, z)
        crystal.name = `crystal-${i}-${side}`
        scene.add(crystal)

        // 柱底基座光环
        const ringGeo = new THREE.TorusGeometry(0.25, 0.03, 16, 32)
        const ringMat = new THREE.MeshBasicMaterial({
          color: crystalColor,
          transparent: true,
          opacity: 0.5,
        })
        const ring = new THREE.Mesh(ringGeo, ringMat)
        ring.rotation.x = Math.PI / 2
        ring.position.set(x, 0.05, z)
        scene.add(ring)
      })
    }

    // 入口拱门
    buildEntranceArch()
  }

  function buildEntranceArch() {
    const z = CORRIDOR_LENGTH / 2

    // 拱门形状（用环）
    const archCurve = new THREE.EllipseCurve(0, 0, 1.8, 1.8, 0, Math.PI, false, 0)
    const archPoints = archCurve.getPoints(64)
    const archPath = new THREE.CatmullRomCurve3(
      archPoints.map(p => new THREE.Vector3(p.x, p.y + 1.2, 0)),
      false
    )
    const archGeo = new THREE.TubeGeometry(archPath, 64, 0.06, 8, false)
    const archMat = new THREE.MeshStandardMaterial({
      color: COLORS.accent1,
      emissive: COLORS.accent1,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.6,
    })
    const arch = new THREE.Mesh(archGeo, archMat)
    arch.position.set(0, 0, z)
    arch.rotation.y = Math.PI
    scene.add(arch)

    // 拱门发光环
    const glowArchGeo = new THREE.TubeGeometry(archPath, 64, 0.02, 8, false)
    const glowArchMat = new THREE.MeshBasicMaterial({
      color: COLORS.accent1,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const glowArch = new THREE.Mesh(glowArchGeo, glowArchMat)
    glowArch.position.copy(arch.position)
    glowArch.rotation.y = Math.PI
    scene.add(glowArch)
  }

  // ==================== 地板 ====================
  function buildFloor() {
    // 主地板 - 镜面反射效果
    const floorGeo = new THREE.PlaneGeometry(CORRIDOR_WIDTH, CORRIDOR_LENGTH)
    const floorMat = new THREE.MeshStandardMaterial({
      color: COLORS.floor,
      roughness: 0.18,
      metalness: 0.9,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0
    floor.receiveShadow = true
    floor.name = 'ground-plane'
    scene.add(floor)

    // 地面碰撞检测平面
    groundPlane = floor

    // 瓷砖网格线
    const gridSize = 1.5
    const gridHelper = new THREE.PolarGridHelper(
      CORRIDOR_LENGTH / 2, 64, 40, 64,
      COLORS.accent1, COLORS.accent1
    )
    gridHelper.position.y = 0.008
    gridHelper.material = gridHelper.material as THREE.Material
    ;(gridHelper.material as THREE.MeshBasicMaterial).opacity = 0.08
    ;(gridHelper.material as THREE.MeshBasicMaterial).transparent = true
    scene.add(gridHelper)

    // 中轴线光带
    const axisGeo = new THREE.PlaneGeometry(0.06, CORRIDOR_LENGTH - 2)
    const axisMat = new THREE.MeshBasicMaterial({
      color: COLORS.accent1,
      transparent: true,
      opacity: 0.35,
    })
    const axisLine = new THREE.Mesh(axisGeo, axisMat)
    axisLine.rotation.x = -Math.PI / 2
    axisLine.position.y = 0.01
    axisLine.renderOrder = 1
    axisLine.material.depthTest = false
    scene.add(axisLine)

    // 边缘光带
    ;[-1, 1].forEach((side) => {
      const edgeGeo = new THREE.PlaneGeometry(0.04, CORRIDOR_LENGTH - 2)
      const edgeMat = new THREE.MeshBasicMaterial({
        color: COLORS.accent2,
        transparent: true,
        opacity: 0.2,
      })
      const edgeLine = new THREE.Mesh(edgeGeo, edgeMat)
      edgeLine.rotation.x = -Math.PI / 2
      edgeLine.position.set(side * (CORRIDOR_WIDTH / 2 - 0.03), 0.01, 0)
      scene.add(edgeLine)
    })
  }

  // ==================== 灯光系统 ====================
  function buildLighting() {
    // 环境光 - 略带蓝紫
    const ambient = new THREE.AmbientLight(0x181840, 0.6)
    scene.add(ambient)

    // 半球光 - 模拟天空/地面
    const hemiLight = new THREE.HemisphereLight(0x8899cc, 0x111133, 0.3)
    scene.add(hemiLight)

    // 主方向光（顶灯模拟）
    const dirLight = new THREE.DirectionalLight(0xaaccff, 0.4)
    dirLight.position.set(0, CORRIDOR_HEIGHT - 0.3, 0)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048
    dirLight.shadow.camera.near = 0.5
    dirLight.shadow.camera.far = 60
    dirLight.shadow.camera.left = -20
    dirLight.shadow.camera.right = 20
    dirLight.shadow.camera.top = 20
    dirLight.shadow.camera.bottom = -20
    dirLight.shadow.bias = -0.0001
    scene.add(dirLight)

    // 霓虹点光源（沿墙排列）
    const neonConfigs = [
      { color: COLORS.accent1, intensity: 1.5, distance: 6, decay: 2 },
      { color: COLORS.accent2, intensity: 1.3, distance: 5, decay: 2 },
      { color: COLORS.accent3, intensity: 1.2, distance: 5, decay: 2 },
    ]

    for (let i = 0; i < 16; i++) {
      const z = -CORRIDOR_LENGTH / 2 + 1.5 + (i * (CORRIDOR_LENGTH - 3)) / 15
      const cfg = neonConfigs[i % neonConfigs.length]

      ;[-1, 1].forEach((side) => {
        const pointLight = new THREE.PointLight(cfg.color, cfg.intensity, cfg.distance, cfg.decay)
        pointLight.position.set(
          side * (CORRIDOR_WIDTH / 2 - 0.6),
          CORRIDOR_HEIGHT - 0.3,
          z
        )
        scene.add(pointLight)
      })
    }

    // 入口聚光灯
    const spotLight = new THREE.SpotLight(COLORS.accent1, 3, 12, Math.PI / 8, 0.3, 1)
    spotLight.position.set(0, CORRIDOR_HEIGHT, CORRIDOR_LENGTH / 2 - 0.5)
    spotLight.target.position.set(0, 0, CORRIDOR_LENGTH / 2 - 3)
    spotLight.castShadow = true
    scene.add(spotLight)
    scene.add(spotLight.target)

    // 签名墙聚光灯
    const sigSpot = new THREE.SpotLight(COLORS.accent2, 2, 10, Math.PI / 7, 0.3, 1)
    sigSpot.position.set(0, CORRIDOR_HEIGHT - 0.5, -CORRIDOR_LENGTH / 2 + 3)
    sigSpot.target.position.set(0, 1.5, -CORRIDOR_LENGTH / 2)
    scene.add(sigSpot)
    scene.add(sigSpot.target)
  }

  // ==================== 体积光束 ====================
  function buildLightCones() {
    lightCones = []

    for (let i = 0; i < 8; i++) {
      const z = -CORRIDOR_LENGTH / 2 + 2 + (i * (CORRIDOR_LENGTH - 4)) / 7
      const colors = [COLORS.accent1, COLORS.accent2, COLORS.accent3, COLORS.accent1]

      ;[-1, 1].forEach((side) => {
        const coneGeo = new THREE.CylinderGeometry(0.15, 0.6, 1.5, 16, 1, true)
        const coneMat = new THREE.MeshBasicMaterial({
          color: colors[i % colors.length],
          transparent: true,
          opacity: 0.04,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
        const cone = new THREE.Mesh(coneGeo, coneMat)
        cone.position.set(
          side * (CORRIDOR_WIDTH / 2 - 0.6),
          CORRIDOR_HEIGHT - 1.6,
          z
        )
        cone.rotation.x = Math.PI
        cone.name = `light-cone-${i}-${side}`
        scene.add(cone)
        lightCones.push(cone)
      })
    }
  }

  // ==================== 浮动粒子 ====================
  function buildFloatingParticles() {
    const count = 600
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const particleSizes = new Float32Array(count)

    const neonColors = [
      [0, 1, 1],      // 青
      [0.7, 0.3, 1],  // 紫
      [0, 0.5, 1],    // 蓝
      [1, 0.2, 0.6],  // 粉
      [0, 1, 0.5],    // 绿
    ]

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * CORRIDOR_WIDTH * 1.3
      positions[i * 3 + 1] = 0.2 + Math.random() * (CORRIDOR_HEIGHT - 0.5)
      positions[i * 3 + 2] = (Math.random() - 0.5) * CORRIDOR_LENGTH * 1.3

      const c = neonColors[Math.floor(Math.random() * neonColors.length)]
      colors[i * 3] = c[0]
      colors[i * 3 + 1] = c[1]
      colors[i * 3 + 2] = c[2]

      particleSizes[i] = Math.random() * 3 + 1
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1))

    const mat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    })

    particles = new THREE.Points(geo, mat)
    particles.name = 'floating-particles'
    scene.add(particles)
  }

  // ==================== 移动指示器 ====================
  function buildMoveIndicator() {
    // 内圆点
    const dotGeo = new THREE.RingGeometry(0.05, 0.15, 32)
    const dotMat = new THREE.MeshBasicMaterial({
      color: COLORS.accent1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      depthTest: false,
      depthWrite: false,
    })
    moveIndicator = new THREE.Mesh(dotGeo, dotMat)
    moveIndicator.rotation.x = -Math.PI / 2
    moveIndicator.visible = false
    moveIndicator.renderOrder = 999
    scene.add(moveIndicator)

    // 外环
    const ringGeo = new THREE.TorusGeometry(0.25, 0.03, 16, 32)
    const ringMat = new THREE.MeshBasicMaterial({
      color: COLORS.accent1,
      transparent: true,
      opacity: 0.5,
      depthTest: false,
      depthWrite: false,
    })
    moveIndicatorRing = new THREE.Mesh(ringGeo, ringMat)
    moveIndicatorRing.rotation.x = Math.PI / 2
    moveIndicatorRing.visible = false
    moveIndicatorRing.renderOrder = 999
    scene.add(moveIndicatorRing)
  }

  // ==================== 作品展示 ====================
  function buildWorks() {
    // 清除旧作品
    workInteractives.forEach((wi) => {
      scene.remove(wi.mesh)
      scene.remove(wi.labelSprite)
      scene.remove(wi.frameGroup)
    })
    workInteractives.length = 0

    const placeWorksOnWall = (works: Work[], sideX: number, rotationY: number) => {
      const wallLength = CORRIDOR_LENGTH - 5
      const spacing = works.length > 1 ? wallLength / (works.length - 1) : 0
      const startZ = -wallLength / 2

      works.forEach((work, index) => {
        const z = startZ + index * spacing
        const sizeMap = { large: [2.2, 1.5], medium: [1.7, 1.2], small: [1.2, 0.9] }
        const [w, h] = sizeMap[work.size]
        const accentColor = new THREE.Color(getTagColorHex(work.tags[0]))

        // --- 作品组 ---
        const frameGroup = new THREE.Group()
        frameGroup.position.set(sideX, CORRIDOR_HEIGHT / 2 + 0.2, z)
        frameGroup.rotation.y = rotationY

        // 3D 外框 - 带厚度的画框
        const frameThickness = 0.08
        const frameOuterW = w + 0.3
        const frameOuterH = h + 0.3

        // 上框条
        const topBarGeo = new THREE.BoxGeometry(frameOuterW, frameThickness, frameThickness)
        const frameMat = new THREE.MeshStandardMaterial({
          color: 0x2a2a4a,
          roughness: 0.25,
          metalness: 0.7,
          emissive: accentColor,
          emissiveIntensity: 0.1,
        })
        const topBar = new THREE.Mesh(topBarGeo, frameMat)
        topBar.position.y = frameOuterH / 2
        topBar.castShadow = true
        frameGroup.add(topBar)

        // 下框条
        const bottomBar = new THREE.Mesh(topBarGeo, frameMat)
        bottomBar.position.y = -frameOuterH / 2
        bottomBar.castShadow = true
        frameGroup.add(bottomBar)

        // 左框条
        const sideBarGeo = new THREE.BoxGeometry(frameThickness, frameOuterH, frameThickness)
        const leftBar = new THREE.Mesh(sideBarGeo, frameMat)
        leftBar.position.x = -frameOuterW / 2
        frameGroup.add(leftBar)

        // 右框条
        const rightBar = new THREE.Mesh(sideBarGeo, frameMat)
        rightBar.position.x = frameOuterW / 2
        frameGroup.add(rightBar)

        // 画布
        const canvasGeo = new THREE.PlaneGeometry(w, h)
        const thumbCanvas = document.createElement('canvas')
        thumbCanvas.width = 512
        thumbCanvas.height = Math.round(512 * (h / w))
        const ctx = thumbCanvas.getContext('2d')!
        drawEnhancedThumbnail(ctx, thumbCanvas.width, thumbCanvas.height, work)

        const texture = new THREE.CanvasTexture(thumbCanvas)
        texture.colorSpace = THREE.SRGBColorSpace
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter

        const canvasMat = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.35,
          metalness: 0.15,
          emissive: accentColor,
          emissiveIntensity: 0.08,
        })
        const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat)
        canvasMesh.position.z = frameThickness / 2 + 0.001
        canvasMesh.userData = { work }
        canvasMesh.name = `work-${work.id}`
        canvasMesh.receiveShadow = true
        frameGroup.add(canvasMesh)

        // 内霓虹发光边框
        const innerGlowGeo = new THREE.PlaneGeometry(w + 0.08, h + 0.08)
        const innerGlowMat = new THREE.ShaderMaterial({
          uniforms: {
            uColor: { value: accentColor },
            uTime: { value: 0 },
            uSize: { value: new THREE.Vector2(w + 0.08, h + 0.08) },
          },
          vertexShader: /* glsl */ `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: /* glsl */ `
            varying vec2 vUv;
            uniform vec3 uColor;
            uniform float uTime;
            void main() {
              float d = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
              float glow = exp(-d * 12.0) * 0.5;
              float pulse = 1.0 + sin(uTime * 1.5 + vUv.y * 3.0) * 0.25;
              gl_FragColor = vec4(uColor * pulse, glow * pulse);
            }
          `,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
        const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat)
        innerGlow.position.z = 0.002
        innerGlow.name = `glow-${work.id}`
        frameGroup.add(innerGlow)

        // 底部标题标签
        const labelSprite = createEnhancedLabel(work.name, accentColor)
        labelSprite.position.set(0, -h / 2 - 0.5, 0.1)
        labelSprite.scale.set(w * 0.9, 0.5, 1)
        frameGroup.add(labelSprite)

        scene.add(frameGroup)

        // 地面投射光斑
        const spotGeo = new THREE.PlaneGeometry(w * 0.8, 0.4)
        const spotMat = new THREE.MeshBasicMaterial({
          color: accentColor,
          transparent: true,
          opacity: 0.12,
          depthTest: false,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
        const spot = new THREE.Mesh(spotGeo, spotMat)
        spot.rotation.x = -Math.PI / 2
        spot.position.set(sideX * 1.5, 0.015, z)
        spot.name = 'ground-spot'
        scene.add(spot)
        groundSpots.push(spot)

        // 标签朝向用
        const labelSpriteForLookAt = createEnhancedLabel(work.name, accentColor)
        labelSpriteForLookAt.position.set(sideX, CORRIDOR_HEIGHT / 2 - h / 2 - 0.6, z)
        labelSpriteForLookAt.scale.set(2.5, 0.5, 1)
        scene.add(labelSpriteForLookAt)

        workInteractives.push({
          mesh: canvasMesh,
          work,
          labelSprite: labelSpriteForLookAt,
          frameGroup,
        })
      })
    }

    placeWorksOnWall(leftWallWorks.value, -CORRIDOR_WIDTH / 2 + 0.15, Math.PI / 2)
    placeWorksOnWall(rightWallWorks.value, CORRIDOR_WIDTH / 2 - 0.15, -Math.PI / 2)
  }

  function drawEnhancedThumbnail(
    ctx: CanvasRenderingContext2D,
    w: number, h: number, work: Work
  ) {
    const accent = getTagColorHex(work.tags[0])

    // 深色背景
    ctx.fillStyle = '#0a0a14'
    ctx.fillRect(0, 0, w, h)

    // 渐变光晕
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, w * 0.7)
    grad.addColorStop(0, accent + '22')
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // 底部渐变
    const bottomGrad = ctx.createLinearGradient(0, h * 0.6, 0, h)
    bottomGrad.addColorStop(0, 'transparent')
    bottomGrad.addColorStop(1, accent + '18')
    ctx.fillStyle = bottomGrad
    ctx.fillRect(0, 0, w, h)

    // 几何装饰图案
    const cx = w * 0.5, cy = h * 0.38

    // 外圈六边形
    ctx.strokeStyle = accent + '33'
    ctx.lineWidth = 1
    drawHexagon(ctx, cx, cy, w * 0.15)

    // 内圈六边形
    ctx.strokeStyle = accent + '55'
    ctx.lineWidth = 1.5
    drawHexagon(ctx, cx, cy, w * 0.09)

    // 中心菱形
    ctx.strokeStyle = accent + '88'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx, cy - w * 0.04)
    ctx.lineTo(cx + w * 0.03, cy)
    ctx.lineTo(cx, cy + w * 0.04)
    ctx.lineTo(cx - w * 0.03, cy)
    ctx.closePath()
    ctx.stroke()

    // 装饰线
    ctx.strokeStyle = accent + '44'
    ctx.lineWidth = 0.5
    for (let i = 0; i < 4; i++) {
      const y = h * 0.65 + i * h * 0.06
      ctx.beginPath()
      ctx.moveTo(w * 0.15, y)
      ctx.lineTo(w * 0.5 + Math.sin(i) * w * 0.2, y)
      ctx.stroke()
    }

    // 标题
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${Math.round(w * 0.065)}px "PingFang SC", "Microsoft YaHei", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(work.name, cx, h * 0.78)

    // 标签
    ctx.fillStyle = accent + 'cc'
    ctx.font = `${Math.round(w * 0.036)}px "PingFang SC", "Microsoft YaHei", sans-serif`
    ctx.fillText(work.tags.slice(0, 2).join(' · '), cx, h * 0.9)

    // 顶角装饰光点
    ctx.fillStyle = accent + '44'
    ctx.beginPath()
    ctx.arc(w * 0.85, h * 0.12, w * 0.02, 0, Math.PI * 2)
    ctx.fill()
  }

  function drawHexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6
      const x = cx + r * Math.cos(angle)
      const y = cy + r * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
  }

  function getTagColorHex(tag: string): string {
    const map: Record<string, string> = {
      NLP: '#00fff5', DevTools: '#0088ff', AIGC: '#b44aff',
      TTS: '#ff3399', '3D': '#00ff88', 医疗AI: '#ff8844',
      叙事AI: '#ff44aa', 数据分析: '#ffdd44', 可视化: '#ff44aa',
      多模态: '#00aaee', 游戏: '#ff6644', '元宇宙': '#44eeff',
      诗词: '#aaddff', '生产力': '#44ff88', '语音合成': '#ff44cc',
      辅助诊断: '#ff8844', 交互: '#88ff44', '图像生成': '#cc44ff',
      '创意工具': '#ffaa00', '3D模型': '#00ddcc', 多语言: '#ee4488',
    }
    for (const [k, v] of Object.entries(map)) {
      if (tag.includes(k) || k.includes(tag)) return v
    }
    return '#00fff5'
  }

  function createEnhancedLabel(text: string, accentColor: THREE.Color): THREE.Sprite {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 96
    const ctx = canvas.getContext('2d')!

    // 背景光晕
    const grad = ctx.createLinearGradient(0, 0, 0, 96)
    grad.addColorStop(0, 'transparent')
    grad.addColorStop(0.5, '#' + accentColor.getHexString() + '22')
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 512, 96)

    // 文字
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 28px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = '#' + accentColor.getHexString()
    ctx.shadowBlur = 8
    ctx.fillText(text, 256, 48)

    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.LinearFilter
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    return new THREE.Sprite(material)
  }

  // ==================== 签名墙 ====================
  function buildSignatureWall() {
    const wallGeo = new THREE.PlaneGeometry(CORRIDOR_WIDTH - 2, 2.5)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0e0e1e,
      roughness: 0.5,
      metalness: 0.3,
    })
    const wall = new THREE.Mesh(wallGeo, wallMat)
    wall.position.set(0, 1.5, -CORRIDOR_LENGTH / 2 + 0.02)
    wall.name = 'signature-wall'
    wall.receiveShadow = true
    scene.add(wall)

    // 标题
    const titleSprite = createEnhancedLabel('✧ 签名墙 SIGNATURE WALL ✧', new THREE.Color(COLORS.accent2))
    titleSprite.position.set(0, 3.3, -CORRIDOR_LENGTH / 2 + 0.05)
    titleSprite.scale.set(6, 1, 1)
    scene.add(titleSprite)

    // 提示
    const hintSprite = createEnhancedLabel('点击此处留下笔迹 ✍', new THREE.Color(COLORS.accent1))
    hintSprite.position.set(0, 0.05, -CORRIDOR_LENGTH / 2 + 0.05)
    hintSprite.scale.set(4, 0.6, 1)
    scene.add(hintSprite)

    // 隐藏点击区域
    const hitArea = new THREE.Mesh(
      new THREE.PlaneGeometry(CORRIDOR_WIDTH - 2, 2.5),
      new THREE.MeshBasicMaterial({ visible: false })
    )
    hitArea.position.copy(wall.position)
    hitArea.name = 'signature-hitarea'
    scene.add(hitArea)

    updateSignatureDisplays()
  }

  function updateSignatureDisplays() {
    signatureInteractives.forEach((si) => {
      scene.remove(si.mesh)
      scene.remove(si.commentSprite)
    })
    signatureInteractives.length = 0

    const sigs = signatures.value
    if (sigs.length === 0) return

    const wallW = CORRIDOR_WIDTH - 2
    const maxPerRow = 5
    const rows = Math.ceil(sigs.length / maxPerRow)
    const cellW = wallW / maxPerRow
    const cellH = 2.5 / Math.max(rows, 1)

    sigs.forEach((sig, i) => {
      const row = Math.floor(i / maxPerRow)
      const col = i % maxPerRow
      const x = -wallW / 2 + cellW * (col + 0.5)
      const y = 2.35 - cellH * (row + 0.5)

      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 128
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = 'rgba(6, 6, 18, 0.9)'
      ctx.fillRect(0, 0, 256, 128)
      ctx.strokeStyle = sig.color + '44'
      ctx.lineWidth = 1
      ctx.strokeRect(4, 4, 248, 120)

      if (sig.signatureData) {
        const img = new Image()
        img.src = sig.signatureData
        const texture = new THREE.CanvasTexture(canvas)
        texture.colorSpace = THREE.SRGBColorSpace
        texture.minFilter = THREE.LinearFilter

        const sigGeo = new THREE.PlaneGeometry(cellW * 0.8, cellH * 0.7)
        const sigMat = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          depthTest: true,
        })
        const sigMesh = new THREE.Mesh(sigGeo, sigMat)
        sigMesh.position.set(x, y, -CORRIDOR_LENGTH / 2 + 0.04)
        sigMesh.userData = { signature: sig }
        sigMesh.name = `sig-${sig.id}`
        scene.add(sigMesh)

        img.onload = () => {
          ctx.drawImage(img, 20, 8, 216, 80)
          ctx.fillStyle = sig.color
          ctx.font = 'bold 16px "PingFang SC", "Microsoft YaHei", sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(sig.name, 128, 112)
          sigMat.map!.needsUpdate = true
        }

        ctx.fillStyle = sig.color
        ctx.font = 'bold 16px "PingFang SC", "Microsoft YaHei", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(sig.name, 128, 112)

        const commentSprite = createEnhancedLabel(`"${sig.comment}"`, new THREE.Color(sig.color))
        commentSprite.position.set(x, y - cellH * 0.5, -CORRIDOR_LENGTH / 2 + 0.08)
        commentSprite.scale.set(3, 0.6, 1)
        commentSprite.visible = false
        scene.add(commentSprite)

        signatureInteractives.push({ mesh: sigMesh, signature: sig, commentSprite })
      }
    })
  }

  // ==================== 事件系统 ====================
  function setupEvents() {
    const canvas = renderer.domElement

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
      raycaster.setFromCamera(mouse, camera)

      // 检测作品悬浮
      const workMeshes = workInteractives.map((wi) => wi.mesh)
      const workHits = raycaster.intersectObjects(workMeshes)
      if (workHits.length > 0) {
        const w = workHits[0].object.userData.work as Work | undefined
        if (w && hoveredWork.value?.id !== w.id) {
          hoveredWork.value = w
          canvas.style.cursor = 'pointer'
        }
        return
      }

      // 检测签名悬浮
      const sigMeshes = signatureInteractives.map((si) => si.mesh)
      const sigHits = raycaster.intersectObjects(sigMeshes)
      if (sigHits.length > 0) {
        const s = sigHits[0].object.userData.signature as Signature | undefined
        if (s && hoveredSignature.value?.id !== s.id) {
          hoveredSignature.value = s
          onSignatureHover?.(s)
          signatureInteractives.forEach((si) => {
            si.commentSprite.visible = si.signature.id === s.id
          })
          canvas.style.cursor = 'pointer'
        }
        return
      }

      // 检测签名墙区域
      const hitArea = scene.getObjectByName('signature-hitarea')
      if (hitArea) {
        const areaHits = raycaster.intersectObject(hitArea)
        if (areaHits.length > 0) {
          canvas.style.cursor = 'pointer'
          return
        }
      }

      // 清理悬浮状态
      if (hoveredWork.value) hoveredWork.value = null
      if (hoveredSignature.value) {
        hoveredSignature.value = null
        onSignatureHover?.(null)
        signatureInteractives.forEach((si) => { si.commentSprite.visible = false })
      }

      // 检测地面悬浮 → 十字光标表示可点击移动
      if (groundPlane) {
        const groundHits = raycaster.intersectObject(groundPlane)
        canvas.style.cursor = groundHits.length > 0 ? 'crosshair' : 'default'
      } else {
        canvas.style.cursor = 'default'
      }
    }

    const onClick = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
      raycaster.setFromCamera(mouse, camera)

      // 检测作品点击（最高优先级）
      const workMeshes = workInteractives.map((wi) => wi.mesh)
      const workHits = raycaster.intersectObjects(workMeshes)
      if (workHits.length > 0) {
        const w = workHits[0].object.userData.work as Work | undefined
        if (w) { onWorkClick?.(w); return }
      }

      // 检测签名墙点击
      const hitArea = scene.getObjectByName('signature-hitarea')
      if (hitArea) {
        const sigHits = raycaster.intersectObject(hitArea)
        if (sigHits.length > 0) {
          window.dispatchEvent(new CustomEvent('signature-wall-click'))
          return
        }
      }

      // 检测地面点击 → 移动
      const groundHits = raycaster.intersectObject(groundPlane)
      if (groundHits.length > 0) {
        const point = groundHits[0].point
        // 限制在边界内
        point.x = Math.max(bounds.minX, Math.min(bounds.maxX, point.x))
        point.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, point.z))
        setMoveTarget(point)
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('click', onClick)

    const cleanup = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('click', onClick)
    }
    ;(scene as any).__cleanup = cleanup
  }

  // ==================== 点击移动 ====================
  function setMoveTarget(point: THREE.Vector3) {
    point.y = 1.75
    targetPosition = point.clone()
    isAutoMoving = true

    // 显示指示器
    moveIndicator.position.set(point.x, 0.03, point.z)
    moveIndicatorRing.position.set(point.x, 0.03, point.z)
    moveIndicator.visible = true
    moveIndicatorRing.visible = true
  }

  function cancelAutoMove() {
    isAutoMoving = false
    targetPosition = null
    moveIndicator.visible = false
    moveIndicatorRing.visible = false
  }

  // ==================== 相机控制 ====================
  function rotateCamera(deltaX: number, deltaY: number, sensitivity: number) {
    yaw -= deltaX * sensitivity * 0.003
    pitch -= deltaY * sensitivity * 0.003
    pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch))
  }

  function moveCameraManual(direction: { x: number; z: number }, speed: number, delta: number) {
    // 手动移动时取消自动移动
    if (isAutoMoving) cancelAutoMove()

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
    forward.y = 0; forward.normalize()
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
    right.y = 0; right.normalize()

    const vel = new THREE.Vector3()
    if (direction.z !== 0) vel.addScaledVector(forward, direction.z)
    if (direction.x !== 0) vel.addScaledVector(right, direction.x)

    if (vel.lengthSq() > 0) {
      vel.normalize().multiplyScalar(speed * delta)
      const newPos = camera.position.clone().add(vel)
      newPos.x = Math.max(bounds.minX, Math.min(bounds.maxX, newPos.x))
      newPos.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, newPos.z))
      camera.position.copy(newPos)
      cameraPosition.copy(newPos)
    }
  }

  function updateCameraRotation() {
    camera.rotation.order = 'YXZ'
    camera.rotation.y = yaw
    camera.rotation.x = pitch
  }

  // ==================== 动画循环 ====================
  function animate() {
    animationId = requestAnimationFrame(animate)
    const delta = Math.min(clock.getDelta(), 0.1)
    const time = performance.now() * 0.001

    // --- 自动移动 ---
    if (isAutoMoving && targetPosition) {
      const dist = camera.position.distanceTo(targetPosition)
      if (dist < 0.15) {
        // 到达目标
        camera.position.copy(targetPosition)
        cameraPosition.copy(targetPosition)
        cancelAutoMove()
      } else {
        const dir = targetPosition.clone().sub(camera.position).normalize()
        const step = MOVE_SPEED * delta
        camera.position.addScaledVector(dir, Math.min(step, dist))
        cameraPosition.copy(camera.position)
      }
    }

    // --- 浮动粒子动画 ---
    if (particles) {
      const posArr = particles.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < posArr.length; i += 3) {
        posArr[i + 1] += Math.sin(time * 0.8 + i * 0.01) * 0.002
        posArr[i] += Math.cos(time * 0.5 + i * 0.02) * 0.001
        if (posArr[i + 1] > CORRIDOR_HEIGHT) posArr[i + 1] = 0.2
        if (posArr[i + 1] < 0) posArr[i + 1] = CORRIDOR_HEIGHT - 0.2
      }
      particles.geometry.attributes.position.needsUpdate = true
    }

    // --- 星空闪烁 ---
    if (sparkParticles) {
      sparkParticles.material.opacity = 0.5 + Math.sin(time * 0.3) * 0.2
      sparkParticles.rotation.y += delta * 0.02
    }

    // --- 作品霓虹边框动画 ---
    workInteractives.forEach((wi) => {
      const glow = wi.frameGroup.getObjectByName(`glow-${wi.work.id}`) as THREE.Mesh | undefined
      if (glow) {
        const mat = glow.material as THREE.ShaderMaterial
        if (mat.uniforms?.uTime) mat.uniforms.uTime.value += delta
      }
    })

    // --- 标签朝向相机 ---
    workInteractives.forEach((wi) => {
      wi.labelSprite.lookAt(camera.position)
    })

    // --- 晶体动画 ---
    scene.children.forEach((child) => {
      if (child.name?.startsWith('crystal-')) {
        child.rotation.y += delta * 0.8
        child.position.y += Math.sin(time * 2 + child.position.x) * 0.001
      }
    })

    // --- 移动指示器动画 ---
    if (moveIndicatorRing.visible) {
      moveIndicatorRing.scale.setScalar(1 + Math.sin(time * 3) * 0.15)
      moveIndicatorRing.rotation.z += delta * 2
    }
    if (moveIndicator.visible) {
      moveIndicator.material.opacity = 0.4 + Math.sin(time * 4) * 0.3
    }

    // --- 光束闪烁 ---
    lightCones.forEach((cone, i) => {
      const mat = cone.material as THREE.MeshBasicMaterial
      mat.opacity = 0.02 + Math.sin(time * 1.5 + i) * 0.015
    })

    renderer.render(scene, camera)
  }

  // ==================== 公共方法 ====================
  function onResize() {
    if (!container.value || !camera || !renderer) return
    camera.aspect = container.value.clientWidth / container.value.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  }

  function dispose() {
    cancelAnimationFrame(animationId)
    ;(scene as any).__cleanup?.()
    renderer?.dispose()
    scene?.clear()
    if (container.value && renderer) {
      container.value.removeChild(renderer.domElement)
    }
  }

  function onWorkClicked(callback: (work: Work) => void) {
    onWorkClick = callback
  }

  function onSigHover(callback: (sig: Signature | null) => void) {
    onSignatureHover = callback
  }

  return {
    init,
    dispose,
    onResize,
    rotateCamera,
    moveCamera: moveCameraManual,
    updateCameraRotation,
    onWorkClicked,
    onSigHover,
    updateSignatureDisplays,
    isReady,
    hoveredWork,
    hoveredSignature,
    cursorStyle,
    CORRIDOR_LENGTH,
    CORRIDOR_WIDTH,
    CORRIDOR_HEIGHT,
  }
}
