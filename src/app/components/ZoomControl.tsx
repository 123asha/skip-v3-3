import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/** Id of the footer's bottom-left row (App) — page controls join it there */
export const FOOTER_SLOT_ID = 'footer-left-slot';

/**
 * ⌘ ⊖ ⊕ — the page's density / depth control. It isn't positioned by the
 * page: it's placed into the footer's bottom-left row, after the language
 * switch, so it shares that row's gap and text baseline on every page.
 * Desktop only (the row itself isn't rendered on a phone).
 */
export default function ZoomControl({ onMinus, onPlus, minusDisabled, plusDisabled, minusLabel, plusLabel, inline, noKey }: {
  onMinus: () => void;
  onPlus: () => void;
  minusDisabled?: boolean;
  plusDisabled?: boolean;
  minusLabel: string;
  plusLabel: string;
  /** Render right where it's placed (above a table or grid) instead of in
   *  the footer's corner */
  inline?: boolean;
  /** Without the ⌘ (phones — no keyboard shortcut to hint at) */
  noKey?: boolean;
}) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => { if (!inline) setSlot(document.getElementById(FOOTER_SLOT_ID)); }, [inline]);
  const pill = (
    <span className="zoomPill">
      {!noKey && <span aria-hidden="true">⌘</span>}
      <button aria-label={minusLabel} disabled={minusDisabled} onClick={onMinus}><CircleSign plus={false} /></button>
      <button aria-label={plusLabel} disabled={plusDisabled} onClick={onPlus}><CircleSign plus /></button>
    </span>
  );
  if (inline) return pill;
  if (!slot) return null;
  return createPortal(pill, slot);
}

// ⊖ / ⊕ drawn: the site font has no such glyphs, and the browser's stand-ins
// came out tiny next to ⌘ — these are sized like it
function CircleSign({ plus }: { plus: boolean }) {
  return (
    <svg width="0.95em" height="0.95em" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-0.12em' }}>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
      <path d={plus ? 'M4.5 8h7M8 4.5v7' : 'M4.5 8h7'} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
