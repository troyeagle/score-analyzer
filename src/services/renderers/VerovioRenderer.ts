import type { ScoreRenderer } from './index'
import { RendererFactory } from './index'

export class VerovioRenderer implements ScoreRenderer {
  name = 'Verovio'
  description = '专业的音乐记谱渲染引擎，渲染质量最高，支持 MIDI 播放'

  private toolkit: any = null
  private container: HTMLElement | null = null
  private currentPage: number = 1
  private totalPages: number = 1

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container
    container.innerHTML = ''

    try {
      const [wasmModule, esmModule] = await Promise.all([
        import('verovio/wasm'),
        import('verovio/esm')
      ])
      
      const VerovioModule = await wasmModule.default()
      this.toolkit = new esmModule.VerovioToolkit(VerovioModule)
      
      // 设置选项
      this.toolkit.setOptions({
        scale: 28,
        pageWidth: 2800,
        pageHeight: 1600,
        spacingStaff: 12,
        spacingSystem: 12,
        spacingLinear: 0.25,
        spacingNonLinear: 0.35,
        minLastSystemSpacing: 12,
        minSystemDistance: 50,
        font: 'Leipzig',
        adjustPageWidth: false,
        shrinkToFit: false,
        // 歌词相关选项
        lyricTopMinMargin: 4,      // 歌词上方最小间距
        lyricSize: 4.5,            // 歌词字号
        lyricVerseCollapse: false, // 不折叠多行歌词
        lyricWordSpace: 1.2        // 歌词字间距
      })
      
      console.log('[Verovio] 初始化成功')
    } catch (error) {
      console.error('[Verovio] 初始化失败:', error)
      throw error
    }
  }

  async loadMusicXML(xml: string): Promise<void> {
    if (!this.toolkit) {
      throw new Error('Verovio 未初始化')
    }

    try {
      const success = this.toolkit.loadData(xml)
      if (!success) {
        throw new Error('MusicXML 加载失败')
      }
      this.totalPages = this.toolkit.getPageCount()
      this.currentPage = 1
      console.log(`[Verovio] MusicXML 加载成功, 共 ${this.totalPages} 页`)
    } catch (error) {
      console.error('[Verovio] MusicXML 加载失败:', error)
      throw error
    }
  }

  async render(): Promise<void> {
    if (!this.toolkit || !this.container) {
      throw new Error('Verovio 未初始化')
    }

    try {
      this.container.innerHTML = ''
      
      // 添加横向滚动支持
      this.container.style.overflowX = 'auto'
      this.container.style.overflowY = 'hidden'
      
      for (let page = 1; page <= this.totalPages; page++) {
        const svg = this.toolkit.renderToSVG(page)
        const pageDiv = document.createElement('div')
        pageDiv.className = 'verovio-page'
        pageDiv.innerHTML = svg
        pageDiv.style.marginBottom = '20px'
        pageDiv.style.display = 'inline-block'
        pageDiv.style.minWidth = '100%'
        
        // 调整 SVG 样式
        const svgElement = pageDiv.querySelector('svg')
        if (svgElement) {
          svgElement.style.width = '100%'
          svgElement.style.height = 'auto'
          svgElement.style.minWidth = '1200px'
          
          // 修复多行歌词重叠：遍历每个 note 下的多个 verse
          const noteElements = svgElement.querySelectorAll('.note')
          noteElements.forEach((noteEl: Element) => {
            const verseElements = noteEl.querySelectorAll(':scope > .verse')
            if (verseElements.length <= 1) return
            
            // 从第 2 个 verse 开始，向下偏移
            for (let i = 1; i < verseElements.length; i++) {
              const verse = verseElements[i]
              const textEl = verse.querySelector('text')
              if (textEl) {
                const currentY = parseFloat(textEl.getAttribute('y') || '0')
                const offset = i * 450  // 每行歌词偏移 450 单位
                textEl.setAttribute('y', String(currentY + offset))
              }
            }
          })
        }
        
        this.container.appendChild(pageDiv)
      }
      
      console.log(`[Verovio] 渲染完成, 共 ${this.totalPages} 页`)
    } catch (error) {
      console.error('[Verovio] 渲染失败:', error)
      throw error
    }
  }

  destroy(): void {
    if (this.toolkit) {
      this.toolkit.destroy()
    }
    if (this.container) {
      this.container.innerHTML = ''
    }
    this.toolkit = null
    this.container = null
  }
}

RendererFactory.register('verovio', () => new VerovioRenderer())
