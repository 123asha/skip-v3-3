import SocialLinks from './SocialLinks';
import SoundIcon from '../sound/SoundIcon';
import { useMobile } from '../hooks/useMobile';
import { LANG_PREFIX } from '../i18n';

/**
 * Phone footer — the sound switch and the privacy policy on the left, social
 * on the right, as the page's last line (it scrolls with the page, not
 * pinned). The space under it keeps it clear of the menu chips pinned at the
 * bottom of the screen.
 */
export default function MobileFooter() {
  const isMobile = useMobile();
  if (!isMobile) return null;
  const toPolicy = (e: React.MouseEvent) => {
    e.preventDefault();
    // The app's own router listens to history changes
    window.history.pushState({}, '', import.meta.env.BASE_URL.replace(/\/$/, '') + LANG_PREFIX + '/policy');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      alignSelf: 'stretch', width: '100%', boxSizing: 'border-box',
      padding: '0 var(--pad)', height: 'var(--m-foot)',
      marginTop: 'var(--space-md)',
      // Twice the room under it, above the pinned menu
      marginBottom: 'calc(var(--m-menu-bottom) + var(--m-chip-h) + 2 * var(--space-xs))',
      fontFamily: 'var(--font)', fontSize: 'var(--text-size)', fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
      lineHeight: 'var(--text-lh)', letterSpacing: 'var(--text-ls)', color: 'var(--c-text)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <SoundIcon />
        <a href="/policy" onClick={toPolicy} style={{ color: 'inherit', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}>
          Политика конфиденциальности
        </a>
      </div>
      {/* A touch bigger (+10%) and closer together than elsewhere */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><SocialLinks onLight size={26.4} /></div>
    </div>
  );
}
