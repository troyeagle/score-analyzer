import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AnnotationEngine } from '../../src/services/AnnotationEngine'
import type { Annotation, AnnotationLayer } from '../../src/types'

// 模拟Canvas API
const mockContext = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 100 }),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  setLineDash: vi.fn(),
  scale: vi.fn(),
  translate: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  canvas: {} as HTMLCanvasElement,
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'left',
  textBaseline: 'alphabetic',
  globalAlpha: 1
}

// 模拟HTMLCanvasElement
class MockHTMLCanvasElement {
  width = 800
  height = 600
  style = {
    position: '',
    top: '',
    left: '',
    pointerEvents: '',
    zIndex: '',
    width: '',
    height: ''
  }
  
  getContext() {
    return mockContext
  }
}

describe('AnnotationEngine', () => {
  let annotationEngine: AnnotationEngine
  let container: HTMLElement

  beforeEach(() => {
    // 创建模拟的DOM容器
    container = document.createElement('div')
    container.style.width = '800px'
    container.style.height = '600px'
    document.body.appendChild(container)
    
    // 模拟document.createElement
    const originalCreateElement = document.createElement.bind(document)
    document.createElement = vi.fn().mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return new MockHTMLCanvasElement() as unknown as HTMLElement
      }
      return originalCreateElement(tagName)
    })
    
    annotationEngine = new AnnotationEngine()
  })

  afterEach(() => {
    // 清理
    annotationEngine.destroy()
    document.body.removeChild(container)
    
    // 恢复原始createElement
    vi.restoreAllMocks()
  })

  describe('initialize', () => {
    it('应该初始化Canvas', () => {
      annotationEngine.initialize(container)
      
      // 验证Canvas元素被创建
      expect(document.createElement).toHaveBeenCalledWith('canvas')
    })
  })

  describe('addLayer', () => {
    it('应该添加图层', () => {
      annotationEngine.initialize(container)
      
      const layer: AnnotationLayer = {
        id: 'test-layer',
        name: '测试图层',
        type: 'structural',
        level: 'basic',
        visible: true,
        opacity: 100,
        annotations: []
      }
      
      annotationEngine.addLayer(layer)
      
      const layers = annotationEngine.getAllLayers()
      expect(layers).toHaveLength(1)
      expect(layers[0].id).toBe('test-layer')
    })
  })

  describe('removeLayer', () => {
    it('应该移除图层', () => {
      annotationEngine.initialize(container)
      
      const layer: AnnotationLayer = {
        id: 'test-layer',
        name: '测试图层',
        type: 'structural',
        level: 'basic',
        visible: true,
        opacity: 100,
        annotations: []
      }
      
      annotationEngine.addLayer(layer)
      annotationEngine.removeLayer('test-layer')
      
      const layers = annotationEngine.getAllLayers()
      expect(layers).toHaveLength(0)
    })
  })

  describe('toggleLayer', () => {
    it('应该切换图层可见性', () => {
      annotationEngine.initialize(container)
      
      const layer: AnnotationLayer = {
        id: 'test-layer',
        name: '测试图层',
        type: 'structural',
        level: 'basic',
        visible: true,
        opacity: 100,
        annotations: []
      }
      
      annotationEngine.addLayer(layer)
      
      // 初始状态为可见
      expect(annotationEngine.getLayer('test-layer')?.visible).toBe(true)
      
      // 切换为不可见
      annotationEngine.toggleLayer('test-layer', false)
      expect(annotationEngine.getLayer('test-layer')?.visible).toBe(false)
      
      // 切换为可见
      annotationEngine.toggleLayer('test-layer', true)
      expect(annotationEngine.getLayer('test-layer')?.visible).toBe(true)
    })
  })

  describe('setLayerOpacity', () => {
    it('应该设置图层透明度', () => {
      annotationEngine.initialize(container)
      
      const layer: AnnotationLayer = {
        id: 'test-layer',
        name: '测试图层',
        type: 'structural',
        level: 'basic',
        visible: true,
        opacity: 100,
        annotations: []
      }
      
      annotationEngine.addLayer(layer)
      
      // 设置透明度
      annotationEngine.setLayerOpacity('test-layer', 50)
      expect(annotationEngine.getLayer('test-layer')?.opacity).toBe(50)
    })
    
    it('应该限制透明度范围', () => {
      annotationEngine.initialize(container)
      
      const layer: AnnotationLayer = {
        id: 'test-layer',
        name: '测试图层',
        type: 'structural',
        level: 'basic',
        visible: true,
        opacity: 100,
        annotations: []
      }
      
      annotationEngine.addLayer(layer)
      
      // 测试边界值
      annotationEngine.setLayerOpacity('test-layer', 150)
      expect(annotationEngine.getLayer('test-layer')?.opacity).toBe(100)
      
      annotationEngine.setLayerOpacity('test-layer', -10)
      expect(annotationEngine.getLayer('test-layer')?.opacity).toBe(0)
    })
  })

  describe('addAnnotationToLayer', () => {
    it('应该添加标注到图层', () => {
      annotationEngine.initialize(container)
      
      const layer: AnnotationLayer = {
        id: 'test-layer',
        name: '测试图层',
        type: 'structural',
        level: 'basic',
        visible: true,
        opacity: 100,
        annotations: []
      }
      
      annotationEngine.addLayer(layer)
      
      const annotation: Annotation = {
        id: 'test-annotation',
        type: 'structural',
        level: 'basic',
        startMeasure: 1,
        endMeasure: 1,
        content: '测试标注',
        style: {
          color: '#ffffff',
          backgroundColor: 'rgba(64, 158, 255, 0.2)',
          borderColor: '#409eff',
          borderWidth: 2,
          fontSize: 14,
          fontFamily: 'Arial, sans-serif'
        }
      }
      
      annotationEngine.addAnnotationToLayer('test-layer', annotation)
      
      const layerAnnotations = annotationEngine.getLayer('test-layer')?.annotations
      expect(layerAnnotations).toHaveLength(1)
      expect(layerAnnotations?.[0].id).toBe('test-annotation')
    })
  })

  describe('removeAnnotationFromLayer', () => {
    it('应该从图层移除标注', () => {
      annotationEngine.initialize(container)
      
      const layer: AnnotationLayer = {
        id: 'test-layer',
        name: '测试图层',
        type: 'structural',
        level: 'basic',
        visible: true,
        opacity: 100,
        annotations: []
      }
      
      annotationEngine.addLayer(layer)
      
      const annotation: Annotation = {
        id: 'test-annotation',
        type: 'structural',
        level: 'basic',
        startMeasure: 1,
        endMeasure: 1,
        content: '测试标注',
        style: {
          color: '#ffffff',
          backgroundColor: 'rgba(64, 158, 255, 0.2)',
          borderColor: '#409eff',
          borderWidth: 2,
          fontSize: 14,
          fontFamily: 'Arial, sans-serif'
        }
      }
      
      annotationEngine.addAnnotationToLayer('test-layer', annotation)
      annotationEngine.removeAnnotationFromLayer('test-layer', 'test-annotation')
      
      const layerAnnotations = annotationEngine.getLayer('test-layer')?.annotations
      expect(layerAnnotations).toHaveLength(0)
    })
  })

  describe('clearLayer', () => {
    it('应该清空图层', () => {
      annotationEngine.initialize(container)
      
      const layer: AnnotationLayer = {
        id: 'test-layer',
        name: '测试图层',
        type: 'structural',
        level: 'basic',
        visible: true,
        opacity: 100,
        annotations: []
      }
      
      annotationEngine.addLayer(layer)
      
      // 添加一些标注
      for (let i = 0; i < 5; i++) {
        const annotation: Annotation = {
          id: `annotation-${i}`,
          type: 'structural',
          level: 'basic',
          startMeasure: i + 1,
          endMeasure: i + 1,
          content: `标注 ${i}`,
          style: {
            color: '#ffffff',
            backgroundColor: 'rgba(64, 158, 255, 0.2)',
            borderColor: '#409eff',
            borderWidth: 2,
            fontSize: 14,
            fontFamily: 'Arial, sans-serif'
          }
        }
        annotationEngine.addAnnotationToLayer('test-layer', annotation)
      }
      
      expect(annotationEngine.getLayer('test-layer')?.annotations).toHaveLength(5)
      
      annotationEngine.clearLayer('test-layer')
      
      expect(annotationEngine.getLayer('test-layer')?.annotations).toHaveLength(0)
    })
  })

  describe('clearAllLayers', () => {
    it('应该清空所有图层', () => {
      annotationEngine.initialize(container)
      
      // 添加多个图层
      for (let i = 0; i < 3; i++) {
        const layer: AnnotationLayer = {
          id: `layer-${i}`,
          name: `图层 ${i}`,
          type: 'structural',
          level: 'basic',
          visible: true,
          opacity: 100,
          annotations: []
        }
        annotationEngine.addLayer(layer)
        
        // 添加标注
        const annotation: Annotation = {
          id: `annotation-${i}`,
          type: 'structural',
          level: 'basic',
          startMeasure: 1,
          endMeasure: 1,
          content: `标注 ${i}`,
          style: {
            color: '#ffffff',
            backgroundColor: 'rgba(64, 158, 255, 0.2)',
            borderColor: '#409eff',
            borderWidth: 2,
            fontSize: 14,
            fontFamily: 'Arial, sans-serif'
          }
        }
        annotationEngine.addAnnotationToLayer(`layer-${i}`, annotation)
      }
      
      expect(annotationEngine.getAllLayers()).toHaveLength(3)
      
      annotationEngine.clearAllLayers()
      
      // 验证所有图层的标注都被清空
      annotationEngine.getAllLayers().forEach(layer => {
        expect(layer.annotations).toHaveLength(0)
      })
    })
  })
})