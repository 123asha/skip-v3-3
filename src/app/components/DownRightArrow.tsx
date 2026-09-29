// ⤷ drawn by hand: the site font has no such glyph, so each browser borrowed
// its own (Safari an angular one, Chrome a rounded one). Angular everywhere,
// sized like a text glyph and stroked in the text colour.
export default function DownRightArrow() {
  return (
    <svg
      width="0.85em" height="1em" viewBox="0 0 14 16" fill="none"
      style={{ display: 'inline-block', verticalAlign: '-0.15em' }}
    >
      <path d="M3 3v8h9M9 8l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}
