import { describe, it, expect, beforeEach } from 'vitest'
import { LayoutEngine } from '../../src/services/LayoutEngine'
import type { MusicXMLParseResult, LayoutConfig } from '../../src/types'

describe('LayoutEngine', () => {
  let layoutEngine: LayoutEngine

  beforeEach(() => {
    layoutEngine = new LayoutEngine()
  })

  describe('constructor', () => {
    it('应该使用默认配置', () => {
      const config = layoutEngine.getConfig()
      
      expect(config.pageWidth).toBe(800)
      expect(config.pageHeight).toBe(1100)
      expect(config.marginTop).toBe(50)
      expect(config.marginBottom).toBe(50)
      expect(config.marginLeft).toBe(40)
      expect(config.marginRight).toBe(40)
      expect(config.staveSpacing).toBe(80)
      expect(config.systemSpacing).toBe(100)
      expect(config.measurePadding).toBe(10)
    })

    it('应该接受自定义配置', () => {
      const customConfig: Partial<LayoutConfig> = {
        pageWidth: 1000,
        pageHeight: 1400,
        staveSpacing: 100
      }
      
      const engine = new LayoutEngine(customConfig)
      const config = engine.getConfig()
      
      expect(config.pageWidth).toBe(1000)
      expect(config.pageHeight).toBe(1400)
      expect(config.staveSpacing).toBe(100)
      expect(config.marginTop).toBe(50) // 默认值
    })
  })

  describe('layout', () => {
    it('应该计算基本布局', () => {
      const score: MusicXMLParseResult = {
        metadata: {
          title: '测试乐谱',
          composer: '测试作曲家',
          keySignature: 'C',
          timeSignature: '4/4',
          tempo: 120
        },
        parts: [
          {
            id: 'P1',
            name: 'Piano',
            measures: ['P1_M1', 'P1_M2']
          }
        ],
        measures: [
          {
            id: 'P1_M1',
            number: 1,
            attributes: {
              key: 'C',
              time: '4/4',
              clef: 'treble',
              divisions: 1
            },
            notes: ['P1_M1_N1', 'P1_M1_N2'],
            annotations: []
          },
          {
            id: 'P1_M2',
            number: 2,
            attributes: {
              key: 'C',
              time: '4/4',
              clef: 'treble',
              divisions: 1
            },
            notes: ['P1_M2_N1'],
            annotations: []
          }
        ],
        notes: [
          {
            id: 'P1_M1_N1',
            pitch: 'C4',
            duration: 1,
            type: 'quarter',
            stem: 'up'
          },
          {
            id: 'P1_M1_N2',
            pitch: 'D4',
            duration: 1,
            type: 'quarter',
            stem: 'up'
          },
          {
            id: 'P1_M2_N1',
            pitch: 'E4',
            duration: 2,
            type: 'half',
            stem: 'up'
          }
        ],
        annotations: []
      }

      const staves = layoutEngine.layout(score)

      expect(staves).toBeDefined()
      expect(staves.length).toBeGreaterThan(0)
      expect(staves[0].measures).toBeDefined()
      expect(staves[0].measures.length).toBeGreaterThan(0)
    })

    it('应该处理空乐谱', () => {
      const score: MusicXMLParseResult = {
        metadata: {
          title: '空乐谱',
          composer: '未知',
          keySignature: 'C',
          timeSignature: '4/4',
          tempo: 120
        },
        parts: [],
        measures: [],
        notes: [],
        annotations: []
      }

      const staves = layoutEngine.layout(score)

      expect(staves).toBeDefined()
      expect(staves.length).toBe(0)
    })
  })

  describe('updateConfig', () => {
    it('应该更新配置', () => {
      const newConfig: Partial<LayoutConfig> = {
        pageWidth: 1200,
        staveSpacing: 120
      }

      layoutEngine.updateConfig(newConfig)
      const config = layoutEngine.getConfig()

      expect(config.pageWidth).toBe(1200)
      expect(config.staveSpacing).toBe(120)
      expect(config.marginTop).toBe(50) // 未更改的值
    })
  })

  describe('adjustStaveSpacing', () => {
    it('应该调整五线谱间距', () => {
      // 先创建一个布局
      const score: MusicXMLParseResult = {
        metadata: {
          title: '测试乐谱',
          composer: '测试作曲家',
          keySignature: 'C',
          timeSignature: '4/4',
          tempo: 120
        },
        parts: [
          {
            id: 'P1',
            name: 'Piano',
            measures: ['P1_M1']
          }
        ],
        measures: [
          {
            id: 'P1_M1',
            number: 1,
            attributes: {
              key: 'C',
              time: '4/4',
              clef: 'treble',
              divisions: 1
            },
            notes: ['P1_M1_N1'],
            annotations: []
          }
        ],
        notes: [
          {
            id: 'P1_M1_N1',
            pitch: 'C4',
            duration: 1,
            type: 'quarter',
            stem: 'up'
          }
        ],
        annotations: []
      }

      const staves = layoutEngine.layout(score)
      const originalY = staves[0].y

      // 调整间距
      layoutEngine.adjustStaveSpacing(staves[0].id, 100)

      // 验证配置已更新
      const config = layoutEngine.getConfig()
      expect(config.staveSpacing).toBe(100)
    })
  })

  describe('repaginate', () => {
    it('应该重新分页', () => {
      // 先创建一个布局
      const score: MusicXMLParseResult = {
        metadata: {
          title: '测试乐谱',
          composer: '测试作曲家',
          keySignature: 'C',
          timeSignature: '4/4',
          tempo: 120
        },
        parts: [
          {
            id: 'P1',
            name: 'Piano',
            measures: ['P1_M1', 'P1_M2']
          }
        ],
        measures: [
          {
            id: 'P1_M1',
            number: 1,
            attributes: {
              key: 'C',
              time: '4/4',
              clef: 'treble',
              divisions: 1
            },
            notes: ['P1_M1_N1'],
            annotations: []
          },
          {
            id: 'P1_M2',
            number: 2,
            attributes: {
              key: 'C',
              time: '4/4',
              clef: 'treble',
              divisions: 1
            },
            notes: ['P1_M2_N1'],
            annotations: []
          }
        ],
        notes: [
          {
            id: 'P1_M1_N1',
            pitch: 'C4',
            duration: 1,
            type: 'quarter',
            stem: 'up'
          },
          {
            id: 'P1_M2_N1',
            pitch: 'D4',
            duration: 1,
            type: 'quarter',
            stem: 'up'
          }
        ],
        annotations: []
      }

      layoutEngine.layout(score)
      
      // 重新分页
      layoutEngine.repaginate()

      // 验证没有抛出错误
      expect(true).toBe(true)
    })
  })

  describe('getTotalPages', () => {
    it('应该计算总页数', () => {
      const score: MusicXMLParseResult = {
        metadata: {
          title: '测试乐谱',
          composer: '测试作曲家',
          keySignature: 'C',
          timeSignature: '4/4',
          tempo: 120
        },
        parts: [
          {
            id: 'P1',
            name: 'Piano',
            measures: ['P1_M1']
          }
        ],
        measures: [
          {
            id: 'P1_M1',
            number: 1,
            attributes: {
              key: 'C',
              time: '4/4',
              clef: 'treble',
              divisions: 1
            },
            notes: ['P1_M1_N1'],
            annotations: []
          }
        ],
        notes: [
          {
            id: 'P1_M1_N1',
            pitch: 'C4',
            duration: 1,
            type: 'quarter',
            stem: 'up'
          }
        ],
        annotations: []
      }

      layoutEngine.layout(score)
      const pages = layoutEngine.getTotalPages()

      expect(pages).toBeGreaterThan(0)
    })
  })
})