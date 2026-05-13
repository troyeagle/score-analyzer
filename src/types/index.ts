// 乐谱元数据
export interface ScoreMetadata {
  title: string
  composer: string
  keySignature: string
  timeSignature: string
  tempo: number
}

// 谱表
export interface Part {
  id: string
  name: string
  measures: string[] // measure IDs
}

// 小节
export interface Measure {
  id: string
  number: number
  attributes: MeasureAttributes
  notes: string[] // note IDs
  annotations: string[] // annotation IDs
}

// 小节属性
export interface MeasureAttributes {
  key: string
  time: string
  clef: string
  divisions: number
}

// 音符
export interface Note {
  id: string
  pitch: string
  duration: number
  type: string
  stem: string
  beam?: string
  accidental?: string
  dots?: number
}

// 标注
export interface Annotation {
  id: string
  type: 'structural' | 'motivic' | 'harmonic' | 'annotation'
  level: 'basic' | 'advanced' | 'professional'
  startMeasure: number
  endMeasure: number
  content: string
  style: AnnotationStyle
}

// 标注样式
export interface AnnotationStyle {
  color: string
  backgroundColor: string
  borderColor: string
  borderWidth: number
  fontSize: number
  fontFamily: string
}

// 排版配置
export interface LayoutConfig {
  pageWidth: number
  pageHeight: number
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
  staveSpacing: number
  systemSpacing: number
  measurePadding: number
}

// 五线谱布局
export interface StaveLayout {
  id: string
  x: number
  y: number
  width: number
  height: number
  measures: MeasureLayout[]
}

// 小节布局
export interface MeasureLayout {
  id: string
  x: number
  y: number
  width: number
  height: number
  notes: NoteLayout[]
}

// 音符布局
export interface NoteLayout {
  id: string
  x: number
  y: number
  width: number
  height: number
}

// 标注图层
export interface AnnotationLayer {
  id: string
  name: string
  type: 'structural' | 'motivic' | 'harmonic' | 'annotation'
  level: 'basic' | 'advanced' | 'professional'
  visible: boolean
  opacity: number
  annotations: Annotation[]
}

// 演示步骤
export interface PresentationStep {
  id: string
  order: number
  name: string
  description: string
  layerIds: string[]
  duration: number
}

// 项目数据
export interface ProjectData {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  musicXML: string
  layoutConfig: LayoutConfig
  layers: AnnotationLayer[]
  presentationSteps: PresentationStep[]
}

// PDF导出配置
export interface PDFExportConfig {
  pageSize: 'A4' | 'A3' | 'Letter'
  orientation: 'portrait' | 'landscape'
  margins: {
    top: number
    bottom: number
    left: number
    right: number
  }
  includeAnnotations: boolean
  pageRange?: {
    start: number
    end: number
  }
}

// MusicXML解析结果
export interface MusicXMLParseResult {
  metadata: ScoreMetadata
  parts: Part[]
  measures: Measure[]
  notes: Note[]
  annotations: Annotation[]
}

// 布局配置默认值
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  pageWidth: 800,
  pageHeight: 1100,
  marginTop: 50,
  marginBottom: 50,
  marginLeft: 40,
  marginRight: 40,
  staveSpacing: 80,
  systemSpacing: 100,
  measurePadding: 10
}

// 默认标注样式
export const DEFAULT_ANNOTATION_STYLE: AnnotationStyle = {
  color: '#333333',
  backgroundColor: 'rgba(64, 158, 255, 0.1)',
  borderColor: '#409eff',
  borderWidth: 1,
  fontSize: 12,
  fontFamily: 'Arial, sans-serif'
}

// 标注类型颜色映射
export const ANNOTATION_TYPE_COLORS: Record<string, string> = {
  structural: '#409eff',
  motivic: '#67c23a',
  harmonic: '#e6a23c',
  annotation: '#909399'
}

// DCML和声符号映射
export const DCML_HARMONIC_SYMBOLS: Record<string, string> = {
  'I': 'I',
  'II': 'II',
  'III': 'III',
  'IV': 'IV',
  'V': 'V',
  'VI': 'VI',
  'VII': 'VII',
  'i': 'i',
  'ii': 'ii',
  'iii': 'iii',
  'iv': 'iv',
  'v': 'v',
  'vi': 'vi',
  'vii': 'vii',
  'Fr6': 'Fr⁶',
  'Ger6': 'Ger⁶',
  'It6': 'It⁶',
  'Cad64': 'Cad⁶₄',
  'N6': 'N⁶'
}