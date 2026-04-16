import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { polyfill } from 'mobile-drag-drop';
import 'mobile-drag-drop/default.css';

// Initialize touch drag and drop polyfill
polyfill({
    holdToDrag: 300 // Enable drag after 300ms hold
});

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <App />
  )
}
