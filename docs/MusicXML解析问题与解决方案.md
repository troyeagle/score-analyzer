# MusicXML 解析问题与解决方案

**更新日期**: 2026-05-14

---

## 问题 1: double-sharp (F##4) 音高解析失败

### 问题描述
VexFlow 报错 `无法解析音高: F##4`，因为正则表达式不支持 `##` 格式。

### 根本原因
1. MusicXML 中 `alter=2` 表示 double-sharp
2. 解析器将其转换为 `F##4` 格式
3. VexFlowRenderer 的正则表达式 `^([A-G])(b|bb|#|x)?(\d)$)` 不支持 `##`

### 解决方案
修改正则表达式为 `^([A-G])(#{1,2}|b{1,2})?(\d)$)`，支持 `#`, `##`, `b`, `bb` 格式。

### VexFlow 音高格式
- 单升号: `f#/4`
- 双升号: `f##/4`
- 单降号: `fb/4`
- 双降号: `fbb/4`

---

## 问题 2: 休止符不显示

### 问题描述
包含全休止符的声部（P2-P6）完全不显示。

### 根本原因
`createVexFlowNotes` 方法跳过了休止符：
```typescript
if (note.isRest) {
  return  // 跳过休止符
}
```

### 解决方案
添加 `createRestNote` 方法渲染休止符：
```typescript
private createRestNote(note: Note): StaveNote | null {
  const duration = this.mapNoteDuration(note.type)
  return new StaveNote({
    keys: ['b/4'], // 虚拟音高
    duration: duration + 'r'  // VexFlow 休止符格式
  })
}
```

---

## 问题 3: 7 个声部只有 2 个能显示

### 问题描述
Genesis of Aquarion 有 7 个声部，但只有 P1 (Solo) 和 P7 (Piano) 能正常显示。

### 根本原因
1. P2-P6 在前 25 小节都是全休止符
2. 休止符被跳过，导致这些声部没有音符可渲染

### 解决方案
1. 正确渲染休止符
2. 确保所有声部都能显示，即使只有休止符

---

## 问题 4: 音高格式兼容性

### MusicXML 音高格式
```xml
<pitch>
  <step>F</step>
  <alter>2</alter>  <!-- 2 = double-sharp -->
  <octave>4</octave>
</pitch>
```

### 转换规则
| alter 值 | 含义 | 转换结果 |
|----------|------|----------|
| -2 | double-flat | Fbb4 |
| -1 | flat | Fb4 |
| 0 | natural | F4 |
| 1 | sharp | F#4 |
| 2 | double-sharp | F##4 |

### VexFlow 支持的格式
- `f#/4` - 升号
- `f##/4` - 双升号
- `fb/4` - 降号
- `fbb/4` - 双降号
- `fn/4` - 还原号

---

## 测试用例设计

### 音高测试
1. 基本音高: C4, D4, E4
2. 升号: G#4, F#4
3. 降号: Bb4, Eb4
4. 双升号: F##4 (alter=2)
5. 双降号: Dbb4 (alter=-2)

### 休止符测试
1. 全休止符 (whole rest)
2. 二分休止符 (half rest)
3. 四分休止符 (quarter rest)
4. 八分休止符 (eighth rest)

### 多声部测试
1. 单声部
2. 多 voice (voice 1, 2, 3)
3. 大谱表 (staves=2)

### 完整解析测试
1. 7 个声部的完整结构
2. 每个声部的小节数
3. 休止符和音符混合

---

## 经验总结

1. **正则表达式要全面**: 音高格式有多种变体，需要支持所有可能的格式
2. **休止符不能忽略**: 休止符是乐谱的重要组成部分，必须渲染
3. **VexFlow 格式要求**: VexFlow 有特定的音高和休止符格式要求
4. **测试覆盖要全面**: 需要测试所有边界情况
