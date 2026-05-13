import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PresentationEngine } from '../../src/services/PresentationEngine'
import type { PresentationStep } from '../../src/types'

describe('PresentationEngine', () => {
  let presentationEngine: PresentationEngine

  beforeEach(() => {
    presentationEngine = new PresentationEngine()
  })

  afterEach(() => {
    presentationEngine.destroy()
  })

  describe('initialize', () => {
    it('应该初始化步骤', () => {
      const steps: PresentationStep[] = [
        {
          id: 'step1',
          order: 1,
          name: '步骤1',
          description: '描述1',
          layerIds: ['layer1'],
          duration: 3000
        },
        {
          id: 'step2',
          order: 2,
          name: '步骤2',
          description: '描述2',
          layerIds: ['layer1', 'layer2'],
          duration: 5000
        }
      ]

      presentationEngine.initialize(steps)

      expect(presentationEngine.getSteps()).toHaveLength(2)
      expect(presentationEngine.getCurrentStep()?.id).toBe('step1')
      expect(presentationEngine.getCurrentStepIndex()).toBe(0)
    })

    it('应该按order排序步骤', () => {
      const steps: PresentationStep[] = [
        {
          id: 'step2',
          order: 2,
          name: '步骤2',
          description: '描述2',
          layerIds: ['layer1', 'layer2'],
          duration: 5000
        },
        {
          id: 'step1',
          order: 1,
          name: '步骤1',
          description: '描述1',
          layerIds: ['layer1'],
          duration: 3000
        }
      ]

      presentationEngine.initialize(steps)

      expect(presentationEngine.getSteps()[0].id).toBe('step1')
      expect(presentationEngine.getSteps()[1].id).toBe('step2')
    })
  })

  describe('navigation', () => {
    const steps: PresentationStep[] = [
      {
        id: 'step1',
        order: 1,
        name: '步骤1',
        description: '描述1',
        layerIds: ['layer1'],
        duration: 3000
      },
      {
        id: 'step2',
        order: 2,
        name: '步骤2',
        description: '描述2',
        layerIds: ['layer1', 'layer2'],
        duration: 5000
      },
      {
        id: 'step3',
        order: 3,
        name: '步骤3',
        description: '描述3',
        layerIds: ['layer1', 'layer2', 'layer3'],
        duration: 5000
      }
    ]

    beforeEach(() => {
      presentationEngine.initialize(steps)
    })

    it('应该跳转到下一步', () => {
      presentationEngine.nextStep()
      expect(presentationEngine.getCurrentStepIndex()).toBe(1)
      expect(presentationEngine.getCurrentStep()?.id).toBe('step2')
    })

    it('应该跳转到上一步', () => {
      presentationEngine.goToStep(2)
      presentationEngine.previousStep()
      expect(presentationEngine.getCurrentStepIndex()).toBe(1)
      expect(presentationEngine.getCurrentStep()?.id).toBe('step2')
    })

    it('应该跳转到指定步骤', () => {
      presentationEngine.goToStep(2)
      expect(presentationEngine.getCurrentStepIndex()).toBe(2)
      expect(presentationEngine.getCurrentStep()?.id).toBe('step3')
    })

    it('不应该跳转到超出范围的步骤', () => {
      presentationEngine.goToStep(-1)
      expect(presentationEngine.getCurrentStepIndex()).toBe(0)
      
      presentationEngine.goToStep(10)
      expect(presentationEngine.getCurrentStepIndex()).toBe(0)
    })

    it('不应该在最后一步继续下一步', () => {
      presentationEngine.goToStep(2)
      presentationEngine.nextStep()
      expect(presentationEngine.getCurrentStepIndex()).toBe(2)
    })

    it('不应该在第一步继续上一步', () => {
      presentationEngine.previousStep()
      expect(presentationEngine.getCurrentStepIndex()).toBe(0)
    })

    it('应该检查是否为第一步', () => {
      expect(presentationEngine.isFirstStep()).toBe(true)
      
      presentationEngine.nextStep()
      expect(presentationEngine.isFirstStep()).toBe(false)
    })

    it('应该检查是否为最后一步', () => {
      expect(presentationEngine.isLastStep()).toBe(false)
      
      presentationEngine.goToStep(2)
      expect(presentationEngine.isLastStep()).toBe(true)
    })
  })

  describe('playback', () => {
    const steps: PresentationStep[] = [
      {
        id: 'step1',
        order: 1,
        name: '步骤1',
        description: '描述1',
        layerIds: ['layer1'],
        duration: 3000
      },
      {
        id: 'step2',
        order: 2,
        name: '步骤2',
        description: '描述2',
        layerIds: ['layer1', 'layer2'],
        duration: 5000
      }
    ]

    beforeEach(() => {
      presentationEngine.initialize(steps)
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('应该开始播放', () => {
      presentationEngine.play()
      expect(presentationEngine.getIsPlaying()).toBe(true)
    })

    it('应该暂停播放', () => {
      presentationEngine.play()
      presentationEngine.pause()
      expect(presentationEngine.getIsPlaying()).toBe(false)
    })

    it('应该停止播放', () => {
      presentationEngine.play()
      presentationEngine.goToStep(1)
      presentationEngine.stop()
      
      expect(presentationEngine.getIsPlaying()).toBe(false)
      expect(presentationEngine.getCurrentStepIndex()).toBe(0)
    })

    it('应该切换播放状态', () => {
      presentationEngine.togglePlay()
      expect(presentationEngine.getIsPlaying()).toBe(true)
      
      presentationEngine.togglePlay()
      expect(presentationEngine.getIsPlaying()).toBe(false)
    })

    it('应该自动播放到下一步', () => {
      presentationEngine.play()
      
      // 模拟时间流逝（速度2 = 4秒间隔）
      vi.advanceTimersByTime(4000)
      
      expect(presentationEngine.getCurrentStepIndex()).toBe(1)
    })

    it('应该在最后一步停止自动播放', () => {
      // 先跳转到最后一步
      presentationEngine.goToStep(1)
      presentationEngine.play()
      
      // 模拟时间流逝，尝试下一步
      vi.advanceTimersByTime(4000)
      
      // 应该停止播放，但仍在最后一步
      expect(presentationEngine.getCurrentStepIndex()).toBe(1)
      expect(presentationEngine.getIsPlaying()).toBe(false)
    })
  })

  describe('speed', () => {
    it('应该设置播放速度', () => {
      presentationEngine.setSpeed(3)
      expect(presentationEngine.getSpeed()).toBe(3)
    })

    it('应该限制播放速度范围', () => {
      presentationEngine.setSpeed(0)
      expect(presentationEngine.getSpeed()).toBe(1)
      
      presentationEngine.setSpeed(10)
      expect(presentationEngine.getSpeed()).toBe(5)
    })
  })

  describe('layers', () => {
    const steps: PresentationStep[] = [
      {
        id: 'step1',
        order: 1,
        name: '步骤1',
        description: '描述1',
        layerIds: ['layer1'],
        duration: 3000
      },
      {
        id: 'step2',
        order: 2,
        name: '步骤2',
        description: '描述2',
        layerIds: ['layer1', 'layer2'],
        duration: 5000
      }
    ]

    beforeEach(() => {
      presentationEngine.initialize(steps)
    })

    it('应该获取当前步骤的图层ID', () => {
      expect(presentationEngine.getCurrentLayerIds()).toEqual(['layer1'])
      
      presentationEngine.nextStep()
      expect(presentationEngine.getCurrentLayerIds()).toEqual(['layer1', 'layer2'])
    })

    it('应该获取当前步骤的图层', () => {
      const allLayers = [
        { id: 'layer1', name: '图层1', type: 'structural' as const, level: 'basic' as const, visible: true, opacity: 100, annotations: [] },
        { id: 'layer2', name: '图层2', type: 'motivic' as const, level: 'advanced' as const, visible: true, opacity: 100, annotations: [] },
        { id: 'layer3', name: '图层3', type: 'harmonic' as const, level: 'professional' as const, visible: true, opacity: 100, annotations: [] }
      ]
      
      const currentLayers = presentationEngine.getCurrentLayers(allLayers)
      expect(currentLayers).toHaveLength(1)
      expect(currentLayers[0].id).toBe('layer1')
      
      presentationEngine.nextStep()
      const nextLayers = presentationEngine.getCurrentLayers(allLayers)
      expect(nextLayers).toHaveLength(2)
    })
  })

  describe('callbacks', () => {
    const steps: PresentationStep[] = [
      {
        id: 'step1',
        order: 1,
        name: '步骤1',
        description: '描述1',
        layerIds: ['layer1'],
        duration: 3000
      },
      {
        id: 'step2',
        order: 2,
        name: '步骤2',
        description: '描述2',
        layerIds: ['layer1', 'layer2'],
        duration: 5000
      }
    ]

    beforeEach(() => {
      presentationEngine.initialize(steps)
    })

    it('应该调用步骤变化回调', () => {
      const callback = vi.fn()
      presentationEngine.setOnStepChange(callback)
      
      presentationEngine.nextStep()
      
      expect(callback).toHaveBeenCalledWith(steps[1], 1)
    })

    it('应该调用播放状态变化回调', () => {
      const callback = vi.fn()
      presentationEngine.setOnPlayStateChange(callback)
      
      presentationEngine.play()
      
      expect(callback).toHaveBeenCalledWith(true)
    })
  })

  describe('getTotalSteps', () => {
    it('应该返回总步骤数', () => {
      const steps: PresentationStep[] = [
        {
          id: 'step1',
          order: 1,
          name: '步骤1',
          description: '描述1',
          layerIds: ['layer1'],
          duration: 3000
        },
        {
          id: 'step2',
          order: 2,
          name: '步骤2',
          description: '描述2',
          layerIds: ['layer1', 'layer2'],
          duration: 5000
        }
      ]

      presentationEngine.initialize(steps)
      
      expect(presentationEngine.getTotalSteps()).toBe(2)
    })
  })
})