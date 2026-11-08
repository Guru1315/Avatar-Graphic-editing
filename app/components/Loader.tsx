'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface LoaderProps {
  onComplete: () => void;
}

export default function Loader({ onComplete }: LoaderProps) {
  const leftPanelRef  = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const lineRef       = useRef<HTMLDivElement>(null);
  const glowRef       = useRef<HTMLDivElement>(null);
  const leftImgRef    = useRef<HTMLImageElement>(null);
  const rightImgRef   = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();

    // initial states
    gsap.set(lineRef.current,  { scaleY: 0, transformOrigin: 'top center' });
    gsap.set(glowRef.current,  { opacity: 0, scale: 0.5 });
    gsap.set([leftImgRef.current, rightImgRef.current], { opacity: 0 });
    gsap.set(leftPanelRef.current,  { x: '0%' });
    gsap.set(rightPanelRef.current, { x: '0%' });

    tl
      // 1 — vertical line drops from top to center
      .to(lineRef.current, {
        scaleY: 1,
        duration: 0.85,
        ease: 'power3.inOut',
        delay: 0.25,
      })

      // 2 — glow blooms at seam center
      .to(glowRef.current, {
        opacity: 1, scale: 1,
        duration: 0.45, ease: 'power2.out',
      }, '-=0.05')

      // 3 — logo halves fade in from each side
      .to(leftImgRef.current, {
        opacity: 1, duration: 0.4, ease: 'power2.out',
      }, '-=0.3')
      .to(rightImgRef.current, {
        opacity: 1, duration: 0.4, ease: 'power2.out',
      }, '<')

      // 4 — hold
      .to({}, { duration: 1.0 })

      // 5 — glow flare then fade
      .to(glowRef.current, {
        scale: 2.4, opacity: 0.55, duration: 0.3, ease: 'power2.in',
      })
      .to(glowRef.current, {
        opacity: 0, scale: 3.5, duration: 0.28, ease: 'power2.out',
      })

      // 6 — panels split: left goes left, right goes right
      .to(leftPanelRef.current, {
        x: '-100%', duration: 1.05, ease: 'power4.inOut',
      }, '-=0.05')
      .to(rightPanelRef.current, {
        x: '100%', duration: 1.05, ease: 'power4.inOut',
        onComplete,
      }, '<');

    return () => { tl.kill(); };
  }, [onComplete]);

  const IMG_SIZE = 'clamp(100px, 13vw, 180px)';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      overflow: 'hidden', pointerEvents: 'none',
    }}>

      {/* ── LEFT PANEL ── */}
      <div
        ref={leftPanelRef}
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '50%', height: '100%',
          background: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end', // image flush against right seam
          overflow: 'hidden',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={leftImgRef}
          src="/right into logo.JPEG"
          alt=""
          style={{
            width: IMG_SIZE,
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
            objectPosition: 'right center',
            userSelect: 'none',
            flexShrink: 0,
          }}
        />
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        ref={rightPanelRef}
        style={{
          position: 'absolute',
          top: 0, right: 0,
          width: '50%', height: '100%',
          background: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start', // image flush against left seam
          overflow: 'hidden',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={rightImgRef}
          src="/left intro logo.JPEG"
          alt=""
          style={{
            width: IMG_SIZE,
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
            objectPosition: 'left center',
            userSelect: 'none',
            flexShrink: 0,
          }}
        />
      </div>

      {/* ── Vertical seam line — drops from top to center ── */}
      <div
        ref={lineRef}
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1px',
          height: '100vh',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(0,229,200,0.25) 40%, rgba(0,229,200,0.75) 100%)',
          zIndex: 10,
        }}
      />

      {/* ── Center glow at seam ── */}
      <div
        ref={glowRef}
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '380px', height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,180,0.18) 0%, rgba(0,180,140,0.07) 45%, transparent 68%)',
          zIndex: 9,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
