import { useState, useEffect, useRef } from 'react';
import svgPaths from "../../imports/Index/svg-3bjnx36a2y";
import BreakoutGame from './BreakoutGame';
import SnakeGame from './SnakeGame';

const sections = [
  {
    id: 1,
    number: "①",
    title: "Бренд-\nстратегия",
    details: [
      "исследования рынка, категории\nи целевой аудитории",
      "нейминг и регистрация",
      "платформа бренда"
    ],
  },
  {
    id: 2,
    number: "②",
    title: "Визуальные\nсистемы",
    details: [
      "визуальная идентичность",
      "дизайн-система и токены",
      "гайдлайн и правила применения"
    ],
  },
  {
    id: 3,
    number: "③",
    title: "Автоматизация\nи поддержка",
    details: [
      "шаблоны и компоненты",
      "интеграция в продукт",
      "поддержка и развитие системы"
    ],
  }
];

const PX_PER_SEC = 200;
const PX_SLIDE   = 800;

export default function ScrollHero() {
  const [activeSection, setActiveSection] = useState(-1); // -1 = видео scrub, 0-2 = слайды
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const vidRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const vid = vidRef.current;
    const container = containerRef.current;
    if (!container) return;

    function setH(dur: number) {
      container!.style.height =
        (window.innerHeight + dur * PX_PER_SEC + sections.length * PX_SLIDE) + 'px';
    }

    setH(5); // fallback — sticky работает сразу

    const onMeta = () => setH(vid!.duration);
    vid?.addEventListener('loadedmetadata', onMeta);
    if (vid && vid.readyState >= 1) setH(vid.duration);

    // Если видео недоступно — всё равно sticky работает (5с fallback)
    vid?.addEventListener('error', () => setH(10));

    const handleScroll = () => {
      const dur = vid?.duration;
      if (!dur || !isFinite(dur)) {
        // Нет видео — сразу показываем слайды
        const sy = window.scrollY;
        const shiftEnd = 10 * PX_PER_SEC;
        setSidebarVisible(true);
        setActiveSection(Math.min(Math.floor(Math.max(0, sy - shiftEnd) / PX_SLIDE), 2));
        return;
      }

      const sy = window.scrollY;
      const videoPx = dur * PX_PER_SEC;

      if (sy <= 0) {
        if (vid) vid.currentTime = 0;
        setSidebarVisible(false);
        setActiveSection(-1);
        return;
      }

      if (sy < videoPx) {
        // Фаза 1: scrub видео
        const t = (sy / videoPx) * dur;
        if (vid && Math.abs(vid.currentTime - t) > 0.05) vid.currentTime = t;
        setSidebarVisible(false);
        setActiveSection(-1);
        return;
      }

      // Видео кончилось
      if (vid && Math.abs(vid.currentTime - dur) > 0.1) vid.currentTime = dur;
      setSidebarVisible(true);
      const after = sy - videoPx;
      setActiveSection(Math.min(Math.floor(after / PX_SLIDE), 2));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', () => setH(vid?.duration || 5));
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      vid?.removeEventListener('loadedmetadata', onMeta);
    };
  }, []);

  const videoRight = sidebarVisible;

  return (
    <>
      {/* Fixed Nav */}
      <div className="fixed left-[20px] top-[20px] z-50 flex gap-[8px] items-center font-['CoFo_Sans_VF_Trial:Medium',sans-serif] font-[464] leading-none text-[16px] tracking-[-0.32px] mix-blend-difference text-white">
        <a href="#hero" className="underline cursor-pointer">Инекс</a>
        <a href="#cases" className="underline cursor-pointer">Кейсы</a>
        <a href="#tools" className="underline cursor-pointer">Инструменты</a>
        <a href="#studio" className="underline cursor-pointer">Студия</a>
      </div>

      {/* Fixed Logo */}
      <div className="fixed right-[20px] top-[10px] z-50 h-[32px] w-[52.528px] mix-blend-difference">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 52.5283 32">
          <path d={svgPaths.pb7e9300} fill="#ffffff" />
        </svg>
      </div>

      {/* Hero scroll container */}
      <div id="hero" ref={containerRef} className="relative" style={{ minHeight: '300vh' }}>
        <div className="sticky top-0 h-screen w-full bg-white overflow-hidden">

          {/* Headline */}
          <p className="absolute font-['CoFo_Sans_VF_Trial:Medium',sans-serif] font-[454] leading-[0.81] left-[20px] text-[#231f20] text-[40px] top-[46px] tracking-[-0.8px] w-[613px]">
            Визуальные системы, автоматизация дизайна для быстрорастущих компаний
          </p>

          {/* Sidebar */}
          <div
            className="absolute left-[20px] top-1/2 -translate-y-1/2 flex flex-col gap-[40px] transition-opacity duration-500"
            style={{ opacity: sidebarVisible ? 1 : 0 }}
          >
            {sections.map((section, idx) => {
              const isActive = activeSection === idx;
              const isPast = activeSection > idx;
              return (
                <div
                  key={section.id}
                  className="flex gap-[10px] items-start transition-opacity duration-350"
                  style={{ opacity: isActive ? 1 : 0.3 }}
                >
                  <span className="font-['CoFo_Sans_VF_Trial:Medium',sans-serif] font-[464] text-[16px] leading-none tracking-[-0.32px] text-[#231f20] w-[14px] shrink-0">
                    {section.number}
                  </span>
                  <div className="flex flex-col gap-[8px]">
                    <span className="font-['CoFo_Sans_VF_Trial:Medium',sans-serif] font-[464] text-[16px] leading-[1.3] tracking-[-0.32px] text-[#231f20]">
                      {section.title}
                    </span>
                    {/* Раскрывающиеся детали */}
                    <div
                      className="flex flex-col gap-[6px] overflow-hidden transition-all duration-500"
                      style={{ maxHeight: isActive ? '200px' : '0px', opacity: isActive ? 1 : 0 }}
                    >
                      {section.details.map((d, i) => (
                        <p
                          key={i}
                          className="font-['CoFo_Sans_VF_Trial:Medium',sans-serif] font-[464] text-[16px] leading-[1.3] tracking-[-0.32px] text-[#231f20]"
                          style={{
                            transitionDelay: isActive ? `${i * 70}ms` : '0ms',
                            transform: isActive ? 'translateY(0)' : 'translateY(8px)',
                            opacity: isActive ? 1 : 0,
                            transition: 'transform 0.45s ease, opacity 0.35s ease',
                          }}
                        >
                          {d}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Panel: video / breakout / snake */}
          <div
            className="absolute h-[352px] w-[612px] overflow-hidden bg-[#f0f0f0] transition-all duration-700"
            style={{
              left: videoRight ? 'calc(100% - 632px)' : '50%',
              top: '50%',
              transform: videoRight ? 'translateY(-50%)' : 'translateX(-50%) translateY(-50%)',
            }}
          >
            {/* Видео — слайд 0 или до раскрытия */}
            <div className="absolute inset-0 transition-opacity duration-600"
              style={{ opacity: !sidebarVisible || activeSection === 0 ? 1 : 0 }}>
              <video
                ref={vidRef}
                muted
                playsInline
                preload="auto"
                className="w-full h-full object-cover"
              >
                <source src="video.mp4" type="video/mp4" />
              </video>
            </div>

            {/* Breakout — слайд 1 */}
            <div className="absolute inset-0 transition-opacity duration-600"
              style={{ opacity: sidebarVisible && activeSection === 1 ? 1 : 0, pointerEvents: activeSection === 1 ? 'auto' : 'none' }}>
              {activeSection === 1 && <BreakoutGame />}
            </div>

            {/* Snake — слайд 2 */}
            <div className="absolute inset-0 transition-opacity duration-600"
              style={{ opacity: sidebarVisible && activeSection === 2 ? 1 : 0, pointerEvents: activeSection === 2 ? 'auto' : 'none' }}>
              {activeSection === 2 && <SnakeGame />}
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 flex gap-[20px] font-['CoFo_Sans_VF_Trial:Medium',sans-serif] font-[464] text-[16px] leading-none tracking-[-0.32px] text-[#231f20] whitespace-nowrap">
            <a href="#" className="underline">@skipbot</a>
            <a href="#" className="underline">hi@skip.design</a>
          </div>

        </div>
      </div>
    </>
  );
}
