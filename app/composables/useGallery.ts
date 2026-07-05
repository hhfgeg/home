// ============================================================
// 云中书作品廊 - 作品数据管理
// ============================================================

import type { Work, Signature } from '~/types/gallery'

/** 默认作品数据 */
const defaultWorks: Work[] = [
  {
    id: 'work-1',
    name: '智能诗境',
    description: '基于大语言模型的古典诗词生成系统，融合韵律学与意象构建，让AI理解中文诗词之美。',
    concept: '「智能诗境」探索AI在文学创作领域的可能性。通过深度学习模型训练大量古典诗词，系统能够理解平仄、对仗、意象等诗词要素，并在此基础上生成具有文学价值的新作品。这不仅是对传统文化的数字化传承，更是人机协作创作的新范式。',
    link: 'https://example.com/smart-poetry',
    tags: ['NLP', '诗词', '古典文学'],
    size: 'large',
  },
  {
    id: 'work-2',
    name: '代码幽境',
    description: 'AI代码辅助工具，为开发者提供智能补全、重构建议与代码审查，提升编程效率。',
    concept: '「代码幽境」致力于打造开发者的AI伙伴。不同于传统的代码补全工具，它通过理解项目上下文和开发者意图，提供更深层次的编程辅助——从架构设计建议到性能优化方案，从代码审查到智能测试生成。',
    link: 'https://example.com/code-grove',
    tags: ['DevTools', 'LLM', '生产力'],
    size: 'medium',
  },
  {
    id: 'work-3',
    name: '画灵',
    description: 'AI图像生成与编辑平台，支持文生图、图生图及风格迁移，让创意可视化变得简单。',
    concept: '「画灵」降低了视觉创作的门槛。通过Stable Diffusion等前沿模型，用户只需描述想象中的画面，AI便能将其变为现实。平台特别优化了中文语义理解，让东方的审美与意境能够被AI精准捕捉。',
    link: 'https://example.com/painting-spirit',
    tags: ['AIGC', '图像生成', '创意工具'],
    size: 'large',
  },
  {
    id: 'work-4',
    name: '声之形',
    description: '多语言实时语音合成与翻译系统，支持情感语调调节，让声音跨越语言障碍。',
    concept: '「声之形」探索语音AI的边界。系统不仅能实现高保真的语音克隆与合成，更创新性地引入了情感参数调节——让AI能够以喜悦、悲伤、激昂等不同情绪去朗读文本，使语音交互更具人性化温度。',
    link: 'https://example.com/voice-form',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    tags: ['TTS', '多语言', '语音合成'],
    size: 'medium',
  },
  {
    id: 'work-5',
    name: '数据星河',
    description: 'AI驱动的数据分析与可视化平台，让复杂数据讲出清晰的故事。',
    concept: '「数据星河」重新定义了数据叙事方式。系统能够自动识别数据中的模式和洞察，并通过AI生成自然语言的数据解释。交互式的3D可视化让用户不只是看到数据，更能在数据星空中自由探索。',
    link: 'https://example.com/data-galaxy',
    tags: ['数据分析', '可视化', '3D'],
    size: 'small',
  },
  {
    id: 'work-6',
    name: '元创',
    description: '基于AI的3D内容生成平台，文字描述即可生成可交互的3D模型与场景。',
    concept: '「元创」让3D内容的创作民主化。无论角色、道具还是完整场景，AI都能根据描述快速生成。结合物理引擎与材质系统，生成的3D资产可以直接用于游戏开发、影视预演和虚拟现实应用。',
    link: 'https://example.com/meta-create',
    tags: ['3D', 'AIGC', '元宇宙'],
    size: 'medium',
  },
  {
    id: 'work-7',
    name: '灵枢',
    description: 'AI医疗辅助诊断系统，基于医学影像与病历数据提供多维度诊断建议。',
    concept: '「灵枢」以中医经典命名，融合现代AI技术。系统能够同时分析影像学数据、检验报告和电子病历，通过多模态学习提供综合性诊断参考。在尊重医生最终决策权的前提下，作为智能助手减少误诊漏诊。',
    link: 'https://example.com/ling-shu',
    tags: ['医疗AI', '多模态', '辅助诊断'],
    size: 'small',
  },
  {
    id: 'work-8',
    name: '幻城',
    description: 'AI驱动的交互式叙事引擎，根据用户选择实时生成个性化的故事世界。',
    concept: '「幻城」打破了传统叙事的线性结构。AI引擎能够在故事的任何节点根据用户的选择实时延展情节，每个人都将经历独一无二的故事。无论是游戏叙事、教育场景还是沉浸式展览，幻城都能提供动态的内容生成。',
    link: 'https://example.com/dream-city',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    tags: ['叙事AI', '游戏', '交互'],
    size: 'large',
  },
]

/** 签名墙颜色预设 */
const signatureColors = [
  '#00fff5', // 青
  '#b400ff', // 紫
  '#ff00ff', // 品红
  '#0066ff', // 蓝
  '#00ff88', // 绿
  '#ff6600', // 橙
  '#ff0066', // 玫红
  '#ffff00', // 黄
]

/**
 * 画廊数据管理 Composable
 * 管理作品列表、签名墙、选中的作品等状态
 */
export function useGallery() {
  const works = ref<Work[]>([...defaultWorks])
  const signatures = ref<Signature[]>([])
  const selectedWork = ref<Work | null>(null)
  const showDetail = ref(false)
  const showSignatureModal = ref(false)
  const showAbout = ref(false)

  const openDetail = (work: Work) => {
    // 先浅拷贝处理可能的响应式对象
    selectedWork.value = {
      id: work.id,
      name: work.name,
      description: work.description,
      concept: work.concept,
      link: work.link,
      videoUrl: work.videoUrl,
      thumbnail: work.thumbnail,
      tags: [...work.tags],
      size: work.size,
    }
    showDetail.value = true
  }

  const closeDetail = () => {
    showDetail.value = false
    selectedWork.value = null
  }

  const toggleAbout = () => {
    showAbout.value = !showAbout.value
  }

  const addSignature = (name: string, signatureData: string, comment: string) => {
    const newSignature: Signature = {
      id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      signatureData,
      comment,
      timestamp: Date.now(),
      color: signatureColors[Math.floor(Math.random() * signatureColors.length)],
    }
    signatures.value = [...signatures.value, newSignature]
    return newSignature
  }

  const openSignatureModal = () => {
    showSignatureModal.value = true
  }

  const closeSignatureModal = () => {
    showSignatureModal.value = false
  }

  // 分组作品用于两面墙展示
  const leftWallWorks = computed(() =>
    works.value.filter((_, i) => i % 2 === 0)
  )
  const rightWallWorks = computed(() =>
    works.value.filter((_, i) => i % 2 === 1)
  )

  return {
    works,
    signatures,
    selectedWork,
    showDetail,
    showSignatureModal,
    showAbout,
    leftWallWorks,
    rightWallWorks,
    signatureColors,
    openDetail,
    closeDetail,
    toggleAbout,
    addSignature,
    openSignatureModal,
    closeSignatureModal,
  }
}
