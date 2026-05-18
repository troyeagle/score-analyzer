import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useScoreStore } from '../../src/stores/score'
import type { MusicXMLParseResult, Part, Measure, Voice, Note, Annotation } from '../../src/types'

describe('useScoreStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // 辅助函数：创建测试用 MusicXMLParseResult
  function createParseResult(overrides: Partial<MusicXMLParseResult> = {}): MusicXMLParseResult {
    const note: Note = {
      id: 'P1_M1_N1',
      pitch: 'C4',
      duration: 256,
      type: 'quarter',
      stem: 'up',
      dots: 0,
      voice: 1,
      staff: 1,
      isChord: false,
      isRest: false,
      lyrics: [],
      notations: []
    }

    const voice: Voice = {
      id: 1,
      staff: 1,
      notes: [note]
    }

    const measure: Measure = {
      id: 'P1_M1',
      number: 1,
      attributes: {
        key: 'C',
        mode: 'major',
        time: '4/4',
        divisions: 256,
        staves: 1,
        clefs: [{ number: 1, sign: 'G', line: 2 }]
      },
      voices: new Map([[1, voice]]),
      directions: [],
      barlines: []
    }

    const part: Part = {
      id: 'P1',
      name: 'Piano',
      staves: 1,
      measures: [measure]
    }

    return {
      metadata: {
        title: 'Test Score',
        composer: 'Test Composer',
        keySignature: 'C',
        timeSignature: '4/4',
        tempo: 120
      },
      parts: [part],
      ...overrides
    }
  }

  describe('initial state', () => {
    it('should have empty initial state', () => {
      const store = useScoreStore()
      
      expect(store.metadata).toBeNull()
      expect(store.parts).toEqual([])
      expect(store.selectedPartIds).toEqual([])
      expect(store.isLoaded).toBe(false)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should have default layers', () => {
      const store = useScoreStore()
      
      expect(store.layers).toHaveLength(4)
      expect(store.layers.map(l => l.id)).toEqual(['structural', 'motivic', 'harmonic', 'annotation'])
    })
  })

  describe('loadScore', () => {
    it('should load score data', async () => {
      const store = useScoreStore()
      const parseResult = createParseResult()
      
      await store.loadScore(parseResult)
      
      expect(store.metadata?.title).toBe('Test Score')
      expect(store.parts).toHaveLength(1)
      expect(store.isLoaded).toBe(true)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should select all parts by default', async () => {
      const store = useScoreStore()
      const parseResult = createParseResult()
      
      await store.loadScore(parseResult)
      
      expect(store.selectedPartIds).toEqual(['P1'])
    })

    it('should handle loading errors', async () => {
      const store = useScoreStore()
      
      // Create a malformed result that will cause an error
      const badResult = { metadata: null as any, parts: null as any }
      
      await store.loadScore(badResult)
      
      // The store should handle this gracefully
      expect(store.loading).toBe(false)
    })
  })

  describe('computed properties', () => {
    it('should compute scoreTitle', async () => {
      const store = useScoreStore()
      
      expect(store.scoreTitle).toBe('未命名作品')
      
      await store.loadScore(createParseResult())
      expect(store.scoreTitle).toBe('Test Score')
    })

    it('should compute scoreComposer', async () => {
      const store = useScoreStore()
      
      expect(store.scoreComposer).toBe('未知作曲家')
      
      await store.loadScore(createParseResult())
      expect(store.scoreComposer).toBe('Test Composer')
    })

    it('should compute totalMeasures', async () => {
      const store = useScoreStore()
      
      expect(store.totalMeasures).toBe(0)
      
      await store.loadScore(createParseResult())
      expect(store.totalMeasures).toBe(1)
    })

    it('should compute totalParts', async () => {
      const store = useScoreStore()
      
      expect(store.totalParts).toBe(0)
      
      await store.loadScore(createParseResult())
      expect(store.totalParts).toBe(1)
    })

    it('should compute selectedParts', async () => {
      const store = useScoreStore()
      await store.loadScore(createParseResult())
      
      expect(store.selectedParts).toHaveLength(1)
      expect(store.selectedParts[0].id).toBe('P1')
    })

    it('should compute visibleLayers', () => {
      const store = useScoreStore()
      
      // By default, only structural layer is visible
      expect(store.visibleLayers).toHaveLength(1)
      expect(store.visibleLayers[0].id).toBe('structural')
    })
  })

  describe('part selection', () => {
    it('should toggle part selection', async () => {
      const store = useScoreStore()
      await store.loadScore(createParseResult())
      
      expect(store.selectedPartIds).toEqual(['P1'])
      
      store.togglePartSelection('P1')
      expect(store.selectedPartIds).toEqual([])
      
      store.togglePartSelection('P1')
      expect(store.selectedPartIds).toEqual(['P1'])
    })

    it('should select all parts', async () => {
      const store = useScoreStore()
      await store.loadScore(createParseResult())
      
      store.deselectAllParts()
      expect(store.selectedPartIds).toEqual([])
      
      store.selectAllParts()
      expect(store.selectedPartIds).toEqual(['P1'])
    })

    it('should deselect all parts', async () => {
      const store = useScoreStore()
      await store.loadScore(createParseResult())
      
      store.deselectAllParts()
      expect(store.selectedPartIds).toEqual([])
    })
  })

  describe('layer management', () => {
    it('should toggle layer visibility', () => {
      const store = useScoreStore()
      
      expect(store.layers[0].visible).toBe(true)
      
      store.toggleLayerVisibility('structural')
      expect(store.layers[0].visible).toBe(false)
      
      store.toggleLayerVisibility('structural')
      expect(store.layers[0].visible).toBe(true)
    })

    it('should set layer opacity', () => {
      const store = useScoreStore()
      
      store.setLayerOpacity('structural', 50)
      expect(store.layers[0].opacity).toBe(50)
    })

    it('should clamp opacity to 0-100', () => {
      const store = useScoreStore()
      
      store.setLayerOpacity('structural', -10)
      expect(store.layers[0].opacity).toBe(0)
      
      store.setLayerOpacity('structural', 150)
      expect(store.layers[0].opacity).toBe(100)
    })
  })

  describe('annotation management', () => {
    it('should add annotation to appropriate layer', () => {
      const store = useScoreStore()
      
      const annotation: Annotation = {
        id: 'ann_1',
        type: 'structural',
        level: 'basic',
        startMeasure: 1,
        endMeasure: 4,
        content: 'Exposition',
        style: {
          color: '#333',
          backgroundColor: 'rgba(64, 158, 255, 0.1)',
          borderColor: '#409eff',
          borderWidth: 1,
          fontSize: 12,
          fontFamily: 'Arial'
        }
      }
      
      store.addAnnotation(annotation)
      
      const structuralLayer = store.layers.find(l => l.id === 'structural')
      expect(structuralLayer?.annotations).toHaveLength(1)
      expect(structuralLayer?.annotations[0].content).toBe('Exposition')
    })

    it('should update annotation', () => {
      const store = useScoreStore()
      
      const annotation: Annotation = {
        id: 'ann_1',
        type: 'structural',
        level: 'basic',
        startMeasure: 1,
        endMeasure: 4,
        content: 'Original',
        style: {
          color: '#333',
          backgroundColor: 'rgba(64, 158, 255, 0.1)',
          borderColor: '#409eff',
          borderWidth: 1,
          fontSize: 12,
          fontFamily: 'Arial'
        }
      }
      
      store.addAnnotation(annotation)
      store.updateAnnotation('ann_1', { content: 'Updated' })
      
      const structuralLayer = store.layers.find(l => l.id === 'structural')
      expect(structuralLayer?.annotations[0].content).toBe('Updated')
    })

    it('should remove annotation', () => {
      const store = useScoreStore()
      
      const annotation: Annotation = {
        id: 'ann_1',
        type: 'structural',
        level: 'basic',
        startMeasure: 1,
        endMeasure: 4,
        content: 'To be removed',
        style: {
          color: '#333',
          backgroundColor: 'rgba(64, 158, 255, 0.1)',
          borderColor: '#409eff',
          borderWidth: 1,
          fontSize: 12,
          fontFamily: 'Arial'
        }
      }
      
      store.addAnnotation(annotation)
      expect(store.layers[0].annotations).toHaveLength(1)
      
      store.removeAnnotation('ann_1')
      expect(store.layers[0].annotations).toHaveLength(0)
    })
  })

  describe('layout config', () => {
    it('should update layout config', () => {
      const store = useScoreStore()
      
      store.updateLayoutConfig({ pageWidth: 1200 })
      expect(store.layoutConfig.pageWidth).toBe(1200)
      expect(store.layoutConfig.pageHeight).toBe(1100) // unchanged
    })
  })

  describe('helper methods', () => {
    it('should get part measures', async () => {
      const store = useScoreStore()
      await store.loadScore(createParseResult())
      
      const measures = store.getPartMeasures('P1')
      expect(measures).toHaveLength(1)
    })

    it('should return empty array for non-existent part', async () => {
      const store = useScoreStore()
      await store.loadScore(createParseResult())
      
      const measures = store.getPartMeasures('nonexistent')
      expect(measures).toEqual([])
    })

    it('should get measure notes', async () => {
      const store = useScoreStore()
      await store.loadScore(createParseResult())
      
      const notes = store.getMeasureNotes('P1', 1)
      expect(notes).toHaveLength(1)
      expect(notes[0].pitch).toBe('C4')
    })

    it('should return empty array for non-existent measure', async () => {
      const store = useScoreStore()
      await store.loadScore(createParseResult())
      
      const notes = store.getMeasureNotes('P1', 999)
      expect(notes).toEqual([])
    })
  })

  describe('reset', () => {
    it('should reset all state', async () => {
      const store = useScoreStore()
      await store.loadScore(createParseResult())
      
      store.reset()
      
      expect(store.metadata).toBeNull()
      expect(store.parts).toEqual([])
      expect(store.selectedPartIds).toEqual([])
      expect(store.isLoaded).toBe(false)
      expect(store.layers).toHaveLength(4) // re-initialized
    })
  })
})
