import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { boot } from './scene/modelSource'

createRoot(document.getElementById('root')!).render(<App />)
boot.appReady()

// Without WebGL there is no scene to wait for, so lift the loading screen now. (The Canvas fallback
// can't do this: React Three Fiber mounts it inside <canvas> on every browser.)
const probe = document.createElement('canvas')
if (!probe.getContext('webgl2') && !probe.getContext('webgl')) boot.finish()
