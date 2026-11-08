'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import dynamic from 'next/dynamic';
import Hero from './components/Hero';
import FrameSection from './components/FrameSection';
import Loader from './components/Loader';
import Overlays from './components/Overlays';
import { lockScroll, scrollToTarget, setLenis, unlockScroll, type ScrollTarget } from './lib/scroll';
import { showToast, SOCIAL_LINKS } from './lib/ui';

const EXPLORE_LINKS: { label: string; target: ScrollTarget }[] = [
  { label: 'Pandora', target: 'chapter-1' },
  { label: "The Na'vi", target: 'chapter-2' },
  { label: 'Chapters', target: 'chapter-1' },
  { label: 'Gallery', target: 'gallery' },
  { label: 'Story', target: 'chapter-2' },
  { label: 'Characters', target: 'chapter-2' },
];

// These pages don't exist yet — say so instead of silently jumping to the top.
const comingSoon = (label: string) => () => showToast(`${label} — coming soon`);

const linkButton: React.CSSProperties = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
};

// ssr:false avoids hydration mismatch caused by GSAP pin-spacers
// mutating the shared <main> DOM tree outside React's awareness
const GallerySection = dynamic(
  () => import('./components/GallerySection'),
  { ssr: false, loading: () => <div style={{ height: '10vh', background: '#020d18' }} /> }
);

const SECTIONS = [
  {
    folder: 'New folder',
    frameCount: 145,
    frameOffset: 2,        // frames 001 and 002 were deleted
    scrollHeight: 4200,
    title: 'PANDORA',
    subtitle: 'A world beyond imagination',
    description:
      'Journey to the lush moon of Pandora, where every creature and every tree pulses with a deep, living energy. Nature here is not separate from life — it is life.',
    textSide: 'left' as const,
  },
  {
    folder: 'New folder (2)',
    frameCount: 220,
    scrollHeight: 5800,
    title: "THE NA'VI",
    subtitle: 'Children of the great forest',
    description:
      "Tall, graceful, and profoundly spiritual, the Na'vi people have walked among Pandora's towering woodlands for millennia — guided by Eywa, the mother of all life.",
    textSide: 'right' as const,
  },
  {
    folder: 'New folder (3)',
    frameCount: 69,
    scrollHeight: 2200,
    title: 'CONFLICT',
    subtitle: 'Two worlds collide',
    description:
      'As human forces press deeper into sacred ground, the tension between civilizations reaches its breaking point. Some lines, once crossed, can never be undone.',
    textSide: 'left' as const,
  },
  {
    folder: 'New folder (4)',
    frameCount: 112,
    scrollHeight: 3200,
    title: 'THE METKAYINA',
    subtitle: 'Reef people of the ancient sea',
    description:
      'Far from the forests, the ocean clans of Pandora hold their own ancient bond with the waves. The sea here is not empty — it breathes, it remembers, it protects.',
    textSide: 'right' as const,
  },
  {
    folder: 'New folder (5)',
    frameCount: 116,
    scrollHeight: 3200,
    title: 'WAY OF WATER',
    subtitle: 'Water has no beginning, no end',
    description:
      "The ocean carries the voices of the ancestors in every current. Every wave holds a memory. This is the way of water — and the way of the Na'vi.",
    textSide: 'left' as const,
  },
];

export default function Home() {
  const progressRef = useRef<HTMLDivElement>(null);
  const [loaderDone, setLoaderDone] = useState(false);

  // Keep the page still while the intro loader plays.
  useEffect(() => {
    if (loaderDone) return;
    lockScroll();
    return unlockScroll;
  }, [loaderDone]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Always start at the top: restoring mid-page under pinned sections causes a jump.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    // ── Lenis smooth scroll ────────────────────────────────────────────────
    // lerp gives a responsive, frame-rate-independent glide (the old fixed 1.3s
    // duration felt floaty and lagged behind the wheel).
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
    });
    setLenis(lenis);

    // Drive Lenis via GSAP's ticker so it stays in sync with ScrollTrigger
    const lenisRaf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(lenisRaf);
    gsap.ticker.lagSmoothing(0);

    // Keep ScrollTrigger in sync with Lenis's virtual scroll position
    lenis.on('scroll', ScrollTrigger.update);

    // ── ScrollTrigger config ───────────────────────────────────────────────
    ScrollTrigger.config({ ignoreMobileResize: true });

    // ── Top progress bar ───────────────────────────────────────────────────
    const bar = progressRef.current;
    if (bar) {
      ScrollTrigger.create({
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          bar.style.width = `${self.progress * 100}%`;
        },
      });
    }

    // ── Refresh after all child effects & fonts settle ─────────────────────
    const t = setTimeout(() => ScrollTrigger.refresh(), 300);

    return () => {
      clearTimeout(t);
      gsap.ticker.remove(lenisRaf);
      setLenis(null);
      lenis.destroy();
    };
  }, []);

  return (
    <>
      {/* Loader — unmounted after animation completes */}
      {!loaderDone && <Loader onComplete={() => setLoaderDone(true)} />}

      {/* Menu, trailer player and toasts shared by every section */}
      <Overlays />

      {/* Page scroll progress bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: '2px', background: 'rgba(255,255,255,0.04)', zIndex: 9999,
      }}>
        <div ref={progressRef} style={{
          height: '100%', width: '0%',
          background: 'rgba(0,229,255,0.7)',
          boxShadow: '0 0 8px rgba(0,229,255,0.8)',
        }} />
      </div>

      <main>
        <Hero />

        {SECTIONS.map((section, i) => (
          // Wrapper isolates GSAP's pin-spacer inside this div so it never
          // becomes a direct child of <main> — prevents React insertBefore errors
          <div key={section.folder}>
            <FrameSection {...section} sectionIndex={i} />
          </div>
        ))}

        <GallerySection />

        {/* ── FOOTER ── */}
        <footer data-scroll-target="footer" style={{
          position: 'relative',
          background: '#020c14',
          borderTop: '1px solid rgba(0,229,255,0.08)',
          overflow: 'hidden',
        }}>
          {/* Subtle top glow */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(to right, transparent 0%, rgba(0,229,255,0.35) 50%, transparent 100%)',
            pointerEvents: 'none',
          }} />

          {/* Main footer content */}
          <div style={{
            maxWidth: '1200px', margin: '0 auto',
            padding: '4.5rem 2.5rem 0',
          }}>
            {/* Top row — brand + nav columns */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: '3rem',
              paddingBottom: '3.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              {/* Brand column */}
              <div>
                <span style={{
                  fontFamily: 'Georgia, serif', fontSize: '1.4rem',
                  fontWeight: 900, letterSpacing: '0.3em',
                  textTransform: 'uppercase', color: '#fff',
                  textShadow: '0 0 20px rgba(0,229,200,0.5)',
                  display: 'block', marginBottom: '0.9rem',
                }}>AVATAR</span>
                <p style={{
                  fontFamily: 'Georgia, serif', fontSize: '0.82rem',
                  color: 'rgba(255,255,255,0.38)', lineHeight: 1.75,
                  fontWeight: 300, maxWidth: '220px',
                }}>
                  A James Cameron film universe. Three epic chapters set in the living world of Pandora.
                </p>
                {/* Social icons */}
                <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1.6rem' }}>
                  {SOCIAL_LINKS.map(({ label, name, href }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    aria-label={`Avatar on ${name}`} title={name}
                    style={{
                      width: '34px', height: '34px', borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.45)',
                      fontFamily: 'monospace', fontSize: '0.52rem',
                      letterSpacing: '0.04em', cursor: 'pointer', textDecoration: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'border-color 0.2s, color 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(0,229,180,0.5)';
                      e.currentTarget.style.color = 'rgba(0,229,180,0.9)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                    }}>
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Films column */}
              <div>
                <p style={{
                  fontFamily: 'monospace', fontSize: '0.6rem',
                  letterSpacing: '0.3em', textTransform: 'uppercase',
                  color: 'rgba(0,229,180,0.6)', marginBottom: '1.2rem', fontWeight: 700,
                }}>The Films</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {[
                    { num: '01', title: 'Avatar', year: '2009' },
                    { num: '02', title: 'The Way of Water', year: '2022' },
                    { num: '03', title: 'Fire and Ash', year: '2025' },
                  ].map(film => (
                    <li key={film.num} style={{ display: 'flex', alignItems: 'baseline', gap: '0.7rem' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.55rem', color: 'rgba(0,229,180,0.4)', flexShrink: 0 }}>{film.num}</span>
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.88rem', color: 'rgba(255,255,255,0.72)', fontStyle: 'italic' }}>
                        Avatar{film.num !== '01' ? `: ${film.title}` : ''}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.55rem', color: 'rgba(255,255,255,0.22)', marginLeft: 'auto' }}>{film.year}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Explore column */}
              <div>
                <p style={{
                  fontFamily: 'monospace', fontSize: '0.6rem',
                  letterSpacing: '0.3em', textTransform: 'uppercase',
                  color: 'rgba(0,229,180,0.6)', marginBottom: '1.2rem', fontWeight: 700,
                }}>Explore</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {EXPLORE_LINKS.map(({ label, target }) => (
                    <li key={label}>
                      <button onClick={() => scrollToTarget(target)} style={{
                        ...linkButton,
                        fontFamily: 'Georgia, serif', fontSize: '0.88rem',
                        color: 'rgba(255,255,255,0.5)',
                        transition: 'color 0.2s',
                        display: 'inline-block',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company column */}
              <div>
                <p style={{
                  fontFamily: 'monospace', fontSize: '0.6rem',
                  letterSpacing: '0.3em', textTransform: 'uppercase',
                  color: 'rgba(0,229,180,0.6)', marginBottom: '1.2rem', fontWeight: 700,
                }}>Company</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {['About', 'Press', 'Careers', 'Contact', 'Newsroom'].map(item => (
                    <li key={item}>
                      <button onClick={comingSoon(item)} style={{
                        ...linkButton,
                        fontFamily: 'Georgia, serif', fontSize: '0.88rem',
                        color: 'rgba(255,255,255,0.5)',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom row — legal */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '1rem',
              padding: '1.6rem 0 2rem',
            }}>
              <p style={{
                fontFamily: 'monospace', fontSize: '0.58rem',
                color: 'rgba(255,255,255,0.22)', letterSpacing: '0.04em', margin: 0,
              }}>
                © {new Date().getFullYear()} 20th Century Studios. All rights reserved. Avatar is a trademark of 20th Century Studios.
              </p>
              <div style={{ display: 'flex', gap: '1.8rem' }}>
                {['Privacy Policy', 'Terms of Use', 'Cookie Settings'].map(label => (
                  <button key={label} onClick={comingSoon(label)} style={{
                    ...linkButton,
                    fontFamily: 'monospace', fontSize: '0.58rem',
                    color: 'rgba(255,255,255,0.28)',
                    letterSpacing: '0.04em', transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
