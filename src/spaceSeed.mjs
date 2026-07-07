// ================================================================
//  新空间种子数据（占位作品）
//  - 保持生产 server.mjs 与开发 vite.config.ts 的模板一致
//  - 修改此文件即可同时更新两端的默认空间内容
// ================================================================

const ACCENTS = ['#22e3ff', '#ff3df0', '#7c5cff', '#3dffb0', '#ffb43d', '#ff5c7c']

/**
 * 6 张占位作品卡片，使用 public/assets 下的图片，
 * 让新创建的空间在第一眼不至于太空荡。
 */
export const WORK_SEED = Array.from({ length: 6 }, (_, i) => {
  const n = i + 1
  const accent = ACCENTS[i % ACCENTS.length]
  return {
    kind: 'work',
    id: `work-${n}`,
    title: `作品 ${n} · 占位示例`,
    subtitle: 'Sample Work · 待替换',
    year: '2026',
    tags: ['未命名', '占位', '灵感'],
    accent,
    poster: `/assets/work${n}.jpg`,
    intro: '这是一张占位作品卡片，登录管理后台后即可替换为你的真实作品。',
    concept: '在「关于我 / 作品」中编辑标题、简介、标签与封面图，打造专属空间。',
    link: '',
  }
})
