import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { PluginContextProvider } from './components/plugin-slot';
import { AudioInputPlugin } from './plugins/builtin/audio-input';
import { ImagePlugin } from './plugins/builtin/image-plugin';
import { MediaSourcePlugin } from './plugins/builtin/mediasource-plugin';
import { ScreenCapturePlugin } from './plugins/builtin/screencapture-plugin';
import { TextPlugin } from './plugins/builtin/text-plugin';
import { WebCamPlugin } from './plugins/builtin/webcam';
import { pluginRegistry } from './services/plugin-registry';

// Register built-in plugins
pluginRegistry.register(ImagePlugin);
pluginRegistry.register(MediaSourcePlugin);
pluginRegistry.register(ScreenCapturePlugin);
pluginRegistry.register(WebCamPlugin);
pluginRegistry.register(AudioInputPlugin);
pluginRegistry.register(TextPlugin);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PluginContextProvider>
      <App />
    </PluginContextProvider>
  </StrictMode>
);
