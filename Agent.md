# 曲式分析可视化工具 - 开发规约

## 一、项目基本信息

- **项目名称**: Score-Analyzer（曲式分析可视化工具）
- **技术栈**: Vue 3 + TypeScript + Vite + VexFlow + Element Plus + Pinia
- **包管理器**: npm
- **Node.js版本**: >= 18.0.0

## 二、目录结构规范

```
Score-Analyzer/
├── src/
│   ├── services/        # 核心业务服务（单例模式）
│   ├── stores/          # Pinia状态管理
│   ├── views/           # 页面级Vue组件
│   ├── components/      # 可复用Vue组件
│   ├── types/           # TypeScript类型定义
│   ├── utils/           # 工具函数
│   ├── router/          # 路由配置
│   ├── assets/          # 静态资源
│   └── main.ts          # 应用入口
├── tests/
│   ├── unit/            # 单元测试
│   ├── integration/     # 集成测试
│   └── fixtures/        # 测试数据
├── public/              # 公共静态资源
└── 技术文档.md          # 项目文档
```

## 三、代码规范

### 3.1 TypeScript规范

- 使用严格模式（`strict: true`）
- 所有函数参数和返回值必须声明类型
- 优先使用 `interface` 定义对象类型，`type` 定义联合类型或工具类型
- 避免使用 `any`，如需使用必须添加注释说明原因
- 使用枚举 `enum` 定义常量集合

```typescript
// 正确
interface ScoreMetadata {
  title: string
  composer: string
  keySignature: string
}

function parseScore(file: File): Promise<ScoreMetadata> {
  // ...
}

// 错误
function parseScore(file: any) {
  // ...
}
```

### 3.2 Vue组件规范

- 使用 `<script setup>` 语法
- 组件文件名使用 PascalCase（如 `ScoreView.vue`）
- Props 必须定义类型和默认值
- 使用 Composition API 而非 Options API

```vue
<script setup lang="ts">
interface Props {
  title: string
  visible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: true
})
</script>
```

### 3.3 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件名（组件） | PascalCase | `ScoreView.vue` |
| 文件名（服务） | PascalCase | `MusicXMLParser.ts` |
| 文件名（工具） | camelCase | `formatDate.ts` |
| 变量/函数 | camelCase | `scoreTitle`, `parseScore` |
| 常量 | UPPER_SNAKE_CASE | `MAX_MEASURES` |
| 接口 | PascalCase | `ScoreMetadata` |
| 类型 | PascalCase | `AnnotationType` |
| 枚举 | PascalCase | `LayerType` |

### 3.4 导入顺序

```typescript
// 1. 第三方库
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 2. 项目类型
import type { ScoreMetadata, Annotation } from '../types'

// 3. 项目服务
import { musicXMLParser } from '../services/MusicXMLParser'

// 4. 项目组件
import ScoreView from '../views/ScoreView.vue'

// 5. 工具函数
import { formatDate } from '../utils/formatDate'
```

## 四、服务层规范

### 4.1 服务设计原则

- 采用单例模式导出实例
- 服务类职责单一，遵循单一职责原则
- 所有异步方法返回 Promise
- 错误处理统一抛出 Error 对象

```typescript
export class MusicXMLParser {
  async parse(file: File): Promise<MusicXMLParseResult> {
    try {
      // 解析逻辑
    } catch (error) {
      throw new Error(`解析失败: ${error.message}`)
    }
  }
}

// 导出单例
export const musicXMLParser = new MusicXMLParser()
```

### 4.2 状态管理规范

- 使用 Pinia 的 Composition API 风格
- State 使用 `ref` 定义
- Getter 使用 `computed` 定义
- Action 使用普通函数定义

```typescript
export const useScoreStore = defineStore('score', () => {
  // State
  const metadata = ref<ScoreMetadata | null>(null)
  const isLoaded = ref(false)

  // Getters
  const scoreTitle = computed(() => metadata.value?.title || '未命名')

  // Actions
  const loadScore = async (file: File) => {
    isLoaded.value = false
    // 加载逻辑
    isLoaded.value = true
  }

  return { metadata, isLoaded, scoreTitle, loadScore }
})
```

## 五、样式规范

- 使用 `<style scoped>` 避免样式污染
- 使用 Element Plus 的设计变量
- 颜色值使用 CSS 变量或设计令牌
- 布局优先使用 Flexbox 或 Grid

```vue
<style scoped>
.container {
  display: flex;
  gap: 16px;
  padding: 20px;
}

.title {
  color: var(--el-text-color-primary);
  font-size: 16px;
}
</style>
```

## 六、测试规范

### 6.1 测试文件命名

- 测试文件与被测文件同名，添加 `.test.ts` 后缀
- 测试文件放在 `tests/unit/` 目录下

```
src/services/MusicXMLParser.ts
tests/unit/MusicXMLParser.test.ts
```

### 6.2 测试编写规范

- 使用 `describe` 分组，`it` 定义测试用例
- 测试命名使用中文描述预期行为
- 每个测试用例只验证一个行为
- 使用 `beforeEach` 初始化测试环境

```typescript
describe('MusicXMLParser', () => {
  let parser: MusicXMLParser

  beforeEach(() => {
    parser = new MusicXMLParser()
  })

  describe('parse', () => {
    it('应该解析有效的MusicXML文件', async () => {
      const result = await parser.parse(validFile)
      expect(result.metadata.title).toBe('测试乐谱')
    })

    it('应该在文件无效时抛出错误', async () => {
      await expect(parser.parse(invalidFile)).rejects.toThrow()
    })
  })
})
```

### 6.3 测试覆盖率要求

- 核心服务（services/）覆盖率 >= 80%
- 状态管理（stores/）覆盖率 >= 80%
- 工具函数（utils/）覆盖率 >= 90%

## 七、Git规范

### 7.1 分支策略

| 分支 | 用途 | 命名规范 |
|------|------|----------|
| main | 生产环境代码 | - |
| develop | 开发主分支 | - |
| feature/* | 功能开发 | feature/功能名称 |
| fix/* | 缺陷修复 | fix/问题描述 |
| release/* | 版本发布 | release/版本号 |

### 7.2 提交信息规范

使用 Conventional Commits 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型**:

| Type | 说明 |
|------|------|
| feat | 新功能 |
| fix | 修复Bug |
| docs | 文档更新 |
| style | 代码格式调整（不影响逻辑） |
| refactor | 重构 |
| test | 测试相关 |
| chore | 构建/工具链更新 |

**示例**:

```
feat(parser): 添加MusicXML和声标注解析功能

- 支持harmony元素解析
- 提取和弦根音和类型
- 映射到DCML标准符号

Closes #123
```

## 八、开发流程

### 8.1 新功能开发

1. 从 `develop` 创建 `feature/*` 分支
2. 编写功能代码
3. 编写单元测试
4. 运行测试确保通过
5. 提交代码并创建 PR
6. 代码审查后合并到 `develop`

### 8.2 Bug修复

1. 从 `develop` 创建 `fix/*` 分支
2. 编写复现测试
3. 修复代码
4. 运行测试确保通过
5. 提交代码并创建 PR
6. 代码审查后合并到 `develop`

## 九、常用命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test

# 运行测试（单次）
npm run test:run

# 类型检查
npm run build

# 代码检查
npm run lint
```

## 十、注意事项

1. **不要提交敏感信息**: API Key、密码等配置使用环境变量
2. **不要提交构建产物**: `dist/`、`node_modules/` 已在 `.gitignore` 中
3. **保持向后兼容**: 修改公共接口时考虑兼容性
4. **及时更新文档**: 功能变更后同步更新 `技术文档.md`
5. **测试先行**: 重要功能先写测试再写实现

## 十一、代码审查清单

- [ ] 代码符合命名规范
- [ ] TypeScript 类型定义完整
- [ ] 无 `any` 类型（或有合理注释）
- [ ] 错误处理完善
- [ ] 测试用例覆盖核心逻辑
- [ ] 无硬编码的魔法数字/字符串
- [ ] 组件职责单一
- [ ] 样式使用 scoped
- [ ] 无未使用的导入/变量
