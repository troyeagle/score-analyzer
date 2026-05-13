// =============================================
// 乐谱元数据
// =============================================
export interface ScoreMetadata {
  title: string
  composer: string
  keySignature: string
  timeSignature: string
  tempo: number
  credits?: Credit[]
}

// 版权/标题信息
export interface Credit {
  page: number
  type?: string
  content: string
  x?: number
  y?: number
  fontSize?: number
  fontFamily?: string
  fontStyle?: string
  fontWeight?: string
  justify?: string
}

// =============================================
// 声部相关
// =============================================

// 声部信息（从 part-list 解析）
export interface PartInfo {
  id: string
  name: string
  abbreviation: string
  instrument?: Instrument
  midiInstrument?: MidiInstrument
}

// 乐器信息
export interface Instrument {
  id: string
  name: string
  sound?: string
}

// MIDI 乐器
export interface MidiInstrument {
  midiChannel?: number
  midiProgram?: number
  volume?: number
  pan?: number
}

// 声部组
export interface PartGroup {
  type: 'start' | 'stop'
  number: number
  symbol?: 'brace' | 'bracket' | 'line'
  barline?: boolean
}

// =============================================
// 乐谱数据结构（新）
// =============================================

// 完整解析结果
export interface MusicXMLParseResult {
  metadata: ScoreMetadata
  parts: Part[]
  // 为了兼容性保留这些字段
  measures?: Measure[]
  notes?: Note[]
  annotations?: Annotation[]
}

// 声部
export interface Part {
  id: string
  name: string
  abbreviation?: string
  staves: number           // 谱表数量（钢琴=2，其他=1）
  measures: Measure[]      // 该声部的小节
  instrument?: Instrument
  transpose?: Transpose    // 移调信息
}

// 移调信息
export interface Transpose {
  diatonic: number
  chromatic: number
  octaveChange?: number
}

// 小节
export interface Measure {
  id: string
  number: number
  width?: number
  attributes: MeasureAttributes
  voices: Map<number, Voice>  // 按 voice 编号组织
  directions: Direction[]
  barlines: Barline[]
  print?: PrintLayout
}

// 声部（voice）
export interface Voice {
  id: number               // voice 编号 (1, 2, 3, 4)
  staff: number            // 谱表编号 (1, 2)
  notes: Note[]
}

// 音符
export interface Note {
  id: string
  pitch: string            // 如 "C#4"
  duration: number
  type: string             // whole, half, quarter, eighth, 16th
  stem: string             // up, down
  beam?: string            // begin, continue, end
  accidental?: string      // sharp, flat, natural, double-sharp
  dots: number
  voice: number            // 所属 voice
  staff: number            // 所属谱表
  isChord: boolean         // 是否为和弦（与前一个音符同时发声）
  isRest: boolean          // 是否为休止符
  tie?: 'start' | 'stop' | 'continue'
  lyrics: Lyric[]
  notations: Notation[]
  color?: string
  defaultX?: number
  defaultY?: number
}

// 歌词
export interface Lyric {
  number: string           // 如 "part1verse1"
  syllabic: string         // single, begin, middle, end
  text: string
  extend?: boolean         // 延音线
  defaultY?: number
  color?: string
}

// 记号
export interface Notation {
  tied?: { type: string }
  slur?: { type: string, number: number }
  fermata?: string
  articulations?: string[]
  tuplet?: { type: string, number: number }
}

// 小节属性
export interface MeasureAttributes {
  key: string
  mode: string
  time: string
  divisions: number
  staves: number
  clefs: Clef[]
}

// 谱号
export interface Clef {
  number: number           // 谱表编号
  sign: string             // G, F, C
  line: number
  clefOctaveChange?: number
}

// 方向标记
export interface Direction {
  type: string             // metronome, dynamics, words, rehearsal
  content: any
  staff?: number
  voice?: number
  placement?: string
}

// 小节线
export interface Barline {
  location: string         // left, right
  barStyle: string         // regular, heavy, light-light, light-heavy
  repeat?: { direction: string, times?: number }
}

// 打印布局
export interface PrintLayout {
  newSystem?: boolean
  newPage?: boolean
  systemLayout?: SystemLayout
  staffLayout?: StaffLayout
}

// 系统布局
export interface SystemLayout {
  systemMargins: {
    leftMargin: number
    rightMargin: number
  }
  systemDistance?: number
  topSystemDistance?: number
}

// 谱表布局
export interface StaffLayout {
  staffDistance: number
}

// =============================================
// 旧接口（兼容性）
// =============================================

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
  staffSpacing: number   // 谱表间距（钢琴左右手）
}

// 五线谱布局
export interface StaveLayout {
  id: string
  partId: string
  partName: string
  staves: number
  x: number
  y: number
  width: number
  height: number
  measures: MeasureLayout[]
  isGrandStaff?: boolean
}

// 小节布局
export interface MeasureLayout {
  id: string
  x: number
  y: number
  width: number
  height: number
  notes: NoteLayout[]
  number: number
}

// 音符布局
export interface NoteLayout {
  id: string
  x: number
  y: number
  width: number
  height: number
  staff: number
  voice: number
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

// =============================================
// 常量和默认值
// =============================================

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
  measurePadding: 10,
  staffSpacing: 60     // 钢琴左右手间距
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

// 谱号类型映射
export const CLEF_SIGN_MAP: Record<string, string> = {
  'G': 'treble',
  'F': 'bass',
  'C': 'alto',
  'percussion': 'percussion'
}

// 五度圈到调号的映射
export const FIFTHS_TO_MAJOR_KEY: string[] = [
  'Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'
]

export const FIFTHS_TO_MINOR_KEY: string[] = [
  'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#'
]

// 音符时值映射
export const NOTE_TYPE_TO_DURATION: Record<string, number> = {
  'whole': 4,
  'half': 2,
  'quarter': 1,
  'eighth': 0.5,
  '16th': 0.25,
  '32nd': 0.125,
  '64th': 0.0625
}