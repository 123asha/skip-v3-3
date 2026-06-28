/**
 * Prefix a public-folder path with Vite's base URL so assets work
 * both in dev (base = '/') and on GitHub Pages (base = '/skip-design/').
 */
export const asset = (path: string): string =>
  import.meta.env.BASE_URL + path.replace(/^\//, '');

/**
 * Like asset(), but on mobile (coarse pointer / ≤768px) it serves a heavily
 * downscaled "-m" copy of the video to cut data + decode cost. Only the videos
 * that actually have a "-m" variant are swapped; everything else is unchanged.
 * Non-reactive (read once at render time) — fine for a video `src`.
 */
const HAS_MOBILE_COPY = new Set(['/video.mp4', '/s1.mp4']);
export const videoAsset = (path: string): string => {
  const mobile = typeof window !== 'undefined'
    && (window.matchMedia?.('(max-width: 768px)').matches
      || window.matchMedia?.('(pointer: coarse)').matches);
  if (mobile && HAS_MOBILE_COPY.has(path)) {
    return asset(path.replace(/\.mp4$/, '-m.mp4'));
  }
  return asset(path);
};

/**
 * Derive aspect-ratio key from a filename that ends with -h or -v before the
 * extension (e.g. "case1-h.png" → 'h', "case2-v.png" → 'v').
 * Returns 'h' (horizontal) by default if no suffix is present.
 */
export function arSuffix(path: string): 'h' | 'v' {
  return /-v\.[^.]+$/.test(path) ? 'v' : 'h';
}
