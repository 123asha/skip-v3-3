import { useState } from 'react';
import PillButton from './PillButton';
import { TEXT_STYLE as ts, typo } from '../utils/typography';
import { useMobile } from '../hooks/useMobile';

const KEY = 'cookie-consent';

/**
 * The cookie notice, shown on a visitor's first visit until «Хорошо» is
 * pressed — the only way to close it. A white block with a grey outline:
 * above the menu on a phone, at the bottom centre on a desktop, three
 * grid columns wide.
 */
export default function CookieNotice({ onPolicy }: { onPolicy?: () => void }) {
  const isMobile = useMobile();
  const [shown, setShown] = useState(() => {
    try { return !localStorage.getItem(KEY); } catch { return true; }
  });
  if (!shown) return null;

  const accept = () => {
    try { localStorage.setItem(KEY, '1'); } catch { /* storage blocked: it just closes for now */ }
    setShown(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Куки-файлы"
      style={{
        position: 'fixed', zIndex: 300,
        ...(isMobile
          ? { left: 'var(--pad)', right: 'var(--pad)', bottom: 'var(--m-above-menu)', transition: 'bottom var(--m-menu-move)' }
          // Desktop: the three middle columns of the page grid
          : { left: 'calc(50% - var(--page-sb, 0px) / 2)', bottom: 'calc(var(--pad) + 40px)', transform: 'translateX(-50%)', width: 'calc((100vw - var(--page-sb, 0px) - 2 * var(--pad) - 4 * var(--gap)) / 5 * 3 + 2 * var(--gap))' }),
        background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 4,
        padding: 16, boxSizing: 'border-box',
        display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'flex-end', gap: 16,
      }}
    >
      <p style={{ ...ts, margin: 0, flex: 1 }}>
        {typo('Сайт использует куки-файлы (текстовые файлы с данными) для обеспечения функционирования, анализа посещаемости и повышения качества сервиса. Продолжая работу с сайтом, вы подтверждаете согласие использования куки-файлов на условиях ')}
        <a
          href="#"
          onClick={e => { e.preventDefault(); onPolicy?.(); }}
          style={{ color: 'inherit', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}
        >Политики конфиденциальности</a>.
      </p>
      <PillButton compact fullWidth={isMobile} onClick={accept}>Хорошо</PillButton>
    </div>
  );
}
