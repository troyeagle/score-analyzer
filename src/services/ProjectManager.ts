import type { ProjectData, LayoutConfig, Annotation, AnnotationLayer, PresentationStep } from '../types'
import { v4 as uuidv4 } from 'uuid'

export class ProjectManager {
  private currentProject: ProjectData | null = null

  /**
   * 创建新项目
   */
  createProject(name: string, musicXML: string): ProjectData {
    const project: ProjectData = {
      id: uuidv4(),
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      musicXML,
      layoutConfig: {
        pageWidth: 800,
        pageHeight: 1100,
        marginTop: 50,
        marginBottom: 50,
        marginLeft: 40,
        marginRight: 40,
        staveSpacing: 80,
        systemSpacing: 100,
        measurePadding: 10
      },
      layers: [
        {
          id: 'structural',
          name: '基础结构层',
          type: 'structural',
          level: 'basic',
          visible: true,
          opacity: 100,
          annotations: []
        },
        {
          id: 'motivic',
          name: '动机层',
          type: 'motivic',
          level: 'advanced',
          visible: false,
          opacity: 80,
          annotations: []
        },
        {
          id: 'harmonic',
          name: '和声层',
          type: 'harmonic',
          level: 'advanced',
          visible: false,
          opacity: 80,
          annotations: []
        },
        {
          id: 'annotation',
          name: '注释层',
          type: 'annotation',
          level: 'professional',
          visible: false,
          opacity: 80,
          annotations: []
        }
      ],
      presentationSteps: [
        {
          id: 'score',
          order: 0,
          name: '乐谱展示',
          description: '首先展示完整的乐谱，让观众对整体结构有初步认识。',
          layerIds: [],
          duration: 3000
        },
        {
          id: 'structure',
          order: 1,
          name: '基础结构层',
          description: '显示奏鸣曲式的三个主要部分：呈示部、展开部、再现部。',
          layerIds: ['structural'],
          duration: 5000
        },
        {
          id: 'motivic',
          order: 2,
          name: '动机层',
          description: '展示主要动机及其发展变化，揭示音乐材料的运用。',
          layerIds: ['structural', 'motivic'],
          duration: 5000
        },
        {
          id: 'harmonic',
          order: 3,
          name: '和声层',
          description: '显示和声进行、调性布局，包括DCML标准标注。',
          layerIds: ['structural', 'motivic', 'harmonic'],
          duration: 5000
        },
        {
          id: 'full',
          order: 4,
          name: '完整分析',
          description: '展示所有标注层，包括注释层，呈现完整的分析结果。',
          layerIds: ['structural', 'motivic', 'harmonic', 'annotation'],
          duration: 5000
        }
      ]
    }

    this.currentProject = project
    return project
  }

  /**
   * 加载项目
   */
  async loadProject(file: File): Promise<ProjectData> {
    const content = await this.readFileContent(file)
    const project = JSON.parse(content) as ProjectData
    
    // 验证项目数据
    if (!this.validateProject(project)) {
      throw new Error('无效的项目文件格式')
    }
    
    // 转换日期字符串为Date对象
    project.createdAt = new Date(project.createdAt)
    project.updatedAt = new Date(project.updatedAt)
    
    this.currentProject = project
    return project
  }

  /**
   * 保存项目
   */
  saveProject(project: ProjectData): void {
    project.updatedAt = new Date()
    this.currentProject = project
    
    // 保存到本地存储
    this.saveToLocalStorage(project)
  }

  /**
   * 导出项目
   */
  exportProject(project: ProjectData): Blob {
    const content = JSON.stringify(project, null, 2)
    return new Blob([content], { type: 'application/json' })
  }

  /**
   * 获取当前项目
   */
  getCurrentProject(): ProjectData | null {
    return this.currentProject
  }

  /**
   * 更新排版配置
   */
  updateLayoutConfig(config: Partial<LayoutConfig>): void {
    if (!this.currentProject) return
    
    this.currentProject.layoutConfig = {
      ...this.currentProject.layoutConfig,
      ...config
    }
    this.currentProject.updatedAt = new Date()
  }

  /**
   * 更新标注
   */
  updateAnnotation(annotation: Annotation): void {
    if (!this.currentProject) return
    
    // 查找并更新标注
    for (const layer of this.currentProject.layers) {
      const index = layer.annotations.findIndex(a => a.id === annotation.id)
      if (index !== -1) {
        layer.annotations[index] = annotation
        break
      }
    }
    
    this.currentProject.updatedAt = new Date()
  }

  /**
   * 添加标注
   */
  addAnnotation(annotation: Annotation): void {
    if (!this.currentProject) return
    
    // 查找对应的图层
    const layer = this.currentProject.layers.find(l => l.type === annotation.type)
    if (layer) {
      layer.annotations.push(annotation)
      this.currentProject.updatedAt = new Date()
    }
  }

  /**
   * 删除标注
   */
  removeAnnotation(annotationId: string): void {
    if (!this.currentProject) return
    
    // 从所有图层中删除标注
    for (const layer of this.currentProject.layers) {
      layer.annotations = layer.annotations.filter(a => a.id !== annotationId)
    }
    
    this.currentProject.updatedAt = new Date()
  }

  /**
   * 更新图层
   */
  updateLayer(layer: AnnotationLayer): void {
    if (!this.currentProject) return
    
    const index = this.currentProject.layers.findIndex(l => l.id === layer.id)
    if (index !== -1) {
      this.currentProject.layers[index] = layer
      this.currentProject.updatedAt = new Date()
    }
  }

  /**
   * 更新演示步骤
   */
  updatePresentationSteps(steps: PresentationStep[]): void {
    if (!this.currentProject) return
    
    this.currentProject.presentationSteps = steps
    this.currentProject.updatedAt = new Date()
  }

  /**
   * 读取文件内容
   */
  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          resolve(result)
        } else {
          reject(new Error('无法读取文件内容'))
        }
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsText(file)
    })
  }

  /**
   * 验证项目数据
   */
  private validateProject(project: any): boolean {
    return (
      project &&
      typeof project.id === 'string' &&
      typeof project.name === 'string' &&
      project.createdAt &&
      project.updatedAt &&
      typeof project.musicXML === 'string' &&
      project.layoutConfig &&
      Array.isArray(project.layers) &&
      Array.isArray(project.presentationSteps)
    )
  }

  /**
   * 保存到本地存储
   */
  private saveToLocalStorage(project: ProjectData): void {
    try {
      const key = `project_${project.id}`
      localStorage.setItem(key, JSON.stringify(project))
    } catch (error) {
      console.error('保存到本地存储失败:', error)
    }
  }

  /**
   * 从本地存储加载
   */
  loadFromLocalStorage(projectId: string): ProjectData | null {
    try {
      const key = `project_${projectId}`
      const content = localStorage.getItem(key)
      if (!content) return null
      
      const project = JSON.parse(content) as ProjectData
      project.createdAt = new Date(project.createdAt)
      project.updatedAt = new Date(project.updatedAt)
      
      return project
    } catch (error) {
      console.error('从本地存储加载失败:', error)
      return null
    }
  }

  /**
   * 获取所有本地项目
   */
  getAllLocalProjects(): ProjectData[] {
    const projects: ProjectData[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('project_')) {
        const content = localStorage.getItem(key)
        if (content) {
          try {
            const project = JSON.parse(content) as ProjectData
            project.createdAt = new Date(project.createdAt)
            project.updatedAt = new Date(project.updatedAt)
            projects.push(project)
          } catch (error) {
            console.error('解析项目数据失败:', error)
          }
        }
      }
    }
    
    return projects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  /**
   * 删除本地项目
   */
  deleteLocalProject(projectId: string): void {
    const key = `project_${projectId}`
    localStorage.removeItem(key)
    
    if (this.currentProject?.id === projectId) {
      this.currentProject = null
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.currentProject = null
  }
}

// 导出单例实例
export const projectManager = new ProjectManager()