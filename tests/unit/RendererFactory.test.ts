import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RendererFactory, type ScoreRenderer } from '../../src/services/renderers'

// 创建模拟渲染器
function createMockRenderer(id: string): ScoreRenderer {
  return {
    name: `Mock ${id}`,
    description: `Mock renderer for ${id}`,
    initialize: vi.fn().mockResolvedValue(undefined),
    loadMusicXML: vi.fn().mockResolvedValue(undefined),
    render: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn()
  }
}

// 创建模拟渲染器工厂
function createMockRendererFactory(id: string) {
  return vi.fn().mockImplementation(() => createMockRenderer(id))
}

describe('RendererFactory', () => {
  // 清理注册的渲染器
  beforeEach(() => {
    // 注意：RendererFactory 使用静态 Map，测试间会共享状态
    // 在实际项目中，应该提供 reset 方法或使用依赖注入
  })

  describe('register', () => {
    it('should register a renderer factory', () => {
      const factory = createMockRendererFactory('test')
      
      RendererFactory.register('test', factory)
      
      const renderer = RendererFactory.create('test')
      expect(renderer).not.toBeNull()
      expect(renderer?.name).toBe('Mock test')
    })

    it('should overwrite existing renderer with same id', () => {
      const factory1 = createMockRendererFactory('test1')
      const factory2 = createMockRendererFactory('test2')
      
      RendererFactory.register('overwrite', factory1)
      RendererFactory.register('overwrite', factory2)
      
      const renderer = RendererFactory.create('overwrite')
      expect(renderer?.name).toBe('Mock test2')
    })
  })

  describe('create', () => {
    it('should create renderer by id', () => {
      const factory = createMockRendererFactory('create-test')
      RendererFactory.register('create-test', factory)
      
      const renderer = RendererFactory.create('create-test')
      
      expect(renderer).not.toBeNull()
      expect(factory).toHaveBeenCalledOnce()
    })

    it('should return null for non-existent renderer', () => {
      const renderer = RendererFactory.create('nonexistent')
      expect(renderer).toBeNull()
    })

    it('should create new instance each time', () => {
      const factory = createMockRendererFactory('new-instance')
      RendererFactory.register('new-instance', factory)
      
      const renderer1 = RendererFactory.create('new-instance')
      const renderer2 = RendererFactory.create('new-instance')
      
      expect(renderer1).not.toBe(renderer2)
      expect(factory).toHaveBeenCalledTimes(2)
    })
  })

  describe('getAvailableRenderers', () => {
    it('should return list of available renderers', () => {
      // 注册一些测试渲染器
      RendererFactory.register('list-test-1', createMockRendererFactory('list1'))
      RendererFactory.register('list-test-2', createMockRendererFactory('list2'))
      
      const renderers = RendererFactory.getAvailableRenderers()
      
      // 检查我们注册的渲染器在列表中
      const ids = renderers.map(r => r.id)
      expect(ids).toContain('list-test-1')
      expect(ids).toContain('list-test-2')
    })

    it('should return renderer info with id, name, description', () => {
      RendererFactory.register('info-test', createMockRendererFactory('info'))
      
      const renderers = RendererFactory.getAvailableRenderers()
      const infoTest = renderers.find(r => r.id === 'info-test')
      
      expect(infoTest).toBeDefined()
      expect(infoTest?.name).toBe('Mock info')
      expect(infoTest?.description).toBe('Mock renderer for info')
    })
  })
})

describe('ScoreRenderer interface', () => {
  it('should have required methods', () => {
    const renderer = createMockRenderer('interface-test')
    
    expect(renderer.initialize).toBeInstanceOf(Function)
    expect(renderer.loadMusicXML).toBeInstanceOf(Function)
    expect(renderer.render).toBeInstanceOf(Function)
    expect(renderer.destroy).toBeInstanceOf(Function)
  })

  it('should have required properties', () => {
    const renderer = createMockRenderer('props-test')
    
    expect(renderer.name).toBe('Mock props-test')
    expect(renderer.description).toBe('Mock renderer for props-test')
  })
})

// 测试实际渲染器的注册
describe('Renderer registrations', () => {
  // 导入渲染器模块会触发注册
  beforeEach(async () => {
    await import('../../src/services/renderers/OSMDRenderer')
    await import('../../src/services/renderers/VerovioRenderer')
    await import('../../src/services/renderers/AbcjsRenderer')
  })

  it('should have OSMD renderer registered', () => {
    const renderer = RendererFactory.create('osmd')
    expect(renderer).not.toBeNull()
    expect(renderer?.name).toBe('OpenSheetMusicDisplay')
  })

  it('should have Verovio renderer registered', () => {
    const renderer = RendererFactory.create('verovio')
    expect(renderer).not.toBeNull()
    expect(renderer?.name).toBe('Verovio')
  })

  it('should have abcjs renderer registered', () => {
    const renderer = RendererFactory.create('abcjs')
    expect(renderer).not.toBeNull()
    expect(renderer?.name).toBe('abcjs')
  })

  it('should list all three renderers', () => {
    const renderers = RendererFactory.getAvailableRenderers()
    const ids = renderers.map(r => r.id)
    
    expect(ids).toContain('osmd')
    expect(ids).toContain('verovio')
    expect(ids).toContain('abcjs')
  })
})
