import type { 
  Annotation, 
  AnnotationLayer, 
  AnnotationStyle,
  StaveLayout,
  MeasureLayout
} from '../types'

export class AnnotationEngine {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private layers: Map<string, AnnotationLayer> = new Map()
  private container: HTMLElement | null = null

  /**
   * 初始化标注引擎
   */
  initialize(container: HTMLElement): void {
    this.container = container
    
    // 创建Canvas元素
    this.canvas = document.createElement('canvas')
    this.canvas.style.position = 'absolute'
    this.canvas.style.top = '0'
    this.canvas.style.left = '0'
    this.canvas.style.pointerEvents = 'none'
    this.canvas.style.zIndex = '10'
    
    container.style.position = 'relative'
    container.appendChild(this.canvas)
    
    this.ctx = this.canvas.getContext('2d')
    this.resizeCanvas()
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => this.resizeCanvas())
  }

  /**
   * 调整Canvas大小
   */
  private resizeCanvas(): void {
    if (!this.canvas || !this.container) return
    
    const rect = this.container.getBoundingClientRect()
    this.canvas.width = rect.width
    this.canvas.height = rect.height
    this.canvas.style.width = `${rect.width}px`
    this.canvas.style.height = `${rect.height}px`
  }

  /**
   * 添加标注图层
   */
  addLayer(layer: AnnotationLayer): void {
    this.layers.set(layer.id, layer)
    this.render()
  }

  /**
   * 移除标注图层
   */
  removeLayer(layerId: string): void {
    this.layers.delete(layerId)
    this.render()
  }

  /**
   * 获取图层
   */
  getLayer(layerId: string): AnnotationLayer | undefined {
    return this.layers.get(layerId)
  }

  /**
   * 获取所有图层
   */
  getAllLayers(): AnnotationLayer[] {
    return Array.from(this.layers.values())
  }

  /**
   * 切换图层可见性
   */
  toggleLayer(layerId: string, visible: boolean): void {
    const layer = this.layers.get(layerId)
    if (layer) {
      layer.visible = visible
      this.render()
    }
  }

  /**
   * 设置图层透明度
   */
  setLayerOpacity(layerId: string, opacity: number): void {
    const layer = this.layers.get(layerId)
    if (layer) {
      layer.opacity = Math.max(0, Math.min(100, opacity))
      this.render()
    }
  }

  /**
   * 渲染所有可见图层
   */
  render(): void {
    if (!this.ctx || !this.canvas) return
    
    // 清空Canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 渲染每个可见图层
    this.layers.forEach(layer => {
      if (layer.visible) {
        this.renderLayer(layer)
      }
    })
  }

  /**
   * 渲染单个图层
   */
  private renderLayer(layer: AnnotationLayer): void {
    if (!this.ctx) return
    
    // 设置透明度
    this.ctx.globalAlpha = layer.opacity / 100
    
    // 渲染图层中的每个标注
    layer.annotations.forEach(annotation => {
      this.renderAnnotation(annotation)
    })
    
    // 重置透明度
    this.ctx.globalAlpha = 1
  }

  /**
   * 渲染单个标注
   */
  renderAnnotation(annotation: Annotation, staveLayouts?: StaveLayout[]): void {
    if (!this.ctx) return
    
    // 根据标注类型选择渲染方法
    switch (annotation.type) {
      case 'structural':
        this.renderStructuralAnnotation(annotation, staveLayouts)
        break
      case 'motivic':
        this.renderMotivicAnnotation(annotation, staveLayouts)
        break
      case 'harmonic':
        this.renderHarmonicAnnotation(annotation, staveLayouts)
        break
      case 'annotation':
        this.renderTextAnnotation(annotation, staveLayouts)
        break
    }
  }

  /**
   * 渲染结构性标注
   */
  private renderStructuralAnnotation(annotation: Annotation, staveLayouts?: StaveLayout[]): void {
    if (!this.ctx) return
    
    // 如果没有提供布局信息，使用默认位置
    const x = 50
    const y = 50
    const width = 200
    const height = 30
    
    // 绘制背景
    this.ctx.fillStyle = annotation.style.backgroundColor
    this.ctx.fillRect(x, y, width, height)
    
    // 绘制边框
    this.ctx.strokeStyle = annotation.style.borderColor
    this.ctx.lineWidth = annotation.style.borderWidth
    this.ctx.strokeRect(x, y, width, height)
    
    // 绘制文本
    this.ctx.fillStyle = annotation.style.color
    this.ctx.font = `${annotation.style.fontSize}px ${annotation.style.fontFamily}`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(annotation.content, x + width / 2, y + height / 2)
  }

  /**
   * 渲染动机性标注
   */
  private renderMotivicAnnotation(annotation: Annotation, staveLayouts?: StaveLayout[]): void {
    if (!this.ctx) return
    
    const x = 50
    const y = 100
    const width = 150
    const height = 20
    
    // 绘制连线
    this.ctx.strokeStyle = annotation.style.borderColor
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([5, 3])
    
    this.ctx.beginPath()
    this.ctx.moveTo(x, y)
    this.ctx.lineTo(x + width, y)
    this.ctx.stroke()
    
    this.ctx.setLineDash([])
    
    // 绘制标签背景
    this.ctx.fillStyle = annotation.style.backgroundColor
    this.ctx.fillRect(x + width / 2 - 30, y + 5, 60, 15)
    
    // 绘制标签文本
    this.ctx.fillStyle = annotation.style.color
    this.ctx.font = `${annotation.style.fontSize}px ${annotation.style.fontFamily}`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'top'
    this.ctx.fillText(annotation.content, x + width / 2, y + 5)
  }

  /**
   * 渲染和声标注
   */
  private renderHarmonicAnnotation(annotation: Annotation, staveLayouts?: StaveLayout[]): void {
    if (!this.ctx) return
    
    const x = 50
    const y = 150
    
    // 测量文本宽度
    this.ctx.font = `bold ${annotation.style.fontSize}px ${annotation.style.fontFamily}`
    const textWidth = this.ctx.measureText(annotation.content).width
    
    // 绘制背景
    this.ctx.fillStyle = annotation.style.backgroundColor
    this.ctx.fillRect(x - textWidth / 2 - 5, y - 5, textWidth + 10, 20)
    
    // 绘制边框
    this.ctx.strokeStyle = annotation.style.borderColor
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(x - textWidth / 2 - 5, y - 5, textWidth + 10, 20)
    
    // 绘制文本
    this.ctx.fillStyle = annotation.style.color
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'top'
    this.ctx.fillText(annotation.content, x, y)
  }

  /**
   * 渲染文本标注
   */
  private renderTextAnnotation(annotation: Annotation, staveLayouts?: StaveLayout[]): void {
    if (!this.ctx) return
    
    const x = 50
    const y = 200
    
    // 测量文本宽度
    this.ctx.font = `${annotation.style.fontSize}px ${annotation.style.fontFamily}`
    const textWidth = this.ctx.measureText(annotation.content).width
    
    // 绘制背景
    this.ctx.fillStyle = annotation.style.backgroundColor
    this.ctx.fillRect(x - textWidth / 2 - 3, y - 3, textWidth + 6, 18)
    
    // 绘制文本
    this.ctx.fillStyle = annotation.style.color
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'top'
    this.ctx.fillText(annotation.content, x, y)
  }

  /**
   * 清空指定图层
   */
  clearLayer(layerId: string): void {
    const layer = this.layers.get(layerId)
    if (layer) {
      layer.annotations = []
      this.render()
    }
  }

  /**
   * 清空所有图层
   */
  clearAllLayers(): void {
    this.layers.forEach(layer => {
      layer.annotations = []
    })
    this.render()
  }

  /**
   * 添加标注到图层
   */
  addAnnotationToLayer(layerId: string, annotation: Annotation): void {
    const layer = this.layers.get(layerId)
    if (layer) {
      layer.annotations.push(annotation)
      this.render()
    }
  }

  /**
   * 从图层移除标注
   */
  removeAnnotationFromLayer(layerId: string, annotationId: string): void {
    const layer = this.layers.get(layerId)
    if (layer) {
      layer.annotations = layer.annotations.filter(a => a.id !== annotationId)
      this.render()
    }
  }

  /**
   * 更新标注
   */
  updateAnnotation(annotationId: string, updates: Partial<Annotation>): void {
    this.layers.forEach(layer => {
      const index = layer.annotations.findIndex(a => a.id === annotationId)
      if (index !== -1) {
        layer.annotations[index] = { ...layer.annotations[index], ...updates }
      }
    })
    this.render()
  }

  /**
   * 查找标注
   */
  findAnnotation(annotationId: string): Annotation | undefined {
    for (const layer of this.layers.values()) {
      const annotation = layer.annotations.find(a => a.id === annotationId)
      if (annotation) {
        return annotation
      }
    }
    return undefined
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.canvas && this.container && this.container.contains(this.canvas)) {
      try {
        this.container.removeChild(this.canvas)
      } catch (e) {
        // 忽略移除失败的情况
        console.warn('移除canvas失败:', e)
      }
    }
    this.canvas = null
    this.ctx = null
    this.container = null
    this.layers.clear()
    
    window.removeEventListener('resize', () => this.resizeCanvas())
  }
}

// 导出单例实例
export const annotationEngine = new AnnotationEngine()