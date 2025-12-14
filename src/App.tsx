import { useEffect, useState } from 'react'
import lmsLogo from '/lms.svg'
import protocolData from '../protocol/v1.0.0/v1.0.0.json'
import { BottomBar } from './components/bottom-bar'
import { KonvaCanvas } from './components/konva-canvas'
import { LeftSidebar } from './components/left-sidebar'
import { MainLayout } from './components/main-layout'
import { PropertyPanel } from './components/property-panel'
import { SettingsDialog } from './components/settings-dialog'
import { StatusBar } from './components/status-bar'
import { Toolbar } from './components/toolbar'
import type { ProtocolData, SceneItem } from './types/protocol'
import './App.css'

function App() {
  const [data, setData] = useState<ProtocolData>(protocolData as ProtocolData)
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

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
            onToggleStreaming={() => setIsStreaming(!isStreaming)}
            onSettingsClick={() => setSettingsOpen(true)}
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
