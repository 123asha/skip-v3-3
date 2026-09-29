import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { createPortal } from 'react-dom';
import CircleInput from './CircleInput';
import MobileFooter from './MobileFooter';
import { useMobile } from '../hooks/useMobile';
import s from '../App.module.css';

interface ContactFormProps {
  onNavigatePolicy?: () => void;
  onGridMode?: (on: boolean) => void;
  /* "default" → second tab is "Стать частью команды" (resume input + bunny game)
     "consult" → second tab is "Проконсультироваться" (telegram-only, no bunny)
     used by the /services page. */
  variant?: 'default' | 'consult';
}

export default function ContactForm({ onNavigatePolicy, onGridMode, variant = 'default' }: ContactFormProps) {
  const isMobile = useMobile();
  const [checked, setChecked]   = useState(false);
  const [email, setEmail]       = useState('');
  const [telegram, setTelegram] = useState('');
  // The telegram field never runs past three rows of circles: letters that
  // fit = three rows minus the icon, the caret and the arrow circles.
  const fieldsRef = useRef<HTMLDivElement>(null);

  // Scrolled right to the end: the screen inverts (overlay below)
  const cardRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(false);
  // The inversion layer exists only while needed: mounted at the end of the
  // page, faded in on the next frame, kept until its fade-out has finished
  const [invertOn, setInvertOn] = useState(false);
  const [invertShown, setInvertShown] = useState(false);
  useEffect(() => {
    if (atBottom) {
      setInvertOn(true);
      const r = requestAnimationFrame(() => setInvertShown(true));
      return () => cancelAnimationFrame(r);
    }
    setInvertShown(false);
    const t = window.setTimeout(() => setInvertOn(false), 300);
    return () => window.clearTimeout(t);
  }, [atBottom]);
  useEffect(() => {
    const onScroll = () => {
      const el = cardRef.current;
      // Only once the page is scrolled right to the end — the card fills the
      // screen, so its top edge is never seen changing colour
      // (40px of slack: smooth scrolling crawls over the last few pixels, and
      // waiting for the exact end made the switch feel late)
      if (el) setAtBottom(el.getBoundingClientRect().bottom <= window.innerHeight + 40);
    };
    onScroll();
    // Capture: inner pages scroll in their own container, not the window
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  const [tgMax, setTgMax] = useState(32);
  const [phone, setPhone]       = useState('');
  const [cv, setCv]             = useState('');
  const [activeTab, setActiveTab] = useState<'discuss' | 'join'>('discuss');
  const [activeFocus, setActiveFocus] = useState<'email' | 'telegram' | 'phone' | 'cv' | null>(null);

  // Phone keyboard: the form is the last thing on the page, so there's nothing
  // below it to scroll into — the keyboard would cover the field. While it's
  // open the card grows by the keyboard's height and the field is brought up
  // to the middle of what's left of the screen.
  const [kbPad, setKbPad] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!isMobile || !vv) return;
    const onVV = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      const next = activeFocus ? kb : 0;
      setKbPad(next);
      if (next > 0) {
        window.setTimeout(() => fieldsRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50);
      }
    };
    onVV();
    vv.addEventListener('resize', onVV);
    return () => vv.removeEventListener('resize', onVV);
  }, [isMobile, activeFocus]);

  const [emailError, setEmailError]       = useState(false);
  const [telegramError, setTelegramError] = useState(false);
  const [phoneError, setPhoneError]       = useState(false);
  const [cvError, setCvError]             = useState(false);
  const [status, setStatus]               = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [consentError, setConsentError]   = useState(false);

  const isValidEmail    = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  // The "@" lives in the input's own prefix circle, so the value never holds it
  const isValidTelegram = (v: string) => /^[a-zA-Z0-9_]{4,}$/.test(v.trim());
  const isValidPhone    = (v: string) => /^[\d\s\-\+\(\)]{7,}$/.test(v.trim());
  const isValidCv       = (v: string) => /^https?:\/\/.+\..+/.test(v.trim());

  const handleEmailSubmit = () => {
    if (!isValidEmail(email)) {
      setEmailError(true);
      window.setTimeout(() => setEmailError(false), 600);
      return;
    }
  };
  const handleTelegramSubmit = async () => {
    if (!isValidTelegram(telegram)) {
      setTelegramError(true);
      window.setTimeout(() => setTelegramError(false), 600);
      return;
    }
    if (!checked) {
      // Consent is required before sending anything.
      setConsentError(true);
      window.setTimeout(() => setConsentError(false), 1400);
      return;
    }
    if (status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch(import.meta.env.BASE_URL + 'lead.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: `@${telegram.trim()}`,
          tab: activeTab,
          form: variant,
          page: typeof window !== 'undefined' ? window.location.pathname : '',
          website: '', // honeypot — left empty by humans
        }),
      });
      const data = await res.json().catch(() => null);
      setStatus(res.ok && data && data.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  };
  const handlePhoneSubmit = () => {
    if (!isValidPhone(phone)) {
      setPhoneError(true);
      window.setTimeout(() => setPhoneError(false), 600);
      return;
    }
  };
  const handleCvSubmit = () => {
    if (!isValidCv(cv)) {
      setCvError(true);
      window.setTimeout(() => setCvError(false), 600);
      return;
    }
  };

  const wordRef     = useRef<HTMLSpanElement>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);
  const formAreaRef = useRef<HTMLDivElement>(null);

  const emailRelevant    = /^[^@]+@/.test(email);
  const phoneRelevant    = phone.trim().length > 2;
  const cvRelevant       = cv.trim().length > 3;

  const word =
    activeTab === 'join'
      ? (activeFocus === 'cv' ? 'ссылку' : 'CV')
      : (activeFocus === 'email'    ? 'почту' :
         activeFocus === 'telegram' ? 'телеграм' : 'контакт');

  // Word for consult variant's "Проконсультироваться" tab
  const consultWord =
    activeFocus === 'phone'    ? 'телефон' :
    activeFocus === 'telegram' ? 'телеграм' : 'контакт';

  const animatedWord = variant === 'consult' && activeTab === 'join' ? consultWord : word;
  useEffect(() => {
    if (!wordRef.current) return;
    gsap.fromTo(wordRef.current,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' },
    );
  }, [animatedWord]);

  useEffect(() => {
    const el = fieldsRef.current;
    if (!el) return;
    const measure = () => {
      const root = getComputedStyle(document.documentElement);
      const gap = parseFloat(root.getPropertyValue('--gap')) || 0;
      const pad = parseFloat(root.getPropertyValue('--pad')) || 0;
      // Field width: one column of three on desktop, the page width on a phone
      const width = isMobile ? window.innerWidth - 2 * pad : (el.clientWidth - 2 * gap) / 3;
      const size = isMobile ? Math.min(40, (window.innerWidth - 2 * pad) / 9.8) : 60;
      // The circles touch — no gap between them
      const perRow = Math.max(1, Math.floor(width / size));
      setTgMax(Math.max(1, Math.min(32, perRow * 3 - 3)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMobile]);

  const handleTelegramChange = (v: string) => {
    // Strip any "@" the visitor types — the prefix circle already shows one
    setTelegram(v.replace(/@/g, ''));
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    background: 'none', border: 'none', padding: '2px 0',
    textAlign: 'left', cursor: 'pointer',
    fontFamily: 'var(--font)', fontSize: 'var(--text-size)',
    fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
    lineHeight: 'var(--text-lh)', letterSpacing: 'var(--text-ls)',
    // Plain text, same two greys the cases tabs use — no underline, no glyph
    color: active ? 'var(--c-text)' : 'var(--c-text-muted)',
    transition: 'color 0.2s',
  });

  // Telegram's paper plane in the first circle, in place of an «@». Nudged
  // down-left: the circle's bottom padding is tuned for letters, and the
  // plane's weight sits up-right (same nudge as the footer icon).
  const telegramIcon = (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: '45%', height: '45%', display: 'block', transform: 'translate(-4%, 10%)' }}>
      <path d="M22 4 2.5 11.5l5.6 1.9 2.2 7 3.7-3.6 5.2 3.8L22 4Zm-5.3 4.6-8 7.2-2.5-.9 10.5-6.3Zm-6 9.2 1.2-3.6 6.4 4.7-3.4-1.5-4.2.4Z" fill="currentColor" />
    </svg>
  );


  return (
    <div ref={wrapRef} className={s.contactWrap}>

      {/* Sphere backdrop parked for now — plain white card */}
      <div
        ref={cardRef}
        className={s.contactCard}
        style={{ background: '#fff', justifyContent: 'center', paddingBottom: kbPad, transition: 'padding-bottom 0.2s ease' }}
      >
        {/* A bit of mischief: scrolled right to the end, the whole screen
            inverts — dark background, white type. One overlay flips the colours
            of everything under it (backdrop-filter), fading in and out. */}
        {/* Mounted only around the inversion itself: an always-present
            full-screen backdrop-filter layer (even at opacity 0) made iOS
            repaint every pinned element on each scroll frame — they shook */}
        {invertOn && createPortal(
          <div
            aria-hidden="true"
            style={{
              position: 'fixed', inset: 0, zIndex: 9990, pointerEvents: 'none',
              backdropFilter: 'invert(1)', WebkitBackdropFilter: 'invert(1)',
              opacity: atBottom && invertShown ? 1 : 0,
              transition: 'opacity 0.25s ease-out',
            }}
          />,
          document.body,
        )}
        {/* Form content — centered column */}
        <div ref={formAreaRef} className={s.contactFormArea} style={{ position: 'relative', zIndex: 1, background: 'transparent', flex: '0 0 auto', paddingTop: 20, paddingBottom: 20,
          // A touch above the middle of the screen: the card centres this
          // block, and the margin below lifts it by half its size
          // (phone: right in the middle — the top bar and the bottom menu
          // already take about the same room)
          marginBottom: isMobile ? 0 : 'var(--space-lg)' }}>

          {/* Tabs — centered, horizontal. Label of the 2nd tab + the side
              effects (grid + bunny game) depend on the form variant. */}
          {/* Two tabs — the second one behaves as it always did (resume input
              + grid/bunny side effects on the default variant). */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: 20, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            {([
              { key: 'discuss', label: 'Обсудить проект' },
              { key: 'join',    label: 'Сотрудничество' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                style={tabStyle(activeTab === tab.key)}
                onClick={() => {
                  setActiveTab(tab.key);
                  if (variant === 'default') onGridMode?.(tab.key === 'join');
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Heading with animated word — centered, 20px below tabs.
              On the consult variant + tab 2 the heading switches to
              "Оставьте контакт, запланируем консультацию". */}
          {variant === 'consult' && activeTab === 'join' ? (
            <p className={s.contactTitle} style={{ marginTop: 20, textAlign: 'center' }}>
              Оставьте{' '}
              <span ref={wordRef}>{consultWord}</span>
              {' '}— мы свяжемся с вами
            </p>
          ) : activeTab === 'join' ? (
            <p className={s.contactTitle} style={{ marginTop: 20, textAlign: 'center' }}>
              Отправьте CV<br />креативному директору
            </p>
          ) : (
            <p className={s.contactTitle} style={{ marginTop: 20, textAlign: 'center' }}>
              Оставьте{' '}
              <span ref={wordRef}>{word}</span>,<br />мы назначим встречу
            </p>
          )}

          {/* Input + consent travel together as one block, centred in the
              form rectangle — the consent reads as the input's own fine
              print instead of drifting down to the footer line */}
          <div style={{ marginTop: 'auto', marginBottom: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
          <div ref={fieldsRef} className={s.contactFields} style={{ width: '100%', marginTop: 64 }}>
            {status === 'sent' ? (
              <p className={s.contactTitle} style={{ textAlign: 'center', margin: 0 }}>
                Спасибо! Скоро напишем вам в Telegram.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', width: '100%' }}>
                {/* Desktop: one column of three wide — the circles wrap */}
                <div style={{ maxWidth: isMobile ? '100%' : 'calc((100% - 2 * var(--gap)) / 3)' }}>
                <CircleInput
                  prefix={telegramIcon} placeholder="телеграм" caretAtRest
                  // Phone: the "@" and 8 typed letters fill exactly one row —
                  // 9 circles plus 8 gaps of 0.1 circle = 9.8 diameters
                  size={isMobile ? 'min(40px, calc((100vw - 2 * var(--pad)) / 9.8))' : 60} maxLength={tgMax}
                  value={telegram} onChange={v => { handleTelegramChange(v); if (telegramError) setTelegramError(false); if (status === 'error') setStatus('idle'); }}
                  onFocus={() => setActiveFocus('telegram')}
                  onBlur={() => setActiveFocus(null)}
                  error={telegramError}
                  onSubmit={handleTelegramSubmit}
                  // Arrow circle right after the caret, once there's something to send
                  action={activeFocus === 'telegram' && telegram.length > 1 ? (
                    <button
                      className={s.submitCircle}
                      aria-label="Отправить"
                      onMouseDown={e => e.preventDefault()}
                      onClick={handleTelegramSubmit}
                      disabled={status === 'sending'}
                    >{status === 'sending' ? '···' : (
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <path d="M1 5h10M6 1l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}</button>
                  ) : undefined}
                />
                </div>
                {status === 'error' && (
                  <p style={{ margin: 0, fontFamily: 'var(--font)', fontSize: 'var(--text-size)', lineHeight: 'var(--text-lh)', color: '#c0392b', textAlign: 'center' }}>
                    Не отправилось. Попробуйте ещё раз или напишите в{' '}
                    <a href="https://t.me/skpdsgn" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>Telegram</a>.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Consent — a narrow block right under the input; the box sits
              centred on the first line of text, not hanging above it */}
          <div
            className={s.contactCheckbox}
            style={isMobile
              // Phone: a compact block centred under the field, the text wrapping
              // on its own left edge next to the box
              ? { gap: 10, justifyContent: 'center', alignItems: 'flex-start', maxWidth: 300, marginLeft: 'auto', marginRight: 'auto', boxSizing: 'border-box' }
              : { gap: 10, justifyContent: 'center', alignItems: 'flex-start' }}
            onClick={() => setChecked(!checked)}
          >
            <div className={`${s.checkbox} ${checked ? s.checked : ''}`} style={{ marginTop: 'calc((var(--text-size) * var(--text-lh) - 16px) / 2)', ...(consentError ? { outline: '1.5px solid #c0392b', outlineOffset: 2 } : {}) }}>
              {checked && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className={s.checkboxLabel} style={{ textAlign: 'left' }}>
              Даю согласие на обработку персональных данных{isMobile ? ' ' : <br />}в&nbsp;соответствии с&nbsp;
              <button
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', letterSpacing: 'inherit', lineHeight: 'inherit', color: 'inherit', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}
                onClick={e => { e.stopPropagation(); onNavigatePolicy?.(); }}
              >Политикой конфиденциальности</button>
            </span>
          </div>
          </div>
        </div>
      </div>

      {/* Phone: time and social as the page's last line */}
      <MobileFooter />
    </div>
  );
}
