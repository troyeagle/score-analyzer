<template>
  <div class="export-view">
    <div class="export-header">
      <h2>PDF导出</h2>
    </div>
    
    <div class="export-content">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="config-card">
            <template #header>
              <div class="card-header">
                <span>导出配置</span>
              </div>
            </template>
            <div class="config-content">
              <el-form :model="exportConfig" label-width="100px">
                <el-form-item label="纸张尺寸">
                  <el-select v-model="exportConfig.pageSize" style="width: 100%;">
                    <el-option label="A4" value="A4" />
                    <el-option label="A3" value="A3" />
                    <el-option label="Letter" value="Letter" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="方向">
                  <el-radio-group v-model="exportConfig.orientation">
                    <el-radio label="portrait">纵向</el-radio>
                    <el-radio label="landscape">横向</el-radio>
                  </el-radio-group>
                </el-form-item>
                
                <el-form-item label="页边距">
                  <div class="margin-inputs">
                    <div class="margin-row">
                      <span>上：</span>
                      <el-input-number v-model="exportConfig.margins.top" :min="0" :max="100" size="small" />
                    </div>
                    <div class="margin-row">
                      <span>下：</span>
                      <el-input-number v-model="exportConfig.margins.bottom" :min="0" :max="100" size="small" />
                    </div>
                    <div class="margin-row">
                      <span>左：</span>
                      <el-input-number v-model="exportConfig.margins.left" :min="0" :max="100" size="small" />
                    </div>
                    <div class="margin-row">
                      <span>右：</span>
                      <el-input-number v-model="exportConfig.margins.right" :min="0" :max="100" size="small" />
                    </div>
                  </div>
                </el-form-item>
                
                <el-form-item label="包含标注">
                  <el-switch v-model="exportConfig.includeAnnotations" />
                </el-form-item>
                
                <el-form-item label="页码范围">
                  <div class="page-range">
                    <el-input-number v-model="exportConfig.pageRange.start" :min="1" size="small" />
                    <span>至</span>
                    <el-input-number v-model="exportConfig.pageRange.end" :min="1" size="small" />
                  </div>
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="exportPDF" :loading="exporting">
                    导出PDF
                  </el-button>
                  <el-button @click="previewPDF">
                    预览
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="16">
          <el-card class="preview-card">
            <template #header>
              <div class="card-header">
                <span>预览</span>
                <div class="preview-controls">
                  <el-button-group>
                    <el-button size="small" @click="previousPage" :disabled="currentPage === 1">
                      <el-icon><arrow-left /></el-icon>
                    </el-button>
                    <el-button size="small" disabled>
                      {{ currentPage }} / {{ totalPages }}
                    </el-button>
                    <el-button size="small" @click="nextPage" :disabled="currentPage === totalPages">
                      <el-icon><arrow-right /></el-icon>
                    </el-button>
                  </el-button-group>
                </div>
              </div>
            </template>
            <div class="preview-content">
              <div v-if="!scoreLoaded" class="empty-state">
                <el-empty description="请先在乐谱分析页面导入乐谱" />
              </div>
              <div v-else class="preview-area">
                <div class="page-preview" :style="pageStyle">
                  <div id="preview-score" ref="previewScore"></div>
                  <div class="page-number">第 {{ currentPage }} 页</div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

interface ExportConfig {
  pageSize: 'A4' | 'A3' | 'Letter'
  orientation: 'portrait' | 'landscape'
  margins: {
    top: number
    bottom: number
    left: number
    right: number
  }
  includeAnnotations: boolean
  pageRange: {
    start: number
    end: number
  }
}

const previewScore = ref<HTMLElement>()
const scoreLoaded = ref(false)
const exporting = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)

const exportConfig = reactive<ExportConfig>({
  pageSize: 'A4',
  orientation: 'portrait',
  margins: {
    top: 20,
    bottom: 20,
    left: 15,
    right: 15
  },
  includeAnnotations: true,
  pageRange: {
    start: 1,
    end: 1
  }
})

const pageStyle = computed(() => {
  const width = exportConfig.pageSize === 'A3' ? 297 : 210
  const height = exportConfig.pageSize === 'A3' ? 420 : 297
  const scale = 0.5
  
  if (exportConfig.orientation === 'landscape') {
    return {
      width: `${height * scale}px`,
      height: `${width * scale}px`,
      transform: `scale(${scale})`
    }
  }
  
  return {
    width: `${width * scale}px`,
    height: `${height * scale}px`,
    transform: `scale(${scale})`
  }
})

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const exportPDF = async () => {
  exporting.value = true
  
  try {
    // TODO: 实现PDF导出逻辑
    console.log('Exporting PDF with config:', exportConfig)
    
    // 模拟导出延迟
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 创建示例PDF下载
    const blob = new Blob(['PDF内容示例'], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '曲式分析.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('PDF导出失败:', error)
  } finally {
    exporting.value = false
  }
}

const previewPDF = () => {
  // TODO: 实现PDF预览
  console.log('Previewing PDF')
}
</script>

<style scoped>
.export-view {
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
}

.export-header {
  margin-bottom: 20px;
}

.export-header h2 {
  margin: 0;
  color: #409eff;
}

.export-content {
  flex: 1;
}

.config-card, .preview-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  color: #409eff;
}

.config-content {
  padding: 20px 0;
}

.margin-inputs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.margin-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.margin-row span {
  width: 30px;
}

.page-range {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-content {
  height: calc(100vh - 250px);
  overflow: auto;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.preview-area {
  display: flex;
  justify-content: center;
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100%;
}

.page-preview {
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 40px;
  position: relative;
  transform-origin: top center;
}

#preview-score {
  width: 100%;
  height: 100%;
}

.page-number {
  position: absolute;
  bottom: 10px;
  right: 20px;
  color: #909399;
  font-size: 12px;
}

.preview-controls {
  display: flex;
  gap: 10px;
}
</style>