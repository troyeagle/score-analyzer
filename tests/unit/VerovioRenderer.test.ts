import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VerovioRenderer } from '../../src/services/renderers/VerovioRenderer'

describe('VerovioRenderer', () => {
  let renderer: VerovioRenderer

  beforeEach(() => {
    renderer = new VerovioRenderer()
  })

  describe('parseVerseNumbers', () => {
    it('应该解析两行歌词的 verse 编号', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <score-partwise version="3.0">
          <part-list><score-part id="P1"><part-name>Test</part-name></score-part></part-list>
          <part id="P1">
            <measure number="1">
              <note>
                <pitch><step>C</step><octave>4</octave></pitch>
                <duration>256</duration>
                <type>quarter</type>
                <voice>1</voice>
                <staff>1</staff>
                <lyric number="part1verse1"><syllabic>single</syllabic><text>君</text></lyric>
                <lyric number="part1verse2"><syllabic>single</syllabic><text>ki</text></lyric>
              </note>
            </measure>
          </part>
        </score-partwise>`

      // 使用反射调用私有方法
      const result = (renderer as any).parseVerseNumbers(xml)
      
      // 验证 verse position map
      const versePositionMap = (renderer as any).versePositionMap
      expect(versePositionMap.get('part1verse1')).toBe(0)
      expect(versePositionMap.get('part1verse2')).toBe(1)
    })

    it('应该为缺失的 verse 添加占位符', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <score-partwise version="3.0">
          <part-list><score-part id="P1"><part-name>Test</part-name></score-part></part-list>
          <part id="P1">
            <measure number="1">
              <note>
                <pitch><step>C</step><octave>4</octave></pitch>
                <duration>256</duration>
                <type>quarter</type>
                <voice>1</voice>
                <staff>1</staff>
                <lyric number="part1verse1"><syllabic>single</syllabic><text>君</text></lyric>
                <lyric number="part1verse2"><syllabic>single</syllabic><text>ki</text></lyric>
              </note>
              <note>
                <pitch><step>D</step><octave>4</octave></pitch>
                <duration>256</duration>
                <type>quarter</type>
                <voice>1</voice>
                <staff>1</staff>
                <lyric number="part1verse2"><syllabic>single</syllabic><text>mi</text></lyric>
              </note>
            </measure>
          </part>
        </score-partwise>`

      const result = (renderer as any).parseVerseNumbers(xml)
      
      // 验证结果中包含占位符
      expect(result).toContain('part1verse1')
      expect(result).toContain('part1verse2')
      
      // 验证第二个音符现在有两个 lyric 元素
      const parser = new DOMParser()
      const doc = parser.parseFromString(result, 'text/xml')
      const notes = doc.querySelectorAll('note')
      const secondNote = notes[1]
      const lyrics = secondNote.querySelectorAll('lyric')
      
      expect(lyrics.length).toBe(2)
    })
  })

  describe('fixLyricOverlap', () => {
    it('应该为第二个 verse 添加偏移', () => {
      // 创建模拟的 SVG 元素
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      
      // 创建一个 note 元素，包含两个 verse
      const note = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      note.classList.add('note')
      
      const verse1 = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      verse1.classList.add('verse')
      const text1 = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text1.setAttribute('y', '2781')
      text1.textContent = '君'
      verse1.appendChild(text1)
      
      const verse2 = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      verse2.classList.add('verse')
      const text2 = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text2.setAttribute('y', '2781')
      text2.textContent = 'ki'
      verse2.appendChild(text2)
      
      note.appendChild(verse1)
      note.appendChild(verse2)
      svg.appendChild(note)
      
      // 调用修复方法
      ;(renderer as any).fixLyricOverlap(svg)
      
      // 验证第二个 verse 的 y 坐标已偏移
      expect(text2.getAttribute('y')).toBe('3231') // 2781 + 450
    })

    it('不应该修改只有单个 verse 的 note', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      
      const note = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      note.classList.add('note')
      
      const verse1 = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      verse1.classList.add('verse')
      const text1 = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text1.setAttribute('y', '2781')
      text1.textContent = '君'
      verse1.appendChild(text1)
      
      note.appendChild(verse1)
      svg.appendChild(note)
      
      ;(renderer as any).fixLyricOverlap(svg)
      
      // y 坐标应该不变
      expect(text1.getAttribute('y')).toBe('2781')
    })
  })

  describe('接口实现', () => {
    it('应该实现 ScoreRenderer 接口', () => {
      expect(renderer.name).toBe('Verovio')
      expect(renderer.description).toBeTruthy()
      expect(typeof renderer.initialize).toBe('function')
      expect(typeof renderer.loadMusicXML).toBe('function')
      expect(typeof renderer.render).toBe('function')
      expect(typeof renderer.destroy).toBe('function')
    })
  })
})
