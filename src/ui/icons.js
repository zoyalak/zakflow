/** icons.js — inline stroke icons (no network, no icon font, works offline). */

const PATHS = {
  home: '<path d="M3.6 10.4 12 3.8l8.4 6.6"/><path d="M5.8 9.4v10.4h12.4V9.4"/><path d="M10 19.8v-5.2h4v5.2"/>',
  list: '<path d="M8.5 6.5h11.5M8.5 12h11.5M8.5 17.5h11.5"/><path d="M4 6.5h.01M4 12h.01M4 17.5h.01"/>',
  bars: '<path d="M5 20v-6.5M12 20V8.5M19 20v-4"/>',
  sliders:
    '<path d="M4 6.5h8M17 6.5h3M4 12h3M12 12h8M4 17.5h9M18 17.5h2"/><circle cx="14.5" cy="6.5" r="2.1"/><circle cx="9.5" cy="12" r="2.1"/><circle cx="15.5" cy="17.5" r="2.1"/>',
  plus: '<path d="M12 5.5v13M5.5 12h13"/>',
  reload: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4.5V10h-5.4"/>',
  lock:
    '<rect x="5" y="10.4" width="14" height="9.6" rx="2.6"/><path d="M8.6 10.4V8a3.4 3.4 0 0 1 6.8 0v2.4"/>',
  trash:
    '<path d="M4.6 7h14.8"/><path d="M9.6 7V5.3h4.8V7"/><path d="m6.5 7 .9 12.3h9.2L17.5 7"/><path d="M10.4 11v5M13.6 11v5"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevronRight: '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
  chevronLeft: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.8v2.1M12 19.1v2.1M4.5 4.5l1.5 1.5M18 18l1.5 1.5M2.8 12h2.1M19.1 12h2.1M4.5 19.5 6 18M18 6l1.5-1.5"/>',
  moon: '<path d="M20.4 14.6A8.6 8.6 0 0 1 9.4 3.6a8.6 8.6 0 1 0 11 11Z"/>',
  download: '<path d="M12 4.2v10.9"/><path d="m7.6 10.7 4.4 4.4 4.4-4.4"/><path d="M5 19.6h14"/>',
  upload: '<path d="M12 15.4V4.5"/><path d="m7.6 8.9 4.4-4.4 4.4 4.4"/><path d="M5 19.6h14"/>',
  alert: '<path d="M12 4.4 21 20H3z"/><path d="M12 10.2v4.4M12 17.6h.01"/>',
  undo: '<path d="M4.2 5.2v5h5"/><path d="M4.9 14.2a8 8 0 1 0 2-8.3L4.2 8.7"/>',
  calendar:
    '<rect x="3.6" y="5.4" width="16.8" height="15" rx="3"/><path d="M8.2 3.4v4M15.8 3.4v4M3.6 10.4h16.8"/>',
  flag: '<path d="M6 21V3.8"/><path d="M6 4.4h11.4l-2.1 4.1 2.1 4.1H6"/>',
  wallet:
    '<rect x="3.5" y="6.2" width="17" height="12.8" rx="3.2"/><path d="M3.5 10.4h17"/><circle cx="16.4" cy="14.8" r="1.05"/>',
  check: '<path d="m5 12.6 4.6 4.6L19 6.4"/>',
  edit: '<path d="M4 20h4.2L19.4 8.8a2.9 2.9 0 0 0-4.2-4.2L4 15.8V20Z"/><path d="m14.3 5.6 4.1 4.1"/>',
  arrowUp: '<path d="M12 19V5"/><path d="m6.4 10.6 5.6-5.6 5.6 5.6"/>',
};

export function icon(name, className = '') {
  return `<svg class="ico ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${
    PATHS[name] || ''
  }</svg>`;
}

/** The brand mark: three ascending bars on a rounded tile. */
export function brandMark(size = 30) {
  return `<span class="brand-mark" style="width:${size}px;height:${size}px" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="${Math.round(size * 0.62)}" height="${Math.round(size * 0.62)}" fill="none" stroke-linecap="round">
      <path d="M7 18v-5" stroke="#7FE8BB" stroke-width="2.6"/>
      <path d="M12 18V9.5" stroke="#BDF7DD" stroke-width="2.6"/>
      <path d="M17 18v-8.6" stroke="#FFFFFF" stroke-width="2.6"/>
    </svg>
  </span>`;
}
