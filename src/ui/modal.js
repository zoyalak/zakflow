/** modal.js — the shared bottom-sheet / dialog layer. */

import { escapeHtml } from '../utils.js';
import { icon } from './icons.js';

let openCount = 0;

export function sheetHeading(title, subtitle = '') {
  return `<div class="sheet-head">
    <div>
      <h2 class="sheet-title" id="sheet-title">${escapeHtml(title)}</h2>
      ${subtitle ? `<p class="sheet-sub">${escapeHtml(subtitle)}</p>` : ''}
    </div>
  </div>`;
}

/**
 * Opens a sheet. `html` is the whole inner content (heading, body, actions) so
 * multi-step dialogs can swap it themselves through `modal.body`.
 */
export function openModal({ html, onMount, onClose }) {
  const layer = document.getElementById('layer');
  const wrap = document.createElement('div');
  wrap.className = 'modal-layer';
  wrap.innerHTML = `<div class="modal-backdrop" data-close></div>
    <div class="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1">
      <div class="sheet-handle" aria-hidden="true"></div>
      <button type="button" class="icon-btn sheet-close" data-close aria-label="Close">${icon('close')}</button>
      <div class="modal-content"></div>
    </div>`;

  layer.appendChild(wrap);
  const body = wrap.querySelector('.modal-content');
  body.innerHTML = html;

  document.body.classList.add('has-modal');
  openCount += 1;
  requestAnimationFrame(() => wrap.classList.add('is-open'));

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    wrap.classList.remove('is-open');
    document.removeEventListener('keydown', onKeyDown);
    openCount = Math.max(0, openCount - 1);
    if (openCount === 0) document.body.classList.remove('has-modal');
    setTimeout(() => wrap.remove(), 260);
    if (onClose) onClose();
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  }

  wrap.querySelectorAll('[data-close]').forEach((node) => node.addEventListener('click', close));
  document.addEventListener('keydown', onKeyDown);

  const modal = { root: wrap, body, close };
  if (onMount) onMount(modal);

  const focusTarget = wrap.querySelector('input:not([type="hidden"]), select, textarea, button.btn--primary');
  if (focusTarget) setTimeout(() => focusTarget.focus({ preventScroll: true }), 180);

  return modal;
}

/** A small yes/no dialog built on the same sheet. */
export function confirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm }) {
  const modal = openModal({
    html: `
      ${sheetHeading(title)}
      <div class="sheet-body"><p class="sheet-text">${message}</p></div>
      <div class="sheet-actions">
        <button type="button" class="btn btn--ghost" data-cancel>${escapeHtml(cancelLabel)}</button>
        <button type="button" class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-confirm>${escapeHtml(
          confirmLabel
        )}</button>
      </div>`,
    onMount({ body, close }) {
      body.querySelector('[data-cancel]').addEventListener('click', close);
      body.querySelector('[data-confirm]').addEventListener('click', () => {
        close();
        if (onConfirm) onConfirm();
      });
    },
  });
  return modal;
}
