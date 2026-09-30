/** → in a filled circle, at text size — the site's «this leads elsewhere»
 *  mark (header «Написать», the home services table). Takes the text colour;
 *  the arrow is knocked out in the page colour. */
export function CircleArrow({ style }: { style?: React.CSSProperties }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" style={{ width: '1.05em', height: '1.05em', flexShrink: 0, ...style }}>
      <circle cx="8" cy="8" r="8" fill="currentColor" />
      <path d="M4.4 8h7M8.6 5l3 3-3 3" fill="none" stroke="var(--c-bg, #fff)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
