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
      const verovio = await import('verovio')
      await verovio.default()
      this.toolkit = new verovio.VerovioToolkit({
        scale: 40,
        pageWidth: 1200,
        pageHeight: 1600,
        spacingStaff: 8,
        spacingSystem: 8,
        spacingLinear: 0.2,
        spacingNonLinear: 0.3,
        font: 'Leipzig'
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
      
      // 渲染所有页面
      for (let page = 1; page <= this.totalPages; page++) {
        const svg = this.toolkit.renderToSVG(page)
        const pageDiv = document.createElement('div')
        pageDiv.className = 'verovio-page'
        pageDiv.innerHTML = svg
        pageDiv.style.marginBottom = '20px'
        this.container.appendChild(pageDiv)
      }
      
      console.log(`[Verovio] 渲染完成, 共 ${this.totalPages} 页`)
    } catch (error) {
      console.error('[Verovio] 渲染失败:', error)
      throw error
    }
  }

  destroy(): void {
    if (this.container) {
      this.container.innerHTML = ''
    }
    this.toolkit = null
    this.container = null
  }
}

// 注册到工厂
RendererFactory.register('verovio', () => new VerovioRenderer())