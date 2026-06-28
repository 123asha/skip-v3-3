/**
 * PeopleVideoSlot — два видео-элемента (A / B) в одном контейнере.
 * При смене config текущее поднимается вверх, новое приходит снизу.
 * 115 % смещение даёт 15 % зазор между кадрами в середине перехода.
 */
import { useEffect, useRef } from 'react';
import { asset, videoAsset } from '../utils/asset';

export type VideoConfig = { src: string; pos: string };

/** Смещение в % от высоты контейнера — больше 100 → виден зазор между кадрами */
const OFFSET = '115%';

export default function PeopleVideoSlot({
  config,
  aspectRatio,
}: {
  config: VideoConfig;
  aspectRatio: string;
}) {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const activeSide = useRef<'a' | 'b'>('a');
  const prevConfig = useRef(config);

  useEffect(() => {
    const prev = prevConfig.current;
    if (prev.src === config.src && prev.pos === config.pos) return;
    prevConfig.current = config;

    const isA = activeSide.current === 'a';
    const outEl = isA ? videoARef.current : videoBRef.current;
    const inEl  = isA ? videoBRef.current : videoARef.current;
    if (!outEl || !inEl) return;

    // ── Подготовка входящего ──────────────────────────────────────────────
    inEl.style.transition = 'none';
    inEl.style.transform  = `translateY(${OFFSET})`;
    inEl.style.objectPosition = config.pos;

    // Меняем src только если реально изменился
    const srcEl = inEl.querySelector('source');
    if (srcEl && srcEl.getAttribute('src') !== asset(config.src)) {
      srcEl.setAttribute('src', asset(config.src));
      inEl.load();
    }
    inEl.play().catch(() => {});

    // Reflow — фиксирует стартовую позицию до анимации
    void inEl.offsetHeight;

    // ── Анимация ──────────────────────────────────────────────────────────
    const ease = '0.55s cubic-bezier(0.4, 0, 0.2, 1)';
    inEl.style.transition  = `transform ${ease}`;
    outEl.style.transition = `transform ${ease}`;
    inEl.style.transform   = 'translateY(0%)';
    outEl.style.transform  = `translateY(-${OFFSET})`;

    activeSide.current = isA ? 'b' : 'a';
  }, [config]);

  const shared: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  };

  return (
    <div style={{ aspectRatio, background: 'var(--c-surface)', width: '100%', position: 'relative', overflow: 'hidden' }}>
      <video ref={videoARef} autoPlay muted loop playsInline
        style={{ ...shared, objectPosition: config.pos }}>
        <source src={videoAsset(config.src)} type="video/mp4" />
      </video>
      <video ref={videoBRef} autoPlay muted loop playsInline
        style={{ ...shared, objectPosition: config.pos, transform: `translateY(${OFFSET})` }}>
        <source src={videoAsset(config.src)} type="video/mp4" />
      </video>
    </div>
  );
}
