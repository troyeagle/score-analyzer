# MusicXML 渲染方案调研

**日期**: 2026-05-15

---

## 一、主流方案对比

| 方案 | GitHub Stars | 包大小 | MusicXML支持 | 渲染质量 | 维护状态 | 推荐指数 |
|------|-------------|--------|-------------|----------|----------|----------|
| **OpenSheetMusicDisplay** | 1.8k+ | ~500KB | 完整 | 优秀 | 活跃 | ⭐⭐⭐⭐⭐ |
| **Verovio** | 800+ | ~2MB | 完整 | 专业 | 活跃 | ⭐⭐⭐⭐ |
| **abcjs** | 1.5k+ | ~200KB | 部分 | 良好 | 活跃 | ⭐⭐⭐ |
| **VexFlow** | 3k+ | ~300KB | 需自行解析 | 优秀 | 活跃 | ⭐⭐ |

---

## 二、方案详情

### 2.1 OpenSheetMusicDisplay (OSMD)

**GitHub**: https://github.com/opensheetmusicdisplay/opensheetmusicdisplay

**优点**:
- 最流行的开源 MusicXML 渲染库
- 基于 VexFlow，渲染质量高
- 完整的 MusicXML 解析支持
- 支持歌词、表情记号、连音线等
- 活跃的社区和维护
- TypeScript 支持

**缺点**:
- 包体积较大（~500KB）
- 某些复杂乐谱可能渲染不完美

**安装**:
```bash
npm install opensheetmusicdisplay
```

**使用示例**:
```typescript
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay'

const osmd = new OpenSheetMusicDisplay('container-id')
await osmd.load(musicXmlString)
osmd.render()
```

---

### 2.2 Verovio

**GitHub**: https://github.com/rism-digital/verovio

**优点**:
- 专业的音乐记谱渲染引擎
- 支持 MEI 和 MusicXML
- 渲染质量非常高（学术级别）
- 支持 MIDI 播放
- 丰富的配置选项

**缺点**:
- 包体积大（~2MB）
- 学习曲线较陡
- 主要面向学术用途

**安装**:
```bash
npm install verovio
```

**使用示例**:
```typescript
import { VerovioToolkit } from 'verovio'

const toolkit = new VerovioToolkit()
toolkit.loadData(musicXmlString)
const svg = toolkit.renderToSVG(1)
```

---

### 2.3 abcjs

**GitHub**: https://github.com/paulrosen/abcjs

**优点**:
- 轻量级（~200KB）
- 支持 ABC 记谱法和 MusicXML
- 简单易用
- 支持播放功能

**缺点**:
- MusicXML 支持不完整
- 渲染质量一般
- 对复杂乐谱支持有限

**安装**:
```bash
npm install abcjs
```

**使用示例**:
```typescript
import abcjs from 'abcjs'

abcjs.renderAbc('container-id', abcString)
```

---

### 2.4 VexFlow (当前方案)

**GitHub**: https://github.com/vexflow/vexflow

**优点**:
- 底层渲染引擎，灵活度高
- 渲染质量优秀
- 包体积适中

**缺点**:
- 需要自行解析 MusicXML
- 开发工作量大
- 维护成本高

---

## 三、推荐方案

### 首选: OpenSheetMusicDisplay (OSMD)

**理由**:
1. 最成熟的开源方案
2. 完整的 MusicXML 支持
3. 渲染质量优秀
4. 社区活跃，文档完善
5. TypeScript 原生支持

### 备选: Verovio

**理由**:
1. 专业级渲染质量
2. 功能最全面
3. 适合学术用途

### 轻量级: abcjs

**理由**:
1. 包体积小
2. 简单易用
3. 适合简单乐谱

---

## 四、实现计划

1. 安装 OSMD、Verovio、abcjs 三个库
2. 创建统一的渲染接口
3. 在 UI 中提供方案选择
4. 对比渲染效果
