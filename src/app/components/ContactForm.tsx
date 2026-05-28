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
  const handleTelegramSubmit = () => {
    if (!isValidTelegram(telegram)) {
      setTelegramError(true);
      window.setTimeout(() => setTelegramError(false), 600);
      return;
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

      <div className={s.contactCard}>
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
              <span ref={wordRef}>{consultWord}</span>,<br />
              чтобы проконсультироваться — мы свяжемся с вами
            </p>
          ) : activeTab === 'join' ? (
            <p className={s.contactTitle} style={{ marginTop: 20, textAlign: 'center' }}>
              Отправьте CV арт-диру
            </p>
          ) : (
            <p className={s.contactTitle} style={{ marginTop: 20, textAlign: 'center' }}>
              Оставьте{' '}
              <span ref={wordRef}>{word}</span>,<br />мы назначим встречу
            </p>
          )}

          {/* Inputs — pushed to the centre of the form rectangle */}
          <div className={s.contactFields} style={{ marginTop: 'auto', marginBottom: 'auto', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', width: '100%' }}>

              {variant === 'consult' ? (
                /* Consult variant:
                   - "Обсудить проект" tab → Telegram only
                   - "Проконсультироваться" tab → Телефон + Телеграм */
                activeTab === 'join' ? (
                  <>
                    {activeFocus !== 'telegram' && (
                      <CircleInput
                        placeholder="ТЕЛЕФОН" size={44}
                        value={phone} onChange={v => { setPhone(v); if (phoneError) setPhoneError(false); }}
                        onFocus={() => setActiveFocus('phone')}
                        onBlur={() => setActiveFocus(null)}
                        error={phoneError}
                        action={activeFocus === 'phone' && phoneRelevant ? (
                          <button
                            className={s.submitCircle}
                            onMouseDown={e => e.preventDefault()}
                            onClick={handlePhoneSubmit}
                          >{arrowSvg}</button>
                        ) : undefined}
                      />
                    )}
                    {activeFocus !== 'phone' && (
                      <CircleInput
                        placeholder="@ТЕЛЕГРАМ" size={44}
                        value={telegram} onChange={v => { handleTelegramChange(v); if (telegramError) setTelegramError(false); }}
                        onFocus={() => setActiveFocus('telegram')}
                        onBlur={() => setActiveFocus(null)}
                        error={telegramError}
                        action={activeFocus === 'telegram' && telegramRelevant ? (
                          <button
                            className={s.submitCircle}
                            onMouseDown={e => e.preventDefault()}
                            onClick={handleTelegramSubmit}
                          >{arrowSvg}</button>
                        ) : undefined}
                      />
                    )}
                  </>
                ) : (
                  <CircleInput
                    placeholder="@ТЕЛЕГРАМ" size={44}
                    value={telegram} onChange={v => { handleTelegramChange(v); if (telegramError) setTelegramError(false); }}
                    onFocus={() => setActiveFocus('telegram')}
                    onBlur={() => setActiveFocus(null)}
                    error={telegramError}
                    action={activeFocus === 'telegram' && telegramRelevant ? (
                      <button
                        className={s.submitCircle}
                        onMouseDown={e => e.preventDefault()}
                        onClick={handleTelegramSubmit}
                      >{arrowSvg}</button>
                    ) : undefined}
                  />
                )
              ) : activeTab === 'discuss' ? (
                <>
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
                </>
              ) : (
                <CircleInput
                  placeholder="РЕЗЮМЕ" size={44}
                  value={cv} onChange={v => { setCv(v); if (cvError) setCvError(false); }}
                  onFocus={() => setActiveFocus('cv')}
                  onBlur={() => setActiveFocus(null)}
                  error={cvError}
                  action={activeFocus === 'cv' && cvRelevant ? (
                    <button
                      className={s.submitCircle}
                      onMouseDown={e => e.preventDefault()}
                      onClick={handleCvSubmit}
                    >{arrowSvg}</button>
                  ) : undefined}
                />
              )}

            </div>
          </div>

          {/* Checkbox — block is centred, but the text inside is left-aligned */}
          <div
            className={s.contactCheckbox}
            style={{ marginTop: 40, gap: 10, justifyContent: 'center', alignItems: 'flex-start', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}
            onClick={() => setChecked(!checked)}
          >
            <div className={`${s.checkbox} ${checked ? s.checked : ''}`} style={{ marginTop: 2 }}>
              {checked && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className={s.checkboxLabel} style={{ textAlign: 'left' }}>
              Даю согласие на обработку персональных данных<br />в соответствии с&nbsp;
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
