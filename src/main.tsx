import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ImagePlugin } from './plugins/builtin/image-plugin';
import { TextPlugin } from './plugins/builtin/text-plugin';
import { WebCamPlugin } from './plugins/builtin/webcam-plugin';
import { pluginRegistry } from './services/plugin-registry';

// Register built-in plugins
pluginRegistry.register(ImagePlugin);
pluginRegistry.register(WebCamPlugin);
pluginRegistry.register(TextPlugin);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
