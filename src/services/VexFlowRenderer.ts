import { 
  Renderer, 
  Stave, 
  StaveNote, 
  Voice, 
  Formatter,
  Accidental,
  Beam,
  Dot
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
    
    console.log('[VexFlowRenderer] 初始化完成, canvas:', width, 'x', height)
  }

  /**
   * 渲染多个声部
   */
  renderParts(parts: Part[], config: LayoutConfig): void {
    if (!this.context) {
      throw new Error('渲染器未初始化')
    }
    
    console.log('[VexFlowRenderer] 开始渲染, 声部数:', parts.length)
    
    this.context.clear()
    
    const marginLeft = config.marginLeft || 40
    const marginTop = config.marginTop || 50
    const staveSpacing = config.staveSpacing || 80
    const staffSpacing = config.staffSpacing || 60
    
    // 每个小节的宽度
    const measuresPerLine = 4 // 每行显示4个小节
    const availableWidth = this.width - marginLeft - (config.marginRight || 40)
    const measureWidth = availableWidth / measuresPerLine
    
    let currentY = marginTop
    
    // 获取最大小节数
    const maxMeasures = Math.max(...parts.map(p => p.measures.length))
    console.log('[VexFlowRenderer] 最大小节数:', maxMeasures)
    
    // 按行渲染
    for (let lineStart = 0; lineStart < maxMeasures; lineStart += measuresPerLine) {
      const lineEnd = Math.min(lineStart + measuresPerLine, maxMeasures)
      console.log(`[VexFlowRenderer] 渲染行: 小节 ${lineStart + 1} - ${lineEnd}`)
      
      // 渲染每个声部的这一行
      for (let partIndex = 0; partIndex < parts.length; partIndex++) {
        const part = parts[partIndex]
        console.log(`[VexFlowRenderer] 渲染声部: ${part.name} (${part.id}), 谱表数: ${part.staves}`)
        
        if (part.staves > 1) {
          // 大谱表（如钢琴）
          currentY = this.renderGrandStaffLine(
            part,
            lineStart,
            lineEnd,
            currentY,
            measureWidth,
            marginLeft,
            staffSpacing
          )
        } else {
          // 单谱表
          currentY = this.renderSingleStaffLine(
            part,
            lineStart,
            lineEnd,
            currentY,
            measureWidth,
            marginLeft
          )
        }
        
        // 声部之间添加间距
        if (partIndex < parts.length - 1) {
          currentY += staveSpacing
        }
      }
      
      // 行之间添加间距
      currentY += staveSpacing * 2
    }
    
    // 调整 canvas 高度
    if (this.container) {
      const canvas = this.container.querySelector('canvas')
      if (canvas && currentY + 100 > this.height) {
        canvas.height = currentY + 100
        canvas.style.height = `${currentY + 100}px`
        this.renderer?.resize(this.width, currentY + 100)
        this.context = this.renderer?.getContext() || this.context
      }
    }
    
    console.log('[VexFlowRenderer] 渲染完成, 总高度:', currentY)
  }

  /**
   * 渲染单谱表的一行
   */
  private renderSingleStaffLine(
    part: Part,
    lineStart: number,
    lineEnd: number,
    startY: number,
    measureWidth: number,
    marginLeft: number
  ): number {
    if (!this.context) return startY
    
    const measuresInLine = lineEnd - lineStart
    const totalWidth = measureWidth * measuresInLine
    
    // 为每个小节创建五线谱和音符
    let currentX = marginLeft
    const staves: Stave[] = []
    const allVoices: { voice: Voice, staveIndex: number }[] = []
    
    for (let i = lineStart; i < lineEnd; i++) {
      const measure = part.measures[i]
      if (!measure) continue
      
      // 创建小节的五线谱
      const stave = new Stave(currentX, startY, measureWidth)
      
      // 只在第一个小节添加谱号、调号、拍号
      if (i === 0) {
        const clef = measure.attributes?.clefs?.[0]
        const clefName = this.getClefName(clef)
        stave.addClef(clefName)
        
        if (measure.attributes?.key) {
          stave.addKeySignature(measure.attributes.key)
        }
        if (measure.attributes?.time) {
          stave.addTimeSignature(measure.attributes.time)
        }
      }
      
      stave.setContext(this.context)
      stave.draw()
      staves.push(stave)
      
      // 收集该小节的音符
      if (measure.voices) {
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
            allVoices.push({ voice: vexVoice, staveIndex: staves.length - 1 })
          }
        })
      }
      
      currentX += measureWidth
    }
    
    // 格式化并渲染每个小节的音符到对应的五线谱
    allVoices.forEach(({ voice, staveIndex }) => {
      try {
        const formatter = new Formatter()
        formatter.joinVoices([voice])
        formatter.format([voice], measureWidth - 20)
        voice.draw(this.context, staves[staveIndex])
      } catch (error) {
        console.warn('渲染音符失败:', error)
      }
    })
    
    return startY + 100
  }

  /**
   * 渲染大谱表的一行
   */
  private renderGrandStaffLine(
    part: Part,
    lineStart: number,
    lineEnd: number,
    startY: number,
    measureWidth: number,
    marginLeft: number,
    staffSpacing: number
  ): number {
    if (!this.context) return startY
    
    const measuresInLine = lineEnd - lineStart
    const totalWidth = measureWidth * measuresInLine
    
    // 获取谱号信息
    const firstMeasure = part.measures[0]
    const clefs = firstMeasure?.attributes?.clefs || []
    const trebleClef = clefs.find(c => c.sign === 'G') || { sign: 'G', line: 2, number: 1 }
    const bassClef = clefs.find(c => c.sign === 'F') || { sign: 'F', line: 4, number: 2 }
    
    // 为每个小节创建高音和低音五线谱
    const trebleStaves: Stave[] = []
    const bassStaves: Stave[] = []
    const trebleVoices: { voice: Voice, staveIndex: number }[] = []
    const bassVoices: { voice: Voice, staveIndex: number }[] = []
    
    let currentX = marginLeft
    
    for (let i = lineStart; i < lineEnd; i++) {
      const measure = part.measures[i]
      if (!measure) continue
      
      // 高音谱表
      const trebleStave = new Stave(currentX, startY, measureWidth)
      if (i === 0) {
        trebleStave.addClef(this.getClefName(trebleClef))
        if (measure.attributes?.key) {
          trebleStave.addKeySignature(measure.attributes.key)
        }
        if (measure.attributes?.time) {
          trebleStave.addTimeSignature(measure.attributes.time)
        }
      }
      trebleStave.setContext(this.context)
      trebleStave.draw()
      trebleStaves.push(trebleStave)
      
      // 低音谱表
      const bassStave = new Stave(currentX, startY + staffSpacing, measureWidth)
      if (i === 0) {
        bassStave.addClef(this.getClefName(bassClef))
        if (measure.attributes?.key) {
          bassStave.addKeySignature(measure.attributes.key)
        }
      }
      bassStave.setContext(this.context)
      bassStave.draw()
      bassStaves.push(bassStave)
      
      // 收集音符
      if (measure.voices) {
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
            
            const staveIndex = trebleStaves.length - 1
            if (voice.staff === 2) {
              bassVoices.push({ voice: vexVoice, staveIndex })
            } else {
              trebleVoices.push({ voice: vexVoice, staveIndex })
            }
          }
        })
      }
      
      currentX += measureWidth
    }
    
    // 绘制花括号
    this.drawBrace(marginLeft, startY, staffSpacing + 40)
    
    // 渲染高音谱表音符
    trebleVoices.forEach(({ voice, staveIndex }) => {
      try {
        const formatter = new Formatter()
        formatter.joinVoices([voice])
        formatter.format([voice], measureWidth - 20)
        voice.draw(this.context, trebleStaves[staveIndex])
      } catch (error) {
        console.warn('渲染高音谱表音符失败:', error)
      }
    })
    
    // 渲染低音谱表音符
    bassVoices.forEach(({ voice, staveIndex }) => {
      try {
        const formatter = new Formatter()
        formatter.joinVoices([voice])
        formatter.format([voice], measureWidth - 20)
        voice.draw(this.context, bassStaves[staveIndex])
      } catch (error) {
        console.warn('渲染低音谱表音符失败:', error)
      }
    })
    
    return startY + staffSpacing + 100
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
    
    const braceWidth = 15
    const curveWidth = 8
    
    ctx.moveTo(x - braceWidth, y)
    ctx.quadraticCurveTo(x - braceWidth + curveWidth, y + height * 0.25, x - braceWidth, y + height * 0.5)
    ctx.quadraticCurveTo(x - braceWidth - curveWidth, y + height * 0.75, x - braceWidth, y + height)
    
    ctx.stroke()
    ctx.restore()
  }

  /**
   * 创建 VexFlow 音符（包括休止符）
   */
  private createVexFlowNotes(notes: Note[]): StaveNote[] {
    const vexNotes: StaveNote[] = []
    
    notes.forEach(note => {
      try {
        if (note.isRest) {
          const restNote = this.createRestNote(note)
          if (restNote) {
            vexNotes.push(restNote)
          }
        } else {
          const vexNote = this.createSingleVexFlowNote(note)
          if (vexNote) {
            vexNotes.push(vexNote)
          }
        }
      } catch (error) {
        console.warn(`无法渲染音符 ${note.id}:`, error)
      }
    })
    
    return vexNotes
  }

  /**
   * 创建休止符
   */
  private createRestNote(note: Note): StaveNote | null {
    const duration = this.mapNoteDuration(note.type)
    if (!duration) {
      return null
    }

    try {
      const restNote = new StaveNote({
        keys: ['b/4'],
        duration: duration + 'r'
      })

      if (note.dots > 0) {
        for (let i = 0; i < note.dots; i++) {
          restNote.addModifier(new Dot())
        }
      }

      return restNote
    } catch (error) {
      console.warn(`创建休止符失败: ${note.type}`, error)
      return null
    }
  }

  /**
   * 创建单个 VexFlow 音符
   */
  private createSingleVexFlowNote(note: Note): StaveNote | null {
    if (!note || !note.pitch) return null
    
    const pitchMatch = note.pitch.match(/^([A-G])(#{1,2}|b{1,2})?(\d)$/)
    if (!pitchMatch) {
      console.warn(`无法解析音高: ${note.pitch}`)
      return null
    }
    
    const step = pitchMatch[1].toLowerCase()
    const accidental = pitchMatch[2] || ''
    const octave = pitchMatch[3]
    
    const duration = this.mapNoteDuration(note.type)
    if (!duration) {
      return null
    }
    
    const key = `${step}${accidental}/${octave}`
    
    try {
      const vexNote = new StaveNote({
        keys: [key],
        duration,
        stem_direction: note.stem === 'down' ? -1 : 1
      })
      
      if (accidental) {
        vexNote.addModifier(new Accidental(accidental))
      }
      
      if (note.dots > 0) {
        for (let i = 0; i < note.dots; i++) {
          vexNote.addModifier(new Dot())
        }
      }
      
      return vexNote
    } catch (error) {
      console.warn(`创建音符失败: ${note.pitch}, key: ${key}`, error)
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
      return 'treble'
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