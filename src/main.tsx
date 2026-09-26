import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import './styles/index.css';

// Desktop scaling model:
//  ≥980px  — no zoom. Type stays at its fixed size and only the grid columns
//            (all percentage-based) get narrower, so cases, tables and other
//            column-bound objects shrink proportionally on their own.
//  768–980px — zoom down from 980 so the whole layout, type included,
//            scales together rather than cramping.
//  ≤768px  — no zoom; the responsive CSS block handles mobile layout.
const FLUID_MIN = 980;

function updateZoom() {
  const w = window.innerWidth;
  if (w <= 768 || w >= FLUID_MIN) {
    document.documentElement.style.zoom = '1';
  } else {
    document.documentElement.style.zoom = String(w / FLUID_MIN);
  }
}
updateZoom();
window.addEventListener('resize', updateZoom, { passive: true });

createRoot(document.getElementById('root')!).render(<App />);
  