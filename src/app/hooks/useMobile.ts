import { useState, useEffect } from 'react';

/** Returns true when viewport width ≤ 768px. Updates on resize. */
export function useMobile(breakpoint = 768): boolean {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= breakpoint
  );
  useEffect(() => {
    const check = () => setMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return mobile;
}
