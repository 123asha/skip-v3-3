import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import CircleInput from './CircleInput';
import { FormSnakeGame, FormBreakoutGame } from './FormGames';
import s from '../App.module.css';

interface ContactFormProps {
  onNavigatePolicy?: () => void;
  onGridMode?: (on: boolean) => void;
}

export default function ContactForm({ onNavigatePolicy, onGridMode }: ContactFormProps) {
  const [checked, setChecked]   = useState(false);
  const [email, setEmail]       = useState('');
  const [telegram, setTelegram] = useState('');
  const [activeTab, setActiveTab] = useState<'discuss' | 'join'>('discuss');
  const [gameIndex, setGameIndex] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [activeFocus, setActiveFocus] = useState<'email' | 'telegram' | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [emailError, setEmailError]       = useState(false);
  const [telegramError, setTelegramError] = useState(false);

  const isValidEmail    = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const isValidTelegram = (v: string) => /^@[a-zA-Z0-9_]{4,}$/.test(v.trim());

  const handleEmailSubmit = () => {
    if (!isValidEmail(email)) {
      setEmailError(true);
      window.setTimeout(() => setEmailError(false), 600);
      return;
    }
  };
  const handleTelegramSubmit = () => {
    if (!isValidTelegram(telegram)) {
      setTelegramError(true);
      window.setTimeout(() => setTelegramError(false), 600);
      return;
    }
  };

  const wordRef     = useRef<HTMLSpanElement>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);
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

  const emailRelevant    = /^[^@]+@/.test(email);
  const telegramRelevant = telegram.length > 1;

  const word =
    activeFocus === 'email'    ? 'почту' :
    activeFocus === 'telegram' ? 'телеграм' : 'контакт';

  useEffect(() => {
    if (!wordRef.current) return;
    gsap.fromTo(wordRef.current,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' },
    );
  }, [word]);

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
      <div className={s.contactCard}>

        {/* Form content — top of card, stacks vertically */}
        <div ref={formAreaRef} className={s.contactFormArea}>

          {/* Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'flex-start' }}>
            {([
              { key: 'discuss', label: 'Обсудить проект' },
              { key: 'join',    label: 'Стать частью команды' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                style={tabStyle(activeTab === tab.key)}
                onClick={() => { setActiveTab(tab.key); onGridMode?.(tab.key === 'join'); }}
              >
                {tab.label}{activeTab === tab.key ? ' ↵' : ''}
              </button>
            ))}
          </div>

          {/* Heading with animated word */}
          <p className={s.contactTitle} style={{ marginTop: 40 }}>
            Оставьте{' '}
            <span ref={wordRef}>{word}</span>,<br />мы назначим встречу
          </p>

          {/* Subtitle */}
          <p className={s.contactFormHeader} style={{ marginTop: 10 }}>
            Напишем в течение дня с 11:00 до 20:00
          </p>

          {/* Inputs */}
          <div className={s.contactFields} style={{ marginTop: 20, width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'flex-start', width: '100%' }}>

              <CircleInput
                placeholder="EMAIL" size={44}
                value={email} onChange={v => { setEmail(v); if (emailError) setEmailError(false); }}
                onFocus={() => setActiveFocus('email')}
                onBlur={() => setActiveFocus(null)}
                disabled={activeFocus === 'telegram'}
                error={emailError}
                action={activeFocus === 'email' && emailRelevant ? (
                  <button
                    className={s.submitCircle}
                    onMouseDown={e => e.preventDefault()}
                    onClick={handleEmailSubmit}
                  >{arrowSvg}</button>
                ) : undefined}
              />

              <CircleInput
                placeholder="@ТЕЛЕГРАМ" size={44}
                value={telegram} onChange={v => { handleTelegramChange(v); if (telegramError) setTelegramError(false); }}
                onFocus={() => setActiveFocus('telegram')}
                onBlur={() => setActiveFocus(null)}
                disabled={activeFocus === 'email'}
                error={telegramError}
                action={activeFocus === 'telegram' && telegramRelevant ? (
                  <button
                    className={s.submitCircle}
                    onMouseDown={e => e.preventDefault()}
                    onClick={handleTelegramSubmit}
                  >{arrowSvg}</button>
                ) : undefined}
              />

            </div>
          </div>

          {/* Checkbox */}
          <div
            className={s.contactCheckbox}
            style={{ marginTop: 40, gap: 6, width: '100%' }}
            onClick={() => setChecked(!checked)}
          >
            <div className={`${s.checkbox} ${checked ? s.checked : ''}`}>
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

        </div>

        {/* Snake/Breakout canvas — sits below the form */}
        <div className={s.contactGameBg}>
          {gameFinished ? null : (
            gameIndex === 0
              ? <FormSnakeGame    key={gameKey} active={gameActive} onFinish={() => setGameFinished(true)} />
              : <FormBreakoutGame key={gameKey} active={gameActive} onFinish={() => setGameFinished(true)} />
          )}
        </div>

        {/* Skip/done controls — top-right of card */}
        <div className={s.contactGameControls}>
          {gameFinished ? (
            <div className={s.contactGameDone}>
              <p>Круто что вы доиграли.<br />Давайте обсудим проект?</p>
              <a href="https://t.me/skipdesign" target="_blank" rel="noopener noreferrer">Написать в Telegram</a>
              <button onClick={() => { setGameFinished(false); setGameKey(k => k + 1); }}>играть снова</button>
            </div>
          ) : (
            <button className={s.contactSkip} onClick={() => { setGameIndex(i => (i + 1) % 2); setGameKey(k => k + 1); }}>skip</button>
          )}
        </div>

      </div>
    </div>
  );
}
