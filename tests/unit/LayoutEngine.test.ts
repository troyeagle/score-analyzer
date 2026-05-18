import { describe, it, expect, beforeEach } from 'vitest'
import { LayoutEngine } from '../../src/services/LayoutEngine'
import type { Part, Measure, Voice, Note, LayoutConfig } from '../../src/types'

describe('LayoutEngine', () => {
  let engine: LayoutEngine

  beforeEach(() => {
    engine = new LayoutEngine()
  })

  // 辅助函数：创建测试用音符
  function createNote(overrides: Partial<Note> = {}): Note {
    return {
      id: 'note_1',
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
      notations: [],
      ...overrides
    }
  }

  // 辅助函数：创建测试用 Voice
  function createVoice(notes: Note[], staff: number = 1): Voice {
    return {
      id: 1,
      staff,
      notes
    }
  }

  // 辅助函数：创建测试用 Measure
  function createMeasure(overrides: Partial<Measure> = {}): Measure {
    return {
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
      voices: new Map([[1, createVoice([createNote()])]]),
      directions: [],
      barlines: [],
      ...overrides
    }
  }

  // 辅助函数：创建测试用 Part
  function createPart(measures: Measure[], staves: number = 1): Part {
    return {
      id: 'P1',
      name: 'Test Part',
      staves,
      measures
    }
  }

  describe('constructor', () => {
    it('should use default config when no config provided', () => {
      const config = engine.getConfig()
      expect(config.pageWidth).toBe(800)
      expect(config.pageHeight).toBe(1100)
      expect(config.marginTop).toBe(50)
      expect(config.staveSpacing).toBe(80)
      expect(config.staffSpacing).toBe(60)
    })

    it('should merge partial config with defaults', () => {
      const custom = new LayoutEngine({ pageWidth: 1200, staveSpacing: 100 })
      const config = custom.getConfig()
      expect(config.pageWidth).toBe(1200)
      expect(config.staveSpacing).toBe(100)
      expect(config.marginTop).toBe(50) // default
    })
  })

  describe('layout', () => {
    it('should return empty array for empty parts', () => {
      const result = engine.layout([])
      expect(result).toEqual([])
    })

    it('should create layout for single part with one measure', () => {
      const measure = createMeasure()
      const part = createPart([measure])
      
      const result = engine.layout([part])
      
      expect(result).toHaveLength(1)
      expect(result[0].partId).toBe('P1')
      expect(result[0].partName).toBe('Test Part')
      expect(result[0].measures).toHaveLength(1)
    })

    it('should split measures into lines (4 per line)', () => {
      const measures = Array.from({ length: 10 }, (_, i) => 
        createMeasure({ id: `P1_M${i + 1}`, number: i + 1 })
      )
      const part = createPart(measures)
      
      const result = engine.layout([part])
      
      // 10 measures / 4 per line = 3 lines
      expect(result).toHaveLength(3)
      expect(result[0].measures).toHaveLength(4)
      expect(result[1].measures).toHaveLength(4)
      expect(result[2].measures).toHaveLength(2)
    })

    it('should create layout for multiple parts', () => {
      const part1 = createPart([createMeasure()], 1)
      const part2 = createPart([createMeasure()], 2)
      
      const result = engine.layout([part1, part2])
      
      expect(result).toHaveLength(2)
      expect(result[0].partId).toBe('P1')
      expect(result[1].partId).toBe('P1') // Both use same createPart helper
    })

    it('should mark grand staff parts', () => {
      const measure = createMeasure()
      const part = createPart([measure], 2)
      
      const result = engine.layout([part])
      
      expect(result[0].isGrandStaff).toBe(true)
      expect(result[0].staves).toBe(2)
    })

    it('should position staves vertically', () => {
      const measures = [createMeasure(), createMeasure()]
      const part = createPart(measures)
      
      const result = engine.layout([part])
      
      // Both measures fit in one line
      expect(result).toHaveLength(1)
      expect(result[0].y).toBe(50) // marginTop
    })

    it('should calculate correct measure widths', () => {
      const measures = Array.from({ length: 4 }, (_, i) => 
        createMeasure({ id: `P1_M${i + 1}`, number: i + 1 })
      )
      const part = createPart(measures)
      
      const result = engine.layout([part])
      
      const totalWidth = result[0].measures.reduce((sum, m) => sum + m.width, 0)
      const availableWidth = 800 - 40 - 40 // pageWidth - marginLeft - marginRight
      
      // Each measure should be approximately 1/4 of available width
      expect(result[0].measures[0].width).toBeCloseTo(availableWidth / 4, 0)
    })
  })

  describe('note layout', () => {
    it('should layout notes within a measure', () => {
      const notes = [
        createNote({ id: 'n1', pitch: 'C4' }),
        createNote({ id: 'n2', pitch: 'D4' }),
        createNote({ id: 'n3', pitch: 'E4' })
      ]
      const measure = createMeasure({
        voices: new Map([[1, createVoice(notes)]])
      })
      const part = createPart([measure])
      
      const result = engine.layout([part])
      const measureLayout = result[0].measures[0]
      
      expect(measureLayout.notes).toHaveLength(3)
      expect(measureLayout.notes[0].id).toBe('n1')
      expect(measureLayout.notes[1].id).toBe('n2')
      expect(measureLayout.notes[2].id).toBe('n3')
    })

    it('should position notes horizontally within measure', () => {
      const notes = [
        createNote({ id: 'n1', pitch: 'C4' }),
        createNote({ id: 'n2', pitch: 'D4' })
      ]
      const measure = createMeasure({
        voices: new Map([[1, createVoice(notes)]])
      })
      const part = createPart([measure])
      
      const result = engine.layout([part])
      const noteLayouts = result[0].measures[0].notes
      
      // Notes should be spaced within the measure
      expect(noteLayouts[0].x).toBeLessThan(noteLayouts[1].x)
    })

    it('should assign staff and voice to note layout', () => {
      const note = createNote({ staff: 2, voice: 3 })
      const measure = createMeasure({
        voices: new Map([[3, createVoice([note], 2)]])
      })
      const part = createPart([measure])
      
      const result = engine.layout([part])
      const noteLayout = result[0].measures[0].notes[0]
      
      expect(noteLayout.staff).toBe(2)
      expect(noteLayout.voice).toBe(3)
    })

    it('should handle empty measures', () => {
      const measure = createMeasure({
        voices: new Map()
      })
      const part = createPart([measure])
      
      const result = engine.layout([part])
      
      expect(result[0].measures[0].notes).toHaveLength(0)
    })

    it('should handle rest notes', () => {
      const rest = createNote({ id: 'rest1', isRest: true, pitch: '' })
      const measure = createMeasure({
        voices: new Map([[1, createVoice([rest])]])
      })
      const part = createPart([measure])
      
      const result = engine.layout([part])
      
      expect(result[0].measures[0].notes).toHaveLength(1)
    })
  })

  describe('updateConfig', () => {
    it('should update config partially', () => {
      engine.updateConfig({ pageWidth: 1200 })
      const config = engine.getConfig()
      
      expect(config.pageWidth).toBe(1200)
      expect(config.pageHeight).toBe(1100) // unchanged
    })

    it('should affect subsequent layout calls', () => {
      const measures = Array.from({ length: 4 }, (_, i) => 
        createMeasure({ id: `P1_M${i + 1}`, number: i + 1 })
      )
      const part = createPart(measures)
      
      engine.updateConfig({ marginLeft: 100, marginRight: 100 })
      const result = engine.layout([part])
      
      const availableWidth = 800 - 100 - 100
      // Each measure should be ~1/4 of the new available width
      expect(result[0].measures[0].width).toBeCloseTo(availableWidth / 4, 0)
    })
  })

  describe('edge cases', () => {
    it('should handle part with many measures', () => {
      const measures = Array.from({ length: 100 }, (_, i) => 
        createMeasure({ id: `P1_M${i + 1}`, number: i + 1 })
      )
      const part = createPart(measures)
      
      const result = engine.layout([part])
      
      // 100 measures / 4 per line = 25 lines
      expect(result).toHaveLength(25)
    })

    it('should handle notes with different durations', () => {
      const notes = [
        createNote({ id: 'n1', type: 'whole', pitch: 'C4' }),
        createNote({ id: 'n2', type: 'quarter', pitch: 'D4' }),
        createNote({ id: 'n3', type: 'eighth', pitch: 'E4' })
      ]
      const measure = createMeasure({
        voices: new Map([[1, createVoice(notes)]])
      })
      const part = createPart([measure])
      
      const result = engine.layout([part])
      
      expect(result[0].measures[0].notes).toHaveLength(3)
    })

    it('should handle notes with accidentals', () => {
      const notes = [
        createNote({ id: 'n1', pitch: 'F#4' }),
        createNote({ id: 'n2', pitch: 'Bb4' })
      ]
      const measure = createMeasure({
        voices: new Map([[1, createVoice(notes)]])
      })
      const part = createPart([measure])
      
      const result = engine.layout([part])
      
      expect(result[0].measures[0].notes).toHaveLength(2)
    })
  })
})
