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
export default function ZoomControl({ onMinus, onPlus, minusDisabled, plusDisabled, minusLabel, plusLabel }: {
  onMinus: () => void;
  onPlus: () => void;
  minusDisabled?: boolean;
  plusDisabled?: boolean;
  minusLabel: string;
  plusLabel: string;
}) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => { setSlot(document.getElementById(FOOTER_SLOT_ID)); }, []);
  if (!slot) return null;
  return createPortal(
    <span className="zoomPill">
      <span aria-hidden="true">⌘</span>
      <button aria-label={minusLabel} disabled={minusDisabled} onClick={onMinus}>⊖</button>
      <button aria-label={plusLabel} disabled={plusDisabled} onClick={onPlus}>⊕</button>
    </span>,
    slot,
  );
}
