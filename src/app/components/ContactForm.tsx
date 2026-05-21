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
    // TODO: real submit logic
  };
  const handleTelegramSubmit = () => {
    if (!isValidTelegram(telegram)) {
      setTelegramError(true);
      window.setTimeout(() => setTelegramError(false), 600);
      return;
    }
    // TODO: real submit logic
  };
  const wordRef  = useRef<HTMLSpanElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);

  // Start games only when form scrolls into view
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

  // Animate word when it changes
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

        {/* Background snake — covers the whole card, behind the centered form content */}
        <div className={s.contactGameBg}>
          {gameFinished ? null : (
            gameIndex === 0
              ? <FormSnakeGame    key={gameKey} active={gameActive} onFinish={() => setGameFinished(true)} />
              : <FormBreakoutGame key={gameKey} active={gameActive} onFinish={() => setGameFinished(true)} />
          )}
        </div>

        {/* Skip control + game-done message stay top-right */}
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

        {/* Centered content stack — all form items, center-aligned, opaque so they cover the snake behind */}
        <div className={s.contactCenter}>

          {/* Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'center' }}>
            {([
              { key: 'discuss', label: 'Обсудить проект' },
              { key: 'join',    label: 'Стать частью команды' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                style={{ ...tabStyle(activeTab === tab.key), textAlign: 'center' }}
                onClick={() => { setActiveTab(tab.key); onGridMode?.(tab.key === 'join'); }}
              >
                {tab.label}{activeTab === tab.key ? ' ↵' : ''}
              </button>
            ))}
          </div>

          {/* Heading with animated word — 40px below the tabs */}
          <p className={s.contactTitle} style={{ marginTop: 40, textAlign: 'center' }}>
            Оставьте{' '}
            <span ref={wordRef}>{word}</span>,<br />мы назначим встречу
          </p>

          {/* Subtitle — 10px below the heading */}
          <p className={s.contactFormHeader} style={{ marginTop: 10, textAlign: 'center' }}>
            Напишем в течение дня с 11:00 до 20:00
          </p>

          {/* Inputs — 40px below the subtitle */}
          <div className={s.contactFields} style={{ marginTop: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>

              {/* Email — disabled when telegram is focused */}
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

              {/* Telegram — disabled when email is focused */}
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

          {/* Checkbox — block is centered on the page, ~1 column wide, text left-aligned */}
          <div
            className={s.contactCheckbox}
            style={{
              marginTop: 40,
              gap: 6,
              width: 'calc((100vw - 2 * var(--pad) - 4 * var(--gap)) / 5)',
              maxWidth: '100%',
              alignSelf: 'center',
            }}
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

      </div>
    </div>
  );
}
