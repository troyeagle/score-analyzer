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
        // 创建可滚动的外层容器
        const scrollWrapper = document.createElement('div')
        scrollWrapper.style.overflowX = 'auto'
        scrollWrapper.style.overflowY = 'hidden'
        scrollWrapper.style.width = '100%'
        scrollWrapper.style.padding = '10px 0'
        
        // 创建内部渲染区域，设置足够宽
        const renderArea = document.createElement('div')
        renderArea.style.width = '4000px'
        renderArea.style.minHeight = '200px'
        
        scrollWrapper.appendChild(renderArea)
        this.container.appendChild(scrollWrapper)
        
        // 渲染到内部区域，不使用 responsive，使用固定宽度
        this.abcjs.renderAbc(renderArea, this.abcString, {
          responsive: undefined,
          add_classes: true,
          staffwidth: 3800,
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
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xml, 'text/xml')
      
      const title = doc.querySelector('work-title')?.textContent || 'Untitled'
      const composer = doc.querySelector('creator[type="composer"]')?.textContent || ''
      
      const keyElement = doc.querySelector('key')
      let key = 'C'
      if (keyElement) {
        const fifths = parseInt(keyElement.querySelector('fifths')?.textContent || '0')
        const mode = keyElement.querySelector('mode')?.textContent || 'major'
        key = this.fifthsToKey(fifths, mode)
      }
      
      const timeElement = doc.querySelector('time')
      let meter = '4/4'
      if (timeElement) {
        const beats = timeElement.querySelector('beats')?.textContent || '4'
        const beatType = timeElement.querySelector('beat-type')?.textContent || '4'
        meter = `${beats}/${beatType}`
      }
      
      let abc = `X:1\n`
      abc += `T:${title}\n`
      if (composer) {
        abc += `C:${composer}\n`
      }
      abc += `M:${meter}\n`
      abc += `L:1/8\n`
      abc += `K:${key}\n`
      
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
