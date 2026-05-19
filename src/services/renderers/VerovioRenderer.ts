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
      // 预处理 MusicXML：根据 lyric 的 number 属性设置不同的 default-y
      const processedXml = this.preprocessLyrics(xml)
      
      const success = this.toolkit.loadData(processedXml)
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

  /**
   * 预处理 MusicXML 中的歌词
   * 根据 lyric 的 number 属性（如 part1verse1, part1verse2）设置不同的 default-y
   * 确保 Verovio 能正确区分多行歌词
   */
  private preprocessLyrics(xml: string): string {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xml, 'text/xml')
      
      // 收集所有不同的 verse 编号
      const verseNumbers = new Set<string>()
      const lyricElements = doc.querySelectorAll('lyric')
      
      lyricElements.forEach(lyric => {
        const number = lyric.getAttribute('number')
        if (number) {
          verseNumbers.add(number)
        }
      })
      
      // 如果只有一种或没有 verse，不需要处理
      if (verseNumbers.size <= 1) {
        return xml
      }
      
      // 对 verse 编号排序，确定每个 verse 的偏移量
      const sortedVerses = Array.from(verseNumbers).sort()
      const verseOffsets = new Map<string, number>()
      sortedVerses.forEach((verse, index) => {
        verseOffsets.set(verse, index * 25)  // 每行歌词偏移 25 单位
      })
      
      // 修改每个 lyric 元素的 default-y
      lyricElements.forEach(lyric => {
        const number = lyric.getAttribute('number')
        if (number && verseOffsets.has(number)) {
          const baseY = -80  // 基础 y 坐标
          const offset = verseOffsets.get(number)!
          lyric.setAttribute('default-y', String(baseY - offset))
        }
      })
      
      const serializer = new XMLSerializer()
      return serializer.serializeToString(doc)
    } catch (error) {
      console.warn('[Verovio] 歌词预处理失败，使用原始 XML:', error)
      return xml
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
