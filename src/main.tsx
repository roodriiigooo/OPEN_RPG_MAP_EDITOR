import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { polyfill } from 'mobile-drag-drop';
import 'mobile-drag-drop/default.css';

// Initialize touch drag and drop polyfill
polyfill({});

// Force prevent default on touchmove to allow dragging over the canvas
document.addEventListener('touchmove', (e) => {
    if ((e.target as HTMLElement)?.closest('.drag-handle')) {
        e.preventDefault();
    }
}, { passive: false });

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <App />
  )
}
