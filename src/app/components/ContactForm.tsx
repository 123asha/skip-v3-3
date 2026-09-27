import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import CircleInput from './CircleInput';
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
  const [activeFocus, setActiveFocus] = useState<'email' | 'telegram' | 'phone' | 'cv' | null>(null);
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

  const arrowSvg = (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
      <path d="M1 5h10M6 1l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div ref={wrapRef} className={s.contactWrap}>

      <div className={s.contactCard}>
        {/* Form content — centered column */}
        <div ref={formAreaRef} className={s.contactFormArea}>

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
          <div className={s.contactFields} style={{ width: '100%' }}>
            {status === 'sent' ? (
              <p className={s.contactTitle} style={{ textAlign: 'center', margin: 0 }}>
                Спасибо! Скоро напишем вам в Telegram.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', width: '100%' }}>
                <CircleInput
                  prefix="@" placeholder="телеграм" size={isMobile ? 44 : 76} maxLength={32}
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

          {/* Consent — a narrow block right under the input; the box sits
              centred on the first line of text, not hanging above it */}
          <div
            className={s.contactCheckbox}
            style={isMobile
              ? { gap: 10, justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%', boxSizing: 'border-box' }
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

    </div>
  );
}
