import { describe, it, expect, beforeEach } from 'vitest'
import { PDFExporter } from '../../src/services/PDFExporter'
import type { PDFExportConfig } from '../../src/types'

describe('PDFExporter', () => {
  let pdfExporter: PDFExporter

  beforeEach(() => {
    pdfExporter = new PDFExporter()
  })

  describe('constructor', () => {
    it('应该使用默认配置', () => {
      const config = pdfExporter.getConfig()
      
      expect(config.pageSize).toBe('A4')
      expect(config.orientation).toBe('portrait')
      expect(config.margins.top).toBe(20)
      expect(config.margins.bottom).toBe(20)
      expect(config.margins.left).toBe(15)
      expect(config.margins.right).toBe(15)
      expect(config.includeAnnotations).toBe(true)
    })

    it('应该接受自定义配置', () => {
      const customConfig: Partial<PDFExportConfig> = {
        pageSize: 'A3',
        orientation: 'landscape',
        margins: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10
        }
      }
      
      const exporter = new PDFExporter(customConfig)
      const config = exporter.getConfig()
      
      expect(config.pageSize).toBe('A3')
      expect(config.orientation).toBe('landscape')
      expect(config.margins.top).toBe(10)
    })
  })

  describe('updateConfig', () => {
    it('应该更新配置', () => {
      const newConfig: Partial<PDFExportConfig> = {
        pageSize: 'Letter',
        includeAnnotations: false
      }

      pdfExporter.updateConfig(newConfig)
      const config = pdfExporter.getConfig()

      expect(config.pageSize).toBe('Letter')
      expect(config.includeAnnotations).toBe(false)
      expect(config.orientation).toBe('portrait') // 未更改的值
    })
  })

  describe('generatePreview', () => {
    it('应该生成预览元素', () => {
      const container = document.createElement('div')
      container.innerHTML = '<div>测试内容</div>'
      
      const preview = pdfExporter.generatePreview(container)
      
      expect(preview).toBeDefined()
      expect(preview.innerHTML).toContain('测试内容')
      expect(preview.style.backgroundColor).toBe('white')
      expect(preview.style.boxSizing).toBe('border-box')
    })
  })

  describe('page dimensions', () => {
    it('应该返回正确的A4纵向尺寸', () => {
      const config = pdfExporter.getConfig()
      expect(config.pageSize).toBe('A4')
      expect(config.orientation).toBe('portrait')
    })

    it('应该返回正确的A4横向尺寸', () => {
      pdfExporter.updateConfig({ orientation: 'landscape' })
      const config = pdfExporter.getConfig()
      expect(config.orientation).toBe('landscape')
    })

    it('应该返回正确的A3纵向尺寸', () => {
      pdfExporter.updateConfig({ pageSize: 'A3' })
      const config = pdfExporter.getConfig()
      expect(config.pageSize).toBe('A3')
    })

    it('应该返回正确的Letter尺寸', () => {
      pdfExporter.updateConfig({ pageSize: 'Letter' })
      const config = pdfExporter.getConfig()
      expect(config.pageSize).toBe('Letter')
    })
  })
})