import type { ScoreRenderer } from './index'
import { RendererFactory } from './index'

export class VerovioRenderer implements ScoreRenderer {
  name = 'Verovio'
  description = '专业的音乐记谱渲染引擎，渲染质量最高，支持 MIDI 播放'

  private toolkit: any = null
  private container: HTMLElement | null = null
  private currentPage: number = 1
  private totalPages: number = 1
  private versePositionMap: Map<string, number> = new Map()

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
      
      this.toolkit.setOptions({
        // 布局控制
        scale: 28,                    // 缩小音符，容纳更多小节
        pageWidth: 2800,              // 宽页面
        pageHeight: 1600,
        measureMinWidth: 15,          // 小节最小宽度（允许紧凑排列）
        breaks: 'auto',               // 忽略 MusicXML 中的换行标记，自动排版
        breaksNoWidow: true,          // 避免孤行
        
        // 间距控制
        spacingStaff: 12,
        spacingSystem: 12,
        spacingLinear: 0.25,
        spacingNonLinear: 0.35,
        minLastSystemSpacing: 12,
        minSystemDistance: 30,         // 减小系统间距
        
        // 对齐
        justificationSystem: 1,       // 系统两端对齐
        justifyVertically: false,
        
        // 歌词
        lyricTopMinMargin: 4,
        lyricSize: 4.5,
        lyricVerseCollapse: false,
        lyricWordSpace: 1.2,
        
        // 其他
        font: 'Leipzig',
        adjustPageWidth: false,
        shrinkToFit: false
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
      const processedXml = this.parseVerseNumbers(xml)
      
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
   * 解析歌词行号并预处理 XML
   * 确保每个音符都有完整的 verse 列表
   */
  private parseVerseNumbers(xml: string): string {
    this.versePositionMap.clear()

    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')

    // 收集所有不同的 verse number
    const allVerseNumbers = new Set<string>()
    doc.querySelectorAll('lyric').forEach(lyric => {
      const number = lyric.getAttribute('number')
      if (number) {
        allVerseNumbers.add(number)
      }
    })

    // 对 verse number 排序，建立 position 映射
    const sortedVerses = Array.from(allVerseNumbers).sort()
    sortedVerses.forEach((verse, index) => {
      this.versePositionMap.set(verse, index)
    })

    console.log('[Verovio] verse position map:', Object.fromEntries(this.versePositionMap))

    // 为每个音符补充缺失的 verse
    doc.querySelectorAll('note').forEach(note => {
      const existingVerses = new Set<string>()
      note.querySelectorAll('lyric').forEach(lyric => {
        const number = lyric.getAttribute('number')
        if (number) {
          existingVerses.add(number)
        }
      })

      // 为缺失的 verse 添加占位符
      sortedVerses.forEach(verseNumber => {
        if (!existingVerses.has(verseNumber)) {
          const placeholder = doc.createElement('lyric')
          placeholder.setAttribute('number', verseNumber)
          placeholder.setAttribute('default-y', '-80')
          
          const syllabic = doc.createElement('syllabic')
          syllabic.textContent = 'single'
          placeholder.appendChild(syllabic)
          
          const text = doc.createElement('text')
          text.textContent = '\u200B'  // 零宽空格
          placeholder.appendChild(text)
          
          note.appendChild(placeholder)
        }
      })
    })

    const serializer = new XMLSerializer()
    return serializer.serializeToString(doc)
  }

  async render(): Promise<void> {
    if (!this.toolkit || !this.container) {
      throw new Error('Verovio 未初始化')
    }

    try {
      this.container.innerHTML = ''
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
        
        const svgElement = pageDiv.querySelector('svg')
        if (svgElement) {
          svgElement.style.width = '100%'
          svgElement.style.height = 'auto'
          svgElement.style.minWidth = '1200px'
          
          // 修复多行歌词重叠
          this.fixLyricOverlap(svgElement)
        }
        
        this.container.appendChild(pageDiv)
      }
      
      console.log(`[Verovio] 渲染完成, 共 ${this.totalPages} 页`)
    } catch (error) {
      console.error('[Verovio] 渲染失败:', error)
      throw error
    }
  }

  /**
   * 修复 SVG 中多行歌词重叠的问题
   */
  private fixLyricOverlap(svgElement: SVGSVGElement): void {
    const noteElements = svgElement.querySelectorAll('.note')
    
    noteElements.forEach(noteEl => {
      const verseElements = Array.from(noteEl.querySelectorAll(':scope > .verse'))
      if (verseElements.length <= 1) return
      
      const firstText = verseElements[0].querySelector('text')
      if (!firstText) return
      
      const baseY = parseFloat(firstText.getAttribute('y') || '0')
      
      for (let i = 1; i < verseElements.length; i++) {
        const textEl = verseElements[i].querySelector('text')
        if (textEl) {
          const offset = i * 450
          textEl.setAttribute('y', String(baseY + offset))
        }
      }
    })
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
