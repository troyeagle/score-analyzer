import type { 
  LayoutConfig, 
  StaveLayout, 
  MeasureLayout, 
  NoteLayout,
  Part,
  Measure,
  Note,
  Voice
} from '../types'
import { DEFAULT_LAYOUT_CONFIG } from '../types'

export class LayoutEngine {
  private config: LayoutConfig

  constructor(config?: Partial<LayoutConfig>) {
    this.config = { ...DEFAULT_LAYOUT_CONFIG, ...config }
  }

  /**
   * 计算乐谱布局（接收 Part[] 结构）
   */
  layout(parts: Part[]): StaveLayout[] {
    const staves: StaveLayout[] = []
    let currentY = this.config.marginTop

    for (const part of parts) {
      const partStaves = this.layoutPart(part, currentY)
      staves.push(...partStaves)
      
      // 计算该声部的总高度
      const partHeight = partStaves.reduce((sum, s) => sum + s.height, 0)
      currentY += partHeight + this.config.systemSpacing
    }

    return staves
  }

  /**
   * 为单个声部计算布局
   */
  private layoutPart(part: Part, startY: number): StaveLayout[] {
    const staves: StaveLayout[] = []
    const availableWidth = this.config.pageWidth - this.config.marginLeft - this.config.marginRight
    const measuresPerLine = 4
    const measureWidth = availableWidth / measuresPerLine
    
    // 将小节按行分组
    const lines = this.groupMeasuresIntoLines(part.measures, measuresPerLine)
    
    let currentY = startY

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const lineMeasures = lines[lineIndex]
      const staveHeight = part.staves > 1 
        ? this.config.staffSpacing + 100  // 大谱表
        : 100                              // 单谱表

      // 计算该行每个小节的布局
      const measureLayouts: MeasureLayout[] = []
      let currentX = this.config.marginLeft

      for (let i = 0; i < lineMeasures.length; i++) {
        const measure = lineMeasures[i]
        const notes = this.extractNotesFromMeasure(measure)
        
        const measureLayout: MeasureLayout = {
          id: measure.id,
          x: currentX,
          y: currentY,
          width: measureWidth,
          height: staveHeight,
          number: measure.number,
          notes: this.layoutNotes(notes, currentX, currentY, measureWidth, staveHeight)
        }
        
        measureLayouts.push(measureLayout)
        currentX += measureWidth
      }

      // 创建五线谱布局
      const stave: StaveLayout = {
        id: `${part.id}_line_${lineIndex}`,
        partId: part.id,
        partName: part.name,
        staves: part.staves,
        x: this.config.marginLeft,
        y: currentY,
        width: availableWidth,
        height: staveHeight,
        measures: measureLayouts,
        isGrandStaff: part.staves > 1
      }

      staves.push(stave)
      currentY += staveHeight + this.config.systemSpacing
    }

    return staves
  }

  /**
   * 将小节按行分组
   */
  private groupMeasuresIntoLines(measures: Measure[], measuresPerLine: number): Measure[][] {
    const lines: Measure[][] = []
    
    for (let i = 0; i < measures.length; i += measuresPerLine) {
      lines.push(measures.slice(i, i + measuresPerLine))
    }
    
    return lines
  }

  /**
   * 从 Measure 的 Voice Map 中提取所有音符
   */
  private extractNotesFromMeasure(measure: Measure): Note[] {
    const notes: Note[] = []
    
    measure.voices.forEach((voice: Voice) => {
      notes.push(...voice.notes)
    })
    
    return notes
  }

  /**
   * 计算音符布局
   */
  private layoutNotes(
    notes: Note[], 
    measureX: number, 
    measureY: number, 
    measureWidth: number, 
    measureHeight: number
  ): NoteLayout[] {
    const noteLayouts: NoteLayout[] = []
    
    if (notes.length === 0) return noteLayouts
    
    const noteSpacing = measureWidth / (notes.length + 1)
    
    notes.forEach((note, index) => {
      const noteX = measureX + noteSpacing * (index + 1)
      const noteY = measureY + this.getNoteYPosition(note, measureHeight)
      const noteWidth = this.getNoteWidth(note)
      const noteHeight = 15

      noteLayouts.push({
        id: note.id,
        x: noteX - noteWidth / 2,
        y: noteY - noteHeight / 2,
        width: noteWidth,
        height: noteHeight,
        staff: note.staff,
        voice: note.voice
      })
    })
    
    return noteLayouts
  }

  /**
   * 根据音高计算 Y 轴位置
   */
  private getNoteYPosition(note: Note, staveHeight: number): number {
    if (note.isRest) {
      return staveHeight / 2
    }

    const notePositions: Record<string, number> = {
      'C': 0, 'D': 8, 'E': 16, 'F': 24, 'G': 32, 'A': 40, 'B': 48
    }
    
    const pitchMatch = note.pitch.match(/^([A-G])(b{1,2}|#{1,2})?(\d)$/)
    if (!pitchMatch) {
      return staveHeight / 2
    }
    
    const step = pitchMatch[1]
    const octave = parseInt(pitchMatch[3])
    
    const basePosition = notePositions[step] || 0
    const octaveOffset = (4 - octave) * 56 // 高八度向上
    
    // 从五线谱中心计算偏移
    const centerY = staveHeight / 2
    return centerY - basePosition - octaveOffset + 28
  }

  /**
   * 根据音符类型获取宽度
   */
  private getNoteWidth(note: Note): number {
    const baseWidth = 20
    const durationMultipliers: Record<string, number> = {
      'whole': 4,
      'half': 2,
      'quarter': 1,
      'eighth': 0.5,
      '16th': 0.25,
      '32nd': 0.125
    }
    
    const multiplier = durationMultipliers[note.type] || 1
    return baseWidth * multiplier
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<LayoutConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 获取当前配置
   */
  getConfig(): LayoutConfig {
    return { ...this.config }
  }
}

// 导出单例实例
export const layoutEngine = new LayoutEngine()
