import { useCallback, useEffect, useRef, useState } from 'react'
import lmsLogo from '/lms.svg'
import protocolData from '../protocol/v1.0.0/v1.0.0.json'
import { BottomBar } from './components/bottom-bar'
import { KonvaCanvas, type KonvaCanvasHandle } from './components/konva-canvas'
import { LeftSidebar } from './components/left-sidebar'
import { MainLayout } from './components/main-layout'
import { PropertyPanel } from './components/property-panel'
import { SettingsDialog } from './components/settings-dialog'
import { StatusBar } from './components/status-bar'
import { Toolbar } from './components/toolbar'
import { canvasCaptureService } from './services/canvas-capture'
import { streamingService } from './services/streaming'
import { useSettingsStore } from './store/setting'
import type { ProtocolData, SceneItem } from './types/protocol'
import './App.css'

function App() {
  const [data, setData] = useState<ProtocolData>(protocolData as ProtocolData)
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const canvasRef = useRef<KonvaCanvasHandle>(null)

  // 从 store 获取 LiveKit 配置和输出设置
  const { livekitUrl, livekitToken, fps, videoBitrate, videoEncoder } = useSettingsStore()

  // 初始化激活场景（仅执行一次）
  useEffect(() => {
    const activeScene = data.scenes.find((s) => s.active) || data.scenes[0]
    if (activeScene && !activeSceneId) {
      setActiveSceneId(activeScene.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSceneId, data.scenes.find, data.scenes[0]])

  const activeScene = data.scenes.find((s) => s.id === activeSceneId) || null
  const selectedItem =
    activeScene?.items.find((item) => item.id === selectedItemId) || null

  // 添加新场景
  const handleAddScene = () => {
    const newSceneId = `scene_${Date.now()}`
    const newScene = {
      id: newSceneId,
      name: `新场景 ${data.scenes.length + 1}`,
      active: false,
      items: [],
    }

    setData((prevData) => ({
      ...prevData,
      scenes: [...prevData.scenes, newScene],
    }))

    // 自动选择新场景
    setActiveSceneId(newSceneId)
  }

  // 删除场景
  const handleDeleteScene = (sceneId: string) => {
    if (data.scenes.length <= 1) {
      alert('至少需要保留一个场景')
      return
    }

    setData((prevData) => {
      const newScenes = prevData.scenes.filter((s) => s.id !== sceneId)
      return {
        ...prevData,
        scenes: newScenes,
      }
    })

    // 如果删除的是当前激活的场景，切换到第一个场景
    if (activeSceneId === sceneId) {
      const remainingScenes = data.scenes.filter((s) => s.id !== sceneId)
      setActiveSceneId(remainingScenes[0]?.id || null)
    }
  }

  // 上移场景
  const handleMoveSceneUp = (sceneId: string) => {
    setData((prevData) => {
      const index = prevData.scenes.findIndex((s) => s.id === sceneId)
      if (index <= 0) return prevData // 已经是第一个，无法上移

      const newScenes = [...prevData.scenes]
        ;[newScenes[index - 1], newScenes[index]] = [
          newScenes[index],
          newScenes[index - 1],
        ]

      return {
        ...prevData,
        scenes: newScenes,
      }
    })
  }

  // 下移场景
  const handleMoveSceneDown = (sceneId: string) => {
    setData((prevData) => {
      const index = prevData.scenes.findIndex((s) => s.id === sceneId)
      if (index < 0 || index >= prevData.scenes.length - 1) return prevData // 已经是最后一个，无法下移

      const newScenes = [...prevData.scenes]
        ;[newScenes[index], newScenes[index + 1]] = [
          newScenes[index + 1],
          newScenes[index],
        ]

      return {
        ...prevData,
        scenes: newScenes,
      }
    })
  }

  // 添加新源到当前场景
  const handleAddItem = () => {
    if (!activeSceneId) return

    const newItemId = `item_${Date.now()}`
    const newItem = {
      id: newItemId,
      type: 'color' as const,
      zIndex: activeScene?.items.length || 0,
      layout: {
        x: 100,
        y: 100,
        width: 400,
        height: 300,
      },
      color: '#3b82f6',
    }

    setData((prevData) => ({
      ...prevData,
      scenes: prevData.scenes.map((scene) => {
        if (scene.id !== activeSceneId) return scene
        return {
          ...scene,
          items: [...scene.items, newItem],
        }
      }),
    }))

    // 自动选择新添加的源
    setSelectedItemId(newItemId)
  }

  // 删除源
  const handleDeleteItem = (itemId: string) => {
    if (!activeSceneId) return

    setData((prevData) => ({
      ...prevData,
      scenes: prevData.scenes.map((scene) => {
        if (scene.id !== activeSceneId) return scene
        return {
          ...scene,
          items: scene.items.filter((item) => item.id !== itemId),
        }
      }),
    }))

    // 如果删除的是当前选中的源，清除选中状态
    if (selectedItemId === itemId) {
      setSelectedItemId(null)
    }
  }

  // 上移源
  const handleMoveItemUp = (itemId: string) => {
    if (!activeSceneId) return

    setData((prevData) => ({
      ...prevData,
      scenes: prevData.scenes.map((scene) => {
        if (scene.id !== activeSceneId) return scene

        const index = scene.items.findIndex((item) => item.id === itemId)
        if (index <= 0) return scene // 已经是第一个，无法上移

        const newItems = [...scene.items]
          ;[newItems[index - 1], newItems[index]] = [
            newItems[index],
            newItems[index - 1],
          ]

        return {
          ...scene,
          items: newItems,
        }
      }),
    }))
  }

  // 下移源
  const handleMoveItemDown = (itemId: string) => {
    if (!activeSceneId) return

    setData((prevData) => ({
      ...prevData,
      scenes: prevData.scenes.map((scene) => {
        if (scene.id !== activeSceneId) return scene

        const index = scene.items.findIndex((item) => item.id === itemId)
        if (index < 0 || index >= scene.items.length - 1) return scene // 已经是最后一个，无法下移

        const newItems = [...scene.items]
          ;[newItems[index], newItems[index + 1]] = [
            newItems[index + 1],
            newItems[index],
          ]

        return {
          ...scene,
          items: newItems,
        }
      }),
    }))
  }

  // 更新场景项
  const handleUpdateItem = (itemId: string, updates: Partial<SceneItem>) => {
    if (!activeSceneId) return

    setData((prevData) => ({
      ...prevData,
      scenes: prevData.scenes.map((scene) => {
        if (scene.id !== activeSceneId) return scene

        return {
          ...scene,
          items: scene.items.map((item) => {
            if (item.id !== itemId) return item

            return {
              ...item,
              ...updates,
              layout: updates.layout
                ? { ...item.layout, ...updates.layout }
                : item.layout,
              transform: updates.transform
                ? { ...item.transform, ...updates.transform }
                : item.transform,
            }
          }),
        }
      }),
    }))
  }

  // 处理推流开关
  const handleToggleStreaming = useCallback(async () => {
    if (!isStreaming) {
      // 开始推流
      try {
        if (!livekitUrl || !livekitToken) {
          alert('请先在设置中配置 LiveKit 服务器地址和 Token')
          return
        }

        // 获取 Canvas 元素
        const canvas = canvasRef.current?.getCanvas()
        if (!canvas) {
          alert('无法获取画布元素')
          return
        }

        // 启动持续渲染，确保 captureStream 持续捕获帧
        canvasRef.current?.startContinuousRendering()

        // 从 Canvas 捕获媒体流
        const fpsValue = Number.parseInt(fps, 10) || 30
        const mediaStream = canvasCaptureService.captureStream(canvas, fpsValue)

        // 获取视频码率设置（kbps）
        const bitrateValue = Number.parseInt(videoBitrate, 10) || 5000

        // 连接到 LiveKit 并推流，使用设置中的编码器和帧率
        await streamingService.connect(
          livekitUrl,
          livekitToken,
          mediaStream,
          bitrateValue,
          videoEncoder as 'h264' | 'h265' | 'vp8' | 'vp9' | 'av1',
          fpsValue
        )

        setIsStreaming(true)
        console.log('开始推流')
      } catch (error) {
        console.error('推流失败:', error)
        alert(
          `推流失败: ${error instanceof Error ? error.message : '未知错误'}`,
        )
        // 清理资源
        canvasRef.current?.stopContinuousRendering()
        canvasCaptureService.stopCapture()
      }
    } else {
      // 停止推流
      try {
        await streamingService.disconnect()
        canvasCaptureService.stopCapture()
        canvasRef.current?.stopContinuousRendering()
        setIsStreaming(false)
        console.log('停止推流')
      } catch (error) {
        console.error('停止推流失败:', error)
      }
    }
  }, [isStreaming, livekitUrl, livekitToken, fps, videoBitrate, videoEncoder])

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      if (isStreaming) {
        streamingService.disconnect()
        canvasCaptureService.stopCapture()
        canvasRef.current?.stopContinuousRendering()
      }
    }
  }, [isStreaming])

  return (
    <>
      <MainLayout
        logo={
          <img
            src={lmsLogo}
            style={{ width: '40px', height: '40px' }}
            alt="LMS logo"
          />
        }
        toolbar={<Toolbar />}
        leftSidebar={<LeftSidebar />}
        canvas={
          <KonvaCanvas
            ref={canvasRef}
            scene={activeScene}
            canvasWidth={data.canvas.width}
            canvasHeight={data.canvas.height}
            onSelectItem={setSelectedItemId}
            onUpdateItem={handleUpdateItem}
            selectedItemId={selectedItemId}
          />
        }
        rightSidebar={
          <PropertyPanel
            selectedItem={selectedItem}
            onUpdateItem={handleUpdateItem}
          />
        }
        bottomBar={
          <BottomBar
            scenes={data.scenes}
            activeSceneId={activeSceneId}
            onSceneSelect={setActiveSceneId}
            selectedItemId={selectedItemId}
            onSelectItem={setSelectedItemId}
            isStreaming={isStreaming}
            onToggleStreaming={handleToggleStreaming}
            onSettingsClick={() => setSettingsOpen(true)}
            onAddScene={handleAddScene}
            onDeleteScene={handleDeleteScene}
            onMoveSceneUp={handleMoveSceneUp}
            onMoveSceneDown={handleMoveSceneDown}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onMoveItemUp={handleMoveItemUp}
            onMoveItemDown={handleMoveItemDown}
          />
        }
        statusBar={
          <StatusBar
            isStreaming={isStreaming}
            outputResolution={`${data.canvas.width}x${data.canvas.height}`}
            fps={60}
            cpuUsage={Math.random() * 20}
          />
        }
      />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}

export default App
