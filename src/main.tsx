import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { pluginRegistry } from './services/plugin-registry'
import { ImagePlugin } from './plugins/builtin/image-plugin'
import { WebCamPlugin } from './plugins/builtin/webcam-plugin'
import { TextPlugin } from './plugins/builtin/text-plugin'

// 注册内置插件
pluginRegistry.register(ImagePlugin)
pluginRegistry.register(WebCamPlugin)
pluginRegistry.register(TextPlugin)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
