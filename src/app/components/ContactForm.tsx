import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import CircleInput from './CircleInput';
import { FormSnakeGame } from './FormGames';
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
  const [phone, setPhone]       = useState('');
  const [cv, setCv]             = useState('');
  const [activeTab, setActiveTab] = useState<'discuss' | 'join'>('discuss');
  const [gameIndex, setGameIndex] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [activeFocus, setActiveFocus] = useState<'email' | 'telegram' | 'phone' | 'cv' | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [emailError, setEmailError]       = useState(false);
  const [telegramError, setTelegramError] = useState(false);
  const [phoneError, setPhoneError]       = useState(false);
  const [cvError, setCvError]             = useState(false);
  const [status, setStatus]               = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [consentError, setConsentError]   = useState(false);

  const isValidEmail    = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const isValidTelegram = (v: string) => /^@[a-zA-Z0-9_]{4,}$/.test(v.trim());
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
          contact: telegram.trim(),
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
  const cardRef     = useRef<HTMLDivElement>(null);
  const formAreaRef = useRef<HTMLDivElement>(null);

  // Start game when form scrolls into view
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setGameActive(true); obs.disconnect(); } },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Desktop: snap the form to a multiple of the dot-grid cell (56px) and shift
  // the background dots so the form's four corners land exactly on dots.
  useEffect(() => {
    if (isMobile) return;
    const wrap = wrapRef.current, card = cardRef.current;
    if (!wrap || !card) return;
    const CELL = 56;
    const align = () => {
      card.style.width = '';
      card.style.height = '';
      const base = card.getBoundingClientRect().width;
      if (!base) return;
      const snapped = Math.round(base / CELL) * CELL;
      card.style.width = `${snapped}px`;
      card.style.height = `${snapped}px`;
      const wr = wrap.getBoundingClientRect();
      const cr = card.getBoundingClientRect();
      const cornerX = cr.left - wr.left;
      const cornerY = cr.top - wr.top;
      // Dot sits at each tile's centre (CELL/2): put one on the form's corner.
      const bx = (((cornerX - CELL / 2) % CELL) + CELL) % CELL;
      const by = (((cornerY - CELL / 2) % CELL) + CELL) % CELL;
      wrap.style.backgroundPosition = `${bx}px ${by}px`;
    };
    align();
    window.addEventListener('resize', align, { passive: true });
    return () => window.removeEventListener('resize', align);
  }, [isMobile]);

  const emailRelevant    = /^[^@]+@/.test(email);
  const telegramRelevant = telegram.length > 1;
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

  const handleTelegramChange = (v: string) => {
    if (!v) { setTelegram(''); return; }
    setTelegram(v.startsWith('@') ? v : '@' + v);
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    background: 'none', border: 'none', padding: '2px 0',
    textAlign: 'left', cursor: 'pointer',
    fontFamily: 'var(--font)', fontSize: 'var(--text-size)',
    fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
    lineHeight: 'var(--text-lh)', letterSpacing: 'var(--text-ls)',
    color: active ? 'var(--c-text)' : 'rgba(35,31,32,0.35)',
    textDecoration: 'underline',
    textDecorationStyle: 'dotted',
    textUnderlineOffset: '3px',
    transition: 'color 0.2s',
  });

  const arrowSvg = (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
      <path d="M1 5h10M6 1l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div ref={wrapRef} className={s.contactWrap}>

      {/* Game canvas — full-bleed background of the wrap, navigates around the form.
          Hidden on mobile (touch UX + perf — the snake is a desktop hover delight). */}
      {!isMobile && (
        <div className={s.contactGameBg}>
          {gameFinished ? null : (
            <FormSnakeGame key={gameKey} active={gameActive} formRef={formAreaRef} onFinish={() => setGameFinished(true)} />
          )}
        </div>
      )}

      <div ref={cardRef} className={s.contactCard}>
        {/* Form content — centered column on top of the snake background. When the
            user finishes a game, the done overlay replaces the form. */}
        <div ref={formAreaRef} className={s.contactFormArea}>
          {gameFinished ? (
            <div className={s.contactGameDone}>
              <p>Круто что вы доиграли.<br />Давайте обсудим проект?</p>
              <a href="https://t.me/skipdesign" target="_blank" rel="noopener noreferrer">Написать в Telegram</a>
              <button onClick={() => { setGameFinished(false); setGameKey(k => k + 1); }}>играть снова</button>
            </div>
          ) : (
          <>

          {/* Tabs — centered, horizontal. Label of the 2nd tab + the side
              effects (grid + bunny game) depend on the form variant. */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: 20, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            {([
              { key: 'discuss', label: 'Обсудить проект' },
              { key: 'join',    label: variant === 'consult' ? 'Проконсультироваться' : 'Стать частью команды' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                style={tabStyle(activeTab === tab.key)}
                onClick={() => {
                  setActiveTab(tab.key);
                  // Grid + bunny game only on the "join us" tab of the default
                  // variant. The consult variant keeps the form clean on tab 2.
                  if (variant === 'default') onGridMode?.(tab.key === 'join');
                }}
              >
                {tab.label}{activeTab === tab.key ? ' ↵' : ''}
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
              Отправьте CV арт-директору
            </p>
          ) : (
            <p className={s.contactTitle} style={{ marginTop: 20, textAlign: 'center' }}>
              Оставьте{' '}
              <span ref={wordRef}>{word}</span>,<br />мы назначим встречу
            </p>
          )}

          {/* Inputs — Telegram only, centred in the form rectangle */}
          <div className={s.contactFields} style={{ marginTop: 'auto', marginBottom: 'auto', width: '100%' }}>
            {status === 'sent' ? (
              <p className={s.contactTitle} style={{ textAlign: 'center', margin: 0 }}>
                Спасибо! Скоро напишем вам в Telegram.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', width: '100%' }}>
                <CircleInput
                  placeholder="@ТЕЛЕГРАМ" size={38} maxLength={32}
                  value={telegram} onChange={v => { handleTelegramChange(v); if (telegramError) setTelegramError(false); if (status === 'error') setStatus('idle'); }}
                  onFocus={() => setActiveFocus('telegram')}
                  onBlur={() => setActiveFocus(null)}
                  error={telegramError}
                  action={activeFocus === 'telegram' && telegramRelevant ? (
                    <button
                      className={s.submitCircle}
                      onMouseDown={e => e.preventDefault()}
                      onClick={handleTelegramSubmit}
                      disabled={status === 'sending'}
                    >{status === 'sending' ? '···' : arrowSvg}</button>
                  ) : undefined}
                />
                {status === 'error' && (
                  <p style={{ margin: 0, fontFamily: 'var(--font)', fontSize: 'var(--text-size)', lineHeight: 'var(--text-lh)', color: '#c0392b', textAlign: 'center' }}>
                    Не отправилось. Попробуйте ещё раз или напишите в{' '}
                    <a href="https://t.me/skpdsgn" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>Telegram</a>.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Checkbox — block is centred, but the text inside is left-aligned */}
          <div
            className={s.contactCheckbox}
            style={isMobile
              ? { marginTop: 40, gap: 10, justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%', boxSizing: 'border-box' }
              : { marginTop: 40, gap: 10, justifyContent: 'center', alignItems: 'flex-start', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}
            onClick={() => setChecked(!checked)}
          >
            <div className={`${s.checkbox} ${checked ? s.checked : ''}`} style={{ marginTop: 2, ...(consentError ? { outline: '1.5px solid #c0392b', outlineOffset: 2 } : {}) }}>
              {checked && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className={s.checkboxLabel} style={{ textAlign: 'left' }}>
              Даю согласие на обработку персональных данных в соответствии с&nbsp;
              <button
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', letterSpacing: 'inherit', lineHeight: 'inherit', color: 'inherit', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}
                onClick={e => { e.stopPropagation(); onNavigatePolicy?.(); }}
              >Политикой конфиденциальности</button>
            </span>
          </div>

          </>
          )}
        </div>
      </div>

    </div>
  );
}
