import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import './styles/index.css';

function updateZoom() {
  // On mobile (≤768px) keep zoom at 1 — responsive CSS handles layout.
  // On desktop scale down when narrower than the 1600px design width.
  if (window.innerWidth <= 768) {
    document.documentElement.style.zoom = '1';
  } else {
    document.documentElement.style.zoom = String(Math.min(1, window.innerWidth / 1600));
  }
}
updateZoom();
window.addEventListener('resize', updateZoom, { passive: true });

createRoot(document.getElementById('root')!).render(<App />);
  