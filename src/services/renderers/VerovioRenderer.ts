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
      const verovioModule = await import('verovio')
      
      // verovio 模块可能有多种导出方式
      // 方式1: default export 是初始化函数
      // 方式2: 导出 createVerovio 函数
      // 方式3: 导出 VerovioToolkit 类（需要 wasm 初始化）
      
      let createVerovio: (() => Promise<void>) | null = null
      
      if (typeof verovioModule.default === 'function') {
        createVerovio = verovioModule.default
      } else if (typeof verovioModule.createVerovio === 'function') {
        createVerovio = verovioModule.createVerovio
      }
      
      // 如果有初始化函数，先调用
      if (createVerovio) {
        await createVerovio()
      }
      
      // 获取 VerovioToolkit 构造函数
      const VerovioToolkit = verovioModule.VerovioToolkit || verovioModule.default?.VerovioToolkit
      
      if (!VerovioToolkit) {
        throw new Error('无法找到 VerovioToolkit 构造函数')
      }
      
      this.toolkit = new VerovioToolkit({
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
        
        // 确保 SVG 有正确的尺寸
        const svgElement = pageDiv.querySelector('svg')
        if (svgElement) {
          svgElement.style.width = '100%'
          svgElement.style.height = 'auto'
          svgElement.style.maxWidth = '1200px'
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
    if (this.container) {
      this.container.innerHTML = ''
    }
    this.toolkit = null
    this.container = null
  }
}

// 注册到工厂
RendererFactory.register('verovio', () => new VerovioRenderer())
