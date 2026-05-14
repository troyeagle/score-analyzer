import { describe, it, expect, beforeEach } from 'vitest'
import { MusicXMLParser } from '../../src/services/MusicXMLParser'

describe('MusicXMLParser - 完整解析测试', () => {
  let parser: MusicXMLParser

  beforeEach(() => {
    parser = new MusicXMLParser()
  })

  describe('音高解析', () => {
    it('应该解析基本音高 C4', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list><score-part id="P1"><part-name>Test</part-name></score-part></part-list>
          <part id="P1">
            <measure number="1">
              <attributes><divisions>256</divisions></attributes>
              <note>
                <pitch><step>C</step><octave>4</octave></pitch>
                <duration>256</duration>
                <type>quarter</type>
                <voice>1</voice>
                <staff>1</staff>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)
      const note = result.parts[0].measures[0].voices.get(1)!.notes[0]
      expect(note.pitch).toBe('C4')
    })

    it('应该解析升号音高 G#4', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list><score-part id="P1"><part-name>Test</part-name></score-part></part-list>
          <part id="P1">
            <measure number="1">
              <attributes><divisions>256</divisions></attributes>
              <note>
                <pitch><step>G</step><alter>1</alter><octave>4</octave></pitch>
                <duration>256</duration>
                <type>quarter</type>
                <voice>1</voice>
                <staff>1</staff>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)
      const note = result.parts[0].measures[0].voices.get(1)!.notes[0]
      expect(note.pitch).toBe('G#4')
    })

    it('应该解析降号音高 Bb4', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list><score-part id="P1"><part-name>Test</part-name></score-part></part-list>
          <part id="P1">
            <measure number="1">
              <attributes><divisions>256</divisions></attributes>
              <note>
                <pitch><step>B</step><alter>-1</alter><octave>4</octave></pitch>
                <duration>256</duration>
                <type>quarter</type>
                <voice>1</voice>
                <staff>1</staff>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)
      const note = result.parts[0].measures[0].voices.get(1)!.notes[0]
      expect(note.pitch).toBe('Bb4')
    })

    it('应该解析重升音高 F##4 (double-sharp)', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list><score-part id="P1"><part-name>Test</part-name></score-part></part-list>
          <part id="P1">
            <measure number="1">
              <attributes><divisions>256</divisions></attributes>
              <note>
                <pitch><step>F</step><alter>2</alter><octave>4</octave></pitch>
                <duration>256</duration>
                <type>quarter</type>
                <voice>1</voice>
                <staff>1</staff>
                <accidental>double-sharp</accidental>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)
      const note = result.parts[0].measures[0].voices.get(1)!.notes[0]
      expect(note.pitch).toBe('F##4')
    })

    it('应该解析重降音高 Dbb4 (double-flat)', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list><score-part id="P1"><part-name>Test</part-name></score-part></part-list>
          <part id="P1">
            <measure number="1">
              <attributes><divisions>256</divisions></attributes>
              <note>
                <pitch><step>D</step><alter>-2</alter><octave>4</octave></pitch>
                <duration>256</duration>
                <type>quarter</type>
                <voice>1</voice>
                <staff>1</staff>
                <accidental>double-flat</accidental>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)
      const note = result.parts[0].measures[0].voices.get(1)!.notes[0]
      expect(note.pitch).toBe('Dbb4')
    })
  })

  describe('休止符解析', () => {
    it('应该解析全休止符', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list><score-part id="P1"><part-name>Test</part-name></score-part></part-list>
          <part id="P1">
            <measure number="1">
              <attributes><divisions>256</divisions></attributes>
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
      expect(note.type).toBe('whole')
      expect(note.duration).toBe(1024)
    })

    it('应该解析四分休止符', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list><score-part id="P1"><part-name>Test</part-name></score-part></part-list>
          <part id="P1">
            <measure number="1">
              <attributes><divisions>256</divisions></attributes>
              <note>
                <rest/>
                <duration>256</duration>
                <type>quarter</type>
                <voice>1</voice>
                <staff>1</staff>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)
      const note = result.parts[0].measures[0].voices.get(1)!.notes[0]
      expect(note.isRest).toBe(true)
      expect(note.type).toBe('quarter')
    })
  })

  describe('多声部解析', () => {
    it('应该解析包含休止符和音符的小节', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list><score-part id="P1"><part-name>Test</part-name></score-part></part-list>
          <part id="P1">
            <measure number="1">
              <attributes><divisions>256</divisions></attributes>
              <note>
                <rest/>
                <duration>512</duration>
                <type>half</type>
                <voice>1</voice>
                <staff>1</staff>
              </note>
              <note>
                <pitch><step>C</step><octave>4</octave></pitch>
                <duration>256</duration>
                <type>quarter</type>
                <voice>1</voice>
                <staff>1</staff>
              </note>
              <note>
                <pitch><step>D</step><octave>4</octave></pitch>
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
      expect(notes[0].isRest).toBe(true)
      expect(notes[1].pitch).toBe('C4')
      expect(notes[2].pitch).toBe('D4')
    })

    it('应该解析多 voice 小节', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list><score-part id="P1"><part-name>Test</part-name></score-part></part-list>
          <part id="P1">
            <measure number="1">
              <attributes>
                <divisions>256</divisions>
                <staves>2</staves>
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
      const measure = result.parts[0].measures[0]
      expect(measure.voices.size).toBe(2)
      expect(measure.voices.get(1)!.notes[0].pitch).toBe('C5')
      expect(measure.voices.get(2)!.notes[0].pitch).toBe('E3')
    })
  })

  describe('多谱表解析', () => {
    it('应该解析钢琴双谱表', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
          <part id="P1">
            <measure number="1">
              <attributes>
                <staves>2</staves>
                <divisions>256</divisions>
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
      expect(result.parts[0].staves).toBe(2)
      expect(result.parts[0].measures[0].attributes.clefs).toHaveLength(2)
      expect(result.parts[0].measures[0].attributes.clefs[0].sign).toBe('G')
      expect(result.parts[0].measures[0].attributes.clefs[1].sign).toBe('F')
    })
  })

  describe('附点音符解析', () => {
    it('应该解析附点二分音符', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list><score-part id="P1"><part-name>Test</part-name></score-part></part-list>
          <part id="P1">
            <measure number="1">
              <attributes><divisions>256</divisions></attributes>
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
      expect(note.type).toBe('half')
      expect(note.duration).toBe(768)
    })
  })

  describe('和弦音符解析', () => {
    it('应该解析和弦', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list><score-part id="P1"><part-name>Test</part-name></score-part></part-list>
          <part id="P1">
            <measure number="1">
              <attributes><divisions>256</divisions></attributes>
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

  describe('连音线解析', () => {
    it('应该解析跨小节连音线', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list><score-part id="P1"><part-name>Test</part-name></score-part></part-list>
          <part id="P1">
            <measure number="1">
              <attributes><divisions>256</divisions></attributes>
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

  describe('多声部完整解析', () => {
    it('应该解析7个声部的完整结构', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list>
            <score-part id="P1"><part-name>Solo</part-name></score-part>
            <score-part id="P2"><part-name>Accompany</part-name></score-part>
            <score-part id="P3"><part-name>Soprano</part-name></score-part>
            <score-part id="P4"><part-name>Alto</part-name></score-part>
            <score-part id="P5"><part-name>Tenor</part-name></score-part>
            <score-part id="P6"><part-name>Bass</part-name></score-part>
            <score-part id="P7"><part-name>Piano</part-name></score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <attributes><divisions>256</divisions></attributes>
              <note><pitch><step>C</step><octave>4</octave></pitch><duration>256</duration><type>quarter</type><voice>1</voice><staff>1</staff></note>
            </measure>
          </part>
          <part id="P2">
            <measure number="1">
              <attributes><divisions>256</divisions></attributes>
              <note><rest/><duration>1024</duration><type>whole</type><voice>1</voice><staff>1</staff></note>
            </measure>
          </part>
          <part id="P3">
            <measure number="1">
              <attributes><divisions>256</divisions></attributes>
              <note><rest/><duration>1024</duration><type>whole</type><voice>1</voice><staff>1</staff></note>
            </measure>
          </part>
          <part id="P4">
            <measure number="1">
              <attributes><divisions>256</divisions></attributes>
              <note><rest/><duration>1024</duration><type>whole</type><voice>1</voice><staff>1</staff></note>
            </measure>
          </part>
          <part id="P5">
            <measure number="1">
              <attributes><divisions>256</divisions></attributes>
              <note><rest/><duration>1024</duration><type>whole</type><voice>1</voice><staff>1</staff></note>
            </measure>
          </part>
          <part id="P6">
            <measure number="1">
              <attributes><divisions>256</divisions></attributes>
              <note><rest/><duration>1024</duration><type>whole</type><voice>1</voice><staff>1</staff></note>
            </measure>
          </part>
          <part id="P7">
            <measure number="1">
              <attributes>
                <staves>2</staves>
                <divisions>256</divisions>
                <clef number="1"><sign>G</sign><line>2</line></clef>
                <clef number="2"><sign>F</sign><line>4</line></clef>
              </attributes>
              <note><pitch><step>C</step><octave>5</octave></pitch><duration>256</duration><type>quarter</type><voice>1</voice><staff>1</staff></note>
              <note><pitch><step>E</step><octave>3</octave></pitch><duration>256</duration><type>quarter</type><voice>2</voice><staff>2</staff></note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)
      
      // 应该有7个声部
      expect(result.parts).toHaveLength(7)
      
      // 每个声部应该有1个小节
      result.parts.forEach(part => {
        expect(part.measures).toHaveLength(1)
      })
      
      // P1 应该有音符
      const p1Notes = result.parts[0].measures[0].voices.get(1)!.notes
      expect(p1Notes).toHaveLength(1)
      expect(p1Notes[0].pitch).toBe('C4')
      
      // P2-P6 应该有休止符
      for (let i = 1; i <= 5; i++) {
        const notes = result.parts[i].measures[0].voices.get(1)!.notes
        expect(notes).toHaveLength(1)
        expect(notes[0].isRest).toBe(true)
      }
      
      // P7 应该有双谱表
      expect(result.parts[6].staves).toBe(2)
      expect(result.parts[6].measures[0].voices.size).toBe(2)
    })
  })

  describe('时值解析', () => {
    it('应该解析各种时值', () => {
      const xml = `<?xml version="1.0" encoding='UTF-8'?>
        <score-partwise version="3.0">
          <part-list><score-part id="P1"><part-name>Test</part-name></score-part></part-list>
          <part id="P1">
            <measure number="1">
              <attributes><divisions>256</divisions></attributes>
              <note><pitch><step>C</step><octave>4</octave></pitch><duration>1024</duration><type>whole</type><voice>1</voice><staff>1</staff></note>
              <note><pitch><step>D</step><octave>4</octave></pitch><duration>512</duration><type>half</type><voice>1</voice><staff>1</staff></note>
              <note><pitch><step>E</step><octave>4</octave></pitch><duration>256</duration><type>quarter</type><voice>1</voice><staff>1</staff></note>
              <note><pitch><step>F</step><octave>4</octave></pitch><duration>128</duration><type>eighth</type><voice>1</voice><staff>1</staff></note>
              <note><pitch><step>G</step><octave>4</octave></pitch><duration>64</duration><type>16th</type><voice>1</voice><staff>1</staff></note>
            </measure>
          </part>
        </score-partwise>`

      const result = parser.parseFromString(xml)
      const notes = result.parts[0].measures[0].voices.get(1)!.notes
      expect(notes).toHaveLength(5)
      expect(notes[0].type).toBe('whole')
      expect(notes[1].type).toBe('half')
      expect(notes[2].type).toBe('quarter')
      expect(notes[3].type).toBe('eighth')
      expect(notes[4].type).toBe('16th')
    })
  })
})