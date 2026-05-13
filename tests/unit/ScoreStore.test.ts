import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useScoreStore } from '../../src/stores/score'
import type { MusicXMLParseResult, Annotation } from '../../src/types'

describe('ScoreStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('应该有正确的初始状态', () => {
      const store = useScoreStore()
      
      expect(store.metadata).toBeNull()
      expect(store.parts).toEqual([])
      expect(store.measures).toEqual([])
      expect(store.notes).toEqual([])
      expect(store.annotations).toEqual([])
      expect(store.layers).toHaveLength(4) // 4个默认图层
      expect(store.isLoaded).toBe(false)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
    
    it('应该初始化默认图层', () => {
      const store = useScoreStore()
      
      const layerIds = store.layers.map(l => l.id)
      expect(layerIds).toContain('structural')
      expect(layerIds).toContain('motivic')
      expect(layerIds).toContain('harmonic')
      expect(layerIds).toContain('annotation')
    })
  })

  describe('loadScore', () => {
    it('应该加载乐谱数据', async () => {
      const store = useScoreStore()
      
      const parseResult: MusicXMLParseResult = {
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
      
      await store.loadScore(parseResult)
      
      expect(store.metadata?.title).toBe('测试乐谱')
      expect(store.parts).toHaveLength(1)
      expect(store.measures).toHaveLength(1)
      expect(store.notes).toHaveLength(1)
      expect(store.isLoaded).toBe(true)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('computed properties', () => {
    it('应该计算scoreTitle', async () => {
      const store = useScoreStore()
      
      // 未加载时
      expect(store.scoreTitle).toBe('未命名作品')
      
      // 加载后
      const parseResult: MusicXMLParseResult = {
        metadata: {
          title: '测试乐谱',
          composer: '测试作曲家',
          keySignature: 'C',
          timeSignature: '4/4',
          tempo: 120
        },
        parts: [],
        measures: [],
        notes: [],
        annotations: []
      }
      
      await store.loadScore(parseResult)
      expect(store.scoreTitle).toBe('测试乐谱')
    })
    
    it('应该计算totalMeasures', async () => {
      const store = useScoreStore()
      
      const parseResult: MusicXMLParseResult = {
        metadata: {
          title: '测试乐谱',
          composer: '测试作曲家',
          keySignature: 'C',
          timeSignature: '4/4',
          tempo: 120
        },
        parts: [],
        measures: [
          {
            id: 'M1',
            number: 1,
            attributes: { key: 'C', time: '4/4', clef: 'treble', divisions: 1 },
            notes: [],
            annotations: []
          },
          {
            id: 'M2',
            number: 2,
            attributes: { key: 'C', time: '4/4', clef: 'treble', divisions: 1 },
            notes: [],
            annotations: []
          }
        ],
        notes: [],
        annotations: []
      }
      
      await store.loadScore(parseResult)
      expect(store.totalMeasures).toBe(2)
    })
  })

  describe('layer management', () => {
    it('应该切换图层可见性', () => {
      const store = useScoreStore()
      
      // 初始状态
      const structuralLayer = store.layers.find(l => l.id === 'structural')
      expect(structuralLayer?.visible).toBe(true)
      
      // 切换为不可见
      store.toggleLayerVisibility('structural')
      expect(structuralLayer?.visible).toBe(false)
      
      // 切换为可见
      store.toggleLayerVisibility('structural')
      expect(structuralLayer?.visible).toBe(true)
    })
    
    it('应该设置图层透明度', () => {
      const store = useScoreStore()
      
      store.setLayerOpacity('structural', 50)
      const structuralLayer = store.layers.find(l => l.id === 'structural')
      expect(structuralLayer?.opacity).toBe(50)
    })
    
    it('应该限制透明度范围', () => {
      const store = useScoreStore()
      
      store.setLayerOpacity('structural', 150)
      const structuralLayer = store.layers.find(l => l.id === 'structural')
      expect(structuralLayer?.opacity).toBe(100)
      
      store.setLayerOpacity('structural', -10)
      expect(structuralLayer?.opacity).toBe(0)
    })
  })

  describe('annotation management', () => {
    it('应该添加标注', async () => {
      const store = useScoreStore()
      
      // 先加载一些数据
      const parseResult: MusicXMLParseResult = {
        metadata: {
          title: '测试乐谱',
          composer: '测试作曲家',
          keySignature: 'C',
          timeSignature: '4/4',
          tempo: 120
        },
        parts: [],
        measures: [],
        notes: [],
        annotations: []
      }
      
      await store.loadScore(parseResult)
      
      const annotation: Annotation = {
        id: 'test-annotation',
        type: 'structural',
        level: 'basic',
        startMeasure: 1,
        endMeasure: 1,
        content: '测试标注',
        style: {
          color: '#ffffff',
          backgroundColor: 'rgba(64, 158, 255, 0.2)',
          borderColor: '#409eff',
          borderWidth: 2,
          fontSize: 14,
          fontFamily: 'Arial, sans-serif'
        }
      }
      
      store.addAnnotation(annotation)
      
      expect(store.annotations).toHaveLength(1)
      expect(store.annotations[0].id).toBe('test-annotation')
      
      // 检查是否添加到对应图层
      const structuralLayer = store.layers.find(l => l.id === 'structural')
      expect(structuralLayer?.annotations).toHaveLength(1)
    })
    
    it('应该更新标注', async () => {
      const store = useScoreStore()
      
      // 先加载一些数据
      const parseResult: MusicXMLParseResult = {
        metadata: {
          title: '测试乐谱',
          composer: '测试作曲家',
          keySignature: 'C',
          timeSignature: '4/4',
          tempo: 120
        },
        parts: [],
        measures: [],
        notes: [],
        annotations: []
      }
      
      await store.loadScore(parseResult)
      
      const annotation: Annotation = {
        id: 'test-annotation',
        type: 'structural',
        level: 'basic',
        startMeasure: 1,
        endMeasure: 1,
        content: '测试标注',
        style: {
          color: '#ffffff',
          backgroundColor: 'rgba(64, 158, 255, 0.2)',
          borderColor: '#409eff',
          borderWidth: 2,
          fontSize: 14,
          fontFamily: 'Arial, sans-serif'
        }
      }
      
      store.addAnnotation(annotation)
      
      // 更新标注
      store.updateAnnotation('test-annotation', { content: '更新后的标注' })
      
      expect(store.annotations[0].content).toBe('更新后的标注')
      
      // 检查图层中的标注是否也更新了
      const structuralLayer = store.layers.find(l => l.id === 'structural')
      expect(structuralLayer?.annotations[0].content).toBe('更新后的标注')
    })
    
    it('应该删除标注', async () => {
      const store = useScoreStore()
      
      // 先加载一些数据
      const parseResult: MusicXMLParseResult = {
        metadata: {
          title: '测试乐谱',
          composer: '测试作曲家',
          keySignature: 'C',
          timeSignature: '4/4',
          tempo: 120
        },
        parts: [],
        measures: [],
        notes: [],
        annotations: []
      }
      
      await store.loadScore(parseResult)
      
      const annotation: Annotation = {
        id: 'test-annotation',
        type: 'structural',
        level: 'basic',
        startMeasure: 1,
        endMeasure: 1,
        content: '测试标注',
        style: {
          color: '#ffffff',
          backgroundColor: 'rgba(64, 158, 255, 0.2)',
          borderColor: '#409eff',
          borderWidth: 2,
          fontSize: 14,
          fontFamily: 'Arial, sans-serif'
        }
      }
      
      store.addAnnotation(annotation)
      expect(store.annotations).toHaveLength(1)
      
      // 删除标注
      store.removeAnnotation('test-annotation')
      
      expect(store.annotations).toHaveLength(0)
      
      // 检查图层中的标注是否也删除了
      const structuralLayer = store.layers.find(l => l.id === 'structural')
      expect(structuralLayer?.annotations).toHaveLength(0)
    })
  })

  describe('layout config', () => {
    it('应该更新排版配置', () => {
      const store = useScoreStore()
      
      store.updateLayoutConfig({ staveSpacing: 100 })
      
      expect(store.layoutConfig.staveSpacing).toBe(100)
      expect(store.layoutConfig.pageWidth).toBe(800) // 未更改的值
    })
  })

  describe('reset', () => {
    it('应该重置所有状态', async () => {
      const store = useScoreStore()
      
      // 先加载一些数据
      const parseResult: MusicXMLParseResult = {
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
      
      await store.loadScore(parseResult)
      
      // 添加一些标注
      const annotation: Annotation = {
        id: 'test-annotation',
        type: 'structural',
        level: 'basic',
        startMeasure: 1,
        endMeasure: 1,
        content: '测试标注',
        style: {
          color: '#ffffff',
          backgroundColor: 'rgba(64, 158, 255, 0.2)',
          borderColor: '#409eff',
          borderWidth: 2,
          fontSize: 14,
          fontFamily: 'Arial, sans-serif'
        }
      }
      
      store.addAnnotation(annotation)
      
      // 重置
      store.reset()
      
      expect(store.metadata).toBeNull()
      expect(store.parts).toEqual([])
      expect(store.measures).toEqual([])
      expect(store.notes).toEqual([])
      expect(store.annotations).toEqual([])
      expect(store.isLoaded).toBe(false)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      
      // 图层应该重新初始化
      expect(store.layers).toHaveLength(4)
      store.layers.forEach(layer => {
        expect(layer.annotations).toHaveLength(0)
      })
    })
  })
})