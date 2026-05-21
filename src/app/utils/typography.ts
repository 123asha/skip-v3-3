import type { CSSProperties } from 'react';

/** Body copy — used wherever text, captions, secondary labels appear */
export const TEXT_STYLE: CSSProperties = {
  fontFamily: 'var(--font)',
  fontSize: 'var(--text-size)',
  fontWeight: 'var(--text-weight)' as CSSProperties['fontWeight'],
  lineHeight: 'var(--text-lh)',
  letterSpacing: 'var(--text-ls)',
  color: 'var(--c-text)',
};

/** Long-form body — policy pages, expanded descriptions. Same size as body, looser line-height. */
export const BODY_LONG_STYLE: CSSProperties = {
  fontFamily: 'var(--font)',
  fontSize: 'var(--text-size)',
  fontWeight: 'var(--text-weight)' as CSSProperties['fontWeight'],
  lineHeight: 1.6,
  letterSpacing: 'var(--text-ls)',
  color: 'var(--c-text)',
};

/** H2 — service headings, panel titles */
export const H2_STYLE: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--h2-size)',
  fontWeight: 'var(--h2-weight)' as CSSProperties['fontWeight'],
  lineHeight: 'var(--h2-lh)',
  letterSpacing: 'var(--h2-ls)',
  color: 'var(--c-text)',
};
