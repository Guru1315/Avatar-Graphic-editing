'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { lockScroll, unlockScroll } from '../lib/scroll';

const FOLDER = 'gallery%20section';
// Pre-sized copies made by `npm run optimize-images` (originals are up to 7K / 47MB).
const thumbUrl = (file: string) => `/optimized/gallery/thumb/${file.replace(/\.\w+$/, '.webp')}`;
const fullUrl  = (file: string) => `/optimized/gallery/full/${file.replace(/\.\w+$/, '.webp')}`;

const MOVIES = [
  {
    id: 'a1',
    num: '01',
    title: 'AVATAR',
    year: '2009',
    tagline: 'Where no human has ventured before',
    accent: '#00d68f',
    dir: 'ltr',
    speed: 48,
    images: [
      '861773.jpg','861811.jpg','861817.jpg','861822.jpg','861823.jpg',
      '861830.jpg','861840.jpg','861894.jpg','861963.jpg','861967.jpg','861974.jpg',
    ],
  },
  {
    id: 'wow',
    num: '02',
    title: 'THE WAY OF WATER',
    year: '2022',
    tagline: 'The ocean remembers everything',
    accent: '#00aaff',
    dir: 'rtl',
    speed: 58,
    images: [
      '1277441.png','1277483.png','1277487.png','1277492.png',
      '1277499.png','1277504.png','1277506.png',
      '1372319.jpeg','1383495.jpg','1398863.jpg',
    ],
  },
  {
    id: 'faa',
    num: '03',
    title: 'FIRE AND ASH',
    year: '2025',
    tagline: 'The final chapter of Pandora',
    accent: '#ff7a2f',
    dir: 'ltr',
    speed: 40,
    images: [
      '1399519.jpg','1403002.jpg','1403426.jpg','1403613.jpg',
      '1403645.jpg','1403994.jpg','1404468.jpg','1404472.jpg',
      '1404476.jpg','1406548.jpg',
    ],
  },
] as const;

type Movie = (typeof MOVIES)[number];
interface LightboxState { file: string; movie: Movie }

const CARD_HEIGHTS = [225, 280, 250, 305, 260, 238];

// ── Image with fallback to the original file if the optimized copy is missing ──
function FallbackImg({ src, fallback, alt, fit, lazy = true }: {
  src: string; fallback: string; alt: string; fit: 'cover' | 'contain'; lazy?: boolean;
}) {
  const [current, setCurrent] = useState(src);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current} alt={alt} loading={lazy ? 'lazy' : 'eager'} decoding="async" draggable={false}
      onError={() => { if (current !== fallback) setCurrent(fallback); }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit }}
    />
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ file, movie, onClose }: { file: string; movie: Movie; onClose: () => void }) {
  return (
    <div
      className="lb-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,5,12,0.96)',
        backdropFilter: 'blur(16px) saturate(0.8)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        className="lb-img-wrap"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          display: 'flex', flexDirection: 'column',
          alignItems: 'flex-start', gap: '1.2rem',
          maxWidth: 'min(90vw, 1200px)',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close image"
          style={{
            position: 'absolute', top: '-3.2rem', right: 0,
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.45)', fontSize: '1.4rem',
            cursor: 'pointer', padding: '0.4rem',
            transition: 'color 0.2s', lineHeight: 1,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
        >
          ✕
        </button>

        <div style={{
          position: 'relative',
          width: 'min(90vw, 1200px)',
          aspectRatio: '16/9',
          borderRadius: '10px', overflow: 'hidden',
          border: `1px solid ${movie.accent}44`,
          boxShadow: `0 0 80px ${movie.accent}28, 0 30px 80px rgba(0,0,0,0.7)`,
        }}>
          <FallbackImg key={file} src={fullUrl(file)} fallback={`/${FOLDER}/${file}`} alt={movie.title} fit="contain" lazy={false} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: movie.accent, boxShadow: `0 0 14px ${movie.accent}`,
            flexShrink: 0,
          }} />
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.85rem', fontWeight: 300, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
            {movie.title}
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.62rem', color: `${movie.accent}99`, letterSpacing: '0.2em' }}>
            {movie.year}
          </span>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.72rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.28)', marginLeft: '0.5rem' }}>
            {movie.tagline}
          </span>
        </div>
      </div>

      <p style={{
        position: 'absolute', bottom: '1.5rem',
        fontFamily: 'monospace', fontSize: '0.55rem',
        letterSpacing: '0.3em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.15)',
      }}>
        Press Esc or click anywhere to close
      </p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function GallerySection() {
  const sectionRef  = useRef<HTMLElement>(null);
  const headerRef   = useRef<HTMLDivElement>(null);
  const lineRef     = useRef<HTMLDivElement>(null);
  const stripRefs   = useRef<(HTMLDivElement | null)[]>([]);

  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const openLightbox  = useCallback((s: LightboxState) => setLightbox(s), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // ── Letter-by-letter title entrance
      const letters = headerRef.current?.querySelectorAll<HTMLElement>('.g-letter');
      if (letters?.length) {
        gsap.fromTo(letters,
          { opacity: 0, y: 40, rotateX: -70, transformPerspective: 600 },
          {
            opacity: 1, y: 0, rotateX: 0,
            stagger: 0.04, duration: 0.7, ease: 'power3.out',
            scrollTrigger: { trigger: sectionRef.current, start: 'top 82%', once: true, invalidateOnRefresh: true },
          }
        );
      }

      // ── Decorative line
      if (lineRef.current) {
        gsap.fromTo(lineRef.current,
          { scaleX: 0, opacity: 0 },
          {
            scaleX: 1, opacity: 1, duration: 1.1, ease: 'power3.out',
            scrollTrigger: { trigger: sectionRef.current, start: 'top 77%', once: true, invalidateOnRefresh: true },
          }
        );
      }

      // ── Strip fade-in (opacity only — keeps GPU layer hierarchy clean)
      stripRefs.current.forEach((el) => {
        if (!el) return;
        gsap.fromTo(el,
          { opacity: 0 },
          {
            opacity: 1, duration: 1.1, ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 92%', once: true, invalidateOnRefresh: true },
          }
        );
      });
    });

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', onKey);

    // This section mounts after the pinned chapters were measured; re-measure the page.
    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  // Freeze the page behind the lightbox (previously the page kept scrolling under it).
  const isOpen = lightbox !== null;
  useEffect(() => {
    if (!isOpen) return;
    lockScroll();
    return unlockScroll;
  }, [isOpen]);

  return (
    <section
      ref={sectionRef}
      data-scroll-target="gallery"
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, #000810 0%, #020d18 30%, #010c16 100%)',
        padding: '9rem 0 7rem',
        overflowX: 'clip',
      }}
    >
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage:
          'linear-gradient(rgba(0,229,255,0.02) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(0,229,255,0.02) 1px, transparent 1px)',
        backgroundSize: '68px 68px',
      }} />

      {/* Ambient glow orbs */}
      <div style={{ position: 'absolute', top: '8%', left: '12%', width: '55vmax', height: '55vmax', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,180,100,0.04) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '12%', right: '8%', width: '50vmax', height: '50vmax', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,120,255,0.04) 0%, transparent 65%)', pointerEvents: 'none' }} />

      {/* ── Section header ── */}
      <div
        ref={headerRef}
        style={{
          textAlign: 'center',
          marginBottom: '5.5rem',
          position: 'relative', zIndex: 2,
          perspective: '700px',
        }}
      >
        <p style={{
          display: 'inline-block',
          fontFamily: 'monospace', fontSize: '0.62rem',
          letterSpacing: '0.52em', textTransform: 'uppercase',
          color: 'rgba(0,229,255,0.42)', marginBottom: '1.3rem',
        }} className="g-letter">
          Three Films · One Universe
        </p>

        <div style={{ lineHeight: 1, marginBottom: '1rem' }}>
          <h2 style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(3.2rem, 9.5vw, 8.5rem)',
            fontWeight: 900, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: '#ffffff', margin: 0,
            textShadow: '0 0 80px rgba(0,229,255,0.32), 0 0 140px rgba(0,229,255,0.1)',
          }}>
            {'THE GALLERY'.split('').map((ch, i) => (
              <span key={i} className="g-letter" style={{ display: 'inline-block', opacity: 0 }}>
                {ch === ' ' ? ' ' : ch}
              </span>
            ))}
          </h2>
        </div>

        <div
          ref={lineRef}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '1.2rem', marginTop: '2rem',
            transformOrigin: 'center', opacity: 0,
          }}
        >
          <div style={{ height: '1px', width: '120px', background: 'linear-gradient(to right, transparent, rgba(0,229,255,0.45))' }} />
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(0,229,255,0.6)', boxShadow: '0 0 12px rgba(0,229,255,0.9)' }} />
          <div style={{ height: '1px', width: '120px', background: 'linear-gradient(to left, transparent, rgba(0,229,255,0.45))' }} />
        </div>
      </div>

      {/* ── Movie strips ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4.5rem', position: 'relative', zIndex: 2 }}>
        {MOVIES.map((movie, mi) => (
          <div
            key={movie.id}
            ref={(el) => { stripRefs.current[mi] = el; }}
            style={{ opacity: 0 }}
          >
            {/* Movie label */}
            <div style={{
              display: 'flex', alignItems: 'baseline',
              gap: '1.1rem', flexWrap: 'wrap',
              padding: '0 clamp(1.5rem, 4vw, 4.5rem)',
              marginBottom: '1.4rem',
            }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.58rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: `${movie.accent}bb` }}>
                {movie.num}
              </span>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.05rem, 2.6vw, 1.9rem)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', margin: 0, textShadow: `0 0 28px ${movie.accent}44` }}>
                {movie.title}
              </h3>
              <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: `${movie.accent}88`, letterSpacing: '0.22em' }}>
                {movie.year}
              </span>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.78rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.28)', marginLeft: 'auto', paddingRight: 'clamp(1.5rem, 4vw, 4.5rem)' }}>
                {movie.tagline}
              </span>
            </div>

            {/* Accent rule */}
            <div style={{ height: '1px', marginBottom: '1.4rem', padding: '0 clamp(1.5rem, 4vw, 4.5rem)' }}>
              <div style={{ height: '1px', background: `linear-gradient(to right, ${movie.accent}44, transparent 60%)` }} />
            </div>

            {/* Infinite marquee */}
            <div className="marquee-row">
              <div
                className={`marquee-track marquee-track-${movie.dir}`}
                style={{ animationDuration: `${movie.speed}s` }}
              >
                {[...movie.images, ...movie.images].map((file, ii) => {
                  const h = CARD_HEIGHTS[ii % CARD_HEIGHTS.length];
                  const isDuplicate = ii >= movie.images.length;
                  return (
                    <div
                      key={`${movie.id}-${ii}`}
                      className="img-card"
                      role="button"
                      tabIndex={isDuplicate ? -1 : 0}
                      aria-hidden={isDuplicate || undefined}
                      aria-label={`Open ${movie.title} scene ${(ii % movie.images.length) + 1} full size`}
                      style={{
                        height: h,
                        width: Math.round(h * 1.62),
                        border: `1px solid ${movie.accent}22`,
                      }}
                      onClick={() => openLightbox({ file, movie })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox({ file, movie }); }
                      }}
                      title={`${movie.title} — click to expand`}
                    >
                      <FallbackImg src={thumbUrl(file)} fallback={`/${FOLDER}/${file}`} alt={`${movie.title} scene ${(ii % movie.images.length) + 1}`} fit="cover" />
                      <div
                        className="img-card-overlay"
                        style={{ background: `linear-gradient(to top, ${movie.accent}cc 0%, ${movie.accent}22 55%, transparent 100%)` }}
                      >
                        <div>
                          <p style={{ fontFamily: 'monospace', fontSize: '0.5rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', margin: '0 0 0.25rem' }}>
                            {movie.title} · {movie.year}
                          </p>
                          <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.7rem', color: '#fff', margin: 0 }}>
                            View full size ↗
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '5rem',
        background: 'linear-gradient(to top, #010c16, transparent)',
        pointerEvents: 'none',
      }} />

      {lightbox && (
        <Lightbox file={lightbox.file} movie={lightbox.movie} onClose={closeLightbox} />
      )}
    </section>
  );
}
