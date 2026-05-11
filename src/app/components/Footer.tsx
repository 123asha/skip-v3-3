import { useEffect, useState, useRef } from 'react';

export default function Footer() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate progress based on how much we've scrolled into the footer section
      const scrollDistance = windowHeight - containerRect.top;

      // Start when top of container reaches bottom of viewport
      // End when we've scrolled through the entire container height
      const containerHeight = containerRef.current.offsetHeight;
      const progress = Math.max(0, Math.min(1, scrollDistance / containerHeight));

      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Each curtain expands, leaving exactly 20px gap top and bottom for footer
  // Footer text height ~16px + 20px top + 20px bottom = 56px total space needed
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1000;
  const maxCurtainHeight = (windowHeight - 56) / 2; // Each curtain gets half of remaining space
  const curtainHeightPx = scrollProgress * maxCurtainHeight;

  // Interpolate footer position from bottom (20px) to center (50vh)
  const footerBottom = 20 + (scrollProgress * (windowHeight * 0.5 - 20));

  return (
    <>
      {/* Top curtain */}
      <div
        className="fixed top-0 left-0 right-0 bg-[#f6f6f6] z-40 pointer-events-none"
        style={{ height: `${curtainHeightPx}px` }}
      />

      {/* Bottom curtain */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-[#f6f6f6] z-40 pointer-events-none"
        style={{ height: `${curtainHeightPx}px` }}
      />

      {/* Footer content - moves smoothly with scroll */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-50"
        style={{ bottom: `${footerBottom}px` }}
      >
        <div className="flex gap-[20px] font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px]">
          <a href="#" className="underline decoration-dotted cursor-pointer">@skipbot</a>
          <a href="#" className="underline decoration-dotted cursor-pointer">hi@skip.design</a>
        </div>
      </div>

      {/* Spacer to trigger the footer animation */}
      <div ref={containerRef} className="h-[50vh] w-full" />
    </>
  );
}
