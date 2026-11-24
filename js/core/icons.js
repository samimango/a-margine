/* Icone a tratto (viewBox 24). Uso: icon('book') → elemento SVG; iconSvg('book') → stringa. */
export const ICONS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  book: '<path d="M3.5 5.5C6.5 4.5 9.5 4.8 12 6.5C14.5 4.8 17.5 4.5 20.5 5.5V19C17.5 18 14.5 18.3 12 20C9.5 18.3 6.5 18 3.5 19Z"/><path d="M12 6.5V20"/>',
  note: '<path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4M8 12h8M8 16h5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  flame: '<path d="M12 3c1.5 3.5 5.5 5.5 5.5 10a5.5 5.5 0 0 1-11 0c0-2 1-3.5 2-4.5.2 1.8 1 2.8 2 3C9.5 8.5 10.5 5.5 12 3z"/>',
  copy: '<rect x="8" y="8" width="11" height="12" rx="2"/><path d="M5 16V5a1 1 0 0 1 1-1h9"/>',
  pen: '<path d="M4 20l1-4L16.5 4.5l3 3L8 19z"/>',
  person: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20c.8-4 3.8-6 7.5-6s6.7 2 7.5 6"/>',
  bookmark: '<path d="M7 4h10v16l-5-4-5 4z"/>',
  grid: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
  text: '<path d="M3.5 18l5-12 5 12M5.3 14h6.4M14.5 18l3.5-8 3.5 8M15.8 15.5h4.4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 17.9 8.6 4.8 4.8 0 0 1 17 18z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14"/>',
  upload: '<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 19h14"/>',
  share: '<path d="M12 15V3.5M8 7l4-4 4 4M6 11H5v9h14v-9h-1"/>',
  trash: '<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  dots: '<circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.1"/>',
};
/* Le feature aggiungono le proprie icone (nome → contenuto SVG, viewBox 24) senza toccare ICONS direttamente */
export function registerIcons(obj) { return Object.assign(ICONS, obj); }
export function iconSvg(name, size = 22, sw = 1.8) {
  const body = ICONS[name] || '';
  return `<svg class="ic-svg" aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
export function icon(name, size = 22, sw = 1.8) {
  const t = document.createElement('template');
  t.innerHTML = iconSvg(name, size, sw);
  return t.content.firstChild;
}
export const fleuron = (w = 44) => `<svg class="fleuron" aria-hidden="true" viewBox="0 0 60 12" width="${w}" height="${w * 0.2}" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M2 6H22M38 6H58"/><path d="M30 1.5 L33.5 6 L30 10.5 L26.5 6Z" fill="currentColor" stroke="none"/><circle cx="24.5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="35.5" cy="6" r="1" fill="currentColor" stroke="none"/></svg>`;
