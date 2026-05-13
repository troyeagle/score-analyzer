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
                :on-change="handleFileChange"
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
              
              <div v-if="scoreStore.isLoaded" class="score-info">
                <h4>乐谱信息</h4>
                <p><strong>标题：</strong>{{ scoreStore.scoreTitle }}</p>
                <p><strong>作曲家：</strong>{{ scoreStore.scoreComposer }}</p>
                <p><strong>调号：</strong>{{ scoreStore.metadata?.keySignature }}</p>
                <p><strong>拍号：</strong>{{ scoreStore.metadata?.timeSignature }}</p>
                <p><strong>声部数：</strong>{{ scoreStore.totalParts }}</p>
                <p><strong>小节数：</strong>{{ scoreStore.totalMeasures }}</p>
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
                    <el-button size="small" @click="zoomIn">
                      <el-icon><zoom-in /></el-icon>
                    </el-button>
                    <el-button size="small" @click="zoomOut">
                      <el-icon><zoom-out /></el-icon>
                    </el-button>
                    <el-button size="small" @click="resetZoom">
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
import type { LayoutConfig } from '../types'

const scoreStore = useScoreStore()

const scoreContainer = ref<HTMLElement>()
const scoreOutput = ref<HTMLElement>()
const currentLevel = ref('basic')
const zoomLevel = ref(100)
const isRendering = ref(false)

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

// 处理文件上传
const handleFileChange = async (file: UploadFile) => {
  if (!file.raw) return
  
  try {
    console.log('开始解析文件:', file.name)
    
    const parseResult = await musicXMLParser.parse(file.raw)
    console.log('解析结果:', {
      parts: parseResult.parts.length,
      partNames: parseResult.parts.map(p => p.name),
      measuresPerPart: parseResult.parts.map(p => p.measures.length)
    })
    
    await scoreStore.loadScore(parseResult)
    await renderScore()
    
  } catch (error) {
    console.error('文件解析失败:', error)
  }
}

// 渲染乐谱
const renderScore = async () => {
  if (!scoreOutput.value || !scoreStore.isLoaded || isRendering.value) return
  
  isRendering.value = true
  
  try {
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
const zoomIn = () => {
  zoomLevel.value = Math.min(200, zoomLevel.value + 10)
  updateZoom()
}

const zoomOut = () => {
  zoomLevel.value = Math.max(50, zoomLevel.value - 10)
  updateZoom()
}

const resetZoom = () => {
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
</style>