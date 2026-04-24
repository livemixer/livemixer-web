# 状态管理

LiveMixer Web 使用 [Zustand](https://github.com/pmndrs/zustand) 进行状态管理。本文档涵盖 Store 架构、数据流和持久化策略。

## 为什么选择 Zustand

- **极简样板代码** - 无需 reducer、action 或 dispatch 函数
- **React 友好** - 基于 Hooks 的 API，自动优化重渲染
- **中间件支持** - 内置 `persist` 和 `immer` 中间件
- **TypeScript 优先** - Store 状态和操作的完整类型推断
- **轻量** - 小包体积，零依赖

## useProtocolStore

协议 Store 管理场景和项目数据，支持撤销/重做。

### 状态结构

```ts
interface ProtocolState {
  data: ProtocolData;        // 当前场景配置
  past: ProtocolData[];      // 撤销历史栈
  future: ProtocolData[];    // 重做历史栈
  canUndo: boolean;          // 是否可撤销
  canRedo: boolean;          // 是否可重做
}
```

### 操作

#### updateData

更新协议数据并将当前状态推入撤销历史。

```ts
updateData: (data: ProtocolData) => void
```

`updatedAt` 元数据字段自动设置为当前时间戳。`future` 栈被清空（新更改使重做历史失效）。

#### undo / redo

标准的撤销/重做操作，使用双栈实现：

```
  past[]          data          future[]
[更旧...]       [当前]       [...更新]

  <-- 撤销                    重做 -->
```

- **MAX_HISTORY_SIZE** = 50 条记录
- 当 `past` 超过 50 条时，丢弃最旧的记录
- `updateData` 清空 `future` 栈（标准撤销/重做行为）

### 持久化

使用 Zustand 的 `persist` 中间件和 `localStorage`：

```ts
persist(
  // ... store 定义
  {
    name: 'livemixer-protocol',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ data: state.data }),  // 仅持久化 data
  },
)
```

`partialize` 函数确保仅 `data` 被持久化。`past` 和 `future` 栈在页面刷新时重置。

## useSettingsStore

设置 Store 管理应用偏好，具有敏感数据保护。

### 持久化设置与敏感设置分离

- **PersistentSettings** - 保存到 localStorage（语言、主题、分辨率等）
- **SensitiveSettings** - 仅保存在内存中（LiveKit Token 不持久化）

### 敏感数据保护

`partialize` 函数显式排除敏感字段：

```ts
partialize: (state) => {
  const {
    livekitToken: _livekitToken,
    livekitPullToken: _livekitPullToken,
    // ...排除方法和敏感数据
    ...persistentState
  } = state;
  return persistentState;
}
```

确保访问令牌永不存储在 localStorage 中，页面刷新时丢失。

### 操作

| 操作 | 说明 |
|------|------|
| `updatePersistentSettings(settings)` | 更新持久化设置 |
| `updateSensitiveSettings(settings)` | 更新敏感设置（仅内存） |
| `resetSettings()` | 重置所有设置为默认值 |

## 状态同步到插件上下文

应用状态从 Zustand Store 同步到插件上下文系统，使插件可以观察变化：

```ts
// App.tsx 中
useEffect(() => {
  pluginContextManager.updateState({
    scene: {
      currentId: activeSceneId,
      items: activeScene?.items || [],
      selectedItemId,
      selectedItem,
    },
  });
}, [activeSceneId, activeScene?.items, selectedItemId, selectedItem]);
```

这创建了从 Zustand Store 经过插件上下文到插件的单向数据流，确保插件始终读取最新状态，同时修改经过权限检查的操作。
