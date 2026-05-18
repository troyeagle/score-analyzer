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
      // abcjs 的 MusicXML 支持有限，需要转换
      // 这里我们使用一个简化的转换
      this.abcString = this.convertMusicXMLToABC(xml)
      console.log('[abcjs] MusicXML 转换完成')
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
        // 获取容器宽度
        const containerWidth = this.container.clientWidth || 800
        
        this.abcjs.renderAbc(this.container, this.abcString, {
          responsive: 'resize',
          add_classes: true,
          staffwidth: containerWidth - 40,
          scale: 1.0,
          paddingtop: 20,
          paddingbottom: 20,
          paddingleft: 20,
          paddingright: 20
        })
      }
      
      console.log('[abcjs] 渲染完成')
    } catch (error) {
      console.error('[abcjs] 渲染失败:', error)
      throw error
    }
  }

  private convertMusicXMLToABC(xml: string): string {
    // 简化的 MusicXML 到 ABC 转换
    // 注意：这是一个基本的转换，复杂的 MusicXML 可能无法完整转换
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xml, 'text/xml')
      
      // 提取基本信息
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
      
      // 构建 ABC 字符串
      let abc = `X:1\n`
      abc += `T:${title}\n`
      if (composer) {
        abc += `C:${composer}\n`
      }
      abc += `M:${meter}\n`
      abc += `L:1/8\n`
      abc += `K:${key}\n`
      
      // 提取音符（简化版本）
      const notes = doc.querySelectorAll('note')
      let noteString = ''
      
      notes.forEach(note => {
        const rest = note.querySelector('rest')
        if (rest) {
          const duration = note.querySelector('duration')?.textContent || '1'
          noteString += `z${this.durationToABC(duration)} `
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
            
            noteString += `${abcNote}${this.durationToABC(duration)} `
          }
        }
      })
      
      abc += noteString
      
      return abc
    } catch (error) {
      console.error('MusicXML 转换失败:', error)
      return 'X:1\nT:Error\nM:4/4\nL:1/8\nK:C\nz8 | z8 |'
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
      '1024': '8',  // whole
      '512': '4',   // half
      '256': '2',   // quarter
      '128': '',    // eighth (default)
      '64': '/2',   // 16th
      '32': '/4'    // 32nd
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

// 注册到工厂
RendererFactory.register('abcjs', () => new AbcjsRenderer())