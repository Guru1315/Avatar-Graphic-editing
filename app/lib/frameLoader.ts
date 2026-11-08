
type Job = {
  url: string;
  fallbackUrl?: string;
  group: string;
  order: number;
  onLoad: (blob: Blob) => void;
};

const CONCURRENCY = 8;
const groupPriority = new Map<string, number>();
let queue: Job[] = [];
let active = 0;
let seq = 0;

function priorityOf(job: Job) {
  return groupPriority.get(job.group) ?? 100;
}

function pump() {
  while (active < CONCURRENCY && queue.length) {
    // Pick the best job: lowest group priority, then earliest-enqueued.
    let best = 0;
    for (let i = 1; i < queue.length; i++) {
      const a = queue[i], b = queue[best];
      const pa = priorityOf(a), pb = priorityOf(b);
      if (pa < pb || (pa === pb && a.order < b.order)) best = i;
    }
    const job = queue.splice(best, 1)[0];
    active++;
    load(job).finally(() => {
      active--;
      pump();
    });
  }
}

async function fetchBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.blob();
}

async function load(job: Job) {
  try {
    job.onLoad(await fetchBlob(job.url));
  } catch {
    if (!job.fallbackUrl) return;
    try { job.onLoad(await fetchBlob(job.fallbackUrl)); } catch { /* missing frame */ }
  }
}

export function setGroupPriority(group: string, priority: number) {
  groupPriority.set(group, priority);
}

export function enqueueFrames(
  group: string,
  priority: number,
  items: { url: string; fallbackUrl?: string; onLoad: (blob: Blob) => void }[],
) {
  if (!groupPriority.has(group)) groupPriority.set(group, priority);
  for (const item of items) queue.push({ ...item, group, order: seq++ });
  pump();
}

export function cancelGroup(group: string) {
  queue = queue.filter((j) => j.group !== group);
}
