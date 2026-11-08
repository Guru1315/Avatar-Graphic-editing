// Single place that owns smooth scrolling, so every button scrolls the same way
// (through Lenis) instead of fighting it with window.scrollTo.
import type Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let lenis: Lenis | null = null;
let lockCount = 0;

export function setLenis(instance: Lenis | null) {
  lenis = instance;
  if (lenis && lockCount > 0) lenis.stop();
}

export type ScrollTarget = 'top' | 'gallery' | 'footer' | `chapter-${1 | 2 | 3 | 4 | 5}`;

function resolveY(target: ScrollTarget): number | null {
  if (target === 'top') return 0;

  if (target.startsWith('chapter-')) {
    const index = Number(target.slice(8)) - 1;
    const trigger = ScrollTrigger.getById(`frame-${index}`);
    if (!trigger) return null;
    // Land just after the chapter title has animated in, not on its blank first frame.
    return trigger.start + (trigger.end - trigger.start) * 0.22;
  }

  const el = document.querySelector<HTMLElement>(`[data-scroll-target="${target}"]`);
  if (!el) return null;
  return el.getBoundingClientRect().top + window.scrollY;
}

export function scrollToTarget(target: ScrollTarget) {
  const y = resolveY(target);
  if (y === null) return;

  if (!lenis) {
    window.scrollTo({ top: y, behavior: 'smooth' });
    return;
  }
  const distance = Math.abs(y - lenis.scroll);
  lenis.scrollTo(y, {
    duration: Math.min(2.6, Math.max(1, 0.8 + distance / 9000)),
    easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    force: true,
  });
}

/** Freeze page scrolling while a modal/menu is open. Calls nest. */
export function lockScroll() {
  lockCount++;
  lenis?.stop();
  document.documentElement.style.overflow = 'hidden';
}

export function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;
  lenis?.start();
  document.documentElement.style.overflow = '';
}
