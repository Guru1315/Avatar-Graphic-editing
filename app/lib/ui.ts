
export const TRAILERS = [
  { id: 'a1', num: '01', title: 'Avatar', year: '2009', youtubeId: '5PSNL1qE6VY' },
  { id: 'wow', num: '02', title: 'Avatar: The Way of Water', year: '2022', youtubeId: 'd9MyW72ELq0' },
  { id: 'faa', num: '03', title: 'Avatar: Fire and Ash', year: '2025', youtubeId: 'nb_fFj_0rq8' },
] as const;

export type TrailerId = (typeof TRAILERS)[number]['id'];

export const SOCIAL_LINKS = [
  { label: 'IG', name: 'Instagram', href: 'https://www.instagram.com/avatar/' },
  { label: 'TW', name: 'X (Twitter)', href: 'https://x.com/officialavatar' },
  { label: 'YT', name: 'YouTube', href: 'https://www.youtube.com/@AvatarOfficial' },
  { label: 'FB', name: 'Facebook', href: 'https://www.facebook.com/avatar' },
] as const;

type UIEvent =
  | { type: 'menu' }
  | { type: 'trailer'; film?: TrailerId }
  | { type: 'toast'; message: string };

const EVENT = 'avatar:ui';

export function emitUI(detail: UIEvent) {
  window.dispatchEvent(new CustomEvent<UIEvent>(EVENT, { detail }));
}

export function onUI(handler: (e: UIEvent) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<UIEvent>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

export const openMenu = () => emitUI({ type: 'menu' });
export const openTrailer = (film?: TrailerId) => emitUI({ type: 'trailer', film });
export const showToast = (message: string) => emitUI({ type: 'toast', message });
