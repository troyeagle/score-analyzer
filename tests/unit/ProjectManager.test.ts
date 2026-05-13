import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProjectManager } from '../../src/services/ProjectManager'
import type { ProjectData, Annotation } from '../../src/types'

describe('ProjectManager', () => {
  let projectManager: ProjectManager

  beforeEach(() => {
    projectManager = new ProjectManager()
    // 清理localStorage
    localStorage.clear()
  })

  describe('createProject', () => {
    it('应该创建新项目', () => {
      const project = projectManager.createProject('测试项目', '<score-partwise></score-partwise>')
      
      expect(project).toBeDefined()
      expect(project.id).toBeDefined()
      expect(project.name).toBe('测试项目')
      expect(project.musicXML).toBe('<score-partwise></score-partwise>')
      expect(project.createdAt).toBeInstanceOf(Date)
      expect(project.updatedAt).toBeInstanceOf(Date)
      expect(project.layoutConfig).toBeDefined()
      expect(project.layers).toHaveLength(4)
      expect(project.presentationSteps).toHaveLength(5)
    })

    it('应该设置当前项目', () => {
      const project = projectManager.createProject('测试项目', '')
      
      expect(projectManager.getCurrentProject()).toBe(project)
    })
  })

  describe('getCurrentProject', () => {
    it('应该返回当前项目', () => {
      expect(projectManager.getCurrentProject()).toBeNull()
      
      const project = projectManager.createProject('测试项目', '')
      expect(projectManager.getCurrentProject()).toBe(project)
    })
  })

  describe('updateLayoutConfig', () => {
    it('应该更新排版配置', () => {
      projectManager.createProject('测试项目', '')
      
      projectManager.updateLayoutConfig({ staveSpacing: 100 })
      
      const project = projectManager.getCurrentProject()
      expect(project?.layoutConfig.staveSpacing).toBe(100)
    })

    it('应该更新更新时间', () => {
      projectManager.createProject('测试项目', '')
      
      const originalProject = projectManager.getCurrentProject()
      const originalUpdatedAt = originalProject?.updatedAt
      
      // 等待一小段时间确保时间不同
      vi.useFakeTimers()
      vi.advanceTimersByTime(1000)
      
      projectManager.updateLayoutConfig({ staveSpacing: 100 })
      
      const updatedProject = projectManager.getCurrentProject()
      expect(updatedProject?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt?.getTime() || 0)
      
      vi.useRealTimers()
    })
  })

  describe('addAnnotation', () => {
    it('应该添加标注到对应图层', () => {
      projectManager.createProject('测试项目', '')
      
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
      
      projectManager.addAnnotation(annotation)
      
      const project = projectManager.getCurrentProject()
      const structuralLayer = project?.layers.find(l => l.id === 'structural')
      expect(structuralLayer?.annotations).toHaveLength(1)
      expect(structuralLayer?.annotations[0].id).toBe('test-annotation')
    })
  })

  describe('updateAnnotation', () => {
    it('应该更新标注', () => {
      projectManager.createProject('测试项目', '')
      
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
      
      projectManager.addAnnotation(annotation)
      
      // 更新标注
      const updatedAnnotation = { ...annotation, content: '更新后的标注' }
      projectManager.updateAnnotation(updatedAnnotation)
      
      const project = projectManager.getCurrentProject()
      const structuralLayer = project?.layers.find(l => l.id === 'structural')
      expect(structuralLayer?.annotations[0].content).toBe('更新后的标注')
    })
  })

  describe('removeAnnotation', () => {
    it('应该删除标注', () => {
      projectManager.createProject('测试项目', '')
      
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
      
      projectManager.addAnnotation(annotation)
      expect(projectManager.getCurrentProject()?.layers.find(l => l.id === 'structural')?.annotations).toHaveLength(1)
      
      projectManager.removeAnnotation('test-annotation')
      expect(projectManager.getCurrentProject()?.layers.find(l => l.id === 'structural')?.annotations).toHaveLength(0)
    })
  })

  describe('exportProject', () => {
    it('应该导出项目为Blob', () => {
      const project = projectManager.createProject('测试项目', '')
      
      const blob = projectManager.exportProject(project)
      
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('application/json')
    })
  })

  describe('saveProject', () => {
    it('应该保存项目到本地存储', () => {
      const project = projectManager.createProject('测试项目', '')
      
      projectManager.saveProject(project)
      
      // 验证localStorage中有数据
      const key = `project_${project.id}`
      const stored = localStorage.getItem(key)
      expect(stored).not.toBeNull()
      
      const parsed = JSON.parse(stored!)
      expect(parsed.id).toBe(project.id)
      expect(parsed.name).toBe('测试项目')
    })
  })

  describe('loadFromLocalStorage', () => {
    it('应该从本地存储加载项目', () => {
      const project = projectManager.createProject('测试项目', '')
      projectManager.saveProject(project)
      
      const loaded = projectManager.loadFromLocalStorage(project.id)
      
      expect(loaded).not.toBeNull()
      expect(loaded?.id).toBe(project.id)
      expect(loaded?.name).toBe('测试项目')
    })

    it('应该返回null如果项目不存在', () => {
      const loaded = projectManager.loadFromLocalStorage('non-existent-id')
      
      expect(loaded).toBeNull()
    })
  })

  describe('deleteLocalProject', () => {
    it('应该删除本地项目', () => {
      const project = projectManager.createProject('测试项目', '')
      projectManager.saveProject(project)
      
      // 验证项目存在
      expect(projectManager.loadFromLocalStorage(project.id)).not.toBeNull()
      
      // 删除项目
      projectManager.deleteLocalProject(project.id)
      
      // 验证项目已删除
      expect(projectManager.loadFromLocalStorage(project.id)).toBeNull()
    })

    it('应该清除当前项目如果是被删除的项目', () => {
      const project = projectManager.createProject('测试项目', '')
      
      expect(projectManager.getCurrentProject()).toBe(project)
      
      projectManager.deleteLocalProject(project.id)
      
      expect(projectManager.getCurrentProject()).toBeNull()
    })
  })

  describe('updateLayer', () => {
    it('应该更新图层', () => {
      projectManager.createProject('测试项目', '')
      
      const project = projectManager.getCurrentProject()
      const layer = project?.layers.find(l => l.id === 'structural')
      
      if (layer) {
        layer.visible = false
        layer.opacity = 50
        
        projectManager.updateLayer(layer)
        
        const updatedProject = projectManager.getCurrentProject()
        const updatedLayer = updatedProject?.layers.find(l => l.id === 'structural')
        
        expect(updatedLayer?.visible).toBe(false)
        expect(updatedLayer?.opacity).toBe(50)
      }
    })
  })

  describe('updatePresentationSteps', () => {
    it('应该更新演示步骤', () => {
      projectManager.createProject('测试项目', '')
      
      const newSteps = [
        {
          id: 'custom-step',
          order: 0,
          name: '自定义步骤',
          description: '自定义描述',
          layerIds: ['structural'],
          duration: 3000
        }
      ]
      
      projectManager.updatePresentationSteps(newSteps)
      
      const project = projectManager.getCurrentProject()
      expect(project?.presentationSteps).toHaveLength(1)
      expect(project?.presentationSteps[0].id).toBe('custom-step')
    })
  })
})