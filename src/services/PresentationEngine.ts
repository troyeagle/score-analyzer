import type { PresentationStep, AnnotationLayer } from '../types'

export class PresentationEngine {
  private steps: PresentationStep[] = []
  private currentStepIndex: number = 0
  private isPlaying: boolean = false
  private playSpeed: number = 2
  private playInterval: number | null = null
  private onStepChange: ((step: PresentationStep, index: number) => void) | null = null
  private onPlayStateChange: ((isPlaying: boolean) => void) | null = null

  /**
   * 初始化演示引擎
   */
  initialize(steps: PresentationStep[]): void {
    this.steps = [...steps].sort((a, b) => a.order - b.order)
    this.currentStepIndex = 0
    this.isPlaying = false
    this.stopAutoPlay()
  }

  /**
   * 获取所有步骤
   */
  getSteps(): PresentationStep[] {
    return [...this.steps]
  }

  /**
   * 获取当前步骤
   */
  getCurrentStep(): PresentationStep | null {
    if (this.steps.length === 0) return null
    return this.steps[this.currentStepIndex]
  }

  /**
   * 获取当前步骤索引
   */
  getCurrentStepIndex(): number {
    return this.currentStepIndex
  }

  /**
   * 跳转到指定步骤
   */
  goToStep(index: number): void {
    if (index < 0 || index >= this.steps.length) return
    
    this.currentStepIndex = index
    this.notifyStepChange()
  }

  /**
   * 下一步
   */
  nextStep(): void {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++
      this.notifyStepChange()
    } else {
      this.stopAutoPlay()
      this.isPlaying = false
      this.notifyPlayStateChange()
    }
  }

  /**
   * 上一步
   */
  previousStep(): void {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--
      this.notifyStepChange()
    }
  }

  /**
   * 开始播放
   */
  play(): void {
    if (this.isPlaying) return
    
    this.isPlaying = true
    this.notifyPlayStateChange()
    this.startAutoPlay()
  }

  /**
   * 暂停播放
   */
  pause(): void {
    if (!this.isPlaying) return
    
    this.isPlaying = false
    this.notifyPlayStateChange()
    this.stopAutoPlay()
  }

  /**
   * 停止播放
   */
  stop(): void {
    this.isPlaying = false
    this.currentStepIndex = 0
    this.notifyPlayStateChange()
    this.notifyStepChange()
    this.stopAutoPlay()
  }

  /**
   * 切换播放状态
   */
  togglePlay(): void {
    if (this.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  /**
   * 设置播放速度
   */
  setSpeed(speed: number): void {
    this.playSpeed = Math.max(1, Math.min(5, speed))
    
    // 如果正在播放，重新启动自动播放以应用新速度
    if (this.isPlaying) {
      this.stopAutoPlay()
      this.startAutoPlay()
    }
  }

  /**
   * 获取播放速度
   */
  getSpeed(): number {
    return this.playSpeed
  }

  /**
   * 检查是否正在播放
   */
  getIsPlaying(): boolean {
    return this.isPlaying
  }

  /**
   * 获取总步骤数
   */
  getTotalSteps(): number {
    return this.steps.length
  }

  /**
   * 检查是否为第一步
   */
  isFirstStep(): boolean {
    return this.currentStepIndex === 0
  }

  /**
   * 检查是否为最后一步
   */
  isLastStep(): boolean {
    return this.currentStepIndex === this.steps.length - 1
  }

  /**
   * 获取当前步骤应显示的图层ID
   */
  getCurrentLayerIds(): string[] {
    const currentStep = this.getCurrentStep()
    return currentStep ? currentStep.layerIds : []
  }

  /**
   * 获取当前步骤应显示的图层
   */
  getCurrentLayers(allLayers: AnnotationLayer[]): AnnotationLayer[] {
    const layerIds = this.getCurrentLayerIds()
    return allLayers.filter(layer => layerIds.includes(layer.id))
  }

  /**
   * 设置步骤变化回调
   */
  setOnStepChange(callback: (step: PresentationStep, index: number) => void): void {
    this.onStepChange = callback
  }

  /**
   * 设置播放状态变化回调
   */
  setOnPlayStateChange(callback: (isPlaying: boolean) => void): void {
    this.onPlayStateChange = callback
  }

  /**
   * 通知步骤变化
   */
  private notifyStepChange(): void {
    const currentStep = this.getCurrentStep()
    if (currentStep && this.onStepChange) {
      this.onStepChange(currentStep, this.currentStepIndex)
    }
  }

  /**
   * 通知播放状态变化
   */
  private notifyPlayStateChange(): void {
    if (this.onPlayStateChange) {
      this.onPlayStateChange(this.isPlaying)
    }
  }

  /**
   * 开始自动播放
   */
  private startAutoPlay(): void {
    const speed = 6 - this.playSpeed // 1=慢, 5=快
    const interval = speed * 1000
    
    this.playInterval = window.setInterval(() => {
      this.nextStep()
    }, interval)
  }

  /**
   * 停止自动播放
   */
  private stopAutoPlay(): void {
    if (this.playInterval) {
      clearInterval(this.playInterval)
      this.playInterval = null
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stopAutoPlay()
    this.steps = []
    this.currentStepIndex = 0
    this.isPlaying = false
    this.onStepChange = null
    this.onPlayStateChange = null
  }
}

// 导出单例实例
export const presentationEngine = new PresentationEngine()