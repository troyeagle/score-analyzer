# Verovio 渲染引擎开发经验与规约

**日期**: 2026-05-15
**版本**: 1.0

---

## 一、关键经验总结

### 1.1 模块初始化

**问题**: Verovio v6.x 使用双模块架构，不能直接 `import('verovio')`。

**正确方式**:
```typescript
const [wasmModule, esmModule] = await Promise.all([
  import('verovio/wasm'),   // WASM 模块加载器
  import('verovio/esm')     // VerovioToolkit 构造函数
])

const VerovioModule = await wasmModule.default()
const toolkit = new esmModule.VerovioToolkit(VerovioModule)
```

**错误方式**:
```typescript
// ❌ 不要这样
import verovio from 'verovio'
await verovio.default()  // TypeError: not a function
```

---

### 1.2 歌词多行处理

**问题**: Verovio 渲染多行歌词时，所有行的 y 坐标相同，导致重叠。

**根因**: 
- Verovio 忽略 MusicXML 中 `lyric` 元素的 `default-y` 属性
- SVG 输出中 `<g class="verse">` 没有行号信息

**解决方案**: 预处理 + 后处理

1. **预处理 MusicXML**: 为缺失的 verse 添加占位符
```typescript
// 确保每个音符都有完整的 verse 列表
doc.querySelectorAll('note').forEach(note => {
  sortedVerses.forEach(verseNumber => {
    if (!existingVerses.has(verseNumber)) {
      // 添加零宽空格占位符
      const placeholder = doc.createElement('lyric')
      placeholder.setAttribute('number', verseNumber)
      // ...
    }
  })
})
```

2. **后处理 SVG**: 根据 verse 顺序添加偏移
```typescript
// 遍历每个 note 下的多个 verse
noteElements.forEach(noteEl => {
  const verseElements = noteEl.querySelectorAll(':scope > .verse')
  for (let i = 1; i < verseElements.length; i++) {
    const textEl = verseElements[i].querySelector('text')
    const baseY = parseFloat(verseElements[0].querySelector('text').getAttribute('y'))
    textEl.setAttribute('y', String(baseY + i * 450))
  }
})
```

---

### 1.3 布局参数

**问题**: `scale` 和 `pageWidth` 共同决定每行小节数。

| 参数 | 推荐值 | 作用 |
|------|--------|------|
| scale | 28-40 | 缩小 → 每行更多小节 |
| pageWidth | 2800+ | 增大 → 每行更多小节 |
| spacingStaff | 12 | 谱表间距 |
| lyricVerseCollapse | false | 不折叠歌词行 |

**警告**: 不要单独调大 `pageWidth` 而不调小 `scale`，会导致布局异常。

---

### 1.4 SVG 属性不可靠

**教训**: Verovio 不保证所有 MusicXML 属性都会反映到 SVG 中。

| 属性 | MusicXML | SVG | 可靠性 |
|------|----------|-----|--------|
| default-y | ✅ | ❌ 被忽略 | 不可靠 |
| number (lyric) | ✅ | ❌ 丢失 | 不可靠 |
| color | ✅ | ✅ 保留 | 可靠 |

**结论**: 需要后处理 SVG 时，必须基于渲染结果推断，不能依赖原始属性。

---

## 二、开发规约

### 2.1 VerovioRenderer 类结构

```typescript
export class VerovioRenderer implements ScoreRenderer {
  // 私有状态
  private toolkit: any = null
  private container: HTMLElement | null = null
  private versePositionMap: Map<string, number> = new Map()
  
  // 公共接口
  async initialize(container: HTMLElement): Promise<void>
  async loadMusicXML(xml: string): Promise<void>
  async render(): Promise<void>
  destroy(): void
  
  // 私有方法
  private parseVerseNumbers(xml: string): string
  private fixLyricOverlap(svgElement: SVGSVGElement): void
}
```

### 2.2 错误处理

```typescript
async loadMusicXML(xml: string): Promise<void> {
  if (!this.toolkit) {
    throw new Error('Verovio 未初始化')
  }
  // ...
}
```

### 2.3 资源清理

```typescript
destroy(): void {
  if (this.toolkit) {
    this.toolkit.destroy()  // 释放 WASM 内存
  }
  if (this.container) {
    this.container.innerHTML = ''
  }
  this.toolkit = null
  this.container = null
}
```

---

## 三、测试规范

### 3.1 必须测试的场景

| 场景 | 测试内容 |
|------|----------|
| 初始化 | 双模块导入成功 |
| 单行歌词 | 正确渲染 |
| 多行歌词 | 不重叠，正确偏移 |
| 空 verse | 占位符正确插入 |
| 大谱表 | 钢琴等双谱表正确渲染 |
| 销毁 | 资源正确释放 |

### 3.2 测试示例

```typescript
describe('VerovioRenderer', () => {
  it('应该为第二个 verse 添加偏移', () => {
    // 准备 SVG
    // 调用 fixLyricOverlap
    // 验证 y 坐标偏移 450
  })
  
  it('应该为缺失的 verse 添加占位符', () => {
    // 准备 XML（第一个音符有2个verse，第二个只有1个）
    // 调用 parseVerseNumbers
    // 验证第二个音符现在有2个 verse
  })
})
```

---

## 四、已知限制

1. **歌词偏移量固定**: 450 单位，不随字体大小变化
2. **占位符可见性**: 零宽空格可能在某些字体下可见
3. **性能**: 大型乐谱（1000+ 小节）渲染较慢

---

## 五、未来改进方向

1. 根据 `lyricSize` 动态计算偏移量
2. 使用真正的空白字符替代零宽空格
3. 支持歌词对齐方式配置
4. 添加渲染进度回调
