import type { 
  MusicXMLParseResult, 
  ScoreMetadata, 
  Part, 
  Measure, 
  Note, 
  Annotation,
  MeasureAttributes
} from '../types'

export class MusicXMLParser {
  private parser: DOMParser
  private doc: Document | null = null

  constructor() {
    this.parser = new DOMParser()
  }

  /**
   * 解析MusicXML文件
   */
  async parse(file: File): Promise<MusicXMLParseResult> {
    const content = await this.readFileContent(file)
    this.doc = this.parser.parseFromString(content, 'text/xml')
    
    if (!this.validate(this.doc)) {
      throw new Error('无效的MusicXML文件格式')
    }

    return {
      metadata: this.extractMetadata(),
      parts: this.extractParts(),
      measures: this.extractMeasures(),
      notes: this.extractNotes(),
      annotations: this.extractAnnotations()
    }
  }

  /**
   * 解析MusicXML字符串
   */
  parseFromString(xml: string): MusicXMLParseResult {
    this.doc = this.parser.parseFromString(xml, 'text/xml')
    
    if (!this.validate(this.doc)) {
      throw new Error('无效的MusicXML文件格式')
    }

    return {
      metadata: this.extractMetadata(),
      parts: this.extractParts(),
      measures: this.extractMeasures(),
      notes: this.extractNotes(),
      annotations: this.extractAnnotations()
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
    // 检查是否为有效的XML
    if (xml.querySelector('parsererror')) {
      return false
    }

    // 检查是否包含必要的MusicXML元素
    const scorePartwise = xml.querySelector('score-partwise')
    const scoreTimewise = xml.querySelector('score-timewise')
    
    if (!scorePartwise && !scoreTimewise) {
      return false
    }

    return true
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
      keySignature: '',
      timeSignature: '',
      tempo: 120
    }

    // 提取标题
    const workTitle = this.doc.querySelector('work-title')
    const movementTitle = this.doc.querySelector('movement-title')
    metadata.title = workTitle?.textContent || movementTitle?.textContent || '未知作品'

    // 提取作曲家
    const creator = this.doc.querySelector('creator[type="composer"]')
    metadata.composer = creator?.textContent || '未知作曲家'

    // 提取调号
    const key = this.doc.querySelector('key')
    if (key) {
      const keyStep = key.querySelector('fifths')
      const keyMode = key.querySelector('mode')
      if (keyStep) {
        const fifths = parseInt(keyStep.textContent || '0')
        metadata.keySignature = this.fifthsToKeySignature(fifths, keyMode?.textContent || 'major')
      }
    }

    // 提取拍号
    const time = this.doc.querySelector('time')
    if (time) {
      const beats = time.querySelector('beats')
      const beatType = time.querySelector('beat-type')
      if (beats && beatType) {
        metadata.timeSignature = `${beats.textContent}/${beatType.textContent}`
      }
    }

    // 提取速度
    const direction = this.doc.querySelector('direction[tempo]')
    if (direction) {
      const tempo = direction.querySelector('sound[tempo]')
      if (tempo) {
        metadata.tempo = parseInt(tempo.getAttribute('tempo') || '120')
      }
    }

    return metadata
  }

  /**
   * 提取谱表
   */
  extractParts(): Part[] {
    if (!this.doc) {
      throw new Error('文档未加载')
    }

    const parts: Part[] = []
    const partElements = this.doc.querySelectorAll('part')

    partElements.forEach((partElement, index) => {
      const partId = partElement.getAttribute('id') || `P${index + 1}`
      
      // 从part-list中获取谱表名称
      const partList = this.doc!.querySelector('part-list')
      let partName = `谱表 ${index + 1}`
      
      if (partList) {
        const scorePart = partList.querySelector(`score-part[id="${partId}"]`)
        if (scorePart) {
          const partNameElement = scorePart.querySelector('part-name')
          if (partNameElement) {
            partName = partNameElement.textContent || partName
          }
        }
      }

      // 获取该谱表包含的小节ID
      const measureElements = partElement.querySelectorAll('measure')
      const measureIds: string[] = []
      
      measureElements.forEach((measureElement, measureIndex) => {
        const measureId = `${partId}_M${measureIndex + 1}`
        measureIds.push(measureId)
      })

      parts.push({
        id: partId,
        name: partName,
        measures: measureIds
      })
    })

    return parts
  }

  /**
   * 提取小节
   */
  extractMeasures(): Measure[] {
    if (!this.doc) {
      throw new Error('文档未加载')
    }

    const measures: Measure[] = []
    const partElements = this.doc.querySelectorAll('part')

    partElements.forEach((partElement) => {
      const partId = partElement.getAttribute('id') || ''
      const measureElements = partElement.querySelectorAll('measure')

      measureElements.forEach((measureElement, measureIndex) => {
        const measureNumber = parseInt(measureElement.getAttribute('number') || `${measureIndex + 1}`)
        const measureId = `${partId}_M${measureNumber}`

        // 提取小节属性
        const attributes = this.extractMeasureAttributes(measureElement)

        // 提取音符ID
        const noteElements = measureElement.querySelectorAll('note')
        const noteIds: string[] = []
        
        noteElements.forEach((noteElement, noteIndex) => {
          const noteId = `${measureId}_N${noteIndex + 1}`
          noteIds.push(noteId)
        })

        // 提取标注ID（从direction或harmony元素）
        const annotationIds: string[] = []
        const directions = measureElement.querySelectorAll('direction')
        directions.forEach((direction, index) => {
          annotationIds.push(`${measureId}_A${index + 1}`)
        })

        measures.push({
          id: measureId,
          number: measureNumber,
          attributes,
          notes: noteIds,
          annotations: annotationIds
        })
      })
    })

    return measures
  }

  /**
   * 提取小节属性
   */
  private extractMeasureAttributes(measureElement: Element): MeasureAttributes {
    const attributes: MeasureAttributes = {
      key: 'C',
      time: '4/4',
      clef: 'treble',
      divisions: 1
    }

    const attributesElement = measureElement.querySelector('attributes')
    if (attributesElement) {
      // 提取调号
      const keyElement = attributesElement.querySelector('key')
      if (keyElement) {
        const fifthsElement = keyElement.querySelector('fifths')
        if (fifthsElement) {
          const fifths = parseInt(fifthsElement.textContent || '0')
          attributes.key = this.fifthsToKeySignature(fifths, 'major')
        }
      }

      // 提取拍号
      const timeElement = attributesElement.querySelector('time')
      if (timeElement) {
        const beats = timeElement.querySelector('beats')
        const beatType = timeElement.querySelector('beat-type')
        if (beats && beatType) {
          attributes.time = `${beats.textContent}/${beatType.textContent}`
        }
      }

      // 提取谱号
      const clefElement = attributesElement.querySelector('clef')
      if (clefElement) {
        const sign = clefElement.querySelector('sign')
        if (sign) {
          attributes.clef = sign.textContent || 'treble'
        }
      }

      // 提取divisions
      const divisionsElement = attributesElement.querySelector('divisions')
      if (divisionsElement) {
        attributes.divisions = parseInt(divisionsElement.textContent || '1')
      }
    }

    return attributes
  }

  /**
   * 提取音符
   */
  extractNotes(): Note[] {
    if (!this.doc) {
      throw new Error('文档未加载')
    }

    const notes: Note[] = []
    const partElements = this.doc.querySelectorAll('part')

    partElements.forEach((partElement) => {
      const partId = partElement.getAttribute('id') || ''
      const measureElements = partElement.querySelectorAll('measure')

      measureElements.forEach((measureElement, measureIndex) => {
        const measureNumber = parseInt(measureElement.getAttribute('number') || `${measureIndex + 1}`)
        const measureId = `${partId}_M${measureNumber}`
        const noteElements = measureElement.querySelectorAll('note')

        noteElements.forEach((noteElement, noteIndex) => {
          const noteId = `${measureId}_N${noteIndex + 1}`
          const note = this.extractNoteData(noteElement, noteId)
          if (note) {
            notes.push(note)
          }
        })
      })
    })

    return notes
  }

  /**
   * 提取单个音符数据
   */
  private extractNoteData(noteElement: Element, noteId: string): Note | null {
    // 跳过休止符
    const rest = noteElement.querySelector('rest')
    if (rest) {
      return null
    }

    const pitchElement = noteElement.querySelector('pitch')
    if (!pitchElement) {
      return null
    }

    const step = pitchElement.querySelector('step')?.textContent || 'C'
    const octave = pitchElement.querySelector('octave')?.textContent || '4'
    const alter = pitchElement.querySelector('alter')?.textContent || '0'
    
    let pitch = `${step}${octave}`
    if (alter !== '0') {
      const alterNum = parseInt(alter)
      if (alterNum > 0) {
        pitch = `${step}${'#'.repeat(alterNum)}${octave}`
      } else if (alterNum < 0) {
        pitch = `${step}${'b'.repeat(Math.abs(alterNum))}${octave}`
      }
    }

    const duration = parseInt(noteElement.querySelector('duration')?.textContent || '1')
    const type = noteElement.querySelector('type')?.textContent || 'quarter'
    
    let stem = 'up'
    const stemElement = noteElement.querySelector('stem')
    if (stemElement) {
      stem = stemElement.textContent || 'up'
    }

    let beam: string | undefined
    const beamElement = noteElement.querySelector('beam')
    if (beamElement) {
      beam = beamElement.textContent || undefined
    }

    let accidental: string | undefined
    const accidentalElement = noteElement.querySelector('accidental')
    if (accidentalElement) {
      accidental = accidentalElement.textContent || undefined
    }

    let dots = 0
    const dotElements = noteElement.querySelectorAll('dot')
    dots = dotElements.length

    return {
      id: noteId,
      pitch,
      duration,
      type,
      stem,
      beam,
      accidental,
      dots
    }
  }

  /**
   * 提取标注
   */
  extractAnnotations(): Annotation[] {
    if (!this.doc) {
      throw new Error('文档未加载')
    }

    const annotations: Annotation[] = []
    const partElements = this.doc.querySelectorAll('part')

    partElements.forEach((partElement) => {
      const partId = partElement.getAttribute('id') || ''
      const measureElements = partElement.querySelectorAll('measure')

      measureElements.forEach((measureElement, measureIndex) => {
        const measureNumber = parseInt(measureElement.getAttribute('number') || `${measureIndex + 1}`)
        const measureId = `${partId}_M${measureNumber}`

        // 提取direction元素作为标注
        const directions = measureElement.querySelectorAll('direction')
        directions.forEach((direction, index) => {
          const annotation = this.extractAnnotationFromDirection(direction, `${measureId}_A${index + 1}`, measureNumber)
          if (annotation) {
            annotations.push(annotation)
          }
        })

        // 提取harmony元素作为和声标注
        const harmonies = measureElement.querySelectorAll('harmony')
        harmonies.forEach((harmony, index) => {
          const annotation = this.extractAnnotationFromHarmony(harmony, `${measureId}_H${index + 1}`, measureNumber)
          if (annotation) {
            annotations.push(annotation)
          }
        })
      })
    })

    return annotations
  }

  /**
   * 从direction元素提取标注
   */
  private extractAnnotationFromDirection(direction: Element, annotationId: string, measureNumber: number): Annotation | null {
    const directionType = direction.querySelector('direction-type')
    if (!directionType) {
      return null
    }

    // 尝试提取文本标注
    const words = directionType.querySelector('words')
    if (words) {
      const content = words.textContent || ''
      const type = this.inferAnnotationType(content)
      
      return {
        id: annotationId,
        type,
        level: 'basic',
        startMeasure: measureNumber,
        endMeasure: measureNumber,
        content,
        style: this.getDefaultStyleForType(type)
      }
    }

    return null
  }

  /**
   * 从harmony元素提取和声标注
   */
  private extractAnnotationFromHarmony(harmony: Element, annotationId: string, measureNumber: number): Annotation | null {
    const root = harmony.querySelector('root')
    const kind = harmony.querySelector('kind')
    
    if (root && kind) {
      const rootStep = root.querySelector('root-step')?.textContent || ''
      const rootAlter = root.querySelector('root-alter')?.textContent || '0'
      const kindText = kind.textContent || ''
      
      let content = rootStep
      if (rootAlter !== '0') {
        const alterNum = parseInt(rootAlter)
        if (alterNum > 0) {
          content += '#'
        } else if (alterNum < 0) {
          content += 'b'
        }
      }
      content += ` ${kindText}`

      return {
        id: annotationId,
        type: 'harmonic',
        level: 'basic',
        startMeasure: measureNumber,
        endMeasure: measureNumber,
        content,
        style: this.getDefaultStyleForType('harmonic')
      }
    }

    return null
  }

  /**
   * 推断标注类型
   */
  private inferAnnotationType(content: string): 'structural' | 'motivic' | 'harmonic' | 'annotation' {
    const lowerContent = content.toLowerCase()
    
    // 结构性标注关键词
    const structuralKeywords = ['exposition', 'development', 'recapitulation', 'coda', 'introduction', 
                               '呈示部', '展开部', '再现部', '尾声', '引子']
    
    // 动机性标注关键词
    const motivicKeywords = ['motive', 'motif', 'theme', 'subject', '动机', '主题']
    
    // 和声性标注关键词
    const harmonicKeywords = ['tonic', 'dominant', 'subdominant', 'chord', 'harmony',
                             '主和弦', '属和弦', '下属和弦', '和弦', '和声']
    
    if (structuralKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'structural'
    }
    
    if (motivicKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'motivic'
    }
    
    if (harmonicKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'harmonic'
    }
    
    return 'annotation'
  }

  /**
   * 获取类型默认样式
   */
  private getDefaultStyleForType(type: string) {
    const styles = {
      structural: {
        color: '#ffffff',
        backgroundColor: 'rgba(64, 158, 255, 0.2)',
        borderColor: '#409eff',
        borderWidth: 2,
        fontSize: 14,
        fontFamily: 'Arial, sans-serif'
      },
      motivic: {
        color: '#ffffff',
        backgroundColor: 'rgba(103, 194, 58, 0.2)',
        borderColor: '#67c23a',
        borderWidth: 2,
        fontSize: 12,
        fontFamily: 'Arial, sans-serif'
      },
      harmonic: {
        color: '#ffffff',
        backgroundColor: 'rgba(230, 162, 60, 0.2)',
        borderColor: '#e6a23c',
        borderWidth: 2,
        fontSize: 12,
        fontFamily: 'Arial, sans-serif'
      },
      annotation: {
        color: '#ffffff',
        backgroundColor: 'rgba(144, 147, 153, 0.2)',
        borderColor: '#909399',
        borderWidth: 1,
        fontSize: 11,
        fontFamily: 'Arial, sans-serif'
      }
    }
    
    return styles[type as keyof typeof styles] || styles.annotation
  }

  /**
   * 将五度圈位置转换为调号
   */
  private fifthsToKeySignature(fifths: number, mode: string): string {
    const majorKeys = ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#']
    const minorKeys = ['Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#']
    
    const index = fifths + 7 // 调整索引，C大调对应7
    
    if (mode === 'minor') {
      return minorKeys[index] || 'C'
    }
    
    return majorKeys[index] || 'C'
  }
}

// 导出单例实例
export const musicXMLParser = new MusicXMLParser()