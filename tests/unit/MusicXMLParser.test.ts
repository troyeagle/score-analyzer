import { describe, it, expect, beforeEach } from 'vitest'
import { MusicXMLParser } from '../../src/services/MusicXMLParser'
import type { MusicXMLParseResult } from '../../src/types'

describe('MusicXMLParser', () => {
  let parser: MusicXMLParser

  beforeEach(() => {
    parser = new MusicXMLParser()
  })

  describe('validate', () => {
    it('应该验证有效的MusicXML文档', () => {
      const validXML = `<?xml version="1.0" encoding="UTF-8"?>
        <score-partwise version="4.0">
          <part-list>
            <score-part id="P1">
              <part-name>Piano</part-name>
            </score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <note>
                <pitch>
                  <step>C</step>
                  <octave>4</octave>
                </pitch>
                <duration>1</duration>
                <type>quarter</type>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const domParser = new DOMParser()
      const doc = domParser.parseFromString(validXML, 'text/xml')
      expect(parser.validate(doc)).toBe(true)
    })

    it('应该拒绝无效的XML文档', () => {
      const invalidXML = '这不是一个有效的XML文档'
      const domParser = new DOMParser()
      const doc = domParser.parseFromString(invalidXML, 'text/xml')
      expect(parser.validate(doc)).toBe(false)
    })

    it('应该拒绝没有score-partwise元素的文档', () => {
      const invalidXML = `<?xml version="1.0" encoding="UTF-8"?>
        <root>
          <child>test</child>
        </root>`

      const domParser = new DOMParser()
      const doc = domParser.parseFromString(invalidXML, 'text/xml')
      expect(parser.validate(doc)).toBe(false)
    })
  })

  describe('parseFromString', () => {
    it('应该解析简单的MusicXML字符串', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <score-partwise version="4.0">
          <work>
            <work-title>测试乐谱</work-title>
          </work>
          <identification>
            <creator type="composer">测试作曲家</creator>
          </identification>
          <part-list>
            <score-part id="P1">
              <part-name>Piano</part-name>
            </score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <attributes>
                <divisions>1</divisions>
                <key>
                  <fifths>0</fifths>
                  <mode>major</mode>
                </key>
                <time>
                  <beats>4</beats>
                  <beat-type>4</beat-type>
                </time>
                <clef>
                  <sign>G</sign>
                  <line>2</line>
                </clef>
              </attributes>
              <note>
                <pitch>
                  <step>C</step>
                  <octave>4</octave>
                </pitch>
                <duration>1</duration>
                <type>quarter</type>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)

      // 验证元数据
      expect(result.metadata.title).toBe('测试乐谱')
      expect(result.metadata.composer).toBe('测试作曲家')
      expect(result.metadata.keySignature).toBe('C')
      expect(result.metadata.timeSignature).toBe('4/4')

      // 验证谱表
      expect(result.parts).toHaveLength(1)
      expect(result.parts[0].id).toBe('P1')
      expect(result.parts[0].name).toBe('Piano')

      // 验证小节
      expect(result.measures).toHaveLength(1)
      expect(result.measures[0].number).toBe(1)

      // 验证音符
      expect(result.notes).toHaveLength(1)
      expect(result.notes[0].pitch).toBe('C4')
      expect(result.notes[0].type).toBe('quarter')
    })

    it('应该解析多个小节', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <score-partwise version="4.0">
          <part-list>
            <score-part id="P1">
              <part-name>Piano</part-name>
            </score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <attributes>
                <divisions>1</divisions>
                <key>
                  <fifths>0</fifths>
                  <mode>major</mode>
                </key>
                <time>
                  <beats>4</beats>
                  <beat-type>4</beat-type>
                </time>
                <clef>
                  <sign>G</sign>
                  <line>2</line>
                </clef>
              </attributes>
              <note>
                <pitch>
                  <step>C</step>
                  <octave>4</octave>
                </pitch>
                <duration>1</duration>
                <type>quarter</type>
              </note>
            </measure>
            <measure number="2">
              <note>
                <pitch>
                  <step>D</step>
                  <octave>4</octave>
                </pitch>
                <duration>1</duration>
                <type>quarter</type>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)

      expect(result.measures).toHaveLength(2)
      expect(result.measures[0].number).toBe(1)
      expect(result.measures[1].number).toBe(2)
      expect(result.notes).toHaveLength(2)
    })

    it('应该解析带有变音记号的音符', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <score-partwise version="4.0">
          <part-list>
            <score-part id="P1">
              <part-name>Piano</part-name>
            </score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <attributes>
                <divisions>1</divisions>
                <key>
                  <fifths>0</fifths>
                  <mode>major</mode>
                </key>
                <time>
                  <beats>4</beats>
                  <beat-type>4</beat-type>
                </time>
                <clef>
                  <sign>G</sign>
                  <line>2</line>
                </clef>
              </attributes>
              <note>
                <pitch>
                  <step>C</step>
                  <alter>1</alter>
                  <octave>4</octave>
                </pitch>
                <duration>1</duration>
                <type>quarter</type>
                <accidental>sharp</accidental>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)

      expect(result.notes).toHaveLength(1)
      expect(result.notes[0].pitch).toBe('C#4')
      expect(result.notes[0].accidental).toBe('sharp')
    })

    it('应该解析带有附点的音符', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <score-partwise version="4.0">
          <part-list>
            <score-part id="P1">
              <part-name>Piano</part-name>
            </score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <attributes>
                <divisions>1</divisions>
                <key>
                  <fifths>0</fifths>
                  <mode>major</mode>
                </key>
                <time>
                  <beats>4</beats>
                  <beat-type>4</beat-type>
                </time>
                <clef>
                  <sign>G</sign>
                  <line>2</line>
                </clef>
              </attributes>
              <note>
                <pitch>
                  <step>C</step>
                  <octave>4</octave>
                </pitch>
                <duration>3</duration>
                <type>half</type>
                <dot />
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)

      expect(result.notes).toHaveLength(1)
      expect(result.notes[0].type).toBe('half')
      expect(result.notes[0].dots).toBe(1)
    })

    it('应该解析调号', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <score-partwise version="4.0">
          <part-list>
            <score-part id="P1">
              <part-name>Piano</part-name>
            </score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <attributes>
                <divisions>1</divisions>
                <key>
                  <fifths>2</fifths>
                  <mode>major</mode>
                </key>
                <time>
                  <beats>4</beats>
                  <beat-type>4</beat-type>
                </time>
                <clef>
                  <sign>G</sign>
                  <line>2</line>
                </clef>
              </attributes>
              <note>
                <pitch>
                  <step>C</step>
                  <octave>4</octave>
                </pitch>
                <duration>1</duration>
                <type>quarter</type>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)

      expect(result.metadata.keySignature).toBe('D')
    })

    it('应该解析拍号', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <score-partwise version="4.0">
          <part-list>
            <score-part id="P1">
              <part-name>Piano</part-name>
            </score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <attributes>
                <divisions>1</divisions>
                <key>
                  <fifths>0</fifths>
                  <mode>major</mode>
                </key>
                <time>
                  <beats>3</beats>
                  <beat-type>8</beat-type>
                </time>
                <clef>
                  <sign>G</sign>
                  <line>2</line>
                </clef>
              </attributes>
              <note>
                <pitch>
                  <step>C</step>
                  <octave>4</octave>
                </pitch>
                <duration>1</duration>
                <type>quarter</type>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)

      expect(result.metadata.timeSignature).toBe('3/8')
    })
  })

  describe('extractAnnotations', () => {
    it('应该提取direction元素作为标注', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <score-partwise version="4.0">
          <part-list>
            <score-part id="P1">
              <part-name>Piano</part-name>
            </score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <attributes>
                <divisions>1</divisions>
                <key>
                  <fifths>0</fifths>
                  <mode>major</mode>
                </key>
                <time>
                  <beats>4</beats>
                  <beat-type>4</beat-type>
                </time>
                <clef>
                  <sign>G</sign>
                  <line>2</line>
                </clef>
              </attributes>
              <direction>
                <direction-type>
                  <words>呈示部</words>
                </direction-type>
              </direction>
              <note>
                <pitch>
                  <step>C</step>
                  <octave>4</octave>
                </pitch>
                <duration>1</duration>
                <type>quarter</type>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)

      expect(result.annotations).toHaveLength(1)
      expect(result.annotations[0].content).toBe('呈示部')
      expect(result.annotations[0].type).toBe('structural')
    })

    it('应该提取harmony元素作为和声标注', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <score-partwise version="4.0">
          <part-list>
            <score-part id="P1">
              <part-name>Piano</part-name>
            </score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <attributes>
                <divisions>1</divisions>
                <key>
                  <fifths>0</fifths>
                  <mode>major</mode>
                </key>
                <time>
                  <beats>4</beats>
                  <beat-type>4</beat-type>
                </time>
                <clef>
                  <sign>G</sign>
                  <line>2</line>
                </clef>
              </attributes>
              <harmony>
                <root>
                  <root-step>C</root-step>
                </root>
                <kind>major</kind>
              </harmony>
              <note>
                <pitch>
                  <step>C</step>
                  <octave>4</octave>
                </pitch>
                <duration>1</duration>
                <type>quarter</type>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)

      expect(result.annotations).toHaveLength(1)
      expect(result.annotations[0].content).toBe('C major')
      expect(result.annotations[0].type).toBe('harmonic')
    })
  })
})