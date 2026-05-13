import { 
  Renderer, 
  Stave, 
  StaveNote, 
  Voice, 
  Formatter,
  Accidental,
  Beam,
  Dot,
  TextNote,
  GraceNote
} from 'vexflow'
import type { 
  Part, 
  Measure, 
  Voice as MusicVoice,
  Note, 
  LayoutConfig,
  Clef
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
    
    container.innerHTML = ''
    
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    container.appendChild(canvas)
    
    this.renderer = new Renderer(canvas, Renderer.Backends.CANVAS)
    this.renderer.resize(width, height)
    this.context = this.renderer.getContext()
  }

  /**
   * 渲染多个声部
   */
  renderParts(parts: Part[], config: LayoutConfig): void {
    if (!this.context) {
      throw new Error('渲染器未初始化')
    }
    
    this.context.clear()
    
    let currentY = config.marginTop
    const staffHeight = 80 // 五线谱高度
    const systemSpacing = config.systemSpacing || 100
    const staffSpacing = config.staffSpacing || 60 // 钢琴左右手间距
    
    // 获取最大小节数
    const maxMeasures = Math.max(...parts.map(p => p.measures.length))
    const measuresPerSystem = 4 // 每行显示的小节数
    
    // 按系统（行）渲染
    for (let systemIndex = 0; systemIndex * measuresPerSystem < maxMeasures; systemIndex++) {
      const startMeasure = systemIndex * measuresPerSystem
      const endMeasure = Math.min(startMeasure + measuresPerSystem, maxMeasures)
      
      // 渲染每个声部
      parts.forEach((part, partIndex) => {
        if (part.staves > 1) {
          // 大谱表（如钢琴）
          currentY = this.renderGrandStaffSystem(
            part, 
            startMeasure, 
            endMeasure, 
            currentY, 
            config.pageWidth - config.marginLeft - config.marginRight,
            config.marginLeft,
            staffSpacing
          )
        } else {
          // 单谱表
          currentY = this.renderSingleStaffSystem(
            part,
            startMeasure,
            endMeasure,
            currentY,
            config.pageWidth - config.marginLeft - config.marginRight,
            config.marginLeft
          )
        }
        
        // 声部之间添加间距
        if (partIndex < parts.length - 1) {
          currentY += 30
        }
      })
      
      // 系统之间添加间距
      currentY += systemSpacing
    }
  }

  /**
   * 渲染单谱表系统
   */
  private renderSingleStaffSystem(
    part: Part,
    startMeasure: number,
    endMeasure: number,
    startY: number,
    totalWidth: number,
    marginLeft: number
  ): number {
    if (!this.context) return startY
    
    // 创建五线谱
    const stave = new Stave(marginLeft, startY, totalWidth)
    
    // 添加谱号和调号
    const firstMeasure = part.measures[0]
    if (firstMeasure && firstMeasure.attributes) {
      // 获取谱号
      const clef = firstMeasure.attributes.clefs?.[0]
      const clefName = this.getClefName(clef)
      stave.addClef(clefName)
      
      // 添加调号
      if (firstMeasure.attributes.key) {
        stave.addKeySignature(firstMeasure.attributes.key)
      }
      
      // 添加拍号
      if (firstMeasure.attributes.time) {
        stave.addTimeSignature(firstMeasure.attributes.time)
      }
    } else {
      // 默认谱号
      stave.addClef('treble')
    }
    
    stave.setContext(this.context)
    stave.draw()
    
    // 渲染小节内的音符
    const allVoices: Voice[] = []
    
    for (let i = startMeasure; i < endMeasure; i++) {
      const measure = part.measures[i]
      if (!measure || !measure.voices) continue
      
      measure.voices.forEach((voice) => {
        if (!voice.notes || voice.notes.length === 0) return
        
        const vexNotes = this.createVexFlowNotes(voice.notes)
        if (vexNotes.length > 0) {
          const timeSignature = measure.attributes?.time || '4/4'
          const vexVoice = new Voice({
            num_beats: this.getBeatsFromTimeSignature(timeSignature),
            beat_value: this.getBeatValueFromTimeSignature(timeSignature)
          })
          vexVoice.setStrict(false)
          vexVoice.addTickables(vexNotes)
          allVoices.push(vexVoice)
        }
      })
    }
    
    if (allVoices.length > 0) {
      try {
        const formatter = new Formatter()
        formatter.joinVoices(allVoices)
        formatter.format(allVoices, totalWidth - 50)
        
        allVoices.forEach(voice => {
          voice.draw(this.context, stave)
        })
      } catch (error) {
        console.warn('格式化或渲染音符失败:', error)
      }
    }
    
    return startY + 100
  }

  /**
   * 渲染大谱表系统（如钢琴）
   */
  private renderGrandStaffSystem(
    part: Part,
    startMeasure: number,
    endMeasure: number,
    startY: number,
    totalWidth: number,
    marginLeft: number,
    staffSpacing: number
  ): number {
    if (!this.context) return startY
    
    // 获取谱号信息
    const firstMeasure = part.measures[0]
    const clefs = firstMeasure?.attributes?.clefs || []
    const trebleClef = clefs.find(c => c.sign === 'G') || { sign: 'G', line: 2, number: 1 }
    const bassClef = clefs.find(c => c.sign === 'F') || { sign: 'F', line: 4, number: 2 }
    
    // 高音谱表
    const trebleY = startY
    const trebleStave = new Stave(marginLeft, trebleY, totalWidth)
    trebleStave.addClef(this.getClefName(trebleClef))
    if (firstMeasure?.attributes) {
      if (firstMeasure.attributes.key) {
        trebleStave.addKeySignature(firstMeasure.attributes.key)
      }
      if (firstMeasure.attributes.time) {
        trebleStave.addTimeSignature(firstMeasure.attributes.time)
      }
    }
    trebleStave.setContext(this.context)
    trebleStave.draw()
    
    // 低音谱表
    const bassY = trebleY + staffSpacing
    const bassStave = new Stave(marginLeft, bassY, totalWidth)
    bassStave.addClef(this.getClefName(bassClef))
    if (firstMeasure?.attributes?.key) {
      bassStave.addKeySignature(firstMeasure.attributes.key)
    }
    bassStave.setContext(this.context)
    bassStave.draw()
    
    // 绘制花括号连接
    this.drawBrace(marginLeft, trebleY, bassY + 40 - trebleY)
    
    // 渲染高音谱表音符
    const trebleVoices: Voice[] = []
    const bassVoices: Voice[] = []
    
    for (let i = startMeasure; i < endMeasure; i++) {
      const measure = part.measures[i]
      if (!measure || !measure.voices) continue
      
      measure.voices.forEach((voice) => {
        if (!voice.notes || voice.notes.length === 0) return
        
        const vexNotes = this.createVexFlowNotes(voice.notes)
        if (vexNotes.length > 0) {
          const timeSignature = measure.attributes?.time || '4/4'
          const vexVoice = new Voice({
            num_beats: this.getBeatsFromTimeSignature(timeSignature),
            beat_value: this.getBeatValueFromTimeSignature(timeSignature)
          })
          vexVoice.setStrict(false)
          vexVoice.addTickables(vexNotes)
          
          // 根据 staff 分配到高音或低音谱表
          if (voice.staff === 2) {
            bassVoices.push(vexVoice)
          } else {
            trebleVoices.push(vexVoice)
          }
        }
      })
    }
    
    // 格式化并渲染高音谱表
    if (trebleVoices.length > 0) {
      try {
        const formatter = new Formatter()
        formatter.joinVoices(trebleVoices)
        formatter.format(trebleVoices, totalWidth - 50)
        trebleVoices.forEach(voice => {
          voice.draw(this.context, trebleStave)
        })
      } catch (error) {
        console.warn('渲染高音谱表失败:', error)
      }
    }
    
    // 格式化并渲染低音谱表
    if (bassVoices.length > 0) {
      try {
        const formatter = new Formatter()
        formatter.joinVoices(bassVoices)
        formatter.format(bassVoices, totalWidth - 50)
        bassVoices.forEach(voice => {
          voice.draw(this.context, bassStave)
        })
      } catch (error) {
        console.warn('渲染低音谱表失败:', error)
      }
    }
    
    return bassY + 100
  }

  /**
   * 绘制花括号
   */
  private drawBrace(x: number, y: number, height: number): void {
    if (!this.context) return
    
    const ctx = this.context
    ctx.save()
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    // 简化的花括号绘制
    const braceWidth = 15
    const curveWidth = 8
    
    ctx.moveTo(x - braceWidth, y)
    ctx.quadraticCurveTo(x - braceWidth + curveWidth, y + height * 0.25, x - braceWidth, y + height * 0.5)
    ctx.quadraticCurveTo(x - braceWidth - curveWidth, y + height * 0.75, x - braceWidth, y + height)
    
    ctx.stroke()
    ctx.restore()
  }

  /**
   * 创建 VexFlow 音符
   */
  private createVexFlowNotes(notes: Note[]): StaveNote[] {
    const vexNotes: StaveNote[] = []
    
    notes.forEach(note => {
      if (note.isRest) {
        // 休止符暂时跳过
        return
      }
      
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
   * 创建单个 VexFlow 音符
   */
  private createSingleVexFlowNote(note: Note): StaveNote | null {
    if (!note || !note.pitch) return null
    
    const pitchMatch = note.pitch.match(/^([A-G])(b|bb|#|x)?(\d)$/)
    if (!pitchMatch) {
      // 尝试解析简化的音高格式
      const simpleMatch = note.pitch.match(/^([A-G])(\d)$/)
      if (!simpleMatch) {
        console.warn(`无法解析音高: ${note.pitch}`)
        return null
      }
      
      const step = simpleMatch[1].toLowerCase()
      const octave = simpleMatch[2]
      const duration = this.mapNoteDuration(note.type)
      
      if (!duration) {
        console.warn(`无法映射时值: ${note.type}`)
        return null
      }
      
      try {
        const vexNote = new StaveNote({
          keys: [`${step}/${octave}`],
          duration,
          stem_direction: note.stem === 'down' ? -1 : 1
        })
        
        if (note.dots > 0) {
          for (let i = 0; i < note.dots; i++) {
            vexNote.addModifier(new Dot())
          }
        }
        
        return vexNote
      } catch (error) {
        console.warn(`创建音符失败: ${note.pitch}`, error)
        return null
      }
    }
    
    const step = pitchMatch[1].toLowerCase()
    const accidental = pitchMatch[2] || ''
    const octave = pitchMatch[3]
    
    const duration = this.mapNoteDuration(note.type)
    if (!duration) {
      console.warn(`无法映射时值: ${note.type}`)
      return null
    }
    
    // 构建 key 字符串
    let key = `${step}${accidental}/${octave}`
    
    try {
      const vexNote = new StaveNote({
        keys: [key],
        duration,
        stem_direction: note.stem === 'down' ? -1 : 1
      })
      
      // 添加变音记号
      if (accidental) {
        const accidentalMap: Record<string, string> = {
          'b': 'b',
          'bb': 'bb',
          '#': '#',
          'x': '##'
        }
        const vexAccidental = accidentalMap[accidental]
        if (vexAccidental) {
          vexNote.addModifier(new Accidental(vexAccidental))
        }
      }
      
      // 添加附点
      if (note.dots > 0) {
        for (let i = 0; i < note.dots; i++) {
          vexNote.addModifier(new Dot())
        }
      }
      
      return vexNote
    } catch (error) {
      console.warn(`创建音符失败: ${note.pitch}`, error)
      return null
    }
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
   * 获取谱号名称
   */
  private getClefName(clef: Clef | undefined): string {
    if (!clef || !clef.sign) {
      return 'treble' // 默认高音谱号
    }
    
    const clefMap: Record<string, string> = {
      'G': 'treble',
      'F': 'bass',
      'C': 'alto',
      'percussion': 'percussion'
    }
    
    return clefMap[clef.sign] || 'treble'
  }

  /**
   * 从拍号获取拍数
   */
  private getBeatsFromTimeSignature(timeSignature: string): number {
    const parts = timeSignature.split('/')
    return parseInt(parts[0]) || 4
  }

  /**
   * 从拍号获取拍值
   */
  private getBeatValueFromTimeSignature(timeSignature: string): number {
    const parts = timeSignature.split('/')
    return parseInt(parts[1]) || 4
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

export const vexFlowRenderer = new VexFlowRenderer()