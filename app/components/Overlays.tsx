'use client';

import { useEffect, useState } from 'react';
import { onUI, TRAILERS, type TrailerId } from '../lib/ui';
import { lockScroll, scrollToTarget, unlockScroll, type ScrollTarget } from '../lib/scroll';

const MENU_ITEMS: { label: string; num?: string; target: ScrollTarget }[] = [
  { label: 'Home', target: 'top' },
  { num: '01', label: 'Pandora', target: 'chapter-1' },
  { num: '02', label: "The Na'vi", target: 'chapter-2' },
  { num: '03', label: 'Conflict', target: 'chapter-3' },
  { num: '04', label: 'The Metkayina', target: 'chapter-4' },
  { num: '05', label: 'Way of Water', target: 'chapter-5' },
  { label: 'Gallery', target: 'gallery' },
];

const closeBtn: React.CSSProperties = {
  position: 'absolute', top: 'clamp(1rem, 3vh, 1.8rem)', right: 'clamp(1rem, 4vw, 3rem)',
  width: '40px', height: '40px', borderRadius: '50%',
  border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)',
  color: 'rgba(255,255,255,0.75)', fontSize: '1rem', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

export default function Overlays() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [trailer, setTrailer] = useState<TrailerId | null>(null);
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);

  useEffect(() => onUI((e) => {
    if (e.type === 'menu') setMenuOpen(true);
    if (e.type === 'trailer') { setMenuOpen(false); setTrailer(e.film ?? 'a1'); }
    if (e.type === 'toast') setToast({ message: e.message, key: Date.now() });
  }), []);

  // Freeze the page behind any open overlay; Esc closes it.
  const anyOpen = menuOpen || trailer !== null;
  useEffect(() => {
    if (!anyOpen) return;
    lockScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenuOpen(false); setTrailer(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => { unlockScroll(); window.removeEventListener('keydown', onKey); };
  }, [anyOpen]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const go = (target: ScrollTarget) => {
    setMenuOpen(false);
    // Wait one frame so the scroll lock is released before scrolling.
    requestAnimationFrame(() => scrollToTarget(target));
  };

  const film = TRAILERS.find((t) => t.id === trailer);

  return (
    <>
      {/* ── Full-screen menu ── */}
      {menuOpen && (
        <div
          role="dialog" aria-modal="true" aria-label="Site menu"
          className="lb-backdrop"
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10001,
            background: 'rgba(1,10,8,0.94)', backdropFilter: 'blur(14px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
          }}
        >
          <button aria-label="Close menu" onClick={() => setMenuOpen(false)} style={closeBtn}>✕</button>
          <nav onClick={(e) => e.stopPropagation()} className="lb-img-wrap">
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'clamp(0.5rem, 1.6vh, 1rem)' }}>
              {MENU_ITEMS.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => go(item.target)}
                    className="menu-link"
                    style={{
                      display: 'flex', alignItems: 'baseline', gap: '1rem',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem 0',
                      fontFamily: 'Georgia, serif', fontSize: 'clamp(1.6rem, 4.5vw, 3rem)',
                      fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', letterSpacing: '0.2em', color: 'rgba(0,229,180,0.7)', width: '1.6rem', fontWeight: 400 }}>
                      {item.num ?? ''}
                    </span>
                    {item.label}
                  </button>
                </li>
              ))}
              <li style={{ marginTop: '1rem' }}>
                <button
                  onClick={() => { setMenuOpen(false); setTrailer('a1'); }}
                  style={{
                    marginLeft: '2.6rem',
                    fontFamily: "'Courier New', monospace", fontSize: '0.7rem', fontWeight: 700,
                    letterSpacing: '0.18em', textTransform: 'uppercase',
                    padding: '0.65rem 1.4rem', borderRadius: '50px', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #00e5b4 0%, #00c8a0 100%)', color: '#010c08',
                  }}
                >
                  ▶ Watch Trailers
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* ── Trailer player ── */}
      {film && (
        <div
          role="dialog" aria-modal="true" aria-label={`${film.title} trailer`}
          className="lb-backdrop"
          onClick={() => setTrailer(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10002,
            background: 'rgba(0,5,12,0.96)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
          }}
        >
          <button aria-label="Close trailer" onClick={() => setTrailer(null)} style={closeBtn}>✕</button>
          <div
            className="lb-img-wrap"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(92vw, 1100px)', display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {TRAILERS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTrailer(t.id)}
                  aria-pressed={t.id === film.id}
                  style={{
                    fontFamily: 'monospace', fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase',
                    padding: '0.45rem 1rem', borderRadius: '30px', cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.18)',
                    background: t.id === film.id ? 'rgba(255,255,255,0.9)' : 'transparent',
                    color: t.id === film.id ? '#010c08' : 'rgba(255,255,255,0.7)',
                    fontWeight: t.id === film.id ? 700 : 400,
                  }}
                >
                  {t.num} · {t.title.replace('Avatar: ', '')} <span style={{ opacity: 0.6 }}>{t.year}</span>
                </button>
              ))}
            </div>
            <div style={{
              position: 'relative', width: '100%', aspectRatio: '16 / 9',
              borderRadius: '10px', overflow: 'hidden', background: '#000',
              border: '1px solid rgba(0,229,180,0.25)', boxShadow: '0 0 80px rgba(0,229,180,0.12)',
            }}>
              <iframe
                key={film.youtubeId}
                src={`https://www.youtube-nocookie.com/embed/${film.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title={`${film.title} — Official Trailer`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          key={toast.key}
          role="status"
          className="toast"
          style={{
            position: 'fixed', left: '50%', bottom: '2rem', zIndex: 10003,
            transform: 'translateX(-50%)',
            padding: '0.75rem 1.3rem', borderRadius: '40px',
            background: 'rgba(2,20,16,0.92)', border: '1px solid rgba(0,229,180,0.3)',
            color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace', fontSize: '0.7rem',
            letterSpacing: '0.08em', whiteSpace: 'nowrap', pointerEvents: 'none',
          }}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}
