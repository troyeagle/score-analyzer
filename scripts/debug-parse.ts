// 用于调试的解析脚本
// 运行方式: npx tsx scripts/debug-parse.ts

import { MusicXMLParser } from '../src/services/MusicXMLParser'
import * as fs from 'fs'

const xmlPath = './Genesis of Aquation_Transc.xml'

try {
  const xmlContent = fs.readFileSync(xmlPath, 'utf-8')
  const parser = new MusicXMLParser()
  parser.setDebug(false)
  
  console.log('=== 解析前10小节 ===\n')
  
  const result = parser.parseFromString(xmlContent, 1, 10)
  
  console.log('声部数:', result.parts.length)
  console.log('')
  
  result.parts.forEach(part => {
    console.log(`声部: ${part.name} (${part.id})`)
    console.log(`  谱表数: ${part.staves}`)
    console.log(`  小节数: ${part.measures.length}`)
    
    part.measures.forEach(measure => {
      console.log(`\n  小节 ${measure.number}:`)
      console.log(`    voices数量: ${measure.voices.size}`)
      
      measure.voices.forEach((voice, voiceId) => {
        console.log(`    voice ${voiceId} (staff ${voice.staff}): ${voice.notes.length} 个音符`)
        
        // 打印音符详情
        const noteDetails = voice.notes.map(note => {
          if (note.isRest) {
            return `休止(${note.type})`
          }
          return `${note.pitch}(${note.type})`
        })
        console.log(`      音符: ${noteDetails.join(', ')}`)
      })
    })
    
    console.log('')
  })
  
  // 验证音符时值
  console.log('=== 音符时值验证 ===\n')
  
  const solo = result.parts.find(p => p.id === 'P1')
  if (solo) {
    solo.measures.forEach(measure => {
      const voice = measure.voices.get(1)
      if (!voice) return
      
      let totalDuration = 0
      voice.notes.forEach(note => {
        if (!note.isRest) {
          // 计算时值（以四分音符为单位）
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
      
      console.log(`小节 ${measure.number}: 总时值 = ${totalDuration} 拍 (应为4拍)`)
    })
  }
  
} catch (error) {
  console.error('解析失败:', error)
}