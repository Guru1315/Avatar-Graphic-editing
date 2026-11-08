// Keeps a sliding window of GPU-ready, screen-sized ImageBitmaps around the current
// frame of a scroll/mouse-driven image sequence.
//
// Why: drawing a freshly loaded <img> onto a canvas costs ~60ms on an integrated GPU
// (decode at draw time, on the main thread), which is what made scrolling stutter.
// An ImageBitmap is already decoded and draws in a few ms. Bitmaps are decoded off
// the main thread from the compressed blobs, and only a window around the current
// frame is kept, so memory stays bounded (all frames decoded would be several GB).
//
// Bitmaps are deliberately NOT resized: createImageBitmap's resize option runs on the
// main thread in Chrome (~130ms per frame, measured), which reintroduced the stutter.
// The GPU scales them at draw time for free.

export interface FrameSequenceOptions {
  count: number;
  /** Frames kept decoded on each side of the current frame. */
  window: number;
  /** Called when a bitmap near the current frame becomes available. */
  onReady?: () => void;
}

const MAX_IN_FLIGHT = 4;

export class FrameSequence {
  private blobs: (Blob | null)[];
  private bitmaps = new Map<number, ImageBitmap>();
  private pending = new Set<number>();
  private center = 0;
  private active = false;
  private generation = 0;
  private destroyed = false;

  constructor(private opts: FrameSequenceOptions) {
    this.blobs = new Array(opts.count).fill(null);
  }

  get loadedCount() {
    return this.blobs.reduce((n, b) => n + (b ? 1 : 0), 0);
  }

  setBlob(index: number, blob: Blob) {
    this.blobs[index] = blob;
    if (this.active && Math.abs(index - this.center) <= this.opts.window) this.pump();
  }

  setActive(active: boolean) {
    if (active === this.active) return;
    this.active = active;
    if (active) this.pump();
    else this.releaseAll();
  }

  setCenter(index: number) {
    this.center = index;
    const w = this.opts.window;
    for (const [i, bmp] of this.bitmaps) {
      if (Math.abs(i - index) > w + 2) { bmp.close(); this.bitmaps.delete(i); }
    }
    this.pump();
  }

  /** Best bitmap to show for `index`: exact, else the nearest ready one. */
  get(index: number): ImageBitmap | null {
    const exact = this.bitmaps.get(index);
    if (exact) return exact;
    for (let d = 1; d <= this.opts.window * 2; d++) {
      const b = this.bitmaps.get(index - d) ?? this.bitmaps.get(index + d);
      if (b) return b;
    }
    return null;
  }

  destroy() {
    this.destroyed = true;
    this.releaseAll();
  }

  private releaseAll() {
    this.generation++;
    for (const bmp of this.bitmaps.values()) bmp.close();
    this.bitmaps.clear();
    this.pending.clear();
  }

  private pump() {
    if (!this.active || this.destroyed) return;
    const { window: w, count } = this.opts;
    // Nearest-first, slightly favouring frames ahead of the current one.
    for (let d = 0; d <= w && this.pending.size < MAX_IN_FLIGHT; d++) {
      for (const i of [this.center + d, this.center - d]) {
        if (this.pending.size >= MAX_IN_FLIGHT) break;
        if (i < 0 || i >= count || this.bitmaps.has(i) || this.pending.has(i)) continue;
        const blob = this.blobs[i];
        if (!blob) continue;
        this.decode(i, blob);
      }
    }
  }

  private decode(index: number, blob: Blob) {
    const gen = this.generation;
    this.pending.add(index);
    createImageBitmap(blob)
      .then((bmp) => {
        const stale = gen !== this.generation || this.destroyed ||
          Math.abs(index - this.center) > this.opts.window + 2;
        if (stale) { bmp.close(); return; }
        this.bitmaps.set(index, bmp);
        if (Math.abs(index - this.center) <= 3) this.opts.onReady?.();
      })
      .catch(() => { /* corrupt frame: skip it, neighbours will be shown */ })
      .finally(() => {
        if (gen === this.generation) this.pending.delete(index);
        this.pump();
      });
  }
}
