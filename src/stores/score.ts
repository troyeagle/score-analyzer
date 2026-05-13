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
  StaveLayout,
  DEFAULT_LAYOUT_CONFIG
} from '../types'

export const useScoreStore = defineStore('score', () => {
  // 状态
  const metadata = ref<ScoreMetadata | null>(null)
  const parts = ref<Part[]>([])
  const measures = ref<Measure[]>([])
  const notes = ref<Note[]>([])
  const annotations = ref<Annotation[]>([])
  const layers = ref<AnnotationLayer[]>([])
  const layoutConfig = ref<LayoutConfig>({
    pageWidth: 800,
    pageHeight: 1100,
    marginTop: 50,
    marginBottom: 50,
    marginLeft: 40,
    marginRight: 40,
    staveSpacing: 80,
    systemSpacing: 100,
    measurePadding: 10
  })
  const staveLayouts = ref<StaveLayout[]>([])
  const isLoaded = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const scoreTitle = computed(() => metadata.value?.title || '未命名作品')
  const scoreComposer = computed(() => metadata.value?.composer || '未知作曲家')
  const totalMeasures = computed(() => measures.value.length)
  const visibleLayers = computed(() => layers.value.filter(layer => layer.visible))

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
      measures.value = parseResult.measures
      notes.value = parseResult.notes
      annotations.value = parseResult.annotations
      
      // 将标注分配到对应图层
      distributeAnnotationsToLayers()
      
      isLoaded.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载乐谱失败'
      console.error('加载乐谱失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 将标注分配到对应图层
  const distributeAnnotationsToLayers = () => {
    // 清空现有图层标注
    layers.value.forEach(layer => {
      layer.annotations = []
    })
    
    // 根据标注类型分配到对应图层
    annotations.value.forEach(annotation => {
      const layer = layers.value.find(l => l.type === annotation.type)
      if (layer) {
        layer.annotations.push(annotation)
      }
    })
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
    annotations.value.push(annotation)
    
    // 添加到对应图层
    const layer = layers.value.find(l => l.type === annotation.type)
    if (layer) {
      layer.annotations.push(annotation)
    }
  }

  // 更新标注
  const updateAnnotation = (annotationId: string, updates: Partial<Annotation>) => {
    const index = annotations.value.findIndex(a => a.id === annotationId)
    if (index !== -1) {
      annotations.value[index] = { ...annotations.value[index], ...updates }
      
      // 更新图层中的标注
      layers.value.forEach(layer => {
        const layerIndex = layer.annotations.findIndex(a => a.id === annotationId)
        if (layerIndex !== -1) {
          layer.annotations[layerIndex] = { ...layer.annotations[layerIndex], ...updates }
        }
      })
    }
  }

  // 删除标注
  const removeAnnotation = (annotationId: string) => {
    annotations.value = annotations.value.filter(a => a.id !== annotationId)
    
    // 从图层中移除
    layers.value.forEach(layer => {
      layer.annotations = layer.annotations.filter(a => a.id !== annotationId)
    })
  }

  // 更新排版配置
  const updateLayoutConfig = (config: Partial<LayoutConfig>) => {
    layoutConfig.value = { ...layoutConfig.value, ...config }
  }

  // 重置状态
  const reset = () => {
    metadata.value = null
    parts.value = []
    measures.value = []
    notes.value = []
    annotations.value = []
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
    measures,
    notes,
    annotations,
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
    visibleLayers,
    
    // 方法
    loadScore,
    toggleLayerVisibility,
    setLayerOpacity,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    updateLayoutConfig,
    reset,
    initializeLayers
  }
})