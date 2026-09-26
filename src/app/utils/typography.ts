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

// ── Russian typography ───────────────────────────────────────────────────────

// Prepositions / conjunctions that must not be left hanging at the end of a
// line — they get a non-breaking space and travel with the next word.
// Short ones only: longer conjunctions (чтобы, если, потому) are left alone,
// otherwise narrow columns end up too ragged.
const BIND_NEXT = [
  'в', 'во', 'на', 'над', 'под', 'при', 'про', 'за', 'из', 'изо', 'к', 'ко',
  'с', 'со', 'о', 'об', 'обо', 'от', 'до', 'по', 'у', 'для', 'без', 'или',
  'а', 'и', 'но', 'да', 'ни', 'не', 'то',
].join('|');

// Particles that belong to the word BEFORE them.
const BIND_PREV = ['бы', 'б', 'же', 'ж', 'ли', 'ль'].join('|');

const NB = '\u00A0';   // non-breaking space

const reNext = new RegExp(`(^|[\\s(«"'])(${BIND_NEXT}) `, 'gi');
const rePrev = new RegExp(`(\\S) (${BIND_PREV})(?=[\\s.,;:!?)»]|$)`, 'gi');

/**
 * Typographic clean-up for body copy: no hanging prepositions at line ends and
 * no em dash starting a line. Returns the string with non-breaking spaces —
 * safe to render as a plain JSX text node.
 */
export function typo(text?: string | null): string {
  if (!text) return '';
  let out = text.replace(/ (—|–) /g, `${NB}$1 `);
  out = out.replace(rePrev, `$1${NB}$2`);
  // Twice, so chains like "и в лесу" bind on both words
  out = out.replace(reNext, `$1$2${NB}`);
  out = out.replace(reNext, `$1$2${NB}`);
  return out;
}
