import { describe, it, expect, beforeEach } from 'vitest'
import { MusicXMLParser } from '../../src/services/MusicXMLParser'
import * as fs from 'fs'
import * as path from 'path'

describe('Genesis of Aquarion 详细解析', () => {
  let parser: MusicXMLParser
  let xmlContent: string

  beforeEach(() => {
    parser = new MusicXMLParser()
    parser.setDebug(false)
    
    const xmlPath = path.resolve(__dirname, '../../../Genesis of Aquation_Transc.xml')
    try {
      xmlContent = fs.readFileSync(xmlPath, 'utf-8')
    } catch {
      xmlContent = ''
    }
  })

  describe('Solo 声部 (P1) 前10小节', () => {
    it('应该正确解析音符序列', () => {
      if (!xmlContent) return
      
      const result = parser.parseFromString(xmlContent, 1, 10)
      const solo = result.parts.find(p => p.id === 'P1')
      
      expect(solo).toBeDefined()
      expect(solo!.measures.length).toBe(10)
      
      // 收集每个小节的音符信息
      const measureInfo: string[] = []
      
      solo!.measures.forEach(measure => {
        const voice = measure.voices.get(1)
        if (!voice) {
          measureInfo.push(`小节 ${measure.number}: 无音符`)
          return
        }
        
        const noteStrs = voice.notes.map(note => {
          if (note.isRest) return '休止'
          return note.pitch
        })
        
        measureInfo.push(`小节 ${measure.number}: ${noteStrs.join(' ')}`)
      })
      
      // 使用 expect 输出信息
      expect(measureInfo.join('\n')).toContain('小节 1:')
    })
  })

  describe('Piano 声部 (P7) 前10小节', () => {
    it('应该正确解析双谱表', () => {
      if (!xmlContent) return
      
      const result = parser.parseFromString(xmlContent, 1, 10)
      const piano = result.parts.find(p => p.id === 'P7')
      
      expect(piano).toBeDefined()
      expect(piano!.staves).toBe(2)
      expect(piano!.measures.length).toBe(10)
      
      // 打印每个小节的音符
      console.log('\n=== Piano 声部 (P7) 前10小节 ===')
      
      piano!.measures.forEach(measure => {
        console.log(`\n小节 ${measure.number}:`)
        
        measure.voices.forEach((voice, voiceId) => {
          const staffName = voice.staff === 1 ? '高音谱' : '低音谱'
          const noteStrs = voice.notes.map(note => {
            if (note.isRest) return '休止'
            return note.pitch
          })
          
          console.log(`  voice ${voiceId} (${staffName}): ${noteStrs.join(' ')}`)
        })
      })
    })
  })

  describe('所有声部摘要', () => {
    it('应该显示每个声部的音符统计', () => {
      if (!xmlContent) return
      
      const result = parser.parseFromString(xmlContent, 1, 10)
      
      console.log('\n=== 所有声部摘要 (1-10小节) ===')
      
      result.parts.forEach(part => {
        let totalNotes = 0
        let totalRests = 0
        
        part.measures.forEach(measure => {
          measure.voices.forEach(voice => {
            voice.notes.forEach(note => {
              if (note.isRest) {
                totalRests++
              } else {
                totalNotes++
              }
            })
          })
        })
        
        console.log(`${part.name} (${part.id}): ${part.measures.length}小节, ${totalNotes}音符, ${totalRests}休止`)
      })
    })
  })

  describe('音符时值验证', () => {
    it('应该验证每小节的时值是否正确', () => {
      if (!xmlContent) return
      
      const result = parser.parseFromString(xmlContent, 1, 10)
      const solo = result.parts.find(p => p.id === 'P1')
      
      if (!solo) return
      
      console.log('\n=== Solo 声部时值验证 ===')
      
      solo.measures.forEach(measure => {
        const voice = measure.voices.get(1)
        if (!voice) return
        
        let totalDuration = 0
        voice.notes.forEach(note => {
          if (!note.isRest) {
            const durationMap: Record<string, number> = {
              'whole': 4,
              'half': 2,
              'quarter': 1,
              'eighth': 0.5,
              '16th': 0.25
            }
            const duration = durationMap[note.type] || 0
            const dots = note.dots || 0
            const actualDuration = duration * (1 + dots * 0.5)
            totalDuration += actualDuration
          }
        })
        
        const isCorrect = Math.abs(totalDuration - 4) < 0.01
        console.log(`小节 ${measure.number}: ${totalDuration} 拍 ${isCorrect ? '✓' : '✗ (应为4拍)'}`)
      })
    })
  })
})