/**
 * useGallery 组合式函数测试
 * 验证作品数据管理、签名墙逻辑等核心功能
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useGallery } from '../useGallery'

// 模拟 Vue 响应式 API（vitest happy-dom 环境需要）
import { ref, computed } from 'vue'

describe('useGallery', () => {
  let gallery: ReturnType<typeof useGallery>

  beforeEach(() => {
    gallery = useGallery()
  })

  describe('作品数据', () => {
    it('应该包含预设的作品列表', () => {
      expect(gallery.works.value.length).toBeGreaterThan(0)
      expect(gallery.works.value.length).toBe(8)
    })

    it('每个作品应包含必要字段', () => {
      gallery.works.value.forEach((work) => {
        expect(work.id).toBeTruthy()
        expect(work.name).toBeTruthy()
        expect(work.description).toBeTruthy()
        expect(work.concept).toBeTruthy()
        expect(work.link).toBeTruthy()
        expect(work.tags).toBeInstanceOf(Array)
        expect(work.tags.length).toBeGreaterThan(0)
        expect(['small', 'medium', 'large']).toContain(work.size)
      })
    })

    it('左墙和右墙应正确分组作品', () => {
      const left = gallery.leftWallWorks.value
      const right = gallery.rightWallWorks.value

      // 交错分配
      expect(left.length + right.length).toBe(gallery.works.value.length)
      // 左墙应包含偶数索引的作品
      left.forEach((w) => {
        const idx = gallery.works.value.findIndex((ww) => ww.id === w.id)
        expect(idx % 2).toBe(0)
      })
      // 右墙应包含奇数索引的作品
      right.forEach((w) => {
        const idx = gallery.works.value.findIndex((ww) => ww.id === w.id)
        expect(idx % 2).toBe(1)
      })
    })
  })

  describe('作品详情模态框', () => {
    it('应该能够打开和关闭作品详情', () => {
      expect(gallery.showDetail.value).toBe(false)
      expect(gallery.selectedWork.value).toBeNull()

      const work = gallery.works.value[0]
      gallery.openDetail(work)

      expect(gallery.showDetail.value).toBe(true)
      expect(gallery.selectedWork.value).not.toBeNull()
      expect(gallery.selectedWork.value!.id).toBe(work.id)
      expect(gallery.selectedWork.value!.name).toBe(work.name)
      expect(gallery.selectedWork.value!.tags).toEqual(work.tags)

      // 验证是浅拷贝，不是同一个引用
      expect(gallery.selectedWork.value).not.toBe(work)

      gallery.closeDetail()

      expect(gallery.showDetail.value).toBe(false)
      expect(gallery.selectedWork.value).toBeNull()
    })
  })

  describe('关于面板', () => {
    it('应该能够切换关于面板', () => {
      expect(gallery.showAbout.value).toBe(false)
      gallery.toggleAbout()
      expect(gallery.showAbout.value).toBe(true)
      gallery.toggleAbout()
      expect(gallery.showAbout.value).toBe(false)
    })
  })

  describe('签名墙', () => {
    it('应该能够添加签名', () => {
      const sig = gallery.addSignature('测试用户', 'base64data', '这是一条测试留言')

      expect(sig.name).toBe('测试用户')
      expect(sig.signatureData).toBe('base64data')
      expect(sig.comment).toBe('这是一条测试留言')
      expect(sig.id).toBeTruthy()
      expect(sig.timestamp).toBeGreaterThan(0)

      // 应包含在签名列表中
      expect(gallery.signatures.value).toContainEqual(sig)
    })

    it('签名应有随机颜色', () => {
      const sig = gallery.addSignature('用户A', 'data1', '留言1')
      expect(sig.color).toBeTruthy()
      expect(sig.color.startsWith('#')).toBe(true)
    })

    it('多次添加应有唯一ID', () => {
      const sig1 = gallery.addSignature('用户1', 'data1', '留言1')
      const sig2 = gallery.addSignature('用户2', 'data2', '留言2')
      expect(sig1.id).not.toBe(sig2.id)
    })

    it('应能管理签名模态框状态', () => {
      expect(gallery.showSignatureModal.value).toBe(false)
      gallery.openSignatureModal()
      expect(gallery.showSignatureModal.value).toBe(true)
      gallery.closeSignatureModal()
      expect(gallery.showSignatureModal.value).toBe(false)
    })
  })

  describe('签名颜色', () => {
    it('应提供预设颜色', () => {
      expect(gallery.signatureColors.length).toBeGreaterThan(0)
      gallery.signatureColors.forEach((color) => {
        expect(color.startsWith('#')).toBe(true)
      })
    })
  })
})
