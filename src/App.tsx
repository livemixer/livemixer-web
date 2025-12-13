import { useState, useEffect } from 'react'
import { MainLayout } from './components/main-layout'
import { KonvaCanvas } from './components/konva-canvas'
import { PropertyPanel } from './components/property-panel'
import { BottomBar } from './components/bottom-bar'
import { LeftSidebar } from './components/left-sidebar'
import { StatusBar } from './components/status-bar'
import { Toolbar } from './components/toolbar'
import type { ProtocolData, SceneItem } from './types/protocol'
import protocolData from '../protocol/v1.0.0/v1.0.0.json'
import lmsLogo from '/lms.svg'
import './App.css'

function App() {
  const [data] = useState<ProtocolData>(protocolData as ProtocolData)
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  // 初始化时设置第一个活跃场景
  useEffect(() => {
    const activeScene = data.scenes.find(s => s.active) || data.scenes[0]
    if (activeScene) {
      setActiveSceneId(activeScene.id)
    }
  }, [data.scenes])

  const activeScene = data.scenes.find(s => s.id === activeSceneId) || null
  const selectedItem = activeScene?.items.find(item => item.id === selectedItemId) || null

  return (
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
        />
      }
      rightSidebar={<PropertyPanel selectedItem={selectedItem} />}
      bottomBar={
        <BottomBar
          scenes={data.scenes}
          activeSceneId={activeSceneId}
          onSceneSelect={setActiveSceneId}
          sources={data.resources?.sources || []}
          selectedItemId={selectedItemId}
          onSelectItem={setSelectedItemId}
          isStreaming={isStreaming}
          onToggleStreaming={() => setIsStreaming(!isStreaming)}
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
  )
}

export default App
