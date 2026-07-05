// ============================================================
// 云中书作品廊 - 类型定义
// ============================================================

/** 作品数据 */
export interface Work {
  id: string
  name: string
  description: string
  /** 创作理念/详情 */
  concept: string
  link: string
  videoUrl?: string
  thumbnail?: string
  tags: string[]
  /** 作品尺寸类型 */
  size: 'small' | 'medium' | 'large'
}

/** 签名墙留言 */
export interface Signature {
  id: string
  name: string
  /** base64 编码的手写签名图片 */
  signatureData: string
  comment: string
  timestamp: number
  /** 签名颜色 */
  color: string
}

/** 3D 场景中的位置 */
export interface Vec3 {
  x: number
  y: number
  z: number
}

/** 画廊空间配置 */
export interface GalleryConfig {
  /** 走廊长度 */
  corridorLength: number
  /** 走廊宽度 */
  corridorWidth: number
  /** 走廊高度 */
  corridorHeight: number
  /** 每面墙的作品数量 */
  worksPerWall: number
}

/** 控制状态 */
export interface ControlsState {
  /** 是否锁定鼠标 */
  isLocked: boolean
  /** 移动方向 */
  moveForward: boolean
  moveBackward: boolean
  moveLeft: boolean
  moveRight: boolean
  /** 灵敏度 */
  sensitivity: number
  /** 移动速度 */
  speed: number
}

/** 相机状态 */
export interface CameraState {
  position: Vec3
  rotation: Vec3
  fov: number
}
