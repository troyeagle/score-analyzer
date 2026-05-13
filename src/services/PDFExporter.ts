import type { PDFExportConfig } from '../types'

export class PDFExporter {
  private config: PDFExportConfig

  constructor(config?: Partial<PDFExportConfig>) {
    this.config = {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: 20,
        bottom: 20,
        left: 15,
        right: 15
      },
      includeAnnotations: true,
      ...config
    }
  }

  /**
   * 导出PDF（使用浏览器打印功能）
   */
  async exportToPDF(container: HTMLElement): Promise<Blob> {
    // 创建打印样式
    const printStyle = document.createElement('style')
    printStyle.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-area, .print-area * {
          visibility: visible;
        }
        .print-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        @page {
          size: ${this.getPageDimensions()};
          margin: ${this.config.margins.top}mm ${this.config.margins.right}mm ${this.config.margins.bottom}mm ${this.config.margins.left}mm;
        }
      }
    `
    document.head.appendChild(printStyle)

    // 创建打印区域
    const printArea = document.createElement('div')
    printArea.className = 'print-area'
    printArea.innerHTML = container.innerHTML
    document.body.appendChild(printArea)

    // 触发打印
    window.print()

    // 清理
    document.head.removeChild(printStyle)
    document.body.removeChild(printArea)

    // 返回一个空的Blob（实际PDF通过打印对话框保存）
    return new Blob(['PDF通过打印对话框导出'], { type: 'application/pdf' })
  }

  /**
   * 生成PDF预览
   */
  generatePreview(container: HTMLElement): HTMLElement {
    const preview = document.createElement('div')
    preview.style.width = this.getPageWidth() + 'px'
    preview.style.height = this.getPageHeight() + 'px'
    preview.style.padding = `${this.config.margins.top}mm ${this.config.margins.right}mm ${this.config.margins.bottom}mm ${this.config.margins.left}mm`
    preview.style.boxSizing = 'border-box'
    preview.style.overflow = 'hidden'
    preview.style.backgroundColor = 'white'
    preview.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.1)'
    
    preview.innerHTML = container.innerHTML
    
    return preview
  }

  /**
   * 获取页面尺寸
   */
  private getPageDimensions(): string {
    const dimensions = {
      'A4': this.config.orientation === 'portrait' ? '210mm 297mm' : '297mm 210mm',
      'A3': this.config.orientation === 'portrait' ? '297mm 420mm' : '420mm 297mm',
      'Letter': this.config.orientation === 'portrait' ? '8.5in 11in' : '11in 8.5in'
    }
    
    return dimensions[this.config.pageSize]
  }

  /**
   * 获取页面宽度（像素）
   */
  private getPageWidth(): number {
    const widths = {
      'A4': this.config.orientation === 'portrait' ? 794 : 1123,
      'A3': this.config.orientation === 'portrait' ? 1123 : 1587,
      'Letter': this.config.orientation === 'portrait' ? 816 : 1056
    }
    
    return widths[this.config.pageSize]
  }

  /**
   * 获取页面高度（像素）
   */
  private getPageHeight(): number {
    const heights = {
      'A4': this.config.orientation === 'portrait' ? 1123 : 794,
      'A3': this.config.orientation === 'portrait' ? 1587 : 1123,
      'Letter': this.config.orientation === 'portrait' ? 1056 : 816
    }
    
    return heights[this.config.pageSize]
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<PDFExportConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 获取配置
   */
  getConfig(): PDFExportConfig {
    return { ...this.config }
  }
}

// 导出单例实例
export const pdfExporter = new PDFExporter()