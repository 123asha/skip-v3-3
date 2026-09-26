import { useEffect, useRef } from 'react';

/**
 * Trackpad pinch → the same one-step ⊕ / ⊖ as the on-screen controls.
 * Chrome/Firefox report a pinch as ctrl+wheel, Safari as gesture events;
 * both are caught here, and the browser's own page zoom is suppressed while
 * the hook is mounted. One step per ~threshold of pinch, with a short
 * cooldown so a single gesture doesn't race through every level.
 */
export function usePinchSteps(onIn: () => void, onOut: () => void, enabled = true) {
  const cb = useRef({ onIn, onOut });
  cb.current = { onIn, onOut };

  useEffect(() => {
    if (!enabled) return;
    const THRESH = 16;      // accumulated wheel delta per step
    const COOLDOWN = 240;   // ms between steps
    let acc = 0, last = 0;
    const step = (dir: 1 | -1) => {
      const now = performance.now();
      if (now - last < COOLDOWN) return;
      last = now;
      if (dir > 0) cb.current.onIn(); else cb.current.onOut();
    };
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      acc += e.deltaY;
      if (acc <= -THRESH) { acc = 0; step(1); }
      else if (acc >= THRESH) { acc = 0; step(-1); }
    };
    // Safari
    let base = 1;
    const onGestureStart = (e: any) => { e.preventDefault(); base = e.scale ?? 1; };
    const onGestureChange = (e: any) => {
      e.preventDefault();
      const r = (e.scale ?? 1) / base;
      if (r > 1.07) { base = e.scale; step(1); }
      else if (r < 0.93) { base = e.scale; step(-1); }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('gesturestart', onGestureStart as any, { passive: false } as any);
    window.addEventListener('gesturechange', onGestureChange as any, { passive: false } as any);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('gesturestart', onGestureStart as any);
      window.removeEventListener('gesturechange', onGestureChange as any);
    };
  }, [enabled]);
}
