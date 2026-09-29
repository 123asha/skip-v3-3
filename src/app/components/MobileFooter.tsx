import SocialLinks from './SocialLinks';
import MoscowTime from './MoscowTime';
import { useMobile } from '../hooks/useMobile';

/**
 * Phone footer — time on the left, social on the right, as the page's last
 * line (it scrolls with the page, not pinned). The space under it keeps it
 * clear of the menu chips pinned at the bottom of the screen.
 */
export default function MobileFooter() {
  const isMobile = useMobile();
  if (!isMobile) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      alignSelf: 'stretch', width: '100%', boxSizing: 'border-box',
      padding: '0 var(--pad)', height: 'var(--m-foot)',
      marginTop: 'var(--space-md)',
      marginBottom: 'calc(var(--m-menu-bottom) + var(--m-chip-h) + var(--space-xs))',
      fontFamily: 'var(--font)', fontSize: 'var(--text-size)', fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
      lineHeight: 'var(--text-lh)', letterSpacing: 'var(--text-ls)', color: 'var(--c-text)',
    }}>
      <span><MoscowTime /> (GMT+3)</span>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><SocialLinks onLight /></div>
    </div>
  );
}
