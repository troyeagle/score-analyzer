import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  MusicXMLParseResult, 
  ScoreMetadata, 
  Part, 
  Measure, 
  Note, 
  Annotation,
  AnnotationLayer,
  LayoutConfig,
  StaveLayout
} from '../types'
import { DEFAULT_LAYOUT_CONFIG } from '../types'

export const useScoreStore = defineStore('score', () => {
  // 状态
  const metadata = ref<ScoreMetadata | null>(null)
  const parts = ref<Part[]>([])
  const selectedPartIds = ref<string[]>([])
  const layers = ref<AnnotationLayer[]>([])
  const layoutConfig = ref<LayoutConfig>({ ...DEFAULT_LAYOUT_CONFIG })
  const staveLayouts = ref<StaveLayout[]>([])
  const isLoaded = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const scoreTitle = computed(() => metadata.value?.title || '未命名作品')
  const scoreComposer = computed(() => metadata.value?.composer || '未知作曲家')
  
  // 总小节数（取所有声部中最长的）
  const totalMeasures = computed(() => {
    if (parts.value.length === 0) return 0
    return Math.max(...parts.value.map(p => p.measures.length))
  })
  
  // 声部数量
  const totalParts = computed(() => parts.value.length)
  
  // 可见的标注图层
  const visibleLayers = computed(() => layers.value.filter(layer => layer.visible))
  
  // 选中的声部
  const selectedParts = computed(() => 
    parts.value.filter(p => selectedPartIds.value.includes(p.id))
  )

  // 初始化默认图层
  const initializeLayers = () => {
    layers.value = [
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
    ]
  }

  // 加载乐谱数据
  const loadScore = async (parseResult: MusicXMLParseResult) => {
    loading.value = true
    error.value = null
    
    try {
      metadata.value = parseResult.metadata
      parts.value = parseResult.parts
      
      // 默认选中所有声部
      selectedPartIds.value = parseResult.parts.map(p => p.id)
      
      isLoaded.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载乐谱失败'
      console.error('加载乐谱失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 切换声部选择
  const togglePartSelection = (partId: string) => {
    const index = selectedPartIds.value.indexOf(partId)
    if (index === -1) {
      selectedPartIds.value.push(partId)
    } else {
      selectedPartIds.value.splice(index, 1)
    }
  }

  // 选择所有声部
  const selectAllParts = () => {
    selectedPartIds.value = parts.value.map(p => p.id)
  }

  // 取消选择所有声部
  const deselectAllParts = () => {
    selectedPartIds.value = []
  }

  // 切换图层可见性
  const toggleLayerVisibility = (layerId: string) => {
    const layer = layers.value.find(l => l.id === layerId)
    if (layer) {
      layer.visible = !layer.visible
    }
  }

  // 设置图层透明度
  const setLayerOpacity = (layerId: string, opacity: number) => {
    const layer = layers.value.find(l => l.id === layerId)
    if (layer) {
      layer.opacity = Math.max(0, Math.min(100, opacity))
    }
  }

  // 添加标注
  const addAnnotation = (annotation: Annotation) => {
    const layer = layers.value.find(l => l.type === annotation.type)
    if (layer) {
      layer.annotations.push(annotation)
    }
  }

  // 更新标注
  const updateAnnotation = (annotationId: string, updates: Partial<Annotation>) => {
    layers.value.forEach(layer => {
      const index = layer.annotations.findIndex(a => a.id === annotationId)
      if (index !== -1) {
        layer.annotations[index] = { ...layer.annotations[index], ...updates }
      }
    })
  }

  // 删除标注
  const removeAnnotation = (annotationId: string) => {
    layers.value.forEach(layer => {
      layer.annotations = layer.annotations.filter(a => a.id !== annotationId)
    })
  }

  // 更新排版配置
  const updateLayoutConfig = (config: Partial<LayoutConfig>) => {
    layoutConfig.value = { ...layoutConfig.value, ...config }
  }

  // 获取指定声部的小节
  const getPartMeasures = (partId: string): Measure[] => {
    const part = parts.value.find(p => p.id === partId)
    return part?.measures || []
  }

  // 获取指定小节的所有音符
  const getMeasureNotes = (partId: string, measureNumber: number): Note[] => {
    const part = parts.value.find(p => p.id === partId)
    if (!part) return []
    
    const measure = part.measures.find(m => m.number === measureNumber)
    if (!measure) return []
    
    const notes: Note[] = []
    measure.voices.forEach(voice => {
      notes.push(...voice.notes)
    })
    return notes
  }

  // 重置状态
  const reset = () => {
    metadata.value = null
    parts.value = []
    selectedPartIds.value = []
    layers.value = []
    staveLayouts.value = []
    isLoaded.value = false
    loading.value = false
    error.value = null
    
    initializeLayers()
  }

  // 初始化
  initializeLayers()

  return {
    // 状态
    metadata,
    parts,
    selectedPartIds,
    layers,
    layoutConfig,
    staveLayouts,
    isLoaded,
    loading,
    error,
    
    // 计算属性
    scoreTitle,
    scoreComposer,
    totalMeasures,
    totalParts,
    visibleLayers,
    selectedParts,
    
    // 方法
    loadScore,
    togglePartSelection,
    selectAllParts,
    deselectAllParts,
    toggleLayerVisibility,
    setLayerOpacity,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    updateLayoutConfig,
    getPartMeasures,
    getMeasureNotes,
    reset,
    initializeLayers
  }
})