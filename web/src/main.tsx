import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { boot } from './scene/modelSource'

createRoot(document.getElementById('root')!).render(<App />)
boot.appReady()
