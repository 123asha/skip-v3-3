import SocialLinks from './SocialLinks';
import { useMobile } from '../hooks/useMobile';
import { LANG, LANG_PREFIX, otherLangHref, stripLang } from '../i18n';

/**
 * Phone footer — the language switch and the privacy policy on the left, social
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
      // Room for the pinned menu under it, always (its shown position, not
      // the tucked-away one), plus 3 steps of air — the two never overlap
      marginBottom: 'calc(var(--pad) + var(--m-bottom-lift, 0px) + var(--m-chip-h) + 3 * var(--space-xs))',
      fontFamily: 'var(--font)', fontSize: 'var(--text-size)', fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
      // Grey text; only the social circles are dark
      lineHeight: 'var(--text-lh)', letterSpacing: 'var(--text-ls)', color: 'var(--c-text-muted)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* The language to switch to (the sound switch sits in the header) */}
        <a href={otherLangHref(stripLang(location.pathname.replace(import.meta.env.BASE_URL.replace(/\/$/, ''), '').replace(/\/$/, '') || '/'))} style={{ color: 'inherit', textDecoration: 'none', padding: 10, margin: -10 }}>{LANG === 'en' ? '/ru' : '/en'}</a>
        <a href="/policy" onClick={toPolicy} style={{ color: 'inherit', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}>
          Политика конфиденциальности
        </a>
      </div>
      {/* A touch bigger (+10%) and closer together than elsewhere */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><SocialLinks onLight size={26.4} /></div>
    </div>
  );
}
