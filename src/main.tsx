import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import './styles/index.css';

function updateZoom() {
  document.documentElement.style.zoom = String(Math.min(1, window.innerWidth / 1600));
}
updateZoom();
window.addEventListener('resize', updateZoom, { passive: true });

createRoot(document.getElementById('root')!).render(<App />);
  