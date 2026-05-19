import type { ScoreRenderer } from './index'
import { RendererFactory } from './index'

export class VerovioRenderer implements ScoreRenderer {
  name = 'Verovio'
  description = '专业的音乐记谱渲染引擎，渲染质量最高，支持 MIDI 播放'

  private toolkit: any = null
  private container: HTMLElement | null = null
  private currentPage: number = 1
  private totalPages: number = 1
  private versePositionMap: Map<string, number> = new Map()  // verse number -> position index

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
      // 解析歌词行号并预处理 XML
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
   * 解析 MusicXML 中的歌词行号
   * 建立 verse number -> position 的映射
   * 并预处理 XML 确保每个音符都有完整的 verse 列表
   */
  private parseVerseNumbers(xml: string): string {
    this.versePositionMap.clear()

    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')

    // 第一步：收集所有不同的 verse number
    const allVerseNumbers = new Set<string>()
    doc.querySelectorAll('lyric').forEach(lyric => {
      const number = lyric.getAttribute('number')
      if (number) {
        allVerseNumbers.add(number)
      }
    })

    // 第二步：对 verse number 排序，建立 position 映射
    const sortedVerses = Array.from(allVerseNumbers).sort()
    sortedVerses.forEach((verse, index) => {
      this.versePositionMap.set(verse, index)
    })

    console.log('[Verovio] verse position map:', Object.fromEntries(this.versePositionMap))

    // 第三步：为每个音符补充缺失的 verse
    // 确保所有音符都有相同数量的 verse，这样 Verovio 渲染时位置一致
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
      
      console.log('[Verovio] 找到 lyric 元素数量:', lyricElements.length)
      
      lyricElements.forEach(lyric => {
        const number = lyric.getAttribute('number')
        const defaultY = lyric.getAttribute('default-y')
        const text = lyric.querySelector('text')?.textContent
        console.log(`[Verovio] lyric: number=${number}, default-y=${defaultY}, text=${text}`)
        if (number) {
          verseNumbers.add(number)
        }
      })
      
      console.log('[Verovio] 不同的 verse 编号:', Array.from(verseNumbers))
      
      // 如果只有一种或没有 verse，不需要处理
      if (verseNumbers.size <= 1) {
        console.log('[Verovio] 只有一种或没有 verse，跳过预处理')
        return xml
      }
      
      // 对 verse 编号排序，确定每个 verse 的偏移量
      const sortedVerses = Array.from(verseNumbers).sort()
      const verseOffsets = new Map<string, number>()
      sortedVerses.forEach((verse, index) => {
        verseOffsets.set(verse, index * 30)  // 每行歌词偏移 30 单位
      })
      
      console.log('[Verovio] verse 偏移量:', Object.fromEntries(verseOffsets))
      
      // 修改每个 lyric 元素的 default-y
      lyricElements.forEach(lyric => {
        const number = lyric.getAttribute('number')
        if (number && verseOffsets.has(number)) {
          const baseY = -80  // 基础 y 坐标
          const offset = verseOffsets.get(number)!
          const newY = baseY - offset
          lyric.setAttribute('default-y', String(newY))
          console.log(`[Verovio] 修改 lyric ${number}: default-y=${newY}`)
        }
      })
      
      // 验证修改结果
      console.log('[Verovio] 验证修改后的 lyric 元素:')
      doc.querySelectorAll('lyric').forEach(lyric => {
        const number = lyric.getAttribute('number')
        const defaultY = lyric.getAttribute('default-y')
        const text = lyric.querySelector('text')?.textContent
        console.log(`[Verovio] 验证: number=${number}, default-y=${defaultY}, text=${text}`)
      })
      
      const serializer = new XMLSerializer()
      const result = serializer.serializeToString(doc)
      
      // 验证序列化结果
      console.log('[Verovio] 序列化结果片段:', result.substring(0, 500))
      
      return result
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
        
        // 调整 SVG 样式并修复歌词重叠
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
   * Verovio 将多行歌词渲染到相同 y 坐标，需要手动偏移
   */
  private fixLyricOverlap(svgElement: SVGSVGElement): void {
    const noteElements = svgElement.querySelectorAll('.note')
    
    noteElements.forEach(noteEl => {
      const verseElements = Array.from(noteEl.querySelectorAll(':scope > .verse'))
      if (verseElements.length <= 1) return
      
      // 获取第一个 verse 的 y 坐标作为基准
      const firstText = verseElements[0].querySelector('text')
      if (!firstText) return
      
      const baseY = parseFloat(firstText.getAttribute('y') || '0')
      
      // 从第 2 个 verse 开始，依次向下偏移
      for (let i = 1; i < verseElements.length; i++) {
        const textEl = verseElements[i].querySelector('text')
        if (textEl) {
          // 每行歌词偏移 450 单位（根据字体大小和行距调整）
          const offset = i * 450
          textEl.setAttribute('y', String(baseY + offset))
        }
      }
    })
  }

  destroy(): void {

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
          
          // 调试：检查渲染后的歌词位置
          const noteElements = svgElement.querySelectorAll('.note')
          console.log(`[Verovio] 渲染后检查: 找到 ${noteElements.length} 个 note 元素`)
          
          let checked = 0
          noteElements.forEach((noteEl: Element) => {
            if (checked >= 3) return // 只检查前3个
            
            const verseElements = noteEl.querySelectorAll(':scope > .verse')
            if (verseElements.length > 1) {
              console.log(`[Verovio] 发现多歌词 note, verse 数量: ${verseElements.length}`)
              verseElements.forEach((verse, i) => {
                const textEl = verse.querySelector('text')
                if (textEl) {
                  const y = textEl.getAttribute('y')
                  const text = textEl.textContent
                  console.log(`[Verovio]   verse ${i}: y=${y}, text=${text}`)
                }
              })
              checked++
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
