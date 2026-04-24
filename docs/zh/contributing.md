# 贡献指南

欢迎对 LiveMixer Web 做出贡献！本指南涵盖开发环境搭建、编码规范和贡献流程。

## 开发环境搭建

### 环境要求

- **Node.js** >= 18
- **pnpm**（通过 `npm install -g pnpm` 安装）

### 克隆并安装

```sh
git clone https://github.com/livemixer/livemixer-web.git
cd livemixer-web
pnpm install
```

### 启动开发服务器

```sh
pnpm run dev
```

应用将在 `http://localhost:5173` 可用，支持热更新。

## 编码规范

### 代码检查与格式化

项目使用 [Biome](https://biomejs.dev/) 进行代码检查和格式化：

```sh
pnpm run lint        # 检查问题
pnpm run lint:fix    # 自动修复
pnpm run format      # 格式化代码
```

### TypeScript

- 所有代码必须使用 TypeScript 编写
- 使用严格模式
- 尽量避免 `any` 类型
- 共享类型应定义在 `src/types/` 中

### React

- 使用函数组件和 Hooks
- 性能关键的回调和计算值使用 `useCallback` 和 `useMemo`
- 尽量保持组件状态局部化，仅在需要共享时提升到 Zustand Store

### 命名约定

| 项目 | 规范 | 示例 |
|------|------|------|
| 文件 | `kebab-case` | `audio-mixer-panel.tsx` |
| 组件 | `PascalCase` | `PropertyPanel` |
| Hooks | `use` 前缀 + `camelCase` | `useI18n` |
| 服务 | `Service` 后缀 + `camelCase` | `StreamingService` |
| Store | `use` 前缀 + `Store` 后缀 | `useProtocolStore` |
| 类型/接口 | `I` 前缀 + `PascalCase` | `IPluginContext` |
| 常量 | `UPPER_SNAKE_CASE` | `MAX_HISTORY_SIZE` |

## 常用脚本

| 脚本 | 说明 |
|------|------|
| `pnpm run dev` | 启动开发服务器 |
| `pnpm run build` | 构建独立 Web 应用 |
| `pnpm run build:lib` | 构建库（ES + UMD） |
| `pnpm run preview` | 预览生产构建 |
| `pnpm run lint` | Biome 代码检查 |
| `pnpm run lint:fix` | 自动修复代码问题 |
| `pnpm run format` | Biome 格式化 |

## Pull Request 流程

1. **Fork** 仓库
2. 从 `develop` **创建**功能分支
3. **开发**你的更改
4. **检查**代码：`pnpm run lint:fix && pnpm run format`
5. **提交**清晰的提交信息
6. **推送**分支并创建 Pull Request
7. **审查** - 处理代码审查反馈
8. **合并** - 批准后维护者将合并

### 提交信息格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <description>
```

类型：

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更改 |
| `style` | 代码样式更改 |
| `refactor` | 代码重构 |
| `perf` | 性能改进 |
| `test` | 添加或更新测试 |
| `chore` | 构建或工具更改 |

## 许可证

向 LiveMixer Web 贡献即表示你同意你的贡献将在 [Apache-2.0 许可证](../../LICENSE)下授权。
