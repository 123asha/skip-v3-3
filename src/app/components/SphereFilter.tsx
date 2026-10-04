import { useMemo } from 'react';

// SVG filter that wraps a square picture onto a ball: the middle swells, the
// rim wraps away (a displacement map of a hemisphere, in bounding-box units)
export function SphereFilter({ id }: { id: string }) {
  const map = useMemo(() => {
    if (typeof document === 'undefined') return '';
    const N = 256;
    const c = document.createElement('canvas');
    c.width = c.height = N;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(N, N);
    const S = 0.5; // must match the filter's scale
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const px = ((x + 0.5) / N - 0.5) * 2, py = ((y + 0.5) / N - 0.5) * 2;
      const r = Math.hypot(px, py);
      let dx = 0, dy = 0;
      if (r > 0 && r < 1) {
        const k = (Math.asin(r) / (Math.PI / 2)) / r - 1;
        dx = (px * k) / 2; dy = (py * k) / 2;
      }
      const i = (y * N + x) * 4;
      img.data[i] = Math.round((0.5 + dx / S) * 255);
      img.data[i + 1] = Math.round((0.5 + dy / S) * 255);
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }, []);
  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
      <filter id={id} filterUnits="objectBoundingBox" primitiveUnits="objectBoundingBox" x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
        <feImage href={map} x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="map" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale="0.5" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
