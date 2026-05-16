// 乐谱渲染器接口
export interface ScoreRenderer {
  name: string
  description: string
  initialize(container: HTMLElement): Promise<void>
  loadMusicXML(xml: string): Promise<void>
  render(): Promise<void>
  destroy(): void
}

// 渲染器工厂
export class RendererFactory {
  private static renderers: Map<string, () => ScoreRenderer> = new Map()

  static register(id: string, factory: () => ScoreRenderer): void {
    this.renderers.set(id, factory)
  }

  static create(id: string): ScoreRenderer | null {
    const factory = this.renderers.get(id)
    return factory ? factory() : null
  }

  static getAvailableRenderers(): Array<{ id: string; name: string; description: string }> {
    const result: Array<{ id: string; name: string; description: string }> = []
    this.renderers.forEach((factory, id) => {
      const instance = factory()
      result.push({
        id,
        name: instance.name,
        description: instance.description
      })
    })
    return result
  }
}