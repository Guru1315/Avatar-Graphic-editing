'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cancelGroup, enqueueFrames, setGroupPriority } from '../lib/frameLoader';
import { FrameSequence } from '../lib/frameSequence';

interface FrameSectionProps {
  folder: string;
  frameCount: number;
  frameOffset?: number;   // 0-based number of frames to skip at the start
  scrollHeight: number;
  title: string;
  subtitle: string;
  description: string;
  textSide: 'left' | 'right';
  sectionIndex: number;
}

export default function FrameSection({
  folder,
  frameCount,
  frameOffset = 0,
  scrollHeight,
  title,
  subtitle,
  description,
  textSide,
  sectionIndex,
}: FrameSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const currentFrameRef = useRef(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // GPU-ready frames for a window around the current one (see lib/frameSequence).
    const frames = new FrameSequence({
      count: frameCount,
      window: 14, // ~29 decoded 1920x1080 frames ≈ 240MB while this chapter is near
      onReady: () => drawFrame(currentFrameRef.current, true),
    });

    let drawn: ImageBitmap | null = null;

    // Size canvas to viewport
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawFrame(currentFrameRef.current, true);
    };
    resize();
    window.addEventListener('resize', resize);

    function drawFrame(index: number, force = false) {
      // Falls back to the nearest ready frame so the canvas never freezes on a gap.
      const bmp = frames.get(index);
      if (!bmp || (bmp === drawn && !force)) return;
      drawn = bmp;

      const cw = canvas!.width;
      const ch = canvas!.height;
      const scale = Math.max(cw / bmp.width, ch / bmp.height);
      const w = bmp.width * scale, h = bmp.height * scale;
      ctx!.drawImage(bmp, (cw - w) / 2, (ch - h) / 2, w, h);
    }

    // Download screen-sized frames (public/optimized, made by `npm run optimize-images`)
    // through the shared priority queue; fall back to the 4K originals if missing.
    const group = `frames-${sectionIndex}`;
    enqueueFrames(group, sectionIndex + 1, Array.from({ length: frameCount }, (_, i) => {
      const file = `ezgif-frame-${String(i + 1 + frameOffset).padStart(3, '0')}.jpg`;
      return {
        url: encodeURI(`/optimized/frames/${folder}/${file}`),
        fallbackUrl: encodeURI(`/${folder}/${file}`),
        onLoad: (blob: Blob) => {
          frames.setBlob(i, blob);
          const pct = (frames.loadedCount / frameCount) * 100;
          if (progressBarRef.current) {
            progressBarRef.current.style.width = `${pct}%`;
            if (pct >= 100) progressBarRef.current.style.opacity = '0';
          }
        },
      };
    }));

    // Text entry animation — 3D flip from the side
    const tl = gsap.timeline({ paused: true });
    tl
      .fromTo(
        textRef.current,
        {
          opacity: 0,
          x: textSide === 'left' ? -70 : 70,
          transformPerspective: 900,
          rotateY: textSide === 'left' ? -18 : 18,
        },
        {
          opacity: 1,
          x: 0,
          rotateY: 0,
          duration: 0.18,
          ease: 'power2.out',
        }
      )
      .to(textRef.current, { duration: 0.56 })  // hold
      .to(textRef.current, {
        opacity: 0,
        x: textSide === 'left' ? -45 : 45,
        rotateY: textSide === 'left' ? 8 : -8,
        duration: 0.16,
        ease: 'power2.in',
      });

    // Pinned scroll trigger driving canvas frames + text animation
    const trigger = ScrollTrigger.create({
      id: `frame-${sectionIndex}`,          // used by Hero navigation
      trigger: section,
      start: 'top top',
      end: `+=${scrollHeight}`,
      scrub: 0.6,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      animation: tl,
      onUpdate: (self) => {
        const idx = Math.round(self.progress * (frameCount - 1));
        if (idx !== currentFrameRef.current) {
          currentFrameRef.current = idx;
          frames.setCenter(idx);
          drawFrame(idx);
        }
      },
    });

    // As the reader approaches this chapter: download it first and start preparing
    // bitmaps. Created after the pin so it can measure the pin-spacer, which spans
    // the whole pinned scroll distance (the section itself is only 100vh tall).
    const spacer = section.parentElement?.classList.contains('pin-spacer') ? section.parentElement : section;
    const nearby = ScrollTrigger.create({
      trigger: spacer,
      start: 'top bottom+=100%',
      end: 'bottom top-=50%',
      onToggle: (self) => {
        setGroupPriority(group, self.isActive ? -1 : sectionIndex + 1);
        frames.setActive(self.isActive);
        if (self.isActive) drawFrame(currentFrameRef.current, true);
      },
    });

    return () => {
      trigger.kill();
      nearby.kill();
      tl.kill();
      cancelGroup(group);
      frames.destroy();
      window.removeEventListener('resize', resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLeft = textSide === 'left';

  return (
    <div
      ref={sectionRef}
      style={{
        position: 'relative',
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      {/* Frame canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Cinematic vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 38%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* Side gradient for text legibility */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          [isLeft ? 'left' : 'right']: 0,
          width: '52%',
          pointerEvents: 'none',
          background: isLeft
            ? 'linear-gradient(to right, rgba(2,10,20,0.88) 0%, rgba(2,10,20,0.5) 55%, transparent 100%)'
            : 'linear-gradient(to left, rgba(2,10,20,0.88) 0%, rgba(2,10,20,0.5) 55%, transparent 100%)',
        }}
      />

      {/* Text overlay */}
      <div
        ref={textRef}
        style={{
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          [isLeft ? 'left' : 'right']: 'clamp(2rem, 6vw, 5rem)',
          maxWidth: 'min(420px, 42vw)',
          opacity: 0,
          zIndex: 10,
        }}
      >
        <p
          style={{
            fontFamily: 'monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.38em',
            textTransform: 'uppercase',
            color: 'rgba(0,229,255,0.65)',
            marginBottom: '0.9rem',
          }}
        >
          Chapter {String(sectionIndex + 1).padStart(2, '0')} of 05
        </p>

        <h2
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(2.2rem, 5vw, 4rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#ffffff',
            lineHeight: 1.05,
            marginBottom: '0.8rem',
            textShadow:
              '0 0 40px rgba(0,229,255,0.55), 0 0 80px rgba(0,229,255,0.22)',
          }}
        >
          {title}
        </h2>

        <p
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(0.9rem, 1.6vw, 1.2rem)',
            fontWeight: 300,
            fontStyle: 'italic',
            color: 'rgba(160,230,255,0.78)',
            marginBottom: '1.1rem',
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </p>

        <p
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(0.75rem, 1.1vw, 0.9rem)',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.48)',
            lineHeight: 1.75,
          }}
        >
          {description}
        </p>
      </div>

      {/* Section counter — top right */}
      <div
        style={{
          position: 'absolute',
          top: '2rem',
          right: '2.2rem',
          fontFamily: 'monospace',
          fontSize: '0.62rem',
          letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.2)',
          zIndex: 10,
        }}
      >
        {String(sectionIndex + 1).padStart(2, '0')} / 05
      </div>

      {/* Loading progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'rgba(255,255,255,0.04)',
          zIndex: 20,
        }}
      >
        <div
          ref={progressBarRef}
          style={{
            height: '100%',
            width: '0%',
            background: 'rgba(0,229,255,0.55)',
            transition: 'width 0.15s linear, opacity 0.5s ease 0.2s',
          }}
        />
      </div>
    </div>
  );
}
