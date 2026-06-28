import { useEffect, useRef, useState } from 'react';
import { useMobile } from '../hooks/useMobile';
import s from './CasesPage.module.css';
import app from '../App.module.css';
import { TEXT_STYLE as textStyle, H2_STYLE as h2Style } from '../utils/typography';
import ContactForm from './ContactForm';
import { CASE_AR_H, CASE_AR_V } from './CaseCard';
import LinkFlip from './LinkFlip';
import { sound } from '../sound/Sound';
import { asset } from '../utils/asset';

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--heading-size)',
  fontWeight: 'var(--heading-weight)' as React.CSSProperties['fontWeight'],
  lineHeight: 'var(--heading-lh)',
  letterSpacing: 'var(--heading-ls)',
  color: 'var(--c-text)',
};

const TEAM: { name: string; role: string }[] = [
  { name: 'Аша Саакян',       role: 'арт-директор' },
  { name: 'Рузана Пшигонова', role: 'дизайнер' },
  { name: 'Кирилл Жуков',     role: 'разработчик' },
  { name: 'Елена Новикова',   role: 'стратег' },
];

// ── Image (real src) or grey placeholder. A .mp4/.webm src plays as a muted
//    looping video (used for converted GIFs). ──────────────────────────────────
function Img({ ar, src, style }: { ar: string; src?: string; style?: React.CSSProperties }) {
  const isVideo = !!src && /\.(mp4|webm)$/i.test(src);
  const fill: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
  return (
    <div style={{ aspectRatio: ar, background: 'var(--c-surface)', width: '100%', overflow: 'hidden', ...style }}>
      {src && (isVideo
        ? <video src={src} autoPlay muted loop playsInline style={fill} />
        : <img src={src} alt="" loading="lazy" style={fill} />)}
    </div>
  );
}

// ── Meta / caption row ───────────────────────────────────────────────────────
// 5-col grid on the page's normal grid. The number sits at viewport centre+4px,
// the description in columns 4–5. On mobile: number centred, text 4px below it
// with marginLeft = 1/3 viewport.
function MetaRow({
  col1, col2, num, text,
}: { col1?: string; col2?: string; num?: string; text: string }) {
  const mob = useMobile();
  if (mob) {
    return (
      <div style={{ position: 'relative', marginLeft: 'calc(var(--pad) - 4px)', marginRight: 'calc(var(--pad) - 4px)' }}>
        {/* col1 + col2 stacked in the first column (left) */}
        {(col1 || col2) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 }}>
            {col1 && <p style={{ ...textStyle, margin: 0 }}>{col1}</p>}
            {col2 && <p style={{ ...textStyle, margin: 0 }}>{col2}</p>}
          </div>
        )}
        {/* number — left edge at 1/3 vw */}
        {num && <p style={{ ...textStyle, opacity: 'var(--opacity-muted)', margin: 0, marginLeft: 'calc(33.333vw - var(--pad) + 4px)' }}>{num}</p>}
        {/* text — 4px below, same left edge */}
        <p style={{ ...textStyle, margin: 0, marginTop: num ? 4 : 0, marginLeft: 'calc(33.333vw - var(--pad) + 4px)', whiteSpace: 'pre-line' }}>{text}</p>
      </div>
    );
  }
  return (
    <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--gap)', alignItems: 'start', marginLeft: 'calc(var(--pad) - 4px)', marginRight: 'calc(var(--pad) - 4px)' }}>
      {col1 && <p style={{ ...textStyle, gridColumn: '1', margin: 0 }}>{col1}</p>}
      {col2 && <p style={{ ...textStyle, gridColumn: '2', margin: 0 }}>{col2}</p>}
      {num && ((col1 || col2)
        ? <p style={{ ...textStyle, opacity: 'var(--opacity-muted)', position: 'absolute', left: '50%', top: 0, margin: 0, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>{num}</p>
        : <p style={{ ...textStyle, opacity: 'var(--opacity-muted)', position: 'absolute', left: 'calc(50% + 4px)', top: 0, margin: 0, whiteSpace: 'nowrap' }}>{num}</p>)}
      <p style={{ ...textStyle, gridColumn: '4 / 6', margin: 0, maxWidth: 400, whiteSpace: 'pre-line' }}>{text}</p>
    </div>
  );
}

// Caption under a full-width image — number in column 3, text from column 4,
// sitting 10px below its image.
function Caption({ num, text }: { num?: string; text: string }) {
  return <div style={{ marginTop: 10 }}><MetaRow num={num} text={text} /></div>;
}

// Caption that lives INSIDE the right (horizontal) column of a mixed block —
// number at the column's left edge (≈ the page middle), text indented to ~col 4.
// 10px below its image; the taller left image just extends past it.
function RightCaption({ num, text }: { num?: string; text: string }) {
  // On mobile — same layout as Caption/MetaRow: number then text stacked,
  // both at 1/3 vw left edge, 4px apart.
  const mob = useMobile();
  if (mob) {
    return (
      <div style={{ marginTop: 10 }}>
        {num && <p style={{ ...textStyle, opacity: 'var(--opacity-muted)', margin: 0, marginLeft: 'calc(33.333vw - var(--pad) + 4px)' }}>{num}</p>}
        <p style={{ ...textStyle, margin: 0, marginTop: num ? 4 : 0, marginLeft: 'calc(33.333vw - var(--pad) + 4px)', whiteSpace: 'pre-line' }}>{text}</p>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 4fr', gap: 0 }}>
      {num ? <p style={{ ...textStyle, opacity: 'var(--opacity-muted)', margin: 0 }}>{num}</p> : <div />}
      <p style={{ ...textStyle, margin: 0, maxWidth: 400, whiteSpace: 'pre-line' }}>{text}</p>
    </div>
  );
}

// Block wrapper — spacing to the NEXT block: 20px normally, +32px (= 52px) when
// the block ends with a caption.
function Block({ caption, children }: { caption?: boolean; children: React.ReactNode }) {
  return <div style={{ marginBottom: caption ? 52 : 4 }}>{children}</div>;
}

// Case-page grid is its own: 4px column gutters + 4px side margins (header /
// footer keep the global --pad; this only governs the case blocks).
const GAP = '4px';
const SIDE = '4px';

// ── Per-case data ────────────────────────────────────────────────────────────
// Everything that differs between cases lives here. The `blocks` array drives
// the body layout — image placeholders for now until real assets land.
export type CaseBlock =
  // one image (full width / single column); optional caption below it
  | { kind: 'single'; ar: 'h' | 'v'; caption?: string; src?: string }
  // two images side by side; optional caption (and extra text-only paragraph)
  // sit under the RIGHT image, filling the space beside the taller left image
  | { kind: 'duo'; left: 'h' | 'v'; right: 'h' | 'v'; caption?: string; belowText?: string; leftSrc?: string; rightSrc?: string }
  // text-only block (no image) — paragraph at column 4, no number
  | { kind: 'text'; text: string };

export interface CaseData {
  title: string;     // cover heading
  year: string;      // intro meta number (shown instead of "00/")
  type: string;      // meta col 1 — kind of work
  industry: string;  // meta col 2
  intro: string;     // meta description text
  coverVideo?: string; // if set, the cover plays this video instead of a flat colour
  blocks: CaseBlock[];
  team: { name: string; role: string }[];
  testimonial?: { quote: string; name: string; phrase: string }; // omit to hide
}

const DEFAULT_TESTIMONIAL = {
  quote: '«Здесь будет отзыв клиента о работе команды над проектом — пара предложений о результате.»',
  name: 'Имя Фамилия, должность',
  phrase: 'Одна фраза о сотрудничестве.',
};

const CAP = 'Подпись к блоку — короткое описание решения.';

const GATE_LEGAL: CaseData = {
  title: 'Gate Legal',
  year: '2026',
  type: 'Стратегия, айдентика',
  industry: 'Финтех',
  intro: 'Краткое описание проекта и ключевых задач. Что было сделано, каких результатов достигли.',
  blocks: [
    { kind: 'single', ar: 'h' },
    { kind: 'single', ar: 'h', caption: 'Подпись к горизонтальной картинке — короткое описание решения.' },
    { kind: 'duo', left: 'v', right: 'v' },
    { kind: 'duo', left: 'v', right: 'v', caption: 'Подпись ко второй вертикальной картинке.' },
    { kind: 'duo', left: 'h', right: 'v' },
    { kind: 'duo', left: 'v', right: 'h' },
    { kind: 'duo', left: 'v', right: 'h', caption: 'Подпись под горизонтальной картинкой.' },
  ],
  team: TEAM,
  testimonial: DEFAULT_TESTIMONIAL,
};

// Senior*s images live in public/cases/seniors/ (1.webp … 12.webp).
const si = (n: number) => asset(`/cases/seniors/${n}.webp`);

const SEN_CAPS = {
  c00:   'Баров в Тбилиси десятки, и каждый сезон закрываются старые и открываются новые, а конкуренция за гостей — огромная. Хорошие напитки и классная атмосфера — база, этим невозможно выделиться.\n\nЕщё одна проблема — название. Senior’s читается как бар для сеньоров — для пенсионеров или только для разработчиков. Реальная аудитория бара шире, но название сужает и может отпугнуть людей из креативных индустрий.',
  below: 'Боль аудитории не в том, что некуда пойти в пятницу вечером. Боль — одиночество, изоляция и потеря старых социальных связей после переезда. Это меняет задачу: искать точку отстройки не через меню и атмосферу, а через отношения.\n\nСуть бренда — бар своей среды. Это коммьюнити-бар, в котором экспаты находят своих. Место, где случайный разговор может стать началом дружбы. Митапы, диджей-сеты, нетворкинг, ивенты — то, из-за чего хочется зайти в бар в любой день.',
  c01:   'Ключевой образ бренда — звезда и её путеводный свет — заметный ориентир, к которому хочется вернуться.',
  c02:   'Буква S и лучевая композиция построены на одной оси: лучи задают ритм, а S движется вместе с ними. Так возникает естественная связь между образом света и знаком бренда.',
  c03:   'В фонах используется тот же лучевой ритм: это и маяк, и центр притяжения, вокруг которого выстраиваются все элементы. Световые лучи могут быть длиннее или короче, задавая нужные темп и настроение.',
  c04:   'Айдентика превращает ключевую идею бренда в цельную и современную визуальную систему: в основе каждого элемента — точка света, с которой всё начинается.',
  c05:   'Система живая, тёплая и динамичная. С ней Senior*s ещё отчётливее звучит как место своего света, оставаясь визуально понятным и эмоционально близким своему сообществу.',
};

export const SENIORS_BAR: CaseData = {
  title: 'Senior*s Bar',
  year: '2025',
  type: 'Брендинг: платформа бренда, фирменный стиль',
  industry: 'ХоРеКа',
  intro: 'Бар своей среды. Визуальный язык для офлайна и онлайна.',
  coverVideo: asset('/seniors.mp4'),
  blocks: [
    { kind: 'text', text: SEN_CAPS.c00 },                                          // standalone text after hero — "Баров в Тбилиси…"
    { kind: 'duo', left: 'v', right: 'h', caption: SEN_CAPS.below, leftSrc: si(1), rightSrc: si(2) }, // 00/  1+2 — "Боль аудитории…"
    { kind: 'single', ar: 'h', caption: SEN_CAPS.c01, src: asset('/cases/seniors/3.mp4') }, // 01/  3 (gif→mp4)
    { kind: 'single', ar: 'h', caption: SEN_CAPS.c02, src: si(4) },                // 02/  4
    { kind: 'duo', left: 'v', right: 'h', leftSrc: si(5), rightSrc: si(6) },        // —    5+6
    { kind: 'single', ar: 'h', caption: SEN_CAPS.c03, src: si(7) },                // 03/  7
    { kind: 'single', ar: 'h', caption: SEN_CAPS.c04, src: si(8) },                // 04/  8
    { kind: 'duo', left: 'v', right: 'v', leftSrc: si(9), rightSrc: si(10) },       // —    9+10 (two vertical)
    { kind: 'single', ar: 'h', caption: SEN_CAPS.c05, src: si(12) },               // 05/  12 (swapped)
    { kind: 'single', ar: 'h', src: si(11) },                                      // 11 — no caption (swapped)
    { kind: 'single', ar: 'h', src: si(13) },                                      // 13 — no caption
  ],
  team: TEAM,
  // testimonial omitted — not shown on the Senior*s page.
};

export default function CaseTemplatePage({ onNavigatePolicy, onGridMode, data = GATE_LEGAL }: { onNavigatePolicy?: () => void; onGridMode?: (on: boolean) => void; data?: CaseData }) {
  const pageRef = useRef<HTMLDivElement>(null);
  const coverVidRef = useRef<HTMLVideoElement>(null);
  const [hoveredTeam, setHoveredTeam] = useState<number | null>(null);
  const [formInView, setFormInView] = useState(false);
  const isMobile = useMobile();

  // Smart numbering — each block that shows a description/caption gets the next
  // number (00/, 01/, 02/ …) in render order. Resets every render.
  let numCounter = 0;
  const nextNum = () => `${String(numCounter++).padStart(2, '0')}/`;

  useEffect(() => {
    const mainLenis = (window as any).__lenis;
    if (mainLenis) mainLenis.stop();
    const el = pageRef.current!;
    const stopBubble = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener('wheel', stopBubble, { passive: true });
    return () => {
      el.removeEventListener('wheel', stopBubble);
      if (mainLenis) mainLenis.start();
    };
  }, []);

  // Cover video — scrubs with scroll on desktop (like the home hero); mobile
  // autoplays since iOS can't render a scrubbed paused video.
  useEffect(() => {
    if (isMobile) return;
    const page = pageRef.current;
    const vid = coverVidRef.current;
    if (!page || !vid) return;
    const onScroll = () => {
      const dur = vid.duration;
      if (!dur || !isFinite(dur)) return;
      const coverH = window.innerHeight * 0.84; // cover = 84vh on desktop
      const p = Math.max(0, Math.min(1, page.scrollTop / coverH));
      const t = p * dur;
      if (Math.abs(vid.currentTime - t) > 0.03) {
        if (!vid.paused) vid.pause();
        vid.currentTime = t;
      }
    };
    page.addEventListener('scroll', onScroll, { passive: true });
    const seek0 = () => { try { vid.currentTime = 0; } catch { /* not seekable yet */ } };
    if (vid.readyState >= 1) seek0(); else vid.addEventListener('loadedmetadata', seek0, { once: true });
    return () => page.removeEventListener('scroll', onScroll);
  }, [isMobile]);

  // Fade the "+ новый проект" button once the contact form scrolls into view.
  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    const form = root.querySelector('[class*="contactWrap"]');
    if (!form) return;
    const obs = new IntersectionObserver(([e]) => setFormInView(e.isIntersecting), { root, threshold: 0.05 });
    obs.observe(form);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={pageRef} className={s.page}>
      {/* ── First screen: cover (80svh) + intro meta. The wrapper is min 100svh
            so the image blocks below it only appear on the next screen. ──── */}
      <div style={{ minHeight: '100svh' }}>
        <div style={{ position: 'relative', width: '100%', height: isMobile ? '70vh' : '84vh', overflow: 'hidden' }}>
          {data.coverVideo ? (
            <video
              ref={coverVidRef}
              src={data.coverVideo}
              muted playsInline preload="auto"
              autoPlay={isMobile} loop={isMobile}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: 'var(--c-surface)' }} />
          )}
          {/* client name — centered at the top, inverted, like the home headline */}
          <h1 style={{
            position: 'absolute',
            top: 20,
            left: 0, right: 0, margin: 0, textAlign: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--heading-size)',
            fontWeight: 'var(--heading-weight)' as React.CSSProperties['fontWeight'],
            lineHeight: 'var(--heading-lh)',
            letterSpacing: '-0.03em',
            color: '#fff', mixBlendMode: 'difference',
          }}>{data.title}</h1>
        </div>
        {/* intro meta — 10px under the cover */}
        <div style={{ padding: `0 ${SIDE}`, marginTop: 10 }}>
          <MetaRow
            col1={data.type}
            col2={data.industry}
            num={data.year}
            text={data.intro}
          />
        </div>
      </div>

      <div style={{ padding: `0 ${SIDE}` }}>

        {/* ── Image blocks — driven by data.blocks ─────────────────────────── */}
        {data.blocks.map((b, i) => {
          if (b.kind === 'text') {
            // text-only block — paragraph at column 4, no image, no number
            return (
              <Block key={i} caption>
                <MetaRow text={b.text} />
              </Block>
            );
          }
          if (b.kind === 'single') {
            return (
              <Block key={i} caption={!!b.caption}>
                <Img ar={b.ar === 'h' ? CASE_AR_H : CASE_AR_V} src={b.src} />
                {b.caption && <Caption num={nextNum()} text={b.caption} />}
              </Block>
            );
          }
          // duo — two images side by side
          const leftAr  = b.left  === 'h' ? CASE_AR_H : CASE_AR_V;
          const rightAr = b.right === 'h' ? CASE_AR_H : CASE_AR_V;
          if (b.caption) {
            // Caption sits right under the RIGHT (horizontal) image — the taller
            // left image just extends past it (no big white gap below).
            const inner = (
              <>
                <Img ar={leftAr} src={b.leftSrc} />
                <div>
                  <Img ar={rightAr} src={b.rightSrc} />
                  <RightCaption num={nextNum()} text={b.caption} />
                  {/* extra text-only paragraph — sits right under the caption,
                      filling the space beside the taller left image */}
                  {b.belowText && <div style={{ marginTop: 20 }}><RightCaption text={b.belowText} /></div>}
                </div>
              </>
            );
            return (
              <Block key={i}>
                {isMobile
                  ? <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{inner}</div>
                  : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, alignItems: 'start' }}>{inner}</div>}
              </Block>
            );
          }
          return (
            <Block key={i}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 4, alignItems: 'start' }}>
                <Img ar={leftAr} src={b.leftSrc} />
                <Img ar={rightAr} src={b.rightSrc} />
              </div>
            </Block>
          );
        })}

        {/* ── Credits. Desktop: centred, 40px gap under label, 20px between names.
              Mobile: left-aligned at 1/3 vw, role appears LEFT of the name. ── */}
        <div style={{
          marginTop: 120,
          display: 'flex', flexDirection: 'column', gap: 40,
          ...(isMobile
            ? { alignItems: 'flex-start', paddingLeft: 'calc(33.333vw - var(--pad) + 4px)', textAlign: 'left' }
            : { alignItems: 'center', textAlign: 'center' }),
        }}>
          <p style={{ ...textStyle, margin: 0 }}>Над проектом работали:</p>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 20,
            alignItems: isMobile ? 'flex-start' : 'center',
            ...headingStyle,
            textAlign: isMobile ? 'left' : 'center',
          }}>
            {data.team.map(({ name, role }, i) => (
              <p
                key={i}
                style={{ position: 'relative', margin: 0, fontSize: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}
                onMouseEnter={() => { setHoveredTeam(i); sound.play('hover'); }}
                onMouseLeave={() => setHoveredTeam(null)}
                onTouchStart={() => { setHoveredTeam(hoveredTeam === i ? null : i); sound.play('hover'); }}
              >
                <LinkFlip flat>{name}</LinkFlip>
                {/* role — desktop: top-right; mobile: top-left of the name */}
                <span style={{
                  ...textStyle,
                  lineHeight: 1,
                  position: 'absolute',
                  ...(isMobile
                    ? { right: 'calc(100% + 8px)', bottom: '100%' }
                    : { left: 'calc(100% + 8px)', bottom: '100%' }),
                  transform: 'translateY(0.55em)',
                  whiteSpace: 'nowrap',
                  opacity: hoveredTeam === i ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                  pointerEvents: 'none',
                }}>{role}</span>
              </p>
            ))}
          </div>
        </div>

        {/* ── Testimonial — only when the case provides one. Quote is h2; below
              it a small avatar circle + name/role + one phrase. ── */}
        {data.testimonial && (
        <div style={{ marginTop: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <p style={{ ...h2Style, margin: 0, maxWidth: 820 }}>
            {data.testimonial.quote}
          </p>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {/* photo placeholder */}
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--c-surface)' }} />
            <p style={{ ...textStyle, margin: 0 }}>{data.testimonial.name}</p>
            <p style={{ ...textStyle, margin: 0, opacity: 'var(--opacity-muted)' }}>{data.testimonial.phrase}</p>
          </div>
        </div>
        )}

      </div>

      {/* "+ новый проект" — sticky pill, hidden on case pages for now. */}
      {false && (
      <button
        className={app.newProjectBtn}
        style={{
          position: 'sticky',
          bottom: 'var(--pad)',
          marginLeft: 'var(--pad)',
          marginTop: 'calc(-1 * var(--text-size) * var(--text-lh) - 20px)',
          zIndex: 60,
          mixBlendMode: 'difference',
          background: 'transparent',
          border: 'none',
          borderRadius: 0,
          padding: 0,
          cursor: formInView ? 'default' : 'pointer',
          opacity: formInView ? 0 : 1,
          pointerEvents: formInView ? 'none' : 'auto',
          transition: 'opacity 0.35s ease',
          fontFamily: 'var(--font)',
          fontSize: 'var(--text-size)',
          fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
          letterSpacing: 'var(--text-ls)',
          lineHeight: 'var(--text-lh)',
          color: '#000',
          textDecoration: 'none',
          display: 'inline-block',
          perspective: 'none',
          alignSelf: 'flex-start',
        }}
        onMouseEnter={() => sound.play('hover')}
        onClick={() => {
          const el = pageRef.current?.querySelector('[class*="contactWrap"]') as HTMLElement | null;
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <span className={app.newProjectFlipInner}>
          <span className={app.newProjectFace} style={{ background: '#fff', padding: '9px 12px 11px 12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>
            <span className={app.newProjectPlusGhost} aria-hidden="true">+</span>
            новый проект
          </span>
          <span className={`${app.newProjectFace} ${app.newProjectFaceBottom}`} style={{ background: '#fff', padding: '9px 12px 11px 12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>
            <span style={{ marginRight: 6 }}>+</span>
            новый проект
          </span>
        </span>
      </button>
      )}

      <ContactForm onNavigatePolicy={onNavigatePolicy} onGridMode={onGridMode} />
    </div>
  );
}
