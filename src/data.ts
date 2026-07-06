import w1 from './assets/work1.jpg'
import w2 from './assets/work2.jpg'
import w3 from './assets/work3.jpg'
import w4 from './assets/work4.jpg'
import w5 from './assets/work5.jpg'
import w6 from './assets/work6.jpg'

export type Contact = { label: string; value: string; href: string }
export type Stat = { k: string; v: string }

export type Card =
  | {
      kind: 'work'
      id: string
      title: string
      subtitle: string
      year: string
      tags: string[]
      accent: string
      poster: string
      intro: string
      concept: string
      link: string
      video?: string
    }
  | {
      kind: 'about'
      id: 'about'
      title: string
      subtitle: string
      accent: string
      poster?: string
      name: string
      role: string
      location: string
      bio: string[]
      stats: Stat[]
      contacts: Contact[]
    }
  | {
      kind: 'signature'
      id: 'signature'
      title: string
      subtitle: string
      accent: string
    }

export const CARD_W = 2.6
export const CARD_H = 1.4625 // 16:9

const VIDEO_A =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
const VIDEO_B =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'

export const items: Card[] = [
  {
    kind: 'work',
    id: 'neurogenesis',
    title: 'NeuroGenesis',
    subtitle: '生成式神经艺术',
    year: '2025',
    tags: ['Diffusion', 'GAN', 'Creative AI'],
    accent: '#22e3ff',
    poster: w1,
    intro:
      '基于扩散模型与对抗网络的实时生成系统，将文本 prompt 转译为不断演化的超现实视觉序列，支持潜空间连续插值。',
    concept:
      '探索「潜空间漫游」——让模型在概念之间连续插值，使每一帧都成为思维流动的可视化快照，模糊想象与计算的边界。',
    link: 'https://github.com',
  },
  {
    kind: 'work',
    id: 'synthvox',
    title: 'SynthVox',
    subtitle: '神经语音合成',
    year: '2025',
    tags: ['TTS', 'Voice Clone', 'Audio'],
    accent: '#ff3df0',
    poster: w2,
    intro:
      '零样本语音克隆与情感可控合成引擎，仅需数秒样本即可重建音色，并精确调控语调与情绪曲线。',
    concept:
      '声音是身份的延展。我希望让 AI 不仅「说话」，更能「演绎」——把声学特征解耦为可编辑的语义维度。',
    link: 'https://github.com',
    video: VIDEO_A,
  },
  {
    kind: 'work',
    id: 'oracle',
    title: 'Oracle',
    subtitle: '多模态对话引擎',
    year: '2024',
    tags: ['LLM', 'RAG', 'Agent'],
    accent: '#8b5cff',
    poster: w3,
    intro:
      '融合检索增强与工具调用的智能体框架，支持图文混排输入与多步推理规划，具备可演化的长期记忆。',
    concept:
      '让模型从「回答者」进化为「行动者」。每一次对话都是一次目标驱动的探索，记忆与反思构成其人格。',
    link: 'https://github.com',
  },
  {
    kind: 'work',
    id: 'autopilot',
    title: 'AutoPilot Sim',
    subtitle: '自动驾驶感知仿真',
    year: '2024',
    tags: ['BEV', 'LiDAR', 'Simulation'],
    accent: '#9dff3d',
    poster: w4,
    intro:
      '基于鸟瞰图网络的端到端感知仿真平台，融合多相机与激光雷达，实时输出可解释的轨迹与占用预测。',
    concept:
      '安全即信任。我在仿真中刻意注入长尾危险场景，让模型在「见过最坏」之后，才配得上路。',
    link: 'https://github.com',
    video: VIDEO_B,
  },
  {
    kind: 'work',
    id: 'quantum',
    title: 'Quantum Weave',
    subtitle: '量子-神经混合',
    year: '2025',
    tags: ['QML', 'Entanglement', 'Research'],
    accent: '#22e3ff',
    poster: w5,
    intro:
      '探索变分量子电路与经典神经网络的混合架构，在组合优化与高维采样任务上寻求指数级加速。',
    concept:
      '算力的下一座灯塔在亚原子尺度。我用编织的纠缠态作为新的「权重」，重新定义学习的几何。',
    link: 'https://github.com',
  },
  {
    kind: 'work',
    id: 'datastream',
    title: 'DataStream',
    subtitle: '实时智能分析',
    year: '2023',
    tags: ['Streaming', 'Edge AI', 'Viz'],
    accent: '#ff3df0',
    poster: w6,
    intro:
      '边缘端流式数据智能管线，毫秒级异常检测与自适应可视化，支撑城市级物联网的实时洞察。',
    concept:
      '数据是城市的脉搏。我把噪声折叠成节律，让冷冰冰的指标流动成可被直觉理解的生命信号。',
    link: 'https://github.com',
  },
  {
    kind: 'about',
    id: 'about',
    title: 'About // ME',
    subtitle: '背景与 AI 探索',
    accent: '#22e3ff',
    name: 'LIN WEI',
    role: 'AI Creative Technologist',
    location: 'Shanghai · Remote',
    bio: [
      '一名沉迷于「让机器理解世界」的创作者。从计算机视觉起步，逐步涉足大模型、生成式艺术与具身智能。',
      '我相信 AI 不是冰冷的工具，而是想象力的放大器——它让我们得以窥见潜空间中未被命名的风景。',
    ],
    stats: [
      { k: '作品', v: '40+' },
      { k: '年限', v: '6Y' },
      { k: '模型', v: '120+' },
      { k: '论文', v: '8' },
    ],
    contacts: [
      { label: 'Email', value: 'wei@nexus.ai', href: 'mailto:wei@nexus.ai' },
      { label: 'GitHub', value: 'github.com/linwei', href: 'https://github.com' },
      { label: 'X / Twitter', value: '@linwei_ai', href: 'https://x.com' },
      { label: 'Website', value: 'nexus.ai', href: 'https://nexus.ai' },
    ],
  },
  {
    kind: 'signature',
    id: 'signature',
    title: 'Signature Wall',
    subtitle: '签名墙 · 留下印记',
    accent: '#ff3df0',
  },
]
