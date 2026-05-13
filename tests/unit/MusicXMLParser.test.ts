import { describe, it, expect, beforeEach } from 'vitest'
import { MusicXMLParser } from '../../src/services/MusicXMLParser'

describe('MusicXMLParser - 多声部支持', () => {
  let parser: MusicXMLParser

  beforeEach(() => {
    parser = new MusicXMLParser()
  })

  describe('基本解析', () => {
    it('应该正确解析小节数量', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list>
            <score-part id="P1"><part-name>Soprano</part-name></score-part>
            <score-part id="P2"><part-name>Alto</part-name></score-part>
          </part-list>
          <part id="P1">
            <measure number="1"><note><pitch><step>C</step><octave>4</octave></pitch><duration>256</duration><type>quarter</type><voice>1</voice><staff>1</staff></note></measure>
            <measure number="2"><note><pitch><step>D</step><octave>4</octave></pitch><duration>256</duration><type>quarter</type><voice>1</voice><staff>1</staff></note></measure>
          </part>
          <part id="P2">
            <measure number="1"><note><pitch><step>E</step><octave>4</octave></pitch><duration>256</duration><type>quarter</type><voice>1</voice><staff>1</staff></note></measure>
            <measure number="2"><note><pitch><step>F</step><octave>4</octave></pitch><duration>256</duration><type>quarter</type><voice>1</voice><staff>1</staff></note></measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)
      
      // 应该有 2 个声部
      expect(result.parts).toHaveLength(2)
      
      // 每个声部应该有 2 个小节
      expect(result.parts[0].measures).toHaveLength(2)
      expect(result.parts[1].measures).toHaveLength(2)
      
      // 不应该是扁平的 4 个小节
      const totalMeasures = result.parts.reduce((sum, p) => sum + p.measures.length, 0)
      expect(totalMeasures).toBe(4)
    })

    it('应该正确解析声部名称', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list>
            <score-part id="P1">
              <part-name>Solo</part-name>
              <part-abbreviation>Sol</part-abbreviation>
            </score-part>
          </part-list>
          <part id="P1">
            <measure number="1"><note><pitch><step>C</step><octave>4</octave></pitch><duration>256</duration><type>quarter</type><voice>1</voice><staff>1</staff></note></measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)
      
      expect(result.parts[0].name).toBe('Solo')
      expect(result.parts[0].abbreviation).toBe('Sol')
    })
  })

  describe('多谱表支持', () => {
    it('应该正确解析钢琴的双谱表', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list>
            <score-part id="P1"><part-name>Piano</part-name></score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <attributes>
                <staves>2</staves>
                <clef number="1"><sign>G</sign><line>2</line></clef>
                <clef number="2"><sign>F</sign><line>4</line></clef>
              </attributes>
              <note>
                <pitch><step>C</step><octave>5</octave></pitch>
                <duration>256</duration>
                <type>quarter</type>
                <voice>1</voice>
                <staff>1</staff>
              </note>
              <note>
                <pitch><step>E</step><octave>3</octave></pitch>
                <duration>256</duration>
                <type>quarter</type>
                <voice>2</voice>
                <staff>2</staff>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)
      
      // 应该有 2 个谱表
      expect(result.parts[0].staves).toBe(2)
      
      // 应该有 2 个声部
      const measure = result.parts[0].measures[0]
      expect(measure.voices.size).toBe(2)
      
      // 第一个声部在谱表 1
      const voice1 = measure.voices.get(1)
      expect(voice1?.staff).toBe(1)
      
      // 第二个声部在谱表 2
      const voice2 = measure.voices.get(2)
      expect(voice2?.staff).toBe(2)
    })

    it('应该正确解析多个谱号', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list>
            <score-part id="P1"><part-name>Piano</part-name></score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <attributes>
                <staves>2</staves>
                <clef number="1"><sign>G</sign><line>2</line></clef>
                <clef number="2"><sign>F</sign><line>4</line></clef>
              </attributes>
              <note><pitch><step>C</step><octave>4</octave></pitch><duration>256</duration><type>quarter</type><voice>1</voice><staff>1</staff></note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)
      
      const attributes = result.parts[0].measures[0].attributes
      expect(attributes.clefs).toHaveLength(2)
      expect(attributes.clefs[0].sign).toBe('G')
      expect(attributes.clefs[1].sign).toBe('F')
    })
  })

  describe('多声部和 Backup', () => {
    it('应该正确处理多 voice', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list>
            <score-part id="P1"><part-name>Piano</part-name></score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <attributes>
                <staves>2</staves>
                <divisions>256</divisions>
              </attributes>
              <note>
                <pitch><step>C</step><octave>5</octave></pitch>
                <duration>256</duration>
                <type>quarter</type>
                <voice>1</voice>
                <staff>1</staff>
              </note>
              <note>
                <pitch><step>E</step><octave>5</octave></pitch>
                <duration>256</duration>
                <type>quarter</type>
                <voice>1</voice>
                <staff>1</staff>
              </note>
              <backup><duration>512</duration></backup>
              <note>
                <pitch><step>C</step><octave>3</octave></pitch>
                <duration>512</duration>
                <type>half</type>
                <voice>2</voice>
                <staff>2</staff>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)
      
      const measure = result.parts[0].measures[0]
      
      // 应该有 2 个声部
      expect(measure.voices.size).toBe(2)
      
      // voice 1 应该有 2 个音符
      const voice1 = measure.voices.get(1)
      expect(voice1?.notes).toHaveLength(2)
      expect(voice1?.notes[0].pitch).toBe('C5')
      expect(voice1?.notes[1].pitch).toBe('E5')
      
      // voice 2 应该有 1 个音符
      const voice2 = measure.voices.get(2)
      expect(voice2?.notes).toHaveLength(1)
      expect(voice2?.notes[0].pitch).toBe('C3')
    })
  })

  describe('歌词解析', () => {
    it('应该正确解析歌词', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list>
            <score-part id="P1"><part-name>Soprano</part-name></score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <note>
                <pitch><step>C</step><octave>4</octave></pitch>
                <duration>256</duration>
                <type>quarter</type>
                <voice>1</voice>
                <staff>1</staff>
                <lyric number="1">
                  <syllabic>single</syllabic>
                  <text>君</text>
                </lyric>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)
      
      const note = result.parts[0].measures[0].voices.get(1)!.notes[0]
      expect(note.lyrics).toHaveLength(1)
      expect(note.lyrics[0].text).toBe('君')
      expect(note.lyrics[0].syllabic).toBe('single')
    })

    it('应该解析多行歌词', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list>
            <score-part id="P1"><part-name>Soprano</part-name></score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <note>
                <pitch><step>C</step><octave>4</octave></pitch>
                <duration>256</duration>
                <type>quarter</type>
                <voice>1</voice>
                <staff>1</staff>
                <lyric number="part1verse1">
                  <syllabic>single</syllabic>
                  <text>君</text>
                </lyric>
                <lyric number="part1verse2">
                  <syllabic>single</syllabic>
                  <text>ki</text>
                </lyric>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)
      
      const note = result.parts[0].measures[0].voices.get(1)!.notes[0]
      expect(note.lyrics).toHaveLength(2)
      expect(note.lyrics[0].text).toBe('君')
      expect(note.lyrics[1].text).toBe('ki')
    })
  })

  describe('连音线解析', () => {
    it('应该正确解析连音线', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list>
            <score-part id="P1"><part-name>Soprano</part-name></score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <note>
                <pitch><step>C</step><octave>4</octave></pitch>
                <duration>256</duration>
                <type>quarter</type>
                <voice>1</voice>
                <staff>1</staff>
                <tie type="start"/>
                <notations><tied type="start"/></notations>
              </note>
            </measure>
            <measure number="2">
              <note>
                <pitch><step>C</step><octave>4</octave></pitch>
                <duration>256</duration>
                <type>quarter</type>
                <voice>1</voice>
                <staff>1</staff>
                <tie type="stop"/>
                <notations><tied type="stop"/></notations>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)
      
      const note1 = result.parts[0].measures[0].voices.get(1)!.notes[0]
      const note2 = result.parts[0].measures[1].voices.get(1)!.notes[0]
      
      expect(note1.tie).toBe('start')
      expect(note2.tie).toBe('stop')
    })
  })

  describe('速度标记解析', () => {
    it('应该正确解析速度标记', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list>
            <score-part id="P1"><part-name>Soprano</part-name></score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <direction>
                <direction-type>
                  <metronome>
                    <beat-unit>quarter</beat-unit>
                    <per-minute>144</per-minute>
                  </metronome>
                </direction-type>
              </direction>
              <note><pitch><step>C</step><octave>4</octave></pitch><duration>256</duration><type>quarter</type><voice>1</voice><staff>1</staff></note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)
      
      expect(result.metadata.tempo).toBe(144)
      
      const measure = result.parts[0].measures[0]
      expect(measure.directions).toHaveLength(1)
      expect(measure.directions[0].type).toBe('metronome')
      expect(measure.directions[0].content.perMinute).toBe(144)
    })
  })

  describe('调号变化解析', () => {
    it('应该正确解析调号变化', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list>
            <score-part id="P1"><part-name>Soprano</part-name></score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <attributes>
                <key><fifths>4</fifths><mode>major</mode></key>
                <divisions>256</divisions>
              </attributes>
              <note><pitch><step>C</step><octave>4</octave></pitch><duration>256</duration><type>quarter</type><voice>1</voice><staff>1</staff></note>
            </measure>
            <measure number="2">
              <attributes>
                <key><fifths>2</fifths><mode>major</mode></key>
              </attributes>
              <note><pitch><step>D</step><octave>4</octave></pitch><duration>256</duration><type>quarter</type><voice>1</voice><staff>1</staff></note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)
      
      // 第一个小节是 E 大调
      expect(result.parts[0].measures[0].attributes.key).toBe('E')
      
      // 第二个小节是 D 大调
      expect(result.parts[0].measures[1].attributes.key).toBe('D')
    })
  })

  describe('和弦音符', () => {
    it('应该正确解析和弦', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list>
            <score-part id="P1"><part-name>Piano</part-name></score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <note>
                <pitch><step>C</step><octave>4</octave></pitch>
                <duration>256</duration>
                <type>quarter</type>
                <voice>1</voice>
                <staff>1</staff>
              </note>
              <note>
                <chord/>
                <pitch><step>E</step><octave>4</octave></pitch>
                <duration>256</duration>
                <type>quarter</type>
                <voice>1</voice>
                <staff>1</staff>
              </note>
              <note>
                <chord/>
                <pitch><step>G</step><octave>4</octave></pitch>
                <duration>256</duration>
                <type>quarter</type>
                <voice>1</voice>
                <staff>1</staff>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)
      
      const notes = result.parts[0].measures[0].voices.get(1)!.notes
      expect(notes).toHaveLength(3)
      
      expect(notes[0].isChord).toBe(false)
      expect(notes[1].isChord).toBe(true)
      expect(notes[2].isChord).toBe(true)
    })
  })

  describe('附点音符', () => {
    it('应该正确解析附点', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list>
            <score-part id="P1"><part-name>Soprano</part-name></score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <note>
                <pitch><step>C</step><octave>4</octave></pitch>
                <duration>768</duration>
                <type>half</type>
                <dot/>
                <voice>1</voice>
                <staff>1</staff>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)
      
      const note = result.parts[0].measures[0].voices.get(1)!.notes[0]
      expect(note.dots).toBe(1)
    })
  })

  describe('休止符', () => {
    it('应该正确解析休止符', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list>
            <score-part id="P1"><part-name>Soprano</part-name></score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <note>
                <rest/>
                <duration>1024</duration>
                <type>whole</type>
                <voice>1</voice>
                <staff>1</staff>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)
      
      const note = result.parts[0].measures[0].voices.get(1)!.notes[0]
      expect(note.isRest).toBe(true)
    })
  })
})