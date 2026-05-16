import type { ScoreRenderer } from './index'
import { RendererFactory } from './index'

export class OSMDRenderer implements ScoreRenderer {
  name = 'OpenSheetMusicDisplay'
  description = '最流行的开源 MusicXML 渲染库，基于 VexFlow，渲染质量优秀'

  private osmd: any = null
  private container: HTMLElement | null = null

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container
    container.innerHTML = ''

    try {
      const OSMD = await import('opensheetmusicdisplay')
      this.osmd = new OSMD.OpenSheetMusicDisplay(container, {
        autoResize: true,
        backend: 'svg',
        drawTitle: true,
        drawSubtitle: true,
        drawComposer: true,
        drawCredits: true,
        drawPartNames: true,
        drawPartAbbreviations: true,
        drawFingerings: true,
        drawMeasureNumbers: true,
        drawMetronomeMarks: true,
        drawTimeSignatures: true,
        drawKeySignatures: true,
        drawSlurs: true,
        drawTies: true,
        drawDynamics: true,
        drawExpressions: true,
        drawOrnaments: true,
        drawPedals: true,
        drawRehearsalMarks: true,
        drawStems: true,
        drawBeamStyles: true,
        drawGraceNotes: true,
        drawChordSymbols: true,
        drawStafflines: true
      })
      console.log('[OSMD] 初始化成功')
    } catch (error) {
      console.error('[OSMD] 初始化失败:', error)
      throw error
    }
  }

  async loadMusicXML(xml: string): Promise<void> {
    if (!this.osmd) {
      throw new Error('OSMD 未初始化')
    }

    try {
      await this.osmd.load(xml)
      console.log('[OSMD] MusicXML 加载成功')
    } catch (error) {
      console.error('[OSMD] MusicXML 加载失败:', error)
      throw error
    }
  }

  async render(): Promise<void> {
    if (!this.osmd) {
      throw new Error('OSMD 未初始化')
    }

    try {
      this.osmd.render()
      console.log('[OSMD] 渲染完成')
    } catch (error) {
      console.error('[OSMD] 渲染失败:', error)
      throw error
    }
  }

  destroy(): void {
    if (this.container) {
      this.container.innerHTML = ''
    }
    this.osmd = null
    this.container = null
  }
}

// 注册到工厂
RendererFactory.register('osmd', () => new OSMDRenderer())