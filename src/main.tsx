import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import './styles/index.css';
import { installTranslator } from './app/i18n';

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

// No copying the site's text: selection is off in CSS (index.css), and copy /
// cut are refused too — except inside form fields, where they behave as usual.
const inField = (t: EventTarget | null) =>
  t instanceof HTMLElement && !!t.closest('input, textarea, [contenteditable]');
for (const type of ['copy', 'cut'] as const) {
  document.addEventListener(type, e => { if (!inField(e.target)) e.preventDefault(); });
}

// A very light tap of vibration when a link or button is pressed (phones that
// support it — Android; iOS Safari has no vibration API)
if ('vibrate' in navigator && window.matchMedia('(pointer: coarse)').matches) {
  document.addEventListener('click', e => {
    if (e.target instanceof Element && e.target.closest('a, button')) navigator.vibrate(8);
  }, { capture: true, passive: true });
}

installTranslator();
createRoot(document.getElementById('root')!).render(<App />);
  