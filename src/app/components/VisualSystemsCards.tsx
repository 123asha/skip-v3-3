import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const IMGS = [
  'https://cdn.prod.website-files.com/675f094fa71fc3ba49590b83/68dd523f3242f983fe4bcef5_main%20ae.png',
  'https://cdn.prod.website-files.com/675f094fa71fc3ba49590b83/68dd57358ebd2acb0ec91f25_ae%201.1.png',
  'https://cdn.prod.website-files.com/675f094fa71fc3ba49590b83/68ab337ce793eadbdb71c93b_ae7.png',
  'https://cdn.prod.website-files.com/675f094fa71fc3ba49590b83/68ae0490ec1cc0adc7c7b3f3_Frame%202087328484.png',
];

// 5 карточек по кругу вокруг центрального слайда
const CARDS = [
  { left: '6%',   top: '12%', width: '20%', height: '18%' },  // верх-лево
  { left: '62%',  top: '6%',  width: '22%', height: '18%' },  // верх-право
  { left: '80%',  top: '46%', width: '17%', height: '22%' },  // право
  { left: '8%',   top: '60%', width: '20%', height: '20%' },  // низ-лево
  { left: '48%',  top: '74%', width: '22%', height: '20%' },  // низ-центр
];

// 3 сценария: каждая карточка показывает свою картинку
const SCENARIOS = [
  [0, 1, 2, 3, 0],
  [2, 3, 0, 1, 2],
  [1, 2, 3, 0, 3],
];

const ROTATION_INTERVAL_MS = 1500;

interface Props { visible: boolean }

export default function VisualSystemsCards({ visible }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scenario, setScenario] = useState(0);

  // Смена сценария раз в 1.5 секунды
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setScenario(s => (s + 1) % SCENARIOS.length), ROTATION_INTERVAL_MS);
    return () => clearInterval(id);
  }, [visible]);

  // Лёгкая инерционная ротация всего слайдера (контейнера) — карточки не крутятся сами
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const tween = gsap.to(wrap, {
      rotation: 3,
      duration: 9,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
      transformOrigin: '50% 50%',
    });
    return () => { tween.kill(); };
  }, []);

  const imgs = SCENARIOS[scenario];

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease',
        willChange: 'transform',
      }}
    >
      {CARDS.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: c.left,
            top: c.top,
            width: c.width,
            height: c.height,
            background: 'var(--c-surface)',
            overflow: 'hidden',
          }}
        >
          <div
            key={`img-${scenario}-${i}`}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${IMGS[imgs[i]]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.55,
              animation: 'vsCardFade 0.5s ease',
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes vsCardFade {
          from { opacity: 0; }
          to   { opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}
