/** numeric-input.js — amount fields accept digits and one decimal separator only. */

function sanitize(raw) {
  // A comma is treated as the decimal separator, everything else is dropped.
  let value = String(raw).replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const dot = value.indexOf('.');
  if (dot !== -1) {
    value = `${value.slice(0, dot + 1)}${value.slice(dot + 1).replace(/\./g, '')}`;
  }
  return value;
}

export function guardAmountInput(input) {
  if (!input) return;

  // Stop the character before it lands, so there is no flicker on desktop.
  input.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.length > 1) return; // Backspace, Tab, arrows, Enter...
    if (/[0-9.,]/.test(event.key)) {
      if ((event.key === '.' || event.key === ',') && input.value.includes('.')) {
        event.preventDefault();
      }
      return;
    }
    event.preventDefault();
  });

  // Covers paste, drag-drop, autofill and phone keyboards, and keeps the caret
  // where the person was typing.
  input.addEventListener('input', () => {
    const before = input.value;
    const caret = input.selectionStart ?? before.length;
    const keptBeforeCaret = before.slice(0, caret).replace(/[^0-9.]/g, '').length;
    const cleaned = sanitize(before);
    if (cleaned === before) return;
    input.value = cleaned;
    const next = Math.min(keptBeforeCaret, cleaned.length);
    input.setSelectionRange(next, next);
  });
}
