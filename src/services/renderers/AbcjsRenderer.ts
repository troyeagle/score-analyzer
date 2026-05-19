import type { ScoreRenderer } from './index'
import { RendererFactory } from './index'

export class AbcjsRenderer implements ScoreRenderer {
  name = 'abcjs'
  description = '轻量级渲染库，支持 ABC 记谱法和 MusicXML，包体积最小'

  private abcjs: any = null
  private container: HTMLElement | null = null
  private abcString: string = ''

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container
    container.innerHTML = ''

    try {
      this.abcjs = await import('abcjs')
      console.log('[abcjs] 初始化成功')
    } catch (error) {
      console.error('[abcjs] 初始化失败:', error)
      throw error
    }
  }

  async loadMusicXML(xml: string): Promise<void> {
    if (!this.abcjs) {
      throw new Error('abcjs 未初始化')
    }

    try {
      this.abcString = this.convertMusicXMLToABC(xml)
      console.log('[abcjs] MusicXML 转换完成, ABC长度:', this.abcString.length)
    } catch (error) {
      console.error('[abcjs] MusicXML 转换失败:', error)
      throw error
    }
  }

  async render(): Promise<void> {
    if (!this.abcjs || !this.container) {
      throw new Error('abcjs 未初始化')
    }

    try {
      this.container.innerHTML = ''
      
      if (this.abcString) {
        // 创建渲染区域
        const renderArea = document.createElement('div')
        renderArea.style.width = '100%'
        renderArea.style.minHeight = '200px'
        this.container.appendChild(renderArea)
        
        // 渲染 ABC
        this.abcjs.renderAbc(renderArea, this.abcString, {
          responsive: 'resize',
          add_classes: true,
          staffwidth: 700,
          scale: 1.0,
          paddingtop: 20,
          paddingbottom: 20,
          paddingleft: 10,
          paddingright: 10,
          wrap: {
            minSpacing: 1.5,
            maxSpacing: 2.7,
            lastLineLimit: false
          }
        })
      }
      
      console.log('[abcjs] 渲染完成')
    } catch (error) {
      console.error('[abcjs] 渲染失败:', error)
      throw error
    }
  }

  private convertMusicXMLToABC(xml: string): string {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xml, 'text/xml')
      
      // 提取元数据
      const title = doc.querySelector('work-title')?.textContent || 'Untitled'
      const composer = doc.querySelector('creator[type="composer"]')?.textContent || ''
      
      // 提取调号
      const keyElement = doc.querySelector('key')
      let key = 'C'
      if (keyElement) {
        const fifths = parseInt(keyElement.querySelector('fifths')?.textContent || '0')
        const mode = keyElement.querySelector('mode')?.textContent || 'major'
        key = this.fifthsToKey(fifths, mode)
      }
      
      // 提取拍号
      const timeElement = doc.querySelector('time')
      let meter = '4/4'
      if (timeElement) {
        const beats = timeElement.querySelector('beats')?.textContent || '4'
        const beatType = timeElement.querySelector('beat-type')?.textContent || '4'
        meter = `${beats}/${beatType}`
      }
      
      // 构建 ABC 头部
      let abc = `X:1\n`
      abc += `T:${title}\n`
      if (composer) {
        abc += `C:${composer}\n`
      }
      abc += `M:${meter}\n`
      abc += `L:1/8\n`
      abc += `K:${key}\n`
      
      // 提取所有小节
      const measures = doc.querySelectorAll('measure')
      let measureCount = 0
      
      measures.forEach((measure) => {
        const notes = measure.querySelectorAll('note')
        let measureStr = ''
        
        notes.forEach(note => {
          const rest = note.querySelector('rest')
          if (rest) {
            const duration = note.querySelector('duration')?.textContent || '1'
            measureStr += `z${this.durationToABC(duration)} `
          } else {
            const pitch = note.querySelector('pitch')
            if (pitch) {
              const step = pitch.querySelector('step')?.textContent || 'C'
              const octave = parseInt(pitch.querySelector('octave')?.textContent || '4')
              const alter = parseInt(pitch.querySelector('alter')?.textContent || '0')
              const duration = note.querySelector('duration')?.textContent || '1'
              
              let abcNote = step.toLowerCase()
              if (alter > 0) abcNote = '^' + abcNote
              if (alter < 0) abcNote = '_' + abcNote
              if (octave > 4) abcNote = abcNote + "'".repeat(octave - 4)
              if (octave < 4) abcNote = abcNote + ','.repeat(4 - octave)
              
              measureStr += `${abcNote}${this.durationToABC(duration)} `
            }
          }
        })
        
        // 添加小节内容和小节线
        if (measureStr.trim()) {
          abc += measureStr.trim() + ' | '
          measureCount++
          
          // 每 4 小节换行
          if (measureCount % 4 === 0) {
            abc += '\n'
          }
        }
      })
      
      // 确保最后有结束线
      if (!abc.trim().endsWith('|]') && !abc.trim().endsWith('||')) {
        abc += '|]'
      }
      
      return abc
    } catch (error) {
      console.error('MusicXML 转换失败:', error)
      return 'X:1\nT:Error\nM:4/4\nL:1/8\nK:C\nz8 | z8 |]'
    }
  }

  private fifthsToKey(fifths: number, mode: string): string {
    const majorKeys = ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#']
    const minorKeys = ['Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#']
    
    const index = fifths + 7
    return mode === 'minor' ? minorKeys[index] || 'C' : majorKeys[index] || 'C'
  }

  private durationToABC(duration: string): string {
    const durationMap: Record<string, string> = {
      '1024': '8',
      '512': '4',
      '256': '2',
      '128': '',
      '64': '/2',
      '32': '/4'
    }
    return durationMap[duration] || ''
  }

  destroy(): void {
    if (this.container) {
      this.container.innerHTML = ''
    }
    this.abcjs = null
    this.container = null
    this.abcString = ''
  }
}

RendererFactory.register('abcjs', () => new AbcjsRenderer())
