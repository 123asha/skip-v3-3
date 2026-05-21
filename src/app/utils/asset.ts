/**
 * Prefix a public-folder path with Vite's base URL so assets work
 * both in dev (base = '/') and on GitHub Pages (base = '/skip-design/').
 */
export const asset = (path: string): string =>
  import.meta.env.BASE_URL + path.replace(/^\//, '');
