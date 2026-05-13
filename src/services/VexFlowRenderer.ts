import { 
  Renderer, 
  Stave, 
  StaveNote, 
  Voice, 
  Formatter,
  Accidental,
  Beam,
  Tuplet,
  KeySignature,
  TimeSignature,
  Clef,
  Dot
} from 'vexflow'
import type { 
  MusicXMLParseResult, 
  Measure, 
  Note, 
  StaveLayout,
  MeasureLayout,
  NoteLayout
} from '../types'

export class VexFlowRenderer {
  private renderer: Renderer | null = null
  private context: any = null
  private container: HTMLElement | null = null
  private width: number = 800
  private height: number = 1100

  /**
   * 初始化渲染器
   */
  initialize(container: HTMLElement, width: number = 800, height: number = 1100): void {
    this.container = container
    this.width = width
    this.height = height
    
    // 清空容器
    container.innerHTML = ''
    
    // 创建Canvas元素
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    container.appendChild(canvas)
    
    // 初始化VexFlow渲染器
    this.renderer = new Renderer(canvas, Renderer.Backends.CANVAS)
    this.renderer.resize(width, height)
    this.context = this.renderer.getContext()
  }

  /**
   * 渲染乐谱
   */
  render(score: MusicXMLParseResult, staveLayouts: StaveLayout[]): void {
    if (!this.context) {
      throw new Error('渲染器未初始化')
    }
    
    // 清空画布
    this.context.clear()
    
    // 渲染每个五线谱系统
    staveLayouts.forEach(staveLayout => {
      this.renderStaveSystem(score, staveLayout)
    })
  }

  /**
   * 渲染五线谱系统
   */
  private renderStaveSystem(score: MusicXMLParseResult, staveLayout: StaveLayout): void {
    if (!this.context) return
    
    // 创建五线谱
    const stave = new Stave(
      staveLayout.x,
      staveLayout.y,
      staveLayout.width
    )
    
    // 添加谱号
    stave.addClef('treble')
    
    // 添加调号
    if (score.metadata.keySignature) {
      stave.addKeySignature(score.metadata.keySignature)
    }
    
    // 添加拍号
    if (score.metadata.timeSignature) {
      stave.addTimeSignature(score.metadata.timeSignature)
    }
    
    // 设置五线谱样式
    stave.setContext(this.context)
    stave.draw()
    
    // 渲染每个小节
    staveLayout.measures.forEach((measureLayout, index) => {
      this.renderMeasure(score, measureLayout, staveLayout.y, staveLayout.height)
    })
  }

  /**
   * 渲染小节
   */
  private renderMeasure(score: MusicXMLParseResult, measureLayout: MeasureLayout, staveY: number, staveHeight: number): void {
    if (!this.context) return
    
    // 查找对应的小节数据
    const measure = score.measures.find(m => m.id === measureLayout.id)
    if (!measure) return
    
    // 获取该小节的音符
    const measureNotes = score.notes.filter(n => measure.notes.includes(n.id))
    
    if (measureNotes.length === 0) return
    
    // 创建VexFlow音符
    const vexNotes = this.createVexFlowNotes(measureNotes, measure)
    
    if (vexNotes.length === 0) return
    
    // 创建声部
    const voice = new Voice({
      num_beats: this.getBeatsFromTimeSignature(measure.attributes.time),
      beat_value: this.getBeatValueFromTimeSignature(measure.attributes.time)
    })
    
    voice.setStrict(false) // 允许不完整的拍子
    voice.addTickables(vexNotes)
    
    // 格式化音符
    const formatter = new Formatter()
    formatter.joinVoices([voice])
    formatter.format([voice], measureLayout.width - 20)
    
    // 渲染音符
    voice.draw(this.context, new Stave(
      measureLayout.x,
      staveY,
      measureLayout.width
    ))
    
    // 创建符杠
    const beams = Beam.generateBeams(vexNotes)
    beams.forEach(beam => {
      beam.setContext(this.context).draw()
    })
  }

  /**
   * 创建VexFlow音符
   */
  private createVexFlowNotes(measureNotes: Note[], measure: Measure): StaveNote[] {
    const vexNotes: StaveNote[] = []
    
    measureNotes.forEach(note => {
      try {
        const vexNote = this.createSingleVexFlowNote(note)
        if (vexNote) {
          vexNotes.push(vexNote)
        }
      } catch (error) {
        console.warn(`无法渲染音符 ${note.id}:`, error)
      }
    })
    
    return vexNotes
  }

  /**
   * 创建单个VexFlow音符
   */
  private createSingleVexFlowNote(note: Note): StaveNote | null {
    // 解析音高
    const pitchMatch = note.pitch.match(/^([A-G])(b|#)?(\d)$/)
    if (!pitchMatch) {
      return null
    }
    
    const step = pitchMatch[1].toLowerCase()
    const accidental = pitchMatch[2] || ''
    const octave = pitchMatch[3]
    
    // 映射音符时值
    const duration = this.mapNoteDuration(note.type)
    if (!duration) {
      return null
    }
    
    // 创建音符
    const vexNote = new StaveNote({
      keys: [`${step}${accidental}/${octave}`],
      duration: duration
    })
    
    // 添加变音记号
    if (accidental) {
      vexNote.addModifier(new Accidental(accidental))
    }
    
    // 添加附点
    if (note.dots && note.dots > 0) {
      for (let i = 0; i < note.dots; i++) {
        vexNote.addModifier(new Dot())
      }
    }
    
    return vexNote
  }

  /**
   * 映射音符时值
   */
  private mapNoteDuration(type: string): string | null {
    const durationMap: Record<string, string> = {
      'whole': 'w',
      'half': 'h',
      'quarter': 'q',
      'eighth': '8',
      '16th': '16',
      '32nd': '32',
      '64th': '64'
    }
    
    return durationMap[type] || null
  }

  /**
   * 从拍号获取拍数
   */
  private getBeatsFromTimeSignature(timeSignature: string): number {
    const parts = timeSignature.split('/')
    if (parts.length === 2) {
      return parseInt(parts[0]) || 4
    }
    return 4
  }

  /**
   * 从拍号获取拍值
   */
  private getBeatValueFromTimeSignature(timeSignature: string): number {
    const parts = timeSignature.split('/')
    if (parts.length === 2) {
      return parseInt(parts[1]) || 4
    }
    return 4
  }

  /**
   * 渲染标注
   */
  renderAnnotations(annotations: any[], staveLayouts: StaveLayout[]): void {
    if (!this.context) return
    
    annotations.forEach(annotation => {
      this.renderAnnotation(annotation, staveLayouts)
    })
  }

  /**
   * 渲染单个标注
   */
  private renderAnnotation(annotation: any, staveLayouts: StaveLayout[]): void {
    if (!this.context) return
    
    // 查找标注所在的小节
    const staveLayout = staveLayouts.find(sl => 
      sl.measures.some(m => m.id.includes(`M${annotation.startMeasure}`))
    )
    
    if (!staveLayout) return
    
    const measureLayout = staveLayout.measures.find(m => 
      m.id.includes(`M${annotation.startMeasure}`)
    )
    
    if (!measureLayout) return
    
    // 根据标注类型选择渲染方式
    switch (annotation.type) {
      case 'structural':
        this.renderStructuralAnnotation(annotation, measureLayout, staveLayout)
        break
      case 'motivic':
        this.renderMotivicAnnotation(annotation, measureLayout, staveLayout)
        break
      case 'harmonic':
        this.renderHarmonicAnnotation(annotation, measureLayout, staveLayout)
        break
      case 'annotation':
        this.renderTextAnnotation(annotation, measureLayout, staveLayout)
        break
    }
  }

  /**
   * 渲染结构性标注
   */
  private renderStructuralAnnotation(annotation: any, measureLayout: MeasureLayout, staveLayout: StaveLayout): void {
    if (!this.context) return
    
    // 绘制背景色块
    this.context.fillStyle = annotation.style.backgroundColor
    this.context.fillRect(
      measureLayout.x,
      staveLayout.y - 30,
      measureLayout.width,
      25
    )
    
    // 绘制边框
    this.context.strokeStyle = annotation.style.borderColor
    this.context.lineWidth = annotation.style.borderWidth
    this.context.strokeRect(
      measureLayout.x,
      staveLayout.y - 30,
      measureLayout.width,
      25
    )
    
    // 绘制文本
    this.context.fillStyle = annotation.style.color
    this.context.font = `${annotation.style.fontSize}px ${annotation.style.fontFamily}`
    this.context.textAlign = 'center'
    this.context.fillText(
      annotation.content,
      measureLayout.x + measureLayout.width / 2,
      staveLayout.y - 15
    )
  }

  /**
   * 渲染动机性标注
   */
  private renderMotivicAnnotation(annotation: any, measureLayout: MeasureLayout, staveLayout: StaveLayout): void {
    if (!this.context) return
    
    // 绘制连线
    this.context.strokeStyle = annotation.style.borderColor
    this.context.lineWidth = 2
    this.context.setLineDash([5, 3])
    
    this.context.beginPath()
    this.context.moveTo(measureLayout.x, staveLayout.y + staveLayout.height + 10)
    this.context.lineTo(measureLayout.x + measureLayout.width, staveLayout.y + staveLayout.height + 10)
    this.context.stroke()
    
    this.context.setLineDash([])
    
    // 绘制标签
    this.context.fillStyle = annotation.style.color
    this.context.font = `${annotation.style.fontSize}px ${annotation.style.fontFamily}`
    this.context.textAlign = 'center'
    this.context.fillText(
      annotation.content,
      measureLayout.x + measureLayout.width / 2,
      staveLayout.y + staveLayout.height + 25
    )
  }

  /**
   * 渲染和声标注
   */
  private renderHarmonicAnnotation(annotation: any, measureLayout: MeasureLayout, staveLayout: StaveLayout): void {
    if (!this.context) return
    
    // 绘制和弦符号
    this.context.fillStyle = annotation.style.color
    this.context.font = `bold ${annotation.style.fontSize}px ${annotation.style.fontFamily}`
    this.context.textAlign = 'center'
    
    // 绘制背景
    const textWidth = this.context.measureText(annotation.content).width
    this.context.fillStyle = annotation.style.backgroundColor
    this.context.fillRect(
      measureLayout.x + measureLayout.width / 2 - textWidth / 2 - 5,
      staveLayout.y + staveLayout.height + 5,
      textWidth + 10,
      20
    )
    
    // 绘制文本
    this.context.fillStyle = annotation.style.color
    this.context.fillText(
      annotation.content,
      measureLayout.x + measureLayout.width / 2,
      staveLayout.y + staveLayout.height + 20
    )
  }

  /**
   * 渲染文本标注
   */
  private renderTextAnnotation(annotation: any, measureLayout: MeasureLayout, staveLayout: StaveLayout): void {
    if (!this.context) return
    
    // 绘制文本
    this.context.fillStyle = annotation.style.color
    this.context.font = `${annotation.style.fontSize}px ${annotation.style.fontFamily}`
    this.context.textAlign = 'center'
    
    // 绘制背景
    const textWidth = this.context.measureText(annotation.content).width
    this.context.fillStyle = annotation.style.backgroundColor
    this.context.fillRect(
      measureLayout.x + measureLayout.width / 2 - textWidth / 2 - 3,
      staveLayout.y - 25,
      textWidth + 6,
      18
    )
    
    // 绘制文本
    this.context.fillStyle = annotation.style.color
    this.context.fillText(
      annotation.content,
      measureLayout.x + measureLayout.width / 2,
      staveLayout.y - 10
    )
  }

  /**
   * 缩放
   */
  scale(scaleX: number, scaleY: number): void {
    if (this.context) {
      this.context.scale(scaleX, scaleY)
    }
  }

  /**
   * 平移
   */
  translate(x: number, y: number): void {
    if (this.context) {
      this.context.translate(x, y)
    }
  }

  /**
   * 清空
   */
  clear(): void {
    if (this.context) {
      this.context.clear()
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.container) {
      this.container.innerHTML = ''
    }
    this.renderer = null
    this.context = null
    this.container = null
  }
}

// 导出单例实例
export const vexFlowRenderer = new VexFlowRenderer()