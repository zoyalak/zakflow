/** toast.js — transient messages, including the undo toast after a delete. */

const MAX_TOASTS = 3;

export function toast(message, { actionLabel = '', onAction = null, duration = 5200 } = {}) {
  const host = document.getElementById('toasts');
  if (!host) return { dismiss() {} };

  const node = document.createElement('div');
  node.className = 'toast';
  node.innerHTML = `<span class="toast-msg">${message}</span>${
    actionLabel ? `<button type="button" class="toast-action">${actionLabel}</button>` : ''
  }`;
  host.appendChild(node);

  let timer = null;
  function dismiss() {
    if (timer) clearTimeout(timer);
    node.classList.add('is-out');
    setTimeout(() => node.remove(), 240);
  }
  function schedule(ms) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(dismiss, ms);
  }

  if (actionLabel) {
    node.querySelector('.toast-action').addEventListener('click', () => {
      if (onAction) onAction();
      dismiss();
    });
  }

  node.addEventListener('mouseenter', () => {
    if (timer) clearTimeout(timer);
  });
  node.addEventListener('mouseleave', () => schedule(2000));
  schedule(duration);

  while (host.children.length > MAX_TOASTS) host.firstElementChild.remove();

  return { dismiss };
}
