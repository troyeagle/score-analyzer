import type { 
  MusicXMLParseResult, 
  ScoreMetadata, 
  Credit,
  Part, 
  PartInfo,
  PartGroup,
  Measure, 
  Voice,
  Note, 
  Lyric,
  Notation,
  MeasureAttributes,
  Clef,
  Direction,
  Barline,
  PrintLayout,
  Transpose
} from '../types'

export class MusicXMLParser {
  private parser: DOMParser
  private doc: Document | null = null
  private debug: boolean = true

  constructor() {
    this.parser = new DOMParser()
  }

  /**
   * 设置调试模式
   */
  setDebug(enabled: boolean): void {
    this.debug = enabled
  }

  /**
   * 打印调试信息
   */
  private log(message: string, data?: any): void {
    if (this.debug) {
      if (data !== undefined) {
        console.log(`[MusicXMLParser] ${message}`, data)
      } else {
        console.log(`[MusicXMLParser] ${message}`)
      }
    }
  }

  /**
   * 解析MusicXML文件
   */
  async parse(file: File, startMeasure?: number, endMeasure?: number): Promise<MusicXMLParseResult> {
    this.log(`开始解析文件: ${file.name}, 大小: ${file.size} bytes`)
    const content = await this.readFileContent(file)
    return this.parseFromString(content, startMeasure, endMeasure)
  }

  /**
   * 解析MusicXML字符串
   */
  parseFromString(xml: string, startMeasure?: number, endMeasure?: number): MusicXMLParseResult {
    this.log('开始解析XML字符串, 长度:', xml.length)
    
    this.doc = this.parser.parseFromString(xml, 'text/xml')
    
    if (!this.validate(this.doc)) {
      throw new Error('无效的MusicXML文件格式')
    }

    this.log('XML解析成功，开始提取元数据')
    const metadata = this.extractMetadata()
    
    this.log('开始提取声部列表')
    const parts = this.extractParts(startMeasure, endMeasure)

    this.log('解析完成', {
      title: metadata.title,
      composer: metadata.composer,
      partsCount: parts.length,
      partNames: parts.map(p => p.name),
      measuresPerPart: parts.map(p => p.measures.length)
    })

    return {
      metadata,
      parts
    }
  }

  /**
   * 读取文件内容
   */
  private readFileContent(file: File): Promise<string> {
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

  /**
   * 验证MusicXML格式
   */
  validate(xml: Document): boolean {
    if (xml.querySelector('parsererror')) {
      return false
    }
    const scorePartwise = xml.querySelector('score-partwise')
    const scoreTimewise = xml.querySelector('score-timewise')
    return !!(scorePartwise || scoreTimewise)
  }

  /**
   * 提取元数据
   */
  extractMetadata(): ScoreMetadata {
    if (!this.doc) {
      throw new Error('文档未加载')
    }

    const metadata: ScoreMetadata = {
      title: '',
      composer: '',
      keySignature: 'C',
      timeSignature: '4/4',
      tempo: 120,
      credits: []
    }

    // 提取标题
    const workTitle = this.doc.querySelector('work > work-title')
    const movementTitle = this.doc.querySelector('movement-title')
    metadata.title = workTitle?.textContent || movementTitle?.textContent || '未知作品'

    // 提取作曲家
    const creator = this.doc.querySelector('creator[type="composer"]')
    metadata.composer = creator?.textContent || '未知作曲家'

    // 提取调号（从第一个 part 的第一个 measure）
    const firstPart = this.doc.querySelector('part')
    if (firstPart) {
      const firstMeasure = firstPart.querySelector('measure')
      if (firstMeasure) {
        const attributes = firstMeasure.querySelector('attributes')
        if (attributes) {
          const keyElement = attributes.querySelector('key')
          if (keyElement) {
            const fifths = parseInt(keyElement.querySelector('fifths')?.textContent || '0')
            const mode = keyElement.querySelector('mode')?.textContent || 'major'
            metadata.keySignature = this.fifthsToKeySignature(fifths, mode)
          }
          const timeElement = attributes.querySelector('time')
          if (timeElement) {
            const beats = timeElement.querySelector('beats')?.textContent || '4'
            const beatType = timeElement.querySelector('beat-type')?.textContent || '4'
            metadata.timeSignature = `${beats}/${beatType}`
          }
        }
      }
    }

    // 提取速度
    metadata.tempo = this.extractTempo()

    // 提取 credit 信息
    metadata.credits = this.extractCredits()

    return metadata
  }

  /**
   * 提取速度
   */
  private extractTempo(): number {
    if (!this.doc) return 120

    // 查找 metronome 标记
    const metronome = this.doc.querySelector('metronome')
    if (metronome) {
      const perMinute = metronome.querySelector('per-minute')
      if (perMinute) {
        return parseInt(perMinute.textContent || '120')
      }
    }

    // 查找 sound[tempo] 属性
    const sound = this.doc.querySelector('sound[tempo]')
    if (sound) {
      return parseInt(sound.getAttribute('tempo') || '120')
    }

    return 120
  }

  /**
   * 提取 credit 信息
   */
  private extractCredits(): Credit[] {
    if (!this.doc) return []

    const credits: Credit[] = []
    const creditElements = this.doc.querySelectorAll('credit')

    creditElements.forEach(creditElement => {
      const page = parseInt(creditElement.getAttribute('page') || '1')
      const creditWords = creditElement.querySelector('credit-words')
      
      if (creditWords) {
        credits.push({
          page,
          content: creditWords.textContent || '',
          x: parseFloat(creditWords.getAttribute('default-x') || '0'),
          y: parseFloat(creditWords.getAttribute('default-y') || '0'),
          fontSize: parseFloat(creditWords.getAttribute('font-size') || '12'),
          fontFamily: creditWords.getAttribute('font-family') || undefined,
          fontStyle: creditWords.getAttribute('font-style') || undefined,
          fontWeight: creditWords.getAttribute('font-weight') || undefined,
          justify: creditWords.getAttribute('justify') || undefined
        })
      }
    })

    return credits
  }

  /**
   * 提取声部列表
   */
  extractParts(startMeasure?: number, endMeasure?: number): Part[] {
    if (!this.doc) {
      throw new Error('文档未加载')
    }

    this.log(`提取声部列表, 范围: ${startMeasure || 1} - ${endMeasure || '末尾'}`)

    const parts: Part[] = []
    const partElements = this.doc.querySelectorAll(':scope > part')

    this.log(`找到 ${partElements.length} 个声部元素`)

    // 获取 part-list 信息
    const partInfos = this.extractPartList()

    partElements.forEach((partElement, index) => {
      const partId = partElement.getAttribute('id') || ''
      const partInfo = partInfos.find(p => p.id === partId)
      
      this.log(`处理声部 ${index + 1}/${partElements.length}: ${partId} (${partInfo?.name || '未知'})`)
      
      // 解析谱表数量
      const staves = this.extractStavesCount(partElement)
      
      // 解析移调信息
      const transpose = this.extractTranspose(partElement)

      // 解析小节（支持范围）
      const measures = this.extractMeasures(partElement, staves, startMeasure, endMeasure)

      this.log(`声部 ${partId} 解析完成: ${measures.length} 个小节, ${staves} 个谱表`)

      parts.push({
        id: partId,
        name: partInfo?.name || `Part ${partId}`,
        abbreviation: partInfo?.abbreviation,
        staves,
        measures,
        instrument: partInfo?.instrument,
        transpose
      })
    })

    this.log(`所有声部解析完成，共 ${parts.length} 个声部`)

    return parts
  }

  /**
   * 提取 part-list 信息
   */
  private extractPartList(): PartInfo[] {
    if (!this.doc) return []

    const partInfos: PartInfo[] = []
    const partList = this.doc.querySelector('part-list')
    
    if (!partList) return []

    const scoreParts = partList.querySelectorAll('score-part')
    scoreParts.forEach(scorePart => {
      const id = scorePart.getAttribute('id') || ''
      const name = scorePart.querySelector('part-name')?.textContent || ''
      const abbreviation = scorePart.querySelector('part-abbreviation')?.textContent || ''
      
      const instrumentElement = scorePart.querySelector('score-instrument')
      const instrument = instrumentElement ? {
        id: instrumentElement.getAttribute('id') || '',
        name: instrumentElement.querySelector('instrument-name')?.textContent || '',
        sound: instrumentElement.querySelector('instrument-sound')?.textContent || undefined
      } : undefined

      partInfos.push({ id, name, abbreviation, instrument })
    })

    return partInfos
  }

  /**
   * 提取谱表数量
   */
  private extractStavesCount(partElement: Element): number {
    const stavesElement = partElement.querySelector('attributes > staves')
    if (stavesElement) {
      return parseInt(stavesElement.textContent || '1')
    }
    return 1
  }

  /**
   * 提取移调信息
   */
  private extractTranspose(partElement: Element): Transpose | undefined {
    const transposeElement = partElement.querySelector('attributes > transpose')
    if (!transposeElement) return undefined

    return {
      diatonic: parseInt(transposeElement.querySelector('diatonic')?.textContent || '0'),
      chromatic: parseInt(transposeElement.querySelector('chromatic')?.textContent || '0'),
      octaveChange: parseInt(transposeElement.querySelector('octave-change')?.textContent || '0')
    }
  }

  /**
   * 提取小节（支持范围解析）
   */
  private extractMeasures(partElement: Element, staves: number, startMeasure?: number, endMeasure?: number): Measure[] {
    const measures: Measure[] = []
    const measureElements = partElement.querySelectorAll(':scope > measure')
    
    const totalMeasures = measureElements.length
    const start = startMeasure || 1
    const end = endMeasure || totalMeasures
    
    this.log(`提取小节: 总数=${totalMeasures}, 范围=${start}-${end}`)

    measureElements.forEach((measureElement) => {
      const measureNumber = parseInt(measureElement.getAttribute('number') || '0')
      
      // 范围过滤
      if (measureNumber < start || measureNumber > end) {
        return
      }
      
      const measureId = `${partElement.getAttribute('id')}_M${measureNumber}`
      const width = parseFloat(measureElement.getAttribute('width') || '0')

      // 提取属性
      const attributes = this.extractMeasureAttributes(measureElement, staves)
      
      // 提取声部
      const voices = this.extractVoices(measureElement, measureId)
      
      // 提取方向标记
      const directions = this.extractDirections(measureElement)
      
      // 提取小节线
      const barlines = this.extractBarlines(measureElement)
      
      // 提取打印布局
      const print = this.extractPrintLayout(measureElement)

      measures.push({
        id: measureId,
        number: measureNumber,
        width: width || undefined,
        attributes,
        voices,
        directions,
        barlines,
        print
      })
    })

    this.log(`提取到 ${measures.length} 个小节`)
    return measures
  }

  /**
   * 提取小节属性
   */
  private extractMeasureAttributes(measureElement: Element, defaultStaves: number): MeasureAttributes {
    const attributes: MeasureAttributes = {
      key: 'C',
      mode: 'major',
      time: '4/4',
      divisions: 1,
      staves: defaultStaves,
      clefs: []
    }

    const attributesElement = measureElement.querySelector(':scope > attributes')
    if (!attributesElement) return attributes

    // 提取 divisions
    const divisionsElement = attributesElement.querySelector(':scope > divisions')
    if (divisionsElement) {
      attributes.divisions = parseInt(divisionsElement.textContent || '1')
    }

    // 提取谱表数量
    const stavesElement = attributesElement.querySelector(':scope > staves')
    if (stavesElement) {
      attributes.staves = parseInt(stavesElement.textContent || '1')
    }

    // 提取调号
    const keyElement = attributesElement.querySelector(':scope > key')
    if (keyElement) {
      const fifths = parseInt(keyElement.querySelector(':scope > fifths')?.textContent || '0')
      attributes.key = this.fifthsToKeySignature(fifths, 'major')
      attributes.mode = keyElement.querySelector(':scope > mode')?.textContent || 'major'
    }

    // 提取拍号
    const timeElement = attributesElement.querySelector(':scope > time')
    if (timeElement) {
      const beats = timeElement.querySelector(':scope > beats')?.textContent || '4'
      const beatType = timeElement.querySelector(':scope > beat-type')?.textContent || '4'
      attributes.time = `${beats}/${beatType}`
    }

    // 提取谱号（可能有多个）
    const clefElements = attributesElement.querySelectorAll(':scope > clef')
    clefElements.forEach(clefElement => {
      const number = parseInt(clefElement.getAttribute('number') || '1')
      const sign = clefElement.querySelector(':scope > sign')?.textContent || 'G'
      const line = parseInt(clefElement.querySelector(':scope > line')?.textContent || '2')
      const octaveChange = parseInt(clefElement.querySelector(':scope > clef-octave-change')?.textContent || '0')

      attributes.clefs.push({
        number,
        sign,
        line,
        clefOctaveChange: octaveChange || undefined
      })
    })

    // 如果没有谱号信息，添加默认谱号
    if (attributes.clefs.length === 0) {
      attributes.clefs.push({ number: 1, sign: 'G', line: 2 })
    }

    return attributes
  }

  /**
   * 提取声部（处理 backup）
   */
  private extractVoices(measureElement: Element, measureId: string): Map<number, Voice> {
    const voices = new Map<number, Voice>()
    let noteIndex = 0

    const children = Array.from(measureElement.children)
    let i = 0

    while (i < children.length) {
      const element = children[i]

      if (element.tagName === 'note') {
        const note = this.extractNoteData(element, `${measureId}_N${++noteIndex}`)
        
        if (note) {
          const voiceId = note.voice
          
          if (!voices.has(voiceId)) {
            voices.set(voiceId, {
              id: voiceId,
              staff: note.staff,
              notes: []
            })
          }
          
          voices.get(voiceId)!.notes.push(note)
        }
      }
      // backup 元素不需要处理，voice 已经正确分配
      // backup 只是表示时间点的回退，不影响数据结构

      i++
    }

    return voices
  }

  /**
   * 提取单个音符数据
   */
  private extractNoteData(noteElement: Element, noteId: string): Note | null {
    // 检查是否为休止符
    const isRest = !!noteElement.querySelector(':scope > rest')
    
    // 提取 voice
    const voice = parseInt(noteElement.querySelector(':scope > voice')?.textContent || '1')
    
    // 提取 staff
    const staff = parseInt(noteElement.querySelector(':scope > staff')?.textContent || '1')

    // 提取音高
    let pitch = ''
    if (!isRest) {
      const pitchElement = noteElement.querySelector(':scope > pitch')
      if (pitchElement) {
        const step = pitchElement.querySelector(':scope > step')?.textContent || 'C'
        const octave = pitchElement.querySelector(':scope > octave')?.textContent || '4'
        const alter = pitchElement.querySelector(':scope > alter')?.textContent || '0'
        
        pitch = `${step}${octave}`
        if (alter !== '0') {
          const alterNum = parseInt(alter)
          if (alterNum > 0) {
            pitch = `${step}${'#'.repeat(alterNum)}${octave}`
          } else if (alterNum < 0) {
            pitch = `${step}${'b'.repeat(Math.abs(alterNum))}${octave}`
          }
        }
      }
    }

    // 提取时值
    const duration = parseInt(noteElement.querySelector(':scope > duration')?.textContent || '0')
    const type = noteElement.querySelector(':scope > type')?.textContent || 'quarter'

    // 提取 stem
    const stem = noteElement.querySelector(':scope > stem')?.textContent || 'up'

    // 提取 beam
    const beamElement = noteElement.querySelector(':scope > beam')
    const beam = beamElement?.textContent || undefined

    // 提取 accidental
    const accidentalElement = noteElement.querySelector(':scope > accidental')
    const accidental = accidentalElement?.textContent || undefined

    // 提取附点
    const dots = noteElement.querySelectorAll(':scope > dot').length

    // 检查是否为和弦
    const isChord = !!noteElement.querySelector(':scope > chord')

    // 提取连音线
    let tie: 'start' | 'stop' | 'continue' | undefined
    const tieElement = noteElement.querySelector(':scope > tie')
    if (tieElement) {
      tie = tieElement.getAttribute('type') as 'start' | 'stop' | 'continue'
    }

    // 提取歌词
    const lyrics = this.extractLyrics(noteElement)

    // 提取记号
    const notations = this.extractNotations(noteElement)

    // 提取颜色
    const color = noteElement.getAttribute('color') || undefined

    // 提取位置
    const defaultX = parseFloat(noteElement.getAttribute('default-x') || '0') || undefined
    const defaultY = parseFloat(noteElement.getAttribute('default-y') || '0') || undefined

    return {
      id: noteId,
      pitch,
      duration,
      type,
      stem,
      beam,
      accidental,
      dots,
      voice,
      staff,
      isChord,
      isRest,
      tie,
      lyrics,
      notations,
      color,
      defaultX,
      defaultY
    }
  }

  /**
   * 提取歌词
   */
  private extractLyrics(noteElement: Element): Lyric[] {
    const lyrics: Lyric[] = []
    const lyricElements = noteElement.querySelectorAll(':scope > lyric')

    lyricElements.forEach(lyricElement => {
      const number = lyricElement.getAttribute('number') || ''
      const syllabic = lyricElement.querySelector(':scope > syllabic')?.textContent || 'single'
      const text = lyricElement.querySelector(':scope > text')?.textContent || ''
      const extend = !!lyricElement.querySelector(':scope > extend')
      const defaultY = parseFloat(lyricElement.getAttribute('default-y') || '0') || undefined
      const color = lyricElement.getAttribute('color') || undefined

      lyrics.push({
        number,
        syllabic,
        text,
        extend,
        defaultY,
        color
      })
    })

    return lyrics
  }

  /**
   * 提取记号
   */
  private extractNotations(noteElement: Element): Notation[] {
    const notations: Notation[] = []
    const notationsElement = noteElement.querySelector(':scope > notations')
    
    if (!notationsElement) return notations

    const notation: Notation = {}

    // 提取连音线
    const tiedElements = notationsElement.querySelectorAll(':scope > tied')
    if (tiedElements.length > 0) {
      notation.tied = {
        type: tiedElements[0].getAttribute('type') || 'start'
      }
    }

    // 提取圆滑线
    const slurElements = notationsElement.querySelectorAll(':scope > slur')
    slurElements.forEach(slurElement => {
      notation.slur = {
        type: slurElement.getAttribute('type') || 'start',
        number: parseInt(slurElement.getAttribute('number') || '1')
      }
    })

    // 提取延长记号
    const fermataElement = notationsElement.querySelector(':scope > fermata')
    if (fermataElement) {
      notation.fermata = fermataElement.textContent || 'normal'
    }

    // 提取演奏法
    const articulationsElement = notationsElement.querySelector(':scope > articulations')
    if (articulationsElement) {
      notation.articulations = []
      const articulationTypes = ['accent', 'staccato', 'tenuto', 'marcato']
      articulationTypes.forEach(type => {
        if (articulationsElement.querySelector(`:scope > ${type}`)) {
          notation.articulations!.push(type)
        }
      })
    }

    if (Object.keys(notation).length > 0) {
      notations.push(notation)
    }

    return notations
  }

  /**
   * 提取方向标记
   */
  private extractDirections(measureElement: Element): Direction[] {
    const directions: Direction[] = []
    const directionElements = measureElement.querySelectorAll(':scope > direction')

    directionElements.forEach(directionElement => {
      const directionType = directionElement.querySelector(':scope > direction-type')
      if (!directionType) return

      const staff = parseInt(directionElement.querySelector(':scope > staff')?.textContent || '0') || undefined
      const voice = parseInt(directionElement.querySelector(':scope > voice')?.textContent || '0') || undefined
      const placement = directionElement.getAttribute('placement') || undefined

      // 速度标记
      const metronome = directionType.querySelector(':scope > metronome')
      if (metronome) {
        const beatUnit = metronome.querySelector(':scope > beat-unit')?.textContent || 'quarter'
        const perMinute = metronome.querySelector(':scope > per-minute')?.textContent || '120'
        directions.push({
          type: 'metronome',
          content: { beatUnit, perMinute: parseInt(perMinute) },
          staff,
          voice,
          placement
        })
      }

      // 力度标记
      const dynamics = directionType.querySelector(':scope > dynamics')
      if (dynamics) {
        const dynamicType = dynamics.children[0]?.tagName || 'mf'
        directions.push({
          type: 'dynamics',
          content: dynamicType,
          staff,
          voice,
          placement
        })
      }

      // 文字标记
      const words = directionType.querySelector(':scope > words')
      if (words) {
        directions.push({
          type: 'words',
          content: words.textContent || '',
          staff,
          voice,
          placement
        })
      }

      // 排练标记
      const rehearsal = directionType.querySelector(':scope > rehearsal')
      if (rehearsal) {
        directions.push({
          type: 'rehearsal',
          content: rehearsal.textContent || '',
          staff,
          voice,
          placement
        })
      }
    })

    return directions
  }

  /**
   * 提取小节线
   */
  private extractBarlines(measureElement: Element): Barline[] {
    const barlines: Barline[] = []
    const barlineElements = measureElement.querySelectorAll(':scope > barline')

    barlineElements.forEach(barlineElement => {
      const location = barlineElement.getAttribute('location') || 'right'
      const barStyle = barlineElement.querySelector(':scope > bar-style')?.textContent || 'regular'
      
      const repeatElement = barlineElement.querySelector(':scope > repeat')
      const repeat = repeatElement ? {
        direction: repeatElement.getAttribute('direction') || 'forward',
        times: parseInt(repeatElement.getAttribute('times') || '0') || undefined
      } : undefined

      barlines.push({
        location,
        barStyle,
        repeat
      })
    })

    return barlines
  }

  /**
   * 提取打印布局
   */
  private extractPrintLayout(measureElement: Element): PrintLayout | undefined {
    const printElement = measureElement.querySelector(':scope > print')
    if (!printElement) return undefined

    const print: PrintLayout = {
      newSystem: printElement.getAttribute('new-system') === 'yes',
      newPage: printElement.getAttribute('new-page') === 'yes'
    }

    // 系统布局
    const systemLayoutElement = printElement.querySelector(':scope > system-layout')
    if (systemLayoutElement) {
      const systemMargins = systemLayoutElement.querySelector(':scope > system-margins')
      print.systemLayout = {
        systemMargins: {
          leftMargin: parseFloat(systemMargins?.querySelector(':scope > left-margin')?.textContent || '0'),
          rightMargin: parseFloat(systemMargins?.querySelector(':scope > right-margin')?.textContent || '0')
        },
        systemDistance: parseFloat(systemLayoutElement.querySelector(':scope > system-distance')?.textContent || '0') || undefined,
        topSystemDistance: parseFloat(systemLayoutElement.querySelector(':scope > top-system-distance')?.textContent || '0') || undefined
      }
    }

    // 谱表布局
    const staffLayoutElement = printElement.querySelector(':scope > staff-layout')
    if (staffLayoutElement) {
      print.staffLayout = {
        staffDistance: parseFloat(staffLayoutElement.querySelector(':scope > staff-distance')?.textContent || '0')
      }
    }

    return print
  }

  /**
   * 将五度圈位置转换为调号
   */
  private fifthsToKeySignature(fifths: number, mode: string): string {
    const majorKeys = ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#']
    const minorKeys = ['Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#']
    
    const index = fifths + 7
    
    if (mode === 'minor') {
      return minorKeys[index] || 'C'
    }
    
    return majorKeys[index] || 'C'
  }
}

// 导出单例实例
export const musicXMLParser = new MusicXMLParser()