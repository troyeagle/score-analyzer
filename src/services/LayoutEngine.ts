import type { 
  LayoutConfig, 
  StaveLayout, 
  MeasureLayout, 
  NoteLayout,
  MusicXMLParseResult,
  Measure,
  Note
} from '../types'

export class LayoutEngine {
  private config: LayoutConfig
  private staves: StaveLayout[] = []
  private currentX: number = 0
  private currentY: number = 0
  private currentStaveWidth: number = 0

  constructor(config?: Partial<LayoutConfig>) {
    this.config = {
      pageWidth: 800,
      pageHeight: 1100,
      marginTop: 50,
      marginBottom: 50,
      marginLeft: 40,
      marginRight: 40,
      staveSpacing: 80,
      systemSpacing: 100,
      measurePadding: 10,
      ...config
    }
  }

  /**
   * 计算乐谱布局
   */
  layout(score: MusicXMLParseResult): StaveLayout[] {
    this.staves = []
    this.currentX = this.config.marginLeft
    this.currentY = this.config.marginTop
    
    const availableWidth = this.config.pageWidth - this.config.marginLeft - this.config.marginRight
    const availableHeight = this.config.pageHeight - this.config.marginTop - this.config.marginBottom
    
    // 按谱表分组小节
    const partMeasures = this.groupMeasuresByPart(score)
    
    // 计算每个小节的宽度
    const measureWidths = this.calculateMeasureWidths(score.measures, score.notes, availableWidth)
    
    // 创建初始布局
    let currentSystem: MeasureLayout[] = []
    let currentSystemWidth = 0
    let maxSystemHeight = 0
    
    score.measures.forEach((measure, index) => {
      const measureWidth = measureWidths[index]
      const measureHeight = this.calculateMeasureHeight(measure, score.notes)
      
      // 检查是否需要换行
      if (currentSystemWidth + measureWidth > availableWidth && currentSystem.length > 0) {
        // 添加当前系统到五线谱
        this.addSystemToStave(currentSystem, maxSystemHeight)
        
        // 开始新系统
        currentSystem = []
        currentSystemWidth = 0
        maxSystemHeight = 0
      }
      
      // 创建小节布局
      const measureLayout: MeasureLayout = {
        id: measure.id,
        x: this.currentX + currentSystemWidth,
        y: this.currentY,
        width: measureWidth,
        height: measureHeight,
        notes: this.layoutNotesForMeasure(measure, score.notes, 
          this.currentX + currentSystemWidth, this.currentY, measureWidth, measureHeight)
      }
      
      currentSystem.push(measureLayout)
      currentSystemWidth += measureWidth + this.config.measurePadding
      maxSystemHeight = Math.max(maxSystemHeight, measureHeight)
    })
    
    // 添加最后一个系统
    if (currentSystem.length > 0) {
      this.addSystemToStave(currentSystem, maxSystemHeight)
    }
    
    return this.staves
  }

  /**
   * 按谱表分组小节
   */
  private groupMeasuresByPart(score: MusicXMLParseResult): Map<string, Measure[]> {
    const partMeasures = new Map<string, Measure[]>()
    
    score.parts.forEach(part => {
      const measures = score.measures.filter(m => 
        part.measures.includes(m.id)
      )
      partMeasures.set(part.id, measures)
    })
    
    return partMeasures
  }

  /**
   * 计算每个小节的宽度
   */
  private calculateMeasureWidths(measures: Measure[], notes: Note[], availableWidth: number): number[] {
    const widths: number[] = []
    const totalMeasures = measures.length
    
    // 基础宽度计算：根据音符数量和类型
    measures.forEach(measure => {
      const measureNotes = notes.filter(n => measure.notes.includes(n.id))
      let width = this.config.measurePadding * 2 // 左右内边距
      
      // 根据音符数量计算宽度
      measureNotes.forEach(note => {
        width += this.getNoteWidth(note)
      })
      
      // 确保最小宽度
      width = Math.max(width, 80)
      
      widths.push(width)
    })
    
    // 调整宽度以适应可用空间
    const totalWidth = widths.reduce((sum, w) => sum + w, 0)
    const scaleFactor = availableWidth / totalWidth
    
    if (scaleFactor < 1) {
      // 需要缩小
      return widths.map(w => w * scaleFactor)
    } else if (scaleFactor > 1.5) {
      // 有大量空间，可以适当放大但不要过度
      return widths.map(w => w * Math.min(scaleFactor, 1.5))
    }
    
    return widths
  }

  /**
   * 获取音符宽度
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
   * 计算小节高度
   */
  private calculateMeasureHeight(measure: Measure, notes: Note[]): number {
    const measureNotes = notes.filter(n => measure.notes.includes(n.id))
    
    // 基础高度（五线谱高度）
    let height = 80
    
    // 如果有音符超出五线谱范围，增加高度
    measureNotes.forEach(note => {
      const noteY = this.getNoteYPosition(note)
      if (noteY < 0 || noteY > height) {
        height = Math.max(height, Math.abs(noteY) + 20)
      }
    })
    
    return height
  }

  /**
   * 获取音符Y轴位置
   */
  private getNoteYPosition(note: Note): number {
    // 根据音高计算Y轴位置
    const notePositions: Record<string, number> = {
      'C': 0, 'D': 10, 'E': 20, 'F': 30, 'G': 40, 'A': 50, 'B': 60
    }
    
    const pitchMatch = note.pitch.match(/^([A-G])(b|#)?(\d)$/)
    if (!pitchMatch) {
      return 40 // 默认中间位置
    }
    
    const step = pitchMatch[1]
    const octave = parseInt(pitchMatch[3])
    
    const basePosition = notePositions[step] || 0
    const octaveOffset = (octave - 4) * 70 // 每个八度70像素
    
    return 40 + basePosition + octaveOffset // 40是五线谱中心偏移
  }

  /**
   * 为小节布局音符
   */
  private layoutNotesForMeasure(
    measure: Measure, 
    notes: Note[], 
    measureX: number, 
    measureY: number, 
    measureWidth: number, 
    measureHeight: number
  ): NoteLayout[] {
    const measureNotes = notes.filter(n => measure.notes.includes(n.id))
    const noteLayouts: NoteLayout[] = []
    
    const noteSpacing = measureWidth / (measureNotes.length + 1)
    
    measureNotes.forEach((note, index) => {
      const noteX = measureX + noteSpacing * (index + 1)
      const noteY = measureY + this.getNoteYPosition(note)
      const noteWidth = this.getNoteWidth(note)
      const noteHeight = 15 // 音符高度
      
      noteLayouts.push({
        id: note.id,
        x: noteX - noteWidth / 2,
        y: noteY - noteHeight / 2,
        width: noteWidth,
        height: noteHeight
      })
    })
    
    return noteLayouts
  }

  /**
   * 添加系统到五线谱
   */
  private addSystemToStave(measures: MeasureLayout[], systemHeight: number) {
    const staveId = `stave_${this.staves.length + 1}`
    
    // 计算系统边界
    const minX = Math.min(...measures.map(m => m.x))
    const maxX = Math.max(...measures.map(m => m.x + m.width))
    const width = maxX - minX
    
    const stave: StaveLayout = {
      id: staveId,
      x: minX,
      y: this.currentY,
      width: width,
      height: systemHeight,
      measures: measures
    }
    
    this.staves.push(stave)
    
    // 更新位置到下一个系统
    this.currentY += systemHeight + this.config.systemSpacing
    this.currentX = this.config.marginLeft
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

  /**
   * 调整五线谱间距
   */
  adjustStaveSpacing(staveId: string, spacing: number): void {
    const staveIndex = this.staves.findIndex(s => s.id === staveId)
    if (staveIndex === -1) return
    
    const stave = this.staves[staveIndex]
    const spacingDiff = spacing - this.config.staveSpacing
    
    // 更新当前五线谱之后的所有五线谱位置
    for (let i = staveIndex + 1; i < this.staves.length; i++) {
      this.staves[i].y += spacingDiff
    }
    
    // 更新配置
    this.config.staveSpacing = spacing
  }

  /**
   * 拆分小节
   */
  splitMeasure(measureId: string, position: number): void {
    // 查找包含该小节的系统
    for (const stave of this.staves) {
      const measureIndex = stave.measures.findIndex(m => m.id === measureId)
      if (measureIndex !== -1) {
        const measure = stave.measures[measureIndex]
        
        // 检查拆分位置是否有效
        if (position <= 0 || position >= measure.width) {
          throw new Error('无效的拆分位置')
        }
        
        // 创建两个新小节
        const leftMeasure: MeasureLayout = {
          id: `${measure.id}_left`,
          x: measure.x,
          y: measure.y,
          width: position,
          height: measure.height,
          notes: measure.notes.filter(n => n.x < measure.x + position)
        }
        
        const rightMeasure: MeasureLayout = {
          id: `${measure.id}_right`,
          x: measure.x + position,
          y: measure.y,
          width: measure.width - position,
          height: measure.height,
          notes: measure.notes.filter(n => n.x >= measure.x + position)
        }
        
        // 替换原小节
        stave.measures.splice(measureIndex, 1, leftMeasure, rightMeasure)
        
        // 重新计算系统宽度
        this.recalculateStaveWidth(stave)
        
        break
      }
    }
  }

  /**
   * 合并小节
   */
  mergeMeasures(measureId1: string, measureId2: string): void {
    // 查找包含这两个小节的系统
    for (const stave of this.staves) {
      const index1 = stave.measures.findIndex(m => m.id === measureId1)
      const index2 = stave.measures.findIndex(m => m.id === measureId2)
      
      if (index1 !== -1 && index2 !== -1 && Math.abs(index1 - index2) === 1) {
        const measure1 = stave.measures[Math.min(index1, index2)]
        const measure2 = stave.measures[Math.max(index1, index2)]
        
        // 创建合并后的小节
        const mergedMeasure: MeasureLayout = {
          id: `${measure1.id}_${measure2.id}`,
          x: measure1.x,
          y: measure1.y,
          width: measure1.width + measure2.width,
          height: Math.max(measure1.height, measure2.height),
          notes: [...measure1.notes, ...measure2.notes]
        }
        
        // 替换原小节
        const startIndex = Math.min(index1, index2)
        stave.measures.splice(startIndex, 2, mergedMeasure)
        
        // 重新计算系统宽度
        this.recalculateStaveWidth(stave)
        
        break
      }
    }
  }

  /**
   * 重新计算系统宽度
   */
  private recalculateStaveWidth(stave: StaveLayout): void {
    if (stave.measures.length === 0) {
      stave.width = 0
      return
    }
    
    const minX = Math.min(...stave.measures.map(m => m.x))
    const maxX = Math.max(...stave.measures.map(m => m.x + m.width))
    stave.width = maxX - minX
  }

  /**
   * 重新分页
   */
  repaginate(): void {
    // 重新计算所有五线谱的位置
    let currentY = this.config.marginTop
    
    this.staves.forEach(stave => {
      stave.y = currentY
      currentY += stave.height + this.config.systemSpacing
    })
  }

  /**
   * 获取总页数
   */
  getTotalPages(): number {
    const pageHeight = this.config.pageHeight - this.config.marginTop - this.config.marginBottom
    const totalHeight = this.currentY - this.config.marginTop
    
    return Math.ceil(totalHeight / pageHeight)
  }

  /**
   * 获取指定页的五线谱
   */
  getStavesForPage(pageNumber: number): StaveLayout[] {
    const pageHeight = this.config.pageHeight - this.config.marginTop - this.config.marginBottom
    const startY = this.config.marginTop + (pageNumber - 1) * pageHeight
    const endY = startY + pageHeight
    
    return this.staves.filter(stave => 
      stave.y >= startY && stave.y < endY
    )
  }
}

// 导出单例实例
export const layoutEngine = new LayoutEngine()