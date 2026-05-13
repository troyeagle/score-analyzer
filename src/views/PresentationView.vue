<template>
  <div class="presentation-view">
    <div class="presentation-header">
      <h2>渐进式演示模式</h2>
      <div class="presentation-controls">
        <el-button-group>
          <el-button @click="previousStep" :disabled="currentStep === 0">
            <el-icon><arrow-left /></el-icon>
            上一步
          </el-button>
          <el-button @click="togglePlay">
            <el-icon v-if="!isPlaying"><video-play /></el-icon>
            <el-icon v-else><video-pause /></el-icon>
            {{ isPlaying ? '暂停' : '播放' }}
          </el-button>
          <el-button @click="nextStep" :disabled="currentStep === steps.length - 1">
            下一步
            <el-icon><arrow-right /></el-icon>
          </el-button>
        </el-button-group>
        
        <div class="speed-control">
          <span>播放速度：</span>
          <el-slider v-model="playSpeed" :min="1" :max="5" :step="1" style="width: 100px;" />
        </div>
      </div>
    </div>
    
    <div class="presentation-content">
      <div class="score-area">
        <div v-if="!scoreLoaded" class="empty-state">
          <el-empty description="请先在乐谱分析页面导入乐谱" />
        </div>
        <div v-else class="score-display">
          <div id="presentation-score" ref="presentationScore"></div>
          <canvas id="presentation-canvas" ref="presentationCanvas"></canvas>
        </div>
      </div>
      
      <div class="step-info">
        <el-card class="step-card">
          <template #header>
            <div class="card-header">
              <span>当前步骤：{{ currentStep + 1 }} / {{ steps.length }}</span>
            </div>
          </template>
          <div class="step-content">
            <h3>{{ steps[currentStep]?.name }}</h3>
            <p>{{ steps[currentStep]?.description }}</p>
            <div class="step-layers">
              <h4>显示图层：</h4>
              <el-tag 
                v-for="layerId in steps[currentStep]?.layerIds" 
                :key="layerId"
                type="primary"
                style="margin-right: 8px; margin-bottom: 8px;"
              >
                {{ getLayerName(layerId) }}
              </el-tag>
            </div>
          </div>
        </el-card>
        
        <el-card class="steps-list-card">
          <template #header>
            <div class="card-header">
              <span>演示步骤</span>
            </div>
          </template>
          <div class="steps-list">
            <div 
              v-for="(step, index) in steps" 
              :key="step.id"
              class="step-item"
              :class="{ active: index === currentStep }"
              @click="goToStep(index)"
            >
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-name">{{ step.name }}</div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ArrowLeft, ArrowRight, VideoPlay, VideoPause } from '@element-plus/icons-vue'

interface PresentationStep {
  id: string
  order: number
  name: string
  description: string
  layerIds: string[]
  duration: number
}

const presentationScore = ref<HTMLElement>()
const presentationCanvas = ref<HTMLCanvasElement>()
const scoreLoaded = ref(false)
const currentStep = ref(0)
const isPlaying = ref(false)
const playSpeed = ref(2)
let playInterval: number | null = null

const steps = reactive<PresentationStep[]>([
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
])

const getLayerName = (layerId: string) => {
  const layerNames: Record<string, string> = {
    structural: '基础结构层',
    motivic: '动机层',
    harmonic: '和声层',
    annotation: '注释层'
  }
  return layerNames[layerId] || layerId
}

const nextStep = () => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
    updateVisualization()
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
    updateVisualization()
  }
}

const goToStep = (index: number) => {
  currentStep.value = index
  updateVisualization()
}

const togglePlay = () => {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    startAutoPlay()
  } else {
    stopAutoPlay()
  }
}

const startAutoPlay = () => {
  const speed = 6 - playSpeed.value // 1=慢, 5=快
  const interval = speed * 1000
  
  playInterval = window.setInterval(() => {
    if (currentStep.value < steps.length - 1) {
      nextStep()
    } else {
      stopAutoPlay()
    }
  }, interval)
}

const stopAutoPlay = () => {
  isPlaying.value = false
  if (playInterval) {
    clearInterval(playInterval)
    playInterval = null
  }
}

const updateVisualization = () => {
  // TODO: 更新可视化显示
  console.log('Updating to step:', currentStep.value)
}

onUnmounted(() => {
  stopAutoPlay()
})
</script>

<style scoped>
.presentation-view {
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
}

.presentation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.presentation-header h2 {
  margin: 0;
  color: #409eff;
}

.presentation-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #606266;
}

.presentation-content {
  flex: 1;
  display: flex;
  gap: 20px;
}

.score-area {
  flex: 3;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.score-display {
  position: relative;
  height: 100%;
  padding: 20px;
}

#presentation-score {
  height: 100%;
  overflow: auto;
}

#presentation-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.step-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step-card {
  flex: 1;
}

.steps-list-card {
  flex: 2;
}

.card-header {
  font-weight: bold;
  color: #409eff;
}

.step-content h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.step-content p {
  margin: 0 0 15px 0;
  color: #606266;
  line-height: 1.6;
}

.step-layers h4 {
  margin: 0 0 10px 0;
  color: #606266;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.step-item:hover {
  background-color: #f5f7fa;
}

.step-item.active {
  background-color: #ecf5ff;
  border: 1px solid #b3d8ff;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #409eff;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  font-weight: bold;
}

.step-item.active .step-number {
  background-color: #67c23a;
}

.step-name {
  color: #303133;
}

.step-item.active .step-name {
  color: #409eff;
  font-weight: bold;
}
</style>