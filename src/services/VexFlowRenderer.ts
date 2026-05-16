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

// 浏览器 Canvas 最大尺寸限制
const MAX_CANVAS_HEIGHT = 32000

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
    this.height = Math.min(height, MAX_CANVAS_HEIGHT)
    
    container.innerHTML = ''
    
    console.log('[VexFlowRenderer] 初始化, canvas:', width, 'x', this.height)
    
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = this.height
    canvas.style.width = `${width}px`
    canvas.style.height = `${this.height}px`
    container.appendChild(canvas)
    
    this.renderer = new Renderer(canvas, Renderer.Backends.CANVAS)
    this.renderer.resize(width, this.height)
    this.context = this.renderer.getContext()
  }

  /**
   * 渲染多个声部（支持分页）
   */
  renderParts(parts: Part[], config: LayoutConfig): void {
    if (!this.container) {
      throw new Error('渲染器未初始化')
    }
    
    console.log('[VexFlowRenderer] ========== 开始渲染 ==========')
    console.log('[VexFlowRenderer] 声部数:', parts.length)
    console.log('[VexFlowRenderer] 声部详情:', parts.map(p => ({
      id: p.id,
      name: p.name,
      measures: p.measures.length,
      staves: p.staves
    })))
    
    // 清空容器
    this.container.innerHTML = ''
    
    const marginLeft = config.marginLeft || 40
    const marginTop = config.marginTop || 50
    const marginRight = config.marginRight || 40
    const staveSpacing = config.staveSpacing || 80
    const staffSpacing = config.staffSpacing || 60
    const measuresPerLine = 4
    
    const availableWidth = this.width - marginLeft - marginRight
    const measureWidth = availableWidth / measuresPerLine
    
    // 计算每行的高度
    const lineHeight = this.calculateLineHeight(parts, staveSpacing, staffSpacing)
    
    // 计算每页能容纳的行数
    const linesPerPage = Math.floor((MAX_CANVAS_HEIGHT - marginTop * 2) / lineHeight)
    
    // 获取最大小节数
    const maxMeasures = Math.max(...parts.map(p => p.measures.length))
    const totalLines = Math.ceil(maxMeasures / measuresPerLine)
    
    console.log('[VexFlowRenderer] 布局参数:', {
      measuresPerLine,
      measureWidth: measureWidth.toFixed(1),
      lineHeight: lineHeight.toFixed(1),
      linesPerPage,
      totalLines,
      maxMeasures
    })
    
    // 分页渲染
    let currentPage = 0
    let lineIndex = 0
    
    while (lineIndex < totalLines) {
      const pageStartLine = lineIndex
      const pageEndLine = Math.min(lineIndex + linesPerPage, totalLines)
      const linesOnThisPage = pageEndLine - pageStartLine
      const canvasHeight = marginTop * 2 + linesOnThisPage * lineHeight
      
      console.log(`[VexFlowRenderer] ---- 渲染第 ${currentPage + 1} 页 ----`)
      console.log(`[VexFlowRenderer] 行范围: ${pageStartLine + 1} - ${pageEndLine}, 行数: ${linesOnThisPage}, canvas高度: ${canvasHeight}`)
      
      // 创建新的 Canvas
      const canvas = document.createElement('canvas')
      canvas.width = this.width
      canvas.height = Math.min(canvasHeight, MAX_CANVAS_HEIGHT)
      canvas.style.width = `${this.width}px`
      canvas.style.height = `${canvasHeight}px`
      canvas.style.marginBottom = '20px'
      canvas.style.display = 'block'
      this.container.appendChild(canvas)
      
      const renderer = new Renderer(canvas, Renderer.Backends.CANVAS)
      renderer.resize(this.width, canvas.height)
      const context = renderer.getContext()
      
      // 渲染这一页的所有行
      let currentY = marginTop
      
      for (let line = pageStartLine; line < pageEndLine; line++) {
        const lineStart = line * measuresPerLine
        const lineEnd = Math.min(lineStart + measuresPerLine, maxMeasures)
        
        console.log(`[VexFlowRenderer] 渲染行 ${line + 1}: 小节 ${lineStart + 1}-${lineEnd}`)
        
        // 渲染每个声部的这一行
        for (let partIndex = 0; partIndex < parts.length; partIndex++) {
          const part = parts[partIndex]
          
          if (part.staves > 1) {
            currentY = this.renderGrandStaffLine(
              context,
              part,
              lineStart,
              lineEnd,
              currentY,
              measureWidth,
              marginLeft,
              staffSpacing
            )
          } else {
            currentY = this.renderSingleStaffLine(
              context,
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
        currentY += staveSpacing
      }
      
      lineIndex = pageEndLine
      currentPage++
    }
    
    console.log(`[VexFlowRenderer] ========== 渲染完成: ${currentPage} 页 ==========`)
  }

  /**
   * 计算每行的高度
   */
  private calculateLineHeight(parts: Part[], staveSpacing: number, staffSpacing: number): number {
    let height = 0
    
    for (const part of parts) {
      if (part.staves > 1) {
        height += staffSpacing + 100 // 大谱表高度
      } else {
        height += 100 // 单谱表高度
      }
      height += staveSpacing // 声部间距
    }
    
    return height
  }

  /**
   * 渲染单谱表的一行
   */
  private renderSingleStaffLine(
    context: any,
    part: Part,
    lineStart: number,
    lineEnd: number,
    startY: number,
    measureWidth: number,
    marginLeft: number
  ): number {
    if (!context) return startY
    
    console.log(`[VexFlowRenderer] renderSingleStaffLine: ${part.name}, 小节 ${lineStart}-${lineEnd}, y=${startY}`)
    
    const staves: Stave[] = []
    const allVoices: { voice: Voice, staveIndex: number, measureNum: number, voiceId: number }[] = []
    
    // 用于去重的集合
    const processedVoices = new Set<string>()
    
    let currentX = marginLeft
    
    for (let i = lineStart; i < lineEnd; i++) {
      const measure = part.measures[i]
      if (!measure) {
        console.log(`[VexFlowRenderer] 警告: 声部 ${part.name} 缺少小节索引 ${i}`)
        currentX += measureWidth
        continue
      }
      
      console.log(`[VexFlowRenderer] 处理小节 ${measure.number}, voices: ${measure.voices?.size || 0}`)
      
      // 创建小节的五线谱
      const stave = new Stave(currentX, startY, measureWidth)
      
      // 只在第一个小节添加谱号、调号、拍号
      if (i === lineStart) {
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
      
      stave.setContext(context)
      stave.draw()
      staves.push(stave)
      
      // 收集该小节的音符（带去重）
      if (measure.voices && measure.voices.size > 0) {
        measure.voices.forEach((voice, voiceId) => {
          // 生成唯一的 voice 标识
          const voiceKey = `${part.id}_M${measure.number}_V${voiceId}`
          
          // 检查是否已处理过
          if (processedVoices.has(voiceKey)) {
            console.log(`[VexFlowRenderer] 跳过重复的 voice: ${voiceKey}`)
            return
          }
          processedVoices.add(voiceKey)
          
          if (!voice.notes || voice.notes.length === 0) {
            console.log(`[VexFlowRenderer] 声部 ${part.name}, 小节 ${measure.number}, voice ${voiceId}: 无音符`)
            return
          }
          
          console.log(`[VexFlowRenderer] 声部 ${part.name}, 小节 ${measure.number}, voice ${voiceId}: ${voice.notes.length} 个音符`)
          
          const vexNotes = this.createVexFlowNotes(voice.notes)
          if (vexNotes.length > 0) {
            const timeSignature = measure.attributes?.time || '4/4'
            const vexVoice = new Voice({
              num_beats: this.getBeatsFromTimeSignature(timeSignature),
              beat_value: this.getBeatValueFromTimeSignature(timeSignature)
            })
            vexVoice.setStrict(false)
            vexVoice.addTickables(vexNotes)
            allVoices.push({ 
              voice: vexVoice, 
              staveIndex: staves.length - 1,
              measureNum: measure.number,
              voiceId 
            })
          }
        })
      } else {
        console.log(`[VexFlowRenderer] 声部 ${part.name}, 小节 ${measure.number}: 无 voices`)
      }
      
      currentX += measureWidth
    }
    
    // 格式化并渲染每个小节的音符到对应的五线谱
    console.log(`[VexFlowRenderer] 渲染 ${allVoices.length} 个 voices`)
    
    allVoices.forEach(({ voice, staveIndex, measureNum, voiceId }) => {
      try {
        const formatter = new Formatter()
        formatter.joinVoices([voice])
        formatter.format([voice], measureWidth - 20)
        voice.draw(context, staves[staveIndex])
        console.log(`[VexFlowRenderer] 成功渲染: 小节${measureNum}, voice${voiceId}, staveIndex${staveIndex}`)
      } catch (error) {
        console.error(`[VexFlowRenderer] 渲染音符失败: 小节${measureNum}, voice${voiceId}`, error)
      }
    })
    
    return startY + 100
  }

  /**
   * 渲染大谱表的一行
   */
  private renderGrandStaffLine(
    context: any,
    part: Part,
    lineStart: number,
    lineEnd: number,
    startY: number,
    measureWidth: number,
    marginLeft: number,
    staffSpacing: number
  ): number {
    if (!context) return startY
    
    console.log(`[VexFlowRenderer] renderGrandStaffLine: ${part.name}, 小节 ${lineStart}-${lineEnd}`)
    
    // 获取谱号信息
    const firstMeasure = part.measures[0]
    const clefs = firstMeasure?.attributes?.clefs || []
    const trebleClef = clefs.find(c => c.sign === 'G') || { sign: 'G', line: 2, number: 1 }
    const bassClef = clefs.find(c => c.sign === 'F') || { sign: 'F', line: 4, number: 2 }
    
    const trebleStaves: Stave[] = []
    const bassStaves: Stave[] = []
    const trebleVoices: { voice: Voice, staveIndex: number, measureNum: number, voiceId: number }[] = []
    const bassVoices: { voice: Voice, staveIndex: number, measureNum: number, voiceId: number }[] = []
    
    // 用于去重的集合
    const processedVoices = new Set<string>()
    
    let currentX = marginLeft
    
    for (let i = lineStart; i < lineEnd; i++) {
      const measure = part.measures[i]
      if (!measure) {
        console.log(`[VexFlowRenderer] 警告: 声部 ${part.name} 缺少小节索引 ${i}`)
        currentX += measureWidth
        continue
      }
      
      console.log(`[VexFlowRenderer] 处理大谱表小节 ${measure.number}, voices: ${measure.voices?.size || 0}`)
      
      // 高音谱表
      const trebleStave = new Stave(currentX, startY, measureWidth)
      if (i === lineStart) {
        trebleStave.addClef(this.getClefName(trebleClef))
        if (measure.attributes?.key) {
          trebleStave.addKeySignature(measure.attributes.key)
        }
        if (measure.attributes?.time) {
          trebleStave.addTimeSignature(measure.attributes.time)
        }
      }
      trebleStave.setContext(context)
      trebleStave.draw()
      trebleStaves.push(trebleStave)
      
      // 低音谱表
      const bassStave = new Stave(currentX, startY + staffSpacing, measureWidth)
      if (i === lineStart) {
        bassStave.addClef(this.getClefName(bassClef))
        if (measure.attributes?.key) {
          bassStave.addKeySignature(measure.attributes.key)
        }
      }
      bassStave.setContext(context)
      bassStave.draw()
      bassStaves.push(bassStave)
      
      // 收集音符（带去重）
      if (measure.voices) {
        measure.voices.forEach((voice, voiceId) => {
          // 生成唯一的 voice 标识
          const voiceKey = `${part.id}_M${measure.number}_V${voiceId}_S${voice.staff}`
          
          // 检查是否已处理过
          if (processedVoices.has(voiceKey)) {
            console.log(`[VexFlowRenderer] 跳过重复的 voice: ${voiceKey}`)
            return
          }
          processedVoices.add(voiceKey)
          
          if (!voice.notes || voice.notes.length === 0) return
          
          console.log(`[VexFlowRenderer] 大谱表声部 ${part.name}, 小节 ${measure.number}, voice ${voiceId} (staff ${voice.staff}): ${voice.notes.length} 个音符`)
          
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
              bassVoices.push({ voice: vexVoice, staveIndex, measureNum: measure.number, voiceId })
            } else {
              trebleVoices.push({ voice: vexVoice, staveIndex, measureNum: measure.number, voiceId })
            }
          }
        })
      }
      
      currentX += measureWidth
    }
    
    // 绘制花括号
    this.drawBrace(context, marginLeft, startY, staffSpacing + 40)
    
    // 渲染高音谱表音符
    console.log(`[VexFlowRenderer] 渲染 ${trebleVoices.length} 个高音谱表 voices`)
    trebleVoices.forEach(({ voice, staveIndex, measureNum, voiceId }) => {
      try {
        const formatter = new Formatter()
        formatter.joinVoices([voice])
        formatter.format([voice], measureWidth - 20)
        voice.draw(context, trebleStaves[staveIndex])
        console.log(`[VexFlowRenderer] 成功渲染高音谱表: 小节${measureNum}, voice${voiceId}`)
      } catch (error) {
        console.error(`[VexFlowRenderer] 渲染高音谱表音符失败: 小节${measureNum}, voice${voiceId}`, error)
      }
    })
    
    // 渲染低音谱表音符
    console.log(`[VexFlowRenderer] 渲染 ${bassVoices.length} 个低音谱表 voices`)
    bassVoices.forEach(({ voice, staveIndex, measureNum, voiceId }) => {
      try {
        const formatter = new Formatter()
        formatter.joinVoices([voice])
        formatter.format([voice], measureWidth - 20)
        voice.draw(context, bassStaves[staveIndex])
        console.log(`[VexFlowRenderer] 成功渲染低音谱表: 小节${measureNum}, voice${voiceId}`)
      } catch (error) {
        console.error(`[VexFlowRenderer] 渲染低音谱表音符失败: 小节${measureNum}, voice${voiceId}`, error)
      }
    })
    
    return startY + staffSpacing + 100
  }

  /**
   * 绘制花括号
   */
  private drawBrace(context: any, x: number, y: number, height: number): void {
    if (!context) return
    
    context.save()
    context.strokeStyle = '#000000'
    context.lineWidth = 2
    context.beginPath()
    
    const braceWidth = 15
    const curveWidth = 8
    
    context.moveTo(x - braceWidth, y)
    context.quadraticCurveTo(x - braceWidth + curveWidth, y + height * 0.25, x - braceWidth, y + height * 0.5)
    context.quadraticCurveTo(x - braceWidth - curveWidth, y + height * 0.75, x - braceWidth, y + height)
    
    context.stroke()
    context.restore()
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
        console.warn(`[VexFlowRenderer] 无法渲染音符 ${note.id}:`, error)
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
      console.warn(`[VexFlowRenderer] 创建休止符失败: ${note.type}`, error)
      return null
    }
  }

  /**
   * 创建单个 VexFlow 音符
   */
  private createSingleVexFlowNote(note: Note): StaveNote | null {
    if (!note || !note.pitch) return null
    
    // 解析音高
    const pitchMatch = note.pitch.match(/^([A-G])(#{1,2}|b{1,2})?(\d)$/)
    if (!pitchMatch) {
      console.warn(`[VexFlowRenderer] 无法解析音高: ${note.pitch}`)
      return null
    }
    
    const step = pitchMatch[1].toLowerCase()
    const accidental = pitchMatch[2] || ''
    const octave = pitchMatch[3]
    
    const duration = this.mapNoteDuration(note.type)
    if (!duration) {
      console.warn(`[VexFlowRenderer] 无法映射时值: ${note.type}`)
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
      console.warn(`[VexFlowRenderer] 创建音符失败: ${note.pitch}, key: ${key}`, error)
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
    if (this.container) {
      this.container.innerHTML = ''
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