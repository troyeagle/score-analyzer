<template>
  <div class="score-view">
    <el-row :gutter="20">
      <el-col :span="6">
        <div class="sidebar">
          <el-card class="upload-card">
            <template #header>
              <div class="card-header">
                <span>乐谱导入</span>
              </div>
            </template>
            <div class="upload-content">
              <el-upload
                class="upload-area"
                drag
                action="#"
                :auto-upload="false"
                :on-change="handleFileSelect"
                accept=".xml,.musicxml"
              >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">
                  拖拽MusicXML文件到此处或 <em>点击选择</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    支持标准MusicXML格式文件
                  </div>
                </template>
              </el-upload>
              
              <!-- 文件元信息 -->
              <div v-if="fileInfo" class="file-info">
                <h4>文件信息</h4>
                <p><strong>文件名：</strong>{{ fileInfo.fileName }}</p>
                <p><strong>大小：</strong>{{ fileInfo.fileSize }}</p>
                <p><strong>标题：</strong>{{ fileInfo.title }}</p>
                <p><strong>作曲家：</strong>{{ fileInfo.composer }}</p>
                <p><strong>调号：</strong>{{ fileInfo.keySignature }}</p>
                <p><strong>拍号：</strong>{{ fileInfo.timeSignature }}</p>
                <p><strong>声部数：</strong>{{ fileInfo.partsCount }}</p>
                <p><strong>总小节数：</strong>{{ fileInfo.totalMeasures }}</p>
                
                <!-- 声部详情 -->
                <div class="part-details">
                  <h5>声部详情：</h5>
                  <div v-for="part in fileInfo.parts" :key="part.id" class="part-detail-item">
                    <span>{{ part.name }} ({{ part.id }})</span>
                    <span>{{ part.measures }}小节, {{ part.staves }}谱表</span>
                  </div>
                </div>
                
                <!-- 小节范围选择 -->
                <div class="measure-range">
                  <h5>解析范围：</h5>
                  <div class="range-inputs">
                    <el-input-number 
                      v-model="parseRange.start" 
                      :min="1" 
                      :max="fileInfo.totalMeasures"
                      size="small"
                      controls-position="right"
                    />
                    <span>至</span>
                    <el-input-number 
                      v-model="parseRange.end" 
                      :min="parseRange.start" 
                      :max="fileInfo.totalMeasures"
                      size="small"
                      controls-position="right"
                    />
                  </div>
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="handleParseAndRender"
                    :loading="parsing"
                    style="margin-top: 10px; width: 100%;"
                  >
                    解析并渲染
                  </el-button>
                </div>
              </div>
              
              <!-- 解析后的乐谱信息 -->
              <div v-if="scoreStore.isLoaded" class="score-info">
                <h4>已加载乐谱</h4>
                <p><strong>声部数：</strong>{{ scoreStore.totalParts }}</p>
                <p><strong>小节数：</strong>{{ scoreStore.totalMeasures }}</p>
                <p><strong>解析范围：</strong>{{ parseRange.start }} - {{ parseRange.end }}</p>
              </div>
            </div>
          </el-card>
          
          <el-card class="control-card">
            <template #header>
              <div class="card-header">
                <span>声部选择</span>
                <div>
                  <el-button size="small" @click="scoreStore.selectAllParts">全选</el-button>
                  <el-button size="small" @click="scoreStore.deselectAllParts">取消</el-button>
                </div>
              </div>
            </template>
            <div class="control-content">
              <div class="part-list">
                <div 
                  v-for="part in scoreStore.parts" 
                  :key="part.id" 
                  class="part-item"
                  :class="{ selected: scoreStore.selectedPartIds.includes(part.id) }"
                >
                  <el-checkbox 
                    :model-value="scoreStore.selectedPartIds.includes(part.id)"
                    @change="scoreStore.togglePartSelection(part.id)"
                  >
                    <span class="part-name">{{ part.name }}</span>
                    <el-tag size="small" v-if="part.staves > 1">大谱表</el-tag>
                    <el-tag size="small" type="info">{{ part.measures.length }}小节</el-tag>
                  </el-checkbox>
                </div>
              </div>
            </div>
          </el-card>
          
          <el-card class="control-card">
            <template #header>
              <div class="card-header">
                <span>标注控制</span>
              </div>
            </template>
            <div class="control-content">
              <div class="layer-controls">
                <h4>图层控制</h4>
                <div v-for="layer in scoreStore.layers" :key="layer.id" class="layer-item">
                  <el-checkbox 
                    v-model="layer.visible" 
                    @change="handleLayerVisibilityChange(layer.id)"
                  >
                    {{ layer.name }}
                  </el-checkbox>
                  <el-slider 
                    v-model="layer.opacity" 
                    :min="0" 
                    :max="100" 
                    :step="10"
                    size="small"
                    @change="handleLayerOpacityChange(layer.id, layer.opacity)"
                  />
                </div>
              </div>
              
              <div class="level-controls">
                <h4>难度分级</h4>
                <el-radio-group v-model="currentLevel" size="small" @change="handleLevelChange">
                  <el-radio-button label="basic">基础</el-radio-button>
                  <el-radio-button label="advanced">进阶</el-radio-button>
                  <el-radio-button label="professional">专业</el-radio-button>
                </el-radio-group>
              </div>
              
              <div class="layout-controls">
                <h4>排版设置</h4>
                <div class="control-item">
                  <span>行间距：</span>
                  <el-slider 
                    v-model="layoutConfig.staveSpacing" 
                    :min="40" 
                    :max="120" 
                    :step="5"
                    size="small"
                    @change="handleLayoutChange"
                  />
                </div>
                <div class="control-item">
                  <span>谱表间距：</span>
                  <el-slider 
                    v-model="layoutConfig.staffSpacing" 
                    :min="30" 
                    :max="100" 
                    :step="5"
                    size="small"
                    @change="handleLayoutChange"
                  />
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </el-col>
      
      <el-col :span="18">
        <div class="main-content">
          <el-card class="score-card">
            <template #header>
              <div class="card-header">
                <span>乐谱渲染</span>
                <div class="score-controls">
                  <el-button-group>
                    <el-button size="small" @click="handleZoomIn">
                      <el-icon><zoom-in /></el-icon>
                    </el-button>
                    <el-button size="small" @click="handleZoomOut">
                      <el-icon><zoom-out /></el-icon>
                    </el-button>
                    <el-button size="small" @click="handleResetZoom">
                      <el-icon><refresh /></el-icon>
                    </el-button>
                  </el-button-group>
                  <el-button size="small" @click="exportToPDF">
                    导出PDF
                  </el-button>
                </div>
              </div>
            </template>
            <div class="score-container" ref="scoreContainer">
              <div v-if="!scoreStore.isLoaded" class="empty-state">
                <el-empty description="请导入MusicXML文件开始分析" />
              </div>
              <div v-else class="score-content">
                <div id="score-output" ref="scoreOutput"></div>
              </div>
            </div>
          </el-card>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { UploadFilled, ZoomIn, ZoomOut, Refresh } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'
import { useScoreStore } from '../stores/score'
import { musicXMLParser } from '../services/MusicXMLParser'
import { layoutEngine } from '../services/LayoutEngine'
import { vexFlowRenderer } from '../services/VexFlowRenderer'
import type { LayoutConfig, Part } from '../types'

const scoreStore = useScoreStore()

const scoreContainer = ref<HTMLElement>()
const scoreOutput = ref<HTMLElement>()
const currentLevel = ref('basic')
const zoomLevel = ref(100)
const isRendering = ref(false)
const parsing = ref(false)
const selectedFile = ref<File | null>(null)

// 文件元信息
const fileInfo = ref<{
  fileName: string
  fileSize: string
  title: string
  composer: string
  keySignature: string
  timeSignature: string
  partsCount: number
  totalMeasures: number
  parts: Array<{ id: string; name: string; measures: number; staves: number }>
} | null>(null)

// 解析范围
const parseRange = reactive({
  start: 1,
  end: 102
})

const layoutConfig = reactive<LayoutConfig>({
  pageWidth: 800,
  pageHeight: 1100,
  marginTop: 50,
  marginBottom: 50,
  marginLeft: 40,
  marginRight: 40,
  staveSpacing: 80,
  systemSpacing: 100,
  measurePadding: 10,
  staffSpacing: 60
})

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 处理文件选择（只读取元信息）
const handleFileSelect = async (file: UploadFile) => {
  if (!file.raw) return
  
  selectedFile.value = file.raw
  parsing.value = true
  
  try {
    console.log('=== 文件选择 ===')
    console.log('文件名:', file.name)
    console.log('文件大小:', file.size, 'bytes')
    
    // 解析文件获取元信息
    const content = await readFileContent(file.raw)
    console.log('文件内容长度:', content.length, '字符')
    
    // 临时解析获取元信息
    const tempParser = new (await import('../services/MusicXMLParser')).MusicXMLParser()
    tempParser.setDebug(true)
    
    // 只解析前几个小节获取元信息
    const parseResult = tempParser.parseFromString(content, 1, 5)
    
    console.log('=== 解析结果 ===')
    console.log('标题:', parseResult.metadata.title)
    console.log('作曲家:', parseResult.metadata.composer)
    console.log('调号:', parseResult.metadata.keySignature)
    console.log('拍号:', parseResult.metadata.timeSignature)
    console.log('声部数量:', parseResult.parts.length)
    
    // 获取每个声部的小节总数
    const partDetails = parseResult.parts.map(part => {
      // 重新解析获取完整小节数
      const fullPart = tempParser.parseFromString(content).parts.find(p => p.id === part.id)
      return {
        id: part.id,
        name: part.name,
        measures: fullPart?.measures.length || 0,
        staves: part.staves
      }
    })
    
    const totalMeasures = Math.max(...partDetails.map(p => p.measures))
    
    console.log('声部详情:', partDetails)
    console.log('总小节数:', totalMeasures)
    
    fileInfo.value = {
      fileName: file.name,
      fileSize: formatFileSize(file.size || 0),
      title: parseResult.metadata.title,
      composer: parseResult.metadata.composer,
      keySignature: parseResult.metadata.keySignature,
      timeSignature: parseResult.metadata.timeSignature,
      partsCount: parseResult.parts.length,
      totalMeasures,
      parts: partDetails
    }
    
    // 设置默认解析范围
    parseRange.start = 1
    parseRange.end = Math.min(totalMeasures, 10) // 默认解析前10小节
    
  } catch (error) {
    console.error('文件解析失败:', error)
  } finally {
    parsing.value = false
  }
}

// 读取文件内容
const readFileContent = (file: File): Promise<string> => {
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

// 解析并渲染指定范围
const handleParseAndRender = async () => {
  if (!selectedFile.value) return
  
  parsing.value = true
  
  try {
    console.log('=== 开始解析指定范围 ===')
    console.log('范围:', parseRange.start, '-', parseRange.end)
    
    const content = await readFileContent(selectedFile.value)
    
    // 使用指定范围解析
    musicXMLParser.setDebug(true)
    const parseResult = await musicXMLParser.parse(selectedFile.value, parseRange.start, parseRange.end)
    
    console.log('=== 范围解析结果 ===')
    console.log('声部数量:', parseResult.parts.length)
    console.log('每个声部的小节数:', parseResult.parts.map(p => `${p.name}: ${p.measures.length}`))
    
    await scoreStore.loadScore(parseResult)
    await renderScore()
    
  } catch (error) {
    console.error('解析失败:', error)
  } finally {
    parsing.value = false
  }
}

// 渲染乐谱
const renderScore = async () => {
  if (!scoreOutput.value || !scoreStore.isLoaded || isRendering.value) return
  
  isRendering.value = true
  
  try {
    console.log('=== 开始渲染 ===')
    console.log('选中的声部:', scoreStore.selectedParts.map(p => p.name))
    
    // 初始化VexFlow渲染器
    vexFlowRenderer.initialize(scoreOutput.value, layoutConfig.pageWidth, layoutConfig.pageHeight)
    
    // 渲染选中的声部
    vexFlowRenderer.renderParts(scoreStore.selectedParts, layoutConfig)
    
  } catch (error) {
    console.error('渲染失败:', error)
  } finally {
    isRendering.value = false
  }
}

// 处理图层可见性变化
const handleLayerVisibilityChange = (layerId: string) => {
  scoreStore.toggleLayerVisibility(layerId)
}

// 处理图层透明度变化
const handleLayerOpacityChange = (layerId: string, opacity: number) => {
  scoreStore.setLayerOpacity(layerId, opacity)
}

// 处理难度分级变化
const handleLevelChange = (level: string) => {
  const levelLayers: Record<string, string[]> = {
    basic: ['structural'],
    advanced: ['structural', 'motivic', 'harmonic'],
    professional: ['structural', 'motivic', 'harmonic', 'annotation']
  }
  
  const visibleLayers = levelLayers[level] || []
  
  scoreStore.layers.forEach(layer => {
    layer.visible = visibleLayers.includes(layer.id)
  })
}

// 处理排版变化
const handleLayoutChange = () => {
  scoreStore.updateLayoutConfig(layoutConfig)
  layoutEngine.updateConfig(layoutConfig)
  renderScore()
}

// 缩放控制
const handleZoomIn = () => {
  zoomLevel.value = Math.min(200, zoomLevel.value + 10)
  updateZoom()
}

const handleZoomOut = () => {
  zoomLevel.value = Math.max(50, zoomLevel.value - 10)
  updateZoom()
}

const handleResetZoom = () => {
  zoomLevel.value = 100
  updateZoom()
}

const updateZoom = () => {
  if (scoreOutput.value) {
    scoreOutput.value.style.transform = `scale(${zoomLevel.value / 100})`
    scoreOutput.value.style.transformOrigin = 'top left'
  }
}

// 导出PDF
const exportToPDF = () => {
  console.log('导出PDF')
}

onMounted(() => {
  // 初始化
})

onUnmounted(() => {
  vexFlowRenderer.destroy()
})
</script>

<style scoped>
.score-view {
  height: calc(100vh - 100px);
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-card, .control-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  color: #409eff;
}

.upload-content {
  padding: 10px 0;
}

.score-info {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.score-info h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.score-info p {
  margin: 5px 0;
  color: #606266;
  font-size: 14px;
}

.control-content {
  padding: 10px 0;
}

.part-list {
  max-height: 200px;
  overflow-y: auto;
}

.part-item {
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 4px;
  transition: background-color 0.2s;
}

.part-item:hover {
  background-color: #f5f7fa;
}

.part-item.selected {
  background-color: #ecf5ff;
}

.part-name {
  font-weight: 500;
}

.layer-controls, .level-controls, .layout-controls {
  margin-bottom: 20px;
}

.layer-controls h4, .level-controls h4, .layout-controls h4 {
  margin: 0 0 10px 0;
  color: #606266;
}

.layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.layer-item .el-slider {
  width: 100px;
}

.control-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.control-item span {
  width: 80px;
  font-size: 14px;
  color: #606266;
}

.control-item .el-slider {
  flex: 1;
}

.main-content {
  height: 100%;
}

.score-card {
  height: 100%;
}

.score-container {
  height: calc(100vh - 200px);
  overflow: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
  position: relative;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.score-content {
  position: relative;
  padding: 20px;
}

#score-output {
  transform-origin: top left;
}

.score-controls {
  display: flex;
  gap: 10px;
}

.file-info {
  margin-top: 15px;
  padding: 15px;
  background-color: #f0f9ff;
  border-radius: 4px;
  border: 1px solid #b3d8ff;
}

.file-info h4 {
  margin: 0 0 10px 0;
  color: #409eff;
}

.file-info h5 {
  margin: 10px 0 5px 0;
  color: #606266;
}

.file-info p {
  margin: 4px 0;
  font-size: 13px;
  color: #606266;
}

.part-details {
  margin-top: 10px;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.part-detail-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 12px;
  color: #909399;
  border-bottom: 1px solid #f2f6fc;
}

.part-detail-item:last-child {
  border-bottom: none;
}

.measure-range {
  margin-top: 15px;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.measure-range h5 {
  margin: 0 0 10px 0;
  color: #606266;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.range-inputs .el-input-number {
  width: 100px;
}

.range-inputs span {
  color: #606266;
}

.score-info {
  margin-top: 15px;
  padding: 15px;
  background-color: #f0f9eb;
  border-radius: 4px;
  border: 1px solid #e1f3d8;
}

.score-info h4 {
  margin: 0 0 10px 0;
  color: #67c23a;
}

.score-info p {
  margin: 4px 0;
  font-size: 13px;
  color: #606266;
}
</style>