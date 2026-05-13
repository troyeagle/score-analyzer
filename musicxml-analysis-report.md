# MusicXML 文件分析报告

**文件**: `Genesis of Aquation_Transc.xml`
**分析日期**: 2026-05-14

---

## 1. 文件基本信息

| 属性 | 值 |
|------|-----|
| MusicXML 版本 | 3.0 (`score-partwise version="3.0"`) |
| DOCTYPE | `-//Recordare//DTD MusicXML 3.0 Partwise//EN` |
| 编码软件 | Sibelius 8.2.0 |
| 导出方式 | Direct export, not from Dolet |
| 编码描述 | Sibelius / MusicXML 3.0 |
| 编码日期 | 2026-05-14 |
| 编码者 | Administrator |
| 作品标题 | Genesis of Aquarion |
| 作曲家 | Composed by Yoko Kanno |
| 编曲者 | Transcribed by Genefy |
| 版权 | Copyright © 2017 by Genefy. All rights reserved. |
| 总行数 | 41,584 行 |
| 总声部数 | 7 个 (P1-P7) |

### encoding/supports 声明

```xml
<supports element="print" type="yes" value="yes" attribute="new-system" />
<supports element="print" type="yes" value="yes" attribute="new-page" />
<supports element="accidental" type="yes" />
<supports element="beam" type="yes" />
<supports element="stem" type="yes" />
```

---

## 2. 布局配置（defaults）

### 2.1 缩放比例（scaling）

| 参数 | 值 | 说明 |
|------|-----|------|
| millimeters | 210 | 每个逻辑单位对应的物理尺寸 |
| tenths | 1787 | 每 210mm 对应 1787 tenths |

**计算**: 1 tenth ≈ 0.1175mm，即约 8.5 tenths/mm

### 2.2 页面布局（page-layout）

| 参数 | 值 |
|------|-----|
| page-height | 2527 tenths |
| page-width | 1787 tenths |
| 页面类型 | both（奇偶页相同） |
| left-margin | 108 tenths |
| right-margin | 108 tenths |
| top-margin | 108 tenths |
| bottom-margin | 108 tenths |

**物理尺寸**: 约 297mm × 210mm（A4 纸张）

### 2.3 系统布局（system-layout）

| 参数 | 值 |
|------|-----|
| system left-margin | 68 tenths |
| system right-margin | 0 tenths |
| system-distance | 92 tenths |

### 2.4 外观设置（appearance）

| 线条类型 | 宽度 (tenths) |
|----------|--------------|
| stem | 0.9375 |
| beam | 5 |
| staff | 0.9375 |
| light barline | 1.5625 |
| heavy barline | 5 |
| leger | 1.5625 |
| ending | 1.5625 |
| wedge | 1.25 |
| enclosure | 0.9375 |
| tuplet bracket | 1.25 |
| bracket | 5 |
| dashes | 1.5625 |
| extend | 0.9375 |
| octave shift | 1.5625 |
| pedal | 1.5625 |
| slur middle | 1.5625 |
| slur tip | 0.625 |
| tie middle | 1.5625 |
| tie tip | 0.625 |

| 音符尺寸类型 | 百分比 |
|-------------|--------|
| cue | 75% |
| grace | 60% |

### 2.5 字体设置

| 元素 | 字体族 | 字号 |
|------|--------|------|
| music-font | Opus Std | 13.3228 |
| lyric-font | Yu Mincho | 7.7023 |
| lyric-language | — | xml:lang="zh" |

**注意**: 默认歌词语言为中文（zh），表明这是一部包含日语/英语歌词的声乐作品，使用中文环境设置。

---

## 3. 乐谱元数据（credit）

文件包含 **11 个 credit 元素**，分布在 8 页上：

### 第 1 页（4 个 credit）

| 位置 | 内容 | 字体 | 字号 | 对齐 |
|------|------|------|------|------|
| y=155 | Genesis of Aquarion | Yu Mincho | 14.78 | center |
| y=124 | from Genesis of Aquarion Original Sound Track II A cappella | Yu Mincho | 9.3676 | center |
| y=108 | Copyright © 2017 by Genefy. All rights reserved. | Yu Mincho | 6.7655 | center |
| y=84 | Composed by Yoko Kanno / Transcribed by Genefy | Yu Mincho | 7.39 | right |

### 第 2-8 页（各 1 个 credit）

每页包含页码数字（"2" 到 "8"），位于 y=88，居左对齐。

---

## 4. 声部列表（part-list）

### 4.1 声部概览

共 **7 个声部**，分为 **2 个 part-group**：

| ID | 名称 | 缩写 | 乐器 | 谱表数 | 虚拟乐器 |
|----|------|------|------|--------|----------|
| P1 | Solo | Sol | Solo Soprano | 1 | General MIDI / Solo Soprano |
| P2 | Accompany | Acc. | Tenor | 1 | General MIDI / Tenor Ensemble |
| P3 | Soprano | S. | Soprano | 1 | General MIDI / Soprano Ensemble |
| P4 | Alto | A. | Alto | 1 | General MIDI / Alto Ensemble |
| P5 | Tenor | T. | Tenor | 1 | General MIDI / Tenor Ensemble |
| P6 | Bass | B. | Bass (2) | 1 | General MIDI / Bass Ensemble |
| P7 | Piano | Pno. | Piano (2) | 2 | General MIDI / Acoustic Piano |

### 4.2 分组信息

| 组号 | 类型 | 符号 | 包含声部 |
|------|------|------|----------|
| 1 | start/stop | bracket | P1-P6（人声声部） |
| 2 | start/stop | brace | P7（钢琴） |

### 4.3 特殊配置

- **P7 (Piano)**: 包含 `<solo />` 标记，使用 `instrument-sound: keyboard.piano.grand`
- **P2 (Accompany)**: 使用 `<transpose>` 移调（八度下移）
- **P7 (Piano)**: 使用 2 个谱表（grand staff）

---

## 5. 各声部内容分析

### 5.1 小节统计

所有声部均包含 **102 小节**，4/4 拍。

| 声部 | 小节数 | 谱表数 | 声部数(voice) | 移调 |
|------|--------|--------|---------------|------|
| P1 (Solo) | 102 | 1 | 1 | 无 |
| P2 (Accompany) | 102 | 1 | 1 | octave-change=-1 |
| P3 (Soprano) | 102 | 1 | 1 | 无 |
| P4 (Alto) | 102 | 1 | 1 | 无 |
| P5 (Tenor) | 102 | 1 | 1 | 无 |
| P6 (Bass) | 102 | 1 | 1 | 无 |
| P7 (Piano) | 102 | 2 | voice 1, 3, 4 | 无 |

### 5.2 调号与拍号

| 属性 | 初始值 | 变化 |
|------|--------|------|
| 调号 | 4 fifths (E major) | 2 fifths (D major) @ measure 18 |
| 拍号 | 4/4 | 无变化 |
| divisions | 256 | 无变化 |
| 速度 | ♩= 144 | 无变化 |

### 5.3 音符特性

#### 音符时值分布

| 时值 | duration | 类型 |
|------|----------|------|
| 全音符 | 1024 | whole |
| 附点二分音符 | 768 | half + dot |
| 二分音符 | 512 | half |
| 附点四分音符 | 384 | quarter + dot |
| 四分音符 | 256 | quarter |
| 附点八分音符 | 192 | eighth + dot |
| 八分音符 | 128 | eighth |
| 十六分音符 | 64 | 16th |

#### 音域范围

| 声部 | 最低音 | 最高音 |
|------|--------|--------|
| P1 (Solo) | B3 | C5 |
| P2 (Accompany) | A3 | D4 |
| P3 (Soprano) | D4 | D5 |
| P4 (Alto) | D4 | A4 |
| P5 (Tenor) | G#3 | E4 |
| P6 (Bass) | A2 | D3 |
| P7 (Piano RH) | G#3 | E5 |
| P7 (Piano LH) | E2 | E4 |

### 5.4 变音记号（accidental）

共 **83 处** 显式变音记号：

| 类型 | 出现次数 |
|------|----------|
| natural | 62 |
| sharp | 16 |
| flat | 2 |
| double-sharp | 3 |

**注意**: double-sharp 出现在 P2 (Accompany) 声部中（lines 10821, 10880, 10942），这是 Sibelius 导出中的特殊记号。

### 5.5 连音线（tie）

连音线在文件中广泛使用，格式为：
```xml
<tie type="start" />
<!-- 在 notations 中 -->
<tied type="start" />
```

连音线主要用于：
- 跨小节的音符连接
- 同音高的延音
- 配合 `<extend />` 歌词标记

### 5.6 圆滑线（slur）

共 **8 处** 圆滑线（4 对 start/stop）：

| 位置 | 类型 | 方向 |
|------|------|------|
| P1 (line 5510/5532) | start/stop | under |
| P1 (line 5548/5568) | start/stop | under |
| P2 (line 10803/10850) | start/stop | over |
| P2 (line 10867/10909) | start/stop | over |

### 5.7 歌词（lyric）

#### 多语言歌词系统

本文件使用 **双行歌词** 系统：

| 歌词行 | 编号 | 语言 | 内容示例 |
|--------|------|------|----------|
| Verse 1 | part1verse1 | 日语/英语 | 君、きみ、が、く... / oh, yeah, Ge-ne-sis... |
| Verse 2 | part1verse2 | 罗马字 | ki, mi, ga, ku... |

#### 歌词音节类型

| syllabic 类型 | 用途 |
|--------------|------|
| single | 单音节词 |
| begin | 多音节词的开始 |
| middle | 多音节词的中间 |
| end | 多音节词的结束 |

#### 特殊歌词标记

- `<extend />`: 延音线歌词（共 74 处），如 "oh—", "u—", "i—"
- 歌词使用 `default-y` 定位，verse1 在 y=-80，verse2 在 y=-105
- 所有歌词使用 color="#000000"

#### 歌词语言分布

- **日语歌词**: 君きみがく、り返し、大人り、何度も、遠くへ... (P1 前半部分)
- **英语歌词**: Genesis, of, Aquarion, oh, yeah, you, my, whole, life... (P1 后半部分)
- **声乐音节**: u, oh, ah, du (P3-P6 合唱声部)

### 5.8 和弦（chord）

和弦标记 `<chord />` 出现在：

| 声部 | 和弦使用 |
|------|----------|
| P2 (Accompany) | 双音和弦（如 B3+D4, A3+C#4, B3+D4） |
| P7 (Piano RH) | 三音/四音和弦（如 F#3+A3+C#4, G#3+A3+E5） |
| P7 (Piano LH) | 双音和弦（如 E2+E3） |

**P7 (Piano)** 大量使用和弦，常见组合：
- 三和弦：G#3+B3+E4
- 四音和弦：F#3+A3+D4+E4
- 低音八度：E2+E3

### 5.9 装饰音（grace）

**未发现** `<grace />` 元素。

### 5.10 附点（dot）

附点音符广泛使用：
- 附点二分音符（half + dot = 768 duration）
- 附点四分音符（quarter + dot = 384 duration）
- 附点八分音符（eighth + dot = 192 duration）

### 5.11 休止符

休止符类型：

| 类型 | duration | 说明 |
|------|----------|------|
| whole rest | 1024 | 全小节休止 |
| half rest | 512 | 二分休止 |
| quarter rest | 256 | 四分休止 |
| eighth rest | 128 | 八分休止 |

**P2 (Accompany)** 前 25 小节全部为休止符（whole rest），表明该声部在乐曲开头不参与。

---

## 6. Sibelius 特有标记

### 6.1 Sibelius 专有特征

| 特征 | 说明 | 标准 MusicXML 兼容性 |
|------|------|---------------------|
| color="#000000" | 所有音符、谱号、调号等元素都带有颜色属性 | ✅ 标准属性 |
| default-x/default-y | 大量使用绝对定位 | ✅ 标准属性 |
| font-family="Opus Text Std" | Sibelius 专用字体 | ⚠️ Sibelius 特有 |
| font-family="Opus Std" | Sibelius 专用音乐字体 | ⚠️ Sibelius 特有 |
| Direct export | 非 Dolet 插件导出 | ℹ️ 导出方式 |
| `<clef-octave-change>` | 谱号八度变化 | ✅ 标准元素 |
| `<transpose>` | 移调记谱 | ✅ 标准元素 |

### 6.2 Sibelius 导出的特殊模式

1. **颜色属性**: 所有音乐元素都显式指定 `color="#000000"`，这是 Sibelius 导出的默认行为
2. **字体指定**: direction 元素中使用 Sibelius 特有字体（Opus Text Std, Opus Std）
3. **定位信息**: 大量使用 `default-x` 和 `default-y` 进行精确布局
4. **staff-details**: 每个系统开始都重复 `<staff-details number="1" print-object="yes" />`
5. **attributes 空元素**: P7 的后续小节使用空 `<attributes />` 作为占位符

### 6.3 与标准 MusicXML 3.0 的差异

| 差异点 | 文件中的做法 | 标准建议 |
|--------|-------------|----------|
| 颜色属性 | 所有元素都有 color="#000000" | 可选属性，通常省略 |
| 字体引用 | 使用 Sibelius 专用字体 | 应使用通用字体名 |
| staff-details | 每个系统重复 | 仅在变化时出现 |
| 空 attributes | 使用 `<attributes />` | 应省略空元素 |
| lyric default-y | 每个歌词都指定 | 可由渲染器计算 |

---

## 7. 需要特别处理的场景

### 7.1 多声部（voice）

| 声部 | voice 数量 | 说明 |
|------|-----------|------|
| P1-P6 | 1 (voice 1) | 单声部 |
| P7 (Piano) | 3 (voice 1, 3, 4) | 多声部 |

**P7 的声部分配**:
- **voice 1**: 右手高音声部（staff 1）
- **voice 3**: 左手声部（staff 2）
- **voice 4**: 左手辅助声部（staff 2，较少使用）

**处理要点**:
- 使用 `<backup>` 元素回退到前一个时间点（共 114 处）
- voice 1 和 voice 3 在同一小节内并行
- 需要正确处理 stem 方向（voice 1 = up, voice 3 = down/up）

### 7.2 多谱表（staff）

**仅 P7 (Piano)** 使用双谱表：

```xml
<staves>2</staves>
<staff-layout number="2">
  <staff-distance>60</staff-distance>
</staff-layout>
```

- staff 1: 高音谱表（右手）
- staff 2: 低音谱表（左手）
- 使用 `<backup>` 在两个谱表间切换

### 7.3 跨小节的连音线

连音线跨小节的模式：

```xml
<!-- 小节 N -->
<note>
  <tie type="start" />
  <notations><tied type="start" /></notations>
</note>

<!-- 小节 N+1 -->
<note>
  <tie type="stop" />
  <notations><tied type="stop" /></notations>
</note>
```

**出现位置**: P1 measures 19-20, 20-21, 21-22, 26-27 等

### 7.4 复杂节奏

#### 三十二分音符节奏（P7 Piano）

在 P7 measure 97 中出现快速音符序列：
```xml
<type>16th</type>  <!-- 64 duration -->
```

#### 附点节奏组合

- 附点八分音符 + 十六分音符 (192 + 64 = 256)
- 附点四分音符 + 八分音符 (384 + 128 = 512)

#### time-modification（变拍）

仅在 P7 measure 102 中出现：
```xml
<time-modification>
  <actual-notes>2</actual-notes>
  <normal-notes>1</normal-notes>
</time-modification>
```
用于震音（tremolo）的二连音记谱。

### 7.5 特殊符号

#### 震音（Tremolo）

出现在 P7 (Piano) 的最后两小节：

| 类型 | 位置 | 说明 |
|------|------|------|
| single tremolo | measure 101, line 41475 | 单震音标记 (2 slashes) |
| start/stop tremolo | measure 102, line 41558/41578 | 跨音符震音 (1 slash) |

#### 延长记号（Fermata）

共 **5 处**：
- P1: measure 18, 92, 102
- P2: measure 17
- P7: measure 16

```xml
<notations>
  <fermata>normal</fermata>
</notations>
```

#### 力度标记（Dynamics）

共 **25 处** 力度标记：

| 力度 | 出现次数 |
|------|----------|
| p | 5 |
| mp | 3 |
| mf | 3 |
| f | 5 |
| 其他 | 9 |

所有力度标记使用 Sibelius 字体 `font-family="Opus Text Std"`。

#### 演奏法标记（Articulations）

共 **28 处** 演奏法标记，主要类型：
- `<accent />` (重音)
- 其他 Sibelius 特有标记

#### 双小节线（Barline）

共 **21 处** 特殊小节线：

| 类型 | 用途 |
|------|------|
| light-light | 段落分隔（measure 17, 16 等） |
| light-heavy | 终止线（measure 102） |

### 7.6 移调记谱

**P2 (Accompany)** 使用移调：

```xml
<transpose>
  <diatonic>0</diatonic>
  <chromatic>0</chromatic>
  <octave-change>-1</octave-change>
</transpose>
```

同时谱号包含 `<clef-octave-change>-1</clef-octave-change>`。

### 7.7 调号变化

文件中存在调号变化：
- **初始**: 4 fifths (E major)
- **Measure 18**: 变为 2 fifths (D major)

调号变化在所有声部中同步出现。

---

## 8. 总结

### 文件特点

1. **声乐作品**: 这是一首无伴奏合唱（A cappella）改编作品，包含独唱、伴唱、四声部合唱和钢琴伴奏
2. **双语歌词**: 日语原文 + 罗马字注音 + 英语翻译
3. **Sibelius 导出**: 由 Sibelius 8.2.0 直接导出，带有典型的 Sibelius 特征
4. **标准兼容**: 基本符合 MusicXML 3.0 标准，但包含 Sibelius 特有的字体和布局信息

### 解析建议

1. **忽略颜色属性**: `color="#000000"` 可安全忽略
2. **字体映射**: 将 Opus Std/Opus Text Std 映射到通用音乐字体
3. **多声部处理**: P7 需要正确处理 backup/voice 逻辑
4. **歌词对齐**: 使用 syllabic 属性正确拼接多音节词
5. **移调处理**: P2 需要应用 octave-change=-1 的移调
6. **震音解析**: P7 最后两小节的 tremolo 需要特殊处理
