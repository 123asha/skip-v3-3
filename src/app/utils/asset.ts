/**
 * Prefix a public-folder path with Vite's base URL so assets work
 * both in dev (base = '/') and on GitHub Pages (base = '/skip-design/').
 */
export const asset = (path: string): string =>
  import.meta.env.BASE_URL + path.replace(/^\//, '');

/**
 * Derive aspect-ratio key from a filename that ends with -h or -v before the
 * extension (e.g. "case1-h.png" → 'h', "case2-v.png" → 'v').
 * Returns 'h' (horizontal) by default if no suffix is present.
 */
export function arSuffix(path: string): 'h' | 'v' {
  return /-v\.[^.]+$/.test(path) ? 'v' : 'h';
}
